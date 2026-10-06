"use strict";

/* =========================================================
   CANVAS
========================================================= */

const canvas =
    document.getElementById("game");

const ctx =
    canvas.getContext("2d");

let W = innerWidth;
let H = innerHeight;

function resize() {

    W = innerWidth;
    H = innerHeight;

    const dpr =
        Math.min(
            devicePixelRatio || 1,
            2
        );

    canvas.width =
        W * dpr;

    canvas.height =
        H * dpr;

    canvas.style.width =
        W + "px";

    canvas.style.height =
        H + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    createWorld();
}

addEventListener(
    "resize",
    resize
);


/* =========================================================
   INPUT
========================================================= */

const keys = {};

const mouse = {
    x: W / 2,
    y: H / 2
};

addEventListener(
    "mousemove",
    e => {

        mouse.x =
            e.clientX;

        mouse.y =
            e.clientY;
    }
);

addEventListener(
    "keydown",
    e => {

        keys[e.code] = true;

        if (
            e.code === "Space" ||
            e.code === "ArrowUp"
        ) {
            e.preventDefault();
        }

        if (
            e.code === "KeyM" &&
            playing
        ) {
            toggleMenu();
        }
    }
);

addEventListener(
    "keyup",
    e => {

        keys[e.code] = false;
    }
);


/* =========================================================
   GAME STATE
========================================================= */

let playing = false;

const mods = {

    superJump: false,

    speed: false,

    lowGravity: false,

    fly: false,

    wallWalk: false,

    giantHands: false,

    rainbow: false,

    spin: false
};


/* =========================================================
   PLAYER
========================================================= */

const player = {

    x: W / 2,

    y: H - 140,

    vx: 0,

    vy: 0,

    radius: 31,

    grounded: false,

    rotation: 0,

    color: "#704b31"
};


/* =========================================================
   HANDS
========================================================= */

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
   WORLD
========================================================= */

let platforms = [];

let trees = [];

let vines = [];

let particles = [];

function createWorld() {

    platforms = [

        {
            x: -100,
            y: H - 60,
            w: W + 200,
            h: 60
        },

        {
            x: 30,
            y: H - 260,
            w: 280,
            h: 32
        },

        {
            x: W - 310,
            y: H - 335,
            w: 280,
            h: 32
        },

        {
            x: W / 2 - 150,
            y: H - 460,
            w: 300,
            h: 32
        },

        {
            x: W / 2 - 430,
            y: H - 590,
            w: 190,
            h: 32
        },

        {
            x: W / 2 + 240,
            y: H - 640,
            w: 190,
            h: 32
        }
    ];

    trees = [

        {
            x: 75,
            height: 370
        },

        {
            x: W - 75,
            height: 430
        },

        {
            x: W / 2 - 400,
            height: 300
        },

        {
            x: W / 2 + 400,
            height: 340
        }
    ];

    vines = [];

    for (
        let i = 0;
        i < 12;
        i++
    ) {

        vines.push({

            x:
                Math.random() *
                W,

            height:
                70 +
                Math.random() *
                170
        });
    }
}


/* =========================================================
   MATH
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(max,value)
    );
}

function circleRect(
    circle,
    rect
) {

    const x =
        clamp(
            circle.x,
            rect.x,
            rect.x + rect.w
        );

    const y =
        clamp(
            circle.y,
            rect.y,
            rect.y + rect.h
        );

    const dx =
        circle.x - x;

    const dy =
        circle.y - y;

    return (
        dx * dx +
        dy * dy
    ) <=
    circle.radius *
    circle.radius;
}


/* =========================================================
   HAND MOVEMENT
========================================================= */

