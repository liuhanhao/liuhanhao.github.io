Component({
  lifetimes: {
    ready() {
      this.initEleWidth();
      this.initLineHeight();
    },
  },
  // 以下是旧式的定义方式，可以保持对 <2.2.3 版本基础库的兼容
  ready() {
    this.initEleWidth();
    this.initLineHeight();
  },
  /**
   * 组件的属性列表
   */
  properties: {
    params: {//传过来的参数
      type: null,
      value: null
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    params:{},//回传参数
    data:{
      txtStyle: "",
    },
    delBtnWidth: 180,
    height: "120rpx"
  },

  /**
   * 组件的方法列表
   */
  methods: {
    touchS: function (e) {
      if (e.touches.length == 1) {
        this.setData({
          //设置触摸起始点水平方向位置
          startX: e.touches[0].clientX
        });
      }
    },
    touchM: function (e) {
      if (e.touches.length == 1) {
        //手指移动时水平方向位置
        var moveX = e.touches[0].clientX;
        //手指起始点位置与移动期间的差值
        var disX = this.data.startX - moveX;
        var delBtnWidth = this.data.delBtnWidth;
        var txtStyle = "";
        if (disX == 0 || disX < 0) {//如果移动距离小于等于0，文本层位置不变
          txtStyle = "left:0px";
        } else if (disX > 0) {//移动距离大于0，文本层left值等于手指移动距离
          txtStyle = "left:-" + disX + "px";
          if (disX >= delBtnWidth) {
            //控制手指移动距离最大值为删除按钮的宽度
            txtStyle = "left:-" + delBtnWidth + "px";
          }
        }
        //获取手指触摸的是哪一项
        var data = this.data.data;
        data.txtStyle = txtStyle;
        //更新列表的状态
        this.setData({
          data: data
        });
      }
    },

    touchE: function (e) {
      if (e.changedTouches.length == 1) {
        //手指移动结束后水平位置
        var endX = e.changedTouches[0].clientX;
        //触摸开始与结束，手指移动的距离
        var disX = this.data.startX - endX;
        var delBtnWidth = this.data.delBtnWidth;
        //如果距离小于删除按钮的1/2，不显示删除按钮
        var txtStyle = disX > delBtnWidth / 2 ? "left:-" + delBtnWidth + "px" : "left:0px";
        //获取手指触摸的是哪一项
        var data = this.data.data;
        data.txtStyle = txtStyle;
        //更新列表的状态
        this.setData({
          data: data
        });
      }
    },
    //获取元素自适应后的实际宽度
    getEleWidth: function (w) {
      var real = 0;
      try {
        var res = wx.getSystemInfoSync().windowWidth;
        var scale = (750 / 2) / (w / 2);
        //以宽度750px设计稿做宽度的自适应
        // console.log(scale);
        real = Math.floor(res / scale);
        return real;
      } catch (e) {
        return false;
        // Do something when catch error
      }
    },
    initEleWidth: function () {
      var delBtnWidth = this.getEleWidth(this.data.delBtnWidth);
      this.setData({
        delBtnWidth: delBtnWidth
      });
    },
    //初始化行高
    initLineHeight: function(){
      let query = wx.createSelectorQuery().in(this);
      // 然后取出ntop的节点信息 
      // 选择器的语法与jQuery语法相同 
      query.select('#viewSlot').boundingClientRect();
      // 执行上面所指定的请求，结果会按照顺序存放于一个数组中，在callback的第一个参数中返回 
      query.exec((res) => {
        // 取出高度 
        let height = res[0].height + "px";

        // 算出来之后存到data对象里面 
        this.setData({
          height: height
        });
      });
    },
    //点击删除按钮事件
    delItem: function (e) {
      var eventDetail = {
        params: this.data.params,
      }
      this.resetState();
      //触发搜索回调
      this.triggerEvent("delItem", eventDetail)
    },
    //重置状态
    resetState: function(){
      var data = this.data.data;
      data.txtStyle = '';
      //更新列表的状态
      this.setData({
        data: data
      });
    }
  }
})
