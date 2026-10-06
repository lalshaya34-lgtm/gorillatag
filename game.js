"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const menu = document.getElementById("menu");
const startButton = document.getElementById("start");
const hud = document.getElementById("hud");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");

let W = innerWidth;
let H = innerHeight;
let playing = false;
let gameStart = 0;

const mouse = {
    x: W / 2,
    y: H / 2
};

const keys = {};

let platforms = [];
let trees = [];
let rocks = [];
let particles = [];

const player = {
    x: W / 2,
    y: H - 150,

    vx: 0,
    vy: 0,

    radius: 31,

    grounded: false,

    color: "#704b31"
};

const leftHand = {
    x: W / 2 - 100,
    y: H / 2,

    previousX: W / 2 - 100,
    previousY: H / 2,

    radius: 18,

    touching: false
};

const rightHand = {
    x: W / 2 + 100,
    y: H / 2,

    previousX: W / 2 + 100,
    previousY: H / 2,

    radius: 18,

    touching: false
};


/* =========================================================
   RESIZE
========================================================= */

function resize() {

    W = innerWidth;
    H = innerHeight;

    const dpr = Math.min(devicePixelRatio || 1, 2);

    canvas.width = W * dpr;
    canvas.height = H * dpr;

    canvas.style.width = W + "px";
    canvas.style.height = H + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildWorld();
}

addEventListener("resize", resize);


/* =========================================================
   INPUT
========================================================= */

