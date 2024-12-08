import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import * as ENVIRONMENT from "./3d/environment";
import { ModelLoader } from "./3d/modelloader";
import { Shelf } from "./shelf/shelf";
import { Measurements } from "./3d/measurements";
import { DecorBuilder } from "./3d/decor_builder";
import { Navigation3D } from "./3d/navigation_3d";
import { Navigation2D } from "./2d/navigation_2d";
import { ControlPanel } from "./2d/control_panel";
import { Board } from "./shelf/entities/board";
import { ProductEntity } from "./entity_engine/product_entity";
import { ShelfCamera } from "./3d/camera";
import { ColorConfig } from "./color_config";
import { StyleGuide } from "./2d/style_guide";
import { Resources, WOOD_MATERIALS } from "./shelf/materials";

require("./app.css");

class App {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private modelLoader: ModelLoader;

    private shelf: Shelf;
    private ambientLight: BABYLON.HemisphericLight;
    private sun: BABYLON.DirectionalLight;

    // TODO: Clean up, encapsulate into methods
    // NOTE: If things change at runtime, and navigation3D might not yet be updated
    constructor() {
        const grid = document.createElement("div");
        grid.id = "mainGrid";
        document.body.appendChild(grid);

        const colorConfig = new ColorConfig(document.body);

        const sceneWrapper = document.createElement("div");
        sceneWrapper.id = "sceneWrapper";
        grid.appendChild(sceneWrapper);

        const canvas = document.createElement("canvas");
        canvas.id = "sceneCanvas";
        canvas.style.zIndex = "3";
        sceneWrapper.appendChild(canvas);

        var engine = new BABYLON.Engine(canvas, true, { stencil: true });
        window.addEventListener("resize", () => {
            engine.resize();
        });

        this.scene = new BABYLON.Scene(engine);

        this.scene.metadata = {
            debugOverlay: colorConfig,
        };

        const shelfCamera = new ShelfCamera(this.scene, canvas);
        const camera = shelfCamera.camera;
        camera.attachControl(canvas, true);

        const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", this.scene, 1.0, [camera]);
        ssao.radius = 0.5;
        ssao.totalStrength = 0.4;
        ssao.expensiveBlur = true;
        ssao.samples = 16;
        ssao.maxZ = 10;
        ssao.minZAspect = 0.1;
        ssao.textureSamples = 4;
        
        this.ambientLight = new BABYLON.HemisphericLight("Hemispheric light", new BABYLON.Vector3(0, 1, 0), this.scene);
        colorConfig.attachAnglePicker('Ambient Light Direction', {initialValue: this.ambientLight.direction}, (value) => {
            this.ambientLight.direction = value;
        });
        this.ambientLight.diffuse = BABYLON.Color3.FromHexString("#ffe5cc");
        colorConfig.attachColorPicker('Ambient Light Color', {initialValue: this.ambientLight.diffuse.toHexString()}, (value) => {
            this.ambientLight.diffuse = BABYLON.Color3.FromHexString(value);
        });
        this.ambientLight.intensity = 0.8;
        colorConfig.attachSlider('Ambient Intensity', {
                initialValue: this.ambientLight.intensity,
                min: 0,
                max: 3,
                step: 0.1,
            }, (value) => {
            this.ambientLight.intensity = value;
        });
        
        /*
        const dir0 = new BABYLON.DirectionalLight("Directional light #0", new BABYLON.Vector3(0.841626576496605, -0.2193391004130599, -0.49351298337996535), this.scene);
            dir0.intensity = 0.9;
            dir0.diffuse = new BABYLON.Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);
            dir0.specular = new BABYLON.Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);

        const dir1 = new BABYLON.DirectionalLight("Directional light #1", new BABYLON.Vector3(-0.9519937437504213, -0.24389315636999764, -0.1849974057546125), this.scene);
            dir1.intensity = 1.2;
            dir1.specular = new BABYLON.Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
            dir1.diffuse = new BABYLON.Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
        */

        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.311, -0.554, -0.772), this.scene);
        colorConfig.attachAnglePicker('Sun Direction', {initialValue: this.sun.direction}, (value) => {
            this.sun.direction = value;
        });
        this.sun.diffuse = BABYLON.Color3.FromHexString("#f5e5d6");
        this.sun.intensity = 0.2;
        colorConfig.attachColorPicker('Sun Light Color', {initialValue: this.sun.diffuse.toHexString()}, (value) => {
            this.sun.diffuse = BABYLON.Color3.FromHexString(value);
        });
        colorConfig.attachSlider('Sun Intensity', {
            initialValue: this.sun.intensity,
            min: 0,
            max: 3,
            step: 0.1,
        }, (value) => {
            this.sun.intensity = value;
        });

        const environment = new ENVIRONMENT.Environment(this.scene);
        
        this.shadowGenerator = environment.getShadowGenerator();

        environment.setRoomHeight(2.4);
        environment.setRoomWidth(3.5);
        environment.setRoomDepth(4.5);

        this.modelLoader = new ModelLoader(this.scene, this.shadowGenerator);
        // wait for all models to be loaded and create shelf afterwards
        this.loadModels().then(() => {
            this.shelf = this.createShelf();

            const initialCameraTarget = this.shelf.getBoundingBox().center.add(this.shelf.getPosition());
            camera.target = initialCameraTarget.clone();
            shelfCamera.setDesiredTarget(initialCameraTarget);

            const measurements = new Measurements(this.scene, this.shelf, camera);
            const navigation3D = new Navigation3D(this.scene, this.shelf, environment);
            
            const decor_builder = new DecorBuilder(this.modelLoader, this.shelf);
            const navigation2D = new Navigation2D(sceneWrapper, this.shelf);
            const controlPanel = new ControlPanel(grid, this.shelf, environment);

            navigation3D.EntitySelected.on((entity) => {
                if (entity instanceof ProductEntity) {
                    navigation2D.setSelectedProduct(entity);
                }

                if (entity instanceof Board) {
                    measurements.setSelectedBoard(entity);
                    measurements.createForBoard(entity);

                    const decors = decor_builder.getDecorForBoard(entity);
                    decors.forEach((decor) => {
                        navigation3D.highlightEntity(decor, Measurements.BOARD_MEASURE_COLOR);
                    });
                }

                if (entity instanceof ProductEntity) {
                    controlPanel.setSelectedProduct(entity);
                }
            });

            navigation3D.EntityDeselected.on((entity) => {
                if (entity instanceof Board) {
                    measurements.removeForBoard(entity);

                    const decors = decor_builder.getDecorForBoard(entity);
                    decors.forEach((decor) => {
                        navigation3D.removeHighlightEntity(decor);
                    });
                }
                
                navigation2D.setSelectedProduct(null);
                controlPanel.setSelectedProduct(null);
                measurements.setSelectedBoard(null);
            });

            navigation3D.BoardStoppedDragged.on((board) => {
                decor_builder.buildDecorForBoard(board);
                navigation3D.highlightEntity(board, Measurements.BOARD_MEASURE_COLOR);
            });

            navigation3D.ShelfMoved.on(() => {
                const shelfCenter = this.shelf.getBoundingBox().centerWorld;
                shelfCamera.setDesiredTarget(shelfCenter);

                WOOD_MATERIALS.forEach((shelfMaterial) => {
                    ((shelfMaterial.material as BABYLON.NodeMaterial).getBlockByName("referencePos") as BABYLON.InputBlock).value = this.shelf.root.position;
                });
            });

            navigation2D.DayNightButtonPressed.on((isNight) => {
                environment.setNight(isNight);

                if (isNight) {
                    this.setNight();
                } else {
                    this.setDay();
                }
            });

            navigation2D.DecorButtonPressed.on((active) => {
                decor_builder.setVisibility(active);
            });

            navigation2D.RulerButtonPressed.on((active) => {
                measurements.setVisibility(active);
            });

            navigation2D.BoardShortened.on((board) => {
                navigation3D.highlightEntity(board, Measurements.BOARD_MEASURE_COLOR);
            });

            navigation2D.BoardWidened.on((board) => {
                navigation3D.highlightEntity(board, Measurements.BOARD_MEASURE_COLOR);
            });
        });

        // hide/show the Inspector
        window.addEventListener("keydown", (ev) => {
            // Shift+Ctrl+Alt+I
            if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'I') {
                if (this.scene.debugLayer.isVisible()) {
                    this.scene.debugLayer.hide();
                } else {
                    this.scene.debugLayer.show({overlay: true});
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });

        new StyleGuide();
        new Resources(this.scene);
    }

    private setNight() {
        this.ambientLight.intensity = 0;
        this.sun.intensity = 0;
    }

    private setDay() {
        this.ambientLight.intensity = 0.8;
        this.sun.intensity = 0.2;
    }

    private loadModels() : Promise<void[]> {
        const modelUrls = [
            {
                url: "models/strut.glb",
            },
            {
                url: "models/foot.glb",
            },
            {
                url: "models/shelf_start.glb",
            },
            {
                url: "models/shelf_end.glb",
            },
            {
                url: "models/shelf_middle.glb",
            },
            {
                url: "models/shelf_stretch.glb",
            },
            {
                url: "models/clamp.glb",
            },
            {
                url: "models/decor_potted_plant_01.glb",
            },
            {
                url: "models/decor_potted_plant_02.glb",
            },
            {
                url: "models/decor_placeholder.glb",
            },
            {
                url: "models/decor_books_01.glb",
            },
            {
                url: "models/decor_books_02.glb",
            },
            {
                url: "models/decor_books_03.glb",
            },
            {
                url: "models/decor_books_04.glb",
            },
            {
                url: "models/decor_trinket_01.glb",
            },
            {
                url: "https://assets.babylonjs.com/meshes/roundedCube.glb",
            }
        ];

        // return a promise that resolves when all models are loaded
        return Promise.all(modelUrls.map(entry => this.modelLoader.preloadModel(entry.url)));
    }

    private createShelf() : Shelf {
        const shelf = new Shelf(this.modelLoader);
            
        shelf.setHeight(2.4);
        shelf.setStrutSpacing(0.5);

        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();

        shelf.addBoard(0.35, 1, 3);
        shelf.addBoard(0.77, 0, 2);
        shelf.addBoard(0.99, 2, 3);
        shelf.addBoard(1.21, 1, 2);
        shelf.addBoard(1.43, 2, 3);
        shelf.addBoard(1.65, 0, 2);
        shelf.addBoard(2.07, 1, 3);

        return shelf;
    }
}

new App();