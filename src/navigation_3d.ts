import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";
import { Board } from "./shelf/entities/board";
import { Shelf } from "./shelf/shelf";
import { Strut } from "./shelf/entities/strut";
import { Measurements } from "./measurements";
import { LiteEvent } from "./event_engine/LiteEvent";
import { Environment } from "./environment";

export class Navigation3D {
    private scene: BABYLON.Scene;
    private shelf: Shelf;
    private environment: Environment;

    private highlightLayer: BABYLON.HighlightLayer;

    private readonly onBoardGrabbed = new LiteEvent<Board>();
    public get BoardGrabbed() {
        return this.onBoardGrabbed.expose();
    }

    private readonly onBoardReleased = new LiteEvent<Board>();
    public get BoardReleased() {
        return this.onBoardReleased.expose();
    }

    private readonly onBoardChanged = new LiteEvent<Board>();
    public get BoardChanged() {
        return this.onBoardChanged.expose();
    }

    private readonly onShelfMoved = new LiteEvent<Board>();
    public get ShelfMoved() {
        return this.onShelfMoved.expose();
    }

    private manager: BABYLONGUI.GUI3DManager;

    constructor(scene: BABYLON.Scene, shelf: Shelf, environment: Environment) {
        this.scene = scene;
        this.shelf = shelf;
        this.environment = environment;

        this.manager = new BABYLONGUI.GUI3DManager(this.scene);

        this.highlightLayer = new BABYLON.HighlightLayer("highlight", scene, {
            renderingGroupId: 0,
        });

        // TODO: add controls to new boards when they are created!
        this.shelf.getBoards().forEach((board) => {
            this.attachBoardDragControls(board);
            //this.createButtonsForBoard(board);
        });

        // TODO: add controls to new struts when they are created!
        this.shelf.getStruts().forEach((strut) => {
            this.attachStrutDragControls(strut);
        });
    }

    attachBoardDragControls(board: Board) {
        const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragAxis: BABYLON.Vector3.Up() });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        pointerDragBehavior.updateDragPlane = false;
        pointerDragBehavior.moveAttached = false;

        const increment = 0.01; // Define the increment value
        let currentStrutPosX = 0; // Define the start position

        const getCurrentStrutPosX = (xPos: number): number => {
            return Math.floor(xPos / this.shelf.getStrutSpacing()) * this.shelf.getStrutSpacing();
        };

        pointerDragBehavior.onDragStartObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
            currentStrutPosX = getCurrentStrutPosX(event.dragPlanePoint.x);
            this.onBoardGrabbed.trigger(board);
    
            board.root.getChildMeshes().forEach((mesh) => {
                this.highlightLayer.addMesh(mesh as BABYLON.Mesh, Measurements.BOARD_MEASURE_COLOR);
            });

            board.getAllDecor().forEach((decor) => {
                const decorNode = decor.root;
                decorNode.getChildMeshes().forEach((mesh) => {
                    this.highlightLayer.addMesh(mesh as BABYLON.Mesh, Measurements.BOARD_MEASURE_COLOR);
                });
            });
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";

            const currentPosition = event.dragPlanePoint;
            let updateRequired = false;

            let startStrut = board.getStartStrut();
            let startIndex = startStrut.getIndex();
            let endStrut = board.getEndStrut();
            let endIndex = endStrut.getIndex();

            /*
            * Check if board is moved to the left or right of the current strut
            */
            const strutTransition = currentPosition.x - currentStrutPosX;

            if (startIndex > 0 && strutTransition < 0) {
                board.setSpanStruts(this.shelf.getStruts()[startIndex - 1], this.shelf.getStruts()[endIndex - 1]);

                currentStrutPosX = getCurrentStrutPosX(currentPosition.x);
                updateRequired = true;
            }
            
            if (endIndex < this.shelf.getStruts().length - 1 && strutTransition > this.shelf.getStrutSpacing()) {
                board.setSpanStruts(this.shelf.getStruts()[startIndex + 1], this.shelf.getStruts()[endIndex + 1]);

                currentStrutPosX = getCurrentStrutPosX(currentPosition.x);
                updateRequired = true;
            }

            startStrut = board.getStartStrut();
            startIndex = startStrut.getIndex();
            endStrut = board.getEndStrut();
            endIndex = endStrut.getIndex();

            /*
            * Check if board is moved up or down
            */

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
    
            event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));

            if (updateRequired) {
                // sort boards by height
                this.shelf.getBoards().sort((a, b) => {
                    return a.getHeight() - b.getHeight();
                });

                this.onBoardChanged.trigger(board);
            }
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "default";

            board.root.getChildMeshes().forEach((mesh) => {
                this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
            });

            board.getAllDecor().forEach((decor) => {
                const decorNode = decor.root;
                decorNode.getChildMeshes().forEach((mesh) => {
                    this.highlightLayer.removeMesh(mesh as BABYLON.Mesh);
                });
            });
            
            this.onBoardReleased.trigger(board);
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

    createButtonsForBoard(board: Board) {
        const getPosition = (strut: Strut, offset: number) => {
            const spawnPos = strut.getPosition().clone();
            spawnPos.y = board.getHeight();
            spawnPos.x += offset;
            return spawnPos;
        }

        const extendLeftButton = this.create3DButton(() => {
            const startStrut = board.getStartStrut();
            const endStrut = board.getEndStrut();
            const startStrutIndex = startStrut.getIndex();
            const endStrutIndex = endStrut.getIndex();
            board.setSpanStruts(this.shelf.getStruts()[Math.max(0, startStrutIndex - 1)], endStrut);
            extendLeftButton.position = getPosition(startStrut, -0.3);
        });
        extendLeftButton.position = getPosition(board.getStartStrut(), -0.3);

        const contractLeftButton = this.create3DButton(() => {
            const startStrut = board.getStartStrut();
            const endStrut = board.getEndStrut();
            const startStrutIndex = startStrut.getIndex();
            const endStrutIndex = endStrut.getIndex();
            board.setSpanStruts(this.shelf.getStruts()[Math.max(endStrutIndex - 1, startStrutIndex + 1)], endStrut);
            extendLeftButton.position = getPosition(startStrut, -0.18);
        });
        contractLeftButton.position = getPosition(board.getStartStrut(), -0.18);
    }

    private create3DButton(onClick: () => void) {
        const button = new BABYLONGUI.Button3D("button");
        this.manager.addControl(button);
        button.scaling = new BABYLON.Vector3(0.1, 0.1, 0.01);
        button.mesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

        button.onPointerClickObservable.add(onClick);

        return button;
    }
}