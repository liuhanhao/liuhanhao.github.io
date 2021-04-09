// com/iwhalecloud/ai/aiChat.js
//引入公共js文件
const common = require('../public/common.js')
const upload = require('../public/upload.js')

let chatInput = require('../aiChat/modules/chat-input/chat-input');

import IMOperator from "./im-operator";
import UI from "./ui";
import MsgManager from "./msg-manager";

//获取应用实例
const app = getApp()
const pageSize = 10

Page({
  data: {
    chatStatue: '', 
    chatStatusContent: "", // 顶部的socket状态
		isAI: true,

    chatItems: [], //聊天数据，可为空 

		currentMessageID: 0, // 当前的历史ID
		group: {}, //讨论组信息 上个界面传过来的

		smartButtons:[],// 小蜜底部的智能按键
		// 小蜜顶部的热点问题
		requestHotQuestion: {
			hotQuestion:{}, /// 左边列表
			otherQuestion:{}// 右边滚动列表
		}, 
		questionCode: null, // 保存如果有点击问题 就存储questionCode
    session: {}, // 小蜜的session 对象
		loadingFinsh:false, // 小蜜是否加载完成

		showExpertsList: false, // 是否显示专家列表选择框
		expertsList: [], // 专家列表Model

  },
  // 页面加载
  onLoad: function (options) {
    //加载传过来的值
    var that = this;
    if (options.parameter){
      var parameter = options.parameter
      var group = JSON.parse(parameter);
			console.log("进入讨论组:",group)

			var scrollViewHeight = app.windowHeight_rpx - 120

      //赋值组对象
      that.setData({
        group: group,
				scrollViewHeight_def: scrollViewHeight,
				scrollViewHeight,
      })
    }

    this.imOperator = new IMOperator(this, this.data.group); // 初始化消息 发送和接受类
    this.UI = new UI(this); // 初始化UI操作类
    this.msgManager = new MsgManager(this); // 初始化消息操作类  连接UI和消息
		this.UI.setNavigationBarTitleWithGroup({ group: this.data.group, groupMemberNum : 			this.data.group.groupMemberNum}) // 设置导航顶部的title

    // 初始化UI
    this.initData()

		// 是小蜜的话 需要先获取sessionID
		if (this.imOperator.isAI()) {
			this.getSessionQueryData()
			this.changeExtraData()
		}
		else {
			// 这是讨论组 所以不能出现NewUserList 的item
			this.setData({
				isFirstNewUserList: true,
				isAI: false,
			})
			
			// 请求历史消息
			this.requestHistoryData();
		}
		
  },
  onShow: function (e) {
		
  },
	// 页面隐藏 但是没有释放。  跟释放是互斥的
	onHide: function () {
		
	},
  // 页面加载完成
  onReady: function () {
    // 初始化socket对象
    app.aiChatView = this //app保存该界面分发消息
  },
  onUnload: function () {
		// 停止播放语音
		this.msgManager.stopAllVoice()
    app.aiChatView = null //app保存该界面分发消息
		this.msgManager.clear() // 清理内存
		
  },
  
  /** 
   * 页面相关事件处理函数--监听用户下拉动作 
   */
	onPullDownRefresh: function () {
		console.log("下拉加载更多")
		this.requestHistoryData()
	},

  /** 
   * 页面上拉触底事件的处理函数 
   */
	onReachBottom: function () {
		console.log("上拉")
	},

	/**
	 * scrollview滚到了底部
	 */
	bindDownLoad: function () {
		console.log("scrollview滚到了底部")
	},
	/**
	 * scrollview在滚到
	 */
	scroll: function (event) {
		// this.setData({
		// 	scrollTopVal: event.detail.scrollTop
		// });
	},
	/**
	 * scrollview滚到了顶部
	 */
	refresh: function (event) {	
		console.log("refresh")
		// wx.startPullDownRefresh()
		// if () {
		//	 this.requestHistoryData()
		// }
	}, 

	// 修改底部的item 
	changeExtraData:function () {
		var extraArr = [{
			picName: 'ic_menu_shooting',
			description: '拍照'
		}, {
			picName: 'ic_menu_video',
			description: '小视频'
		}, {
			picName: 'ic_menu_file',
			description: '文件'
		}]

		// 如果不是小蜜
		if (!this.imOperator.isAI()) {
			extraArr.push({
				picName: 'ic_menu_end_talk',
				description: '结束服务'
			})
		}
		var inputObj = this.data.inputObj
		inputObj.extraObj.chatInputExtraArr = extraArr
		this.setData({
			inputObj: inputObj,
		})
	},
  // 初始化底部的输入控件
	initData: function () {

    let that = this;
    let systemInfo = wx.getSystemInfoSync();
    chatInput.init(this, {
      systemInfo: systemInfo,
      minVoiceTime: 1,
      maxVoiceTime: 60,
      startTimeDown: 56,
      format: 'mp3',//aac/mp3
      sendButtonBgColor: 'mediumseagreen',
      sendButtonTextColor: 'white',
      extraArr: [{
        picName: 'ic_menu_shooting',
        description: '拍照'
      }, {
        picName: 'ic_menu_video',
        description: '小视频'
      }, {
        picName: 'ic_menu_file',
        description: '文件'
      }, {
        picName: 'ic_menu_end_talk',
        description: '结束服务'
      }],
      
    });
    
    that.socketStateChange(app.SocketTask, app.socketOpen) // 初始化顶部断开连接
    that.textButton(); // 创建文本框事件
    that.extraButton(); // 创建菜单事件
    that.voiceButton(); // 创建录音按钮事件
  },
  // 发送文本方法
  textButton() {
    var that = this
    chatInput.setTextMessageListener(function (e) {
      let content = e.detail.value;
      console.log(content);

      if (content.length > 0) {
				var type = IMOperator.TextType
				that.sendTextMessage({ type, content })
      }

    });
  },
	// 语音按钮
  voiceButton() {
    var that = this
    chatInput.recordVoiceListener(function (res, duration) {
      let tempFilePath = res.tempFilePath;
      let vDuration = duration;
      console.log("发送录音",tempFilePath, vDuration);
      
			// 发送语音
			that.msgManager.sendMsg({
				type: IMOperator.VoiceType,
				content: tempFilePath,
				duration, vDuration,
				fileInfo: {},
			})

    });
    chatInput.setVoiceRecordStatusListener(function (status) {
      switch (status) {
        case chatInput.VRStatus.START://开始录音
					console.log("开始录音")
          break;
        case chatInput.VRStatus.SUCCESS://录音成功
					console.log("录音成功")
          break;
        case chatInput.VRStatus.CANCEL://取消录音
					console.log("取消录音")
          break;
        case chatInput.VRStatus.SHORT://录音时长太短
					console.log("录音时长太短")
          break;
        case chatInput.VRStatus.UNAUTH://未授权录音功能
					console.log("未授权录音功能")
          break;
        case chatInput.VRStatus.FAIL://录音失败(已经授权了)
					console.log("录音失败(已经授权了)")
          break;
      }
    })
  },
	// 扩展菜单按钮
  extraButton() {
    let that = this;
    chatInput.clickExtraListener(function (e) {
      console.log(e);
      let itemIndex = parseInt(e.currentTarget.dataset.index);
      // 拍照
      if (itemIndex === 0) {
        wx.chooseImage({
          count: 1,
          sizeType: ['original', 'compressed'],
          sourceType: ['album', 'camera'],
          success(res) {
            // tempFilePath可以作为img标签的src属性显示图片
            const tempFilePath = res.tempFilePaths[0]
            
            // 发送图片
            that.msgManager.sendMsg({
              type: IMOperator.ImageType,
              content: tempFilePath,
							fileInfo: {},
            })

          }
        })
      }
      // 视频
      else if (itemIndex === 1) {
        wx.chooseVideo({
          sourceType: ['album', 'camera'],
          maxDuration: 60,
          camera: 'back',
          success(res) {
          	console.log(res.tempFilePath)
						// 发送视频
						that.msgManager.sendMsg({
							type: IMOperator.VideoType,
							content: res.tempFilePath,
							fileInfo: {},
						})
          }
        })
      }
      // 文件
      else if (itemIndex === 2) {
        wx.chooseMessageFile({
          count: 1,
          type: 'file',
          success(res) {
            // tempFiles装置着文件的信息
						const fileObj = res.tempFiles[0]
						console.log("选择了文件",fileObj)
						var fileInfo = {}
						fileInfo.fileName = fileObj.name
						fileInfo.filePath = fileObj.path
						fileInfo.downloadState = 2
						// 发送文件
						that.msgManager.sendMsg({
							type: IMOperator.FileType,
							content: fileObj.path,
							fileInfo: fileInfo,
						})
          }
        })
      }
      // 结束任务
      else if (itemIndex === 3) {
				// 还没有申请过办结才可以点击
				if (that.data.evaluationed != true) {
					that.requestApplyDealComplete(that.data.group.id)
				}
				// 收起菜单
				that.resetInputStatus()
      }
      
    });
    chatInput.setExtraButtonClickListener(function (dismiss) {
      
			if (dismiss == false) {
				console.log('弹出Extra弹窗', dismiss);
				// 修改scrollview的高度
				var scrollViewHeight = that.data.scrollViewHeight_def - 234
				that.setData({
					scrollViewHeight,
				})
				 
				that.setData({
					scrollTopVal: that.data.chatItems.length * 999,
				})
			}
			else {
				console.log('收起Extra弹窗', dismiss);
				// 修改scrollview的高度
				var scrollViewHeight = that.data.scrollViewHeight_def
				that.setData({
					scrollViewHeight
				})
			}
			
    })
  },
  // 点击scroll-view事件
  resetInputStatus() {
    chatInput.closeExtraView();
  },
	// 点击了智能按键 直接发送给socket
	smartButtonAction(e) {
		var item = e.currentTarget.dataset.item
		if (item.buttonName.length > 0) {
			var type = IMOperator.TextType
			this.sendTextMessage({ type, content:item.buttonName})
		}
	},

	// 发送文本消息的方法
	sendTextMessage: function ({ type, content}) {
		if (type == IMOperator.TextType) {
			this.msgManager.sendMsg({
				type: IMOperator.TextType,
				content: content,
			})

			// // 如果是小蜜并且小蜜已经加载完成 需要重新请求智能按键 
			// if (this.imOperator.isAI() && this.data.loadingFinsh) {
			// 	this.loadSmartButtons(content)
			// }
		}
	},

  // 界面点击了重新发送
  resendMsgEvent: function (event) {
    // 取得这是第几个item
    var itemIndex = event.currentTarget.dataset.resendIndex;
    var resendItem = this.data.chatItems[itemIndex]

    this.msgManager.resend({ resendItem, itemIndex })

  },
  
  /************************************************************/
  // socket的代理方法  断开或者连接上socket
  socketStateChange: function (socketTask, socketOpen) {
    this.UI.updateChatStatus(!socketOpen)
  },

  // 接收到WebSocket 的数据
	receivedWebSocketData: function (socketTask, onMessage) {
    var that = this;

		var data = onMessage.data
		var obj = {}
		// 收到小蜜的消息 并且现在是小蜜的状态 既还没有转人工
		if ((data.fromID == app.webSocketsData.aiObj.id
			|| data.id == app.webSocketsData.aiObj.id) 
			&& this.data.group.id == app.webSocketsData.aiObj.id) {

			var questionsObj = data.questions
			var subQuestionsArray = questionsObj ? questionsObj.subQuestions : null
			// 有问题回答就显示子问题
			if (subQuestionsArray && subQuestionsArray.length > 0) {
				if (questionsObj.questionCode.startsWith("我猜你想问")) {
					// 更新questionCode
					this.setData({
						questionCode: questionsObj.questionCode
					})
				}
				
				// 补偿头像
				// if (questionsObj.iconName == null) {
					questionsObj.questionAvatar = that.msgManager.getMsgTypeManager({ type: IMOperator.HotSubQuestions }).getImageNameWithQuestionsName(questionsObj.questionName)
				// }
				// else {
				// 	questionsObj.questionAvatar = common.MOBILE_AVATAR_URL(questionsObj.iconName)
				// }
				this.msgManager.showMsg({
					msg: {
						type: IMOperator.HotSubQuestions,
						content: "热点子问题",
						requestObject: questionsObj,
					}
				})

			}

			// 小蜜的语音回答
		  if (data.audioUrl && data.audioUrl.length > 0) {
				obj.msgId = data.id
				obj.nickName = data.nickName ? data.nickName : this.data.group.nickName
				obj.username = data.username ? data.username : this.data.group.username
				obj.character = data.character
				obj.userId = data.fromid
				obj.avatar = data.avatar
				obj.isShowTime = true
				obj.content = data.audioUrl
				// 这段语音的翻译
				if (data.content && data.content.length > 0) {
					obj.translatedText = data.content
					obj.translatedFinsh = true
				}

				// 创建显示的item
				var chatItem = that.imOperator.messageObjectCreateChatItem(obj)
				// 处理完消息后刷新UI
				that.msgManager.showMsg({ msg: chatItem })
			}
			// 我发过去给小蜜的语音的翻译
			else if (onMessage.type == "asrResult") {

				if (data.content && data.content.length > 0 && data.id == this.data.group.id) {
					var chatItems = this.data.chatItems
					var sid = data.sid

					var refresh = false
					for (var i = 0; i < chatItems.length; i++) {
						var item = chatItems[i]
						if (item.sid == sid) {
							item.translatedText = data.content
							item.translatedFinsh = true

							refresh = true
							break
						}
					}
					// 刷新
					if (refresh) {
						this.setData({
							chatItems: chatItems
						})
					}

				}

			}
			// 文本的回答
			else {
				// 专人工三连
				// 弹出订单选择
				if (data.northAction == "chooseTable") {
					
				}
				// 弹出订单选择
				else if (data.northAction == "inputAccout" || data.northAction == "AccountUnbind") {

				}
				// 调用坐席选择或者专家选择             // 转人工意图
				else if (data.northAction == "TransProfessor") {
					// 加载专家选择
					if (this.data.questionCode) {
						this.loadExpertsList({ questionCode: this.data.questionCode})
					}
					// 加载坐席选择
					else {
						this.loadExpertsGroupList()
					}
				}

				// 有文本就显示文本
				if (data.content && data.content.length > 0) {
					obj.msgId = data.id
					obj.nickName = data.nickName ? data.nickName : this.data.group.nickName
					obj.username = data.username ? data.username : this.data.group.username
					obj.character = data.character
					obj.userId = data.fromid
					obj.avatar = data.avatar
					obj.isShowTime = true
					obj.content = data.content

					// 热点问题回答的评价
					obj.tag = data.tag
					obj.esId = data.esId

					// 创建显示的item
					var chatItem = that.imOperator.messageObjectCreateChatItem(obj)
					// 处理完消息后刷新UI
					that.msgManager.showMsg({ msg: chatItem })
				}

			}

		}
		// 这是系统消息
		else if (data.system == true) {
			if (onMessage.type == "chatMessage" && this.data.group.id) {
				// 转人工成功了
				if (this.imOperator.isAI() == false) {
					if (data.groupMemberNum) {
						this.UI.setNavigationBarTitleWithGroup({ group:this.data.group, groupMemberNum:data.groupMemberNum})
					}
					else {
						// 请求组成员数量
						this.getGroupMemberData()
					}
					
				}

				var newUserList = data.newUserList
				// 显示卡片
				if (!this.data.isFirstNewUserList && newUserList && newUserList.length > 0) {
					var newUser = newUserList[0]
					var character = newUser.character
					var nickName = newUser.nickName ? newUser.nickName : newUser.username
					this.msgManager.showMsg({
						msg: {
							type: IMOperator.Artificial,
							content: '【' + character + '】' + nickName,
						}
					})

					var customChatItem = that.imOperator.createCustomChatItem(data.content)
					this.UI.updateViewWhenReceive(customChatItem)
				}
				// 当消息来显示
				else {
					var messageContent
					if (newUserList && newUserList.length > 0) {
						if (newUserList.length > 1) {
							messageContent = data.content
						}
						else {
							var newUser = newUserList[0]
							var character = newUser.character

							messageContent = '【' + character + '】' + data.content
						}
					}
					else {
						messageContent = data.content
					}

					var customChatItem = that.imOperator.createCustomChatItem(messageContent)
					this.UI.updateViewWhenReceive(customChatItem)
				}
			}
			
		}
		// 正常群组的消息
		else {
			// 当前组的消息
			if (onMessage.type == "chatMessage" && data.id == this.data.group.id) {

				// socket返回了弹出评价指令
			  if (data.northAction == "Evaluate") {
					// 如果有评价那么先删除评价 再添加评价
					if (this.data.evaluationObject) {
						var chatItems = this.data.chatItems
						chatItems.splice(this.data.evaluationIndex, 1);
						// 刷新列表
						this.data({
							chatItems : chatItems
						})
					}
					var customChatItem = this.imOperator.createCustomChatItem(data.content)
					this.UI.updateViewWhenReceive(customChatItem)

					// 显示评价
					this.msgManager.showMsg({
						msg: {
							type: IMOperator.Evaluation,
							content: "评价",
						}
					})
				}
					//{"data":{"id":21016,"type":"group","content":"order[{\"orderAddress\":\"广西防城港防城区那良镇325省道板蒙村小博士幼儿园左边民房第17间\",\"orderId\":4246487,\"orderCode\":\"770-20181025-098478\",\"accNbr\":\"15177807236\",\"busiClassName\":\"开通单\",\"orderTitle\":\"装\",\"custName\":null,\"busiServiceName\":\"家庭宽带-100M-FTTH-新装-正装机\",\"orderClass\":\"10S\"}]","order":true},"type":"chatMessage"}
          // 过滤下这个单，因为有错误
				else if (!data.order) {
					obj.msgId = data.id
					obj.nickName = data.nickName
					obj.username = data.username
					obj.character = data.character
					obj.userId = data.fromid
					obj.avatar = data.avatar
					obj.isShowTime = true
					obj.content = data.content

					// 创建显示的item
					var chatItem = that.imOperator.messageObjectCreateChatItem(obj)
					// 处理完消息后刷新UI
					that.msgManager.showMsg({ msg: chatItem })
				}

			}
			// 更新组成员人数
			else if (onMessage.type == "updateMemberNum" && data.id == this.data.group.id) {
				this.UI.setNavigationBarTitleWithGroup({ group: this.data.group, groupMemberNum:data.groupMemberNum})
			}
			// 已读未读
			else if (onMessage.type == "unreadCounts") {

			}
			// 保存这条消息的时间 以及ID  在已读未读的时候需要用到
			else if (onMessage.type == "callbackMsg") {

			}
			

		}

  },
	
  //通过 WebSocket 连接发送数据，需要先 wx.connectSocket，并在 wx.onSocketOpen 回调之后才能发送。
  socketSendMessages: function ({ content, itemIndex, msgType, saveKey, success, fail }) {
    var that = this;
    app.socketSendMessages(content,
      // 发送成功
      function () {
        // msgType 0文本 1文件
        if (msgType == 0) {
          success()
        } else {
          // saveKey 文件的服务器地址 以便于缓存该文件
          success({saveKey: ""})
        }

				// 不是小蜜的才需要
				if (that.imOperator.isAI() == false) {
					// 保存这个这条消息，给new.js的"callbackMsg"消息去刷新列表的显示
					var sendQueueItem = app.newsView.data.sendQueueItem
					sendQueueItem.push({ id: content.data.to.id, sid: content.data.mine.sid, content: content.data.mine.content })
					app.newsView.setData({
						sendQueueItem: sendQueueItem
					})
				}

      },
      // 发送失败
      function () {
        fail()
      })
  },
  

  /**
   * 上传文件的方法
   * savedFilePath 文件的本地路径
   * duration 语音的时长
   * itemIndex chatitems中的第几个item
   * success
   * fail
   */
  simulateUploadFile: function ({ type, savedFilePath, duration, itemIndex, success, fail }) {
    var that = this
    
    upload.FUNCTION_POST_UPLOAD_REQUEST(savedFilePath,
    // 上传成功
    function (response) {
			
			var responseObj = JSON.parse(response)

			if (parseInt(responseObj.code) == 0) {
				var data = responseObj.data
        var src = data.src
        var cid = data.cid
        var socketContent = ""
        if (type == IMOperator.ImageType) {
          socketContent = "img[" + src + "]"
        }
        else if (type == IMOperator.VoiceType) {
          socketContent = "audio[" + src + "](length:" + duration + ")"
        }
        else if (type == IMOperator.VideoType) {
          socketContent = "video[" + src + "]"
        }
        else if (type == IMOperator.FileType) {
          socketContent = "file(" + src + ")[" + data.name + "]"
        }

        success && success(socketContent, cid, savedFilePath, src)

      }
      // 服务器返回了错误
      else {
        fail && fail()
      }

    },
    // 上传失败
    function () {
      fail && fail()
    })

  },

	// html[] 这种类型的回答 会带有评价标志
	sendHotSpotEvaluation: function ({ esId, flag }) {
		var that = this
		var params = {
			method: "executeJson",
			content: {
				param: { esId, flag, username: app.webSocketsData.mineObj.username },
				method: "knowledge@recordKnowledgeUseful"
			}
		};
		common.FUNCTION_POST_REQUEST(params, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				var resultData = response.resultData

				wx.showToast({
					title: '提交评价成功',
					icon: 'none',
				})

			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '提交评价失败',
					icon: 'none',
				})
			})
	},

	// 获取小蜜的Session
	getSessionQueryData: function () {
		var that = this
		var parame = {}
		parame.userId = app.webSocketsData.mineObj.id
		parame.userName = app.webSocketsData.mineObj.username
		parame.fromId = -1
		parame.size = 10

		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_QUERY_SESSION_DATA(),
			// 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data
					var session = data.session

					that.setData({
						session: session
					})

					// 加载小蜜问题大类
					that.loadingQuestionList()
				}
				else {
					wx.showToast({
						title: '获取小蜜会话失败',
						icon: 'none',
					})

					// 退回上个界面
					wx.navigateBack({
						delta: 1
					})

				}
			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '获取小蜜会话失败',
					icon: 'none',
				})
				// 退回上个界面
				wx.navigateBack({
					delta: 1
				})
			})

	},
	// 加载小蜜问题大类
	loadingQuestionList: function () {
		var that = this
		var parame = {}
		parame.userId = app.webSocketsData.mineObj.id
		parame.userName = app.webSocketsData.mineObj.username
		parame.areaId = app.currentJob.areaId
		parame.fromId = -1
		parame.size = 10

		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_QUERY_QUESTION_HOME_DATA(),
			// 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data

					var hotQuestion = []// 热点问题 左边的list
					var otherQuestion = [] // 右边的其他问题
					
					for (var i = 0; i < data.length; i++) {
						var item = data[i]

						if (item.questionAvatar == null) {
							item.questionAvatar = that.msgManager.getMsgTypeManager({ type: IMOperator.HotQuestions }).getImageNameWithQuestionsName(item.questionName)
						}
						else {
							item.questionAvatar = common.MOBILE_AVATAR_URL(item.questionAvatar)
						}

						if (item.questionCode == "HOT") {
							hotQuestion = item.subQuestions
						}
						else {
							otherQuestion.push(item)
						}
					}

					that.setData({
						requestHotQuestion: {
							hotQuestion,
							otherQuestion,
						}
					})

					// 请求历史数据
					that.requestHistoryData()
				}
				else {
					wx.showToast({
						title: '加载热点问题失败',
						icon: 'none',
					})
				}
			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '加载热点问题失败',
					icon: 'none',
				})
			})
	},

	// 请求历史数据
	requestHistoryData: function () {
		
		var that = this
		var parame = {}
		parame.direction = "down"
		parame.size = pageSize
		parame.spokenMan = app.webSocketsData.mineObj.id
		parame.objectId = this.data.group.id
		// 朋友 // 群聊
		parame.type = this.data.group.type
		parame.from = this.data.currentMessageID

		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_QUERY_IMMESSAGE_LIST(), 
		// 请求成功
		(response) => {
			wx.stopPullDownRefresh()

			if (parseInt(response.code) == 0) {
				var data = response.data

				if (data && data.length > 0) {

					var lastMessageID = 0
					var chatItemArray = []
					for (var i = 0; i < data.length; i++) {
						var obj = data[i]

						if (obj.content.indexOf("https://122.192.9.52:19129") != -1) {
							obj.content = obj.content.replace("https://122.192.9.52:19129", common.DEFAULT_URL_PREFIX())
						}

						// 创建显示的item
						var chatItem = that.imOperator.messageObjectCreateChatItem(obj)
						if (chatItem) {
							// 添加数组元素
							chatItemArray.push(chatItem)
						}

						// 记住第一个的ID
						if (i == 0) {
							lastMessageID = obj.id
						}

					}

					var chatItems = that.data.chatItems
					var newChatItems = chatItemArray.concat(chatItems)
					that.setData({
						currentMessageID: lastMessageID,
						chatItems: newChatItems,
					});

					// 并且是第一次获取历史数据
					if (that.data.loadingFinsh == false) {
						that.setData({
							loadingFinsh: true,
						})

						// 是小蜜的话 
						if (that.imOperator.isAI()) {

							that.msgManager.showMsg({
								msg: {
									type: IMOperator.HotQuestions,
									content: "热点问题",
									requestObject: that.data.requestHotQuestion,
								}
							})

							var customChatItem = that.imOperator.createCustomChatItem(that.data.session.sessionFlag == "history" ? "欢迎回来" : "Hi,想问什么尽管说")
							that.UI.updateViewWhenReceive(customChatItem)

							that.loadSmartButtons("")

						}
						// 添加一个评价
						else if (that.data.group.groupState == "10V") {
							// 显示评价
							this.msgManager.showMsg({
								msg: {
									type: IMOperator.Evaluation,
									content: "评价",
								}
							})
						}

					}

				}
				else {
					wx.showToast({
						title: '无更多数据',
						icon: 'none'
					})
				}

			}
			else {
				wx.showToast({
					title: '接口请求不成功,请稍候重试',
					icon: 'none'
				})
			}

		},
		// 请求失败了
		() => {
			wx.stopPullDownRefresh()
		},true)

	},

	// 加载更多子问题
	loadMoreSubQuestions: function ({ questions, index }) {
		var newQuestions = questions
		var oldSubQuestions = newQuestions.subQuestions
		var parentCode = questions.parentCode ? questions.parentCode : oldSubQuestions[0].parentCode

		var parame = {parentCode: parentCode,
									 size: 5,
									 from: oldSubQuestions.length + 1
									}

		var that = this
		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_QUERY_QUESTION_HOT_QUESTIONS(),
			// 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data

					var subQuestions = data.subQuestions
					if (subQuestions && subQuestions.length > 0) {
						var newSubQuestions = oldSubQuestions.concat(subQuestions)
						newQuestions.subQuestions = newSubQuestions

						var item = that.data.chatItems[index]
						item.questions = newQuestions

						// 刷新UI
						that.setData({
							chatItems: that.data.chatItems,
						})

					}
					else {
						wx.showToast({
							title: '没有更多了',
							icon: 'none',
						})
					}

				}
			},
			// 请求失败了
			() => {
				console.log(加载更多问题失败)
				// wx.showToast({
				// 	title: '加载智能按键失败',
				// 	icon: 'none',
				// })
			})
	},

	// 加载专家坐席
	loadExpertsGroupList: function () {
		var that = this
		var paramDict = { areaId: app.currentJob.areaId}
		var contentDict = { method: "qryGroupbyAreaId", param: paramDict}

		var parame = { content: contentDict, method: "executeJson"}
		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				var resultData = response.resultData

				that.msgManager.showMsg({
					msg: {
						type: IMOperator.ExpertsSeatSelect,
						content: "专家坐席",
						requestObject: resultData,
					}
				})

			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '加载专家坐席失败',
					icon: 'none',
				})
			})
	},

	// 加载专家列表
	loadExpertsList: function ({ questionCode, uosUserGroupId, allExpertsList = false}) {
		var that = this
		var paramDict = { staffId: app.staffInfo.staffId, orderId: "", orderClass: ""}
		var contentDict = {}

		// 加载全部
		if (!allExpertsList) {
			contentDict["method"] = "qryTopThreeExpert"
		}
		// 加载前三个
		else {
			paramDict["pageNo"] = "1"
			paramDict["pageSize"] = "5"
			contentDict["method"] = "qryAllExpertForPage"
		}

		if (questionCode) {
			paramDict["uosUserGroupId"] = ""
			paramDict["aiQuestionCode"] = questionCode
		}
		else {
			paramDict["uosUserGroupId"] = uosUserGroupId
			paramDict["aiQuestionCode"] = ""
		}

		contentDict["param"] = paramDict
		var parame = {
			content: contentDict,
			method: "executeJson"
		}

		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					var resultData = response.resultData

					// 如果不是加载全部  那么只有选择了坐席之后来弹出的
					if (!allExpertsList) {
						// 专家关闭了 直接发起订单
						if (resultData.constructor == Object) {
							that.sendNewOrderRequestWithExpertsID({})
						}
						else {
							var ExpertList = resultData
							// 转化星星的数量
							for (var i = 0; i < ExpertList.length; i++) {
								var item = ExpertList[i]
								if (item.starRate.constructor == String) {
									item.rateNum = parseInt(item.starRate)
								}
								else {
									item.rateNum = item.starRate
								}
							}

							this.msgManager.showMsg({
								msg: {
									type: IMOperator.ExpertsSelect,
									content: "专家选择",
									requestObject: ExpertList,
								}
							})

						}
						
					}
					else {
						var ExpertList = resultData.ExpertList
						// 转化星星的数量
						for (var i = 0; i < ExpertList.length; i++) {
							var item = ExpertList[i]
							if (typeof (item.starRate) == 'string') {
								item.rateNum = parseInt(item.starRate)
							}
							else {
								item.rateNum = item.starRate
							}
						}

						// 显示全部专家
						that.setData({
							showExpertsList: true, // 是否显示专家列表选择框
							expertsList: ExpertList, // 专家列表Model
						})
						
					}

				}
			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '加载专家列表失败',
					icon: 'none',
				})
			})
	},

	// 发送转人工订单
	sendNewOrderRequestWithExpertsID: function ({ expertsStaffId = ""}) {
		this.hideExpertsListView() // 隐藏专家列表view
		
		var that = this
		var postDict = {};
		postDict["method"] = "executeJson"
		
		var contentDict = {};
		contentDict["method"] = "prWorkOrderManagerService@createProOrder"

		var paramDict = {};
		paramDict["jobId"] = app.currentJob.jobId
		paramDict["dealAreaId"] = app.currentJob.areaId
		paramDict["docFileIds"] = []

		// var relativeDict = {};
		// relativeDict["type"] = "10S"// 开通单:"10S"; 故障单:"1SA"; 投诉单:"NET"; // 先随便填一个吧
		// relativeDict["id"] = "11" // orderID

		var relativeOrders = []
		paramDict["relativeOrders"] = relativeOrders
		paramDict["staffId"] = app.staffInfo.staffId
		paramDict["deviceId"] = app.getDeviceId()
		paramDict["aiSessionId"] = that.data.session.sessionId
		paramDict["expertId"] = expertsStaffId

		if (this.data.questionCode) {
			paramDict["uosUserGroupId"] = ""
			paramDict["aiQuestionCode"] = questionCode
		}
		else {
			paramDict["uosUserGroupId"] = this.data.uosUserGroupId
			paramDict["aiQuestionCode"] = ""
		}

		contentDict["param"] = paramDict
		postDict["content"] = contentDict

		common.FUNCTION_POST_REQUEST(postDict, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					var resultData = response.resultData

					// 在这里等待转人工成功的那条socket消息
					// that.conversionSuccessful(resultData.imData.groupId)
					console.log("http接口返回转人工成功", resultData)
				}
				else {
					wx.showToast({
						title: response.resultMsg,
						icon: 'none',
					})
				}
		},
		// 请求失败了
		() => {
			wx.showToast({
				title: '转人工失败',
				icon: 'none',
			})
		})
	},

	// 转人工成功了
	conversionSuccessful: function (group) {
		this.setData({ group: group, conversionSuccessful: true, smartButtons: [], isAI: false})
		this.imOperator._group = group
		this.UI.setNavigationBarTitleWithGroup({ group, groupMemberNum:group.groupMemberNum})
		this.changeExtraData()
		
	},

	// 申请办结完成
	requestApplyDealComplete: function (groupId) {
		var that = this
		var postDict = {}
		var content = {}
		var param = {}
		param["jobId"] = app.currentJob.jobId
		param["deviceId"] = app.getDeviceId
		param["staffId"] = app.staffInfo.staffId
		param["groupId"] = groupId
		param["workOrderId"] = ""

		content["param"] = param
		content["method"] = "prWorkOrderManagerService@orderBanjieShenqing"

		postDict["method"] = "executeJson"
		postDict["content"] = content

		common.FUNCTION_POST_REQUEST(postDict, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					var resultData = response.resultData
					console.log("申请办结成功")
				}
				else {
					wx.showToast({
						title: '申请办结失败',
						icon: 'none',
					})
				}
			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '申请办结失败',
					icon: 'none',
				})
			})
	},

	// 加载小蜜智能按键
	loadSmartButtons: function (questionName) {
		var that = this
		var parame = {questionName}

		common.FUNCTION_POST_REQUEST(parame, common.URL_AI_LOAD_SMARTBUTTONS(),
			// 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data
					
					var smartButtons = data

					that.setData({
						smartButtons: smartButtons,
					})

				}
			},
			// 请求失败了
			() => {
				console.log(加载智能按键失败)
				// wx.showToast({
				// 	title: '加载智能按键失败',
				// 	icon: 'none',
				// })
			})
	},

	// 请求讨论组成员数量
	getGroupMemberData: function (success,fail) {
		var that = this
		var url = common.URL_AI_HTTP_GROUPMEMBER() + this.data.group.id
		common.FUNCTION_GET_REQUEST({}, url, // 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var list = response.data.list

					if (list && list.length > 0) {
						that.UI.setNavigationBarTitleWithGroup({ group: that.data.group, groupMemberNum:list.length})
						app.newsView.updateMemberNum({ id: that.data.group.id, groupMemberNum: list.length})

					}

					success && success(list)

				}
				else {
					fail && fail()
				}
			}, 
			// 请求失败了
			() => {
				fail && fail()
				// wx.showToast({
				// 	title: '申请办结失败',
				// 	icon: 'none',
				// })
			})
	},

	// 请求语音翻译
	requestTranslatedText: function ({ src, itemIndex }) {
		var that = this
		// 请求回调
		var callback = function ({ translatedText = "转换失败",translatedFinsh}) {
			var chatItems = that.data.chatItems
			var item = chatItems[itemIndex]
			item.translatedText = translatedText
			item.translatedFinsh = translatedFinsh

			that.setData({
				chatItems: chatItems
			})
		}
		
		var url = common.URL_AI_QUERY_convertVoiceMsgToText() + '?' + 'voiceMsgUrl=' + src
		common.FUNCTION_GET_REQUEST({ voiceMsgUrl: src}, url, // 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data
					if (data && data.length > 0) {
						callback({ translatedFinsh: true, translatedText: data});
					}
					else {
						callback({ translatedFinsh: false });
					}
				}
				else {
					callback({translatedFinsh : false});
				}
			},
			// 请求失败了
			() => {
				callback({ translatedFinsh: false });
			})
	},

	// 跳转到讨论组信息视图
	gotoGroupInformationView: function (groupMemberData) {
		var that = this

		var success = function (data) {
			if (data && data.length > 0) {
				var group = JSON.stringify(that.data.group)
				var groupMemberList = JSON.stringify(data)
				var groupMemberNum = data.length

				wx.navigateTo({
					url: '../aiGroup/groupInformation?groupMemberList=' + groupMemberList + "&groupMemberNum=" + groupMemberNum + "&group=" + group
				})
			}
			else {
				wx.showToast({
					title: '群聊信息暂时无内容',
					icon: 'none',
				})
			}
		}

		var fail = function () {
			wx.showToast({
				title: '跳转群聊信息失败',
				icon: 'none',
			})
		}

		// 请求群聊信息		
		this.getGroupMemberData(success, fail)

	},

	// 隐藏专家列表 
	hideExpertsListView: function () {
		this.setData({
			showExpertsList: false, // 是否显示专家列表选择框
			expertsList: [], // 专家列表Model
		})
	},


})


