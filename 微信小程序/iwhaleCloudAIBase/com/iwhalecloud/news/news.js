//引入公共js文件
const common = require('../public/common.js')
const timeUtil = require('../utils/util.js')
const sockUtil = require('../public/sockUtil.js')

import UI from "../ai/ui";

//获取应用实例
const app = getApp()

Page({
  data: {
		chatStatue: '',
		chatStatusContent: "", // 顶部的socket状态

		groupList: [], // 全部的grouplist
    displayGroupList:[], // 显示的grouplist

		searchText: "", // 搜索框的内容

		xiaomiBean: {}, // 小蜜的group
		selectChatItem: {}, // 保存跳到aichat.js的item
		sendQueueItem: [],// 保存跳到aichat.js的item 发送消息的数组 在callbackMsg中移除

  },
  
  onReady: function () {
    
  },
  onUnload: function () {
    app.newsView = null //app保存该界面分发消息
  },
	// 界面显示
	onShow : function () {
		// 清空选择了那个group进去聊天
		this.setData({ selectChatItem : {} })
	},
	onLoad: function () {

		this.UI = new UI(this); // 初始化UI操作类

		// 注册socket的监听
		app.newsView = this
		this.socketStateChange(app.SocketTask, app.socketOpen)

		this.requestGroupListData() // 请求列表

	},

	/** 
   * 页面相关事件处理函数--监听用户下拉动作 
   */
	onPullDownRefresh: function () {
		console.log("下拉刷新数据")
		this.requestGroupListData()
	},

  /** 
   * 页面上拉触底事件的处理函数 
   */
	onReachBottom: function () {
		console.log("上拉")
	},

	/************************************************************/
	// socket的代理方法  断开或者连接上socket
	socketStateChange: function (socketTask, socketOpen) {
		this.UI.updateChatStatus(!socketOpen)
	},
  // 收到socket的消息
	receivedWebSocketData: function (socketTask, onMessage) {

		var data = onMessage.data
		var chatType = onMessage.type
		var group = sockUtil.FUNCTION_createGroupModel(data)
		// 服务端添加了一个讨论组
		if (chatType == "addIntoGroup") {
			group = group.group

			// 如果是专人工问题单的讨论组
			if (group.showMode == 0) {
				group.character = "发起人"
			}

			group.avatar = common.MOBILE_AVATAR_URL(group.avatar)
			group.avatarTmp = group.avatar
			group.type = "group"
			group.content = this.formatChatMsg(group.content)
			if (group.timestamp === 0) {
				group.lastTime = 0;
			}
			else {
				group.lastTime = this.formatTime(group.timestamp)
			}

			if (group.questionCode) {
				group.questionCode = "【" + group.questionCode + "】"
			}

			// 添加到数组中
			var groupList = this.data.groupList
			groupList.push(group)
			this.setData({ groupList: groupList })
			// 刷新显示到第一个
			this.searchEvent({ detail: { value: this.data.searchText } })

			// 刷新APP.js中保存的数组
			app.webSocketsData.groupList = groupList

			// 现在在小蜜界面
			// 更新小蜜里面的group
			if (app.aiChatView) {
				// 更新自己选择的保存组 用来收到消息不出现红色的圆圈
				this.setData({
					selectChatItem: group
				})
				app.aiChatView.conversionSuccessful(group)
			}

		}
		// 添加了一个单聊
		else if (chatType == "openFriend") {

		}
		// 这是小蜜的消息 不做任何处理的
		else if (data.fromID == app.AI_XIAOMI_Id) {

		}
		// 这是讨论组的消息
		else if (chatType == "chatMessage") {

			this.moveThisGroupToFirstIndex(group, data.northAction)

		}
		// 这个玩意 评价完移除讨论组跟在web端操作转办都会返回，有点恶心。因为web端转办后需要移除，而APP不需要,后台没处理 全部发出来了。。  只能这样恶心过滤一下了
		else if (chatType == "removedGroup") {
			// 如果包含
			if (data.notice.indexOf("讨论组关闭") !== -1) {
				var groupList = this.data.groupList
				for (var i = 0; i < groupList.length; i++) {
					var itemGroup = groupList[i]
					if (group.id == itemGroup.id) {

						// 删除这个item
						groupList.splice(i, 1)
						this.setData({ groupList: groupList })
						// 刷新APP.js中保存的数组
						app.webSocketsData.groupList = groupList
						// 刷新显示
						this.searchEvent({ detail: { value: this.data.searchText } })	

						break
					}
				}
			}
		}
		// 发起了讨论组评价返回的
		else if (chatType == "closeGroup") {
			var groupList = this.data.groupList
			for (var i = 0; i < groupList.length; i++) {
				var itemGroup = groupList[i]
				if (group.id == itemGroup.id) {
					itemGroup.groupState = "10V"

					var displayGroupList = this.data.displayGroupList
					this.setData({ displayGroupList: displayGroupList })

					break
				}
			}
	
		}
		// 弹出通知窗口 并且点击窗口后跳转到问题单列表
		else if (chatType == "workOrderNote") {
			// 消息体：message: {"data":{"content":{"tacheCode":"PS-BJQR","workOrderId":1419513,"message":"接收到系统异常-预约首响>缓装>待装等操作不成功的问题单P20180906000010","operType":"arrive","orderClass":"1PR"}},"type":"workOrderNote"}
			var content = data.content
			if (content.operType == "arrive" && content.orderClass == "1PR") {
				var message = content.message // 弹出内容
				var title = "收到推送消息" // 弹出的标题
				var workOrderId = content.workOrderId
				// var tacheCode = content.tacheCode // 暂时用不到的属性
				// 弹出通知框
				wx.showModal({
					title: title,
					content: message,
					showCancel: false
				})

			}
		}
		// 更新组成员人数
		else if (chatType == "updateMemberNum") {
			this.updateMemberNum(data)

		}
		// 把他移动到第一个去 刷新时间和最后的文本内容
		else if (chatType == "callbackMsg") {
			var sendQueueItem = this.data.sendQueueItem
			for (var i = 0; i < sendQueueItem.length; i++) {
				var item = sendQueueItem[i]
				if (item.id == group.id && group.sid == item.sid) {

					group.content = item.content
					this.moveThisGroupToFirstIndex(group,"")

					sendQueueItem.splice(i,1);
					// 刷新数组
					this.setData({
						sendQueueItem: sendQueueItem
					})
					break;
				}
			}
			
		}

  },

	// 更新这个讨论组的成员人数
	updateMemberNum(group) {
		var groupList = this.data.groupList
		for (var i = 0; i < groupList.length; i++) {
			var itemGroup = groupList[i]
			if (group.id == itemGroup.id) {
				itemGroup.groupMemberNum = group.groupMemberNum

				break;
			}
		}
	},

	// 把这个item从待评价 变为正常状态 因为提交了评价为 没解决 该组可以继续聊天
	changeGroupEvaluationStatus(group) {
		var groupList = this.data.groupList
		for (var i = 0; i < groupList.length; i++) {
			var itemGroup = groupList[i]
			if (group.id == itemGroup.id) {
				itemGroup.groupState = "10I"

				var displayGroupList = this.data.displayGroupList
				this.setData({ displayGroupList: displayGroupList })

				break;
			}
		}
	},

	// 把这个组移动到第一的位置
	moveThisGroupToFirstIndex(group, northAction) {
		var groupList = this.data.groupList
		for (var i = 0; i < groupList.length; i++) {
			var itemGroup = groupList[i]
			if (group.id == itemGroup.id) {

				// web申请办结 变为待评价状态
				if (northAction == "Evaluate") {
					itemGroup.groupState = "10V"

					var displayGroupList = this.data.displayGroupList
					this.setData({ displayGroupList: displayGroupList })

				}
				else {
					itemGroup.content = this.formatChatMsg(group.content);
					itemGroup.lastTime = this.formatTime(group.timestamp);
					// 如果是正在聊天的group
					if (this.data.selectChatItem.id == itemGroup.id) {
						itemGroup.unreadNum = 0
					}
					else {
						itemGroup.unreadNum = itemGroup.unreadNum > 0 ? (itemGroup.unreadNum + 1) : 1
					}

					// 移动到第一的位置去
					groupList.splice(i, 1)
					groupList = [itemGroup].concat(groupList)

					this.setData({ groupList: groupList })
					// 刷新APP.js中保存的数组
					app.webSocketsData.groupList = groupList

					// 刷新显示
					this.searchEvent({ detail: { value: this.data.searchText } })

				}

				break;
			}
		}
	},
	
	// 点击搜索回调
  searchEvent(event) {
    
		var searchText = event.detail.value
		console.log("搜索", searchText);

		var groupList = this.data.groupList
    if (event.detail.value === undefined || event.detail.value === null || event.detail.value === "") {

      this.setData({
				displayGroupList: groupList,
				searchText: searchText
      })
      
    }
    else {
			var itemTmp = []
			for (var i in groupList) {
				if (groupList[i].groupname && groupList[i].groupname.indexOf(searchText) !== -1) {
					itemTmp.push(tempGroupList[i]);
				}
			}

			this.setData({
				displayGroupList: itemTmp,
				searchText: searchText
			})
		}
  },
  // 侧滑删除按钮
  delItem(data){
    var list = this.data.displayGroupList;
    list.splice(data.detail.params, 1)
		this.setData({ displayGroupList:list});
    console.log('删除')
  },
  // 点击了item跳转到chat界面
  selectChatItem: function (event) {
    console.log("selectChatItem")
		var item = event.currentTarget.dataset.item
		// 点击的是小蜜
		if (item) {
			var parameter = JSON.stringify(item)
			wx.navigateTo({
				url: '../ai/aiChat?parameter=' + parameter
			})

		}
		// 普通的群组
		else {
			var displayGroupList = this.data.displayGroupList
			var item = displayGroupList[event.currentTarget.dataset.index];
			var parameter = JSON.stringify(item)

			// 清空未读消息 刷新界面
			item.unreadNum = 0;

			this.setData({
				selectChatItem: item,
				displayGroupList: displayGroupList
			})

			wx.navigateTo({
				url: '../ai/aiChat?parameter=' + parameter
			})
		}		
     
  },

	//查询列表数据
	requestGroupListData() {
		
		var params = {}
		var that = this;
		common.FUNCTION_GET_REQUEST(params, common.URL_AI_GET_GROUPLIST(), 
		// 请求成功了
		function (object) {
			wx.stopPullDownRefresh()

			if (object.code == 0) {
				//群聊的对象
				var groupListInfo = object.data
				app.webSocketsData.groupList = groupListInfo.group

				// 赋值我的信息
				app.webSocketsData.mineObj = groupListInfo.mine
				groupListInfo.mine.avatar = common.MOBILE_AVATAR_URL(groupListInfo.mine.avatar)

				// 朋友的数组
				var tempGroup = [];
				var xiaomiBean;
				for (const item of groupListInfo.friend) {
					var groupBean = {};
					groupBean.nickName = item.nickName;
					groupBean.avatar = common.MOBILE_AVATAR_URL(item.avatar);
					groupBean.username = item.username;
					groupBean.id = item.id;
					groupBean.type = "friend";
					groupBean.timestamp = item.timestamp;

					if (app.AI_XIAOMI_Id == item.id) {
						xiaomiBean = groupBean;
						app.webSocketsData.aiObj = xiaomiBean;
						that.setData({
							xiaomiBean: xiaomiBean
						})
					}
					else {
						tempGroup.push(groupBean);
					}

				}
				// 赋值朋友列表
				app.webSocketsData.friendList = tempGroup


				// 添加界面上需要的属性
				for (var i in groupListInfo.group) {
					groupListInfo.group[i].avatar = common.MOBILE_AVATAR_URL(groupListInfo.group[i].avatar)
					groupListInfo.group[i].avatarTmp = groupListInfo.group[i].avatar
					groupListInfo.group[i].type = "group";
					groupListInfo.group[i].content = that.formatChatMsg(groupListInfo.group[i].content);
					if (groupListInfo.group[i].timestamp === 0) {
						groupListInfo.group[i].lastTime = 0;
					}
					else {
						groupListInfo.group[i].lastTime = that.formatTime(groupListInfo.group[i].timestamp);
					}

					if (groupListInfo.group[i].questionCode) {
						groupListInfo.group[i].questionCode = "【" + groupListInfo.group[i].questionCode + "】";
					}

				}

				var tempGroupList = groupListInfo.group;
				// 暂时不需要添加朋友
				// tempGroupList = tempGroupList.concat(tempGroup)

				// 对数组进行排序
				var groupList = tempGroupList.sort(that.sequence);
				that.setData({
					groupList: groupList,
				});

				// 刷新显示
				that.searchEvent({ detail: { value: that.data.searchText } })
			}
		},
		// 请求失败了
		function(){
			wx.stopPullDownRefresh()
		});
	},

	// 对群组进行排序
	sequence: function (a, b) {
		try {
			return b.timestamp - a.timestamp
		} catch (e) {
			e.message;
			return 1;
		}
	},

  formatChatMsg (msg){
    if (msg === undefined || msg === null || msg === "") {
      return "";
    }
    if (msg.indexOf("audio[") !== -1) {
      return "[语音]";
    } else if (msg.indexOf("img[") !== -1) {
      return "[图片]";
    } else if (msg.indexOf("video[") !== -1) {
      return "[视频]";
    } else if (msg.indexOf("file(") !== -1) {
      return "[文件]";
    } else if (msg.indexOf("html[") !== -1) {
      return "[网页]";
    } else if (msg.indexOf("url[") !== -1) {
      return "[网页]";
    } else if (msg.indexOf("order[") !== -1) {
      return "[工单]";
    } else {
      return msg;
    }
  },
  formatTime: function (time) {
    var date = new Date()
		var timeDate = time ? new Date(time) : new Date()

    if (timeDate.getFullYear() == date.getFullYear()) {
      if (timeDate.toDateString() == date.toDateString()) {
        return timeUtil.formatTimeTwo(timeDate, 'h:m');
      } else {
        if (this.isYesterday(timeDate)) {
          return "昨天 " + timeUtil.formatTimeTwo(timeDate, 'h:m');
        } else {
          return timeUtil.formatTimeTwo(timeDate, 'M-D h:m');
        }
      }
    } else {
      return timeUtil.formatTimeTwo(timeDate, 'Y-M-D h:m');
    }
  },
  isYesterday: function (theDate){
    var date = (new Date());    //当前时间
    var today = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); //今天凌晨
    var yestday = new Date(today - 24 * 3600 * 1000).getTime();
    return theDate.getTime() < today && yestday <= theDate.getTime();
  },
 
	// 显示评价View
	showEvaluationView(event) {
		var group = this.data.displayGroupList[event.currentTarget.dataset.index]
		var that = this
		this.setData({
			isShowEvaluation: true,// 是否显示评价视图
			evaluationGroup: group,// 正在评价的是那个组
			success: function (isSolve) {
				that.hideEvaluationView()

				// 选择了未解决
				if (isSolve == false) {
					// 刷新列表中工单状态
					that.changeGroupEvaluationStatus(group)
				}
				
			}
		});
	},
	// 隐藏评价view
	hideEvaluationView() {
		this.setData({
			isShowEvaluation: false,
		});
	},

})