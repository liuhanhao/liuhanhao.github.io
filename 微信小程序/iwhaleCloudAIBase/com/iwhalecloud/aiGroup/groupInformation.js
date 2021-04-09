// com/iwhalecloud/aiGroup/groupInformation.js

//引入公共js文件
const common = require('../public/common.js')

Page({

	/**
	 * 页面的初始数据
	 */
	data: {

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

		if (options && options.group) {
			// 上个界面传过来的讨论组
			var group = JSON.parse(options.group)
			var groupMemberList = JSON.parse(options.groupMemberList)
			var groupMemberNum = options.groupMemberNum

			for (var index in groupMemberList) {
				var groupMember = groupMemberList[index]
				if (groupMember.avatar) {
					groupMember.avatarTmp = common.MOBILE_AVATAR_URL(groupMember.avatar)
				}
				else {
					groupMember.avatarTmp = '../images/ai/xzZCzhuanjia.png'
				}

				groupMember.name = groupMember.nickName ? groupMember.nickName : groupMember.username
				groupMember.statusText = groupMember.status == "online" ? "[在线]" : "[不在线]"

			}

			this.setData({
				group,
				groupMemberList,
				groupMemberNum

			})

			console.log("群聊信息", groupMemberList)
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


	// 跳转到聊天历史界面
	gotoChatRecordView: function () {

		var group = JSON.stringify(this.data.group)

		wx.navigateTo({
			url: '../aiGroup/groupChatRecord?group=' + group
		})

	},

	


})