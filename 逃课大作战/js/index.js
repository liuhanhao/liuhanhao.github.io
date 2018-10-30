var stage = document.getElementById('stage');

var Game = {
    stage: stage,
    stageWidth: stage.offsetWidth,
    kidWidth: stage.offsetWidth * .24,
    prevent: {passive: false},
    isOver: false,
    score: 0,
    clock: 0,
    speed: 0,
    outed: 0,
    kids: 0,
    degree: 1,
    saveDegree: 1,
    scoreGroup: [5, 10, 15, 5],
    music: {
        bgsong: (function () {
            var audio = new Audio();
            audio.src = './audio/bg.mp3';
            audio.loop = true;
            audio.volume = .5;
            return audio;
        })(),
        score: (function () {
            var audio = new Audio();
            audio.src = './audio/score.mp3';
            audio.volume = .5;
            return audio;
        })(),
        win: (function () {
            var audio = new Audio();
            audio.src = './audio/win.mp3';
            return audio;
        })(),
        play: function (audio) {
            audio.pause();
            audio.currentTime = 0;
            var t = setTimeout(function () {
                clearTimeout(t);
                audio.play();
            }, 20);
        }
    },
    scenes: [document.createElement('div'), document.createElement('div'), document.createElement('div')],
    init: function () {
        var _this = this, speed, style, degree;
        //初始化一些值
        _this.stageWidth = _this.stage.offsetWidth;
        _this.kidWidth = _this.stageWidth * .24;
        _this.clock = 30;
        _this.score = 0;
        _this.isOver = false;
        _this.outed = 0;
        degree = _this.degree;
        Object.defineProperty(_this, 'degree', {
            set: function (v) {
                degree = v;
                _this.saveDegree = v;
                switch (v) {
                    //中级难
                    case 2:
                        _this.speed = 3.25;
                        _this.kids = 5;
                        _this.scoreGroup = [5, 10, 15];
                        break;
                    //高级难
                    case 3:
                        _this.speed = 2.5;
                        _this.kids = 4;
                        _this.scoreGroup = [10, 15, 20];
                        break;
                    //初级
                    default:
                        _this.speed = 4;
                        _this.kids = 3;
                        _this.scoreGroup = [5, 10, 15];
                }
            },
            get: function () {
                return degree;
            }
        });
        _this.degree = 1;
        //恢复舞台
        _this.stage.innerHTML = '';
        //阻止body的默认事件
        document.body.addEventListener('touchmove', docMoveFn, _this.prevent);

        function docMoveFn(e) {
            e.preventDefault();
        }

        //准备场景
        _this.initScene0();
        _this.initScene1();
        _this.initScene2();
        //添加动画style，初始化速度
        speed = _this.speed;
        style = document.createElement('style');
        document.head.appendChild(style);
        Object.defineProperty(_this, 'speed', {
            set: function (v) {
                if (v !== speed) {
                    speed = v;
                    style.innerText = '.student{-webkit-animation-duration: ' + speed + 's;-moz-animation-duration: ' + speed + 's;-o-animation-duration: ' + speed + 's;animation-duration: ' + speed + 's;}';
                }
            },
            get: function () {
                return speed
            }
        });
        //显示第一个场景
        _this.enterScene(0)
    },
    initScene0: function () {
        var _this, scene, btn1, nickname, user, pop, btn2, btn3, degreeDom, degreeItems;
        _this = this;
        scene = _this.scenes[0];
        user = window.localStorage.getItem('nickname');
        scene.className = 'scene scene1';
        scene.innerHTML = '<img class="title-img" src="img/title.png" alt="标题图片：逃課大作戰" draggable="false">\
        <img class="kid01" src="img/kid01.png" alt="" draggable="false">\
        <img class="teacher" src="img/teacher.png" alt="" draggable="false">\
        <img class="btn01" src="img/btn01.png" alt="" draggable="false">\
        <input class="nickname" type="text" name="nickname" placeholder="小婵婵" value="小婵婵">\
        <div class="btns"><span class="btn02">排行榜</span><span class="btn03">選擇難度</span></div>\
        <div class="logobar"><img class="logo" src="img/logo.png" alt="" draggable="false"></div>';

        degreeDom = document.createElement('div');
        degreeDom.className = 'degree-list popup-inner';
        degreeDom.innerHTML = '<div class="degree-item" data-degree="1">初&nbsp;&nbsp;級</div>' +
            '<div class="degree-item" data-degree="2">中&nbsp;&nbsp;級</div>' +
            '<div class="degree-item" data-degree="3">高&nbsp;&nbsp;級</div>';

        btn1 = scene.querySelector('.btn01');
        btn2 = scene.querySelector('.btn02');
        btn3 = scene.querySelector('.btn03');
        nickname = scene.querySelector('.nickname');
        nickname.value = user;
        pop = utils.popup();

        function enterFn() {
            var nick = nickname.value.trim();
            if (!nick) {
                pop.show('<span class="popup-inner">未輸入暱稱</span>');
                nickname.focus();
            } else {
                _this.enterScene(1);
                if (window.localStorage.getItem('bgsong')) {
                    _this.music.bgsong.play();
                }
                if (window.localStorage.getItem('nickname') !== nick) {
                    window.localStorage.setItem('nickname', nick);
                    window.localStorage.setItem(nick, '0');
                    _this.sendMsg('name=' + nick, function () {
                        _this.getRank();
                    });
                }
            }
        }

        btn1.onclick = enterFn;
        nickname.onkeydown = function (e) {
            if (e.keyCode === 13) {
                enterFn();
                nickname.blur();
            }
        };
        btn2.onclick = function () {
            _this.showRank();
        };
        degreeItems = degreeDom.querySelectorAll('.degree-item');
        for (var i = 0, len = degreeItems.length; i < len; i++) {
            degreeItems[i].onclick = function () {
                _this.degree = parseInt(this.getAttribute('data-degree')) || 1;
                pop.hide();
            }
        }
        btn3.onclick = function () {
            pop.show(degreeDom);
        }
    },
    showRules: function (fn) {
        var pop, btn;
        pop = utils.popup(null, this.stage);
        pop.onhide = fn;
        pop.show('<div class="popup-inner">' +
            '<p style="text-indent: 2em;">30秒内，抓住正在逃跑的熊孩子並拖到底部罰站，抓住孩子則得分，出現在離底部越遠的孩子分數越高。孩子逃出教室將扣分。\n预祝小婵婵玩得开心,嘻嘻<br>' +
            '<img id="i-see" class="btn-i-see" src="img/btn-i-see.png" style="height: 2.5em;display: block;margin: 0 auto;">' +
            '</div>');
        btn = document.getElementById('i-see');
        btn.onclick = function () {
            pop.hide();
            window.localStorage.setItem('isee', '1')
        }
    },
    initScene1: function () {
        var _this, scene, scoreEl, score, scoreAdd, scoreAddTimer, clockEl, musicBtn, clock, rules;
        _this = this;
        scene = _this.scenes[1];
        window.localStorage.setItem('bgsong', 'play');
        scene.className = 'scene scene2';
        scene.draggable = false;
        scene.innerHTML = '<img class="kid-head" src="img/kid-head.png" draggable="false">\
        <div class="score" draggable="false">0</div>\
        <div class="clock" draggable="false">倒計時：' + _this.clock + 's</div>\
        <div class="music-btn" draggable="false"></div>\
        <img class="door01" src="img/door.png" draggable="false">\
        <img class="door02" src="img/door.png" draggable="false">\
        <img class="teacher02" src="img/teacher.png" draggable="false">\
        <div class="score-add"></div>';

        rules = scene.querySelector('.kid-head');
        rules.onclick = function () {
            _this.showRules();
        };

        clockEl = scene.querySelector('.clock');
        clock = _this.clock;
        Object.defineProperty(_this, 'clock', {
            set: function (v) {
                if (v !== clock) {
                    clock = v;
                    clockEl.innerHTML = '倒計時：' + v + 's';
                    if (v % 5 === 0 && _this.speed > 1.5) {
                        _this.speed -= .25;
                    }
                }
            },
            get: function () {
                return clock
            }
        });

        scoreEl = scene.querySelector('.score');
        scoreAdd = scene.querySelector('.score-add');
        score = _this.score;
        Object.defineProperty(_this, 'score', {
            set: function (v) {
                if (v !== score) {
                    if (v !== 0) {
                        scoreAdd.innerHTML = (v > score ? '+' : '-') + Math.abs(v - score);
                        scoreAdd.className = 'score-add';
                        scoreAddTimer = setTimeout(scoreAddTimerFn, 16.6);
                    }
                    score = v;
                    scoreEl.innerText = v
                }
            },
            get: function () {
                return score
            }
        });

        function scoreAddTimerFn() {
            clearTimeout(scoreAddTimer);
            scoreAdd.className = 'score-add fade-in-out'
        }

        musicBtn = scene.querySelector('.music-btn');
        musicBtn.onclick = function () {
            _this.music.bgsong.paused ? _this.music.bgsong.play() : _this.music.bgsong.pause()
            window.localStorage.setItem('bgsong', _this.music.bgsong.paused ? '' : 'play')
        };
    },
    initScene2: function () {
        var _this, scene, light, lbox, lnum, lscore, ltext, showRank, again, back, share;
        _this = this;
        scene = _this.scenes[2];
        scene.innerHTML = '<img class="light" src="img/light.png">\
        <div class="level-box" style="width: 84%;height: ' + (Game.stageWidth * 0.78) + 'px;">\
            <img class="level-num" src="img/level-2.png"><br>\
            <span class="level-score" style="font-size: ' + (Game.stageWidth * .06) + 'px;"></span>\
            <img class="level-text" src="img/level-text1.png" style="height: ' + (Game.stageWidth * .07) + 'px">\
        </div>\
        <img class="show-rank" src="img/rank-title.png">\
        <div class="rank-below-text" style="font-size: ' + (Game.stageWidth * .04) + 'px">點擊查看</div>\
        <img class="btn-again" src="img/btn-again.png">\
        <img class="btn-back-home" src="img/btn-back-home.png">\
        <img class="btn-share" src="img/btn-share.png">\
		<img class="logo2" src="img/logo.png">';
        light = scene.querySelector('.light');
        lbox = scene.querySelector('.level-box');
        lnum = scene.querySelector('.level-num');
        lscore = scene.querySelector('.level-score');
        ltext = scene.querySelector('.level-text');
        showRank = scene.querySelector('.show-rank');
        again = scene.querySelector('.btn-again');
        back = scene.querySelector('.btn-back-home');
        share = scene.querySelector('.btn-share');
        _this.updateScene2 = function () {
            if (_this.score >= 600) {
                light.className = 'light light-show';
                lbox.className = 'level-box level-box-1';
                lnum.src = 'img/level-2.png';
                lnum.className = 'level-num';
                ltext.src = 'img/level-text1.png';
            } else {
                light.className = 'light';
                lbox.className = 'level-box';
                lnum.className = 'level-num level-num-show';
                if (_this.score >= 400) {
                    lnum.src = 'img/level-2.png';
                    ltext.src = 'img/level-text2.png';
                } else if (_this.score >= 300 && _this.score < 400) {
                    lnum.src = 'img/level-3.png';
                    ltext.src = 'img/level-text3.png';
                } else {
                    lnum.src = 'img/level-4.png';
                    ltext.src = 'img/level-text4.png';
                }
            }
            lscore.innerText = _this.score + '分';
        };
        showRank.onclick = function () {
            _this.showRank();
        };
        again.onclick = function () {
            _this.restart();
        };
        back.onclick = function () {
            _this.restart(0);
        };
        share.onclick = function () {
            utils.share();
        }
    },
    updateScene2: null,
    showRank: function () {
        var _this, pop, box, items, len, i, html, nick, last;
        _this = this;
        pop = utils.popup(null, this.stage);
        box = document.createElement('div');
        nick = window.localStorage.getItem('nickname');
        _this.getRank(function (res) {
                box.className = 'rank';
                items = res.results;
                len = items.length;
                last = len - 1;
                html = '';
                if (items[last].name === nick) {
                    html += '<div class="rank-item-title">你當前排行</div>\
                    <div class="rank-item rank-user">\
                        <div class="rank-num">' + items[last].rank + '</div>\
                        <div class="rank-nick">' + items[last].name + '</div>\
                        <div class="rank-score">' + items[last].score + '分</div>\
                    </div>';
                    len = last;
                }
                html += '<div class="rank-item-title">排行榜TOP20</div>';

                for (i = 0; i < len; i++) {
                    html += '<div class="rank-item rank-item-' + items[i].rank + '">\
                        <div class="rank-num">' + items[i].rank + '</div>\
                        <div class="rank-nick">' + items[i].name + '</div>\
                        <div class="rank-score">' + items[i].score + '分</div>\
                    </div>';
                }
                box.innerHTML = '<img class="rank-title" src="img/rank-title.png">\
                        <div class="rank-body" style="height: ' + (_this.stage.offsetHeight * .6) + 'px;">\
                            <div class="rank-list">' + html + '</div>\
                        </div>\
                        <img class="rank-back popup-close" src="img/btn-back.png">';
                utils.scroll(box.querySelector('.rank-list'));
            },
            function () {
                box.className = 'popup-inner';
                box.innerHTML = '<div>加載失敗，稍後重試！</div><img class="rank-back popup-close" src="img/btn-back.png">';
            });
        box.className = 'popup-inner loading-icon';
        box.innerHTML = 'loading...';
        pop.show(box, true);
    },
    getRank: function (success, fail) {
        var xhr, res, nick, your
        nick = window.localStorage.getItem('nickname');
        xhr = new XMLHttpRequest();
        xhr.open('get', 'api/post.php?name=' + nick, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        res = typeof xhr.response === 'object' ? xhr.response : JSON.parse(xhr.response);
                    } catch (e) {
                        if (fail) fail();
                        return;
                    }
                    your = res.results[res.results.length - 1]
                    if (your.name === nick) {
                        window.localStorage.setItem(nick, your.score);
                    }
                    if (success) success(res)
                } else {
                    if (fail) fail()
                }
            }
        };
        xhr.send();
    },
    createKid: function (fn) {
        var _this, kid, rand, clientX, clientY, className;
        _this = this;
        kid = document.createElement('div');
        rand = Math.floor(Math.random() * 3.5 + 1);
        className = 'student running student' + rand;
        kid.draggable = false;
        kid.className = className;
        kid.innerHTML = '<img class="running01" src="img/running01.png" draggable="false"/>\
            <img class="running02" src="img/running02.png" draggable="false">\
            <img class="kid-caught" src="img/kid01.png" draggable="false">';

        kid.addEventListener('touchstart', startFn, _this.prevent);
        kid.addEventListener('touchmove', moveFn, _this.prevent);
        kid.addEventListener('touchend', endFn, _this.prevent);
        kid.addEventListener('webkitAnimationIteration', anmFn);
        kid.addEventListener('animationiteration', anmFn);

        function startFn(e) {
            e.preventDefault();
            if (_this.isOver) return;
            this.className = 'student'
        }

        function moveFn(e) {
            e.preventDefault();
            if (_this.isOver) return;
            clientX = e.targetTouches[0].clientX;
            clientY = e.targetTouches[0].clientY;
            this.style.top = (clientY - _this.kidWidth / 2) + 'px';
            this.style.left = (clientX - _this.kidWidth / 2) + 'px'
        }

        function endFn() {
            if (_this.isOver) return;
            if ((this.offsetTop + _this.kidWidth) / _this.stage.offsetHeight > .9) {
                this.style.bottom = '0';
                this.style.top = '';
                var index = 0;
                if (/student1/.test(className)) {
                    index = 2;
                } else if (/student2/.test(className)) {
                    index = 1;
                } else {
                    index = 0;
                }
                _this.score += _this.scoreGroup[index];
                _this.music.play(_this.music.score);
                if (fn) fn()
            } else {
                this.className = className
            }
        }

        function anmFn(e) {
            if (/running-path/.test(e.animationName)) {
                _this.outed++;
                if (_this.score > 0) {
                    _this.score -= _this.scoreGroup[0];
                }
                rand = Math.floor(Math.random() * 3.5 + 1);
                className = 'student running student' + rand;
                this.removeAttribute('style');
                this.className = className
            }
        }

        return kid
    },
    addKids: function (scene) {
        var _this, kidNum, kidTimer;
        _this = this;
        kidNum = 0;
        kidTimer = setInterval(function () {
            kidNum++;
            if (kidNum > _this.kids) clearInterval(kidTimer);
            addKid()
        }, 300);
        _this.isOver = false;
        _this.clockTimer = setInterval(function () {
            _this.clock--;
            if (_this.clock <= 0) {
                var kids, len, i;
                clearInterval(_this.clockTimer);
                kids = document.querySelectorAll('.student');
                len = kids.length;
                for (i = 0; i < len; i++) {
                    kids[i].className = 'student';
                    kids[i].removeAttribute('style')
                }
                _this.isOver = true
                _this.gameOver()
            }
        }, 1000);

        function addKid() {
            scene.appendChild(_this.createKid(function () {
                addKid()
            }))
        }
    },
    enterScene: function (index) {
        var _this = this;
        _this.stage.innerHTML = '';
        _this.stage.appendChild(_this.scenes[index]);
        switch (index) {
            case 1:
                //复原场景值
                _this.clock = 30;
                _this.score = 0;
                _this.isOver = false;
                _this.outed = 0;
                _this.degree = _this.saveDegree;
                var kids = _this.scenes[1].querySelectorAll('.student');
                for (var i = 0, len = kids.length; i < len; i++) {
                    _this.scenes[1].removeChild(kids[i]);
                }
                if (_this.clockTimer) clearInterval(_this.clockTimer);
                //重新进入场景
                if (window.localStorage.getItem('isee')) {
                    _this.addKids(_this.scenes[1]);
                } else {
                    _this.showRules(function () {
                        _this.addKids(_this.scenes[1]);
                    });
                }
                break;
            default:
                _this.scenes[0].classList.add('on');
        }
    },
    sendMsg: function (params, callback, fail) {
        var xhr = new XMLHttpRequest();
        xhr.open('post', 'api/post.php', true);
        xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (callback) callback(xhr.response);
                } else {
                    if (fail) fail();
                }
            }
        };
        xhr.send(params);
    },
    gameOver: function () {
        var nick, score;
        nick = window.localStorage.getItem('nickname');
        score = parseInt(window.localStorage.getItem(nick));
        this.updateScene2();
        utils.popup(null, this.stage).show(this.scenes[2], true);
        if (this.score > score || isNaN(score)) {
            window.localStorage.setItem(nick, this.score);
            this.sendMsg('name=' + nick + '&score=' + this.score, function () {
                utils.popup('<div class="popup-inner">success!</div>');
            });
        }
    },
    restart: function (index) {
        this.enterScene(typeof index !== 'undefined' ? index : 1);
    }
};

!function main() {
    if (!('ontouchstart' in document)) {
        return utils.popup().show('<span class="popup-inner">當前設備不支持<br>請在手機上玩</span>', true);
    }
    var medias = ['bg01.jpg', 'bg02.jpg', 'btn01.png', 'btn-again.png', 'btn-share.png', 'btn-back.png', 'btn-back-home.png', 'btn-i-see.png',
            'cover.jpg', 'door.png', 'kid01.png', 'kid-head.png',
            'level-1.png', 'level-2.png', 'level-3.png', 'level-4.png', 'level-bg.png', 'light.png',
            'level-text1.png', 'level-text2.png', 'level-text3.png', 'level-text4.png', 'logo.png',
            'music-icon.png', 'rank-title.png', 'running01.png', 'running02.png', 'teacher.png', 'title.png'],
        len = medias.length,
        i = 0;
    for (; i < len; i++) {
        medias[i] = './img/' + medias[i];
    }
    medias.push('./audio/bg.mp3', './audio/win.mp3', './audio/score.mp3');
    utils.ready(medias, function () {
        Game.init();
    })
}();
