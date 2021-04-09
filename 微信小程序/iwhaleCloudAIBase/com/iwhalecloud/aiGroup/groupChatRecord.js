//引入公共js文件
const common = require('../public/common.js')

const timeUtil = require('../utils/util.js')

import IMOperator from "../ai/im-operator";
import UI from "../ai/ui";
import MsgManager from "../ai/msg-manager";

//获取应用实例
const app = getApp()
const pageSize = 10


Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		// pickerview的时间限制
		start: "", // "YYYY-MM-DD"
		end : "",

		currentMessageID: 0, // 当前的历史ID
		startTime: "",
		endTime: "",
		// startTimeStamp: "",
		// endTimeStamp: "",
		searchValue: "",

		chatItems: [],

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		if (options && options.group) {
			// 上个界面传过来的讨论组
			var group = JSON.parse(options.group)

			this.setData({
				group,

			})

			console.log("聊天记录", group)
			
			// 最开始为一周的时间差
			var now = new Date()
			var startTimeStamp = now.getTime() - (7 * 24 * 60 * 60 * 1000)

			var endTime = timeUtil.formatTime(now)
			var startTime = timeUtil.formatTime(new Date(startTimeStamp))
				
			// 修改socketview的高度
			var scrollViewHeight = app.windowHeight_rpx - 190
			this.setData({
				endTime,
				startTime,
				scrollViewHeight: scrollViewHeight,
			});

			this.imOperator = new IMOperator(this, this.data.group); // 初始化消息 发送和接受类
			this.UI = new UI(this); // 初始化UI操作类
			this.msgManager = new MsgManager(this); // 初始化消息操作类  连接UI和消息

			// 请求历史消息
			this.requestHistoryData(true);
		}
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function () {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {

	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {

	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function () {
		this.requestHistoryData(false)
	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

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
		//	this.requestHistoryData(false)
		// }
	},

	// 选择开始时间
	startDateChange: function (e) {
		console.log('结束时间picker发送选择改变，携带值为', e.detail.value)
		var endTimestamp = new Date(this.data.endTime)
		var startTimestamp = new Date(e.detail.value)

		if (startTimestamp >= endTimestamp) {
			wx.showToast({
				title: '开始时间不能大于或者等于结束时间',
				icon: "none"
			})
		}
		else {
			this.setData({
				startTime: timeUtil.formatTime(new Date(startTimestamp))
			})
		}
	},
	// 选择结束时间
	endDateChange: function (e) {
		console.log('结束时间picker发送选择改变，携带值为', e.detail.value)
		var startTimestamp = new Date(this.data.startTime)
		var endTimestamp = new Date(e.detail.value)

		if (endTimestamp > startTimestamp) {
			this.setData({
				endTime: timeUtil.formatTime(new Date(endTimestamp))
			})
		}
		else {
			wx.showToast({
				title: '结束时间不能小于或者等于开始时间',
				icon: "none"
			})
		}
		
	},

	/** 
   * 点击搜索 
   */
	searchEvent: function (e) {

		console.log(e.detail.value);
		this.setData({
			searchValue: e.detail.value,
		})

		this.requestHistoryData(true); // 刷新数据

	},

	// 请求历史数据
	requestHistoryData: function (isRefresh) {

		var that = this
		var parame = {}
		parame.direction = "down"
		parame.size = pageSize
		parame.spokenMan = app.webSocketsData.mineObj.id
		parame.objectId = this.data.group.id
		// 朋友 // 群聊
		parame.type = this.data.group.type
		parame.from = isRefresh == true ? 0 : this.data.currentMessageID
		parame.keyWord = this.data.searchValue // 搜索框文本
		parame.startTime = this.data.startTime + " 00:00:00"// 开始时间
		parame.endTime = this.data.endTime + " 00:00:00"// 结束时间

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

						var newChatItems = []
						if (isRefresh) {
							newChatItems = chatItemArray
						}
						else {
							var chatItems = that.data.chatItems
							newChatItems = chatItemArray.concat(chatItems)
						}
						
						that.setData({
							currentMessageID: lastMessageID,
							chatItems: newChatItems,
						});

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
			}, true)

	},
	
	// 请求语音翻译
	requestTranslatedText: function ({ src, itemIndex }) {
		var that = this
		// 请求回调
		var callback = function ({ translatedText = "转换失败", translatedFinsh }) {
			var chatItems = that.data.chatItems
			var item = chatItems[itemIndex]
			item.translatedText = translatedText
			item.translatedFinsh = translatedFinsh

			that.setData({
				chatItems: chatItems
			})
		}

		var url = common.URL_AI_QUERY_convertVoiceMsgToText() + '?' + 'voiceMsgUrl=' + src
		common.FUNCTION_GET_REQUEST({ voiceMsgUrl: src }, url, // 请求成功
			(response) => {
				if (parseInt(response.code) == 0) {
					var data = response.data
					if (data && data.length > 0) {
						callback({ translatedFinsh: true, translatedText: data });
					}
					else {
						callback({ translatedFinsh: false });
					}
				}
				else {
					callback({ translatedFinsh: false });
				}
			},
			// 请求失败了
			() => {
				callback({ translatedFinsh: false });
			})
	},

})