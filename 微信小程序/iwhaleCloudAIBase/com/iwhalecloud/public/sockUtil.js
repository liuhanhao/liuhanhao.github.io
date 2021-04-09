//websocket连接
//引入公共js文件
const common = require('../public/common.js')
//获取应用实例
const app = getApp()

/**
 * 根据socket返回的消息体message 创建一个界面上认识的model
 */
function FUNCTION_createGroupModel(message) {
	return message;
}

/**
 * 格式化发AI小蜜消息
 * sid:消息的随机标识
 * content：发送内容
 * return:返回消息结构体
 * */
function FUNCTION_getSendAISocketMessage(sid, content, isGroup, msgType, groupObj, cid, sessionId) {

	if (groupObj) {
    var mineObj = app.webSocketsData.mineObj;
    var aiObj = app.webSocketsData.aiObj;

    var messageClientBo = {}
    var messageClientData = {}

    var messageClientMine = {}
    var messageClientTo = {}
		var messageClientOrder = {
			sessionId: sessionId,
			orderId: "",
		}
    //
    messageClientMine.nickname = mineObj.nickName;
    messageClientMine.username = mineObj.username;
    messageClientMine.avatar = mineObj.avatar;
    messageClientMine.id = mineObj.id;
    messageClientMine.mine = true;
    messageClientMine.content = content ? content : '';
    messageClientMine.sid = sid;    
		messageClientMine.cid = cid ? cid : "";
    //
		messageClientTo.id = groupObj.id;
		messageClientTo.avatar = groupObj.avatar;
		messageClientTo.visible = "1"
		messageClientTo.name = groupObj.nickName ? groupObj.nickName : groupObj.username;
		messageClientTo.username = groupObj.username;
    messageClientTo.type = 'friend';
		messageClientTo.sign = cid ? cid : "";
    //
    messageClientData.mine = messageClientMine;
    messageClientData.to = messageClientTo;
		messageClientData.order = messageClientOrder;
    //
    messageClientBo.type = 'normal';
    messageClientBo.data = messageClientData;
    return messageClientBo;
  }
}

/**
 * 格式化发普通消息
 * sid:消息的随机标识
 * content：发送内容
 * isGroup: 单聊"friend"   群聊"group"
 * msgType: 0文本 1文件
 * groupObj: 当前组类型
 * cid : 服务器返回的文件标识符
 * * return:返回消息结构体
 * */
function FUNCTION_getSendSocketMessage(sid, content, isGroup, msgType, groupObj, cid) {
  if (groupObj) {

    var mineObj = app.webSocketsData.mineObj;
    var aiObj = app.webSocketsData.aiObj;

    var messageClientBo = {}
    var messageClientData = {}
    var messageClientMine = {}
    var messageClientTo = {}
    //
    messageClientMine.nickname = mineObj.nickName;
    messageClientMine.username = mineObj.username;
    messageClientMine.avatar = mineObj.avatar;
    messageClientMine.id = mineObj.id;
    messageClientMine.mine = true;
    messageClientMine.character = groupObj.character;
    
    messageClientMine.content = content ? content : '';
    messageClientMine.sid = sid;
    messageClientMine.cid = cid ? cid : "";
    //
    messageClientTo.id = groupObj.id;
    messageClientTo.name = groupObj.groupname;
    messageClientTo.avatar = groupObj.avatarTmp;
    messageClientTo.sign = cid ? cid : "";
    messageClientTo.username = groupObj.groupname;
    messageClientTo.nickName = groupObj.groupname;
    messageClientTo.type = isGroup ? "group" : "friend";
    //
    messageClientData.mine = messageClientMine;
    messageClientData.to = messageClientTo;
    
    messageClientBo.type = msgType == 0 ? 'normal' : 'messageId';
    messageClientBo.data = messageClientData;

    return messageClientBo;

  }
}

function FUNCTION_getCusid () {
  // 大小写字母和数字
  var str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  // 生成30位随机字符串
  var cusidLength = 30, cusid = '';
  for (var i = 0; i < cusidLength; i++) {
    var oneStr = str.charAt(Math.floor(Math.random() * str.length));
    cusid += oneStr;
  }
  return cusid;
}

//给其他地方调用，需要暴露接口
module.exports.FUNCTION_getCusid = FUNCTION_getCusid
module.exports.FUNCTION_getSendSocketMessage = FUNCTION_getSendSocketMessage
module.exports.FUNCTION_getSendAISocketMessage = FUNCTION_getSendAISocketMessage
module.exports.FUNCTION_createGroupModel = FUNCTION_createGroupModel