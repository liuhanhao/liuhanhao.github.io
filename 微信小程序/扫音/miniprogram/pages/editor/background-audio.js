
const app = getApp()
const db = app.cloudDB()

export default class BackgroundAudio {
	constructor(page) {
		this._page = page;

		var that = this

		this.BackgroundAudioManager = wx.getBackgroundAudioManager()
		
		this.BackgroundAudioManager.onPause(function () {
			console.log("背景音乐播放暂停")
		})

		this.BackgroundAudioManager.onEnded(function() {
			console.log("背景音乐播放结束")
			that.playMusic() // 重新播放
		})

		// 点击选择背景音乐
		this._page.selectBackgroundMusic = function (event) {
			
			if (that._page.data.musicList && that._page.data.musicList.length > 0) {
				var selectIndex = event.detail.value
				var musicItem = that._page.data.musicList[selectIndex]

				var isPlayingBackgroundAudio = that._page.data.isPlayingBackgroundAudio
				var musicIndex = that._page.data.musicIndex

				if (selectIndex != musicIndex) {
					that._page.setData({
						musicItem,
						musicIndex: selectIndex,
						isPlayingBackgroundAudio: true,
						startPlay: true,
						uploadSuccess: false,
					})

					// 开始播放音乐
					that.playMusic()

				}
			}

		}

		// 界面上点击了改变音乐状态
		this._page.changeBackgroundMusicState = function (event) {

			var isPlayingBackgroundAudio = that._page.data.isPlayingBackgroundAudio
			// 暂停
			if (isPlayingBackgroundAudio) {
				that.BackgroundAudioManager.pause()
				that._page.setData({
					isPlayingBackgroundAudio: false
				})
			}
			// 重新播放
			else {
				that.BackgroundAudioManager.play()
				that._page.setData({
					isPlayingBackgroundAudio: true
				})
			}

		}

	}

	// 停止播放
	stopMusic() {
		this.BackgroundAudioManager.pause()
		this._page.setData({
			isPlayingBackgroundAudio: false
		})
	}

	playMusic() {
		// 播放背景音乐
		this.BackgroundAudioManager.stop()// 先停止
		this.BackgroundAudioManager.src = this._page.data.musicItem.musicPath
		this.BackgroundAudioManager.title = this._page.data.musicItem.musicName
		this.BackgroundAudioManager.play()
	}

	// 请求背景音乐列表
	queryBackgroundMusicList() {
		var that = this

		// 如果已经有了就不需要重复了
		if (this._page.data.musicList && this._page.data.musicList.length > 0) {
			return
		}

		db.collection('musicList').get({
			success: function (res) {
				// res.data 是一个包含集合中有权限访问的所有记录的数据，不超过 20 条
				console.log("背景音乐列表", res.data)

				var musicList = []
				for (var i = 0; i < res.data.length; i++) {
					var item = res.data[i]

					var musicName = item.musicName
					var musicPath = item.musicPath

					musicList.push({ musicName, musicPath})

				}
				
				that._page.setData({
					musicList: musicList
				})

			}
		})

	}

	
}
