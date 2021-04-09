const common = require('../../public/common.js')

const app = getApp()
var Reasons = []
var showSolveView = -1

function	getReasons(success) {
		if (Reasons.length > 0) {
			success && success(Reasons)
		}
		else {
			this.requsetSatisfiedReason(success)
		}
	}

	//问题单-办结确认-是否展示解决和未解决按钮,Y:展示;其他:不展示
function	getShowSolveView(success) {
		if (showSolveView == -1) {
			this.requsetShowButton(success)
		}
		else {
			success && success(showSolveView)
		}
	}

	// 请求不满意的原因
function	requsetSatisfiedReason(success) {
		var that = this
		var postDict = {}
		var content = {}
		var param = {}

		content["param"] = param
		content["method"] = "prOrderOperTrackManagerService@qryDisContentReason"
		postDict["method"] = "executeJson"
		postDict["content"] = content

		common.FUNCTION_POST_REQUEST(postDict, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					Reasons = response.resultData
				}
				
				success && success(Reasons)

		},
		// 请求失败了
		() => {
			// wx.showToast({
			// 	title: '加载专家坐席失败',
			// 	icon: 'none',
			// })
		})
	}

	// 办结确认解决未解决按钮是否展示开关
function	requsetShowButton(success) {
		var that = this
		var postDict = {}
		var content = {}
		var param = {}

		content["param"] = param
		content["method"] = "parameterManagerService@findParameter"
		postDict["method"] = "executeJson"
		postDict["content"] = content

		common.FUNCTION_POST_REQUEST(postDict, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					var resultData = response.resultData

					showSolveView = resultData.value == "Y" ? true : false
				}

				success && success(showSolveView)

			},
			// 请求失败了
			() => {
				// wx.showToast({
				// 	title: '加载专家坐席失败',
				// 	icon: 'none',
				// })
			})
	}

	/**
	 * dealSatis 星星数量
	 * auditResult 是否已解决
	 * discontentReason 不满意原因
	 * success
	 * fail
	 */
function	submitEvaluation({ dealSatis = 5, groupId = null, workOrderId = null, auditResult = 1, discontentReason = "", success }) {
		var that = this

		var comments = ["吐槽", "较差", "一般", "满意", "十分满意"];

		var postDict = {}
		var content = {}
		var param = {}
		param["jobId"] = app.currentJob.jobId
		param["deviceId"] = app.getDeviceId()
		param["staffId"] = app.staffInfo.staffId
		if (groupId != null) {
			param["workOrderId"] = ""
			param["groupId"] = groupId
		}
		else if (workOrderId != null) {
			param["workOrderId"] = workOrderId
			param["groupId"] = ""
		}

		param["auditResult"] = auditResult
		param["dealSatis"] = dealSatis
		param["comments"] = comments[dealSatis - 1]
		param["discontentReason"] = discontentReason

		content["param"] = param
		content["method"] = "prWorkOrderManagerService@auditPrWorkOrder"
		postDict["method"] = "executeJson"
		postDict["content"] = content

		common.FUNCTION_POST_REQUEST(postDict, common.URL_AI_HTTP_EXPERTS_LIST(),
			// 请求成功
			(response) => {
				if (parseInt(response.resultCode) == 0) {
					var resultData = response.resultData

					wx.showToast({
						title: '提交评价成功',
						icon: 'none',
					})
					
					success && success(auditResult == "1" ? true : false)
					
				}
				else {
					wx.showToast({
						title: '提交评价失败',
						icon: 'none',
					})
				}

			},
			// 请求失败了
			() => {
				wx.showToast({
					title: '提交评价失败',
					icon: 'none',
				})
			})
	}

module.exports = {
	getReasons: getReasons,
	getShowSolveView: getShowSolveView,
	requsetSatisfiedReason: requsetSatisfiedReason,
	requsetShowButton: requsetShowButton,
	submitEvaluation: submitEvaluation,
};