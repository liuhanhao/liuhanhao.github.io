//  main.swift
//  我与 小婵婵 携手走过的一周年
//
//  Created by liuhanhao on 2018/10/30.
//  Copyright © 2018年 liuhanhao. All rights reserved.

import Foundation

public class 你 {
var 名字:String // 王丽婵
init(name:String) {
名字 = name;
}
}
public class 我 {
static let 我的老婆:String = "你系私有，全局唯Ⅰ，不可更改继承啲"
static let 漂亮等级:String = "世界上最漂亮啲"
static let 可爱等级:String = "世界上最可爱啲"
static let 善良等级:String = "世界上最善良啲"
static let 对我的意义:String = "你系我Ⅰ生最爱啲人"
fileprivate var 老婆:你
init(女朋友:你) {
self.老婆 = 女朋友
}
}
public class 我的姐姐 {
func 介绍(女朋友:你) -> 我 {
return 我(女朋友:女朋友)
}
}
public class 你的闺蜜 {
func 介绍() -> 你 {
return 你(name: "王丽婵")
}
}

let 王丽婵:你 = 你的闺蜜().介绍()
let 刘汉浩:我 = 我的姐姐().介绍(女朋友:王丽婵)
var 我的年龄:Int = 27
while 我的年龄 < 1314 {
let 我爱你 = true
print(我爱你)
我的年龄 += 1
}
print("希望能就这样平平静静啲牵你手，Ⅰ直走。")
print("谢谢你走进我的世界，也让我走入你的世界 -- 永远爱你的浩。")



