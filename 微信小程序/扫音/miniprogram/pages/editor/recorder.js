const mp3Recorder = wx.getRecorderManager();
const innerAudioContext = wx.createInnerAudioContext();
const app = getApp()

export default class Recorder {
  constructor(options) {

		this.options = options;
		this.initPage(this.options);
    
    mp3Recorder.onStart(() => {
      console.info('recorder.js录音开始');
    });
    mp3Recorder.onStop((res) => {
      console.info('recorder.js录音结束');
			this.tempMP3FilePath = res.tempFilePath;
			this.options.recordFinsh(this.tempMP3FilePath);

    });

    innerAudioContext.onError((res) => {
      // 播放音频失败的回调
    });
		innerAudioContext.onStop((res) => {
			console.info('recorder.js停止播放');
			this.options.onStop();
		});
    innerAudioContext.onPlay((res) => {
      console.info('recorder.js播放中');
      this.options.onPlay();
    });
    innerAudioContext.onEnded((res) => {
      console.info('recorder.js播放完');
			this.options.onEnded();
    });
  }

	// 开始录音
  startRecord() {
		mp3Recorder.start({
			duration: 61000,
			sampleRate: 16000,
			numberOfChannels: 1,
			encodeBitRate: 48000,
			format: 'mp3',
		});
  }
	// 停止录音
  stopRecord() {
    mp3Recorder.stop();
  }
	// 播放录音
  playVoice() {
		innerAudioContext.src = this.getRecorderLocalFilePath();
    innerAudioContext.obeyMuteSwitch = false; // 静音状态仍然播放
    innerAudioContext.play();
  }
	// 停止播放
  stopVoice() {
    innerAudioContext.stop();
  }

  // 当前音频的长度（单位 s）。只有在当前有合法的 src 时返回（只读）
	getVoiceDuration(success) {
    // 必须。不然也获取不到时长
		var success = success;
    setTimeout(() => {
			success(innerAudioContext.duration)
    }, 1000)
  }

	getRecorderLocalFilePath() {
		console.log("返回本地录音文件地址：" + this.tempMP3FilePath)
		return this.tempMP3FilePath;
  }
  


	// 页面相关的逻辑
	initPage(options) {
		var that = this

		this._page = options.page

		this._page.setData({
			voiceState: 1, // 1代表正常状态 2代表录音状态 3代表可以播放状态 4代表正在播放
			defaultInfo:{
				label1: '点击图标开始录音',
				label2: '录音最长 60 秒',
			},
			
		})


		// 界面上点击了删除录音
		this._page.deleteRecord = function () {
			that._page.setData({
				voiceState: 1,
				voice: null,
				uploadSuccess: false,
			})
		}

		// 界面上点击了开始录音
		this._page.startRecord = function () {
			that._page.setData({
				voiceState: 2,
				voice: null, 
				recordInfo: {
					label1: '正在录音，点击图标完成录音',
					label2: '0秒 / 60秒',
				},
				speakingPicIndex: 1,
			})

			that.countdown && clearInterval(that.countdown)
			that.timer && clearInterval(that.timer)

			that.startRecord() // 该对象开始录音
			that.speaking() // 录音动画
			that.duration = 0 // 记录录音时长
			// 开启定时器
			that.countdown = setInterval(function () {
				that.duration++;
				console.log("录制时间",that.duration)
				var recordInfo = that._page.data.recordInfo
				recordInfo.label2 = that.duration + '秒 / 60秒'
				that._page.setData({
					recordInfo: recordInfo
				})

				// 录音超过了时间 强制停止
				if (that.duration >= 60) {
					that.countdown && clearInterval(that.countdown)
					that.timer && clearInterval(that.timer)
					that.stopRecord() // 该对象调用停止录音
				}

			}, 1000);
		
		}

		// 界面上点击了结束录音
		this._page.endRecord = function () {
			that.countdown && clearInterval(that.countdown)
			that.timer && clearInterval(that.timer)
			that.stopRecord() // 该对象调用停止录音
		}

		// 界面上点击了开始播放
		this._page.playRecord = function () {
			that.playVoice() // 该对象调用播放录音

			that._page.setData({
				voiceState: 4,
				voice: null,
				playingInfo: {
					label1: '正在播放录音，点击图标停止播放录音',
					label2: '0秒 / ' + that.duration + '秒',
				},
			})

			var i = 0
			// 开启定时器
			that.countdown && clearInterval(that.countdown)
			that.countdown = setInterval(function () {
				i++;

				var playingInfo = that._page.data.playingInfo
				playingInfo.label2 = i + '秒 / ' + that.duration + '秒'
				that._page.setData({
					playingInfo: playingInfo
				})

				// 录音超过了时间 强制停止
				if (i >= that.duration) {
					that.countdown && clearInterval(that.countdown)
					that.stopVoice() // 该对象调用停止播放录音
				}
				
			}, 1000);

		}

		// 界面上点击了结束录音播放
		this._page.stopRecord = function () {
			that.countdown && clearInterval(that.countdown)
			that.stopVoice() // 该对象调用停止录音播放
		}


		// 录音完成 既停止录音完成
		options.recordFinsh = function () {
			that._page.setData({
				voiceState: 3,
				voice: {
					fileType: app.fileType.voice,
					fileLocalPath: that.tempMP3FilePath,
					uploadSuccess: false,
				},
				playInfo: {
					label1: '点击图标可播放',
					label2: '时长: ' + that.duration + '秒',
				},
			})
		}


		// 录音开始播放，用来获取音频长度
		options.onPlay = function () {

		}

		// 录音播放结束
		options.onEnded = function () {
			that.options.recordFinsh() // 恢复到录音完成的状态
		}

		// 录音播放暂停了
		options.onStop = function () {
			that.options.recordFinsh() // 恢复到录音完成的状态
		}


	}

	// 麦克风帧动画 
	speaking() {
		var that = this;
		//话筒帧动画 
		var i = 0;
		this.timer = setInterval(function () {
			i++;
			i = i % 5;
			that._page.setData({
				speakingPicIndex: i + 1
			})
		}, 200);
	}


}
