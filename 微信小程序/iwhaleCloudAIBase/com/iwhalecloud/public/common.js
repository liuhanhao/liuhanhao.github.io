//常用的函数封装在这里，比如获取网络连接地址等
//引入des js文件
let DES3 = require("des3Util.js");
let BASE64 = require("base64.js");
//DES3加密解密
function DES3_Decrypt(data, key) {
  var des3de = DES3.decrypt(key, BASE64.decoder(data));
  return des3de;
}

function DES3_Encrypt(data, key) {
  var des3en = BASE64.encoder(DES3.encrypt(key, data));
  return des3en;
}



//获取应用实例
const app = getApp()
/**
 * 请求基础前缀
 * http + ip + port
 */
function DEFAULT_URL_PREFIX() {
	return app.HTTP + "://" + app.IP + ":" + app.PORT
}
/**
 * 请求基础前缀
 * http + ip + port + isa-ws-service-app
 */
function DEFAULT_ADDRESS_PREFIX () {
	return this.DEFAULT_URL_PREFIX() + app.SERVICE_TYPE
}
/**
 * 请求基础前缀
 * http + ip + port + imchat
 */
function DEFAULT_CHAT_URL_PREFIX() {
	return this.DEFAULT_URL_PREFIX() + "/imchat"
}

/**
 * 作用：获取socket连接地址
 * 返回:wss的完整连接地址
 */
function URL_AI_HTTP_PICTURE() {
  return this.DEFAULT_URL_PREFIX() + "/chatweb/";
}

/**
 * 作用：获取登录地址
 * 返回:http的完整地址
 */
function URL_AI_HTTP_LOGIN() {
  return this.DEFAULT_ADDRESS_PREFIX() + "/client/staff/login";
}

/**
 * 作用：获取消息列表地址
 * 返回:http的完整地址
 */
function URL_AI_GET_GROUPLIST() {
  return this.DEFAULT_CHAT_URL_PREFIX() + "/imuser/show";
}

/**
 * 作用：获取上传接口地址
 * 返回:http的完整地址
 */
function URL_UPLOAD_FILE() {
  return this.DEFAULT_CHAT_URL_PREFIX() + "/upload/file";
}

/**
 * 作用：获取个人会话列表
 * 返回:http的完整地址
 */
function MOBILE_POINT_URL() {
  return this.DEFAULT_ADDRESS_PREFIX() + "/app/unified";
}
/**
 * 作用：根据orderID 换 groupID
 * 返回:http的完整地址
 */
function URL_AI_QUERY_GROUP_INFO () {
  return this.DEFAULT_CHAT_URL_PREFIX() + "/imgroup/queryGroupByGroupId"
}

/**
 * 作用：请求IM历史数据
 * 返回:http的完整地址
 */
function URL_AI_QUERY_IMMESSAGE_LIST() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/immessage/list"
}
/**
 * 作用：请求小蜜的sessionID
 * 返回:http的完整地址
 */
function URL_AI_QUERY_SESSION_DATA() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/imsession/obtainTopicSession"
}
/**
 * 作用：请求小蜜的大类问题
 * 返回:http的完整地址
 */
function URL_AI_QUERY_QUESTION_HOME_DATA() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/question/getHomeData"
}
/**
 * 作用：获取小蜜智能按钮地址
 * 返回:http的完整地址
 */
function URL_AI_LOAD_SMARTBUTTONS() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/button/getQuestionButton";
}
/**
 * 作用：请求小蜜的大类问题 加载更多
 * 返回:http的完整地址
 */
function URL_AI_QUERY_QUESTION_HOT_QUESTIONS() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/question/getHotQuestions"
}

/**
 * 作用：获取专家列表
 * 返回:http的完整地址
 */
function URL_AI_HTTP_EXPERTS_LIST() {
	return this.DEFAULT_ADDRESS_PREFIX() + "/app/unified";
}

/**
 * 作用：获取讨论组成员列表
 * 返回:http的完整地址
 */
function URL_AI_HTTP_GROUPMEMBER() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/imuser/list?id=";
}

/**
 * 作用：请求语音转换成文本
 * 返回:http的完整地址
 */
function URL_AI_QUERY_convertVoiceMsgToText() {
	return this.DEFAULT_CHAT_URL_PREFIX() + "/immessage/convertVoiceMsgToText"
}

/**
 * 作用:判断头像是否是完成的地址
 * 返回:http的完整地址
 */
function MOBILE_AVATAR_URL(avatar) {
	if (avatar) {
		if (avatar.startsWith("http")) {
			if (avatar.startsWith("https://10.45.47.49:9100")) {
				return avatar.replace("https://10.45.47.49:9100", this.DEFAULT_URL_PREFIX())
			}
			return avatar
		}
		else {
			if (avatar.startsWith('/') != -1) {
				return this.URL_AI_HTTP_PICTURE() + avatar;
			}
			// 不是/开头 需要添加
			else {
				return this.URL_AI_HTTP_PICTURE() + '/' + avatar
			}
		}
	}
  else {
		return ""
	}
}

/**
 * POST请求方法(适用于一般的post请求，如其他自己自行定义)
 * params:json map参数
 * url：请求地址
 * success返回成功的处理
 * fail返回失败的处理
 * isDisplay 是否延时取消load框
 */