function updateHand(
    hand,
    offset
) {

    hand.previousX =
        hand.x;

    hand.previousY =
        hand.y;

    const targetX =
        mouse.x + offset;

    const targetY =
        mouse.y;

    /*
       Giant hands modifier.
    */

    hand.radius =
        mods.giantHands
            ? 32
            : 18;

    /*
       Smooth mouse tracking.
    */

    hand.x +=
        (
            targetX -
            hand.x
        ) * .92;

    hand.y +=
        (
            targetY -
            hand.y
        ) * .92;

    hand.x =
        clamp(
            hand.x,
            hand.radius,
            W - hand.radius
        );

    hand.y =
        clamp(
            hand.y,
            hand.radius,
            H - hand.radius
        );
}


/* =========================================================
   HAND PROPULSION
========================================================= */

function handPhysics(
    hand
) {

    hand.touching =
        false;

    for (
        const p of platforms
    ) {

        if (
            !circleRect(
                hand,
                p
            )
        ) {
            continue;
        }

        hand.touching =
            true;

        const dx =
            hand.x -
            hand.previousX;

        const dy =
            hand.y -
            hand.previousY;

        let power =
            mods.speed
                ? 1.25
                : .82;

        /*
          Push body opposite
          hand movement.
        */

        player.vx -=
            dx * power;

        player.vy -=
            dy * power;

        /*
          Find nearest surface.
        */

        const cx =
            clamp(
                hand.x,
                p.x,
                p.x + p.w
            );

        const cy =
            clamp(
                hand.y,
                p.y,
                p.y + p.h
            );

        let nx =
            hand.x - cx;

        let ny =
            hand.y - cy;

        const length =
            Math.hypot(
                nx,
                ny
            );

        if (
            length > .001
        ) {

            nx /= length;
            ny /= length;

        } else {

            nx = 0;
            ny = -1;
        }

        /*
          Remove hand from surface.
        */

        hand.x =
            cx +
            nx *
            (hand.radius + 1);

        hand.y =
            cy +
            ny *
            (hand.radius + 1);

        /*
          Dust.
        */

        if (
            Math.abs(dx) +
            Math.abs(dy) > 5
        ) {

            for (
                let i=0;
                i<2;
                i++
            ) {
                dust(
                    hand.x,
                    hand.y
                );
            }
        }
    }
}


/* =========================================================
   PLAYER
========================================================= */

