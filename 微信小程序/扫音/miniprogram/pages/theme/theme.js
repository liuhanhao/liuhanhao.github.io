// pages/theme/theme.js

//获取应用实例
const app = getApp()
const db = app.cloudDB()

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		backgroundImage: '../../images/makeBackgroundImage.png',  //背景图片


	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {
		this.queryBackgroundImage()
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

	// 选择了图片
	selectImage: function (event) {
		var item = event.currentTarget.dataset.item
		var index = event.currentTarget.dataset.index
		this.setData({
			selectIndex: index,
			backgroundImage: item,
		})

		var pages = getCurrentPages();
		var prevPage = pages[pages.length - 2];  //上一个页面
		//直接调用上一个页面的 setData() 方法，把数据存到上一个页面中去
		prevPage.setData({
			backgroundImageUrl: item,
			backgroundImage: item,
			uploadSuccess: false,
		})

	},

	// 请求背景图片
	queryBackgroundImage() {
		var that = this

		wx.showLoading({
			title: '加载中...',
		})

		db.collection('Theme').get({
			success: function (res) {
				wx.hideLoading()

				// res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
				console.log("编辑页面背景图片", res.data)

				var imageUrls = []
				if (res.data && res.data.length > 0) {
					for (var i = 0; i < res.data.length; i++) {
						var item = res.data[i]

						imageUrls.push(item.imagePath)

					}
				}

				that.setData({
					imageUrls
				})

			},
			fail: function (error) {
				wx.hideLoading()
				wx.showModal({
					title: '提示',
					content: '请求背景列表失败,请稍后重试!',
					showCancel: false,
				})
			}
		})

	}


})