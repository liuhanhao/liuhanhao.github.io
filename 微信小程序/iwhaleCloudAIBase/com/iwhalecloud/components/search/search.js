Component({
  /**
   * 组件的属性列表
   * 用于组件自定义设置
   */
  properties: {
    // 弹窗标题
    hint: {            // 属性名
      type: String,     // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
      value: '搜索内容'     // 属性初始值（可选），如果未指定则会根据类型选择一个
    },
    value: {
      type: String,
      value: ''
    },
    searchbutton: {
      type: String,
      value: '0' //0表示不需要搜索按钮  1表示需要搜索按钮
    },
  },

  /**
   * 私有数据,组件的初始数据
   * 可用于模版渲染
   */
  data: {
    value: '',
    focus: false,
  },

  /**
   * 组件的方法列表
   * 更新属性和数据的方法与更新页面数据的方法类似
   */
  methods: {
    /*
     * 公有方法
     */
    bindKeyInput: function (e) {
      this.setData({
        value: e.detail.value
      })
    },
    delete: function (e) {
      this.setData({
        value: ''
      })
    },
     /*
     * 
     * triggerEvent 用于触发事件
     */
    searchEvent() {
      var eventDetail = {
        value: this.data.value,
      }
      //触发外部的搜索回调函数
      this.triggerEvent("searchEvent",eventDetail)
    },
    /*
     * 
     * 搜索按钮事件
     */
    searchAction() {
      this.searchEvent()
      this.data.focus = false
    },

  }
})