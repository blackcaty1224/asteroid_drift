const g = new MiniGameEngine();
let gameStarted = false;
let gameOver = false;
let gameClear = false;
const GAS_URL = "https://script.google.com/macros/s/AKfycby0KIKvRdVO1KrqRNW1U_5LIEi4kW5hO3QSaahCd0rK-Jir5AdH3eXWcUlDpLvDrckX7A/exec";
let rankingData = [];
async function fetchRanking() {
    try {
        const res = await fetch(GAS_URL, {
            method: "GET",
            mode: "cors",
            redirect: "follow"
        });
        if (!res.ok) throw new Error("Network response was not ok");
        rankingData = await res.json();
    } catch (e) {
        console.error("ランキング取得失敗:", e);
    }
}
async function sendScore(name, score) {
    await fetch(GAS_URL, {
        method: "POST",
        body: JSON.stringify({ name: name, score: score })
    });
    fetchRanking();
}
function noise(x, y, seed) {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
    return n - Math.floor(n);
}
function createPlanetTexture(p) {
    const canvas = document.createElement('canvas');
    const size = p.r * 2 + 10;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    const center = size / 2;
    ctx.beginPath();
    ctx.arc(center, center, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.baseColor;
    ctx.fill();
    const step = 2;
    for (let py = -p.r; py < p.r; py += step) {
        for (let px = -p.r; px < p.r; px += step) {
            if (px * px + py * py <= p.r * p.r) {
                const n = noise((px + p.r) / p.detail, (py + p.r) / p.detail, p.seed);
                if (n > 0.6) {
                    ctx.fillStyle = `rgba(255,255,255,${(n - 0.6) * 0.3})`;
                    ctx.fillRect(center + px, center + py, step, step);
                } else if (n < 0.2) {
                    ctx.fillStyle = `rgba(0,0,0,${(0.2 - n) * 0.4})`;
                    ctx.fillRect(center + px, center + py, step, step);
                }
            }
        }
    }
    return canvas;
}
function generatePlanetData(x, y, radius) {
    const p = {
        x: x,
        y: y,
        r: radius,
        seed: Math.random() * 1000,
        baseColor: `hsl(${g.rnd(0, 360)}, 50%, 40%)`,
        detail: g.rnd(4, 8)
    };
    return p;
}
function createGalaxy() {
    planets = [];
    const targetCount = 300;
    const minDistance = 100;  
    const spawnRadius = 3000;
    const safeZoneRadius = 100;
    for (let i = 0; i < targetCount; i++) {
        let success = false;
        let attempts = 0;
        while (!success && attempts < 500) {
            attempts++;
            const r = g.rnd(50, 300);
            const dist = Math.sqrt(Math.random()) * spawnRadius;
            const angle = Math.random() * Math.PI * 2;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            if (dist < (safeZoneRadius + r)) {
                continue;
            }
            let collision = false;
            for (let p of planets) {
                const d = g.getDis(x, y, p.x, p.y);
                if (d < (r + p.r + minDistance)) {
                    collision = true;
                    break;
                }
            }
            if (!collision) {
                const pData = generatePlanetData(x, y, r);
                planets.push(pData);
                success = true;
            }
        }
    }
}
function checkCollisionForward() {
    for (let p of planets) {
        const dx = camX - p.x;
        const dy = camY - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < p.r + 20) {
            return true;
        }
    }
    
    return false;
}
let θ = 0;
let θv = 0;
let planets = [];
let camX = 0;
let camY = 0;
let camV = 0;
let fuel = 2000;
let m = 1;
const basescore = 1000;
let starttime = Date.now();
let scoretime;
let lastscore;
let cleaetime;
function drawGalaxy() {
    planets.forEach(p => {
        const screenX = p.x - camX;
        const screenY = p.y - camY;
        const margin = p.r + 50;
        if (screenX + g.vWidth / 2 < -margin || screenX + g.vWidth / 2 > g.vWidth + margin ||
            screenY + g.vHeight / 2 < -margin || screenY + g.vHeight / 2 > g.vHeight + margin) {
            return;
        }
        if (!p.image) {
            p.image = createPlanetTexture(p);
        }
        if (p.image) {
            const screenX1 = screenX * Math.cos(θ * (Math.PI / 180)) + screenY * Math.sin(θ * (Math.PI / 180)) + g.vWidth / 2;
            const screenY1 = screenY * Math.cos(θ * (Math.PI / 180)) + -1 * screenX * Math.sin(θ * (Math.PI / 180)) + g.vHeight / 2;
            g.drawImgC(p.image, screenX1, screenY1,- θ);
        }
    });
}
function setup(){
    g.loadImg("rocket", "images/rocket_01.png");
    g.loadSound("bgm","sounds/エッジワース・カイパーベルト_2.mp3")
    createGalaxy();
    fetchRanking();
}
function loop(){
    g.rect(0,0,800,600,"#0d0621","true")
    if (!gameStarted) {
        θ += 0.1;
        drawGalaxy();
        g.fText("ASTEROID DRIFT", 400, 220, "#00f0ff", 60, "center");
        g.fText("小惑星群を抜けろ", 400, 280, "#ffffff", 25, "center");
        g.rect(250, 320, 300, 120, "rgba(255, 255, 255, 0.1)", "true");
        g.fText("【操作方法】", 400, 345, "#ffff00", 18, "center");
        g.fText("矢印キー(↑↓): 加減速", 400, 375, "#fff", 16, "center");
        g.fText("矢印キー(←→): 旋回", 400, 400, "#fff", 16, "center");
        g.fText("※燃料切れに注意！", 400, 425, "#ffaaaa", 14, "center");
        if (Math.floor(Date.now() / 500) % 2 === 0) {
            g.fText(">> CLICK TO START <<", 400, 500, "#ffffff", 22, "center");
        }
        if (g.tapC) {
            gameStarted = true;
            g.playBGM("bgm");
            createGalaxy();
            starttime = Date.now();
            θ = 0;
        };
        θv = 0;
        camX = 0;
        camY = 0;
        camV = 0;
        fuel = 2000;
        m = 1;
    } else {
        if (gameOver) {
            g.rect(0, 0, 800, 600, "rgba(150, 0, 0, 0.3)", "true");
            drawGalaxy();
            g.fText("MISSION FAILED", 400, 200, "#ff3030", 60, "center");
            g.fText("機体が大破しました", 400, 250, "#ffffff", 20, "center");
            const dist = Math.floor(Math.sqrt(camX ** 2 + camY ** 2));
            const progress = Math.min(100, Math.floor((dist / 3050) * 100));
            g.rect(250, 300, 300, 100, "rgba(0, 0, 0, 0.5)", "true");
            g.fText("【航行データ】", 400, 325, "#aaa", 16, "center");
            g.fText(`到達距離: ${dist} m`, 400, 350, "#fff", 18, "center");
            g.fText(`目標達成率: ${progress}%`, 400, 380, "#ffff00", 18, "center");
            if (Math.floor(Date.now() / 500) % 2 === 0) {
                g.fText(">> CLICK TO RETRY <<", 400, 480, "#ffffff", 22, "center");
            }
            if (g.tapC) {
                gameOver = false;
                θ = 0;
                θv = 0;
                camX = 0;
                camY = 0;
                camV = 0;
                fuel = 2000;
                m = 1;
                starttime = Date.now();
            }
        }else{
            if (gameClear) {
                θ += 0.1;
                drawGalaxy();
                g.rect(0, 0, 800, 600, "rgba(0, 50, 100, 0.3)", "true");
                let rank = "C";
                if (lastscore > 2000) rank = "S";
                else if (lastscore > 1500) rank = "A";
                else if (lastscore > 1100) rank = "B";
                g.fText("MISSION COMPLETE", 400, 150, "#ffff00", 50, "center");
                g.fText("無事に小惑星群を突破しました！", 400, 200, "#ffffff", 20, "center");
                g.rect(200, 230, 400, 180, "rgba(255, 255, 255, 0.1)", "true");
                g.fText(`TIME: ${Math.floor((cleaetime)/1000)}s`, 300, 270, "#fff", 20, "left");
                g.fText(`燃料: ${Math.max(0, Math.floor(fuel / 20))}/100`, 300, 310, "#fff", 20, "left");
                g.fText(`SCORE: ${lastscore}`, 300, 350, "#fff", 25, "left");
                g.fText("RANK", 530, 280, "#aaa", 15, "center");
                g.fText(rank, 530, 350, rank === "S" ? "#ff00ff" : "#00ffff", 80, "center");
                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    g.fText(">> CLICK TO RETURN TO TITLE <<", 400, 500, "#ffffff", 20, "center");
                }
                if (g.tapC) {
                    gameClear = false;
                    planets = [];
                    createGalaxy();
                    θ = 0;
                    θv = 0;
                    camX = 0;
                    camY = 0;
                    camV = 0;
                    fuel = 2000;
                    m = 1;
                }
            }else{
                g.drawImgC("rocket", 400, 300, 0, 0.1, 0.1);
                m = 0.5 + fuel / 400;
                const speed = 0.05 / m;
                if (fuel >= 0) {
                    if (g.key[37]) {
                        θv -= speed;
                        fuel -= 3;
                    }
                    if (g.key[39]) {
                        θv += speed;
                        fuel -= 3;
                    }
                    if (g.key[38]) {
                        camV += speed;
                        fuel -= 1;
                    }
                   if (g.key[40]) {
                        camV -= speed;
                        fuel -= 1;
                    }
                }
                θ += θv;
                camX += Math.sin(θ * (Math.PI / 180)) * camV;
                camY += -1 * Math.cos(θ * (Math.PI / 180)) * camV;
                drawGalaxy();
                g.line(765,94,755,94,"#ffffff",6);
                g.line(760,97,760,503,"#ffffff",24);
                g.line(760,99,760,501,"#000000",20);
                if (fuel >= 100) {
                    g.line(760,100 + (2000 - fuel) / 20 * 4,760,500,"#ffff00",18);
                }else{
                    g.line(760,100 + (2000 - fuel) / 20 * 4,760,500,"#ff0000",18);
                }
                g.fText(`X: ${Math.floor(camX)} Y: ${Math.floor(camY)} θv: ${Math.floor(θv *100)} V: ${Math.floor(camV * 100)}`, 10, 580, "#0f0", 14);
                if (checkCollisionForward()) {
                    gameOver = true;
                    console.log("gameover");
                }
                if (camX ** 2 + camY ** 2 >= 9303500) {
                    cleaetime = Date.now() - starttime;
                    scoretime = (50000 - cleaetime) / 100 + basescore;
                    console.log(Date.now() - starttime);
                    lastscore = Math.floor(scoretime * (1 + fuel / 2000));
                    const playerName = prompt("名前を入力してください", "PILOT");
                    sendScore(playerName || "ANON", lastscore);
                    gameClear = true;
                }
            }
        }
    }
    g.rect(800, 0, 200, 600, "#1a1a2e", "true");
    g.line(800, 0, 800, 600, "#000000", 4);
    g.fText("TOP RANKERS", 900, 50, "#00f0ff", 20, "center");
    rankingData.forEach((data, i) => {
        const y = 100 + (i * 40);
        const color = i === 0 ? "#ffff00" : "#ffffff";
        g.fText(`${i + 1}. ${data[0]}`, 820, y, color, 16, "left");
        g.fText(`${data[1]}`, 980, y, color, 16, "right");
    });
}
g.start(setup, loop);
