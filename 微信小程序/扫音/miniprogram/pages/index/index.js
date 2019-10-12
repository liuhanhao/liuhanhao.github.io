//index.js
//获取应用实例
const app = getApp()
const db = app.cloudDB()

Page({
	data: {
		motto: '欢迎使用千里飞马',
		userInfo: {},
		hasUserInfo: false,
		canIUse: wx.canIUse('button.open-type.getUserInfo')
	},

	onLoad: function (options) {
		// if (app.globalData.userInfo) {
		// 	this.setData({
		// 		userInfo: app.globalData.userInfo,
		// 		hasUserInfo: true
		// 	})
		// } else
		 if (this.data.canIUse) {
			// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
			// 所以此处加入 callback 以防止这种情况
			app.userInfoReadyCallback = res => {
				console.log("index用户信息", res)
				this.setData({
					userInfo: res.userInfo,
					hasUserInfo: true
				})
			}
		} else {
			// 在没有 open-type=getUserInfo 版本的兼容处理
			wx.getUserInfo({
				success: res => {
					console.log("index用户信息", res)
					app.globalData.userInfo = res.userInfo
					this.setData({
						userInfo: res.userInfo,
						hasUserInfo: true
					})
				}
			})
		}

		// options 中的 scene 需要使用 decodeURIComponent 才能获取到生成二维码时传入的 scene
		if (options.scene) {
			var scene = decodeURIComponent(options.scene)
			var codeString = scene.qrcode // 3736
			// 直接进入查询
			if (codeString != null || codeString != undefined) {
				this.queryQrCode(codeString)
			}
		}
		else if (options.qrcode) {
			var codeString = options.qrcode // 3736
			// 直接进入查询
			if (codeString != null || codeString != undefined) {
				this.queryQrCode(codeString)
			}
		}

	},
	getUserInfo: function (e) {
		console.log(e)
		app.globalData.userInfo = e.detail.userInfo
		this.setData({
			userInfo: e.detail.userInfo,
			hasUserInfo: true
		})
	},

	//事件处理函数
	bindViewTap: function () {
		// //进入首页
		// wx.switchTab({
		// 	url: '../root/root'
		// })
		// return 

		var that = this
		wx.scanCode({
			onlyFromCamera: false, // 只允许从相机扫码
			success(res) {
				// 扫描到的结果
				let codeString = res.result;

				that.queryQrCode(codeString)

			}
		})

	},

	// 查询是否有该二维码
	queryQrCode: function (codeString) {
		wx.showLoading({
			title: '查询中...',
			mask: true,
		})

		console.log(codeString);
		// 查找有没有该二维码
		db.collection('qrcode').where({
			qrcode: codeString,
		}).get({
			success: function (res) {
				// res.data 是包含以上定义的两条记录的数组
				var results = res.data

				// 查找该二维码有没有被使用过了
				if (results.length > 0) {
					db.collection('FileAttributes').where({
						qrcode: codeString,
					}).get({
						success: function (response) {
							wx.hideLoading();

							var results = response.data
							console.log("查询到的数据:", results)
							// 拿到保存的属性
							if (results.length > 0) {
								console.log('该二维码已经上传过文件');

								var obj = results[0];
								// 存储到全局变量中
								app.qrCode.fileAttributes = obj.fileAttributes
								app.qrCode.fileAttributes_id = obj._id

							}

							//获取应用实例 保存二维码的值
							app.qrCode.code = codeString;

							if (app.qrCode.fileAttributes) {

								wx.showModal({
									title: '提示:检测到信件',
									content: '是否拆开信件?',
									showCancel: true,
									success(res) {
										if (res.confirm) {
											console.log('用户点击确定')
											var jsonstr = JSON.stringify(app.qrCode.fileAttributes)
											var path = '/pages/details/details?parameter=' + jsonstr + '&preview=false'
											// 跳转到详情查看界面
											wx.navigateTo({
												url: path
											})
										} else if (res.cancel) {
											console.log('用户点击取消')
											//进入首页
											wx.switchTab({
												url: '../root/root'
											})
										}
									}
								})

							}
							else {
								//进入首页
								wx.switchTab({
									url: '../root/root'
								})
							}	

						},
						fail: function (error) {
							wx.showModal({
								title: '提示',
								content: '验证失败请更换二维码',
								showCancel: false,
								success(res) {
									wx.hideLoading();
								}
							})
						}
					})
				}
				else {
					wx.showModal({
						title: '提示',
						content: '验证失败请更换二维码',
						showCancel: false,
						success(res) {
							wx.hideLoading();
						}
					})
				}

			},
			fail: function (error) {
				wx.showModal({
					title: '提示',
					content: '扫描失败',
					showCancel: false,
					success(res) {
						wx.hideLoading();
					}
				})
			}
		})
	}

})
