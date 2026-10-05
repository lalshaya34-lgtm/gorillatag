import * as THREE from "three";


export class JungleGame {

    constructor({
        scene,
        camera,
        world,
        controls,
        playerColor
    }) {

        this.scene = scene;

        this.camera = camera;

        this.world = world;

        this.controls = controls;

        this.playerColor =
            playerColor || "#9148d8";


        /* =================================================
           PLAYER
        ================================================= */

        this.player = {

            position:
                new THREE.Vector3(
                    0,
                    1,
                    8
                ),

            velocity:
                new THREE.Vector3(),

            radius: .65,

            speed: 7,

            jumpPower: 8,

            grounded: true,

            active: false,

            infected: false
        };


        /* =================================================
           INPUT
        ================================================= */

        this.keys =
            Object.create(null);


        this.setupInput();


        /* =================================================
           PLAYER MODEL
        ================================================= */

        this.playerGroup =
            new THREE.Group();

        scene.add(
            this.playerGroup
        );


        this.createPlayer();


        /* =================================================
           BOTS
        ================================================= */

        this.bots = [];

        this.createBots();


        /* =================================================
           GAME
        ================================================= */

        this.timeRemaining = 300;

        this.gameOver = false;

        this.lastMessageTime = 0;
    }


    /* =====================================================
       INPUT
    ===================================================== */

    setupInput() {

        window.addEventListener(
            "keydown",
            event => {

                this.keys[
                    event.code
                ] = true;


                if (
                    event.code === "Space"
                ) {

                    this.jump();
                }
            }
        );


        window.addEventListener(
            "keyup",
            event => {

                this.keys[
                    event.code
                ] = false;
            }
        );
    }


    /* =====================================================
       PLAYER
    ===================================================== */

