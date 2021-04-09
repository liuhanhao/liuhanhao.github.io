const sockUtil = require('../public/sockUtil.js')
const common = require('../public/common.js')
var WxParse = require('../utils/wxParse/wxParse.js');

import {dealChatTime} from "../utils/time";

/**
 * 这个类是IM模拟类，作为示例仅供参考。
 */
export default class IMOperator {
    static TextType = 'text';
    static VoiceType = 'voice';
    static ImageType = 'image';
    static CustomType = 'custom';
    // 自己扩展的
    static FileType = "file";
    static VideoType = "voide";

		static WebURLType = "webUrl";
		static WebHTMLType = "webHtml";
		static OrderType = "order";

		static HotQuestions = "hotQuestions"; // 热点问题
		static HotSubQuestions = "hotSubQuestions"; // 热点子问题
		static ExpertsSelect = "expertsSelect"; // 专家选择
		static ExpertsSeatSelect = "expertsSeatSelect"; // 专家坐席选择
		static Artificial = "artificial"; // 转人工成功
		static Evaluation = "evaluation"; // 评价

    constructor(page, group) {
      this._page = page;
      this._group = group;
      this._latestTImestamp = 0;//最新消息的时间戳
      this._myHeadUrl = "../images/ai/default_user.png";
      this._otherHeadUrl = "../images/ai/default_avatar.png";
			this._myCharacterName = group.nickName + "[" + group.character + "]";

    }

    // groupID
    getGroupID() {
      return this._group.id;
    }

    //判断是否小蜜
    isAI () {
      if (this._group.id == getApp().AI_XIAOMI_Id && this._group.type == 'friend') {
        return true
      } 
      else {
        return false
      }
    }

    // 构建socket的发送内容对象
  createChatItemContent({ type = IMOperator.TextType, content = '', cid = "", duration} = {}) {
        
      var sid = sockUtil.FUNCTION_getCusid()
			// msgType 0文本 1文件
			var msgType = type === IMOperator.TextType ? 0 : 1
			// 是单聊还是群组
			var isGroup = this._group.type == 'friend' ? false : true

      var msgObj
      // 如果是小蜜
      if (this.isAI()) {
				msgObj = sockUtil.FUNCTION_getSendAISocketMessage(sid, content, isGroup, msgType, this._group, cid, this._page.data.session.sessionId)
      }
      // 讨论组
      else {
        msgObj = sockUtil.FUNCTION_getSendSocketMessage(sid, content, isGroup, msgType, this._group,cid)
      }

      console.log("发送socket消息")
      console.log(msgObj);
      return msgObj

    }

    // 创建基本消息的UI item
	createNormalChatItem({ type = IMOperator.TextType, content = '', isMy = true, duration = 0, headUrl, characterName, msgId, isShowTime = true, fileInfo = {}, article, tag, esId, translatedText, translatedFinsh = false } = {}) {

				// 需要显示时间
				var currentTimestamp = currentTimestamp = Date.now();
				var time = null
        if (isShowTime) {
						// 是否第一次构建
						if (this._latestTImestamp == 0) {
							this._latestTImestamp = currentTimestamp;
						}
						time = dealChatTime(currentTimestamp, this._latestTImestamp);
						// 每次构建的时候刷新一下最新的时间戳
						this._latestTImestamp = currentTimestamp;
				}

        let obj = {
						msgId: msgId ? msgId : currentTimestamp,//消息id // 发送消息的时候 暂时先用日期代替
            groupId: this.getGroupID(),//id
						// 是谁发的消息
						characterName: characterName,
            isMy: isMy,//我发送的消息？
						showTime: time ? time.ifShowTime : false,//是否显示该次发送时间
						time: time ? time.timeStr : "",//发送时间 如 09:15,
            timestamp: currentTimestamp,//该条数据的时间戳，一般用于排序
            type: type,//内容的类型，目前有这几种类型： text/voice/image/custom | 文本/语音/图片/自定义
            content: content,// 显示的内容，根据不同的类型，在这里填充不同的信息。
			headUrl: headUrl ? headUrl : (isMy ? this._myHeadUrl : this._otherHeadUrl),//显示的头像，自己或好友的。
            sendStatus: 'success',//发送状态，目前有这几种状态：sending/success/failed | 发送中/发送成功/发送失败
            voiceDuration: duration,//语音时长 单位秒
            isPlaying: false,//语音是否正在播放

					// 如果是上传的状态 存储该item上传文件成功后的 远程信息 包括 cid src等
					// 如果是下载的状态 fileInfo.downloadState fileInfo.fileName 文件名字 fileInfo.filePath 文件本地路径
					fileInfo: fileInfo, 
					article: article, // 存放HTML字符串解析的显示内容

					// 热点问题有用没用的评价
					tag,
					esId,
					translatedText, 
					translatedFinsh,
        };
				obj.saveKey = obj.groupId + '_' + obj.msgId;//saveKey是存储文件时的key
        obj.msgType = type === IMOperator.TextType ? 0 : 1 // msgType 0文本 1文件
        return obj;
    }
  
