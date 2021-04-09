//引入公共js文件
const common = require('../public/common.js')
const sockUtil = require('../public/sockUtil.js')

//获取应用实例
const app = getApp()
var windowHeight = 0;// 页面总高度将会放在这里 

var groupId;
var groupName;

Page({
  data: {
    //0驳回 1归档
    type: 1,
    items: [
      { name: 0, value: '驳回' },
      { name: 1, value: '归档', checked: 'true' },
    ],


    // 上个界面传过来的参数
    parameter: null,
    satisfiedContent: "满意",
    spinerValue: 1,//0不满意 1满意
    comments: "", //备注
  },
  
  /** 
   * 生命周期函数--监听页面加载 
   */
  onLoad: function (options) {

    if (options.parameter && !this.parameter) {
      var parameter = JSON.parse(options.parameter)
      groupId = parameter.groupId
      groupName = parameter.groupName
      this.setData({
				ios: app.ios,
        parameter: parameter,
      });
    }

    wx.getSystemInfo({
      success: function (res) {
        windowHeight = res.windowHeight
      }
    });
    
  },

  /** 
   * 生命周期函数--监听页面初次渲染完成 
   */
  onReady: function () {
    
  },

  /** 
   * 生命周期函数--监听页面显示 
   */
  onShow: function () {

  },

  /** 
   * 生命周期函数--监听页面隐藏 
   */
  onHide: function () {

  },

  /** 
   * 生命周期函数--监听页面卸载 
   */
  onUnload: function () {

  },

  /** 
   * 页面相关事件处理函数--监听用户下拉动作 
   */
  onPullDownRefresh: function () {
    console.log("下拉刷新")
    
  },

  /** 
   * 页面上拉触底事件的处理函数 
   */
  onReachBottom: function () {

  },

  // 选择归档和驳回
  radioChange(e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    this.setData({
      type: e.detail.value,
    })
  },

  // 满意和不满意
  popoverListClick: function () {
    var that = this
    wx.showActionSheet({
      itemList: ["满意", "不满意"],
      success(res) {

        var satisfiedContent = ""
        var spinerValue = 0;
        if (res.tapIndex == 0) {
          satisfiedContent = "满意"
          spinerValue = 1
        }
        else if (res.tapIndex == 1) {
          satisfiedContent = "不满意"
          spinerValue = 0
        }
        
        that.setData({
          satisfiedContent: satisfiedContent,
          spinerValue: spinerValue
        })

      },
      fail(res) {
        console.log(res.errMsg)
      }
    })
    
  },

  // textarea失去焦点
  bindblur: function (event) {
    console.log(event.detail.value)
    this.setData({
      comments: event.detail.value
    })
  },

  // 提交
  makeBtnClick: function () {
    var that = this
    wx.showModal({
      title: '提示',
      content: '是否确定提交',
      success(res) {
        if (res.confirm) {
          that.submitRequest();
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
    
  },

  submitRequest: function () {

    var spinerValue = this.data.spinerValue
    if (spinerValue.length == 0) {
      wx.showToast({
        title: '请选择是否满意',
      })
    }
    else {

      var that = this
      var content = {
        staffId: app.staffInfo.staffId,
        workOrderId: that.data.parameter.workOrderId,
        auditResult: that.data.type,
        dealSatis: that.data.spinerValue,
        comments: that.data.comments,
        jobId: app.currentJob.jobId,
        deviceId: app.getDeviceId()
      };
      var params = {
        method: "executeJson",
        content: {
          param: content,
          method: "prWorkOrderManagerService@auditPrWorkOrder"
        }
      };

      common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (response) {

        var resultcode = parseInt(response.resultCode)
        if (resultcode == 0) {
          var data = response.resultData

          wx.showToast({
            title: '办结确认成功',
          })

          // 如果是驳回的 //发送”未解决“消息到群组socket
          if (that.data.type == 0) {
						that.sendMessage()
          }

          wx.navigateBack({
            delta: 2
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

	},

	//发送”未解决“消息到群组socket
	sendMessage: function () {
		var groupId = this.data.groupId
		var groupList = app.newsView.data.groupList

		var group = null
		for (var i = 0; i < groupList.length; i++) {
			var item = groupList[i]
			if (item.id == groupId) {
				group = item
				break
			}
		}

		// 找到了该组
		if (group) {
			var sid = sockUtil.FUNCTION_getCusid()
			// msgType 0文本 1文件
			var msgType = "text"
			// 是单聊还是群组
			var isGroup = group.type == 'friend' ? false : true
			var content = "未解决"
			var msgObj = sockUtil.FUNCTION_getSendSocketMessage(sid, content, isGroup, msgType, group, "")

			app.socketSendMessages(msgObj,
				// 发送成功
				function () {
					console.log("发送未解决成功")

					// 保存这个这条消息，给new.js的"callbackMsg"消息去刷新列表的显示
					var sendQueueItem = app.newsView.data.sendQueueItem
					sendQueueItem.push({ id: group.id, sid: sid, content: content })
					app.newsView.setData({
						sendQueueItem: sendQueueItem
					})

				},
				// 发送失败
				function () {
					console.log("发送未解决失败")
				}
			)
		}
		else {
			wx.showToast({
				title: '未找到相应的讨论组',
				icon: 'none'
			})
			console.log("没找到对应的群组ID 发不了未解决", groupId);
		}

	},


})