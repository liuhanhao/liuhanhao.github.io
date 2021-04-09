export default class TextManager {
    constructor(page) {
        this._page = page;

				var that = this
				this._page.chatTextItemClickEvent = function (event) {
					var itemIndex = event.currentTarget.dataset.index;
					var resendItem = that._page.data.chatItems[itemIndex]
					console.log("点击了item",itemIndex, resendItem)

					// 点击了要跳转到webview
					if (resendItem.type == "webUrl") {
						var webURL = resendItem.content
						wx.navigateTo({
							url: '../webView/webView?parameter=' + webURL
						})
					}
	
				}

				// 热点问题点击了有用没用
				this._page.hotSpotEvaluationEvent = function (event) {
					var itemIndex = event.currentTarget.dataset.index;
					var resendItem = that._page.data.chatItems[itemIndex]
					var esId = event.currentTarget.dataset.esId;
					var flag = event.currentTarget.dataset.flag
					console.log("点击有用无用item", itemIndex, resendItem, esId, flag)

					// 点击了热点问题评价
					if (resendItem.type == "webHtml") {
						that._page.sendHotSpotEvaluation({ esId, flag})
					}

				}
    }

    /**
     * 接收到消息时，通过UI类的管理进行渲染
     * @param msg 接收到的消息，这个对象应是由 im-operator.js 中的createNormalChatItem()方法生成的。
     */
    showMsg({msg}) {
        //UI类是用于管理UI展示的类。
        this._page.UI.updateViewWhenReceive(msg);
    }
	
    /**
     * 发送消息时，通过UI类来管理发送状态的切换和消息的渲染
     * @param content 输入组件获取到的原始文本信息
     * @param type
     */
    sendOneMsg({content, type}) {

      // 创建界面上显示的item
			var headUrl = getApp().webSocketsData.mineObj.avatar // 我自己的头像
      var newItem = this._page.imOperator.createNormalChatItem({
        type,
        content,
				headUrl
      })
      var msgType = newItem.msgType
      var saveKey = newItem.saveKey

			var sendObject = this._page.imOperator.createChatItemContent({ type, content })

			newItem.sid = sendObject.data.mine.sid // 保存一下sid给这个item 以便后续根据sid找到这个item

      // 改变发送状态 创建socket发送obj
      this._page.UI.showItemForMoment(newItem, (itemIndex) => {
          this._page.socketSendMessages({
            // 构建socket的发送内容
						content: sendObject,
            itemIndex, 
            msgType, 
            saveKey,
            // 发送成功
            success: (msg) => {
              this._page.UI.updateViewWhenSendSuccess(msg, itemIndex);
            },
            // 发送失败
            fail: () => {
              this._page.UI.updateViewWhenSendFailed(itemIndex);
            }
          });
      });
    }

    // 重发
    resend({ resendItem, itemIndex }) {
      
      var msgType = resendItem.msgType
      var saveKey = resendItem.saveKey

      // 刷新界面为发送中
      this._page.UI.updateDataWhenStartSending(resendItem, false, false)
      // 创建发送对象
			var sendObject = this._page.imOperator.createChatItemContent({ type: resendItem.type, content: resendItem.content })

			var chatItems = this._page.data.chatItems
			chatItems[itemIndex].sid = sendObject.data.mine.sid // 保存一下sid给这个item 以便后续根据sid找到这个item

      // 开始发送
      this._page.socketSendMessages({
					content: sendObject,
          itemIndex,
          msgType,
          saveKey,
          // 发送成功
          success: (msg) => {
            this._page.UI.updateViewWhenSendSuccess(msg, itemIndex);
          },
          // 发送失败
          fail: () => {
            this._page.UI.updateViewWhenSendFailed(itemIndex);
          }
      });
    }
}
