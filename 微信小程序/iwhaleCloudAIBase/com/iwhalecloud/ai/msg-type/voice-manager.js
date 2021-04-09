import {isVoiceRecordUseLatestVersion} from "../../aiChat/modules/chat-input/chat-input";
import IMOperator from "../im-operator";
import FileManager from "./base/file-manager";

export default class VoiceManager extends FileManager{
    constructor(page) {
        super(page);
        this.isLatestVersion = isVoiceRecordUseLatestVersion();
        //判断是否需要使用高版本语音播放接口
        if (this.isLatestVersion) {
            this.innerAudioContext = wx.createInnerAudioContext();
        }
        //在该类被初始化时，绑定语音点击播放事件
				var that = this	
        this._page.chatVoiceItemClickEvent = (e) => {
						let dataset = e.currentTarget.dataset
						
						let itemIndex = e.currentTarget.dataset.index
						let item = that._page.data.chatItems[itemIndex];
						console.log('语音Item', item);

						// 错误的闭包
						var cbError = (res) => {
							// 如果这个item 还处在播放状态
							if (dataset.voicePath === that._page.data.latestPlayVoicePath && item.isPlaying && that._page.data.isVoicePlaying) {
								// 停止播放
								item.isPlaying = false
								that._page.setData({
									chatItems: that._page.data.chatItems,
									isVoicePlaying: false
								})
							}
	
						}
						// 下载文件完成闭包
					  var downloadOk = (res) => {
							
							// 如果这个item 还处在播放状态
							if (dataset.voicePath === that._page.data.latestPlayVoicePath && item.isPlaying && that._page.data.isVoicePlaying) {

								// 保存远程地址
								item.fileInfo = { filePath: res.tempFilePath}
								
								// 开始播放语音
								that.__playVoice({
									filePath: res.tempFilePath,
									success: () => {
										that.stopAllVoicePlay();
										console.log('成功下载了音频 并且播放了本地语音');
									},
									fail: (res) => {
										// 理论上应该不会出现这种情况
										console.log('第二次播放失败了', res);
										typeof cbError === "function" && cbError(res);
									}
								});
							
							}
						}

						// 开始播放
						this._playVoice({ dataset, downloadOk, cbError})
        }

				// 长按翻译
				this._page.chatVoiceItemTranslatedTextEvent = function (e) {
					
					let itemIndex = e.currentTarget.dataset.index
					let item = that._page.data.chatItems[itemIndex];
					// 还没翻译过的 或者翻译失败的才翻译
					if (!(item.translatedText && item.translatedText.length > 0)
						|| item.translatedText == "转化失败") {
						console.log("点击翻译", item);

						let src = e.currentTarget.dataset.src
						that._page.requestTranslatedText({ src, itemIndex })
					}

				}
    }

	// 开始播放
	_playVoice({ dataset, downloadOk, cbError}) {
        let that = this;
				// 如果点的是同一个 那么停止播放
				if (dataset.voicePath === this._page.data.latestPlayVoicePath && this._page.data.chatItems[dataset.index].isPlaying) {
            this.stopAllVoicePlay();
        } 
				else {
						// 界面开始播放动画
            this._startPlayVoice(dataset);

						var playFilePath = dataset.fileInfo.filePath ? dataset.fileInfo.filePath : dataset.voicePath; //优先读取本地路径，可能不存在此文件

						// 开始播放
						this.__playVoice({
								filePath: playFilePath,
								success: () => {
									that.stopAllVoicePlay();
									console.log('成功播放了本地语音');
								},
								// 如果这个item没有音频长度 那么刷新一下音频长度
								refreshDuration: (duration) => {
									var chatItems = that._page.data.chatItems
									var item = chatItems[dataset.index]
									if (duration && item.voiceDuration == 0) {
										item.voiceDuration = duration

										that._page.setData({
											chatItems: chatItems
										})
									}
								},
								fail: (res) => {
									console.log('第一次播放失败了，一般情况下是本地没有该文件，需要从服务器下载', res);
									// 下载文件
									that._downloadVoiceFile(dataset, downloadOk, cbError)
								}
						});

        }
    }

    /**
     * 播放语音 兼容低版本语音播放
     * @param filePath
     * @param success
     * @param fail
     * @private
     */
		__playVoice({ filePath, success, fail, refreshDuration}) {
        if (this.isLatestVersion) {
            this.innerAudioContext.src = filePath;
            this.innerAudioContext.startTime = 0;
            this.innerAudioContext.play();
						// 播放出错
            this.innerAudioContext.onError((error) => {
                this.innerAudioContext.offError();
                fail && fail(error);
            });
						// 播放结束
            this.innerAudioContext.onEnded(() => {
                this.innerAudioContext.offEnded();
                success && success();
            });

						var that = this
						setTimeout(() => {
							var duration = Math.round(that.innerAudioContext.duration)
							console.log("音频长度=", that.innerAudioContext.duration)//2.795102
							refreshDuration && refreshDuration(duration)
						}, 1000)
        } else {
						// 低版本的播放接口不支持远程URL播放
            wx.playVoice({filePath, success, fail});
        }
    }

		// 开始播放并且播放动画  把其他的item停止
    _startPlayVoice(dataset) {
        let that = this._page;
        let chatItems = that.data.chatItems;
				// 新的item置为true
        chatItems[dataset.index].isPlaying = true;
				// 旧的item置为false
        if (that.data.latestPlayVoicePath && that.data.latestPlayVoicePath !== chatItems[dataset.index].content) {//如果重复点击同一个，则不将该isPlaying置为false
            for (let i = 0, len = chatItems.length; i < len; i++) {
                if ('voice' === chatItems[i].type && that.data.latestPlayVoicePath === chatItems[i].content) {
                    chatItems[i].isPlaying = false;
                    break;
                }
            }
        }
        that.setData({
            chatItems: chatItems,
            isVoicePlaying: true,
						latestPlayVoicePath: dataset.voicePath, // 保存现在正在播放的语音路径
        });
       
    }

		/**
		 * 停止播放所有语音
		 */
		stopAllVoicePlay() {
			let that = this._page;
			if (this._page.data.isVoicePlaying) {
				this._stopVoice();
				that.data.chatItems.forEach(item => {
					if (IMOperator.VoiceType === item.type) {
						item.isPlaying = false
					}
				});
				that.setData({
					chatItems: that.data.chatItems,
					isVoicePlaying: false
				})
			}
		}

		/**
		 * 停止播放 兼容低版本语音播放
		 * @private
		 */
		_stopVoice() {
			if (this.isLatestVersion) {
				this.innerAudioContext.stop();
			} else {
				wx.stopVoice();
			}
		}

		/**
		 * 下载远程文件 才可以播放
		 */
		_downloadVoiceFile(dataset, downloadOk, cbError) {

			wx.downloadFile({
				url: dataset.voicePath,
				success: res => {
					console.log('下载语音成功', res);
					typeof downloadOk === "function" && downloadOk(res);
				},
				fail: res => {
					console.log('下载失败了', res);
					typeof cbError === "function" && cbError(res);
				}
			});
			
		}

}