    createPlayer() {

        this.bodyMaterial =
            new THREE.MeshStandardMaterial({
                color:
                    this.playerColor
            });


        const body =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .9,
                    20,
                    14
                ),
                this.bodyMaterial
            );


        body.position.y =
            1.5;


        body.scale.set(
            1,
            1.25,
            1
        );


        this.playerGroup.add(
            body
        );


        this.body =
            body;


        this.leftArm =
            this.createArm(
                -1
            );


        this.rightArm =
            this.createArm(
                1
            );


        this.playerGroup.add(
            this.leftArm
        );


        this.playerGroup.add(
            this.rightArm
        );
    }


    createArm(side) {

        const group =
            new THREE.Group();


        const material =
            new THREE.MeshStandardMaterial({
                color:
                    this.playerColor
            });


        const arm =
            new THREE.Mesh(
                new THREE.CapsuleGeometry(
                    .27,
                    1.35,
                    6,
                    12
                ),
                material
            );


        arm.rotation.z =
            Math.PI / 2;


        group.add(
            arm
        );


        const hand =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .4,
                    14,
                    10
                ),
                material
            );


        hand.position.x =
            side * .9;


        group.add(
            hand
        );


        group.position.set(
            side * .85,
            1.4,
            0
        );


        return group;
    }


    setColor(color) {

        this.playerColor =
            color;


        this.bodyMaterial.color.set(
            color
        );
    }


    /* =====================================================
       START
    ===================================================== */

    start() {

        this.player.active =
            true;

        this.gameOver =
            false;

        this.timeRemaining =
            300;

        this.player.infected =
            false;

        this.bodyMaterial.color.set(
            this.playerColor
        );
    }


    /* =====================================================
       JUMP
    ===================================================== */

    jump() {

        if (
            !this.player.active ||
            !this.player.grounded
        ) {
            return;
        }


        this.player.velocity.y =
            this.player.jumpPower;


        this.player.grounded =
            false;
    }


    /* =====================================================
       UPDATE
    ===================================================== */

    update(dt) {

        if (
            !this.player.active ||
            this.gameOver
        ) {
            return;
        }


        this.updateTimer(dt);

        this.updateMovement(dt);

        this.updateBots(dt);

        this.updateArms(dt);

        this.checkTags();

        this.playerGroup.position.copy(
            this.player.position
        );
    }


    /* =====================================================
       MOVEMENT
    ===================================================== */

    updateMovement(dt) {

        const direction =
            new THREE.Vector3();


        if (this.keys.KeyW)
            direction.z -= 1;

        if (this.keys.KeyS)
            direction.z += 1;

        if (this.keys.KeyA)
            direction.x -= 1;

        if (this.keys.KeyD)
            direction.x += 1;


        if (
            direction.lengthSq() > 0
        ) {

            direction.normalize();


            const forward =
                new THREE.Vector3();


            this.camera.getWorldDirection(
                forward
            );


            forward.y = 0;


            if (
                forward.lengthSq() > 0
            ) {

                forward.normalize();
            }


            const right =
                new THREE.Vector3()
                    .crossVectors(
                        forward,
                        this.camera.up
                    )
                    .normalize();


            const move =
                new THREE.Vector3();


            move.addScaledVector(
                forward,
                -direction.z
            );


            move.addScaledVector(
                right,
                direction.x
            );


            move.normalize();


            this.player.velocity.x +=
                move.x *
                this.player.speed *
                dt *
                5;


            this.player.velocity.z +=
                move.z *
                this.player.speed *
                dt *
                5;
        }


        /* Horizontal friction */

        const friction =
            Math.pow(
                .08,
                dt
            );


        this.player.velocity.x *=
            friction;


        this.player.velocity.z *=
            friction;


        /* Gravity */

        this.player.velocity.y -=
            20 * dt;


        /* Move */

        this.player.position.addScaledVector(
            this.player.velocity,
            dt
        );


        /* Ground */

        if (
            this.player.position.y <= 1
        ) {

            this.player.position.y =
                1;

            this.player.velocity.y =
                0;

            this.player.grounded =
                true;

        } else {

            this.player.grounded =
                false;
        }


        /* World collision */

        this.world.resolveCollision(
            this.player.position,
            this.player.radius
        );


        /* Boundary */

        const maxDistance =
            88;


        const distance =
            Math.hypot(
                this.player.position.x,
                this.player.position.z
            );


        if (
            distance > maxDistance
        ) {

            const scale =
                maxDistance /
                distance;


            this.player.position.x *=
                scale;


            this.player.position.z *=
                scale;


            this.player.velocity.x *=
                -.3;


            this.player.velocity.z *=
                -.3;
        }


        /*
           Desktop camera follows
           the player's body.
        */

        if (
            !this.camera.parent
        ) {

            this.camera.position.set(
                this.player.position.x,
                this.player.position.y + 1.4,
                this.player.position.z
            );
        }
    }


    /* =====================================================
       BOTS
    ===================================================== */

    createBots() {

        const positions = [
            [-10, -10],
            [12, -8],
            [-18, 10],
            [18, 15]
        ];


        for (
            const [x, z]
            of positions
        ) {

            this.createBot(
                x,
                z
            );
        }
    }


    createBot(
        x,
        z
    ) {

        const group =
            new THREE.Group();


        const material =
            new THREE.MeshStandardMaterial({
                color:
                    Math.random() >
                    .5
                        ? 0xff4545
                        : 0x3e7fff
            });


        const body =
            new THREE.Mesh(
                new THREE.SphereGeometry(
                    .85,
                    16,
                    12
                ),
                material
            );


        body.scale.set(
            1,
            1.2,
            1
        );


        body.position.y =
            1.5;


        group.add(
            body
        );


        group.position.set(
            x,
            0,
            z
        );


        this.world.world.add(
            group
        );


        this.bots.push({

            group,

            velocity:
                new THREE.Vector3(),

            speed:
                1.5 +
                Math.random() * 1.3,

            target:
                new THREE.Vector3(),

            changeTarget:
                0
        });
    }


    updateBots(dt) {

        for (
            const bot
            of this.bots
        ) {

            bot.changeTarget -=
                dt;


            if (
                bot.changeTarget <= 0
            ) {

                bot.changeTarget =
                    1 +
                    Math.random() *
                    2;


                bot.target.copy(
                    this.player.position
                );


                /*
                    Occasionally wander
                    instead of directly chasing.
                */

                if (
                    Math.random() < .3
                ) {

                    bot.target.x +=
                        (Math.random() - .5) *
                        20;


                    bot.target.z +=
                        (Math.random() - .5) *
                        20;
                }
            }


            const direction =
                new THREE.Vector3()
                    .subVectors(
                        bot.target,
                        bot.group.position
                    );


            direction.y = 0;


            const distance =
                direction.length();


            if (
                distance > 1
            ) {

                direction.normalize();


                bot.velocity.x =
                    THREE.MathUtils.lerp(
                        bot.velocity.x,
                        direction.x *
                            bot.speed,
                        dt * 2
                    );


                bot.velocity.z =
                    THREE.MathUtils.lerp(
                        bot.velocity.z,
                        direction.z *
                            bot.speed,
                        dt * 2
                    );
            }


            bot.group.position.x +=
                bot.velocity.x *
                dt;


            bot.group.position.z +=
                bot.velocity.z *
                dt;


            bot.group.position.y =
                0;
        }
    }


    /* =====================================================
       TAGGING
    ===================================================== */

    checkTags() {

        if (
            this.player.infected
        ) {
            return;
        }


        for (
            const bot
            of this.bots
        ) {

            const distance =
                this.player.position.distanceTo(
                    bot.group.position
                );


            if (
                distance < 1.7
            ) {

                this.infect();

                break;
            }
        }
    }


    infect() {

        this.player.infected =
            true;


        this.bodyMaterial.color.set(
            0xff3333
        );


        this.showMessage(
            "INFECTED!",
            "#ff3333"
        );
    }


    /* =====================================================
       TIMER
    ===================================================== */

    updateTimer(dt) {

        this.timeRemaining -=
            dt;


        if (
            this.timeRemaining <= 0
        ) {

            this.timeRemaining =
                0;

            this.endGame();
        }
    }


    endGame() {

        if (
            this.gameOver
        ) {
            return;
        }


        this.gameOver =
            true;


        if (
            this.player.infected
        ) {

            this.showMessage(
                "THE INFECTED WIN",
                "#ff4444"
            );

        } else {

            this.showMessage(
                "RUNNERS WIN!",
                "#66ff66"
            );
        }
    }


    /* =====================================================
       ARM ANIMATION
    ===================================================== */

    armTime = 0;


    updateArms(dt) {

        this.armTime +=
            dt;


        const speed =
            Math.abs(
                this.player.velocity.x
            ) +
            Math.abs(
                this.player.velocity.z
            );


        const swing =
            Math.sin(
                this.armTime * 11
            ) *
            Math.min(
                speed * .035,
                .35
            );


        this.leftArm.rotation.z =
            swing;


        this.rightArm.rotation.z =
            -swing;
    }


    /* =====================================================
       MESSAGE
    ===================================================== */

    showMessage(
        message,
        color = "white"
    ) {

        const element =
            document.getElementById(
                "message"
            );


        element.textContent =
            message;


        element.style.color =
            color;


        clearTimeout(
            this.messageTimeout
        );


        this.messageTimeout =
            setTimeout(
                () => {

                    element.textContent =
                        "";

                },
                2500
            );
    }


    /* =====================================================
       RESET
    ===================================================== */

    reset() {

        const spawn =
            this.world.getRandomSpawn();


        this.player.position.copy(
            spawn
        );


        this.player.velocity.set(
            0,
            0,
            0
        );


        this.player.infected =
            false;


        this.player.grounded =
            true;


        this.bodyMaterial.color.set(
            this.playerColor
        );


        this.timeRemaining =
            300;


        this.gameOver =
            false;
    }


    /* =====================================================
       TIME STRING
    ===================================================== */

    getTimeString() {

        const seconds =
            Math.ceil(
                this.timeRemaining
            );


        const minutes =
            Math.floor(
                seconds / 60
            );


        const remaining =
            seconds % 60;


        return (
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(remaining)
                .padStart(2, "0")
        );
    }


    getStatus() {

        return this.player.infected
            ? "INFECTED"
            : "RUNNER";
    }


    getPlayerCount() {

        return (
            this.bots.length + 1
        );
    }
}
