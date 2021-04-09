//引入公共js文件
const common = require('../public/common.js')
//获取应用实例
const app = getApp()
var windowHeight = 0;// 页面总高度将会放在这里 

Page({

  /** 
   * 页面的初始数据 
   */
  data: {
    list: [
      { name: '基本信息'},
      { name: '工单轨迹'},//数据后面屏蔽 
    ],
    selectName: '基本信息',
    itemLine: false,
    // scroll-view的高度 
    scrollViewHeight: 0,

    // 上个界面传过来的参数
    parameter: {}, // orderID
    //1待评价 2处理中 3已评价
    personOrderType: "",

    questionDetailBaseModel: {},
    groupId: "",
    showCuidan: false,

		imgFilePathArray: [],
    informationDataArray: [
      // {
      //   title: "公共信息",
      //   isShow: true,
      //   showTitle: "收缩",
      //   showImgName: "../images/personaltalk/arrow_up.png",
      //   imageName: "../images/personaltalk/project_data.png",
      //   contentArray: [
      //       {
      //           title: "问题标题:",
      //           content: "处理处理处理处理处理处理处理处理处理处理",
      //           businessNumber: false,
      //       },
      //   ],
      //   imgDataArray: [
      //       {
      //         "src":"../images/personaltalk/project_data.png"
      //       },
      //       {
      //         "src":"../images/personaltalk/project_data.png"
      //       }
      //   ]
      
      // },
    ], 
    
    trajectoryDataArray: [
      // {
      //   step: "11",
      //   contentArray: [
      //     {
      //       title: "问题标题:",
      //       content: "处理处理处理处理处理处理处理处理处理处理",
      //       isPhone: false,
      //     },
      //     {
      //       title: "问题标题:",
      //       content: "处理处理处理处理处理处理处理处理处理处理",
      //       isPhone: false,
      //     },
      //     {
      //       title: "问题标题:",
      //       content: "处理处理处理处理处理处理处理处理处理处理",
      //       isPhone: false,
      //     },
      //     {
      //       title: "问题标题:",
      //       content: "13593293929",
      //       isPhone: true,
      //     },
      //     {
      //       title: "问题标题:",
      //       content: "处理处理处理处理处理处理处理处理处理处理",
      //       isPhone: false,
      //     },
      //   ]
      // }
    ],

  },

  /** 
   * 生命周期函数--监听页面加载 
   */
  onLoad: function (options) {
    console.log(options)
    
    // 还没初始化上个界面传过来的参数
    if (this.data.personOrderType.length == 0) {
      this.setData({
        personOrderType: options.personOrderType,
        parameter: JSON.parse(options.parameter)
      })
    }

    wx.getSystemInfo({
      success: function (res) {
        windowHeight = res.windowHeight
      }
    });
    // 然后取出top的高度 
    // 根据文档，先创建一个SelectorQuery对象实例 
    let query = wx.createSelectorQuery().in(this);
    // 然后取出ntop的节点信息 
    // 选择器的语法与jQuery语法相同 
    query.select('#topView').boundingClientRect();
    // 执行上面所指定的请求，结果会按照顺序存放于一个数组中，在callback的第一个参数中返回 
    query.exec((res) => {
      // 取出top的高度 
      let topHeight = res[0].height;
      // 然后就是做个减法 
      let scrollViewHeight = windowHeight - topHeight;
      // 算出来之后存到data对象里面 
      this.setData({
        scrollViewHeight: scrollViewHeight
      });
    });

  },

  /** 
   * 生命周期函数--监听页面初次渲染完成 
   */
  onReady: function () {

    this.loadBaseInfo();
    this.loadOrderTrackData();
    this.loadPicData();

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

  // 点击展开收缩
  greet: function (event) {
    console.log("点击展开" + event.target.dataset.index) //事件传递参数

    var informationDataArray = this.data.informationDataArray
    var obj = informationDataArray[event.target.dataset.index]
    obj.isShow = !obj.isShow

    if (obj.isShow) {
      obj.showTitle = "收缩"
      obj.showImgName = "../images/personaltalk/arrow_up.png"
    }
    else {
      obj.showTitle = "展开"
      obj.showImgName = "../images/personaltalk/arrow_down.png"
    }

    this.setData({
      informationDataArray: informationDataArray,
    })

  },

  // 点击查看图片
  photo: function (event) {
    console.log("点击查看图片" + event.target.dataset.src) //事件传递参数
    wx.previewImage({
      current: event.target.dataset.src, // 当前显示图片的http链接
      urls: [event.target.dataset.src] // 需要预览的图片http链接列表
    })
  },

  // 拨打电话
  callPhone: function (event) {
    console.log("拨打电话" + event.target.dataset.phone) //事件传递参数
    var phone = parseInt(event.target.dataset.phone)

    if (!isNaN(phone)) {
      wx.makePhoneCall({
        phoneNumber: phone.toString(), //此号码并非真实电话号码，仅用于测试
        success: function () {
          console.log("拨打电话成功！")
        },
        fail: function () {
          console.log("拨打电话失败！")
        }
      })
    }
  },

  /** 
   * 页面切换 
   */
  switchPage: function (event) {
    var selectName = event.currentTarget.dataset.name;
    if (selectName !== this.data.selectName) {
      var itemLine = !this.data.itemLine
      this.setData({
        selectName: selectName,
        itemLine: itemLine,
      })
    }
  },
  
  // 基本信息
  loadBaseInfo: function () {

    var that = this
    var content = {
      staffId: app.staffInfo.staffId,
      orderId: that.data.parameter.orderId
    };
    var params = {
      method: "executeJson",
      content: {
        param: content,
        method: "proOrderMonitorService@qryPrOrderDetail"
      }
    };

    common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (response) {
      var resultcode = parseInt(response.resultCode)
      if (resultcode == 0) {

        var data = response.resultData
        that.setData({
          questionDetailBaseModel: data,
          groupId: data.groupId,
          showCuidan: true,
        })
        
        // 查询未读数量
        // if (listItemData.mType !== "3") {
        //   queryUnread(data.groupId);
        // }

        var dict1 = {
          "orderTitle": "问题标题:",
          "workStep": "当前环节:",
          "workOrderState": "问题状态:",
          "orderCode": "问题编号:",
          "staffName": "处理人姓名:",
          "mobileTel": "处理人电话:"
        };
        var dict2 = {
          "distillStaffName": "发起人姓名:",
          "distillStaffCode": "发起人编号:",
          "distillOrgName": "发起人部门:",
          "distillMobileTel": "发起人电话:",
          "createDate": "问题发起时间:",
          "workOneLevel": "问题一级类型:",
          "workTwoLevel": "问题二级类型:",
          "prDesc": "问题详情描述:"
                /*,
                "relAccNbrs":"业务号码:",
                "relOrderCodes":"业务单号:"*/};

        var dataArray = new Array();
        var obj1 = new Object();
        obj1.title = "公共信息"
        obj1.isShow = true;
        obj1.showTitle = "收缩";
        obj1.showImgName = "../images/personaltalk/arrow_up.png";
        obj1.imageName = "../images/personaltalk/project_data.png";

        var obj2 = new Object();
        obj2.title = "发起信息"
        obj2.isShow = true;
        obj2.showTitle = "收缩";
        obj2.showImgName = "../images/personaltalk/arrow_up.png";
        obj2.imageName = "../images/personaltalk/project_data.png";

        var contentArray1 = new Array();
        for (var key in dict1) {
          var title = dict1[key];
          var content = data[key];
          // 判断是否为null
          if (!content && typeof(content) != "undefined") {
            content = ""
          }

          var item = new Object();
          item.title = title;
          item.content = content;
          item.businessNumber = false;

          contentArray1.push(item);
        }
        obj1.contentArray = contentArray1;
        dataArray.push(obj1);

        var contentArray2 = new Array();
        for (key in dict2) {
          var title = dict2[key];
          var content = data[key];

          // 判断是否为null
          if (!content && typeof(content) != "undefined") {
            content = ""
          }
          
          var item = new Object();
          item.title = title;
          item.content = content;
          item.businessNumber = false;

          if (key == "relOrderCodes") {
            item.businessNumber = true;
          }

          contentArray2.push(item);
        }
        obj2.contentArray = contentArray2;
        if (that.data.imgFilePathArray.length > 0) {
					obj2.imgDataArray = that.data.imgFilePathArray;
        }
        dataArray.push(obj2);

        // 刷新视图
        that.setData({
          informationDataArray: dataArray,
        })
        
      }
      else {
        wx.showToast({
          title: response.resultMsg,
          icon: 'none'
        })
      }
    
    });
  },
  // 工单轨迹
  loadOrderTrackData: function () {
    
    var that = this
    var content = {
      staffId: app.staffInfo.staffId,
      orderId: that.data.parameter.orderId
    };
    var params = {
      method: "executeJson",
      content: {
        param: content,
        method: "proOrderMonitorService@qryPrOrderTrack"
      }
    };

    common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (response) {

      var resultcode = parseInt(response.resultCode)
      if (resultcode == 0) {
        var data = response.resultData

        var contentArray = {
          "createDate": "执行时间:",
          "operContent": "描述:",
          "operTypeName": "操作类型:",
          "responStaffMobileTel": "联系电话:",
          "trackOrgName": "反馈组织:",
          "trackStaffName": "反馈人:",
          "workResult": "备注:"
        };
        var dataArray = new Array();
        for (var i = 0; i < data.length; i++) {
          var obj = data[i];

          var item = new Object();
          var itemArray = new Array();
          for (var key in contentArray) {
            var value = contentArray[key];

            var contentObj = new Object();
            contentObj.title = value;
            contentObj.content = obj[key];
            // 判断是否为null
            if (!contentObj.content && typeof (contentObj.content) != "undefined") {
              contentObj.content = ""
            }

            if (key == "responStaffMobileTel") {
              contentObj.isPhone = true;
            }
            else {
              contentObj.isPhone = false;
            }

            itemArray.push(contentObj);
            item.step = (i + 1).toString();
            item.contentArray = itemArray;
          }

          dataArray.push(item)

        }

        that.setData({
          trajectoryDataArray: dataArray,
        })

      }
      else {
        wx.showToast({
          title: response.resultMsg,
          icon: 'none'
        })
      }
    
    });
  },
  // 工单图片
  loadPicData: function () {
    var that = this
    var content = {
        staffId: app.staffInfo.staffId,
        orderId: that.data.parameter.orderId
    };
    var params = {
      method: "executeJson",
      content: {
        param: content,
        method: "proOrderMonitorService@qryDetailPhotos"
      }
    };

    common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (response) {
      var resultcode = parseInt(response.resultCode)
      if (resultcode == 0) {
        var data = response.resultData

        var filePaths = new Array();
        for (var i = 0; i < data.length; i++) {
          var obj = data[i];
          var filePath = obj[filePath];
          var newObj = { "src": filePath };

          filePaths.push(newObj);
        }

        // 基本信息先请求了
        var informationDataArray = that.data.informationDataArray
        if (informationDataArray.length > 0) {
          var obj = informationDataArray[1];
          obj.imgDataArray = filePaths;

          // 刷新视图
          that.setData({
            informationDataArray: informationDataArray,
          })

        }
        // 基本信息后请求  添加到全局变量存起来
        else {
					that.setData({
						imgFilePathArray: filePaths
					})
        }

      }
      else {
        wx.showToast({
          title: response.resultMsg,
          icon: 'none'
        })
      }

    });
  },

	// 点击跳转到群聊
	session: function () {
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

		// 找到了该组 跳转到聊天界面
		if (group) {
			
			// 清空未读消息 刷新界面
			group.unreadNum = 0;

			var displayGroupList = app.newsView.data.displayGroupList
			app.newsView.setData({
				selectChatItem: group,
				displayGroupList: displayGroupList
			})

			var parameter = JSON.stringify(group)
			wx.navigateTo({
				url: '../ai/aiChat?parameter=' + parameter
			})
		}
		else {
			wx.showToast({
				title: '未找到相应的讨论组',
				icon: 'none'
			})
			console.log("没找到对应的群组ID", groupId);
		}
	},

  // 点击催单
  cuidan: function () {

    var that = this
    var _workOrderId = that.data.parameter.workOrderId
    var groupId = that.data.groupId
    if (this.data.personOrderType === "1") {
      console.log(app.userInfo)
      var params = { groupId: groupId };
      // 获取组名字
      common.FUNCTION_POST_REQUEST(params, common.URL_AI_QUERY_GROUP_INFO(), function (response) {

        var resultcode = parseInt(response.code)
        if (resultcode == 0) {
          var data = response.data

          data.id = data.groupId;
          data.groupname = data.groupName;
          data.type = "group";
          data.username = data.founderName;

          var datas = {
            workOrderId: _workOrderId,
            groupId: groupId,
            groupName: data.groupname
          };

          var parameter = JSON.stringify(datas)
          wx.navigateTo({
            url: '../personaltransferred/personaltransferred?parameter=' + parameter
          }) 
        
        }
        else {
          wx.showToast({
            title: response.resultDesc,
            icon: 'none'
          })
        }

      }); 

    } 
    else if (this.data.personOrderType === "2") {
      wx.showModal({
        title: '提示',
        content: '是否确定催单?',
        success(res) {
          if (res.confirm) {
            console.log('用户点击确定')
            that.requestUrgeOrder(); // 确定催单
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }

  },

  // 确定催单
  requestUrgeOrder: function () {
    var that = this
    var _workOrderId = that.data.parameter.workOrderId
    var _orderID = that.data.parameter.orderID

    var content = {
      staffId: app.staffInfo.staffId,
      workOrderId: _workOrderId,
      orderId: _orderID,
      comments: "APP发起催单",
      jobId: app.currentJob.jobId
    };

    var params = {
      method: "executeJson",
      content: {
        param: content,
        method: "proOrderMonitorService@qryWorkOrderListCount"
      }
    };

    common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (response) {

      var resultcode = parseInt(response.resultCode)
      if (resultcode == 0) {
        wx.showToast({
          title: "催单成功！",
        })
      }
      else {
        wx.showToast({
          title: response.resultMsg,
          icon: 'none'
        })
      }

    });
  },

  // 跳转到订单详情页面
  goBusinessdetails: function () {

  }
  
})