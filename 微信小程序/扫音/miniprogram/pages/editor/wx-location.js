const app = getApp()
const db = app.cloudDB()

export default class WXLocation {
	constructor(page) {
		this._page = page;

		var that = this

		this._page.addressBindinput = function (event) {
			that._page.setData({
				address: event.detail.value,
				uploadSuccess: false,
			})
		}

		this._page.getCurrentLocation = function (event) {

			that.chooseLocation(function (address) {
				that._page.setData({
					address: address,
					uploadSuccess: false,
				})
			})

		}

	}

	// 使用定位并且直接打开微信地图查看
	openLocation() {
		wx.getLocation({
			type: 'gcj02', //返回可以用于wx.openLocation的经纬度
			success(res) {
				const latitude = res.latitude
				const longitude = res.longitude
				wx.openLocation({
					latitude,
					longitude,
					scale: 18
				})
			},
			fail(){

			}
		})
	}

	//选择地理位置
	chooseLocation(success) {
		wx.chooseLocation({
			// name	位置名称
			// address	详细地址
			// latitude	纬度，浮点数，范围为-90~90，负数表示南纬。使用 gcj02 国测局坐标系
			// longitude	经度，浮点数，范围为 - 180~180，负数表示西经。使用 gcj02 国测局坐标系
			success: function (res) {
				success && success(res.address)
			},
			fail: function () {
				wx.showToast({
					title: '打开定位失败，请检查定位权限',
					icon: 'none'
				})
			}
		})
	}
	

}