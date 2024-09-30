import { ModelLoader } from "./modelloader";
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

        this.decorOptions.forEach(decor => {
            decor.getBabylonNode().setEnabled(false);
        });
    }

    fillDecor() {
        const boards = this.shelf.getBoards();
        for (let i = 0; i < boards.length; i++) {
            const board = boards[i];
            const height = board.getHeight();

            const decorOptions = this.getDecorOptions(height, i);

            if (decorOptions.length === 0) {
                continue;
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
                    const decorBbox = decor.getBoundingBox();
                    let collided = false;

                    // TODO: check against ceiling

                    for (let k = i + 1; k < this.shelf.getBoards().length; k++) {
                        const otherBoard = this.shelf.getBoards()[k];
                        const otherBoardBbox = otherBoard.getBoundingBox();

                        if (decorBbox.minimum.x < otherBoardBbox.maximum.x
                            && decorBbox.maximum.x > otherBoardBbox.minimum.x
                            && decorBbox.maximum.y > otherBoardBbox.minimum.y) {
                            collided = true;
                            break;
                        }
                    }

                    if (collided) {
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