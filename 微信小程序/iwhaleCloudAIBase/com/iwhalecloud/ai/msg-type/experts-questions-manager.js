import IMOperator from "../im-operator";
let AIEvaluation = require("./evaluation-manager.js");

let app = getApp()

export default class ExpertsQuestionsManager {
	constructor(page) {
		this._page = page;

		var that = this

		// 点击了热点问题的cell
		this._page.tapHotQuestionsItem = function (event) {
			if (that.conversionSuccessful()) {
				var question = event.currentTarget.dataset.question;
				var questionCode = question.questionCode;

				// 保存最新的 questionCode
				that._page.setData({
					questionCode: questionCode,
				})
				// 在aichat.js发送文本
				var type = IMOperator.TextType
				var content = question.questionName
				that._page.sendTextMessage({ type, content })
			}

		}

		// 子问题点击加载更多
		this._page.tapSubQuestionsLoadMore = function (event) {
			if (that.conversionSuccessful()) {
				var questions = event.currentTarget.dataset.questions
				var index = event.currentTarget.dataset.index

				// 回主界面调用加载问题的接口
				that._page.loadMoreSubQuestions({ questions, index })
			}

		}

		// 选择了专家组
		this._page.selectExpertGroup = function (event) {
			if (that.conversionSuccessful()) {
				var expertGroup = event.currentTarget.dataset.expertGroup
				var groupId = expertGroup.groupId
				var groupName = expertGroup.groupName

				// 保存专家组ID到主页面 转人工的时候可能会用到
				that._page.setData({
					uosUserGroupId: groupId
				})
				// 加载专家
				that._page.loadExpertsList({ uosUserGroupId: groupId, allExpertsList: false })
			}
			
		}

		// 选择了专家
		this._page.selectExpert = function (event) {
			if (that.conversionSuccessful()) {
				var expert = event.currentTarget.dataset.expert
				var staffId = expert.staffId // 专家ID
				var groupName = expert.groupName
				var staffName = expert.staffName
				
				// 发起转人工
				that._page.sendNewOrderRequestWithExpertsID({ expertsStaffId: staffId })
			}

		}

		// 点击了自动分配专家
		this._page.automaticAssignmentExpert = function (event) {
			if (that.conversionSuccessful()) {
				var expert = event.currentTarget.dataset.experts

				// 发起转人工  expertsStaffId 不传  由系统自动选择
				that._page.sendNewOrderRequestWithExpertsID({ expertsStaffId: "" })
			}

		}

		// 点击了加载全部专家
		this._page.loadAllExpert = function (event) {
			if (that.conversionSuccessful()) {
				var expert = event.currentTarget.dataset.experts

				that._page.loadExpertsList({ questionCode: that._page.data.questionCode, allExpertsList: true })
			}

		}

		/** 评价的model
		 * var obj = {
				radioItems: [{name:'1', value:'解决', checked:"true"},{name: '0', value: '没解决',checked:"false" }],
				isSolve: '1',
				rateNum: 5
				}
		 */
		
		// 提交评价
		this._page.submitEvaluation = function (event) {
			var index = event.currentTarget.dataset.index

			var chatItems = that._page.data.chatItems
			var item = chatItems[index]

			
			AIEvaluation.submitEvaluation({ 
						dealSatis: item.experts.rateNum, 
						groupId: that._page.data.group.id, 
						workOrderId: null, 
						auditResult: item.experts.isSolve, 
						discontentReason: item.experts.satisfiedContent,
						// 评价成功 删除那个评价item 并且不能再进行聊天 isSolve是否选择了解决
						success: function (isSolve) {
							var chatItems = that._page.data.chatItems
							chatItems.splice(that._page.data.evaluationIndex, 1);
							// 刷新列表
							that._page.setData({
								// 如果选择了未解决  那么可以继续聊天，
								evaluationed: isSolve,// 已经评价成功的标志位
								chatItems: chatItems,
							})
							
							// 并且列表的评价状态变为10I
							if (isSolve == false) {
								// 刷新列表中工单状态
								var selectChatItem = app.newsView.data.selectChatItem
								app.newsView.changeGroupEvaluationStatus(selectChatItem)
							}

						}})

		}
		// 评价点击了星星的数量
		this._page.rateClick = function (event) {
			var index = event.currentTarget.dataset.index
			var rateNum = event.currentTarget.dataset.rateNum

			var chatItems = that._page.data.chatItems
			var item = chatItems[index]
			item.experts.rateNum = rateNum

			// 刷新item
			that._page.setData({
				chatItems: chatItems
			})

		}
		// 未解决的原因
		this._page.popoverListClick = function (event) {
			var index = event.currentTarget.dataset.index
			var chatItems = that._page.data.chatItems
			var item = chatItems[index]

			var itemList = []
			for (var i = 0; i < item.experts.reasons.length; i++) {
				var discontentReason = item.experts.reasons[i].discontentReason
				itemList.push(discontentReason)
			}

			wx.showActionSheet({
				itemList: itemList,
				success(res) {
					item.experts.satisfiedContent =  itemList[res.tapIndex]
					// 刷新item
					that._page.setData({
						chatItems: chatItems
					})
				},
				fail(res) {
					console.log(res.errMsg)
				}
			})
		}
		// 评价选择解决和未解决
		this._page.radioChange = function (event) {
			console.log('radio发生change事件，携带value值为：', event.detail.value)
			var index = event.currentTarget.dataset.index
			
			var chatItems = that._page.data.chatItems
			var item = chatItems[index]
			
			item.experts.isSolve = event.detail.value
			if (event.detail.value == '1') {
				item.experts.radioItems = [{ name: '1', value: '解决', checked: "true" }, { name: '0', value: '没解决'}]
			}
			else {
				item.experts.radioItems = [{ name: '1', value: '解决'}, { name: '0', value: '没解决', checked: "true" }]
			}

			var chatItems = that._page.data.chatItems
			// 刷新item
			that._page.setData({
				chatItems: chatItems
			})
		}

	}

