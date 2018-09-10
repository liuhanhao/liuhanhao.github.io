var utils = {
    scroll: function(el, direction, preventKeys) {
        preventKeys = preventKeys || [];
        var isTouch, events, start, end, startTop, prev, speed, prevent, scroll, client, len, i, timer

        isTouch = 'ontouchstart' in document
        events = ['mousedown', 'mousemove', 'mouseup']
        start = 0
        end = 0
        startTop = 0
        prev = 0
        speed = 0
        prevent = {passive: false}
        scroll = 'scrollTop'
        client = 'clientY'
        len = preventKeys.length

        if (isTouch) {
            events[0] = 'touchstart'
            events[1] = 'touchmove'
            events[2] = 'touchend'
        }

        if (direction && direction.toLowerCase() === 'x') {
            scroll = 'scrollLeft'
            client = 'clientX'
        }

        function startFn (e) {
            for (i = 0; i < len; i++) {
                if (e[preventKeys[i]]) return false
            }
            start = isTouch ? e.targetTouches[0][client] : e[client]
            end = start
            startTop = el[scroll]
            prev = start
            el.addEventListener(events[1], moveFn, prevent)
            document.addEventListener(events[2], endFn)
        }

        function moveFn (e) {
            e.preventDefault()
            end = isTouch ? e.targetTouches[0][client] : e[client]
            speed = end - prev
            prev = end
            el[scroll] = startTop + (start - end)
        }

        function endFn () {
            el.removeEventListener(events[1], moveFn, prevent)
            document.removeEventListener(events[2], endFn)
            easeOut(Math.abs(speed), end - start, end - start < 0 ? 1 : -1)
        }

        function wheel (e) {
            for (i = 0; i < len; i++) {
                if (e[preventKeys[i]]) {
                    return false
                }
            }
            var dir = e.wheelDelta < 0 ? 1 : -1
            el[scroll] += dir * 10
            easeOut(10, 6, dir)
        }

        function easeOut (d, dis, dir) {
            function play () {
                d *= 0.9
                cancelAnimationFrame(timer)
                timer = requestAnimationFrame(play)
                if (d < 1) cancelAnimationFrame(timer)
                el[scroll] += d * dir
            }
            if (Math.abs(dis) > 5) {
                cancelAnimationFrame(timer)
                timer = requestAnimationFrame(play)
            }
        }

        function bind () {
            el.addEventListener(events[0], startFn)
            if (!isTouch) el.addEventListener('mousewheel', wheel)
        }

        function unbind () {
            el.removeEventListener(events[0], startFn)
            el.addEventListener('mousewheel', wheel)
        }

        bind();

        return {
            on: bind,
            off: unbind
        }
    },
    loadMedia: function(arr, fn){
        var i = 0, len = arr.length, count = 0;
        for(; i<len; i++){
            (function(i){
                var xhr = new XMLHttpRequest();
                xhr.open('get', arr[i], true);
                xhr.onreadystatechange = function(){
                    if(xhr.readyState === 4 && xhr.status === 200){
                        count++;
                        if(fn) fn(count, len);
                        xhr = xhr.onreadystatechange = null;
                    }
                };
                xhr.send();
            })(i);
        }
    },
    css: function(el,o){
        if(typeof o !== 'object') return;
        for(var k in o){
            if(/^(transform|animation|transition)/.test(k)){
                var str = k.slice(0,1).toUpperCase() + k.slice(1);
                el.style['webkit'+str] = o[k];
                el.style['moz'+str] = o[k];
                el.style['o'+str] = o[k];
            }
            el.style[k] = o[k];
        }
    },
    popup: function(o, context){
        context = context || document.body;
        var _this = this,
            div = document.createElement('div'),
            cell = document.createElement('div'),
            backObj = {},
            preventHide = false;

        _this.css(div, {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,.6)',
            color: '#333',
            display: 'table',
            zIndex: 100
        });
        _this.css(cell, {
            display: 'table-cell',
            verticalAlign: 'middle',
            textAlign: 'center'
        });

        _this.css(div, o);

        div.appendChild(cell);
        div.onclick = function (ev) {
            var target = ev.target;
            if((!preventHide && (target === div || target === cell)) || /popup-close/.test(target.className)){
                context.removeChild(div);
                if(backObj.onhide) backObj.onhide();
            }
        };
        backObj.show = function (html, prevent) {
            preventHide = prevent;
            if(context.contains(div)) return;
            context.appendChild(div);
            cell.innerHTML = '';
            if(typeof html === 'string'){
                cell.innerHTML = html || '';
            }else if(html.nodeType === 1){
                cell.appendChild(html);
            }
            if(backObj.onshow) backObj.onshow();
        };
        backObj.hide = function () {
            context.removeChild(div);
            if(backObj.onhide) backObj.onhide()
        };
        return backObj;
    },
    ready: function(medias, complete){
        var _this = this;
        document.addEventListener('DOMContentLoaded', function handler() {
            document.removeEventListener('DOMContentLoaded', handler);
            var popup = _this.popup(),
                div = document.createElement('div'),
                timeout = 20000,
                isCompleted = false,
                timer;

            div.className = 'popup-inner loading-icon';
            div.innerHTML = '資源玩命加載中...';
            popup.show(div);

            timer = setTimeout(function(){
                clearTimeout(timer);
                if(!isCompleted){
                    enter();
                }
            }, timeout);

            _this.loadMedia(medias, function (cur, total) {
                if(cur === total){
                    enter();
                }else{
                    div.innerHTML = '資源玩命加載中...' + Math.round(cur/total * 100) + '% ';
                }
            });

            function enter(){
                popup.hide();
                div.className = 'popup-inner';
                if(complete) complete();
                isCompleted = true;
            }
        });
    },
    share: function(){
        var sharePopup = this.popup({
            background: 'rgba(0,0,0,.7)',
            color: '#fff'
        });
        if(/MicroMessenger/i.test(window.navigator.userAgent)){
            sharePopup.show('<span class="popup-inner">請點擊微信右上角菜單選擇分享。</span>');
        }else{
            sharePopup.show('<span class="popup-inner">請點擊瀏覽分享菜單進行分享。</span>');
        }
    }
};
