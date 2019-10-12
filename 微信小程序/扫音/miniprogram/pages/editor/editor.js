// pages/editor/editor.js
//获取应用实例
const app = getApp()
const db = app.cloudDB()

const unicode = require("../../utils/unicode.js")

import BackgroundAudio from "./background-audio";
import CouldUploadFile from "./could-upload-file";
import Recorder from "./recorder";
import WXLocation from "./wx-location";
import ZoomImage from "./zoom-image";

Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		tipsText: "已输入0个字符",
		ios: true,

		photos:[],
		uploadSuccess: false,
		
		backgroundImageUrl: '../../images/makeBackgroundImage.png',  //背景图片

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function (options) {

		this.BackgroundAudio = new BackgroundAudio(this)
		this.CouldUploadFile = new CouldUploadFile(this)
		this.WXLocation = new WXLocation(this)
		this.ZoomImage = new ZoomImage(this)
		this.Recorder = new Recorder({page: this})
		
		this.setData({
			ios: app.ios,
		})

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
		// 请求背景音乐列表
		this.BackgroundAudio.queryBackgroundMusicList()


	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {
		this.BackgroundAudio.stopMusic()
	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {
		this.BackgroundAudio.stopMusic()
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

	// 祝福语输入框事件
	sayTextInput: function (event) {
		var text = event.detail.value
		var tips = "已输入" + text.length + "个字符"
		this.setData({
			tipsText: tips,
			sayText: text,
			uploadSuccess: false,
		})
	},
	// to输入框事件
	toBindinput: function (event) {
		this.setData({
			toName: event.detail.value,
			uploadSuccess: false,
		})
	},
	// form输入框事件
	formBindinput: function (event) {
		this.setData({
			fromName: event.detail.value,
			uploadSuccess: false,
		})
	},
	// form日期输入框事件
	formDateBindinput: function (event) {
		this.setData({
			fromDate: event.detail.value,
			uploadSuccess: false,
		})
	},

	// 检验是否可以预览或者 保存
	check: function () {
		var check = true
		var tips = ''
		if (!(this.data.fromDate && this.data.fromDate.length > 0)) {
			check = false
			tips = "请填写日期"
		} 
		else if (!(this.data.address && this.data.address.length > 0)) {
			check = false
			tips = "请填写当前位置"
		}
		else if (!(this.data.sayText && this.data.sayText.length > 0)) {
			check = false
			tips = "向对方说点什么吧！！！嘻嘻"
		}
		else if (!(this.data.toName && this.data.toName.length > 0)) {
			check = false
			tips = "请填写发件人"
		}
		else if (!(this.data.fromName && this.data.fromName.length > 0)) {
			check = false
			tips = "请填写收件人"
		}
		else if (this.data.voiceState == 2) {
			check = false
			tips = "正在录音中..."
		}

		if (check == false) {
			wx.showToast({
				title: tips,
				icon: 'none'
			})
		}

		return check
	},

	// 预览
	previewAction: function () {
		var that = this

		// 校验下
		if (this.check()) {
			// 跳到详情界面
			let nextFun = function () {
				var fileAttributes = that.CouldUploadFile.getDetailsFileAttributes({ isCloud: false })

				// 停止播放背景音乐
				that.BackgroundAudio.stopMusic()
				// 停止录音播放
				that.stopRecord()

				var jsonstr = JSON.stringify(fileAttributes)
				var path = '/pages/details/details?parameter=' + jsonstr + '&preview=true'
				// 跳转到详情查看界面
				wx.navigateTo({
					url: path
				})
			}

			// 如果有语音  需要先上传了才能预览
			if (this.data.voice) {
				this.CouldUploadFile.startUploadOneFile({fileItem:this.data.voice,
					success: function () {
						nextFun() // 跳到详情页面
					},
					fail: function () {
						wx.showModal({
							title: '预览失败',
							content: '请稍后重试!',
							showCancel: false,
							success(res) {
								if (res.confirm) {
									console.log('用户点击确定')
								} else if (res.cancel) {
									console.log('用户点击取消')
								}
							}
						})
					}
				})
			}
			else {
				nextFun() // 跳到详情页面
			}

		}
	},
	// 保存
	saveAction: function () {
		var that = this

		// 校验下
		if (this.check()) {

			if (this.data.uploadSuccess) {
				wx.showToast({
					title: '您已经保存过了',
					image: '../../images/editor/APP-useful.png'
				})
			}
			// 开始上传
			else {
				var filesArray = []
				this.data.video && filesArray.push(this.data.video)
				this.data.voice && filesArray.push(this.data.voice)

				for (var i = 0; i < this.data.photos.length; i++) {
					var photo = this.data.photos[i]
					filesArray.push(photo)
				}

				this.CouldUploadFile.startUploadFile({
					filesArray,
					/**
					 * 上传成功
					 * fileAttributes 云端对象
					 * _id 云端对象的ID
					 */
					success: function (fileAttributes, _id) {
						// 存储到全局变量中
						app.qrCode.fileAttributes = fileAttributes
						app.qrCode.fileAttributes_id = _id

						// 上传成功了
						that.setData({
							uploadSuccess: true
						})

						wx.showModal({
							title: '上传成功',
							content: "立即查看效果?",
							success(res) {
								if (res.confirm) {
									// 停止播放背景音乐
									that.BackgroundAudio.stopMusic()
									// 停止录音播放
									that.stopRecord()

									var jsonstr = JSON.stringify(fileAttributes)
									var path = '/pages/details/details?parameter=' + jsonstr + '&preview=false'
									// 跳转到详情查看界面
									wx.navigateTo({
										url: path
									})
								}
								else if (res.cancel) {
									// 点击了取消
								}
							}
						})
					},
					// 上传失败
					fail: function () {
						wx.showModal({
							title: '保存失败',
							content: '请稍后重试!',
							showCancel: false,
							success(res) {
								if (res.confirm) {
									console.log('用户点击确定')
								} else if (res.cancel) {
									console.log('用户点击取消')
								}
							}
						})
					},
				})
			}

		}

	},


})