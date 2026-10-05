import * as THREE from "three";

import {
    PointerLockControls
} from "three/addons/controls/PointerLockControls.js";

import {
    VRButton
} from "three/addons/webxr/VRButton.js";

import {
    JungleWorld
} from "./world.js";

import {
    JungleGame
} from "./game.js";


/* =========================================================
   DOM
========================================================= */

const menu =
    document.getElementById("menu");

const playButton =
    document.getElementById("playButton");

const vrButton =
    document.getElementById("vrButton");

const settingsButton =
    document.getElementById("settingsButton");

const settings =
    document.getElementById("settings");

const closeSettings =
    document.getElementById("closeSettings");

const sensitivity =
    document.getElementById("sensitivity");

const playerColor =
    document.getElementById("playerColor");

const hud =
    document.getElementById("hud");

const crosshair =
    document.getElementById("crosshair");

const loading =
    document.getElementById("loading");

const errorBox =
    document.getElementById("error");

const statusText =
    document.getElementById("statusText");

const timer =
    document.getElementById("timer");

const playerCount =
    document.getElementById("playerCount");


/* =========================================================
   SCENE
========================================================= */

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x83c9ff
    );


scene.fog =
    new THREE.Fog(
        0x83c9ff,
        35,
        170
    );


/* =========================================================
   CAMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        75,
        window.innerWidth /
        window.innerHeight,
        .05,
        500
    );


camera.position.set(
    0,
    2.4,
    8
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true,
        powerPreference:
            "high-performance"
    });


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.setPixelRatio(
    Math.min(
        window.devicePixelRatio,
        2
    )
);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


renderer.xr.enabled =
    true;


document.body.appendChild(
    renderer.domElement
);


/* =========================================================
   POINTER LOCK
========================================================= */

const controls =
    new PointerLockControls(
        camera,
        document.body
    );


/*
    Keep pointer-lock sensitivity
    configurable.
*/

function updateSensitivity() {

    /*
        PointerLockControls uses
        the browser's movement values.
        We apply our own multiplier
        to the camera rotation.
    */

    controls.pointerSpeed =
        Number(
            sensitivity.value
        );
}


updateSensitivity();


sensitivity.addEventListener(
    "input",
    updateSensitivity
);


/* =========================================================
   WORLD
========================================================= */

const world =
    new JungleWorld(
        scene
    );


/* =========================================================
   GAME
========================================================= */

const game =
    new JungleGame({
        scene,
        camera,
        world,
        controls,
        playerColor:
            playerColor.value
    });


/* =========================================================
   COLOR
========================================================= */

playerColor.addEventListener(
    "input",
    () => {

        game.setColor(
            playerColor.value
        );
    }
);


/* =========================================================
   DESKTOP START
========================================================= */

playButton.addEventListener(
    "click",
    () => {

        game.start();


        menu.style.display =
            "none";


        hud.style.display =
            "block";


        crosshair.style.display =
            "block";


        controls.lock();
    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

controls.addEventListener(
    "unlock",
    () => {

        if (
            game.player.active &&
            !renderer.xr.isPresenting
        ) {

            crosshair.style.display =
                "none";
        }
    }
);


controls.addEventListener(
    "lock",
    () => {

        if (
            game.player.active
        ) {

            crosshair.style.display =
                "block";
        }
    }
);


/* =========================================================
   SETTINGS
========================================================= */

settingsButton.addEventListener(
    "click",
    () => {

        settings.style.display =
            "flex";
    }
);


closeSettings.addEventListener(
    "click",
    () => {

        settings.style.display =
            "none";
    }
);


/* =========================================================
   VR
========================================================= */

let vrSupported =
    false;

let officialVRButton =
    null;


async function setupVR() {

    if (
        !("xr" in navigator)
    ) {

        vrButton.textContent =
            "VR UNAVAILABLE";

        vrButton.disabled =
            true;

        return;
    }


    try {

        vrSupported =
            await navigator.xr
                .isSessionSupported(
                    "immersive-vr"
                );


        if (
            !vrSupported
        ) {

            vrButton.textContent =
                "VR NOT SUPPORTED";

            vrButton.disabled =
                true;

            return;
        }


        /*
            The browser's official WebXR
            button is used to enter VR.
        */

        officialVRButton =
            VRButton.createButton(
                renderer
            );


        officialVRButton.style.display =
            "none";


        document.body.appendChild(
            officialVRButton
        );


        vrButton.textContent =
            "ENTER VR";

    } catch (error) {

        console.warn(
            "VR setup failed:",
            error
        );


        vrButton.textContent =
            "VR UNAVAILABLE";


        vrButton.disabled =
            true;
    }
}


setupVR();


/* =========================================================
   VR START
========================================================= */

vrButton.addEventListener(
    "click",
    () => {

        if (
            !vrSupported ||
            !officialVRButton
        ) {

            return;
        }


        game.start();


        menu.style.display =
            "none";


        hud.style.display =
            "block";


        /*
            Call the actual WebXR button
            while still inside the user's
            click event.
        */

        officialVRButton.click();
    }
);


/* =========================================================
   VR SESSION EVENTS
========================================================= */

renderer.xr.addEventListener(
    "sessionstart",
    () => {

        crosshair.style.display =
            "none";
    }
);


renderer.xr.addEventListener(
    "sessionend",
    () => {

        if (
            game.player.active
        ) {

            crosshair.style.display =
                "block";
        }
    }
);


/* =========================================================
   HUD
========================================================= */

function updateHUD() {

    if (
        !game.player.active
    ) {
        return;
    }


    statusText.textContent =
        game.getStatus();


    timer.textContent =
        game.getTimeString();


    playerCount.textContent =
        game.getPlayerCount();


    if (
        game.player.infected
    ) {

        statusText.style.color =
            "#ff4444";

    } else {

        statusText.style.color =
            "#66ee70";
    }
}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* =========================================================
   ERROR HANDLING
========================================================= */

window.addEventListener(
    "error",
    event => {

        console.error(
            event.error
        );


        errorBox.textContent =
            "Game error: " +
            (
                event.error?.message ||
                event.message ||
                "Unknown error"
            );
    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            event.reason
        );


        errorBox.textContent =
            "Game error: " +
            String(
                event.reason
            );
    }
);


/* =========================================================
   GAME LOOP
========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    const dt =
        Math.min(
            clock.getDelta(),
            .05
        );


    game.update(
        dt
    );


    updateHUD();


    renderer.render(
        scene,
        camera
    );
}


renderer.setAnimationLoop(
    animate
);


/* =========================================================
   FINISH LOADING
========================================================= */

requestAnimationFrame(
    () => {

        loading.style.display =
            "none";
    }
);

</script>