function updatePlayer() {

    /*
      Gravity.
    */

    let gravity =
        mods.lowGravity
            ? .16
            : .52;

    if (
        !mods.fly
    ) {
        player.vy += gravity;
    }

    /*
      Keyboard movement.
    */

    let movement =
        mods.speed
            ? .35
            : .14;

    if (
        keys.KeyA ||
        keys.ArrowLeft
    ) {
        player.vx -= movement;
    }

    if (
        keys.KeyD ||
        keys.ArrowRight
    ) {
        player.vx += movement;
    }

    /*
      Fly mode.
    */

    if (mods.fly) {

        if (
            keys.KeyW ||
            keys.ArrowUp
        ) {
            player.vy -= .45;
        }

        if (
            keys.KeyS ||
            keys.ArrowDown
        ) {
            player.vy += .45;
        }
    }

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

        player.vy =
            mods.superJump
                ? -20
                : -11.5;

        player.grounded =
            false;

        for (
            let i=0;
            i<12;
            i++
        ) {
            dust(
                player.x +
                (
                    Math.random() -
                    .5
                ) * 55,

                player.y + 30
            );
        }
    }

    /*
      Spin.
    */

    if (mods.spin) {

        player.rotation +=
            .12;
    } else {

        player.rotation *=
            .85;
    }

    /*
      Velocity.
    */

    const maxSpeed =
        mods.speed
            ? 32
            : 22;

    player.vx =
        clamp(
            player.vx,
            -maxSpeed,
            maxSpeed
        );

    player.vy =
        clamp(
            player.vy,
            -28,
            28
        );

    const oldX =
        player.x;

    const oldY =
        player.y;

    player.x +=
        player.vx;

    player.y +=
        player.vy;

    player.grounded =
        false;

    /*
      Platform collisions.
    */

    for (
        const p of platforms
    ) {

        if (
            !circleRect(
                player,
                p
            )
        ) {
            continue;
        }

        const oldBottom =
            oldY +
            player.radius;

        const oldTop =
            oldY -
            player.radius;

        const oldRight =
            oldX +
            player.radius;

        const oldLeft =
            oldX -
            player.radius;

        /*
          Top.
        */

        if (
            player.vy >= 0 &&
            oldBottom <=
                p.y + 8
        ) {

            player.y =
                p.y -
                player.radius;

            player.vy =
                0;

            player.grounded =
                true;
        }

        /*
          Bottom.
        */

        else if (
            player.vy < 0 &&
            oldTop >=
                p.y +
                p.h - 8
        ) {

            player.y =
                p.y +
                p.h +
                player.radius;

            player.vy =
                0;
        }

        /*
          Sides.
        */

        else if (
            player.vx > 0 &&
            oldRight <=
                p.x + 8
        ) {

            player.x =
                p.x -
                player.radius;

            if (
                !mods.wallWalk
            ) {
                player.vx =
                    0;
            }
        }

        else if (
            player.vx < 0 &&
            oldLeft >=
                p.x +
                p.w - 8
        ) {

            player.x =
                p.x +
                p.w +
                player.radius;

            if (
                !mods.wallWalk
            ) {
                player.vx =
                    0;
            }
        }
    }

    /*
      Wall walk.
    */

    if (
        mods.wallWalk
    ) {

        if (
            keys.KeyW ||
            keys.ArrowUp
        ) {
            player.vy -= .3;
        }
    }

    /*
      Friction.
    */

    if (
        player.grounded
    ) {

        player.vx *=
            .80;

    } else {

        player.vx *=
            .995;
    }

    /*
      Screen boundaries.
    */

    if (
        player.x <
        player.radius
    ) {

        player.x =
            player.radius;

        player.vx =
            Math.abs(
                player.vx
            ) * .3;
    }

    if (
        player.x >
        W -
        player.radius
    ) {

        player.x =
            W -
            player.radius;

        player.vx =
            -Math.abs(
                player.vx
            ) * .3;
    }

    /*
      Respawn.
    */

    if (
        player.y >
        H + 300
    ) {

        resetPlayer();
    }
}


/* =========================================================
   PARTICLES
========================================================= */

function dust(x,y){

    if (
        particles.length >
        180
    ) {
        return;
    }

    particles.push({

        x,
        y,

        vx:
            (
                Math.random() -
                .5
            ) * 2.5,

        vy:
            -Math.random() * 2.5,

        life: 1,

        size:
            3 +
            Math.random() * 5
    });
}

function updateParticles(){

    for (
        const p of particles
    ) {

        p.x += p.vx;
        p.y += p.vy;

        p.vy += .05;

        p.life -= .035;
    }

    particles =
        particles.filter(
            p =>
                p.life > 0
        );
}

