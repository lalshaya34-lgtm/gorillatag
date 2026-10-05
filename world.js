import * as THREE from "three";


export class JungleWorld {

    constructor(scene) {

        this.scene = scene;

        this.world =
            new THREE.Group();

        scene.add(
            this.world
        );

        this.colliders = [];

        this.createLighting();

        this.createGround();

        this.createForest();

        this.createRocks();

        this.createPlatforms();

        this.createHill();

        this.createSpawnArea();
    }


    /* =====================================================
       LIGHTING
    ===================================================== */

    createLighting() {

        const sun =
            new THREE.DirectionalLight(
                0xffffff,
                2.1
            );

        sun.position.set(
            30,
            60,
            20
        );

        sun.castShadow = true;

        this.scene.add(
            sun
        );


        const ambient =
            new THREE.HemisphereLight(
                0xaee5ff,
                0x263d1e,
                1.4
            );

        this.scene.add(
            ambient
        );
    }


    /* =====================================================
       GROUND
    ===================================================== */

    createGround() {

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x3c8137,
                roughness: 1
            });


        const ground =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    95,
                    105,
                    1,
                    64
                ),
                material
            );


        ground.position.y =
            -0.5;


        this.world.add(
            ground
        );


        this.colliders.push({
            type: "ground",
            object: ground
        });
    }


    /* =====================================================
       TREES
    ===================================================== */

    createTree(
        x,
        z,
        scale = 1
    ) {

        const tree =
            new THREE.Group();


        const trunkMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x714523,
                roughness: 1
            });


        const trunk =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    .45,
                    .72,
                    7,
                    10
                ),
                trunkMaterial
            );


        trunk.position.y =
            3.5;


        tree.add(
            trunk
        );


        const leafMaterial =
            new THREE.MeshStandardMaterial({
                color: 0x247d32,
                roughness: 1
            });


        for (
            let i = 0;
            i < 6;
            i++
        ) {

            const leaf =
                new THREE.Mesh(
                    new THREE.IcosahedronGeometry(
                        2.25,
                        1
                    ),
                    leafMaterial
                );


            leaf.position.set(
                (Math.random() - .5) * 2.5,
                6 +
                Math.random() * 3,
                (Math.random() - .5) * 2.5
            );


            leaf.scale.setScalar(
                .75 +
                Math.random() * .45
            );


            tree.add(
                leaf
            );
        }


        tree.position.set(
            x,
            0,
            z
        );


        tree.scale.setScalar(
            scale
        );


        this.world.add(
            tree
        );


        this.colliders.push({
            type: "tree",
            x,
            z,
            radius:
                .75 * scale,
            height:
                7 * scale
        });
    }


    createForest() {

        const locations = [

            [-18, -18, 1.2],
            [-7, -27, .9],
            [7, -29, 1.1],
            [22, -21, 1.3],

            [-31, -4, 1.1],
            [30, 2, .9],

            [-27, 17, 1.4],
            [-10, 27, 1],
            [5, 31, 1.3],
            [23, 25, 1.1],

            [-45, -27, .9],
            [45, -22, 1],
            [-43, 20, 1.2],
            [43, 28, 1.1]
        ];


        for (
            const location
            of locations
        ) {

            this.createTree(
                ...location
            );
        }
    }


    /* =====================================================
       ROCKS
    ===================================================== */

    createRock(
        x,
        z,
        size
    ) {

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x657064,
                roughness: 1
            });


        const rock =
            new THREE.Mesh(
                new THREE.DodecahedronGeometry(
                    size,
                    1
                ),
                material
            );


        rock.position.set(
            x,
            size * .6,
            z
        );


        rock.rotation.set(
            Math.random(),
            Math.random(),
            Math.random()
        );


        this.world.add(
            rock
        );


        this.colliders.push({
            type: "rock",
            x,
            z,
            radius:
                size
        });
    }


    createRocks() {

        for (
            let i = 0;
            i < 35;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const distance =
                12 +
                Math.random() * 68;


            const size =
                .5 +
                Math.random() * 1.5;


            this.createRock(
                Math.cos(angle) *
                    distance,
                Math.sin(angle) *
                    distance,
                size
            );
        }
    }


    /* =====================================================
       PLATFORMS
    ===================================================== */

    createPlatform(
        x,
        y,
        z,
        sx,
        sy,
        sz
    ) {

        const platform =
            new THREE.Mesh(
                new THREE.BoxGeometry(
                    sx,
                    sy,
                    sz
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x80502d
                })
            );


        platform.position.set(
            x,
            y,
            z
        );


        this.world.add(
            platform
        );


        this.colliders.push({
            type: "platform",
            object: platform,

            minX:
                x - sx / 2,

            maxX:
                x + sx / 2,

            minY:
                y - sy / 2,

            maxY:
                y + sy / 2,

            minZ:
                z - sz / 2,

            maxZ:
                z + sz / 2
        });
    }


    createPlatforms() {

        this.createPlatform(
            -10,
            5,
            -10,
            8,
            1,
            8
        );


        this.createPlatform(
            12,
            7,
            -7,
            10,
            1,
            7
        );


        this.createPlatform(
            25,
            11,
            12,
            8,
            1,
            8
        );


        this.createPlatform(
            -27,
            9,
            13,
            10,
            1,
            7
        );
    }


    /* =====================================================
       HILL
    ===================================================== */

    createHill() {

        const hill =
            new THREE.Mesh(
                new THREE.ConeGeometry(
                    18,
                    14,
                    32
                ),
                new THREE.MeshStandardMaterial({
                    color: 0x477d35
                })
            );


        hill.position.set(
            0,
            6,
            -45
        );


        this.world.add(
            hill
        );
    }


    /* =====================================================
       SPAWN
    ===================================================== */

    createSpawnArea() {

        const material =
            new THREE.MeshStandardMaterial({
                color: 0x496c3d
            });


        const pad =
            new THREE.Mesh(
                new THREE.CylinderGeometry(
                    5,
                    5,
                    .2,
                    32
                ),
                material
            );


        pad.position.set(
            0,
            .1,
            8
        );


        this.world.add(
            pad
        );
    }


    /* =====================================================
       COLLISION
    ===================================================== */

    resolveCollision(
        position,
        radius
    ) {

        for (
            const collider
            of this.colliders
        ) {

            if (
                collider.type === "ground"
            ) {
                continue;
            }


            if (
                collider.type === "tree" ||
                collider.type === "rock"
            ) {

                const dx =
                    position.x -
                    collider.x;

                const dz =
                    position.z -
                    collider.z;


                const distance =
                    Math.hypot(
                        dx,
                        dz
                    );


                const minimum =
                    radius +
                    collider.radius;


                if (
                    distance < minimum &&
                    distance > .001
                ) {

                    const push =
                        minimum -
                        distance;


                    position.x +=
                        dx /
                        distance *
                        push;


                    position.z +=
                        dz /
                        distance *
                        push;
                }
            }
        }
    }


    /* =====================================================
       RANDOM SPAWN
    ===================================================== */

    getRandomSpawn() {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            4 +
            Math.random() * 20;


        return new THREE.Vector3(
            Math.cos(angle) *
                distance,
            1,
            8 +
                Math.sin(angle) *
                distance
        );
    }
}
