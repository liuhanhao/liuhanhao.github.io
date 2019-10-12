// pages/mine/mine.js
const utilTime = require("../../utils/util.js")

const app = getApp()

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		currentTime: "",
		userInfo: {},
		qrcodeURL: "",
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

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
		var nowDate = new Date()
		var currentTime = utilTime.formatDateTime(nowDate)

		this.setData({
			currentTime,
			userInfo: app.globalData.userInfo
		})

		this.requestWXqrCode()

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

	requestWXqrCode: function () {
		var that = this

		// 调用云函数
		wx.cloud.callFunction({
			name: 'openapi',
			data: {"action" : "getWXACode",
						"qrCode": app.qrCode.code
			},
			success: res => {
				console.log('[云函数] [openapi] getWXACode: ', res.result)
				
				that.setData({
					qrcodeURL: res.result.fileID

				})

			},
			fail: err => {
				console.error('[云函数] [openapi] getWXACode 调用失败', err)
			}
		})
	},


})