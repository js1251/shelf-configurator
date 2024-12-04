import * as BABYLON from "@babylonjs/core";
import * as BABYLON_GUI from "@babylonjs/gui";
import { Board } from "../shelf/entities/board";
import { Shelf } from "../shelf/shelf";
import { Measurements } from "./measurements";
import { LiteEvent } from "../event_engine/LiteEvent";
import { Environment } from "./environment";
import * as ICON from "../2d/icons";
import { Entity } from "../entity_engine/entity";

class DeselectDetector {
    private previousPointerPosition: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private allowDeselection: boolean = false;
    private selectedEntity: Entity;

    setSelectedEntity(entity: Entity) {
        this.selectedEntity = entity;
    }

    constructor(scene: BABYLON.Scene, deselectEntity: () => void) {
        scene.onPointerObservable.add((pointerInfo) => {
            if (this.selectedEntity === undefined) {
                return;
            }
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this.previousPointerPosition = new BABYLON.Vector2(pointerInfo.event.clientX, pointerInfo.event.clientY);
                this.allowDeselection = true;
                return;
            }
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                const moveDistance = BABYLON.Vector2.Distance(this.previousPointerPosition, new BABYLON.Vector2(pointerInfo.event.clientX, pointerInfo.event.clientY));
                if (moveDistance < 5) {
                    this.allowDeselection = false;
                }

                this.allowDeselection = false;
                return;
            }
            
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
                if (!this.allowDeselection) {
                    return;
                }

                const pickedMesh = pointerInfo.pickInfo.pickedMesh;
                if (pickedMesh !== null) {
                    
                    if (this.selectedEntity.root.getChildMeshes().some((child) => {
                        return child === pickedMesh;
                    })) {
                        return;
                    }
                }

                deselectEntity();
                this.allowDeselection = false;
            }
        });
    }
}

export class Navigation3D {
    private readonly onEntitySelected = new LiteEvent<Entity>();
    public get EntitySelected() {
        return this.onEntitySelected.expose();
    }

    private readonly onEntityDeselected = new LiteEvent<Entity>();
    public get EntityDeselected() {
        return this.onEntityDeselected.expose();
    }

    private readonly onBoardDragged = new LiteEvent<Board>();
    public get BoardDragged() {
        return this.onBoardDragged.expose();
    }

    private readonly onBoardStoppedDragged = new LiteEvent<Board>();
    public get BoardStoppedDragged() {
        return this.onBoardStoppedDragged.expose();
    }

    private readonly onShelfMoved = new LiteEvent<void>();
    public get ShelfMoved() {
        return this.onShelfMoved.expose();
    }

    private scene: BABYLON.Scene;
    private shelf: Shelf;
    private environment: Environment;

    private selectedEntity: Entity;
    private highlightLayer: BABYLON.HighlightLayer;

    private deselectDetector: DeselectDetector;
    private dragStartX: number;

    private xDragThreshold;

    constructor(scene: BABYLON.Scene, shelf: Shelf, environment: Environment) {
        this.scene = scene;
        this.shelf = shelf;
        this.environment = environment;

        this.deselectDetector = new DeselectDetector(this.scene, this.deselectEntity.bind(this));

        // TODO: needs to update when shelf strut spacing changes
        this.xDragThreshold = this.shelf.getStrutSpacing() / 2;

        this.highlightLayer = new BABYLON.HighlightLayer("highlight", scene, {
            renderingGroupId: 0,
        });

        // TODO: add controls to new boards when they are created!
        this.shelf.getBoards().forEach((board) => {
            this.attachEntitySelectionControls(board);
            this.attachBoardDragControls(board);
        });

        this.shelf.getStruts().forEach((strut) => {
            this.attachEntitySelectionControls(strut);
        });

        this.attachShelfDragControls();

        this.shelf.BoardSizeChanged.on((board) => {
            // reselect to refresh highlight
            this.setSelectedBoard(board);
        });

        this.shelf.BoardRemoved.on((board) => {
            this.setSelectedBoard(null);
        });

        this.shelf.BoardAdded.on((board) => {
            this.attachBoardDragControls(board);
        });
    }

    setSelectedBoard(board: Board) {
        if (this.selectedEntity === board) {
            return;
        }

        this.selectedEntity = board;
        this.deselectDetector.setSelectedEntity(this.selectedEntity);

        if (!board) {
            return;
        }

        this.highlightEntity(board, Measurements.BOARD_MEASURE_COLOR);
        
        this.onEntitySelected.trigger(board);
    }

