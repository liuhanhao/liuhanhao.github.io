const formatNumber = n => {
	n = n.toString()
	return n[1] ? n : '0' + n
}

/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * date: 传入时间戳
 * YYYY-MM-DD hh-mm-ss
*/
const formatDateTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

/** 
 * 时间戳转化为年 月 日
 * date: 传入时间戳
 * YYYY-MM-DD
*/
const formatTime = date => {
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()

	return [year, month, day].map(formatNumber).join('-')
}

/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * date: 传入时间戳
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
*/
function formatTimeTwo(date, format) {

  var formateArr = ['Y', 'M', 'D', 'h', 'm', 's'];
  var returnArr = [];

  returnArr.push(date.getFullYear());
  returnArr.push(formatNumber(date.getMonth() + 1));
  returnArr.push(formatNumber(date.getDate()));

  returnArr.push(formatNumber(date.getHours()));
  returnArr.push(formatNumber(date.getMinutes()));
  returnArr.push(formatNumber(date.getSeconds()));

  for (var i in returnArr) {
    format = format.replace(formateArr[i], returnArr[i]);
  }
  return format;
}

/** 
 * 例如我们希望输出的数字长度是固定的，假设为10，如果数字为123，则输出0000000123，不够位数就在之前补足0，这里提供了三种不同的方式实现JS代码给数字补0 的操作
*/
function prefixInteger(num) {
	return [num].map(formatNumber).join('');
}

module.exports = {
  formatTime: formatTime,
	formatDateTime: formatDateTime,
  formatTimeTwo: formatTimeTwo,
	prefixInteger: prefixInteger,  
}