    // 创建系统消息的UI item
    createCustomChatItem(content) {
        return {
            timestamp: Date.now(),
            type: IMOperator.CustomType,
            content: content
        }
    }

		/**
		 * 根据 服务器或者socket返回的item构建能够创建本地界面的item
	 	 * obj 通信的item
		 */
		messageObjectCreateChatItem(obj) {
			var mineObj = getApp().webSocketsData.mineObj

			var item = {}
			item.msgId = obj.id
			item.isMy = obj.userId == mineObj.id ? true : false
			item.characterName = (obj.nickName ? obj.nickName : obj.username) + (obj.character ? ("[" + obj.character + "]") : "")
			// 判断下头像地址
			item.headUrl = obj.avatar ? common.MOBILE_AVATAR_URL(obj.avatar) : null
			item.isShowTime = false

			var content = obj.content == null ? "" : obj.content
			// 语音
			if (content.startsWith("audio")) {
				// 有带长度的
				if (content.indexOf("length:") != -1) {
					var strArray = content.split("](length:")
					var str1 = strArray[0].replace("audio[", "")
					var newcontent = common.MOBILE_AVATAR_URL(str1);
					var duration = strArray[1].replace(")", "")
					item.content = newcontent
					item.type = IMOperator.VoiceType
					item.duration = duration // 声音时长
				}
				// 没有带长度的
				else {
					var strArray = content.split("](")
					var str1 = strArray[0].replace("audio[", "")
					var newcontent = common.MOBILE_AVATAR_URL(str1);
					item.content = newcontent
					item.type = IMOperator.VoiceType
					item.duration = 0 // 声音时长
				}

				item.translatedText = obj.translatedText
				item.translatedFinsh = obj.translatedFinsh

			}
			// 图片
			else if (content.startsWith("img")) {
				var newcontent = content.replace("]", "")
				newcontent = newcontent.replace("img[", "")
				newcontent = common.MOBILE_AVATAR_URL(newcontent);
				item.content = newcontent
				item.type = IMOperator.ImageType

			}
			// 视频
			else if (content.startsWith("video")) {
				var newcontent = content.replace("]", "")
				newcontent = newcontent.replace("video[", "")
				newcontent = common.MOBILE_AVATAR_URL(newcontent);
				item.content = newcontent
				item.type = IMOperator.VideoType

			}
			// 音频
			else if (content.startsWith("file")) {
				var strArray = content.split(")[")
				var str1 = strArray[0].replace("file(", "")
				var newcontent = common.MOBILE_AVATAR_URL(str1);
				var fileName = strArray[1].replace("]", "")

				var fileInfo = {}
				fileInfo.fileName = fileName
				// fileInfo.filePath = fileObj.path
				fileInfo.downloadState = 0 // 暂时没有文件缓存

				item.content = newcontent
				item.type = IMOperator.FileType
				item.fileInfo = fileInfo

			}
			else if (content.startsWith("html[")) {
				var newcontent = content.replace("]", "")
				newcontent = newcontent.replace("html[", "")
				// 有图片的话添加图片地址前缀 图片是没有前缀的
				if (newcontent.indexOf("src=\"") != -1 && newcontent.indexOf("src=\"http") == -1) {
					newcontent = newcontent.replace(/src="/g, "src =\"" + common.DEFAULT_URL_PREFIX());
				}

				// console.log("有HTML解析:", content)

				/**
					* WxParse.wxParse(bindName , type, data, target,imagePadding)
					* 1.bindName绑定的数据名(必填)
					* 2.type可以为html或者md(必填)
					* 3.data为传入的具体数据(必填)
					* 4.target为Page对象,一般为this(必填)
					* 5.imagePadding为当图片自适应是左右的单一padding(默认为0,可选)
					*/
				var article = WxParse.wxParse('article', 'html', newcontent, this._page, 5);
				item.content = "HTML字符串"
				item.type = IMOperator.WebHTMLType
				// HTML解析model
				item.article = article
				item.tag = obj.tag
				item.esId = obj.esId
			}
			else if (content.startsWith("url[")) {
				var newcontent = content.replace("]", "")
				newcontent = newcontent.replace("url[", "")
				newcontent = common.DEFAULT_URL_PREFIX() + newcontent;

				item.content = newcontent
				item.type = IMOperator.WebURLType

			}
			// 工单
			else if (content.startsWith("order[")) {
				return null
			}
			// 文本
			else {
				item.content = content
				item.type = IMOperator.TextType
			}

			// 创建显示的item
			return this.createNormalChatItem(item)

		}

		

}