function drawParticles(){

    for (
        const p of particles
    ) {

        ctx.globalAlpha =
            p.life;

        ctx.fillStyle =
            "#b18b61";

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

function drawBackground(){

    const sky =
        ctx.createLinearGradient(
            0,
            0,
            0,
            H
        );

    sky.addColorStop(
        0,
        "#55bfe5"
    );

    sky.addColorStop(
        .55,
        "#88d365"
    );

    sky.addColorStop(
        1,
        "#438f3b"
    );

    ctx.fillStyle =
        sky;

    ctx.fillRect(
        0,
        0,
        W,
        H
    );

    /*
      Distant mountains.
    */

    ctx.fillStyle =
        "rgba(35,100,45,.28)";

    ctx.beginPath();

    ctx.moveTo(
        0,
        H - 180
    );

    for (
        let x=0;
        x<=W;
        x+=100
    ) {

        const y =
            H -
            170 -
            Math.sin(
                x * .01
            ) * 50;

        ctx.lineTo(
            x,
            y
        );
    }

    ctx.lineTo(
        W,
        H
    );

    ctx.lineTo(
        0,
        H
    );

    ctx.fill();

    /*
      Clouds.
    */

    ctx.fillStyle =
        "rgba(255,255,255,.45)";

    const clouds=[
        [120,90],
        [440,140],
        [780,80],
        [W-170,135]
    ];

    for (
        const [x,y] of clouds
    ) {

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            25,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x+35,
            y-12,
            35,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x+72,
            y,
            25,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


/* =========================================================
   TREES
========================================================= */

function drawTrees(){

    for (
        const tree of trees
    ) {

        const top =
            tree.y -
            tree.height;

        /*
          Trunk shadow.
        */

        ctx.fillStyle =
            "#3d2818";

        ctx.fillRect(
            tree.x - 20,
            top,
            40,
            tree.height
        );

        /*
          Trunk.
        */

        ctx.fillStyle =
            "#63401f";

        ctx.fillRect(
            tree.x - 15,
            top,
            30,
            tree.height
        );

        /*
          Branches.
        */

        ctx.strokeStyle =
            "#52331c";

        ctx.lineWidth = 14;

        ctx.lineCap =
            "round";

        ctx.beginPath();

        ctx.moveTo(
            tree.x,
            top +
            tree.height*.45
        );

        ctx.lineTo(
            tree.x-85,
            top +
            tree.height*.2
        );

        ctx.moveTo(
            tree.x,
            top +
            tree.height*.55
        );

        ctx.lineTo(
            tree.x+85,
            top +
            tree.height*.28
        );

        ctx.stroke();

        /*
          Leaves.
        */

        const leaves=[
            [-70,45,60],
            [0,25,70],
            [70,45,60],
            [-35,-20,52],
            [40,-25,55]
        ];

        for (
            const [ox,oy,size]
            of leaves
        ) {

            ctx.fillStyle =
                Math.random()>.5
                    ? "#237b37"
                    : "#2d893e";

            ctx.beginPath();

            ctx.arc(
                tree.x+ox,
                top+70+oy,
                size,
                0,
                Math.PI*2
            );

            ctx.fill();
        }
    }
}


/* =========================================================
   VINES
========================================================= */

function drawVines(){

    ctx.strokeStyle =
        "rgba(30,105,45,.7)";

    ctx.lineWidth = 5;

    for (
        const vine of vines
    ) {

        ctx.beginPath();

        ctx.moveTo(
            vine.x,
            0
        );

        ctx.bezierCurveTo(
            vine.x-30,
            vine.height*.3,
            vine.x+30,
            vine.height*.65,
            vine.x,
            vine.height
        );

        ctx.stroke();
    }
}


/* =========================================================
   PLATFORMS
========================================================= */

function drawPlatforms(){

    for (
        const p of platforms
    ) {

        /*
          Shadow.
        */

        ctx.fillStyle =
            "#392619";

        ctx.fillRect(
            p.x,
            p.y+9,
            p.w,
            p.h
        );

        /*
          Rock.
        */

        ctx.fillStyle =
            "#655039";

        ctx.beginPath();

        ctx.roundRect(
            p.x,
            p.y,
            p.w,
            p.h,
            9
        );

        ctx.fill();

        /*
          Grass.
        */

        ctx.fillStyle =
            "#348c3d";

        ctx.beginPath();

        ctx.roundRect(
            p.x,
            p.y,
            p.w,
            11,
            8
        );

        ctx.fill();

        /*
          Rock details.
        */

        ctx.fillStyle =
            "rgba(255,255,255,.08)";

        ctx.fillRect(
            p.x+20,
            p.y+16,
            p.w*.25,
            4
        );
    }
}


/* =========================================================
   ARMS
========================================================= */

function drawArm(hand){

    const sx =
        player.x;

    const sy =
        player.y;

    const dx =
        hand.x-sx;

    const dy =
        hand.y-sy;

    const length =
        Math.hypot(
            dx,
            dy
        );

    const angle =
        Math.atan2(
            dy,
            dx
        );

    ctx.save();

    ctx.translate(
        sx,
        sy
    );

    ctx.rotate(
        angle
    );

    /*
      Outer arm.
    */

    ctx.fillStyle =
        "#362218";

    ctx.beginPath();

    ctx.roundRect(
        0,
        -18,
        length,
        36,
        18
    );

    ctx.fill();

    /*
      Main arm.
    */

    let color =
        player.color;

    if (
        mods.rainbow
    ) {

        color =
            `hsl(${(
                performance.now()/4
            )%360},70%,45%)`;
    }

    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.roundRect(
        0,
        -12,
        length,
        24,
        12
    );

    ctx.fill();

    /*
      Highlight.
    */

    ctx.fillStyle =
        "rgba(255,255,255,.1)";

    ctx.beginPath();

    ctx.roundRect(
        10,
        -8,
        Math.max(
            0,
            length-20
        ),
        5,
        3
    );

    ctx.fill();

    ctx.restore();
}


/* =========================================================
   GORILLA
========================================================= */

function drawGorilla(){

    ctx.save();

    ctx.translate(
        player.x,
        player.y
    );

    ctx.rotate(
        player.rotation
    );

    /*
      Body outline.
    */

    ctx.fillStyle =
        "#352217";

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        48,
        57,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Body.
    */

    ctx.fillStyle =
        player.color;

    ctx.beginPath();

    ctx.ellipse(
        0,
        0,
        41,
        50,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Chest.
    */

    ctx.fillStyle =
        "#593a26";

    ctx.beginPath();

    ctx.ellipse(
        0,
        9,
        26,
        31,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Head.
    */

    ctx.fillStyle =
        "#352217";

    ctx.beginPath();

    ctx.arc(
        0,
        -49,
        40,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle =
        player.color;

    ctx.beginPath();

    ctx.arc(
        0,
        -49,
        33,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Ears.
    */

    ctx.fillStyle =
        "#4c311f";

    ctx.beginPath();

    ctx.arc(
        -34,
        -49,
        15,
        0,
        Math.PI*2
    );

    ctx.arc(
        34,
        -49,
        15,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Brow.
    */

    ctx.fillStyle =
        "#492f1e";

    ctx.fillRect(
        -26,
        -66,
        52,
        10
    );

    /*
      Eyes.
    */

    ctx.fillStyle =
        "#f0ead7";

    ctx.beginPath();

    ctx.arc(
        -12,
        -56,
        7,
        0,
        Math.PI*2
    );

    ctx.arc(
        12,
        -56,
        7,
        0,
        Math.PI*2
    );

    ctx.fill();

    ctx.fillStyle =
        "#111";

    ctx.beginPath();

    ctx.arc(
        -12,
        -56,
        3,
        0,
        Math.PI*2
    );

    ctx.arc(
        12,
        -56,
        3,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Muzzle.
    */

    ctx.fillStyle =
        "#4a3020";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -38,
        17,
        12,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Nose.
    */

    ctx.fillStyle =
        "#1d120b";

    ctx.beginPath();

    ctx.ellipse(
        0,
        -41,
        9,
        6,
        0,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Mouth.
    */

    ctx.strokeStyle =
        "#1d120b";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.arc(
        0,
        -31,
        11,
        .1,
        Math.PI-.1
    );

    ctx.stroke();

    ctx.restore();
}


/* =========================================================
   HAND
========================================================= */

function drawHand(hand){

    /*
      Outer hand.
    */

    ctx.fillStyle =
        "#352217";

    ctx.beginPath();

    ctx.arc(
        hand.x,
        hand.y,
        hand.radius+5,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Palm.
    */

    let color =
        player.color;

    if (
        mods.rainbow
    ) {

        color =
            `hsl(${(
                performance.now()/4
            )%360},70%,45%)`;
    }

    ctx.fillStyle =
        color;

    ctx.beginPath();

    ctx.arc(
        hand.x,
        hand.y,
        hand.radius,
        0,
        Math.PI*2
    );

    ctx.fill();

    /*
      Fingers.
    */

    ctx.strokeStyle =
        "#3c281a";

    ctx.lineWidth = 3;

    ctx.lineCap =
        "round";

    for (
        let i=-1;
        i<=1;
        i++
    ) {

        ctx.beginPath();

        ctx.moveTo(
            hand.x+i*6,
            hand.y+3
        );

        ctx.lineTo(
            hand.x+i*7,
            hand.y+
            hand.radius*.75
        );

        ctx.stroke();
    }
}


/* =========================================================
   CURSOR
========================================================= */

function drawCursor(){

    ctx.strokeStyle =
        "white";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        mouse.x-10,
        mouse.y
    );

    ctx.lineTo(
        mouse.x+10,
        mouse.y
    );

    ctx.moveTo(
        mouse.x,
        mouse.y-10
    );

    ctx.lineTo(
        mouse.x,
        mouse.y+10
    );

    ctx.stroke();

    ctx.fillStyle =
        "rgba(255,255,255,.25)";

    ctx.beginPath();

    ctx.arc(
        mouse.x,
        mouse.y,
        3,
        0,
        Math.PI*2
    );

    ctx.fill();
}


/* =========================================================
   HUD
========================================================= */

function drawHUD(){

    const speed =
        Math.round(
            Math.hypot(
                player.vx,
                player.vy
            )
        );

    document.getElementById(
        "speedText"
    ).textContent =
        "SPEED: " + speed;
}


/* =========================================================
   MOD MENU
========================================================= */

const modMenu =
    document.getElementById(
        "modMenu"
    );

function toggleMenu(){

    modMenu.classList.toggle(
        "open"
    );
}

document
    .getElementById("closeMods")
    .onclick = toggleMenu;

document
    .querySelectorAll(".mod")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const name =
                    button.dataset.mod;

                mods[name] =
                    !mods[name];

                button.classList.toggle(
                    "active",
                    mods[name]
                );

                button.querySelector(
                    "b"
                ).textContent =
                    mods[name]
                        ? "ON"
                        : "OFF";
            }
        );
    });


/* =========================================================
   RESET
========================================================= */

function resetPlayer(){

    player.x =
        W / 2;

    player.y =
        H - 140;

    player.vx =
        0;

    player.vy =
        0;

    player.rotation =
        0;

    player.grounded =
        false;

    leftHand.x =
        W/2-100;

    leftHand.y =
        H/2;

    rightHand.x =
        W/2+100;

    rightHand.y =
        H/2;

    particles=[];
}


/* =========================================================
   START
========================================================= */

document
    .getElementById("play")
    .onclick = () => {

        playing =
            true;

        menu.style.display =
            "none";

        hud.style.display =
            "block";

        resetPlayer();
    };


/* =========================================================
   MAIN LOOP
========================================================= */

function update(){

    if (!playing)
        return;

    updatePlayer();

    updateHand(
        leftHand,
        -25
    );

    updateHand(
        rightHand,
        25
    );

    handPhysics(
        leftHand
    );

    handPhysics(
        rightHand
    );

    updateParticles();

    drawHUD();
}

function draw(){

    drawBackground();

    drawVines();

    drawTrees();

    drawPlatforms();

    /*
      Arms behind body.
    */

    drawArm(
        leftHand
    );

    drawArm(
        rightHand
    );

    /*
      Body.
    */

    drawGorilla();

    /*
      Hands.
    */

    drawHand(
        leftHand
    );

    drawHand(
        rightHand
    );

    drawParticles();

    drawCursor();
}

function loop(){

    update();

    draw();

    requestAnimationFrame(
        loop
    );
}

resize();

resetPlayer();

loop();
