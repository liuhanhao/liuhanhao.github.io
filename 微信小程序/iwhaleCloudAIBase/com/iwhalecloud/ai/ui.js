import * as chatInput from "../aiChat/modules/chat-input/chat-input";
const app = getApp()

/**
 * 用户处理消息的收发UI更新
 */
export default class UI {
    constructor(page) {
        this._page = page;
    }

    // 排序的方法
    static _sortMsgListByTimestamp(item1, item2) {
      return item1.timestamp - item2.timestamp;
    }
    // 刷新视图并且 重新排序  暂时用不到
    updateListViewBySort() {
      this._page.setData({
        chatItems: this._page.data.chatItems.sort(UI._sortMsgListByTimestamp)
      })
    }

		/**
			 * 文件上传成功后保存 文件的远程路径
			 * 为防止socket消息发送失败的时候  不再需要上传文件
			 */
		updateUploadFileSuccessful({ fileInfo, itemIndex }) {
			let that = this._page;
			that.data.chatItems[itemIndex].fileInfo = fileInfo;
			let obj = {};
			obj[`chatItems[${itemIndex}].fileInfo`] = fileInfo;
			that.setData(obj);
		}

		/**
			 * 更改文件下载状态
			 * fileInfo.downloadState: 文件状态 0表示还没下载 1表示下载中 2表示下载完成 3表示下载失败
			 * fileInfo.fileName 文件名字
			 * fileInfo.filePath 文件本地路径
			 */
		updateDownloadFileItemState({ fileInfo, itemIndex }) {
			let that = this._page;
			that.data.chatItems[itemIndex].fileInfo = fileInfo;
			let obj = {};
			obj[`chatItems[${itemIndex}].fileInfo`] = fileInfo;
			that.setData(obj);
		}

    /**
     * 接收到消息时，更新UI
     * @param msg
     */
    updateViewWhenReceive(msg) {
        this._page.data.chatItems.push(msg);
        this._page.setData({
            chatItems: this._page.data.chatItems,
            scrollTopVal: this._page.data.chatItems.length * 999,
        });
    }

    /**
     * 发送消息时，渲染消息的发送状态为 发送中
     * @param sendMsg
     * @param cbOk
     */
    showItemForMoment(sendMsg, cbOk) {
        if (!sendMsg) return;
        this.updateDataWhenStartSending(sendMsg);
        cbOk && cbOk(this._page.data.chatItems.length - 1);
    }

    /**
     * 设置消息发送状态为 发送中
     * @param sendMsg
     * @param addToArr
     * @param needScroll
     */
    updateDataWhenStartSending(sendMsg, addToArr = true, needScroll = true) {
        
        sendMsg.sendStatus = 'sending';

        let obj = {};
        if (addToArr) {
          chatInput.closeExtraView();
          this._page.data.chatItems.push(sendMsg);
          obj['textMessage'] = ''; // 把输入框内容置为空
        }

        obj['chatItems'] = this._page.data.chatItems;
        needScroll && (obj['scrollTopVal'] = this._page.data.chatItems.length * 999);
        this._page.setData(obj);
    }

    /**
     * 设置消息发送状态为 发送成功
     * @param sendMsg 
     * @param itemIndex
     */
    updateViewWhenSendSuccess(sendMsg, itemIndex) {
        let that = this._page;
        let item = that.data.chatItems[itemIndex];
        // item.timestamp = sendMsg.timestamp; //重置时间
        this.updateSendStatusView('success', itemIndex);
    }

    /**
     * 设置消息发送状态为 发送失败
     * @param itemIndex
     */
    updateViewWhenSendFailed(itemIndex) {
    	this.updateSendStatusView('failed', itemIndex);
    }

    // 改变改item的 状态
    updateSendStatusView(status, itemIndex) {
        let that = this._page;
        that.data.chatItems[itemIndex].sendStatus = status;
        let obj = {};
        obj[`chatItems[${itemIndex}].sendStatus`] = status;
        that.setData(obj);
    }

    // 改变顶部socket是否断线的状态 // close  // open 
    updateChatStatus(open = false) {
        this._page.setData({
          chatStatue: open ? 'open' : 'close',
          chatStatusContent: open ? '无法连接聊天服务器' : ''
        })
    }

		// 改变导航栏上的title
		setNavigationBarTitleWithGroup({group, groupMemberNum = 2}) {
			if (app.webSocketsData.aiObj.id == group.id) {
				wx.setNavigationBarTitle({ title: "小蜜" }) 
			}
			else {
				wx.setNavigationBarTitle({ title: group.groupname + '(' + groupMemberNum + ")" }) 
			}
	
		}
    
}
