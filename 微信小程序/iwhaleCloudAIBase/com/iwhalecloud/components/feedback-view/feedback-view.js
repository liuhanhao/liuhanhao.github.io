const common = require('../../public/common.js')
let app = getApp()

Component({
  /**
   * 组件的属性列表
   * 用于组件自定义设置
   */
	properties: {
		// 组的提交评价
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
		defaultText: '', // 输入框的默认文本
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

		},
		// 输入框事件
		bindKeyInput: function (e) {
			this.setData({
				defaultText: e.detail.value,
			})
		},

		hideFeedbackView() {
			//触发外部的消失回调函数
			this.triggerEvent("hideFeedbackView")
			// 回归初始值
			this.setData({
				defaultText: '',
			})

		},

		// 提交反馈
		submitButtonAction() {
			// 关闭窗口
			// this.triggerEvent("hideFeedbackView")
			console.log(this.properties.order)

			var spOrderId = this.properties.order.spOrderId 
			var mobileTel = this.properties.order.mobileTel 
			var operContent = this.data.defaultText

			var params = { operTypeId: "236", 
			partyType: "STA", 
			contactPhone: mobileTel, 
			orderId: spOrderId, 
			finishType: "2", 
			workResult: "留言", 
			partyId: app.staffInfo.staffId, 
			partyName: app.staffInfo.staffName, 
			partyOrgId: app.currentJob.orgId, 
			partyOrgName: app.currentJob.orgName, 
			operContent: operContent }

			var contentData = { param: params, method: "addSpOrderOperTrack" }
			var postData = { content: contentData }

			var that = this
			common.FUNCTION_POST_REQUEST(postData, common.MOBILE_POINT_URL(), function (response) {

				var resultcode = parseInt(response.resultCode)
				if (resultcode == 0) {
					var data = response.resultData

					wx.showToast({
						title: '提交反馈成功',
					})

					//触发外部的消失回调函数
					that.triggerEvent("hideFeedbackView")
					// 回归初始值
					that.setData({
						defaultText: '',
					})

				}
				else {
					wx.showToast({
						title: response.resultMsg,
						icon: 'none'
					})
				}

			});

		}
	}
})