import IMOperator from "./im-operator";
import MsgTypeManager from "../ai/msg-type/base/msg-type-manager";

export default class MsgManager extends MsgTypeManager {
    constructor(page) {
        super(page);
    }

		getMsgTypeManager({ type }) {
			return this.getMsgManager({type})
		}

    // 显示
    showMsg({msg}) {
        this.getMsgManager({type: msg.type}).showMsg({msg});
    }

    // 发送 创建item 一气呵成
		sendMsg({ type = IMOperator.TextType, content, duration}) {
				// 如果是已经评价过了 或者正在评价状态。 那么不能发生消息 
				if (this._page.data.evaluationed != true) {
					this.getMsgManager({ type }).sendOneMsg(arguments[0]);
				}	

    }

    // 重发
    resend({resendItem, itemIndex}) {
      this.getMsgManager({ type: resendItem.type}).resend(arguments[0]);
    }

}