//app.js
var cloudDB

App({
  onLaunch: function () {
    
		// 打开调试
		wx.setEnableDebug({
			enableDebug: false
		});

		wx.cloud.init({
			env: 'scan-could-f2ceda',
			traceUser: true
		})

		cloudDB = wx.cloud.database({
			env: 'scan-could-f2ceda'
		})

		//调用方法获取机型 
		var res = wx.getSystemInfoSync()
		if (res.platform == 'ios') {
			this.ios = true
			this.android = false
		}
		else if (res.platform == 'android') {
			this.ios = false
			this.android = true
		}
		// 模拟器
		else {
			this.ios = false
			this.android = true
		}


		// 初始化用户信息
		this.initUserInfo() 
		


  },

	// 用户的微信信息
	globalData: {
		userInfo: null, // 用户的微信信息
		userId: null, // 保存这openID什么的
	},

	// 服务器fileAttributes 的key值
	fileType: {
		photo: 'photo',
		video: 'video',
		voice: 'voice',
		text: 'text',
		music: 'music',
		backgroundImage: 'backgroundImage',
	},

	// 二维码的值
	qrCode: {
		code: '111111', // 扫描到的二维码值
		fileAttributes: null, // 云端是否已经上传过文件了
		fileAttributes_id: null, // 云端是否已经上传过文件了
	},

	// 数据库操作对象
	cloudDB: function () {
		return cloudDB
	},

	data: {
		canIUse: wx.canIUse('button.open-type.getUserInfo')
	},

	// 初始化用户信息
	initUserInfo: function () {
		// 获取用户信息
		wx.getSetting({
			success: res => {
				if (res.authSetting['scope.userInfo']) {
					// 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
					wx.getUserInfo({
						success: res => {
							// 可以将 res 发送给后台解码出 unionId
							this.globalData.userInfo = res.userInfo

							// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
							// 所以此处加入 callback 以防止这种情况
							if (this.userInfoReadyCallback) {
								this.userInfoReadyCallback(res)
							}
						}
					})
				}
			}
		})

		if (this.data.canIUse) {
			// 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
			// 所以此处加入 callback 以防止这种情况
			this.userInfoReadyCallback = res => {
				this.globalData.userInfo = res.userInfo
				console.log("用户信息", res)
			}
		} else {
			// 在没有 open-type=getUserInfo 版本的兼容处理
			wx.getUserInfo({
				success: res => {
					this.globalData.userInfo = res.userInfo
					console.log("用户信息", res)
				}
			})
		}

		// 调用云函数
		wx.cloud.callFunction({
			name: 'login',
			data: {},
			success: res => {
				console.log('[云函数] [login] user openid: ', res.result)
				this.globalData.userId = res.result
				
			},
			fail: err => {
				console.error('[云函数] [login] 调用失败', err)
			}
		})

	},

})
