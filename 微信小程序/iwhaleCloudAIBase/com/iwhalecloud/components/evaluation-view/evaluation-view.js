let AIEvaluation = require("../../ai/msg-type/evaluation-manager.js")

Component({
  /**
   * 组件的属性列表
   * 用于组件自定义设置
   */
	properties: {
		// 组的提交评价
		group: {
			type: Object,
			value: {}
		},
		// 工单的提交评价
		order: {
			type: Object,
			value: {}
		},
		success: {
			type: Function,
			value: {}
		}, 
		isShow: {
			type: Boolean,
			value: false
		},
	},

  /**
   * 私有数据,组件的初始数据
   * 可用于模版渲染
   */
	data: {
		radioItems: [
			{ name: 'default', value: '解决', checked: 'true' },
			{ name: 'unSolve', value: '没解决' }
		],
		isSolve: true, // 显示星星
		rateNum: 5,
		satisfiedContent: "",
		reasons: [], //discontentReason:"处理时间较久"  reasonId:1
		isShowSolveView: true,
	},

	// 组件所在页面的生命周期函数
	pageLifetimes: {
		show() {
			this.onLoad()
		},
		hide() { },
		resize() { },
	},

  /**
   * 组件的方法列表
   * 更新属性和数据的方法与更新页面数据的方法类似
   */
	methods: {
		// 加载该组件
		onLoad() {

			// 是否显示解决为解决
			var that = this
			AIEvaluation.getShowSolveView(function (isShowSolveView){
				that.setData({
					isShowSolveView,
				})
			}) 
			// 加载不满意的原因
			AIEvaluation.getReasons(function (reasons) {
				that.setData({
					satisfiedContent: reasons[0].discontentReason,
					reasons,
				})
			})

		},
		

		hideEvaluationView() {
			//触发外部的消失回调函数
			this.triggerEvent("hideEvaluationView")
			// 回归初始值
			this.setData({
				radioItems: [
					{ name: 'default', value: '解决', checked: 'true' },
					{ name: 'unSolve', value: '没解决' }
				],
				rateNum: 5,
				isSolve: true,
			})

		},

		// 选择解决和未解决
		radioChange(e) {
			console.log('radio发生change事件，携带value值为：', e.detail.value)
			this.setData({
				isSolve: !this.data.isSolve,
				showReasons: false
			})
		},

		// 不满意的原因
		popoverListClick: function () {
			var that = this

			var itemList = [] 
			for (var i = 0; i < that.data.reasons.length; i++) {
				var discontentReason = that.data.reasons[i].discontentReason
				itemList.push(discontentReason)
			}

			wx.showActionSheet({
				itemList: itemList,
				success(res) {

					that.setData({
							satisfiedContent: itemList[res.tapIndex],
					})

				},
				fail(res) {
					console.log(res.errMsg)
				}
			})

		},

		// 点击星星
		rateClick(event) {
			var rateNum = event.currentTarget.dataset.index
			this.setData({
				rateNum: rateNum,
			})
			
		},

		// 提交评价
		submitButtonAction() {
			var group = this.properties.group
			var order = this.properties.order
			var rateNum = this.data.rateNum
			console.log("点击了提交评价",group, order)

			var workOrderId = order ? order.workOrderId : null
			var groupId = group ? group.id : null
			AIEvaluation.submitEvaluation({ dealSatis: rateNum,
			  groupId, 
				workOrderId,
			  auditResult: this.data.isSolve ? 1 : 0, 
			  discontentReason: this.data.satisfiedContent, 
				success: this.properties.success
			})

		},

	}
})