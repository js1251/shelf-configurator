import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./../modelloader";
import { Board } from "./board";
import { Strut } from "./strut";

export class Shelf {
    private height_m: number;

    private struts: Strut[] = [];
    private boards: Board[] = [];

    private scene: BABYLON.Scene;
    private modelloader: ModelLoader;

    private root: BABYLON.Node;

    static HEADER_SERIALIZED_LENGTH = 7;
    static BOARD_SERIALIZED_LENGTH = 6;

    constructor(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.Node) {
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
        // cant be higher than 655.35 meters (due to serialization using two bytes for height)
        if (height_m > 655.35) {
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
    }

    getHeight(): number {
        return this.height_m;
    }

    getStruts(): Strut[] {
        return this.struts;
    }

    addStrutToStart() {
        this.struts.unshift(new Strut(this.scene, this.modelloader, this.root, this.getHeight(), 0, 0));

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
    }

    addStrutToEnd() {
        this.struts.push(new Strut(this.scene, this.modelloader, this.root, this.getHeight(), 0, this.struts.length));
    }

    removeStrutAtStart() {
        if (this.struts.length < 2) {
            throw new Error("Cannot remove last strut");
        }

        this.struts.shift().remove();

        for (let i = 0; i < this.struts.length; i++) {
            const strut = this.struts[i];
            strut.setIndex(strut.getIndex() - 1);
        }

        // update all boards start and end struts
        for (let i = 0; i < this.boards.length; i++) {
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
    }

    removeStrutAtEnd() {
        if (this.struts.length < 2) {
            throw new Error("Cannot remove last strut");
        }

        this.struts.pop().remove();

        for (let i = 0; i < this.boards.length; i++) {
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
    }

    setStrutSpacing(spacing: number) {
        if (spacing > 1.5) {
            throw new Error("Spacing is too high");
        }

        if (spacing < 0.2) {
            throw new Error("Spacing is too low");
        }

        // round to two decimal places
        spacing = Math.round(spacing * 100) / 100;

        for (let i = 0; i < this.struts.length; i++) {
            this.struts[i].setOffset(i * spacing);
        }
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

        this.boards.push(new Board(this.scene, this.modelloader, this.root, height, this.struts[startStrut], this.struts[endStrut]));
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

    serialize(): string {
        var serialized = "";

        // serialize height in two bytes
        const height = this.height_m * 100;
        const height_bytes = new Uint16Array([height]);
        // serialize as hex string (big endian, padded with leading zeros)
        serialized += height_bytes[0].toString(16).padStart(4, "0");

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
            serialized += new Uint16Array([board.getHeight() * 100])[0].toString(16).padStart(4, "0");

            // serialize start strut in one byte
            serialized += board.getStartStrut().getIndex().toString(16);

            // serialize end strut in one byte
            serialized += board.getEndStrut().getIndex().toString(16);
        }

        return serialized;
    }

    static deserialize(scene: BABYLON.Scene, modelloader: ModelLoader, root: BABYLON.Node, data: string): Shelf {
        const shelf = new Shelf(scene, modelloader, root);

        // first four chars are the height in hex
        shelf.setHeight(parseInt(data.substr(0, 4), 16) / 100);

        // next char is the number of struts in hex with leading zeros removed
        const numStruts = parseInt(data.substr(4, 1), 16) + 1;
        for (let i = 0; i < numStruts; i++) {
            shelf.addStrutToEnd();
        }

        // next two chars are the strut spacing in hex
        shelf.setStrutSpacing(parseInt(data.substr(5, 2), 16) / 100);

        // the rest of the data is the boards
        for (let i = Shelf.HEADER_SERIALIZED_LENGTH; i < data.length; i += Shelf.BOARD_SERIALIZED_LENGTH) {
            const board_data = data.substr(i, Shelf.BOARD_SERIALIZED_LENGTH);

            const board_height = parseInt(board_data.substr(0, 4), 16) / 100;

            const startStrut = parseInt(board_data.substr(4, 1), 16);
            const endStrut = parseInt(board_data.substr(5, 1), 16);

            shelf.boards.push(new Board(scene, modelloader, root, board_height, shelf.struts[startStrut], shelf.struts[endStrut]));
        }

        return shelf;
    }
}
