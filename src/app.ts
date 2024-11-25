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

class App {
    private scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private modelLoader: ModelLoader;

    private shelf: Shelf;
    private ambientLight: BABYLON.HemisphericLight;
    private sun: BABYLON.DirectionalLight;

    // TODO: Clean up, encapsulate into methods
    // NOTE: If things change at runtime, measurements, decor and navigation3D might not yet be updated
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
        
        this.ambientLight = new BABYLON.HemisphericLight("ambient", new BABYLON.Vector3(-1, 1, -1), this.scene);
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

        this.sun = new BABYLON.DirectionalLight("sun", new BABYLON.Vector3(-0.528,-0.819,0.224), this.scene);
        colorConfig.attachAnglePicker('Sun Direction', {initialValue: this.sun.direction}, (value) => {
            this.sun.direction = value;
        });
        this.sun.diffuse = BABYLON.Color3.FromHexString("#f5e5d6");
        this.sun.intensity = 1.4;
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

        this.setDay();

        const environment = new ENVIRONMENT.Environment(this.scene);
        environment.RoomChanged.on((bbox) => {
            //camera.position = new BABYLON.Vector3(0, bbox.center.y, bbox.minimum.z);
            //camera.target = bbox.center;
        });
        
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

            this.shelf.BboxChanged.on((bbox) => {
                measurements.remove();
                measurements.createMeasurements();
            });

            navigation3D.EntitySelected.on((entity) => {
                if (entity instanceof Board) {
                    measurements.createForBoard(entity);
                    navigation2D.setSelectedBoard(entity);
                }

                if (entity instanceof ProductEntity) {
                    controlPanel.setSelectedProduct(entity);
                }
            });

            navigation3D.EntityDeselected.on((entity) => {
                if (entity instanceof Board) {
                    measurements.removeForBoard(entity);
                }
                
                navigation2D.setSelectedBoard(null);
                controlPanel.setSelectedProduct(null);
            });

            navigation3D.BoardStoppedDragged.on((board) => {
                if (board.getAllDecor().length === 0) {
                    decor_builder.buildDecorForBoard(board);
                    navigation3D.highlightEntity(board, Measurements.BOARD_MEASURE_COLOR);
                }
            });

            navigation3D.ShelfMoved.on(() => {
                const shelfCenter = this.shelf.getBoundingBox().centerWorld;
                shelfCamera.setDesiredTarget(shelfCenter);
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
                    this.scene.debugLayer.show();
                }
            }
        });

        // run the main render loop
        engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    // TODO: have a sun only during day and a ceiling light during night
    private setNight() {
        this.ambientLight.intensity = 0.3;
        this.sun.intensity = 0.1;
    }

    private setDay() {
        this.ambientLight.intensity = 0.5;
        this.sun.intensity = 0.5;   
    }

    private loadModels() : Promise<void[]> {
        const strutMaterial = new BABYLON.StandardMaterial("strut", this.scene);
        strutMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        strutMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        strutMaterial.freeze();

        const woodMaterial = new BABYLON.StandardMaterial("wood", this.scene);
        woodMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.20, 0.04);
        woodMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        woodMaterial.freeze();

        const defaultMaterial = new BABYLON.StandardMaterial("defaultMaterial", this.scene);
        defaultMaterial.freeze();

        const modelUrls = [
            {
                url: "models/strut.glb",
                material: strutMaterial
            },
            {
                url: "models/foot.glb",
                material: defaultMaterial
            },
            {
                url: "models/shelf_end.glb",
                material: woodMaterial
            },
            {
                url: "models/shelf_middle.glb",
                material: woodMaterial
            },
            {
                url: "models/shelf_stretch.glb",
                material: woodMaterial
            },
            {
                url: "models/clamp.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_potted_plant_01.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_potted_plant_02.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_placeholder.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_books_01.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_books_02.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_books_03.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_books_04.glb",
                material: defaultMaterial
            },
            {
                url: "models/decor_trinket_01.glb",
                material: defaultMaterial
            },
        ];

        // return a promise that resolves when all models are loaded
        return Promise.all(modelUrls.map(entry => this.modelLoader.preloadModel(entry.url, entry.material)));
    }

    private createShelf() : Shelf {
        const shelf = new Shelf(this.modelLoader);
            
        shelf.setHeight(2.4);

        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
        shelf.addStrutToEnd();
            
        shelf.setStrutSpacing(0.5);
        
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