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
import { Lamp01 } from "../shelf/entities/decor/decor_lamp_01";
import { Lamp02 } from "../shelf/entities/decor/decor_lamp_02";
import { LightEmittingDecor } from "../shelf/light_emitting_decor";

export class DecorBuilder {
    private shelf: Shelf;
    private modelloader: ModelLoader;

    private decorLookup: { [id: number]: Decor[] } = {};

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
        },
        {
            clone: (modelloader) => new Lamp01(modelloader),
            minHeight: 0.4,
            maxHeight: 1.6
        },
        {
            clone: (modelloader) => new Lamp02(modelloader),
            minHeight: 0.4,
            maxHeight: -1
        }
    ];

    private isVisible: boolean = true;

    constructor(modelloader: ModelLoader, shelf: Shelf) {
        this.modelloader = modelloader;
        this.shelf = shelf;

        const boards = this.shelf.getBoards();
        for (let i = 0; i < boards.length; i++) {
            this.buildDecorForBoard(boards[i]);
        }

        this.shelf.BoardHeightChanged.on((board) => {
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

    buildDecorForBoard(board: Board) {
        if (this.getDecorForBoard(board) && this.getDecorForBoard(board).length > 0) {
            return;
        }

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

                this.addDecorToLookup(board, decor);
                spawnedDecor.push(decor);

                board.addFollower(decor.root);

                decor.root.setEnabled(this.isVisible);

                widthBudget -= decorWidth + randomOffset;
                spawnPosition.x += decorWidth / 2;
            }
        }
    }

    getDecorForBoard(board: Board): Decor[] {
        return this.decorLookup[this.getBoardId(board)];
    }

    removeDecorForBoard(board: Board) {
        const id = this.getBoardId(board);
        const decors = this.decorLookup[id];

        if (!decors) {
            return;
        }

        decors.forEach(decor => {
            decor.remove();
        });

        delete this.decorLookup[id];
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
            const decors = this.decorLookup[this.getBoardId(board)];
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
                    this.removeDecorFromLookup(board, decor, { removeFromBoard: true });
                });

                // rebuild the decor
                this.buildDecorForBoard(board);
            }
        }
    }

    setVisibility(visible: boolean) {
        this.isVisible = visible;

        this.shelf.getBoards().forEach(board => {
            const decors = this.decorLookup[this.getBoardId(board)];
            decors.forEach(decor => {
                decor.root.setEnabled(visible);
            });
        });
    }

    setNight() {
        this.shelf.getBoards().forEach(board => {
            const decors = this.decorLookup[this.getBoardId(board)];
            decors.forEach(decor => {
                if (decor instanceof LightEmittingDecor) {
                    decor.turnOn();
                }
            });
        });
    }

    setDay() {
        this.shelf.getBoards().forEach(board => {
            const decors = this.decorLookup[this.getBoardId(board)];
            decors.forEach(decor => {
                if (decor instanceof LightEmittingDecor) {
                    decor.turnOff();
                }
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

    private getBoardId(board: Board): number {
        return board.root.uniqueId;
    }

    private addDecorToLookup(board: Board, decor: Decor) {
        const id = this.getBoardId(board);
        if (!this.decorLookup[id]) {
            this.decorLookup[id] = [];
        }

        this.decorLookup[id].push(decor);
    }

    private removeDecorFromLookup(board: Board, decor: Decor, options?: { removeFromBoard?: boolean }) {
        const id = this.getBoardId(board);
        const decors = this.decorLookup[id];

        if (!decors) {
            return;
        }

        const index = decors.indexOf(decor);
        if (index > -1) {
            decors.splice(index, 1);
        }

        if (options && options.removeFromBoard) {
            decor.remove();
        }
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