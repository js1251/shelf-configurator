import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import { Board } from "./shelf/entities/board";
import { Shelf } from "./shelf/shelf";
import { Strut } from "./shelf/entities/strut";
import { Measurements } from "./measurements";
import { LiteEvent } from "./event_engine/LiteEvent";
import { Environment } from "./environment";

// TODO: movement plane seems to be off still, boards pop up / side to side when moved
// TODO: highlight entire shelf when grabbing it

class DeselectDetector {
    private previousPointerPosition: BABYLON.Vector2 = BABYLON.Vector2.Zero();
    private allowDeselection: boolean = false;
    private selectedBoard: Board;

    setSelectedBoard(board: Board) {
        this.selectedBoard = board;
    }

    constructor(scene: BABYLON.Scene, deselectBoard: () => void) {
        scene.onPointerObservable.add((pointerInfo) => {
            if (this.selectedBoard === undefined) {
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
                    
                    if (this.selectedBoard.root.getChildMeshes().some((child) => {
                        return child === pickedMesh;
                    })) {
                        return;
                    }
                }

                deselectBoard();
                this.allowDeselection = false;
            }
        });
    }
}

export class Navigation3D {
    private readonly onBoardSelected = new LiteEvent<Board>();
    public get BoardSelected() {
        return this.onBoardSelected.expose();
    }

    private readonly onBoardDeselected = new LiteEvent<Board>();
    public get BoardDeselected() {
        return this.onBoardDeselected.expose();
    }

    private readonly onBoardDragged = new LiteEvent<Board>();
    public get BoardDragged() {
        return this.onBoardDragged.expose();
    }

    private readonly onBoardStoppedDragged = new LiteEvent<Board>();
    public get BoardStoppedDragged() {
        return this.onBoardStoppedDragged.expose();
    }

    private readonly onShelfMoved = new LiteEvent<Board>();
    public get ShelfMoved() {
        return this.onShelfMoved.expose();
    }

    private scene: BABYLON.Scene;
    private shelf: Shelf;
    private environment: Environment;

    private selectedBoard: Board;
    private highlightLayer: BABYLON.HighlightLayer;

    private deselectDetector: DeselectDetector;
    private dragStartX: number;

    private xDragThreshold;

    constructor(scene: BABYLON.Scene, shelf: Shelf, environment: Environment) {
        this.scene = scene;
        this.shelf = shelf;
        this.environment = environment;

        this.deselectDetector = new DeselectDetector(this.scene, this.deselectBoard.bind(this));

        // TODO: needs to update when shelf strut spacing changes
        this.xDragThreshold = this.shelf.getStrutSpacing() / 2;

        this.highlightLayer = new BABYLON.HighlightLayer("highlight", scene, {
            renderingGroupId: 0,
        });

        // TODO: add controls to new boards when they are created!
        this.shelf.getBoards().forEach((board) => {
            this.attachBoardDragControls(board);
        });

        // TODO: add controls to new struts when they are created!
        this.shelf.getStruts().forEach((strut) => {
            this.attachStrutDragControls(strut);
        });
    }

    setSelectedBoard(board: Board) {
        this.selectedBoard = board;
        this.deselectDetector.setSelectedBoard(this.selectedBoard);

        if (!board) {
            return;
        }

        board.root.getChildMeshes().forEach((mesh) => {
            this.highlightLayer.addMesh(mesh as BABYLON.Mesh, Measurements.BOARD_MEASURE_COLOR);
        });

        board.getAllDecor().forEach((decor) => {
            const decorNode = decor.root;
            decorNode.getChildMeshes().forEach((mesh) => {
                this.highlightLayer.addMesh(mesh as BABYLON.Mesh, Measurements.BOARD_MEASURE_COLOR);
            });
        });
        
        this.onBoardSelected.trigger(board);
    }

    private deselectBoard() {
        if (!this.selectedBoard) {
            return
        }
        
        this.selectedBoard.root.getChildMeshes().forEach((mesh) => {
            this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
        });

        this.selectedBoard.getAllDecor().forEach((decor) => {
            const decorNode = decor.root;
            decorNode.getChildMeshes().forEach((mesh) => {
                this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
            });
        });

        this.onBoardDeselected.trigger(this.selectedBoard);

        this.selectedBoard.root.actionManager.hoverCursor = "pointer";
        this.selectedBoard = undefined;
        this.deselectDetector.setSelectedBoard(undefined);
    }

    private attachBoardDragControls(board: Board) {
        const actionManager = new BABYLON.ActionManager(this.scene);
        actionManager.isRecursive = true;
        actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, (_) => {}));
        board.root.actionManager = actionManager;
        
        const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragPlaneNormal: BABYLON.Vector3.Forward() });
        //pointerDragBehavior.useObjectOrientationForDragging = false;
        //pointerDragBehavior.updateDragPlane = false;
        pointerDragBehavior.moveAttached = false;

        const increment = 0.01; // Define the increment value

        pointerDragBehavior.onDragStartObservable.add((event) => {
            if (this.selectedBoard !== board) {
                this.deselectBoard();
            }

            board.root.actionManager.hoverCursor = "grab";
            this.setSelectedBoard(board);

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
            
            // reselect the current board, just to highlight all decor again
            this.setSelectedBoard(board);
        });

        board.addBehavior(pointerDragBehavior);
    }

    attachStrutDragControls(strut: Strut) {
        const pointerDragBehavior = new BABYLON.PointerDragBehavior({
            dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
        });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        //pointerDragBehavior.updateDragPlane = false;
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragStartObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";

            const currentPosition = event.dragPlanePoint;
            currentPosition.y = 0;

            // clamp the shelf to the room
            const room_bbox = this.environment.getBoundingBox();

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

            //event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "default";
        });

        strut.addBehavior(pointerDragBehavior);
    }
}