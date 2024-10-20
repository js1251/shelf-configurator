import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./../modelloader";
import { LiteEvent } from "../event_engine/LiteEvent";
import { Strut } from "./entities/strut";
import { Board } from "./entities/board";
import { Entity } from "../entity_engine/entity";

export class Shelf extends Entity {
    private readonly onBoardChanged = new LiteEvent<Board>();
    public get BoardChanged() {
        return this.onBoardChanged.expose();
    }

    private readonly onBoardAdded = new LiteEvent<Board>();
    public get BoardAdded() {
        return this.onBoardAdded.expose();
    }

    private readonly onBoardRemoved = new LiteEvent<Board>();
    public get BoardRemoved() {
        return this.onBoardRemoved.expose();
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] { 
        return [min, max];
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        return new BABYLON.Mesh("shelf_root", this.modelloader.scene);
    }

    private height_m: number;

    private struts: Strut[] = [];
    private boards: Board[] = [];

    static HEADER_SERIALIZED_LENGTH = 6;
    static BOARD_SERIALIZED_LENGTH = 5;
    static FOOT_HEIGHT = 0.04;

    constructor(modelloader: ModelLoader) {
        super(modelloader);
    }

    setHeight(height_m: number) {
        if (height_m < 0) {
            throw new Error("Height is too low");
        }

        // round to two decimal places
        this.height_m = Math.round(height_m * 100) / 100;

        // update all struts
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setHeight(this.height_m);
        }

        this.updateBoundingBox();
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

    addStrutToStart() {
        const strut = new Strut(this.modelloader, this.getHeight(), 0, 0);
        strut.setParent(this.root);
        this.struts.unshift(strut);

        // update all struts indices
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setIndex(i);
        }

        // update all boards start and end struts
        for (let i = 0; i < this.boards.length; i++) {
            const board = this.boards[i];
            board.setSpanStruts(this.struts[board.getStartStrut().getIndex()], this.struts[board.getEndStrut().getIndex()]);
        }

        this.updateBoundingBox();
    }

    addStrutToEnd() {
        const strut = new Strut(this.modelloader, this.getHeight(), 0, this.struts.length);
        strut.setParent(this.root);
        this.struts.push(strut);
        
        this.updateBoundingBox();
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
                    board.setSpanStruts(this.struts[startIndex - 1], this.struts[endIndex]);
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

            board.setSpanStruts(this.struts[startIndex - 1], this.struts[endIndex - 1]);
        }

        this.updateBoundingBox();
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

                board.setSpanStruts(this.struts[startIndex], this.struts[endIndex - 1]);
            }
        }

        this.updateBoundingBox();
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
        
        this.updateBoundingBox();
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

        const board = new Board(this.modelloader, height, this.struts[startStrut], this.struts[endStrut]);
        this.boards.push(board);
        board.setParent(this.root);

        board.BoardChanged.on(() => {
            this.onBoardChanged.trigger(board);
        });

        // sort boards by height
        this.boards.sort((a, b) => {
            return a.getHeight() - b.getHeight();
        });

        // TODO: not really needed, instead the modifyBoundixInfo could be used to always add +10cm in width and depth on both sides
        this.updateBoundingBox();

        this.onBoardAdded.trigger(board);
    }

    removeBoard(board: Board) {
        board.remove();

        const index = this.boards.indexOf(board);
        if (index > -1) {
            this.boards.splice(index, 1);
        }

        // sort boards by height
        this.boards.sort((a, b) => {
            return a.getHeight() - b.getHeight();
        });

        // TODO: not reaaaally needed unless there are 0 boards on the shelf
        this.updateBoundingBox();

        this.onBoardRemoved.trigger(board);
    }

    getBoards(): Board[] {
        return this.boards;
    }

    getBoardBelow(board: Board): Board {
        const index = this.boards.indexOf(board);
        if (index === 0) {
            return null;
        }

        return this.boards[index - 1];
    }

    getBoardAbove(board: Board): Board {
        const index = this.boards.indexOf(board);
        if (index === this.boards.length - 1) {
            return null;
        }

        return this.boards[index + 1];
    }
}
