/**
 * 1.用到缓存的变量规则：需要加上前缀 STORAGE_***
 * 2.全局常量 配置在这里
 * 
 * 
 */

App({
  onLaunch: function() {

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        //需要后端提供一个 查询openId的接口，前端不允许
      }
    })

		// 打开调试
		wx.setEnableDebug({
			enableDebug: true
		});

		const res = wx.getSystemInfoSync()

		// 屏幕的宽高 rpx单位是微信小程序中css的尺寸单位，rpx可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。如在 iPhone6 上，屏幕宽度为375px，共有750个物理像素，则750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素。
		this.windowHeight = res.windowHeight
		this.windowWidth = res.windowWidth

		this.windowWidth_rpx = 750
		this.windowHeight_rpx = (this.windowWidth_rpx / this.windowWidth) * this.windowHeight

		// app.userInfo.platform = res.platform.toUpperCase()
		this.userInfo.platform = res.platform == 'devtools' ? 'ANDROID' : res.platform//测试 IOS
		this.userInfo.platform = this.userInfo.platform.toLocaleUpperCase() // 变大写
		
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
		console.log('当前运行环境:' + res.platform)
		
    // 如果cusid(设备识别码)不存在或者长度小于20,，则重新生成。
    var cusid = this.getDeviceId()
    if (cusid == null || cusid.length < 20) {
      this.setCusid();
    }
    // 赋值app.userInfo.deviceId
    this.userInfo.deviceId = cusid

  },
  // cusid生成函数 DEVICE_ID唯一标识
  setCusid: function () {
    // 大小写字母和数字
    var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    // 生成30位随机字符串
    var cusidLength = 30, cusid = '';
    for (var i = 0; i < cusidLength; i++) {
      var oneStr = str.charAt(Math.floor(Math.random() * str.length));
      cusid += oneStr;
    }
    wx.setStorageSync('STORAGE_deviceId', cusid)
    console.log("[Console log]:New cusid:" + cusid);
  },
  // 返回DEVICE_ID唯一标识
  getDeviceId: function () {
		var deviceID = wx.getStorageSync('STORAGE_deviceId') ? wx.getStorageSync('STORAGE_deviceId') : '';
		// console.log("获取deviceID", deviceID)
		return deviceID
  },

  //用户信息对象
  globalData: {
    userInfo: null
  },
  //websocket全局对象
  webSocketsData: {
		friendList: [],// key:为组id vuale为组model
    token: '',
		groupList: [],// key:为组id vuale为组model

    mineObj: {
      avatar: "",
      id: "", // 1000
      nickName: "", //"赵连新"
      orgId: "",
      status: "",
      timestamp: "",
      username: "", //'iom'
    },
    // 小蜜
    aiObj: {
      avatar: "", // files/avatar/web/iom/iom20190109105735.jpg
      id: "", // 1000
      nickName: "", //小蜜
      orgId: "",
      status: "",
      timestamp: "",
      username: "",
    },
  },
  // 用户名 密码 token
  userInfo: {
    username: "",
    password: "",
    platform: "",
    token: "",
    deviceId: "",
  },
  // 用户信息 登陆的时候会赋值在这里
  staffInfo: {

  },
  // 当前职位 登陆的时候会赋值在这里
  currentJob: {

  },

	//是否打开调试日志
	CONSOLE_DEBUG: true,

	//程序基础参数
	AI_XIAOMI_Id: '2006', //小蜜ID

	//网络参数
	HTTP: 'http',
	WSS: 'ws',
  IP: '118.212.168.252',//'10.45.47.49',//'172.21.71.46',//'gy.ztesoft.com',//"xe.sd.chinamobile.com",//"gz.iwhalecloud.com",//
  PORT: "9102",//'9100',//'8081',//'9200',//"9170",//"8940",// "6150",//
  SERVICE_TYPE: "/isa-service-app",//"/isa-ws-service-app",//

	//DES3 
	DES3_KEY: 'ztesoftbasemobile1234567',

  


  // 引用两个对象
  newsView: null, // 列表界面
  aiChatView: null, // 聊天界面

  /**
    * 作用：获取socket连接地址
    * 返回:wss的完整连接地址
  */
  URL_AI_SOCKET_LOGIN: function () {
    return this.WSS + "://" + this.IP + ":" + this.PORT + "/imchat/websocket";
  },

  // 以下为socket相关的东西
  socketOpen: false, // 是否连接了socket
  SocketTask: null, // socket对象 全局引用
  
  //连接websocket  
  ConnectSocket: function () {
    var that = this
    
    var socketMsgQueue = [];
    var params = '/' + this.userInfo.username + '/' + this.getDeviceId() + '/' + this.userInfo.platform + '?' + 'token=' + this.webSocketsData.token + '&areaId=' + this.currentJob.areaId;

    // 创建Socket
    that.SocketTask = wx.connectSocket({
      url: that.URL_AI_SOCKET_LOGIN() + params,
      success: function (res) {
        console.log('WebSocket连接创建', res)
      },
      fail: function (err) {
        wx.showToast({
          title: '网络异常！WebSocket连接失败',
        })
        console.log(err)

        // 3秒后进行重新连接
        var timer = setInterval(function () {
          clearInterval(timer)
          that.ConnectSocket()
        }, 5000)

      }
    })

    if (that.SocketTask) {
      that.SocketTask.onOpen(res => {
        that.socketOpen = true;
        that.socketStateChange(that.socketOpen)

        console.log('监听 WebSocket 连接打开事件。', res)

      })
      that.SocketTask.onClose(onClose => {
        console.log('监听 WebSocket 连接关闭事件。', onClose)
        that.socketOpen = false;
        that.socketStateChange(that.socketOpen)

        // 3秒后进行重新连接
        var timer = setInterval(function () {
          clearInterval(timer)
          that.ConnectSocket()
        }, 5000)

      })
      that.SocketTask.onError(onError => {
        console.log('监听 WebSocket 错误。错误信息', onError)
        that.socketOpen = false
        that.socketStateChange(that.socketOpen)
      })
      that.SocketTask.onMessage(onMessage => {
        var messages = JSON.parse(onMessage.data)
        console.log('监听WebSocket接受到服务器的消息事件。服务器返回的消息', messages)
        that.socketReceivedMessages(messages)
      })
    }
  },

  // socket连接状态发送改变
  socketStateChange: function (socketOpen) {

    if (this.newsView) {
      this.newsView.socketStateChange(this.SocketTask, socketOpen)
    }
    if (this.aiChatView) {
      this.aiChatView.socketStateChange(this.SocketTask, socketOpen)
    }
    
  },
  // socket 收到了消息 转发给需要接受的界面
  socketReceivedMessages: function (messages) {

    if (this.newsView) {
      this.newsView.receivedWebSocketData(this.SocketTask, messages)
    }
    if (this.aiChatView) {
      this.aiChatView.receivedWebSocketData(this.SocketTask, messages)
    }

  },

  /**
   * 所有的界面都应该调这个方法来发送
   * data 发送的数据 = obj
   * success 成功的回调函数
   * fail 失败的回调函数
   */
  socketSendMessages: function (data, success, fail) {
 
    if (this.socketOpen) {
      var jsonString = JSON.stringify(data)
      this.SocketTask.send({
        data: jsonString,
        success(res) {
          console.log("发送成功:" + jsonString)
          success()
        },
        fail(res) {
          console.log("发送失败:" + jsonString)
          fail()
        },
        complete() {
          // console.log("不管失败成功都会执行:" + jsonString)
        }
      })
    }
    else {
      console.log("websocket还没连接 发送失败:" + jsonString)
      fail()
    }
    
  },

})