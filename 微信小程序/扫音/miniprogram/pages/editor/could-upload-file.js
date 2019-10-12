const app = getApp()
const db = app.cloudDB()

export default class CouldUploadFile {
	constructor(page) {
		this._page = page;

		var that = this

		// 点击图片的方法
		this._page.imageClickEvent = function (e) {
			var photo = e.currentTarget.dataset.photo
			console.log(photo.fileLocalPath)
			that._page.setData({
				selectImageUrl: photo.fileLocalPath
			})
			
		}
		// 大图片消失
		this._page.hiddeSelectImageUrl = function () {
			that._page.setData({
				selectImageUrl: null
			})
		}

		// 删除图片
		this._page.deleteImage = function (event) {
			var photos = that._page.data.photos
			var index = event.currentTarget.dataset.index

			var newPhotos = []
			for (var i = 0; i < photos.length; i++) {
				var item = photos[i]
				if (i == index) {
					continue
				}
				else {
					item.index = newPhotos.length + 1
					newPhotos.push(item)
				}
			}

			that._page.setData({
				photos: newPhotos,
				uploadSuccess: false
			})
		}
		// 删除视频
		this._page.deleteVideo = function () {
			that._page.setData({
				video: null,
				uploadSuccess: false
			})
		}


		// 点击了添加文件按钮
		this._page.addFileAction = function (event) {

			// var itemIndex = event.currentTarget.dataset.index;
			// 弹出插入选择框
			wx.showActionSheet({
				itemList: ['修改背景图片', '插入图片', '插入小视频'],
				success: function (res) {
					console.log(res.tapIndex)
					if (0 == res.tapIndex) {
						var path = '/pages/theme/theme'
						// 跳转到背景列表界面
						wx.navigateTo({
							url: path
						})

					}
					else if (1 == res.tapIndex) {
						var photos = that._page.data.photos
						if (photos.length < 3) {
							// 选择图片或者拍摄照片
							wx.chooseImage({
								count: 3 - photos.length,
								sizeType: ['original', 'compressed'],
								sourceType: ['album', 'camera'],
								success(res) {
									// tempFilePath可以作为img标签的src属性显示图片
									// let tempFiles = res.tempFiles;
									// let obj = tempFiles[0];
									for (var i = 0; i < res.tempFilePaths.length; i++) {
										var tempFilePath = res.tempFilePaths[i]
										var item = {
											fileType: app.fileType.photo,
											fileLocalPath: tempFilePath,
											index: photos.length + 1 + i
										}

										photos.push(item)
									}
									
									that._page.setData({
										photos: photos,
										uploadSuccess: false
									})

								}
							})
						}
						else {
							wx.showToast({
								title: '最多存三张图片',
								icon: 'none'
							})
						}
						
					}
					else if (2 == res.tapIndex) {
						// 选择视频或者拍摄视频
						wx.chooseVideo({
							// 'album', 
							sourceType: ['camera'],
							maxDuration: 60,
							camera: 'back',
							success(res) {
								console.log('视频的时长' + res.duration)
								console.log('视频的宽' + res.width)
								console.log('视频的高' + res.height)
								console.log('视频的大小' + res.size)

								var tempFilePath = res.tempFilePath;
								console.log('选择的视频路径' + tempFilePath)

								var maxWidth = 260
								var maxHeight = 260
								var width = 0
								var height = 0
								if (res.width < 260 || res.height < 260) {
									height = res.height
									width = res.width
								}
								else if (res.width > res.height) {
									height = maxHeight
									width = res.width / (res.height / maxHeight)
								}
								else {
									width = maxWidth
									height = res.height / (res.width / maxWidth)
								}

								var item = {
									fileType: app.fileType.video,
									fileLocalPath: tempFilePath,
									width: width,
									height: height, 
								}

								that._page.setData({
									video: item,
									uploadSuccess: false
								})
							}
						})
					}

				},

			})

		}

	}


	// 上传单张
	startUploadOneFile({ fileItem, success, fail }) {
		var that = this

		wx.showLoading({
			title: '加载中...',
			icon: "loading",
		})

		// 构建云端文件路径
		var cloudPath = this.getCloudFilePath(fileItem)

		wx.cloud.uploadFile({
			cloudPath: cloudPath, // 上传至云端的路径
			filePath: fileItem.fileLocalPath, // 小程序临时文件路径

			success: function (res) {
				wx.hideLoading()

				console.log("单个上传文件成功 res=", res)

				// 返回存储文件的ID  后续都是用它来操作文件
				var fileCloudPath = res.fileID
				fileItem.fileCloudPath = fileCloudPath

				success && success(fileItem)
			},
			fail: function (error) {
				wx.hideLoading()

				// 只要有一张上传失败了 都需要重新上传
				console.log("单个上传文件失败 error=", error)
				fail && fail()

			}
		})
	}

