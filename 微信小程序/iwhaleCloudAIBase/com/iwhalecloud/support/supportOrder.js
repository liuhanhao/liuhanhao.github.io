//引入公共js文件
const common = require('../public/common.js')
//获取应用实例
const app = getApp()
var windowHeight = 0;// 页面总高度将会放在这里 

var personCurrentPageIndex = 1;
var personCurrentCount = 0;
var personTotalCount = 0;
var personPageSize = 10;
var personProductType = "";//1标题 2时间
var personSortField = "CREATE";

Page({

  /** 
   * 页面的初始数据 
   */
  data: {
    // scroll-view的高度 
    scrollViewHeight: 0,
    // 滚动到哪里
    scrollTop: 0,

    list: [
      { name: '处理中'},// 总待评价数量
      { name: '已处理'},
    ],
    selectName: '处理中',
    startTimeState: 0,
    searchValue: '',
    //1处理中 2已处理 
    personSortFieldDeal: "",
		personWorkState: "10I",//处理中工单的状态 10I处理中,10F已处理
    listBottomText: "无更多数据",
    avatarIcon: "../images/support/xzzhuangkuangdai.png",
    dataList: [
      // {
      // },
      // {
      // },
      // {
      // },
      // {
      // },
    ],

  },

  /** 
   * 生命周期函数--监听页面加载 
   */
  onLoad: function (options) {
    if (options.list && options.name) {
      this.setData({
        list: JSON.parse(options.list),
        selectName: options.name,
      });
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
    this.getPersonOrderListData(true)
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
    this.refreshData()
  },

  /** 
   * 页面上拉触底事件的处理函数 
   */
  onReachBottom: function () {

  },

  /** 
   * 页面切换 
   */
  switchPage: function (event) {
    var selectName = event.currentTarget.dataset.name;
		var personWorkState = ""

		var lineMarginLeft = "0%"
    if (selectName === "处理中") {
			personWorkState = "10I"
			lineMarginLeft = "0%"
    } else if (selectName === "已处理") {
      personWorkState = "10F"
			lineMarginLeft = "50%"
    }

    this.setData({
			lineMarginLeft: lineMarginLeft,
      selectName: selectName,
			personWorkState: personWorkState
    })

    this.refreshData(); // 刷新数据
			
  },

  /** 
   * 点击搜索 
   */
  searchEvent: function (e) {

    console.log(e.detail.value);
    this.setData({
      searchValue: e.detail.value,
    })

    this.refreshData(); // 刷新数据

  },

  // 加载更多数据
  requestMoreData: function () {

    if (personCurrentCount != 0) {
      if (personCurrentCount >= personTotalCount) {
        //无更多数据
      } else {
        //更多
        this.getPersonOrderListData(false);
      }
    }
    else {
      this.refreshData();
    }

  },

  // 拨打电话
  callPhone: function (event) {
    var item = event.currentTarget.dataset.item;
    var array = item.mobileTel.split(" ")
    var phone = parseInt(array[array.length - 1])

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

  // 到详情页面
  detailsDataView: function (event) {
    var item = event.currentTarget.dataset.item;
    var parameter = JSON.stringify(item)
		var personWorkState = this.data.personWorkState
    wx.navigateTo({
			url: '../supportDetails/supportDetails?parameter=' + parameter + "&personWorkState=" + personWorkState
    })
  },


  // 刷新列表
  refreshData: function () {
    personCurrentPageIndex = 1;
    personCurrentCount = 0;
    personTotalCount = 0;
    this.setData({
      dataList: []
    })

    this.getPersonOrderListData(true);
  },

  // 请求数据
  getPersonOrderListData: function (isRefresh) {

    var that = this

    var content = {
      staffId: app.staffInfo.staffId,
      // workCategory: that.data.personOrderType,
      keyType: personProductType,
      keyValue: that.data.searchValue,
      startTime: "",
      endTime: "",
      currentPage: personCurrentPageIndex,
      pageSize: personPageSize,
      sortField: personSortField,
      sortFieldDeal: that.data.personSortFieldDeal,
      orderState: that.data.personWorkState
    };
    var params = {
      method: "executeJson",
      content: {
        param: content,
        method: "qrySupportOrder"
      }
    };

    common.FUNCTION_POST_REQUEST(params, common.MOBILE_POINT_URL(), function (data) {

      wx.stopPullDownRefresh()
      var resultcode = parseInt(data.resultCode)
      if (resultcode == 0) {

        var resultdata = data.resultData
        if (resultdata) {
          for (var i in resultdata.dataList) {
						if (resultdata.dataList[i].avatar) {
							resultdata.dataList[i].avatarTmp = common.MOBILE_AVATAR_URL(resultdata.dataList[i].avatar);
						} else {
							resultdata.dataList[i].avatarTmp = that.data.avatarIcon;
						}

          }

          if (isRefresh) {

            that.setData({
              dataList: resultdata.dataList
            })
            // 微信滚动到顶部
            wx.pageScrollTo({
              scrollTop: 0
            })

          } else {
            var olddataList = that.data.dataList
            var newdataList = resultdata.dataList
            var dataList = olddataList.concat(newdataList)

            that.setData({
              dataList: dataList
            })

          }

          personCurrentPageIndex++; // 下一页
          personTotalCount = resultdata.totalCount;
          personCurrentCount = that.data.dataList.length;
          var listBottomText = ""
          if (personCurrentCount >= personTotalCount) {
            //无更多数据
            listBottomText = "无更多数据";
          } else {
            //更多
            listBottomText = "加载更多";
          }

          var list = that.data.list
          // var personOrderType = that.data.personOrderType
          that.setData({
            listBottomText: listBottomText,
            list: list
          })

        }
      }
      else {
        wx.showToast({
          title: data.resultMsg,
          icon: 'none'
        })
      }


    })

  },


	// 我要反馈按钮事件 
	feekBackAction: function (event) {
		console.log("我要反馈");
		var order = event.currentTarget.dataset.item
		var that = this
		this.setData({
			isShowFeedback: true,
			order: order,
			// 反馈成功回调
			success: function () {
				that.hideFeedbackView()
			}
		});
	},
	// 反馈视图消失
	hideFeedbackView() {
		this.setData({
			isShowFeedback: false
		});
	},

})