addEventListener("mousemove", e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

addEventListener("keydown", e => {
    keys[e.code] = true;

    if (
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        e.preventDefault();
    }
});

addEventListener("keyup", e => {
    keys[e.code] = false;
});


/* =========================================================
   HELPERS
========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function circleRect(circle, rect) {

    const closestX = clamp(
        circle.x,
        rect.x,
        rect.x + rect.w
    );

    const closestY = clamp(
        circle.y,
        rect.y,
        rect.y + rect.h
    );

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return (
        dx * dx +
        dy * dy
    ) <= circle.radius * circle.radius;
}


/* =========================================================
   WORLD
========================================================= */

function buildWorld() {

    platforms = [
        {
            x: -50,
            y: H - 60,
            w: W + 100,
            h: 60,
            type: "ground"
        },

        {
            x: 40,
            y: H - 260,
            w: 270,
            h: 30,
            type: "rock"
        },

        {
            x: W - 310,
            y: H - 330,
            w: 270,
            h: 30,
            type: "rock"
        },

        {
            x: W / 2 - 140,
            y: H - 460,
            w: 280,
            h: 30,
            type: "rock"
        },

        {
            x: W / 2 - 410,
            y: H - 590,
            w: 180,
            h: 30,
            type: "rock"
        },

        {
            x: W / 2 + 230,
            y: H - 630,
            w: 180,
            h: 30,
            type: "rock"
        }
    ];

    trees = [
        { x: 75, y: H - 60, height: 360 },
        { x: W - 75, y: H - 60, height: 420 },
        { x: W / 2 - 400, y: H - 60, height: 300 },
        { x: W / 2 + 400, y: H - 60, height: 340 }
    ];

    rocks = [];

    for (let i = 0; i < 18; i++) {

        rocks.push({
            x: Math.random() * W,
            y: H - 80 - Math.random() * 80,
            size: 8 + Math.random() * 22
        });
    }
}


/* =========================================================
   RESET
========================================================= */

function resetPlayer() {

    player.x = W / 2;
    player.y = H - 140;

    player.vx = 0;
    player.vy = 0;

    player.grounded = false;

    leftHand.x = W / 2 - 100;
    leftHand.y = H / 2;

    rightHand.x = W / 2 + 100;
    rightHand.y = H / 2;

    leftHand.previousX = leftHand.x;
    leftHand.previousY = leftHand.y;

    rightHand.previousX = rightHand.x;
    rightHand.previousY = rightHand.y;

    particles = [];
}


/* =========================================================
   HAND FOLLOWING
========================================================= */

function updateHand(hand, offset) {

    hand.previousX = hand.x;
    hand.previousY = hand.y;

    const targetX = mouse.x + offset;
    const targetY = mouse.y;

    hand.x +=
        (targetX - hand.x) * 0.92;

    hand.y +=
        (targetY - hand.y) * 0.92;

    hand.x = clamp(
        hand.x,
        hand.radius,
        W - hand.radius
    );

    hand.y = clamp(
        hand.y,
        hand.radius,
        H - hand.radius
    );
}


/* =========================================================
   HAND PHYSICS
========================================================= */

function handPhysics(hand) {

    hand.touching = false;

    for (const p of platforms) {

        if (!circleRect(hand, p))
            continue;

        hand.touching = true;

        const dx =
            hand.x - hand.previousX;

        const dy =
            hand.y - hand.previousY;

        /*
          Push the gorilla opposite
          the direction of hand movement.
        */

        player.vx -= dx * 0.9;
        player.vy -= dy * 0.9;

        /*
          Find nearest point.
        */

        const cx = clamp(
            hand.x,
            p.x,
            p.x + p.w
        );

        const cy = clamp(
            hand.y,
            p.y,
            p.y + p.h
        );

        let nx = hand.x - cx;
        let ny = hand.y - cy;

        const len = Math.hypot(nx, ny);

        if (len > 0.001) {

            nx /= len;
            ny /= len;

        } else {

            nx = 0;
            ny = -1;
        }

        /*
          Prevent the hand from
          getting trapped inside.
        */

        hand.x =
            cx + nx * (hand.radius + 1);

        hand.y =
            cy + ny * (hand.radius + 1);

        /*
          Create little dirt particles.
        */

        if (
            Math.abs(dx) +
            Math.abs(dy) > 4
        ) {
            createDust(hand.x, hand.y);
        }
    }

    player.vx = clamp(
        player.vx,
        -22,
        22
    );

    player.vy = clamp(
        player.vy,
        -24,
        24
    );
}


/* =========================================================
   PLAYER PHYSICS
========================================================= */

function updatePlayer() {

    const oldX = player.x;
    const oldY = player.y;

    player.vy += 0.52;

    /*
      Tiny keyboard assistance.
    */

    if (keys.KeyA || keys.ArrowLeft)
        player.vx -= 0.12;

    if (keys.KeyD || keys.ArrowRight)
        player.vx += 0.12;

    /*
      Jump.
    */

    if (
        (
            keys.Space ||
            keys.KeyW ||
            keys.ArrowUp
        ) &&
        player.grounded
    ) {
        player.vy = -12;
        player.grounded = false;

        for (let i = 0; i < 10; i++) {
            createDust(
                player.x +
                (Math.random() - .5) * 50,
                player.y + 30
            );
        }
    }

    player.vx = clamp(
        player.vx,
        -22,
        22
    );

    player.vy = clamp(
        player.vy,
        -25,
        25
    );

    player.x += player.vx;
    player.y += player.vy;

    player.grounded = false;

    /*
      Platforms.
    */

    for (const p of platforms) {

        if (!circleRect(player, p))
            continue;

        const oldBottom =
            oldY + player.radius;

        const oldTop =
            oldY - player.radius;

        const oldRight =
            oldX + player.radius;

        const oldLeft =
            oldX - player.radius;

        /*
          Landing.
        */

        if (
            player.vy >= 0 &&
            oldBottom <= p.y + 8
        ) {

            player.y =
                p.y - player.radius;

            player.vy = 0;

            player.grounded = true;
        }

        /*
          Ceiling.
        */

        else if (
            player.vy < 0 &&
            oldTop >= p.y + p.h - 8
        ) {

            player.y =
                p.y +
                p.h +
                player.radius;

            player.vy = 0;
        }

        /*
          Sides.
        */

        else if (
            player.vx > 0 &&
            oldRight <= p.x + 8
        ) {

            player.x =
                p.x - player.radius;

            player.vx = 0;
        }

        else if (
            player.vx < 0 &&
            oldLeft >= p.x + p.w - 8
        ) {

            player.x =
                p.x +
                p.w +
                player.radius;

            player.vx = 0;
        }
    }

    /*
      Friction.
    */

    if (player.grounded)
        player.vx *= 0.82;
    else
        player.vx *= 0.994;

    /*
      Boundaries.
    */

    if (player.x < player.radius) {

        player.x = player.radius;
        player.vx *= -0.25;
    }

    if (player.x > W - player.radius) {

        player.x =
            W - player.radius;

        player.vx *= -0.25;
    }

    /*
      Respawn.
    */

    if (player.y > H + 300) {
        resetPlayer();
    }
}


/* =========================================================
   PARTICLES
========================================================= */

function createDust(x, y) {

    if (particles.length > 160)
        return;

    particles.push({
        x,
        y,

        vx: (Math.random() - .5) * 2,
        vy: -Math.random() * 2,

        life: 1,

        size:
            3 +
            Math.random() * 5
    });
}

function updateParticles() {

    for (const p of particles) {

        p.x += p.vx;
        p.y += p.vy;

        p.vy += .04;

        p.life -= .035;
    }

    particles =
        particles.filter(
            p => p.life > 0
        );
}

function drawParticles() {

    for (const p of particles) {

        ctx.globalAlpha = p.life;

        ctx.fillStyle = "#b08a5b";

        ctx.beginPath();

        ctx.arc(
            p.x,
            p.y,
            p.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.globalAlpha = 1;
}


/* =========================================================
   BACKGROUND
========================================================= */

function drawBackground() {

    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    gradient.addColorStop(
        0,
        "#61c5e5"
    );

    gradient.addColorStop(
        .5,
        "#91d96b"
    );

    gradient.addColorStop(
        1,
        "#3f913b"
    );

    ctx.fillStyle = gradient;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /*
      Far jungle.
    */

    ctx.fillStyle =
        "rgba(26,105,43,.35)";

    for (let i = 0; i < 14; i++) {

        const x =
            i * 100;

        const h =
            100 + (i % 4) * 35;

        ctx.beginPath();

        ctx.arc(
            x,
            H - 50 - h,
            70,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    /*
      Clouds.
    */

    ctx.fillStyle =
        "rgba(255,255,255,.5)";

    const cloudPositions = [
        [100, 80],
        [420, 135],
        [760, 75],
        [W - 150, 120]
    ];

    for (const [x, y] of cloudPositions) {

        ctx.beginPath();

        ctx.arc(x, y, 25, 0, Math.PI * 2);
        ctx.arc(x + 35, y - 12, 35, 0, Math.PI * 2);
        ctx.arc(x + 75, y, 25, 0, Math.PI * 2);

        ctx.fill();
    }
}


/* =========================================================
   TREES
========================================================= */

function drawTrees() {

    for (const tree of trees) {

        const top =
            tree.y - tree.height;

        /*
          Trunk.
        */

        ctx.fillStyle = "#54351e";

        ctx.fillRect(
            tree.x - 18,
            top,
            36,
            tree.height
        );

        /*
          Branches.
        */

        ctx.strokeStyle = "#4a2f1b";
        ctx.lineWidth = 14;
        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.moveTo(
            tree.x,
            top + tree.height * .4
        );

        ctx.lineTo(
            tree.x - 80,
            top + tree.height * .2
        );

        ctx.moveTo(
            tree.x,
            top + tree.height * .55
        );

        ctx.lineTo(
            tree.x + 80,
            top + tree.height * .3
        );

        ctx.stroke();

        /*
          Leaves.
        */

        const leaves = [
            [-65, 45, 55],
            [0, 15, 65],
            [65, 45, 55],
            [-35, -25, 48],
            [35, -30, 52]
        ];

        for (const [ox, oy, size] of leaves) {

            ctx.fillStyle =
                Math.random() > .5
                    ? "#237a38"
                    : "#2d873d";

            ctx.beginPath();

            ctx.arc(
                tree.x + ox,
                top + 70 + oy,
                size,
                0,
                Math.PI * 2
            );

            ctx.fill();
        }
    }
}


/* =========================================================
   PLATFORMS
========================================================= */

function drawPlatforms() {

    for (const p of platforms) {

        /*
          Shadow.
        */

        ctx.fillStyle = "#39271a";

        ctx.fillRect(
            p.x,
            p.y + 8,
            p.w,
            p.h
        );

        /*
          Rock.
        */

        ctx.fillStyle =
            p.type === "ground"
                ? "#624329"
                : "#695039";

        ctx.beginPath();

        ctx.roundRect(
            p.x,
            p.y,
            p.w,
            p.h,
            8
        );

        ctx.fill();

        /*
          Grass top.
        */

        ctx.fillStyle = "#348c3d";

        ctx.beginPath();

        ctx.roundRect(
            p.x,
            p.y,
            p.w,
            10,
            7
        );

        ctx.fill();
    }
}


/* =========================================================
   SMALL ROCKS
========================================================= */

function drawRocks() {

    ctx.fillStyle = "#557047";

    for (const rock of rocks) {

        ctx.beginPath();

        ctx.arc(
            rock.x,
            rock.y,
            rock.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================================================
   ARMS
========================================================= */

function drawArm(hand) {

    const sx = player.x;
    const sy = player.y;

    const dx =
        hand.x - sx;

    const dy =
        hand.y - sy;

    const length =
        Math.hypot(dx, dy);

    const angle =
        Math.atan2(dy, dx);

    ctx.save();

    ctx.translate(
        sx,
        sy
    );

    ctx.rotate(angle);

    /*
      Thick outline.
    */

    ctx.fillStyle = "#382419";

    ctx.beginPath();

    ctx.roundRect(
        0,
        -16,
        length,
        32,
        16
    );

    ctx.fill();

    /*
      Arm.
    */

    ctx.fillStyle = "#704b31";

    ctx.beginPath();

    ctx.roundRect(
        0,
        -11,
        length,
        22,
        11
    );

    ctx.fill();

    /*
      Arm highlight.
    */

    ctx.fillStyle =
        "rgba(255,255,255,.08)";

    ctx.beginPath();

    ctx.roundRect(
        8,
        -8,
        Math.max(0, length - 16),
        5,
        3
    );

    ctx.fill();

    ctx.restore();
}


/* =========================================================
   GORILLA
========================================================= */

function drawGorilla() {

    /*
      Body outline.
    */

    ctx.fillStyle = "#382419";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y,
        47,
        55,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Body.
    */

    ctx.fillStyle = "#704b31";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y,
        40,
        48,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Chest.
    */

    ctx.fillStyle = "#5c3c27";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y + 8,
        25,
        30,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Head outline.
    */

    ctx.fillStyle = "#382419";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y - 48,
        39,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Head.
    */

    ctx.fillStyle = "#704b31";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y - 48,
        33,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Ears.
    */

    ctx.fillStyle = "#513522";

    ctx.beginPath();

    ctx.arc(
        player.x - 33,
        player.y - 48,
        14,
        0,
        Math.PI * 2
    );

    ctx.arc(
        player.x + 33,
        player.y - 48,
        14,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Brow.
    */

    ctx.fillStyle = "#4b301f";

    ctx.fillRect(
        player.x - 25,
        player.y - 64,
        50,
        9
    );

    /*
      Eyes.
    */

    ctx.fillStyle = "#f0ead8";

    ctx.beginPath();

    ctx.arc(
        player.x - 12,
        player.y - 55,
        7,
        0,
        Math.PI * 2
    );

    ctx.arc(
        player.x + 12,
        player.y - 55,
        7,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle = "#111";

    ctx.beginPath();

    ctx.arc(
        player.x - 12,
        player.y - 55,
        3,
        0,
        Math.PI * 2
    );

    ctx.arc(
        player.x + 12,
        player.y - 55,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Muzzle.
    */

    ctx.fillStyle = "#4c3221";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y - 37,
        17,
        12,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Nose.
    */

    ctx.fillStyle = "#21150d";

    ctx.beginPath();

    ctx.ellipse(
        player.x,
        player.y - 40,
        9,
        6,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Mouth.
    */

    ctx.strokeStyle = "#21150d";
    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y - 31,
        11,
        .1,
        Math.PI - .1
    );

    ctx.stroke();
}


/* =========================================================
   HANDS
========================================================= */

function drawHand(hand) {

    /*
      Shadow.
    */

    ctx.fillStyle = "#382419";

    ctx.beginPath();

    ctx.arc(
        hand.x,
        hand.y,
        hand.radius + 5,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Palm.
    */

    ctx.fillStyle = "#704b31";

    ctx.beginPath();

    ctx.arc(
        hand.x,
        hand.y,
        hand.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    /*
      Fingers.
    */

    ctx.strokeStyle = "#3d281b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (let i = -1; i <= 1; i++) {

        ctx.beginPath();

        ctx.moveTo(
            hand.x + i * 5,
            hand.y + 4
        );

        ctx.lineTo(
            hand.x + i * 6,
            hand.y + 14
        );

        ctx.stroke();
    }
}


/* =========================================================
   CURSOR
========================================================= */

function drawCursor() {

    ctx.strokeStyle =
        "rgba(255,255,255,.9)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x - 9,
        mouse.y
    );

    ctx.lineTo(
        mouse.x + 9,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y - 9
    );

    ctx.lineTo(
        mouse.x,
        mouse.y + 9
    );

    ctx.stroke();
}


/* =========================================================
   GAME UPDATE
========================================================= */

function update() {

    updatePlayer();

    updateHand(leftHand, -24);
    updateHand(rightHand, 24);

    handPhysics(leftHand);
    handPhysics(rightHand);

    updateParticles();

    if (playing) {

        const elapsed =
            Math.floor(
                (performance.now() - gameStart) /
                1000
            );

        const minutes =
            String(
                Math.floor(elapsed / 60)
            ).padStart(2, "0");

        const seconds =
            String(
                elapsed % 60
            ).padStart(2, "0");

        timerText.textContent =
            minutes + ":" + seconds;
    }
}


/* =========================================================
   DRAW
========================================================= */

function draw() {

    drawBackground();

    drawTrees();

    drawRocks();

    drawPlatforms();

    /*
      Arms behind the body.
    */

    drawArm(leftHand);
    drawArm(rightHand);

    /*
      Gorilla.
    */

    drawGorilla();

    /*
      Hands in front.
    */

    drawHand(leftHand);
    drawHand(rightHand);

    drawParticles();

    drawCursor();
}


/* =========================================================
   LOOP
========================================================= */

function loop() {

    update();
    draw();

    requestAnimationFrame(loop);
}


/* =========================================================
   START
========================================================= */

startButton.addEventListener("click", () => {

    playing = true;

    gameStart = performance.now();

    menu.style.display = "none";
    hud.style.display = "block";

    statusText.textContent =
        "RUNNING";
});

resize();

resetPlayer();

loop();