function FUNCTION_POST_REQUEST(params, url, success, fail, isDisplay) {
	console.log('POST请求地址:', url)
	console.log('POST请求参数:',params)

  wx.showLoading({
    title: '加载中',
    mask: true,
  })

  wx.request({
    url: url,
    data: params,
    method: 'POST',
    header: {
      'content-type': 'application/json', // 默认值
      'userName': app.userInfo.username,
      'platform': app.userInfo.platform,
			'token': app.webSocketsData.token,//app.userInfo.token,
      'deviceId': app.getDeviceId()
    },
    success(res) {
      
			var fun = function () {
				//判断是否需要解密
				if (res.data.REP) {

					// var retObj = DES3_Decrypt(res.data.REP, app.DES3_KEY)
					var retObj = DES3.decrypt(app.DES3_KEY, res.data.REP)
					if (success && retObj) {
						console.log('需要解密的POST请求返回:', retObj)
						success(retObj);
					}
					else if (success && res.data.REP) {
						console.log('POST请求返回:', res.data.REP)
						success(res.data.REP);
					}
				} 
				else if (res.data) {
					console.log('POST请求返回:', res.data)
					if (success) {
						success(res.data);
					}
				}
				wx.hideLoading()
			}

			// 是否需要延时
			if (isDisplay) {
				setTimeout(function () {
					fun()
				}, 3)
			}
			else {
				fun()
			}

    },
    fail(error) {

			var fun = function() {
				wx.hideLoading()
				wx.showToast({
						title: '接口请求不成功,请稍候重试',
						icon: 'none'
					})

				fail && fail()
			}
			// 是否需要延时
			if (isDisplay) {
				setTimeout(function () {
					fun()
				}, 3)
			}
      else {
				fun()
			}

    }
  })
}

/**
 * GET请求方法(适用于一般的get请求，如其他自己自行定义)
 * params:json map参数
 * url：请求地址
 * success返回成功的处理 
 */
function FUNCTION_GET_REQUEST(params, url, success, fail) {
	console.log('GET请求地址:', url)
	console.log('GET请求参数:', params)

  wx.showLoading({
    title: '加载中',
    mask: true,
  })

  wx.request({
    url: url,
    data: params,
    method: 'GET',
    header: {
			'content-type': 'application/json', // 默认值
			'userName': app.userInfo.username,
			'platform': app.userInfo.platform,
			'token': app.webSocketsData.token,//app.userInfo.token,
			'deviceId': app.getDeviceId()
    },
    success(res) {
      wx.hideLoading()

			console.log('GET请求返回:', res.data)

      if (res.data) {
				if (success) {
					success(res.data);
        }
      }

    },
    fail(error) {
      wx.hideLoading()
      wx.showToast({
        title: '接口请求不成功,请稍候重试',
        icon: 'none'
      })

			fail && fail()
    }
  })
}

// 对查询关键字中的特殊字符进行编码
function encodeSearchKey(key) {
  const encodeArr = [{
    code: '%',
    encode: '%25'
  }, {
    code: '?',
    encode: '%3F'
  }, {
    code: '#',
    encode: '%23'
  }, {
    code: '&',
    encode: '%26'
  }, {
    code: '=',
    encode: '%3D'
  }];
  return key.replace(/[%?#&=]/g, ($, index, str) => {
    for (const k of encodeArr) {
      if (k.code === $) {
        return k.encode;
      }
    }
  });
}

module.exports.DEFAULT_URL_PREFIX = DEFAULT_URL_PREFIX
module.exports.DEFAULT_CHAT_URL_PREFIX = DEFAULT_CHAT_URL_PREFIX
module.exports.DEFAULT_ADDRESS_PREFIX = DEFAULT_ADDRESS_PREFIX

//给其他地方调用，需要暴露接口
//URL
module.exports.URL_AI_HTTP_LOGIN = URL_AI_HTTP_LOGIN
module.exports.URL_UPLOAD_FILE = URL_UPLOAD_FILE
module.exports.URL_AI_GET_GROUPLIST = URL_AI_GET_GROUPLIST
module.exports.URL_AI_HTTP_PICTURE = URL_AI_HTTP_PICTURE
module.exports.MOBILE_POINT_URL = MOBILE_POINT_URL
module.exports.URL_AI_QUERY_GROUP_INFO = URL_AI_QUERY_GROUP_INFO
module.exports.MOBILE_AVATAR_URL = MOBILE_AVATAR_URL
module.exports.URL_AI_QUERY_IMMESSAGE_LIST = URL_AI_QUERY_IMMESSAGE_LIST
module.exports.URL_AI_QUERY_SESSION_DATA = URL_AI_QUERY_SESSION_DATA
module.exports.URL_AI_QUERY_QUESTION_HOME_DATA = URL_AI_QUERY_QUESTION_HOME_DATA
module.exports.URL_AI_LOAD_SMARTBUTTONS = URL_AI_LOAD_SMARTBUTTONS
module.exports.URL_AI_QUERY_QUESTION_HOT_QUESTIONS = URL_AI_QUERY_QUESTION_HOT_QUESTIONS
module.exports.URL_AI_HTTP_EXPERTS_LIST = URL_AI_HTTP_EXPERTS_LIST
module.exports.URL_AI_HTTP_GROUPMEMBER = URL_AI_HTTP_GROUPMEMBER
module.exports.URL_AI_QUERY_convertVoiceMsgToText = URL_AI_QUERY_convertVoiceMsgToText

//公用请求
module.exports.FUNCTION_POST_REQUEST = FUNCTION_POST_REQUEST
module.exports.FUNCTION_GET_REQUEST = FUNCTION_GET_REQUEST
