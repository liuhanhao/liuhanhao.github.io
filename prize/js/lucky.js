$(function () {
    /*
     luckyNum为每次抽几人
     luckyResult为抽奖结果的集合（数组）
     luckyNum为5那么luckyResult的length也为5
     */
    var Obj = {};
    Obj.luckyResult = [];
    Obj.luckyPrize = '';
    Obj.luckyNum = $(".select_lucky_number").val();
    /*
     一次抽几人改变事件
     */
    $(".select_lucky_number").bind('change', function () {
        Obj.luckyNum = $(this).val();
    })
    /*
     图片预加载
     */
    function loadImage(arr, callback) {
        var loadImageLen = 1;
        var arrLen = arr.length;
        $('.all_number').html("/" + arrLen);
        for (var i = 0; i < arrLen; i++) {
            var img = new Image(); //创建一个Image对象，实现图片的预下载
            img.onload = function () {
                img.onload = null;
                ++loadImageLen;
                $(".current_number").html(loadImageLen);
                if (loadImageLen == arrLen) {
                    callback(img); //所有图片加载成功回调；
                }
                ;
            }
            img.src = arr[i].image;
        }
    }

    /*
     把3D动画初始化，等待执行
     personArray为本地引入数据
     */
    Obj.M = $('.container').lucky({
        row: 7, //每排显示个数  必须为奇数
        col: 5,//每列显示个数  必须为奇数
        depth: 5, //纵深度
        iconW: 30, //图片的宽
        iconH: 30, //图片的高
        iconRadius: 8, //图片的圆角
        data: personArray, //数据的地址数组
    });
    $('#peopleNumber').text(personArray.length)
    /*
    执行图片预加载并关闭加载试图
    */
    var allPersonArray = JSON.parse(JSON.stringify(personArray))
    loadImage(personArray, function (img) {
        $('.loader_file').hide();
    });
    /*
     若为ajax请求执行这段代码
     此为为ajax请求;
     $.get('index.php',function(data){
         if(data.res == 1){
             personArray = data.data; //此为数组

             //执行图片预加载并关闭加载试图
             loadImage(personArray, function (img) {
                $('.loader_file').hide();
             })
             Obj.M = $('.container').lucky({
             row : 7, //每排显示个数  必须为奇数
             col : 7, //每列显示个数  必须为奇数
             depth : 6, //纵深度
             iconW : 30, //图片的宽
             iconH : 30, //图片的高
             iconRadius : 8, //图片的圆角
             data : personArray, //数据的地址数组
         });
         }
     })
     */

    /*
     中奖人员展示效果
     传入当前中奖数组中单个的key
     */
    function showLuckyPeople(num) {
        let newPersonArray = JSON.parse(JSON.stringify(personArray))
        // newPersonArray.findIndex((item, index) => {
        //     return
        // })#d02a2a
        // console.log(num, 'num')
        for(var i = 0; i < personArray.length; i++) {
            // for (var j = 0; j < Obj.luckyResult.length; j++) {
                if (personArray[i].id == Obj.luckyResult[num]) {
                    personArray.splice(i, 1)
                }
            // }
        }
        setTimeout(function () {
            console.log(personArray, Obj.luckyResult, num)
            var $luckyEle = $('<img class="lucky_icon" />');
            var $userName = $('<p class="lucky_userName"></p>');
            var $fragEle = $('<div class="lucky_userInfo"></div>');
            $fragEle.append($luckyEle, $userName);
            $('.mask').append($fragEle);
            $(".mask").fadeIn(200);
            // if (id === ) {

            // }
            $luckyEle.attr('src', allPersonArray[Obj.luckyResult[num]].image);
            $userName.text(allPersonArray[Obj.luckyResult[num]].name)
            $fragEle.animate({
                'left': '50%',
                'top': '50%',
                'height': '200px',
                'width': '200px',
                'margin-left': '-100px',
                'margin-top': '-100px',
            }, 1000, function () {
                setTimeout(function () {
                    $fragEle.animate({
                        'height': '100px',
                        'width': '100px',
                        'margin-left': '100px',
                        'margin-top': '-50px',
                    }, 400, function () {
                        $(".mask").fadeOut(0);
                        $luckyEle.attr('class', 'lpl_userImage').attr('style', '');
                        $userName.attr('class', 'lpl_userName').attr('style', '');
                        $fragEle.attr('class', 'lpl_userInfo').attr('style', '');
                        $('.lpl_list.active').append($fragEle);
                    })
                }, 1000)
            })
        }, num * 2500)
        setTimeout(function () {
            $('.lucky_list').show();
        }, 2500)
    }

    /*
     停止按钮事件函数
     */
    $('#stop').click(function () {
        Obj.M.stop();
        $(".container").hide();
        $(this).hide();
        var i = 0;
        setTimeout(() => {
            console.log(personArray.length,'length')
            $('#peopleNumber').text(personArray.length)
        }, 0)
        // localStorage.setItem('luckyResult', JSON.stringify(Obj))
        // console.log(Obj.luckyResult, 'Obj.luckyResult', '12323121')
        for (; i < Obj.luckyResult.length; i++) {
            showLuckyPeople(i);
        }

    })
    /*
     开始按钮事件函数
     */
    $('#open').click(function () {
        if (Obj.luckyNum > personArray.length) {
            alert('抽奖人数不能大于参与人数')
            return false
        }
        $('.lucky_list').hide();
        $(".container").show();
        Obj.M.open(personArray);

        //此为ajax请求获奖结果
        //$.get('luckyNum.php',{luckyNum : Obj.luckyNum,luckyPrize:Obj.luckyPrize},function(data){
        //	  if(data.res == 1){
        //		  Obj.luckyResult = data.luckyResult;
        //        $("#stop").show(500);
        //	  }
        //})
        //ajax获奖结果结束

        //此为人工写入获奖结果
        var arrId = personArray.map(item => {
            return item.id
        })
        console.log(personArray, 'personArray')
        randomLuckyArr(arrId);
        setTimeout(function () {
            $("#stop").show(500);
        }, 1000)
        //人工获奖结果结束
    })

    /*
     前端写中奖随机数
     */
    // function randomLuckyArr() {
    //     Obj.luckyResult = [];
    //     for (var i = 0; i < Obj.luckyNum; i++) {
    //         var random = Math.floor(Math.random() * personArray.length);
    //         if (Obj.luckyResult.indexOf(random) == -1) {
    //             Obj.luckyResult.push(random)
    //         } else {
    //             i--;
    //         }
    //     }
    // }
    function randomLuckyArr(arr) {
        // var arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        // var result = [ ];
        console.log(arr, 'arr')
        Obj.luckyResult = [];
        var ranNum = Obj.luckyNum;
        for (var i = 0; i < ranNum; i++) {
            var ran = Math.floor(Math.random() * (arr.length - i));
            Obj.luckyResult.push(arr[ran]);
            arr[ran] = arr[arr.length - i - 1];
        };
    }
    // function randomLuckyArr(array) {
    //     Obj.luckyResult = [];
    //     var m = Obj.luckyNum,
    //         t, i;
    //     // 如果还剩有元素…
    //     while (m) {
    //         // 随机选取一个元素…
    //         i = Math.floor(Math.random() * m--);
    //         // 与当前元素进行交换
    //         t = array[m];
    //         array[m] = array[i];
    //         array[i] = t;
    //     }
    //     Obj.luckyResult = JSON.parse(JSON.stringify(array))
    //     console.log(Obj.luckyResult, 'Obj.luckyResult')
    //     // return array;
    // }
    /*
     切换奖品代码块
     */
    function tabPrize() {
        var luckyDefalut = $(".lucky_prize_picture").attr('data-default');
        var index = luckyDefalut ? luckyDefalut : 1;
        tabSport(index);
        var lucky_prize_number = $('.lucky_prize_show').length;
        $('.lucky_prize_left').click(function () {
            $('.lucky_prize_right').addClass('active');
            index <= 1 ? 1 : --index;
            tabSport(index, lucky_prize_number);
        })
        $('.lucky_prize_right').click(function () {
            $('.lucky_prize_left').addClass('active');
            index >= lucky_prize_number ? lucky_prize_number : ++index;
            tabSport(index, lucky_prize_number);
        })

    }

    /*
     切换奖品左右按钮公共模块
     */
    function tabSport(i, lucky_prize_number) {
        if (i >= lucky_prize_number) {
            $('.lucky_prize_right').removeClass('active');
        }
        if (i <= 1) {
            $('.lucky_prize_left').removeClass('active');
        }
        Obj.luckyPrize = i;
        $('.lucky_prize_show').hide().eq(i - 1).show();
        // $(".lucky_prize_name").html($('.lucky_prize_show').eq(i - 1).attr('title'));
        $(".lucky_prize_title").html($('.lucky_prize_show').eq(i - 1).attr('alt'));
        $('.lpl_list').removeClass('active').hide().eq(i - 1).show().addClass('active');
        // $('.lucky_title_img').
    }
    tabPrize();
})
