const upload = require('../../public/upload.js')

import FileManager from "./base/file-manager";

export default class OpenFileManager extends FileManager {
	constructor(page) {
		super(page);
	  // 打开文件
		var that = this
		this._page.chatFileItemClickEvent = function (event) {
			var itemIndex = event.currentTarget.dataset.itemIndex;
			var resendItem = that._page.data.chatItems[itemIndex]
			console.log(itemIndex, resendItem)
			// 已经下载完成 可以直接打开
			if (resendItem.fileInfo.downloadState == 2) {
				that.openDocument(resendItem.fileInfo.filePath)
			}
			// 下载中
			else if (resendItem.fileInfo.downloadState == 1) {
			}
			// 默认 下载失败
			else if (resendItem.fileInfo.downloadState == 0
				|| resendItem.fileInfo.downloadState == 3) {
				
				var fileInfo = resendItem.fileInfo
				fileInfo.downloadState = 1
				// 刷新UI
				that._page.UI.updateDownloadFileItemState({ fileInfo, itemIndex })
				// 开始下载
				that.downloadFile(resendItem.content, itemIndex)
			}
		}

	}

	/**
	 * 预览文件
	 */
	openDocument(localPath) {
		wx.openDocument({
			filePath: localPath,
			success: function (res) {
				console.log('打开文档成功', res)
			},
			fail: function (res) {
				console.log(res);
				wx.showToast({
					title: "打开文档失败",
					// icon: "none",
					image: '../images/chat/send_fail.png'
				})
			},
		})
	}

	/**
	* 下载文件
	*/
	downloadFile(url, itemIndex) {
		var that = this
		upload.FUNCTION_POST_DOWNLOAD_REQUEST(url,
			// 成功
			function (res) {
				var resendItem = that._page.data.chatItems[itemIndex]

				var fileInfo = resendItem.fileInfo
				fileInfo.downloadState = 2 // 下载成功
				fileInfo.filePath = res
				// 刷新UI
				that._page.UI.updateDownloadFileItemState({ fileInfo, itemIndex })
				
			},
			// 失败
			function (res) {
				var resendItem = that._page.data.chatItems[itemIndex]

				var fileInfo = resendItem.fileInfo
				fileInfo.downloadState = 3 // 下载失败
				// 刷新UI
				that._page.UI.updateDownloadFileItemState({ fileInfo, itemIndex })
			})

	}

}