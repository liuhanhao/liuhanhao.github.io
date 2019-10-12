//获取应用实例
const utilTime = require("../../utils/util.js")

const app = getApp()

import BackgroundAudio from "../editor/background-audio";
import ZoomImage from "../editor/zoom-image";


Page({

  data: {
		backgroundImage: '../../images/makeBackgroundImage.png',  //背景图片

		showTo: 0,
		showFrom: 0,
		textArray: [],

		// 轮播图相关
		imgUrls: [],
		indicatorDots: true,
		autoplay: true,
		interval: 3000,
		duration: 1000,

		

  },

  onShareAppMessage: function () {
		if (this.data.preview == true) {
			wx.showModal({
				title: '提示',
				content: '预览不允许分享',
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
		else {						
			var jsonstr = JSON.stringify(this.data.fileAttributes)
			var path = '/pages/details/details?parameter=' + jsonstr + '&preview=false'
			console.log("点击了分享按钮=", path)
			var nickName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '你的好友'
			return {
				title: '千里飞马',
				desc: '点击查看 ' + nickName + ' 发给你的信件',
				path: path,
				// imageUrl: "/images/1.jpg",
				success: (res) => {
					console.log("转发成功", res);
					wx.showToast({
						title: '转发成功',
						icon: 'none'
					})
				},
				fail: (res) => {
					console.log("转发失败", res);
					wx.showToast({
						title: '转发失败',
						icon: 'none'
					})
				}
			}
		}
		
  },

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function () {
		if (this.data.musicItem) {
			// 播放背景音乐
			this.setData({
				isPlayingBackgroundAudio: true,
			})
			this.BackgroundAudio.playMusic()
		}
		
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function () {
		if (this.data.musicItem) {
			// 停止播放背景音乐
			this.setData({
				isPlayingBackgroundAudio: false,
			})
			this.BackgroundAudio.stopMusic()
		}

		if (this.innerAudioContext) {
			this.innerAudioContext.stop()
		}

	},
	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function () {
		if (this.data.musicItem) {
			// 停止播放背景音乐
			this.setData({
				isPlayingBackgroundAudio: false,
			})
			this.BackgroundAudio.stopMusic()
		}

		if (this.innerAudioContext) {
			this.innerAudioContext.stop()
		}
		
	},

	onLoad: function (options) {
		this.ZoomImage = new ZoomImage(this)

		// 屏幕的宽高 rpx单位是微信小程序中css的尺寸单位，rpx可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。如在 iPhone6 上，屏幕宽度为375px，共有750个物理像素，则750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素。
		var res = wx.getSystemInfoSync()
		this.windowHeight = res.windowHeight
		this.windowWidth = res.windowWidth
		this.windowWidth_rpx = 750
		this.windowHeight_rpx = (this.windowWidth_rpx / this.windowWidth) * this.windowHeight
		var movableHeight = this.windowHeight_rpx - 140
		this.setData({
			movableHeight: movableHeight
		})

    // 分享过来的参数
		if (options.parameter) {
			var parameter = options.parameter
			var fileAttributes = JSON.parse(parameter) //可用此方法来转换
			console.log("详情界面的参数", fileAttributes)

			// 是否是预览界面
			var preview = options.preview

			// 录音文件
			var audioInfo = null
			if (fileAttributes.voice) {
				var nickName = app.globalData.userInfo ? app.globalData.userInfo.nickName : '千里飞马'
				audioInfo = {
					poster: 'https://7363-scan-could-f2ceda-1258327789.tcb.qcloud.la/voiceIcon.png',
					name: '录制语音', // 音频名字
					author: nickName, // 作者
					src: fileAttributes.voice.fileCloudPath,
					state: 0,// 0正在加载中 1待播放状态 2待暂停状态 
					duration: "00:00",
					timeUpdated: 0, // 当前播放时长
				}
			
			}
			
			// 图片文件
			var imgUrls = []
			if (fileAttributes.photos) {
				for (var i = 0; i < fileAttributes.photos.length; i++) {
					var item = fileAttributes.photos[i]
					imgUrls.push(item.fileCloudPath)
				}
			}

			// 视频文件
			var video = null
			if (fileAttributes.video) {
				video = {fileCloudPath: fileAttributes.video.fileCloudPath}
			}

			var text = fileAttributes.text.sayText
			var j = 0
			var textArray = []
			var variable = ''
			for (var i = 0; i < text.length; i++) {
				var tt = text.charAt(i)

				if (i < text.length - 1) {
					if (j < 10) {
						variable = variable + tt
						j++
					}
					else {
						textArray.push({ text: variable, state : 0})
						variable = tt
						j = 0
					}
				}
				// 最后一次
				else {
					if (variable.length > 0) {
						textArray.push({ text: variable, state: 0 })
					}				
				}

			}

			var musicItem = fileAttributes.musicItem ? fileAttributes.musicItem : null
			var backgroundImage = fileAttributes.backgroundImage ? fileAttributes.backgroundImage : '../../images/makeBackgroundImage.png'

			// 设置对象
			this.setData({
				preview, // 是否是预览
				fileAttributes: fileAttributes,
				backgroundImage,
				imgUrls,
				video,
				audioInfo,
				musicItem,

				textArray, // 祝福语
				toName: fileAttributes.text.toName,
				fromName: fileAttributes.text.fromName,
				fromDate: fileAttributes.text.fromDate,
				address: fileAttributes.text.address,
			})
    }

		if (this.data.musicItem) {
			// 初始化背景音乐
			this.BackgroundAudio = new BackgroundAudio(this)
		}

		if (this.data.audioInfo) {
			// 创建音频控制器
			this.initializeAudio()
		}

		// 开启动画定时器
		this.animation()

  },

	// 开启动画
	animation() {
		// toView动画
		this.setData({
			showTo: 1
		})

		var that = this
		//话筒帧动画 
		var i = 0
		var j = 0
		var varObj = null
		this.timer = setInterval(function () {
			
			// 祝福语动画
			if (i == 0) {
				var textArray = that.data.textArray
				if (textArray.length > 0) {
					var textObj = textArray[j]
					textObj.state = 1 // 开始动画

					varObj && (varObj.state = 2) // 上一个结束动画

					varObj = textObj

					that.setData({
						showTo: 2,
						textArray
					})

					j++
					if (j == textArray.length) {
						i = 1
					}
				}
				else {
					i = 2
					// fromView动画
					that.setData({
						showTo: 2,
						showFrom: 1,
					})
				}

			}
			else if (i == 1) {
				i = 2
				// fromView动画
				that.setData({
					showFrom: 1
				})
			}
			// 摧毁定时器
			else {
				// fromView动画
				that.setData({
					showTo: 2,
					showFrom: 2,
				})
				that.timer && clearInterval(that.timer)
			}
			
		}, 2300);
	},

	// 点击了图片
	imageClickEvent: function (event) {
		var imgUrl = event.currentTarget.dataset.imgUrl
		this.setData({
			selectImageUrl: imgUrl
		})
	},
	// 大图片消失
	hiddeSelectImageUrl: function (event) {
		this.setData({
			selectImageUrl: null
		})
	},


	audioEvent: function () {
		var audioInfo = this.data.audioInfo
		if (audioInfo.state == 1) {
			this.innerAudioContext.play();
			audioInfo.state = 2
		}
		else if (audioInfo.state == 2) {
			this.innerAudioContext.pause();
			audioInfo.state = 1
		}

		this.setData({
			audioInfo
		})
	},


	// 初始化audio
	initializeAudio:function () {
		var that = this

		this.innerAudioContext = wx.createInnerAudioContext()
		this.innerAudioContext.src = that.data.audioInfo.src;
		this.innerAudioContext.startTime = 0;
		// 播放出错
		this.innerAudioContext.onError((error) => {
			console.log("播放出错")
		});
		this.innerAudioContext.onCanplay((error) => {
			console.log("加载完成可以播放了")
			var audioInfo = that.data.audioInfo
			audioInfo.state = 1
			that.setData({
				audioInfo
			})
		});
		// 播放结束
		this.innerAudioContext.onEnded(() => {
			console.log("播放结束")
			var audioInfo = that.data.audioInfo
			audioInfo.state = 1
			that.setData({
				audioInfo
			})
			setTimeout(() => {
				audioInfo.duration = "00:00"
				that.setData({
					audioInfo
				})
			}, 700)
			
		});
		// 开始播放
		this.innerAudioContext.onPlay(() => {
			console.log("开始播放")
			// if (durationsss == 0) {
			// 	setTimeout(() => {
			// 		var duration = Math.round(that.innerAudioContext.duration)
			// 		console.log("音频长度=", that.innerAudioContext.duration)//2.795102

			// 		if (duration != 0) {
			// 			durationsss = duration
						
			// 		}
			// 	}, 1500)
			// }
			
		});
		// 播放暂停
		this.innerAudioContext.onPause(() => {
			console.log("播放暂停")
		});
		// 播放进度
		this.innerAudioContext.onTimeUpdate((event) => {
			console.log("播放进度更新", that.innerAudioContext.currentTime)
			var duration = that.innerAudioContext.currentTime
			var durationString = utilTime.prefixInteger(Math.round(duration / 60)) + ':' + utilTime.prefixInteger(Math.round(duration % 60))

			var audioInfo = that.data.audioInfo
			audioInfo.duration = durationString
			that.setData({
				audioInfo: audioInfo
			})
		});

	},


})