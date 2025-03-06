import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import * as BABYLON from "@babylonjs/core";
import { ShelfLoadingScreen } from "./shelf_loading_screen";
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
import { StyleGuide } from "./2d/style_guide";
import { METAL_MATERIALS, Resources, WOOD_MATERIALS } from "./shelf/materials";
import { Environment } from "./3d/environment";

require("./app.css");

class App {
    private grid: HTMLElement;
    private canvas: HTMLCanvasElement;
    private sceneWrapper: HTMLElement;

    private engine: BABYLON.Engine;
    private scene: BABYLON.Scene;
    private shelfCamera: ShelfCamera;
    private environment: Environment;
    //private shadowGenerator: BABYLON.ShadowGenerator;

    private modelLoader: ModelLoader;

    private shelf: Shelf;

    // TODO: Clean up, encapsulate into methods
    // NOTE: If things change at runtime, and navigation3D might not yet be updated

    public async init() {
        this.setupCanvas();
        this.setupEngine();
        this.setupScene();
        
        new StyleGuide();

        // run the main render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });

        this.setupCamera();
        this.setupSSAO();
        this.setupEnvironment();
        
        this.setupBackButton();
        this.setupWiPOverlay();

        await this.loadResources();
        
        this.shelf = this.createShelf();

        const initialCameraTarget = this.shelf.getBoundingBox().center.add(this.shelf.getPosition());
        this.shelfCamera.camera.target = initialCameraTarget.clone();
        this.shelfCamera.setDesiredTarget(initialCameraTarget);

        const measurements = new Measurements(this.scene, this.shelf, this.shelfCamera.camera);
        const navigation3D = new Navigation3D(this.scene, this.shelf, this.environment);
            
        const decor_builder = new DecorBuilder(this.modelLoader, this.shelf);
        const navigation2D = new Navigation2D(this.sceneWrapper, this.shelf);
        const controlPanel = new ControlPanel(this.grid, this.shelf, this.environment);

        setTimeout(() => {
            this.engine.hideLoadingUI();
        }, 1000);

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
            this.shelfCamera.setDesiredTarget(shelfCenter);

            WOOD_MATERIALS.forEach((shelfMaterial) => {
                ((shelfMaterial.material as BABYLON.NodeMaterial).getBlockByName("referencePos") as BABYLON.InputBlock).value = this.shelf.root.position;
            });
        });

        navigation2D.DayNightButtonPressed.on((isNight) => {
            if (isNight) {
                this.environment.setNight();
            } else {
                this.environment.setDay();
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
    }

    private setupCanvas() {
        this.grid = document.createElement("div");
        this.grid.id = "mainGrid";
        document.body.appendChild(this.grid);

        this.sceneWrapper = document.createElement("div");
        this.sceneWrapper.id = "sceneWrapper";
        this.grid.appendChild(this.sceneWrapper);

        this.canvas = document.createElement("canvas");
        this.canvas.id = "sceneCanvas";
        this.canvas.style.zIndex = "3";
        this.sceneWrapper.appendChild(this.canvas);
    }

    private setupEngine() {
        this.engine = new BABYLON.Engine(this.canvas, true, { stencil: true });
        window.addEventListener("resize", () => {
            this.engine.resize();
        });

        this.engine.loadingScreen = new ShelfLoadingScreen();
        this.engine.displayLoadingUI();
    }

    private setupScene() {
        this.scene = new BABYLON.Scene(this.engine);
    }

    private setupCamera() {
        this.shelfCamera = new ShelfCamera(this.scene, this.canvas);
        this.shelfCamera.camera.attachControl(this.canvas, true);
    }
    
    private setupSSAO() {
        const ssao = new BABYLON.SSAO2RenderingPipeline("ssao", this.scene, 1.0, [this.shelfCamera.camera]);
        ssao.radius = 0.5;
        ssao.totalStrength = 0.4;
        ssao.expensiveBlur = true;
        ssao.samples = 16;
        ssao.maxZ = 10;
        ssao.minZAspect = 0.1;
        ssao.textureSamples = 4;
    }

    private setupEnvironment() {
        this.environment = new Environment(this.scene);
        this.environment.setRoomHeight(2.4);
        this.environment.setRoomWidth(3.5);
        this.environment.setRoomDepth(4.5);
    }

    private setupWiPOverlay() {
        const wipOverlay = document.createElement("div");
        wipOverlay.id = "wipOverlay";

        const title = document.createElement("h5");
        title.innerHTML = "Der Konfigurator ist noch in Arbeit und repräsentiert nicht das finale Produkt.";
        wipOverlay.appendChild(title);

        this.sceneWrapper.appendChild(wipOverlay);
    }

    private setupBackButton() {
        const container = document.createElement("div");
        container.id = "backButtonContainer";
        this.sceneWrapper.appendChild(container);

        const button = document.createElement("button");
        button.id = "backButton";
        button.innerHTML = "⟵";
        button.className = "button button-inverted button-rounded";

        button.onclick = () => {
            // check if back will return user to a serenepieces.com page
            if (document.referrer.includes("serenepieces.com")) {
                window.history.back();
            } else {
                window.location.href = "https://serenepieces.com";
            }
        };

        container.appendChild(button);

        const info = document.createElement("p");
        info.classList.add("hidden");
        info.id = "backButtonInfo";
        info.innerHTML = "Konfigurator verlassen";
        container.appendChild(info);

        container.addEventListener('mouseenter', () => {
            info.classList.add("visible");
            info.classList.remove("hidden");
        });

        container.addEventListener('mouseleave', () => {
            info.classList.add("hidden");
            info.classList.remove("visible");
        });
    }

    private async loadResources() {
        const resources = new Resources(this.scene)
        await resources.preloadMaterials();

        this.modelLoader = new ModelLoader(this.scene, this.environment.getShadowGenerator());
        await this.modelLoader.preloadModels();
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

        shelf.setStrutMaterial(METAL_MATERIALS[0].material);
        shelf.setBoardMaterial(WOOD_MATERIALS[0].material);

        return shelf;
    }
}

var app = new App();
app.init();