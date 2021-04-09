//引入公共js文件
const common = require('../public/common.js')
//获取应用实例
const app = getApp()

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		avatarIcon: "../images/support/xzzhuangkuangdai.png", 
		isShowFujian: true, // 是否显示附件
		jiantouImage: '../images/support/support_top.png',
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		// 还没初始化上个界面传过来的参数
		if (options.parameter) {
			var parameter = JSON.parse(options.parameter)
			var personWorkState = options.personWorkState // 10I === "处理中" 10F === "已处理"

			console.log("上个界面带过来的参数", parameter);
			this.setData({
				personWorkState: personWorkState,
				parameter: parameter
			})
		}

		this.requestDataSource(true)

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

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function () {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function () {

	},

	// 拨打电话
	callPhone: function (event) {
		console.log("拨打电话" + event.target.dataset.phone) //事件传递参数
		var phone = parseInt(event.target.dataset.phone)

		if (!isNaN(phone)) {
			wx.makePhoneCall({
				phoneNumber: phone.toString(), //此号码并非真实电话号码，仅用于测试
				success: function () {
					console.log("拨打电话成功！")
				},
				fail: function () {
					console.log("拨打电话失败！")
				}
			})
		}
	},

	// 点击显示附件
	showFujian: function () {
		var isShowFujian = !this.data.isShowFujian
		var jiantouImage = isShowFujian == true ? '../images/support/support_top.png' : '../images/support/support_bottom.png'

		this.setData({
			isShowFujian,
			jiantouImage,
		})
	},

	// 点击图片的方法
	imageClickEvent: function (e) {
		wx.previewImage({
			current: e.currentTarget.dataset.url, // 当前显示图片的http链接
			urls: [e.currentTarget.dataset.url] // 需要预览的图片http链接列表
		})
	},

	// 点击跳转到那个讨论组
	selectGroup: function (event) {
		var item = event.currentTarget.dataset.item;
		var groupId = item.groupId

		var groupList = app.newsView.data.groupList

		var group = null
		for (var i = 0; i < groupList.length; i++) {
			var item = groupList[i]
			if (item.id == groupId) {
				group = item
				break
			}
		}

		// 找到了该组 跳转到聊天界面
		if (group) {

			// 清空未读消息 刷新界面
			group.unreadNum = 0;

			var displayGroupList = app.newsView.data.displayGroupList
			app.newsView.setData({
				selectChatItem: group,
				displayGroupList: displayGroupList
			})

			var parameter = JSON.stringify(group)
			wx.navigateTo({
				url: '../ai/aiChat?parameter=' + parameter
			})
		}
		else {
			wx.showToast({
				title: '未找到相应的讨论组',
				icon: 'none'
			})
			console.log("没找到对应的群组ID", groupId);
		}

	},

	// 请求网络数据
	requestDataSource: function (isAll) {
		var that = this

		var spOrderId = this.data.parameter.spOrderId;

		var postDict = {};
		var contentDict = {};
		var paramDict = {};
		paramDict["orderId"] = spOrderId;

		contentDict["method"] = "qrySpOrderDetail";
		contentDict["param"] = paramDict;

		postDict["method"] = "executeJson";
		postDict["content"] = contentDict;

		// 请求支撑单详情
		if (isAll) {
			common.FUNCTION_POST_REQUEST(postDict, common.MOBILE_POINT_URL(), function (response) {

				var resultcode = parseInt(response.resultCode)
				if (resultcode == 0) {
					var data = response.resultData

					that.setData({
						workOrderDetails: data

					})

				}
				else {
					wx.showToast({
						title: response.resultMsg,
						icon: 'none'
					})
				}

			});
			
    }

		// 请求支撑单图片
		if (isAll) {
			contentDict["method"] = "qrySpOrderDetailImg";
			postDict["content"] = contentDict;
			common.FUNCTION_POST_REQUEST(postDict, common.MOBILE_POINT_URL(), function (response) {

				var resultcode = parseInt(response.resultCode)
				if (resultcode == 0) {
					var data = response.resultData

					var imageArray = []
					for (var i = 0; i < data.length; i++) {
						var item = data[i]
						var filePath = common.MOBILE_AVATAR_URL(item.filePath)

						imageArray.push(filePath)
					}

					that.setData({
						imageArray: imageArray

					})

				}
				else {
					wx.showToast({
						title: response.resultMsg,
						icon: 'none'
					})
				}

			});
			
		}

		// 详情工单轨迹
		contentDict["method"] = "qrySpOrderOperTrack" ;
		postDict["content"] = contentDict;
		common.FUNCTION_POST_REQUEST(postDict, common.MOBILE_POINT_URL(), function (response) {

			var resultcode = parseInt(response.resultCode)
			if (resultcode == 0) {
				var resultData = response.resultData

				var year = null;
				var operTrackArray = [];
				for (var index in resultData) {
					var dict = resultData[index]
					
					var operTrackModel = {}
					operTrackModel.operTypeName = dict["operTypeName"];
					operTrackModel.contentStr = dict["contentStr"];

					var dateString = dict["createDate"];
					operTrackModel.year = dateString.substring(0, 4);
					operTrackModel.month_day = dateString.substring(5, 10);
					operTrackModel.time = dateString.split(" ").pop();

					if (year == null) {
						year = operTrackModel.year;
					}
					else if (year == operTrackModel.year) {
						operTrackModel.year = "";
					}

					/*
					先用finishType判断，1客服，2app 3打勾。然后客服里面判断operTypeId=225就是完成
					客服就是 那个机器头像
					app就是 黑点
					完成就是那个勾
					*/
					var finishType = dict["finishType"];
					var operTypeId = dict["operTypeId"];
					operTrackModel.type = finishType;
					if (finishType == 1 && operTypeId == 225) {
						operTrackModel.type = 3;
					}

					operTrackArray.push(operTrackModel)

				}

				if (operTrackArray.length > 0) {
					that.setData({
						operTrackArray: operTrackArray

					})
				}

			}
			else {
				wx.showToast({
					title: response.resultMsg,
					icon: 'none'
				})
			}

		});

	},



	// 我要反馈按钮事件 
	feekBackAction: function () {
		console.log("我要反馈");
		var order = this.data.parameter
		var that = this
		this.setData({
			isShowFeedback: true,
			order: order,
			// 反馈成功回调
			success: function () {
				that.hideFeedbackView()
				// 刷新列表
				that.requestDataSource(false)
			}
		});
	},
	// 反馈视图消失
	hideFeedbackView() {
		this.setData({
			isShowFeedback: false
		});
	},


})