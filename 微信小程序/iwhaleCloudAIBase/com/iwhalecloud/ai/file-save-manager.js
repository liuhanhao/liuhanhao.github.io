// 10400000 = 10M
const MAX_SIZE = 10400000 / 10; 
let wholeSize = 0;
setTimeout(() => {
    wx.getSavedFileList({
        success: savedFileInfo => {
            let {fileList} = savedFileInfo;
            !!fileList && fileList.forEach(item => {
                wholeSize += item.size;
            });
            console.log(wholeSize, '缓存的文件总大小');

        }
    });
});
export default class FileSaveManager {
    constructor() {

    }

    static set(msg, localPath) {
        wx.setStorage({key: msg.saveKey, data: localPath})
    }

    static get(msg) {
        return wx.getStorageSync(msg.saveKey);
    }

    static saveFileRule({tempFilePath, success, fail}) {
        wx.getFileInfo({
            filePath: tempFilePath,
            success: tempFailInfo => {
                let tempFileSize = tempFailInfo.size;
                // console.log('本地临时文件大小', tempFileSize);
                if (tempFileSize > MAX_SIZE) {
                    !!fail && fail('文件过大');
                    return;
                }
								// 如果调用了wx.saveFile保存成功 文件会被移动 旧的地址不能够使用
								// 暂时不进行缓存
								else {
									!!success && success(tempFilePath);
								}
                // wx.getSavedFileList({
                //     success: savedFileInfo => {
                //         let {fileList} = savedFileInfo;
                //         console.log('文件列表', fileList);
                //         if (!fileList) {
                //             !!fail && fail('获取到的fileList为空，请检查你的wx.getSavedFileList()函数的success返回值');
                //             return;
                //         }
                //         //这里计算需要移除的总文件大小
                //         let sizeNeedRemove = wholeSize + tempFileSize - MAX_SIZE;
                //         if (sizeNeedRemove >= 0) {
                //             //按时间戳排序，方便后续移除文件
                //             fileList.sort(function (item1, item2) {
                //                 return item1.createTime - item2.createTime;
                //             });
                //             let sizeCount = 0;
                //             for (let i = 0, len = fileList.length; i < len; i++) {
                //                 console.log('移除的文件1', sizeCount);
                //                 if ((sizeCount += fileList[i].size) >= sizeNeedRemove) {
                //                     for (let j = 0; j < i; j++) {
                //                         console.log('移除的文件2', fileList[j].filePath);
                //                         wx.removeSavedFile({
                //                             filePath: fileList[j].filePath,
                //                             success: function () {
                //                                 wholeSize -= fileList[j].size;
                //                                 // console.log('移除成功', wholeSize);
                //                             }
                //                         });
                //                     }
                //                     break;
                //                 }
                //             }
                //         }

                //         wx.saveFile({
                //             tempFilePath: tempFilePath,
                //             success: res => {
                //                 wholeSize += tempFileSize;
                //                 typeof success === "function" && success(res.savedFilePath);
                //             },
								// 						fail: function (res) {
								// 							console.log(res)
								// 							fail("保存文件失败")
								// 						}
                //         });
                //     },
								// 		fail: function (res) {
								// 			console.log(res)
								// 			fail("获取列表失败")
								// 		} 
                // });
							
            },
						fail: function (res) {
							console.log("获取信息失败",res)
							fail("文件格式不允许")
						}
        });
    }
}