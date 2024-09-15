import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./../modelloader";
import { Board } from "./board";
import { Strut } from "./strut";
import { ThinParticleSystem } from "@babylonjs/core/Particles/thinParticleSystem";

export class Shelf {
    private height_m: number;

    private struts: Strut[] = [];
    private boards: Board[] = [];

    private scene: BABYLON.Scene;
    private modelloader: ModelLoader;

    private root: BABYLON.TransformNode;

    static HEADER_SERIALIZED_LENGTH = 6;
    static BOARD_SERIALIZED_LENGTH = 5;
    static FOOT_HEIGHT = 0.04;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.TransformNode) {
        this.scene = scene;
        this.modelloader = modelloader;
        this.root = root;

        this.setHeight(2.4);

        this.addStrutToEnd();
        this.addStrutToEnd();
        this.addStrutToEnd();
        this.addStrutToEnd();

        this.setStrutSpacing(0.5);

        this.addBoard(0.4, 1, 3);
        this.addBoard(0.8, 0, 2);
        this.addBoard(1.0, 2, 3);
        this.addBoard(1.2, 1, 2);
        this.addBoard(1.4, 2, 3);
        this.addBoard(1.6, 0, 2);
        this.addBoard(2.0, 1, 3);
    }

    setHeight(height_m: number) {
        // cant be higher than 616.95 meters (due to serialization using two bytes for height)
        if (height_m > 616.95) {
            throw new Error("Height is too high");
        }

        if (height_m < 0) {
            throw new Error("Height is too low");
        }

        // round to two decimal places
        this.height_m = Math.round(height_m * 100) / 100;

        // update all struts
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setHeight(this.height_m);
        }

        this.fireBboxChanged();
    }

    getHeight(): number {
        return this.height_m;
    }

    getWidth(): number {
        return this.getStrutSpacing() * (this.struts.length - 1) + Board.BOARD_WIDTH;
    }

    getDepth(): number {
        return Board.BOARD_WIDTH;
    }

    getStruts(): Strut[] {
        return this.struts;
    }

    setPosition(position: BABYLON.Vector3) {
        this.root.position = position;
    }

    addStrutToStart() {
        this.struts.unshift(this.createStrut(0, 0));

        // update all struts indices
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setIndex(i);
        }

        // update all boards start and end struts
        for (let i = 0; i < this.boards.length; i++) {
            const board = this.boards[i];
            board.setStartStrut(this.struts[board.getStartStrut().getIndex() + 1]);
            board.setEndStrut(this.struts[board.getEndStrut().getIndex() + 1]);
        }

        this.fireBboxChanged();
    }

    addStrutToEnd() {
        this.struts.push(this.createStrut(0, this.struts.length));
        this.fireBboxChanged();
    }

    private createStrut(offset: number, index: number) : Strut{
        const strut = new Strut(this.scene, this.modelloader, this.root, this.getHeight(), offset, index);

        const pointerDragBehavior = new BABYLON.PointerDragBehavior({
            dragPlaneNormal: new BABYLON.Vector3(0, 1, 0),
        });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        //pointerDragBehavior.updateDragPlane = false;
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragObservable.add((event) => {
            const currentPosition = event.dragPlanePoint;
            
            this.fireShelfMoved(currentPosition);

            //event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));
        });

        strut.getBabylonNode().addBehavior(pointerDragBehavior);

        return strut;
    }

    removeStrutAtStart() {
        this.struts.shift().remove();

        for (let i = 0; i < this.struts.length; i++) {
            const strut = this.struts[i];
            strut.setIndex(strut.getIndex() - 1);
        }

        // update all boards start and end struts
        for (let i = this.boards.length - 1; i >= 0; i--) {
            const board = this.boards[i];
            const startIndex = board.getStartStrut().getIndex() + 1;
            const endIndex = board.getEndStrut().getIndex() + 1;
            if (startIndex === 1) {
                if (endIndex - startIndex > 0) {
                    // shorten the board
                    board.setStartStrut(this.struts[startIndex - 1]);
                } else {
                    // the board needs to be removed
                    const index = this.boards.indexOf(board);
                    if (index > -1) {
                        board.remove()
                        this.boards.splice(index, 1);
                    }

                    continue;
                }
            }

            board.setStartStrut(this.struts[startIndex - 1]);
            board.setEndStrut(this.struts[endIndex - 1]);
        }

        this.fireBboxChanged();
    }

    removeStrutAtEnd() {
        if (this.struts.length < 2) {
            throw new Error("Cannot remove last strut");
        }

        this.struts.pop().remove();

        // iterate backwards to avoid index out of bounds
        for (let i = this.boards.length - 1; i >= 0; i--) {
            const board = this.boards[i];
            const startIndex = board.getStartStrut().getIndex();
            const endIndex = board.getEndStrut().getIndex();

            if (endIndex >= this.struts.length) {
                if (endIndex - startIndex === 1) {
                    const index = this.boards.indexOf(board);
                    if (index > -1) {
                        board.remove()
                        this.boards.splice(index, 1);
                    }

                    continue;
                }

                board.setEndStrut(this.struts[endIndex - 1]);
            }
        }

        this.fireBboxChanged();
    }

    setStrutSpacing(spacing: number) {
        if (spacing > 1.5) {
            throw new Error("Spacing is too high");
        }

        if (spacing < Board.BOARD_WIDTH) {
            throw new Error("Spacing is too low");
        }

        // round to two decimal places
        spacing = Math.round(spacing * 100) / 100;

        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setOffset(i * spacing);
        }
        
        this.fireBboxChanged();
    }

    getStrutSpacing(): number {
        if (this.struts.length < 2) {
            return 0;
        }

        return this.struts[1].getOffset() - this.struts[0].getOffset();
    }

    addBoard(height: number, startStrut: number, endStrut: number) {
        if (startStrut < 0 || startStrut >= this.struts.length) {
            throw new Error("Invalid start strut");
        }

        if (endStrut < 0 || endStrut >= this.struts.length) {
            throw new Error("Invalid end strut");
        }

        if (startStrut > endStrut) {
            throw new Error("Start strut must be before end strut");
        }

        const board = new Board(this.scene, this.modelloader, this.root, height, this.struts[startStrut], this.struts[endStrut]);
        this.boards.push(board);

        const boardNode = board.getBabylonNode();
    
        const pointerDragBehavior = new BABYLON.PointerDragBehavior({ dragAxis: new BABYLON.Vector3(0, 1, 0) });
        pointerDragBehavior.useObjectOrientationForDragging = false;
        pointerDragBehavior.updateDragPlane = false;
        pointerDragBehavior.moveAttached = false;

        const increment = 0.01; // Define the increment value
        let currentStrutPosX = 0; // Define the start position

        const getCurrentStrutPosX = (xPos: number): number => {
            return Math.floor(xPos / this.getStrutSpacing()) * this.getStrutSpacing();
        };

        pointerDragBehavior.onDragStartObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";
            currentStrutPosX = getCurrentStrutPosX(event.dragPlanePoint.x);
            this.fireBoardGrabbed(board);
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this.fireBoardReleased(board);
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "grabbing";

            const currentPosition = event.dragPlanePoint;
            let updateRequired = false;

            const snappedPosition = Math.min(this.getHeight() - Shelf.FOOT_HEIGHT,Math.max(Shelf.FOOT_HEIGHT, Math.round(currentPosition.y / increment) * increment));
            if (snappedPosition !== board.getHeight()) {
                board.setHeight(snappedPosition);
                updateRequired = true;
            }
            
            const startStrut = board.getStartStrut();
            const startIndex = startStrut.getIndex();
            const endStrut = board.getEndStrut();
            const endIndex = endStrut.getIndex();

            const strutTransition = currentPosition.x - currentStrutPosX;

            if (startIndex > 0 && strutTransition < 0) {
                board.setStartStrut(this.struts[startIndex - 1]);
                board.setEndStrut(this.struts[endIndex - 1]);

                currentStrutPosX = getCurrentStrutPosX(currentPosition.x);
                updateRequired = true;
            }
            
            if (endIndex < this.struts.length - 1 && strutTransition > this.getStrutSpacing()) {
                board.setEndStrut(this.struts[endIndex + 1]);
                board.setStartStrut(this.struts[startIndex + 1]);

                currentStrutPosX = getCurrentStrutPosX(currentPosition.x);
                updateRequired = true;
            }
    
            event.dragPlanePoint.copyFrom(new BABYLON.Vector3(currentPosition.x, currentPosition.y, currentPosition.z));

            if (updateRequired) {
                this.fireBoardChanged(board);
            }
        });

        pointerDragBehavior.onDragEndObservable.add(() => {
            this.scene.getEngine().getRenderingCanvas().style.cursor = "default";
        });

        boardNode.addBehavior(pointerDragBehavior);
    }

    removeBoard(board: Board) {
        board.remove();

        const index = this.boards.indexOf(board);
        if (index > -1) {
            this.boards.splice(index, 1);
        }
    }

    getBoards(): Board[] {
        return this.boards;
    }

    getBoundingBox(): BABYLON.BoundingBox {
        const halfBoardWidth = Board.BOARD_WIDTH / 2;
        const min = new BABYLON.Vector3(-halfBoardWidth, 0, -halfBoardWidth).add(this.root.position);
        const max = new BABYLON.Vector3(this.getStrutSpacing() * (this.getStruts().length - 1) + halfBoardWidth, this.getHeight(), halfBoardWidth).add(this.root.position);

        return new BABYLON.BoundingBox(min, max);
    }

    serialize(): string {
        var serialized = "";

        // serialize height in two bytes
        const height = this.height_m * 100;
        const height_bytes = new Uint16Array([height]);
        // serialize as hex string (big endian, padded with leading zeros)
        serialized += height_bytes[0].toString(16).padStart(3, "0");

        // serialize number of struts in one byte
        const numberOfStruts = this.struts.length - 1;
        // serialize as hex string (big endian, remove leading zeros)
        serialized += numberOfStruts.toString(16);

        // serialize strut spacing in two bytes
        const strutSpacing = this.getStrutSpacing() * 100;
        const strutSpacing_bytes = new Uint16Array([strutSpacing]);
        // serialize as hex string (big endian, padded with leading zeros)
        serialized += strutSpacing_bytes[0].toString(16).padStart(2, "0");

        // serialize boards
        for (let i = 0; i < this.boards.length; i++) {
            const board = this.boards[i];

            // serialize height in two bytes
            serialized += new Uint16Array([board.getHeight() * 100])[0].toString(16).padStart(3, "0");

            // serialize start strut in one byte
            serialized += board.getStartStrut().getIndex().toString(16);

            // serialize end strut in one byte
            serialized += board.getEndStrut().getIndex().toString(16);
        }

        return serialized;
    }

    static deserialize(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.AbstractMesh, data: string): Shelf {
        const shelf = new Shelf(scene, modelloader, root);
        
        // remove the default config parts
        shelf.remove();

        // first three chars are the height in hex
        shelf.setHeight(parseInt("0" + data.substr(0, 3), 16) / 100);

        // next char is the number of struts in hex with leading zeros removed
        const numStruts = parseInt(data.substr(3, 1), 16) + 1;
        for (let i = 0; i < numStruts; i++) {
            shelf.addStrutToEnd();
        }

        // next two chars are the strut spacing in hex
        shelf.setStrutSpacing(parseInt(data.substr(4, 2), 16) / 100);

        // the rest of the data is the boards
        for (let i = Shelf.HEADER_SERIALIZED_LENGTH; i < data.length; i += Shelf.BOARD_SERIALIZED_LENGTH) {
            const board_data = data.substr(i, Shelf.BOARD_SERIALIZED_LENGTH);

            const board_height = parseInt("0" + board_data.substr(0, 3), 16) / 100;

            const startStrut = parseInt(board_data.substr(3, 1), 16);
            const endStrut = parseInt(board_data.substr(4, 1), 16);

            shelf.boards.push(new Board(scene, modelloader, root, board_height, shelf.struts[startStrut], shelf.struts[endStrut]));
        }

        return shelf;
    }

    remove() {
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].remove();
        }

        this.struts = [];

        for (let i = 0; i < this.boards.length; i++) {
            this.boards[i].remove();
        }

        this.boards = [];
    }

    private fireBoardChanged(board: Board) {
        const event = new CustomEvent("Shelf.Board.Change", {
            detail: {
                shelf: this,
                board: board
            }
        });
        document.dispatchEvent(event);
    }

    private fireBboxChanged() {
        const event = new CustomEvent("Shelf.bbox.Change", {
            detail: {
                shelf: this
            }
        });
        document.dispatchEvent(event);
    }

    private fireBoardGrabbed(board: Board) {
        const event = new CustomEvent("Shelf.Board.Grabbed", {
            detail: {
                shelf: this,
                board: board
            }
        });
        document.dispatchEvent(event);
    }

    private fireBoardReleased(board: Board) {
        const event = new CustomEvent("Shelf.Board.Released", {
            detail: {
                shelf: this,
                board: board
            }
        });
        document.dispatchEvent(event);
    }

    private fireShelfMoved(currentPos : BABYLON.Vector3) {
        const event = new CustomEvent("Shelf.Moved", {
            detail: {
                shelf: this,
                position: currentPos
            }
        });
        document.dispatchEvent(event);
    }
}
