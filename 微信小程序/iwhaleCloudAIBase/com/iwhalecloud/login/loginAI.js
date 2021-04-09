// com/iwhalecloud/login/loginAI.js
//引入公共js文件
const common = require('../public/common.js')
const upload = require('../public/upload.js')
//获取应用实例
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    remind: '加载中',
    angle: 0,

    userInfo: {},
    hasUserInfo: false,
    hasAuthoried: false,

    username: wx.getStorageSync('STORAGE_userName') ? wx.getStorageSync('STORAGE_userName') : '',
    password: '',
    isAutoLogin: false, // 是否手动登陆
    
  },

  //点击登录  
  tapLogin: function(e) {

		// 收起键盘
		wx.hideKeyboard()
		//
		if (this.data.username.length == 0) {
			wx.showToast({
				title: '用户名不能为空！',
				icon: 'none'
			})
			return
		} else if (this.data.password.length == 0) {
			wx.showToast({
				title: '请输入密码！',
				icon: 'none'
			})
			return
		}
		//存储用户名
		wx.setStorageSync('STORAGE_userName', this.data.username)
		wx.setStorageSync('STORAGE_passWord', this.data.password)
		
		var that = this
		var params = {};
		var content = {};
		if (!this.data.isAutoLogin) {
			content.username = this.data.username
			content.password = this.data.password
			params.content = content;
		} else {
			// params.token = loginInfo.token;
			// params.userName = loginInfo.userName;
		}

		common.FUNCTION_POST_REQUEST(params, common.URL_AI_HTTP_LOGIN(), function (response) {
			
			var resultCode = parseInt(response.resultCode)
			if (resultCode == 1000) {

				var resultData = response.resultData

				//保存token
				app.userInfo.token = response.appToken
				app.userInfo.password = that.data.password
				app.userInfo.username = that.data.username
				app.webSocketsData.token = resultData.imToken
				// app.webSocketsData.aiObj = resultData.imStaffInfo

				
				app.currentJob = resultData.defaultJob
				app.staffInfo = resultData.staffInfo

				//进入首页
				wx.switchTab({
					url: '../news/news'
				})

				// 开始连接socket
				app.ConnectSocket()

			}
			else {
				wx.showToast({
					title: response.resultMsg,
				})
			}

		})

  },

  bindKeyInput: function(e) {
    if (e.currentTarget.id == 'username') {
      console.log("输入用户名：" + e.detail.value)
      this.setData({
        username: e.detail.value
      })
    } else {
      console.log("输入密码：" + e.detail.value)
      this.setData({
        password: e.detail.value
      })
    }

  },

  // 获取微信用户信息
  requestWXUserInfo: function () {
		var that = this
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    }
		else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
					console.log("获取用户信息成功")
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        },
				fail: res => {
					console.log("重新获取用户信息失败 进行重新获取")
					// that.requestWXUserInfo()
				}
      })
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {

    this.requestWXUserInfo()
    
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    var that = this;
    setTimeout(function() {
      that.setData({
        remind: ''
      });
    }, 1000);
    wx.onAccelerometerChange(function(res) {
      var angle = -(res.x * 30).toFixed(1);
      if (angle > 14) {
        angle = 14;
      } else if (angle < -14) {
        angle = -14;
      }
      if (that.data.angle !== angle) {
        that.setData({
          angle: angle
        });
      }
    });

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
   
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})