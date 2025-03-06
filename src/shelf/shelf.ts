import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { LiteEvent } from "../event_engine/LiteEvent";
import { Strut } from "./entities/strut";
import { Board } from "./entities/board";
import { Entity } from "../entity_engine/entity";

export class Shelf extends Entity {
    private readonly onBoardStrutChanged = new LiteEvent<Board>();
    public get BoardSizeChanged() {
        return this.onBoardStrutChanged.expose();
    }

    private readonly onBoardHeightChanged = new LiteEvent<Board>();
    public get BoardHeightChanged() {
        return this.onBoardHeightChanged.expose();
    }

    private readonly onBoardAdded = new LiteEvent<Board>();
    public get BoardAdded() {
        return this.onBoardAdded.expose();
    }

    private readonly onBoardRemoved = new LiteEvent<Board>();
    public get BoardRemoved() {
        return this.onBoardRemoved.expose();
    }

    private readonly onStrutAdded = new LiteEvent<Strut>();
    public get StrutAdded() {
        return this.onStrutAdded.expose();
    }

    private readonly onStrutRemoved = new LiteEvent<Strut>();
    public get StrutRemoved() {
        return this.onStrutRemoved.expose();
    }
    
    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] { 
        return [min, max];
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        return new BABYLON.Mesh("shelf_root", this.modelloader.scene);
    }

    private height_m: number;
    private spacing: number;

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
        const strut = new Strut(this.modelloader, this.getHeight(), 0);
        if (this.struts.length > 0) {
            strut.setMaterial(this.getStruts()[0].getMaterial());
        }

        const strutPos = this.getPosition().clone();
        strutPos.y = this.height_m / 2;

        strut.setParent(this);
        this.struts.unshift(strut);

        // update all struts indices
        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setIndex(i);
            this.struts[i].setPosition(strutPos.clone().add(new BABYLON.Vector3(this.spacing * i, 0, 0)));
        }

        // update all boards start and end struts
        this.boards.forEach((board) => {
            board.setSpanStruts(this.struts[board.getStartStrut().getIndex()], this.struts[board.getEndStrut().getIndex()]);
        });

        this.setPosition(this.getPosition().add(new BABYLON.Vector3(-this.spacing, 0, 0)));

        this.updateBoundingBox();

        this.onStrutAdded.trigger(strut);
    }

    addStrutToEnd() {
        const strut = new Strut(this.modelloader, this.getHeight(), this.struts.length);
        if (this.struts.length > 0) {
            strut.setMaterial(this.getStruts()[0].getMaterial());
        }

        const strutPos = this.getPosition().clone();
        strutPos.y = this.height_m / 2;
        strutPos.x += this.spacing * this.struts.length;

        strut.setPosition(strutPos);
        strut.setParent(this);
        this.struts.push(strut);
        
        this.updateBoundingBox();

        this.onStrutAdded.trigger(strut);
    }

    removeStrutAtStart() {
        if (this.struts.length <= 2) {
            console.warn("Cannot remove strut. Shelf must have at least 2 struts.");
            return;
        }

        // First push all boards toward the start of the shelf
        for (let i = this.boards.length - 1; i >= 0; i--) {
            const board = this.boards[i];
            const currentStartIndex = board.getStartStrut().getIndex();
            const currentEndIndex = board.getEndStrut().getIndex();

            // check if the board is at the start of the shelf
            if (currentStartIndex === 0) {
                // if it is, check if its at least 2 struts long
                if (currentEndIndex - currentStartIndex > 1) {
                    // shorten the board and shift it to the start
                    board.setSpanStruts(this.struts[0], this.struts[currentEndIndex - 1]);
                } else {
                    // the board needs to be removed
                    const index = this.boards.indexOf(board);
                    if (index > -1) {
                        board.remove();
                        this.boards.splice(index, 1);
                    }
                }
            } else {
                // shift the board one strut towards the start
                board.setSpanStruts(this.struts[currentStartIndex - 1], this.struts[currentEndIndex - 1]);
            }
        }
        
        // remove the strut at the end
        const removedStrut = this.struts.pop();
        removedStrut.remove();

        // move the entire shelf toward the end by one strut
        this.setPosition(this.getPosition().add(new BABYLON.Vector3(this.spacing, 0, 0)));
        
        this.updateBoundingBox();
        this.onStrutRemoved.trigger(removedStrut);
    }

    removeStrutAtEnd() {
        if (this.struts.length <= 2) {
            console.warn("Cannot remove strut. Shelf must have at least 2 struts.");
            return;
        }

        const removedStrut = this.struts.pop();
        removedStrut.remove();

        // iterate backwards to avoid index out of bounds
        for (let i = this.boards.length - 1; i >= 0; i--) {
            const board = this.boards[i];
            const endIndex = board.getEndStrut().getIndex();

            if (endIndex < this.struts.length) {
                continue;
            }

            const startIndex = board.getStartStrut().getIndex();
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

        this.updateBoundingBox();
        this.onStrutRemoved.trigger(removedStrut);
    }

    setStrutSpacing(spacing: number) {
        if (spacing > 1.5) {
            throw new Error("Spacing is too high");
        }

        if (spacing < Board.BOARD_WIDTH) {
            throw new Error("Spacing is too low");
        }

        // round to two decimal places
        this.spacing = spacing;

        for (let i = 0; i < this.struts.length; i++) {
            const strut = this.struts[i];
            const strutPosition = strut.getPosition();
            strutPosition.x = this.spacing * i;
        }
        
        this.updateBoundingBox();
    }

    getStrutSpacing(): number {
        return this.spacing;
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

        const board = new Board(this.modelloader, height, this.struts[startStrut], this.struts[endStrut], this.spacing);
        this.boards.push(board);
        board.setParent(this);

        board.BoardStrutChanged.on(() => {
            this.onBoardStrutChanged.trigger(board);

            // the board could have been moved to a strut that didnt have a board before
            // therefore increasing the bounding box of the entire shelf
            this.updateBoundingBox();
        });

        board.BoardHeightChanged.on(() => {
            this.onBoardHeightChanged.trigger(board);
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

    setStrutMaterial(material: BABYLON.Material) {
        this.struts.forEach((strut) => {
            strut.setMaterial(material);
        });
    }

    setBoardMaterial(material: BABYLON.Material) {
        this.boards.forEach((board) => {
            board.setMaterial(material);
        });
    }

    async getTotalPrice(): Promise<number | null> {
        let price = 0;

        for (let i = 0; i < this.boards.length; i++) {
            const board = this.boards[i];
            const boardPrice = await board.getPrice();
            if (boardPrice === null) {
                return null;
            }

            price += boardPrice;
        }

        for (let i = 0; i < this.struts.length; i++) {
            const strut = this.struts[i];
            const strutPrice = await strut.getPrice();
            if (strutPrice === null) {
                return null;
            }

            price += strutPrice;
        }

        return price;
    }
}
