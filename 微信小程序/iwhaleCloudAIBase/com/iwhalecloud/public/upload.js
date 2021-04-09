/**
 * 上传文件
 */
//引入公共js文件
const common = require('../public/common.js')
//获取应用实例
const app = getApp()  

/**
 * 上传文件HTTP接口(支持多个文件上传)
 * tempFilePaths：选定文件的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
 * uploadBack:上传成功回传数组[localPath本地路径 serverPath服务器的保存相对路径]
 * */ 
function FUNCTION_POST_UPLOAD_REQUEST_FILES(tempFilePaths,uploadBack) {

  //启动上传等待中...  
  wx.showLoading({
    title: '正在上传...',
    mask: true,
  })

  var uploadImgCount = 0;
  var uploadRet=[]
  for (var i = 0, h = tempFilePaths.length; i < h; i++) {
    wx.uploadFile({
      url: common.URL_UPLOAD_FILE(),
      filePath: tempFilePaths[i],
      // 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容
      name: 'file',
      // HTTP 请求中其他额外的 form data
      formData: {
        'imgIndex': i
      },
      header: {
        "Content-Type": "multipart/form-data",
        'userName': app.userInfo.username,
        'platform': app.userInfo.platform,
        'token': app.userInfo.token,
        'deviceId': app.getDeviceId()
      },
      success: function (res) {
        uploadImgCount++;
        var data = JSON.parse(res.data);     
        if(data&&data.code=='0'){
          var obj={}        
          obj.localPath = tempFilePaths;
          obj.serverPath = data.data.src;
          uploadRet[i]=obj;
        }
        //如果是最后一张,则隐藏等待中  
        if (uploadImgCount == tempFilePaths.length) {
					wx.hideLoading()
          wx.showToast({
            title: '上传成功！',
            icon: 'none'
          })
          if (uploadBack){
            uploadBack(uploadRet)
          }
        }
      },
      fail: function (res) {
				wx.hideLoading()
        wx.showModal({
          title: '错误提示',
          content: '上传图片失败',
          showCancel: false,
          success: function (res) { }
        })
      }
    });
  }

}  

/**
 * 单文件上传
 * tempFilePath 文件本地地址
 * 
 */
function FUNCTION_POST_UPLOAD_REQUEST(tempFilePath, success, fail) {

  wx.uploadFile({
    url: common.URL_UPLOAD_FILE(),
    filePath: tempFilePath,
    // 文件对应的 key，开发者在服务端可以通过这个 key 获取文件的二进制内容
    name: 'file',
    // HTTP 请求中其他额外的 form data
    formData: {
      
    },
    header: {
      "Content-Type": "multipart/form-data",
      'userName': app.userInfo.username,
      'platform': app.userInfo.platform,
      'token': app.userInfo.token,
      'deviceId': app.getDeviceId()
    },
    success: function (res) {
			console.log("上传文件成功",res)
      success && success(res.data)
      
    },
    fail: function (res) {
			console.log("上传文件失败", res)
      fail && fail()
    }
  });

}

/**
 * 单文件下载
 * remoteFileUrl 文件远程地址
 * 
 */
function FUNCTION_POST_DOWNLOAD_REQUEST(remoteFileUrl, success, fail) {

	wx.downloadFile({
		url: remoteFileUrl,
		header: {
			"Content-Type": "multipart/form-data",
			'userName': app.userInfo.username,
			'platform': app.userInfo.platform,
			'token': app.userInfo.token,
			'deviceId': app.getDeviceId()
		},
		success: function (res) {
			console.log("下载文件成功", res)
			var filePath = res.tempFilePath;
			success && success(filePath)
		},
		fail: function (res) {
			fail && fail('文件下载失败')
			console.log("文件下载失败",res)
		},

	})


}

//给其他地方调用，需要暴露接口
module.exports.FUNCTION_POST_UPLOAD_REQUEST_FILES = FUNCTION_POST_UPLOAD_REQUEST_FILES
module.exports.FUNCTION_POST_UPLOAD_REQUEST = FUNCTION_POST_UPLOAD_REQUEST
module.exports.FUNCTION_POST_DOWNLOAD_REQUEST = FUNCTION_POST_DOWNLOAD_REQUEST