	/**
	 * 主界面是否转人工成功了如果成功了 小蜜的所有item都不能点击
	 */
	conversionSuccessful() {
		return this._page.data.conversionSuccessful != true
	}

	/**
	 * 接收到消息时，通过UI类的管理进行渲染
	 * param msg 接收到的消息。
	 */
	showMsg({ msg }) {
		var that = this
		var message = null
		if (msg.type == IMOperator.Artificial) {
			message = this.createArtificialMessage(msg, { content: msg.content })
			// 只能加载一个卡片
			this._page.setData({
				isFirstNewUserList: true,
			})
		}
		else if (msg.type == IMOperator.Evaluation) {
			
			var evaluationObject = {
				radioItems: [{ name: '1', value: '解决', checked: "true" }, { name: '0', value: '没解决'}], 
				isSolve: '1', 
				rateNum: 5,
				satisfiedContent: "",
				reasons: [], //discontentReason:"处理时间较久"  reasonId:1
				isShowSolveView: true,
			}

			// 是否显示解决为解决
			AIEvaluation.getShowSolveView(function (isShowSolveView) {
				// 这里有可能是异步回调
				evaluationObject.isShowSolveView = isShowSolveView

				var chatItems = that._page.data.chatItems
				// 刷新item
				that._page.setData({
					chatItems: chatItems
				})
				
			})
			// 加载不满意的原因
			AIEvaluation.getReasons(function (reasons) {
				// 这里有可能是异步回调
				evaluationObject.reasons = reasons
				evaluationObject.satisfiedContent = reasons[0].discontentReason

				var chatItems = that._page.data.chatItems
				// 刷新item
				that._page.setData({
					chatItems: chatItems
				})
				
			})

			// 显示出来
			message = this.createArtificialMessage(msg, evaluationObject)
			// 保存到主界面 因为只能弹出来一个 并且不能发送消息了
			this._page.setData({
				evaluationed: true,// 已经评价成功的标志位
				evaluationIndex: that._page.data.chatItems.length,
				evaluationObject: evaluationObject,
			})
		}
		else {
			message = this.createExpertsQuestionsMessage(msg)
		}

		//显示这个item
		this._page.UI.updateViewWhenReceive(message);
	}
	// 创建转人工成功的item
	createArtificialMessage(msg, experts) {
		// 拿到小蜜的组
		var group = this._page.data.group
		let obj = {
			groupId: group.id,//id
			// 是谁发的消息
			characterName: "",
			isMy: false,//我发送的消息？
			showTime: false,//是否显示该次发送时间
			time: "",//发送时间 如 09:15,
			timestamp: "",//该条数据的时间戳，一般用于排序
			type: msg.type,//内容的类型，目前有这几种类型： text/voice/image/custom | 文本/语音/图片/自定义
			content: msg.content,// 显示的内容，根据不同的类型，在这里填充不同的信息。
			headUrl: "",//显示的头像，自己或好友的。

			experts: experts, // 显示的item

		};

		return obj;
	}
	// 创建热点问题 热点子问题 专家选择 坐席选择的item
	createExpertsQuestionsMessage(msg) {

		var requestObject = msg.requestObject

		var experts = []
		var questions = {}
		// 热点问题
		if (msg.type == IMOperator.HotQuestions) {
			questions = requestObject

		}
		// 热点子问题
		else if (msg.type == IMOperator.HotSubQuestions) {
			questions = requestObject
		}
		// 专家选择
		else if (msg.type == IMOperator.ExpertsSelect) {
			experts = requestObject
		}
		// 专家坐席选择
		else if (msg.type == IMOperator.ExpertsSeatSelect) {
			experts = requestObject
		}
 
		// 拿到小蜜的组
		var group = this._page.data.group
		let obj = {
			groupId: group.id,//id
			// 是谁发的消息
			characterName: (group.nickName ? group.nickName : group.username),
			isMy: false,//我发送的消息？
			showTime: false,//是否显示该次发送时间
			time: "",//发送时间 如 09:15,
			timestamp: "",//该条数据的时间戳，一般用于排序
			type: msg.type,//内容的类型，目前有这几种类型： text/voice/image/custom | 文本/语音/图片/自定义
			content: msg.content,// 显示的内容，根据不同的类型，在这里填充不同的信息。
			headUrl: group.avatar,//显示的头像，自己或好友的。
			
			experts: experts, // 专家选择 或者坐席选择
			questions: questions, // 大问题 子问题

		};
		
		return obj;
	}

	getImageNameWithQuestionsName(questionsName)  {

		if (questionsName == "系统异常") {
			return "../images/ai/main_question_0.png"//"jidingge";
		}
		else if (questionsName == "账号异常") {
			return "../images/ai/main_question_1.png"//"xzzhanghu";
		}
		else if (questionsName == "资源错误") {
			return "../images/ai/main_question_2.png"//"xzyichang";
		}
		else if (questionsName == "激活失败") {
			return "../images/ai/main_question_3.png"//"guangmao";
		}
		else if (questionsName == "终端问题") {
			return "../images/ai/main_question_4.png"//"IPTVwufa";
		}
		else if (questionsName == "客户沟通") {
			return "../images/ai/main_question_5.png"//"shipinbofang";
		}
		else if (questionsName == "工单信息错误") {
			return "../images/ai/main_question_6.png"//"xianlusunhuai";
		}
		else if (questionsName == "其他问题") {
			return "../images/ai/main_question_6.png"//"xianlusunhuai";
		}
		else {
			return "../images/ai/main_question_6.png"//"xianlusunhuai";
		}

	}
	
	
}
