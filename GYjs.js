/*
このプログラムは初心者が勝手に作りました。
著作権はあるよ。
使用するときはクレジット表記と使用報告をしてね。
メールアドレス : blackcaty1224@icloud.com
製作者 黒猫Y.M.
このプログラムは製作者によって少し改変されています。
*/
class MiniGameEngine {
    constructor() {
        this.vWidth = 800;
        this.vHeight = 600;
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        document.body.appendChild(this.canvas);
        document.body.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.body.style.backgroundColor = "#000";
        this.key = [];
        this.tapX = 0; this.tapY = 0; this.tapC = 0;
        this.acX = 0; this.acY = 0; this.acZ = 0;
        this.sounds = {};
        this.images = {};
        this.bgm = null;
        this.audioCtx = null;
        this.fps = 60;
        this.lastTime = 0;
        this.frameCount = 0;
        this.debugMode = false;
        this.init();
    }
 
    init() {
        window.addEventListener('resize', () => this.resize());
        this.resize();
        window.addEventListener('keydown', (e) => this.key[e.keyCode] = true);
        window.addEventListener('keyup', (e) => this.key[e.keyCode] = false);
        const updateTap = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const scale = 1000 / rect.width;
            this.tapX = (clientX - rect.left) * scale;
            this.tapY = (clientY - rect.top) * scale;
        };
        window.addEventListener('mousedown', (e) => { this.tapC = 1; updateTap(e); this.unlockAudio(); });
        window.addEventListener('mousemove', (e) => { if(this.tapC) updateTap(e); });
        window.addEventListener('mouseup', () => this.tapC = 0);
        window.addEventListener('touchstart', (e) => { this.tapC = 1; updateTap(e); this.unlockAudio(); e.preventDefault(); }, {passive: false});
        window.addEventListener('touchmove', (e) => { updateTap(e); e.preventDefault(); }, {passive: false});
        window.addEventListener('touchend', () => this.tapC = 0);
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) { if(this.bgm) this.bgm.pause(); }
            else { if(this.bgm) this.bgm.play(); }
        });
    }
 
    resize() {
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const ratio = 1000 / this.vHeight;
        let w = winW;
        let h = winW / ratio;
        if (h > winH) { h = winH; w = h * ratio; }
        this.canvas.style.width = w + "px";
        this.canvas.style.height = h + "px";
        this.canvas.width = 1000;
        this.canvas.height = this.vHeight;
        this.screenScale = w / 1000;
    }
 
    line(x1, y1, x2, y2, col, w=1) {
        this.ctx.strokeStyle = col;
        this.ctx.lineWidth = w;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    rect(x, y, w, h, col, fill=true) {
        this.ctx[fill ? 'fillStyle' : 'strokeStyle'] = col;
        this.ctx[fill ? 'fillRect' : 'strokeRect'](x, y, w, h);
    }
    circle(x, y, r, col, fill=true) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, r, 0, Math.PI*2);
        this.ctx[fill ? 'fillStyle' : 'strokeStyle'] = col;
        fill ? this.ctx.fill() : this.ctx.stroke();
    }
    fText(txt, x, y, col, size=20, align="left") {
        this.ctx.fillStyle = col;
        this.ctx.font = `${size}px sans-serif`;
        this.ctx.textAlign = align;
        this.ctx.fillText(txt, x, y);
    }
    fTextN(txt, x, y, col, size=20, lineH=25) {
        const lines = txt.split('\n');
        lines.forEach((line, i) => this.fText(line, x, y + (i * lineH), col, size));
    }
 
    async loadImg(name, src) {
        return new Promise(res => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                this.images[name] = img;
                res(img);
            };
        });
    }
    drawImgC(imgOrName, x, y, ang = 0, scX = 1, scY = 1) {
        const img = typeof imgOrName === 'string' ? this.images[imgOrName] : imgOrName;
        if (!img) {
            if (this.debugMode) console.warn(`Image "${imgOrName}" not found.`);
            return;
        }
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(ang * Math.PI / 180);
        this.ctx.scale(scX, scY);
        this.ctx.drawImage(img, -img.width / 2, -img.height / 2);
        this.ctx.restore();
    }
    drawImgLR(img, x, y) { this.drawImgC(img, x + img.width/2, y + img.height/2, 0, -1, 1); }
    unlockAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    loadSound(name, src) {
        const audio = new Audio(src);
        this.sounds[name] = audio;
    }
    playSE(name) {
        if(this.sounds[name]) {
            const s = this.sounds[name].cloneNode();
            s.play();
        }
    }
    playBGM(name) {
        if(this.bgm) this.bgm.pause();
        this.bgm = this.sounds[name];
        this.bgm.loop = true;
        this.bgm.play();
    }
    saveLS(key, val) {
        try {
            localStorage.setItem(key, JSON.stringify(val));
        } catch(e) {
            alert("保存に失敗しました。プライベートブラウズを解除してください。");
        }
    }
    loadLS(key) {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
    }
    rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    getDis(x1, y1, x2, y2) {return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));}
    start(setup, loop) {
        setup();
        const _loop = (time) => {
            this.fps = 1000 / (time - this.lastTime);
            this.lastTime = time;
            loop();
            if(this.debugMode) this.drawDebug();
            requestAnimationFrame(_loop);
        };
        requestAnimationFrame(_loop);
    }
    drawDebug() {
        this.rect(0, 0, 200, 100, "rgba(0,0,0,0.5)");
        this.fText(`FPS: ${Math.floor(this.fps)}`, 10, 20, "#fff", 14);
        this.fText(`TAP: ${Math.floor(this.tapX)}, ${Math.floor(this.tapY)} C:${this.tapC}`, 10, 40, "#fff", 14);
    }
}