    highlightEntity(entity: Entity, color: BABYLON.Color3) {
        entity.root.getChildMeshes().forEach((mesh) => {
            this.highlightLayer.addMesh(mesh as BABYLON.Mesh, color);
        });

        if (entity instanceof Board) {
            entity.getAllDecor().forEach((decor) => {
                const decorNode = decor.root;
                decorNode.getChildMeshes().forEach((mesh) => {
                    this.highlightLayer.addMesh(mesh as BABYLON.Mesh, color);
                });
            });
        }
    }

    removeHighlightEntity(entity: Entity) {
        entity.root.getChildMeshes().forEach((mesh) => {
            this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
        });

        if (entity instanceof Board) {
            entity.getAllDecor().forEach((decor) => {
                const decorNode = decor.root;
                decorNode.getChildMeshes().forEach((mesh) => {
                    this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
                });
            });
        }
    }

    private deselectEntity() {
        if (!this.selectedEntity) {
            return
        }
        
        this.removeHighlightEntity(this.selectedEntity);

        this.onEntityDeselected.trigger(this.selectedEntity);

        this.selectedEntity.root.actionManager.hoverCursor = "pointer";
        this.selectedEntity = undefined;
        this.deselectDetector.setSelectedEntity(undefined);
    }

    attachEntitySelectionControls(entity: Entity) {
        // actionManager for hover cursor
        const actionManager = new BABYLON.ActionManager(this.scene);
        actionManager.isRecursive = true;
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (_) => {}));
        entity.root.actionManager = actionManager;

        actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickDownTrigger, (evt) => {
            if (this.selectedEntity !== entity) {
                this.deselectEntity();
            }

            this.setSelectedBoard(entity as Board);
        }));
    }


    attachBoardDragControls(board: Board) {
        const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragPlaneNormal: BABYLON.Vector3.Forward() });
        pointerDragBehavior.moveAttached = false;

        const increment = 0.01; // Define the increment value

        pointerDragBehavior.onDragStartObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
            // otherwise the hand would flicker when moved outside the board even during grabbing
            board.root.actionManager.hoverCursor = "grabbing";
            this.dragStartX = event.dragPlanePoint.x;
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
            // otherwise the hand would flicker when moved outside the board even during grabbing
            board.root.actionManager.hoverCursor = "grabbing";
            
            const currentPosition = event.dragPlanePoint;
            let updateRequired = false;

            let startStrut = board.getStartStrut();
            let startIndex = startStrut.getIndex();
            let endStrut = board.getEndStrut();
            let endIndex = endStrut.getIndex();

            // Check if board is moved to the left or right of the current strut
            const draggedDistance = currentPosition.x - this.dragStartX;

            // moving to left
            if (startIndex > 0 && draggedDistance < -this.xDragThreshold) {
                board.setSpanStruts(this.shelf.getStruts()[startIndex - 1], this.shelf.getStruts()[endIndex - 1]);

                this.dragStartX -= this.shelf.getStrutSpacing();
                updateRequired = true;
            }
            
            // moving to right
            if (endIndex < this.shelf.getStruts().length - 1 && draggedDistance > this.xDragThreshold) {
                board.setSpanStruts(this.shelf.getStruts()[startIndex + 1], this.shelf.getStruts()[endIndex + 1]);

                this.dragStartX += this.shelf.getStrutSpacing();
                updateRequired = true;
            }

            startStrut = board.getStartStrut();
            startIndex = startStrut.getIndex();
            endStrut = board.getEndStrut();
            endIndex = endStrut.getIndex();

            // Check if board is moved up or down

            // snap to the nearest increment and clamp to the shelf height
            const snappedHeight = Math.min(this.shelf.getHeight() - Shelf.FOOT_HEIGHT,Math.max(Shelf.FOOT_HEIGHT, Math.round(currentPosition.y / increment) * increment));
            
            // ensure board does not clip any other boards
            let clipped = false;
            for (let i = 0; i < this.shelf.getBoards().length; i++) {
                const otherBoard = this.shelf.getBoards()[i];
                if (otherBoard === board) {
                    continue;
                }

                const otherStartIndex = otherBoard.getStartStrut().getIndex();
                const otherEndIndex = otherBoard.getEndStrut().getIndex();
                
                if (startIndex > otherEndIndex || endIndex < otherStartIndex) {
                    continue;
                }

                const otherBoardHeight = otherBoard.getHeight();
                const difference = Math.abs(snappedHeight - otherBoardHeight);

                if (difference < Board.BOARD_THICKNESS) {
                    clipped = true;
                    break;
                }
            }
            
            if (snappedHeight !== board.getHeight() && !clipped) {
                board.setHeight(snappedHeight);
                updateRequired = true;
            }
    
            //event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));

            if (updateRequired) {
                // sort boards by height
                this.shelf.getBoards().sort((a, b) => {
                    return a.getHeight() - b.getHeight();
                });
            }

            this.onBoardDragged.trigger(board);
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grab";

            // reset back to grab, because of the flickering
            board.root.actionManager.hoverCursor = "grab";

            this.onBoardStoppedDragged.trigger(board);
        });

        board.addBehavior(pointerDragBehavior);
    }

    attachShelfDragControls() {
        const billBoardPos = this.shelf.getBoundingBox().center;
        billBoardPos.y = 0;

        const billboard = BABYLON.MeshBuilder.CreateDisc("dragHandle", { radius: 0.06 }, this.scene);
        billboard.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        billboard.renderingGroupId = 1;
        billboard.position = billBoardPos;

        const billBoardMaterial = new BABYLON.StandardMaterial("nav3D_dragHandleMaterial", this.scene);
        billBoardMaterial.diffuseColor = BABYLON.Color3.FromHexString("#090D2A");
        billBoardMaterial.specularColor = BABYLON.Color3.Black();
        billBoardMaterial.emissiveColor = BABYLON.Color3.Black();
        billBoardMaterial.alpha = 0.5;
        billBoardMaterial.freeze();
        billboard.material = billBoardMaterial;

        const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: 0.1 }, this.scene);
        plane.parent = billboard;

        var url = "data:image/svg+xml;base64," + window.btoa(ICON.drag.replace(/currentColor/g, "#F6F1E8"));
        var img = new BABYLON_GUI.Image("image", url);

        var advancedTexture = BABYLON_GUI.AdvancedDynamicTexture.CreateForMesh(plane, 256, 256);
        plane.material.name = "nav3D_dragHandleText";
        //plane.material.freeze(); // Note: material cant be frozen as its a billboard
        advancedTexture.addControl(img);
        plane.renderingGroupId = 2;
        plane.isPickable = false;

        this.shelf.addFollower(billboard);

        const pointerDragBehavior = new BABYLON.PointerDragBehavior({
            dragPlaneNormal: BABYLON.Vector3.Up(),
        });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragStartObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";

            const currentPosition = event.dragPlanePoint;
            currentPosition.x -= this.shelf.getBoundingBox().center.x;
            currentPosition.y = 0;

            // clamp the shelf to the room
            const room_bbox = this.environment.getBoundingBox();

            // TODO: use bounding box instead
            if (currentPosition.x - Board.BOARD_WIDTH / 2 < room_bbox.minimum.x) {
                currentPosition.x = room_bbox.minimum.x + Board.BOARD_WIDTH / 2;
            } else if (currentPosition.x + this.shelf.getWidth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.x) {
                currentPosition.x = room_bbox.maximum.x - this.shelf.getWidth() + Board.BOARD_WIDTH / 2;
            }

            if (currentPosition.z - Board.BOARD_WIDTH / 2 < room_bbox.minimum.z) {
                currentPosition.z = room_bbox.minimum.z + Board.BOARD_WIDTH / 2;
            } else if (currentPosition.z + this.shelf.getDepth() - Board.BOARD_WIDTH / 2 > room_bbox.maximum.z) {
                currentPosition.z = room_bbox.maximum.z - this.shelf.getDepth() + Board.BOARD_WIDTH / 2;
            }

            // move the shelf to the new position
            this.shelf.setPosition(currentPosition);
            this.onShelfMoved.trigger();

            //event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "default";
        });

        billboard.addBehavior(pointerDragBehavior);
        
        const actionManager = new BABYLON.ActionManager(this.scene);
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (_) => {}));
        actionManager.hoverCursor = "grab";
        billboard.actionManager = actionManager;
    }
}