	// 开始多张上传
	startUploadFile({ filesArray, success, fail}) {
		if (filesArray && filesArray.length > 0) {
			wx.showLoading({
				title: '保存中...',
				icon: "loading",
			})

			// 开始上传
			this.uploadOneByOne({ fileItems: filesArray, success, fail})
			
		}
		else {
			wx.showModal({
				title: '提示',
				content: '请编辑你的卡片，包括祝福语、图片、小视频、录音',
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

	}

	/**
	* 采用递归的方式上传多张
	*/
	uploadOneByOne({ fileItems, count = 0, success, fail}) {
		var that = this

		// 构建云端文件路径
		var cloudPath = this.getCloudFilePath(fileItems[count])

		console.log("正在上传的本地文件路径" + fileItems[count].fileLocalPath);
		wx.cloud.uploadFile({
			cloudPath: cloudPath, // 上传至云端的路径
			filePath: fileItems[count].fileLocalPath, // 小程序临时文件路径

			success: function (res) {
				console.log('正在上传第' + (count + 1) + '张', res);

				// 返回存储文件的ID  后续都是用它来操作文件
				var fileCloudPath = res.fileID

				fileItems[count].fileCloudPath = fileCloudPath
				fileItems[count].uploadSucc = true

				count++;//下一张
				if (count == fileItems.length) {
					//上传完毕，作一下提示
					that.establishCoreMap({ success, fail })

				} else {
					//递归调用，上传下一张
					that.uploadOneByOne({ fileItems, count, success, fail});
				}

			},
			fail: function (error) {
				wx.hideLoading()

				// 只要有一张上传失败了 都需要重新上传
				console.log("上传文件失败 error=", error)
				fail && fail()

			}
		})

	}

	// 建立映射
	establishCoreMap({success, fail}) {

		var that = this
		var qrCode = app.qrCode.code; // 二维码映射文件

		var fileAttributes = this.getDetailsFileAttributes({ isCloud: true })
		console.log("上传的fileAttributes = ",fileAttributes)

		// 已经上传过云端了 那么就更新
		if (app.qrCode.fileAttributes) {
			db.collection('FileAttributes').doc(app.qrCode.fileAttributes_id).update({
				// data 传入需要局部更新的数据
				data: {
					// 表示将 done 字段置为 true
					fileAttributes: fileAttributes
				},
				success: function (res) {
					wx.hideLoading()

					// res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
					console.log("更新映射成功", res)
					success && success(fileAttributes, app.qrCode.fileAttributes_id)
				},
				fail: function (error) {
					wx.hideLoading()

					console.log("更新映射失败 error=", error)
					fail && fail()

				}
			})
		}
		// 添加一条数据
		else {
			db.collection('FileAttributes').add({
				// data 字段表示需新增的 JSON 数据
				data: {
					fileAttributes: fileAttributes,  // 二维码保存的文件列表
					qrcode: qrCode, // 二维码
				},
				success: function (res) {
					wx.hideLoading()

					// res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
					console.log("建立映射成功", res)
					success && success(fileAttributes, res._id)
				},
				fail: function (error) {
					wx.hideLoading()

					console.log("建立映射失败 error=", error)
					fail && fail()

				}
			})
		}
		
	}

	/**
	 * 构建详情界面的字典模型 
	 * 是否是云 -> 上传之后的查看
	 * 是否是本地 -> 预览
	 */
	getDetailsFileAttributes({isCloud}) {
		// 文本内容
		var text = {}
		this._page.data.toName && (text.toName = this._page.data.toName)// 收件人
		this._page.data.fromName && (text.fromName = this._page.data.fromName)// 发送人
		this._page.data.fromDate && (text.fromDate = this._page.data.fromDate)// 发送日期
		this._page.data.address && (text.address = this._page.data.address)// 发送地址
		this._page.data.sayText && (text.sayText = this._page.data.sayText)// 祝福语

		var voice = this._page.data.voice // 语音
		var photos = this._page.data.photos // 图片
		var video = this._page.data.video // 视频
		var musicItem = this._page.data.musicItem // 背景音乐
		var backgroundImage = this._page.data.backgroundImage // 背景图片

		var fileAttributes = { text }
		voice && (fileAttributes.voice = { fileCloudPath: voice.fileCloudPath })
		backgroundImage && (fileAttributes.backgroundImage = backgroundImage)
		musicItem && (fileAttributes.musicItem = musicItem)

		if (isCloud) {
			video && (fileAttributes.video = { fileCloudPath: video.fileCloudPath })

			var newPhotos = []
			for (var i = 0; i < photos.length; i++) {
				var photo = photos[i]
				newPhotos.push({
					fileCloudPath: photo.fileCloudPath
				})
			}
			newPhotos.length > 0 && (fileAttributes.photos = newPhotos)

		}
		else {
			video && (fileAttributes.video = { fileCloudPath: video.fileLocalPath })

			var newPhotos = []
			for (var i = 0; i < photos.length; i++) {
				var photo = photos[i]
				newPhotos.push({
					fileCloudPath: photo.fileLocalPath
				})
			}
			newPhotos.length > 0 && (fileAttributes.photos = newPhotos)
		}

		return fileAttributes
	}

	// 返回云端文件路径
	getCloudFilePath(fileItem) {
		var suffix = ''
		var index = ''
		if (fileItem.fileType == app.fileType.photo) {
			index = fileItem.index
			suffix = '.jpg'
		}
		else if (fileItem.fileType == app.fileType.voice) {
			suffix = '.mp3'
		}
		else if (fileItem.fileType == app.fileType.video) {
			suffix = '.mp4'
		}

		// 二维码名字作为文件夹名称+文件类型+后缀
		return "uploadFile/" + app.qrCode.code + '/' + fileItem.fileType + index + suffix;
	}

}