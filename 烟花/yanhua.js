window.addEventListener("resize", resizeCanvas, false);
window.addEventListener("DOMContentLoaded", onLoad, false);
        
var lastTime = 0;
var prefixes = 'webkit moz ms o'.split(' '); //各浏览器前缀
var requestAnimationFrame = window.requestAnimationFrame;
var cancelAnimationFrame = window.cancelAnimationFrame;
var prefix;
//通过遍历各浏览器前缀，来得到requestAnimationFrame和cancelAnimationFrame在当前浏览器的实现形式
for( var i = 0; i < prefixes.length; i++ ) {
    if ( requestAnimationFrame && cancelAnimationFrame ) {
      break;
    }
    prefix = prefixes[i];
    requestAnimationFrame = requestAnimationFrame || window[ prefix + 'RequestAnimationFrame' ];
    cancelAnimationFrame  = cancelAnimationFrame  || window[ prefix + 'CancelAnimationFrame' ] || window[ prefix + 'CancelRequestAnimationFrame' ];
}
//如果当前浏览器不支持requestAnimationFrame和cancelAnimationFrame，则会退到setTimeout
if ( !requestAnimationFrame || !cancelAnimationFrame ) {
    requestAnimationFrame = function( callback, element ) {
      var currTime = new Date().getTime();
      //为了使setTimteout的尽可能的接近每秒60帧的效果
      var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) ); 
      var id = window.setTimeout( function() {
        callback( currTime + timeToCall );
      }, timeToCall );
      lastTime = currTime + timeToCall;
      return id;
    };
    
    cancelAnimationFrame = function( id ) {
      window.clearTimeout( id );
    };
}

//得到兼容各浏览器的API  代替定时器
window.requestAnimationFrame = requestAnimationFrame; 
window.cancelAnimationFrame = cancelAnimationFrame;



// 以下为烟花内容
var canvas, ctx, w, h, particles = [], probability = 0.04,
    xPoint, yPoint;

function onLoad() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    resizeCanvas(); // 调整画布尺寸
    
    window.requestAnimationFrame(updateWorld);
} 

function resizeCanvas() {
    if (!!canvas) {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
    }
} 

function updateWorld() {
    update();
    paint();
    window.requestAnimationFrame(updateWorld);
} 

function update() {
    if (particles.length < 500 && Math.random() < probability) {
        createFirework();
    }
    var alive = [];
    for (var i=0; i<particles.length; i++) {
        if (particles[i].move()) {
            alive.push(particles[i]);
        }
    }
    particles = alive;
} 

function paint() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'lighter';
    for (var i=0; i<particles.length; i++) {
        particles[i].draw(ctx);
    }
} 

function createFirework() {
    xPoint = Math.random()*(w-200)+100;
    yPoint = Math.random()*(h-200)+100;
    var nFire = Math.random()*50+100;
    var c = "rgb("+(~~(Math.random()*200+55))+","
         +(~~(Math.random()*200+55))+","+(~~(Math.random()*200+55))+")";
    for (var i=0; i<nFire; i++) {
        var particle = new Particle();
        particle.color = c;
        var vy = Math.sqrt(25-particle.vx*particle.vx);
        if (Math.abs(particle.vy) > vy) {
            particle.vy = particle.vy>0 ? vy: -vy;
        }
        particles.push(particle);
    }
} 

function Particle() {
    this.w = this.h = Math.random()*4+1;
    
    this.x = xPoint-this.w/2;
    this.y = yPoint-this.h/2;
    
    this.vx = (Math.random()-0.5)*10;
    this.vy = (Math.random()-0.5)*10;
    
    this.alpha = Math.random()*.5+.5;
    
    this.color;
} 

Particle.prototype = {
    gravity: 0.05,
    move: function () {
        this.x += this.vx;
        this.vy += this.gravity;
        this.y += this.vy;
        this.alpha -= 0.01;
        if (this.x <= -this.w || this.x >= screen.width ||
            this.y >= screen.height ||
            this.alpha <= 0) {
                return false;
        }
        return true;
    },
    draw: function (c) {
        c.save();
        c.beginPath();
        
        c.translate(this.x+this.w/2, this.y+this.h/2);
        c.arc(0, 0, this.w, 0, Math.PI*2);
        c.fillStyle = this.color;
        c.globalAlpha = this.alpha;
        
        c.closePath();
        c.fill();
        c.restore();
    }
} 