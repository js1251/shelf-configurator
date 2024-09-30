import { ModelLoader } from "./modelloader";
import { Board } from "./shelf/board";
import { Decor } from "./shelf/decor";
import { Shelf } from "./shelf/shelf";
import { Strut } from "./shelf/strut";

export class DecorBuilder {
    private shelf: Shelf;

    private decorOptions: Decor[] = [];

    constructor(modelloader: ModelLoader, shelf: Shelf) {
        this.shelf = shelf;

        this.decorOptions.push(new Decor(modelloader, "models/decor_potted_plant_01.glb", 0.8, -1));
        this.decorOptions.push(new Decor(modelloader, "models/decor_placeholder.glb", 0, -1));
        this.decorOptions.push(new Decor(modelloader, "models/decor_books_01.glb", 0, -1));
        this.decorOptions.push(new Decor(modelloader, "models/decor_books_02.glb", 0, -1));
        this.decorOptions.push(new Decor(modelloader, "models/decor_books_03.glb", 0, -1));
        this.decorOptions.push(new Decor(modelloader, "models/decor_books_04.glb", 0.4, 1.6));
        this.decorOptions.push(new Decor(modelloader, "models/decor_trinket_01.glb", 0.4, 1.6));

        this.decorOptions.forEach(decor => {
            decor.getBabylonNode().setEnabled(false);
        });
    }

    fillDecor() {
        const boards = this.shelf.getBoards();
        for (let i = 0; i < boards.length; i++) {
            this.buildDecorForBoard(boards[i]);
        }
    }

    buildDecorForBoard(board: Board) {
        const height = board.getHeight();
        const allBoards = this.shelf.getBoards();
        const boardIndex = allBoards.indexOf(board);

        const decorOptions = this.getDecorOptions(height, boardIndex);

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
            let spawnPosition = board.getBabylonNode().getAbsolutePosition().clone();
            spawnPosition.x += this.shelf.getStrutSpacing() * j + Strut.STRUT_DIAMETER / 2;

            const spawnedDecor = [];
            let tries = 0;

            // keep spawning decor until there is no more space
            while (widthBudget > 0) {
                const randomIndex = Math.floor(Math.random() * decorOptions.length);
                const decor = decorOptions[randomIndex].clone();
                const decorWidth = decor.getBoundingBox().extendSize.x * 2;
                const randomOffset = getRandomOffset();

                // if the decor is too wide, dispose it and try again
                if (decorWidth + randomOffset> widthBudget) {
                    decor.getBabylonNode().dispose();

                    if (tries++ > 3) {
                        break;
                    }

                    continue;
                }

                // center the decor on the spawn position
                spawnPosition.x += decorWidth / 2 + randomOffset;
                decor.getBabylonNode().position = spawnPosition.clone();

                // check if the decor intersects with any other board (above)
                if (this.collides(decor, boardIndex)) {
                    decor.getBabylonNode().dispose();

                    // reset the spawn position
                    spawnPosition.x -= decorWidth / 2 + randomOffset;

                    if (tries++ > 3) {
                        break;
                    }

                    continue;
                }

                board.addDecor(decor);
                spawnedDecor.push(decor);

                widthBudget -= decorWidth + randomOffset;
                spawnPosition.x += decorWidth / 2;
            }
        }
    }

    disableDecorForBoard(board: Board) {
        const decors = board.getDecor();
        decors.forEach(decor => {
            board.removeDecor(decor);
        });
    }

    enableDecorForBoard(board: Board) {
        // if the board was just grabbed but never changed, ignore
        if (board.getDecor().length > 0) {
            return;
        }

        // rebuild the decor
        this.buildDecorForBoard(board);
    }

    validateDecorForBoard(board: Board) {
        const boardIndex = this.shelf.getBoards().indexOf(board);

        if (boardIndex === 0) {
            return;
        }

        // check all boards down this board
        for (let i = boardIndex - 1; i >= 0; i--) {
            const board = this.shelf.getBoards()[i];

            // check if the decor intersects with any other board (above)
            const decors = board.getDecor();
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

    private collides(decor: Decor, boardIndex: number): boolean {
        // check if the decor intersects with any other board (above)
        const decorBbox = decor.getBoundingBox();
        const boards = this.shelf.getBoards();

        const numberOfBoards = boards.length;

        // check for ceiling collision
        if (boardIndex + 1 >= numberOfBoards) {
            const shelfHeight = this.shelf.getHeight();
            if (decorBbox.maximum.y > shelfHeight) {
                return true;
            }
        }

        // check for board collision
        for (let k = boardIndex + 1; k < numberOfBoards; k++) {
            const otherBoard = boards[k];
            const otherBoardBbox = otherBoard.getBoundingBox();

            if (decorBbox.minimum.x < otherBoardBbox.maximum.x
                && decorBbox.maximum.x > otherBoardBbox.minimum.x
                && decorBbox.maximum.y > otherBoardBbox.minimum.y) {
                return true;
            }
        }

        return false;
    }


    private getDecorOptions(startHeight: number, boardIndex: number): Decor[] {
        const options = [];

        for (let i = 0; i < this.decorOptions.length; i++) {
            const decor = this.decorOptions[i];

            if (startHeight < decor.getMinHeight()) {
                continue;
            }

            if (decor.getMaxHeight() !== -1 && startHeight > decor.getMaxHeight()) {
                continue;
            }

            options.push(decor);
        }

        return options;
    }
}