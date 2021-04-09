import FileSaveManager from "../../file-save-manager";

export default class FileManager {

    constructor(page) {
        this._page = page;
    }

    /**
     * 接收到消息时，通过UI类的管理进行渲染
     * @param msg 接收到的消息，这个对象应是由 im-operator.js 中的createNormalChatItem()方法生成的。
     */
    showMsg({msg}) {
        // const url = msg.content; // 本地的URL
        // const localFilePath = FileSaveManager.get(msg);
        // if (!localFilePath) {
        //     wx.downloadFile({
        //         url,
        //         success: res => {
        //             // console.log('下载成功', res);
        //             FileSaveManager.saveFileRule({
        //                     tempFilePath: res.tempFilePath,
        //                     success: (savedFilePath) => {
        //                         msg.content = savedFilePath;
        //                         this._page.UI && this._page.UI.updateViewWhenReceive(msg);
        //                         FileSaveManager.set(msg, savedFilePath);
        //                     },
        //                     fail: res => {
        //                         // console.log('存储失败', res);
        //                         this._page.UI && this._page.UI.updateViewWhenReceive(msg);
        //                     }
        //                 }
        //             )
        //         }
        //     });
        // } else {
        //     msg.content = localFilePath;
            this._page.UI.updateViewWhenReceive(msg);
        // }
    }

    /**
     * 发送文件类型消息
     * @param type 消息类型
     * @param content 由输入组件接收到的临时文件路径
     * @param duration 由输入组件接收到的录音时间
     */
    sendOneMsg({type, content, duration,fileInfo}) {
        FileSaveManager.saveFileRule({
            tempFilePath: content,
            success: (savedFilePath) => {
							this._sendFileMsg({ content: savedFilePath, duration, type, fileInfo});
            }, 
						fail: res => {
							// 文件过大或者文件保存失败 
							wx.showToast({
								title: res,
								// icon: "none",
								image: '../images/chat/send_fail.png'
							})
							// this._sendFileMsg({content, type, duration});
            }
        });
    }

		_sendFileMsg({ content, duration, type, fileInfo}) {
				var headUrl = getApp().webSocketsData.mineObj.avatar // 我自己的头像
        const temp = this._page.imOperator.createNormalChatItem({
            type,
            content,
						headUrl,
            duration,
						fileInfo
        });
        this._page.UI.showItemForMoment(temp, (itemIndex) => {
						this.uploadFileAndSend({ content, duration, itemIndex, type, fileInfo})
        });
    }

		uploadFileAndSend({ content, duration, type, itemIndex, fileInfo}) {
        // 需要再aichat页面实现 simulateUploadFile 上传方法
        this._page.simulateUploadFile({
            type,
            savedFilePath: content, 
            duration, 
            itemIndex,
            // 文件上传成功
            success: (socketContent, cid, localFilePath, remoteFilePath) => {
							var newfileInfo = fileInfo
							newfileInfo.type = type
							newfileInfo.content = socketContent
							newfileInfo.cid = cid
							newfileInfo.duration = duration
				
							this._page.UI.updateUploadFileSuccessful({ fileInfo: newfileInfo,
							 itemIndex })

							// 创建socket的发送对象
							var sendObj = this._page.imOperator.createChatItemContent(fileInfo)
							var chatItems = this._page.data.chatItems
							chatItems[itemIndex].sid = sendObj.data.mine.sid // 保存一下sid给这个item 以便后续根据sid找到这个item

							this._page.socketSendMessages({
								content: sendObj,
								itemIndex,
								// remoteFilePath文件远程地址  localFilePath文件的本地地址
								// 发送成功
								success: (msg) => {
								// FileSaveManager.set(remoteFilePath, localFilePath);
								this._page.UI.updateViewWhenSendSuccess(msg, itemIndex);
								},
								// 发送失败
								fail: () => {
								this._page.UI.updateViewWhenSendFailed(itemIndex);
								}
							});
            }, 
            // 文件上传失败
            fail: () => {
               	this._page.UI.updateViewWhenSendFailed(itemIndex);
            }
        });
    }

		// 重发
		resend({ resendItem, itemIndex }) {
				// 刷新界面为发送中
				this._page.UI.updateDataWhenStartSending(resendItem, false, false)
				// Object.getOwnPropertyNames 获取obj所有的key
				// 文件已经上传成功过了 直接发送
				if (resendItem.fileInfo.content != null) {
					// 创建socket的发送对象
					var sendObj = this._page.imOperator.createChatItemContent(resendItem.fileInfo)

					var chatItems = this._page.data.chatItems
					chatItems[itemIndex].sid = sendObj.data.mine.sid // 保存一下sid给这个item 以便后续根据sid找到这个item

					this._page.socketSendMessages({
						content: sendObj,
						itemIndex,
						// remoteFilePath文件远程地址  localFilePath文件的本地地址
						// 发送成功
						success: (msg) => {
							// FileSaveManager.set(remoteFilePath, localFilePath);
							this._page.UI.updateViewWhenSendSuccess(msg, itemIndex);
						},
						// 发送失败
						fail: () => {
							this._page.UI.updateViewWhenSendFailed(itemIndex);
						}
					});
				}
				else {
					// 调用先上传后发送的方法
					this.uploadFileAndSend({
						content: resendItem.content, 
						duration: resendItem.voiceDuration,
						type: resendItem.type, 
						itemIndex 
					})
				}

    }
}