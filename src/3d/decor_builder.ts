import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "./modelloader";
import { Decor } from "../shelf/decor";
import { Shelf } from "../shelf/shelf";
import { Board } from "../shelf/entities/board";
import { Strut } from "../shelf/entities/strut";
import { PottedPlant01 } from "../shelf/entities/decor/potted_plant01";
import { Books01 } from "../shelf/entities/decor/decor_books_01";
import { Books02 } from "../shelf/entities/decor/decor_books_02";
import { PottedPlant02 } from "../shelf/entities/decor/potted_plant02";
import { Books03 } from "../shelf/entities/decor/decor_books_03";
import { Books04 } from "../shelf/entities/decor/decor_books_04";
import { Trinket01 } from "../shelf/entities/decor/decor_trinket_01";

export class DecorBuilder {
    private shelf: Shelf;
    private modelloader: ModelLoader;

    private decorOptions = [
        {
            clone: (modelloader) => new PottedPlant01(modelloader),
            minHeight: 0.8,
            maxHeight: -1
        },
        {
            clone: (modelloader) => new PottedPlant02(modelloader),
            minHeight: 0.4,
            maxHeight: 1.6
        },
        {
            clone: (modelloader) => new Books01(modelloader),
            minHeight: 0,
            maxHeight: -1
        },
        {
            clone: (modelloader) => new Books02(modelloader),
            minHeight: 0,
            maxHeight: -1
        },
        {
            clone: (modelloader) => new Books03(modelloader),
            minHeight: 0,
            maxHeight: -1
        },
        {
            clone: (modelloader) => new Books04(modelloader),
            minHeight: 0.4,
            maxHeight: 1.6
        },
        {
            clone: (modelloader) => new Trinket01(modelloader),
            minHeight: 0.4,
            maxHeight: 1.6
        }
    ];

    private isVisible: boolean = true;
    private root: BABYLON.TransformNode;

    constructor(modelloader: ModelLoader, shelf: Shelf) {
        this.modelloader = modelloader;
        this.shelf = shelf;

        this.root = new BABYLON.TransformNode("decor_root", modelloader.scene);
        this.shelf.addFollower(this.root);

        this.fillDecor();

        this.shelf.BoardMoved.on((board) => {
            this.removeDecorForBoard(board);
            this.validateNeighborDecorForBoard(board);
        });

        this.shelf.BoardSizeChanged.on((board) => {
            this.removeDecorForBoard(board);
            this.buildDecorForBoard(board);
            this.validateNeighborDecorForBoard(board);
        });

        this.shelf.BoardRemoved.on((board) => {
            this.removeDecorForBoard(board);
        });

        this.shelf.BoardAdded.on((board) => {
            this.buildDecorForBoard(board);
            this.validateNeighborDecorForBoard(board);
        });
    }

    private fillDecor() {
        const boards = this.shelf.getBoards();
        for (let i = 0; i < boards.length; i++) {
            this.buildDecorForBoard(boards[i]);
        }
    }

    buildDecorForBoard(board: Board) {
        // remove any existing decor
        board.removeAllDecor();

        const height = board.getHeight();
        const allBoards = this.shelf.getBoards();
        const boardIndex = allBoards.indexOf(board);

        const decorOptions = this.getDecorOptions(height);

        if (decorOptions.length === 0) {
            return;
        }

        // check how many struts are spanned by this board
        const span = board.getEndStrut().getIndex() - board.getStartStrut().getIndex();

        const getRandomOffset = () => {
            return Math.random() * this.shelf.getStrutSpacing() / 3;
        }

        // for each gap between struts, spawn decor
        for (let j = 0; j < span; j++) {

            // there is only so much space for decor to sapwn in
            let widthBudget = this.shelf.getStrutSpacing() - Strut.STRUT_DIAMETER;

            // start right at the strut
            let spawnPosition = board.getPosition().clone();
            spawnPosition.x += this.shelf.getStrutSpacing() * j + Strut.STRUT_DIAMETER / 2;
            spawnPosition.y += 0.001;

            const spawnedDecor = [];
            let tries = 0;

            // keep spawning decor until there is no more space
            while (widthBudget > 0 && tries < 3) {
                const randomIndex = Math.floor(Math.random() * decorOptions.length);
                const decor = decorOptions[randomIndex].clone(this.modelloader);
                const decorWidth = decor.getBoundingBox().extendSize.x * 2;
                const randomOffset = getRandomOffset();

                // if the decor is too wide, dispose it and try again
                if (decorWidth + randomOffset > widthBudget) {
                    decor.remove();

                    tries++
                    continue;
                }

                // center the decor on the spawn position
                spawnPosition.x += decorWidth / 2 + randomOffset;
                decor.setPosition(spawnPosition.clone());

                // check if the decor intersects with any other board (above)
                if (this.collides(decor, boardIndex)) {
                    decor.remove();

                    // reset the spawn position
                    spawnPosition.x -= decorWidth / 2 + randomOffset;

                    tries++
                    continue;
                }

                board.addDecor(decor);
                spawnedDecor.push(decor);
                decor.root.setParent(this.root);

                decor.root.setEnabled(this.isVisible);

                widthBudget -= decorWidth + randomOffset;
                spawnPosition.x += decorWidth / 2;
            }
        }
    }

    removeDecorForBoard(board: Board) {
        board.removeAllDecor();
    }

    validateNeighborDecorForBoard(board: Board) {
        const boardIndex = this.shelf.getBoards().indexOf(board);

        if (boardIndex === 0) {
            return;
        }

        // check all boards down this board
        for (let i = boardIndex - 1; i >= 0; i--) {
            const board = this.shelf.getBoards()[i];

            // check if the decor intersects with any other board (above)
            const decors = board.getAllDecor();
            let collisionOccured = false;
            decors.forEach(decor => {
                if (this.collides(decor, i)) {
                    collisionOccured = true;
                    return;
                }
            });

            if (collisionOccured) {
                // remove all decor
                decors.forEach(decor => {
                    board.removeDecor(decor);
                });

                // rebuild the decor
                this.buildDecorForBoard(board);
            }
        }
    }

    setVisibility(visible: boolean) {
        this.isVisible = visible;

        this.shelf.getBoards().forEach(board => {
            const decors = board.getAllDecor();
            decors.forEach(decor => {
                decor.root.setEnabled(visible);
            });
        });
    }

    private collides(decor: Decor, boardIndex: number): boolean {
        // check if the decor intersects with any other board (above)
        const boards = this.shelf.getBoards();
        const currentBoard = boards[boardIndex];

        const numberOfBoards = boards.length;

        // check for ceiling collision
        const decorHeight = currentBoard.getHeight() + decor.getBoundingBox().extendSize.y * 2;
        if (boardIndex + 1 >= numberOfBoards) {
            const ceilingHeight = this.shelf.getHeight();
            if (decorHeight > ceilingHeight) {
                return true;
            }
        }

        // check for board collision
        return boards.some((board, index) => {
            return board.collidesBbox(decor.getBoundingBox());
        });
    }


    private getDecorOptions(startHeight: number): any[] {
        const options = [];

        for (let i = 0; i < this.decorOptions.length; i++) {
            const decorOption = this.decorOptions[i];

            if (startHeight < decorOption.minHeight) {
                continue;
            }

            if (decorOption.maxHeight !== -1 && startHeight > decorOption.maxHeight) {
                continue;
            }

            options.push(decorOption);
        }

        return options;
    }
}