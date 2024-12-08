import * as BABYLON from "@babylonjs/core";
import { Shelf } from "../shelf/shelf";
import { Board } from "../shelf/entities/board";

export class Measurements {
    private scene: BABYLON.Scene;
    private shelf: Shelf;
    private camera: BABYLON.ArcRotateCamera;
    private root: BABYLON.TransformNode;

    private selectedBoard: Board;

    private widthLineFront: BABYLON.LinesMesh;
    private widthLineBack: BABYLON.LinesMesh;

    private depthLineLeft: BABYLON.LinesMesh;
    private depthLineRight: BABYLON.LinesMesh;

    private heightLineFrontLeft: BABYLON.LinesMesh;
    private heightLineFrontRight: BABYLON.LinesMesh;
    private heightLineBackLeft: BABYLON.LinesMesh;
    private heightLineBackRight: BABYLON.LinesMesh;

    private lineId: number = 0;
    private textureMaterialId: number = 0;
    private boardMap: Map<Board, BABYLON.LinesMesh[]> = new Map();
    private precision: number = 0;

    private isVisibile: boolean = true;

    private static LINE_THICKNESS = 1.2;

    private static MAX_MATERIAL_CACHE = 2;
    private static BILLBOARD_MATERIALS: {[hex: string]: BABYLON.StandardMaterial} = {};

    static BOARD_MEASURE_COLOR = BABYLON.Color3.FromHexString("#BA3F1E");
    static DIMENSIONS_MEASURE_COLOR = BABYLON.Color3.FromHexString("#090D2A");
    private static TEXT_COLOR_STRING = "#F6F1E8";

    constructor(scene: BABYLON.Scene, shelf: Shelf, camera: BABYLON.ArcRotateCamera) {
        this.scene = scene;
        this.shelf = shelf;
        this.camera = camera;
        this.root = new BABYLON.TransformNode("measurements_root", scene);
        this.shelf.addFollower(this.root);

        this.createMeasurements();

        // attach a listener to when the camera is moved
        this.camera.onViewMatrixChangedObservable.add(() => {
            this.respondeMeasurementsToCamera();
        });

        this.shelf.BoardHeightChanged.on((board) => {
            if (board !== this.selectedBoard) {
                return;
            }
            
            this.removeForBoard(board);
            this.createForBoard(board);
        });

        this.shelf.BoardSizeChanged.on((board) => {
            if (board !== this.selectedBoard) {
                return;
            }

            // update measurements to use new board size
            this.removeForBoard(board);
            this.createForBoard(board);
        });

        this.shelf.BoardRemoved.on((board) => {
            this.removeForBoard(board);
        });

        this.shelf.BboxChanged.on((bbox) => {
            this.remove();
            this.createMeasurements();
        });
    }

    setSelectedBoard(board: Board) {
        this.selectedBoard = board;
    }

    remove() {
        this.widthLineFront.dispose();
        this.widthLineBack.dispose();
        this.depthLineLeft.dispose();
        this.depthLineRight.dispose();
        this.heightLineFrontLeft.dispose();
        this.heightLineFrontRight.dispose();
        this.heightLineBackLeft.dispose();
        this.heightLineBackRight.dispose();
    }

    createMeasurements() {
        const bbox = this.shelf.getBoundingBox();
        const minimum = bbox.minimumWorld;
        const maximum = bbox.maximumWorld;
        const width = ((maximum.x - minimum.x) * 100).toFixed(this.precision);
        const height = ((maximum.y - minimum.y) * 100).toFixed(this.precision);
        const depth = ((maximum.z - minimum.z) * 100).toFixed(this.precision);

        this.widthLineFront = this.drawLabeledLine(
            new BABYLON.Vector3(minimum.x, 0, minimum.z - Board.BOARD_WIDTH),
            new BABYLON.Vector3(maximum.x, 0, minimum.z - Board.BOARD_WIDTH),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            width
        );
        this.drawLineEnds(this.widthLineFront, BABYLON.Vector3.Up());

        this.widthLineBack = this.drawLabeledLine(
            new BABYLON.Vector3(minimum.x, 0, maximum.z + Board.BOARD_WIDTH),
            new BABYLON.Vector3(maximum.x, 0, maximum.z + Board.BOARD_WIDTH),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            width
        );
        this.drawLineEnds(this.widthLineBack, BABYLON.Vector3.Up());
        this.widthLineBack.setEnabled(false);

        this.depthLineLeft = this.drawLabeledLine(
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, 0, minimum.z),
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, 0, maximum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            depth
        );
        this.drawLineEnds(this.depthLineLeft, BABYLON.Vector3.Up());

        this.depthLineRight = this.drawLabeledLine(
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, 0, minimum.z),
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, 0, maximum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            depth
        );
        this.drawLineEnds(this.depthLineRight, BABYLON.Vector3.Up());
        this.depthLineRight.setEnabled(false);

        this.heightLineFrontLeft = this.drawLabeledLine(
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, minimum.y, minimum.z),
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, maximum.y, minimum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            height
        );
        this.drawLineEnds(this.heightLineFrontLeft, BABYLON.Vector3.Forward());
        this.heightLineFrontLeft.setEnabled(false);

        this.heightLineFrontRight = this.drawLabeledLine(
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, minimum.y, minimum.z),
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, maximum.y, minimum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            height
        );
        this.drawLineEnds(this.heightLineFrontRight, BABYLON.Vector3.Forward());

        this.heightLineBackLeft = this.drawLabeledLine(
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, minimum.y, maximum.z),
            new BABYLON.Vector3(minimum.x - Board.BOARD_WIDTH, maximum.y, maximum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            height
        );
        this.drawLineEnds(this.heightLineBackLeft, BABYLON.Vector3.Forward());
        this.heightLineBackLeft.setEnabled(false);

        this.heightLineBackRight = this.drawLabeledLine(
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, minimum.y, maximum.z),
            new BABYLON.Vector3(maximum.x + Board.BOARD_WIDTH, maximum.y, maximum.z),
            Measurements.DIMENSIONS_MEASURE_COLOR,
            height
        );
        this.drawLineEnds(this.heightLineBackRight, BABYLON.Vector3.Forward());
        this.heightLineBackRight.setEnabled(false);
    }

    private cacheMaterial(cache: {[id: string]: BABYLON.StandardMaterial}, id: string, material: BABYLON.StandardMaterial) {
        if (Object.keys(cache).length === Measurements.MAX_MATERIAL_CACHE - 1) {
            console.warn("Approaching material cache limit. Error on next cache.")
        } else if (Object.keys(cache).length === Measurements.MAX_MATERIAL_CACHE) {
            throw Error("Too many cached materials!");
        }

        cache[id] = material;
    }

    private drawLabeledLine(start: BABYLON.Vector3, end: BABYLON.Vector3, color: BABYLON.Color3, text: string) : BABYLON.LinesMesh {
        const colorHex = color.toHexString();
        
        const options = {
            points: [start, end],
            updatable: true
        };

        const line = BABYLON.MeshBuilder.CreateLines(`line_${this.lineId++}`, options, this.scene);
        line.color = color;
        line.enableEdgesRendering();
        line.edgesWidth = Measurements.LINE_THICKNESS;
        line.edgesColor = BABYLON.Color4.FromColor3(color);
        line.renderingGroupId = 1;
        line.isPickable = false;
        line.material.dispose();

        line.setParent(this.root);

        // create a billboard rectangle in the middle of the main line
        const middle = end.subtract(start).scale(0.5).add(start);

        const planeWidth = 0.15; // Adjust as needed
        const planeHeight = 0.075; // Adjust as needed
        const textureWidth = 512; // This is the resolution of the dynamic texture
        const textureHeight = 256; // This is the resolution of the dynamic texture

        const billboard = BABYLON.MeshBuilder.CreatePlane(`line_${this.lineId++}`, { width: planeWidth, height: planeHeight }, this.scene);
        billboard.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        billboard.renderingGroupId = 2;
        billboard.isPickable = false;

        if (!Measurements.BILLBOARD_MATERIALS[colorHex]) {
            const billBoardMaterial = new BABYLON.StandardMaterial(`measurements_${colorHex}`, this.scene);
            billBoardMaterial.diffuseColor = BABYLON.Color3.Black();
            billBoardMaterial.specularColor = BABYLON.Color3.Black();
            billBoardMaterial.emissiveColor = color;
            // billBoardMaterial.freeze(); // Note: material cant be frozen as its a billboard

            this.cacheMaterial(Measurements.BILLBOARD_MATERIALS, colorHex, billBoardMaterial);
        }
        billboard.material = Measurements.BILLBOARD_MATERIALS[colorHex];

        const materialName = `measurements_text${this.textureMaterialId++}`;
        const dynamicTexture = new BABYLON.DynamicTexture(materialName, { width: textureWidth, height: textureHeight }, this.scene, true);
        const textMaterial = new BABYLON.StandardMaterial(materialName, this.scene);
        textMaterial.diffuseTexture = dynamicTexture;
        textMaterial.diffuseTexture.hasAlpha = true;
        textMaterial.emissiveColor = BABYLON.Color3.White();
        textMaterial.freeze();

        const plane = BABYLON.MeshBuilder.CreatePlane("floatingText", { width: 1, height: 0.5 }, this.scene);
        plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        plane.renderingGroupId = 3;
        plane.isPickable = false;
        
        plane.material = textMaterial;

        // Draw the text on the dynamic texture
        const fontSize = Math.min(textureWidth, textureHeight) * 0.1;
        const context = dynamicTexture.getContext();
        context.font = `bold ${fontSize}px Arial`;
        context.clearRect(0, 0, textureWidth, textureHeight);
        context.fillStyle = Measurements.TEXT_COLOR_STRING;

        // Center the text
        const textMetrics = context.measureText(text);
        const textX = (textureWidth - textMetrics.width) / 2;
        const textY = textureHeight / 2 + fontSize / 3; // Adjust Y for better vertical alignment
        context.fillText(text, textX, textY);

        // Update the dynamic texture with the drawn text
        dynamicTexture.update();

        plane.setParent(billboard);

        billboard.position = middle;
        billboard.setParent(line);

        return line;
    }

    private drawLineEnds(line: BABYLON.LinesMesh, normal: BABYLON.Vector3) {
        const lineColor = line.color;
        const vertexData = line.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const start = BABYLON.Vector3.FromArray(vertexData.slice(0, 3));
        const end = BABYLON.Vector3.FromArray(vertexData.slice(3, 6));

        const lineDir = end.subtract(start);
        lineDir.normalize();

        // create a vector both orthogonal to the line and the forward vector
        const ortho = BABYLON.Vector3.Cross(normal, lineDir);
        ortho.normalize();

        const endOptions = {
            points: [
                end.add(ortho.scale(0.04)),
                end.add(ortho.scale(-0.04))
            ],
            updatable: true
        };

        const endLine = BABYLON.MeshBuilder.CreateLines(`line_${this.lineId++}`, endOptions, this.scene);
        endLine.color = lineColor;
        endLine.material.dispose();
        endLine.setParent(line);
        endLine.enableEdgesRendering();
        endLine.edgesWidth = Measurements.LINE_THICKNESS;
        endLine.edgesColor = BABYLON.Color4.FromColor3(lineColor);
        endLine.renderingGroupId = 1;
        endLine.isPickable = false;

        endOptions.points = [
            start.add(ortho.scale(0.04)),
            start.add(ortho.scale(-0.04))
        ];

        const startLine = BABYLON.MeshBuilder.CreateLines(`line_${this.lineId++}`, endOptions, this.scene);
        startLine.color = lineColor;
        startLine.material.dispose();
        startLine.setParent(line);
        startLine.enableEdgesRendering();
        startLine.edgesWidth = Measurements.LINE_THICKNESS;
        startLine.edgesColor = BABYLON.Color4.FromColor3(lineColor);
        startLine.renderingGroupId = 1;
        startLine.isPickable = false;
    }

    private respondeMeasurementsToCamera() {
        if (!this.isVisibile) {
            return;
        }

        const rotation = this.camera.alpha;
        const camDir = new BABYLON.Vector3(Math.cos(rotation), 0, Math.sin(rotation));

        const normal1 = BABYLON.Vector3.Forward();
        const cross1 = BABYLON.Vector3.Cross(camDir, normal1);
        const cross1SmallerZero = cross1.y < 0;

        const normal2 = BABYLON.Vector3.Right();
        const cross2 = BABYLON.Vector3.Cross(camDir, normal2);
        const cross2SmallerZero = cross2.y < 0;

        this.widthLineFront.setEnabled(cross2SmallerZero);
        this.widthLineBack.setEnabled(!cross2SmallerZero);

        this.depthLineLeft.setEnabled(!cross1SmallerZero);
        this.depthLineRight.setEnabled(cross1SmallerZero);
        
        this.heightLineFrontLeft.setEnabled(cross1SmallerZero && cross2SmallerZero);
        this.heightLineFrontRight.setEnabled(!cross1SmallerZero && cross2SmallerZero);
        this.heightLineBackLeft.setEnabled(cross1SmallerZero && !cross2SmallerZero);
        this.heightLineBackRight.setEnabled(!cross1SmallerZero && !cross2SmallerZero);
    }

    private drawDistanceForBoard(board: Board) {
        const startIndex = board.getStartStrut().getIndex();
        const endIndex = board.getEndStrut().getIndex();

        let upperStart: Board = undefined;
        let lowerStart: Board = undefined;
        let upperEnd: Board = undefined;
        let lowerEnd: Board = undefined;

        const boards = this.shelf.getBoards();
        const boardIndex = boards.indexOf(board);

        // searching up
        for (let j = boardIndex + 1; j < boards.length; j++) {
            const otherBoard = boards[j];
            const otherStartIndex = otherBoard.getStartStrut().getIndex();
            const otherEndIndex = otherBoard.getEndStrut().getIndex();

            if (upperStart === undefined && startIndex >= otherStartIndex && startIndex <= otherEndIndex) {
                upperStart = otherBoard;
            }

            if (upperEnd === undefined && endIndex <= otherEndIndex && endIndex >= otherStartIndex) {
                upperEnd = otherBoard;
            }
        }

        // searching down
        for (let j = boardIndex - 1; j >= 0; j--) {
            const otherBoard = boards[j];
            const otherStartIndex = otherBoard.getStartStrut().getIndex();
            const otherEndIndex = otherBoard.getEndStrut().getIndex();

            if (lowerStart === undefined && startIndex >= otherStartIndex && startIndex <= otherEndIndex) {
                lowerStart = otherBoard;
            }

            if (lowerEnd === undefined && endIndex <= otherEndIndex && endIndex >= otherStartIndex) {
                lowerEnd = otherBoard;
            }
        }

        // upper start
        let startPos = board.getPosition().clone() /* CHANGE HERE */
            .add(BABYLON.Vector3.Right().scale(0.05));
        let endPos = upperStart === undefined
            ? new BABYLON.Vector3(startPos.x, this.shelf.getHeight(), startPos.z)
            : new BABYLON.Vector3(startPos.x, upperStart.getHeight() - Board.BOARD_THICKNESS, startPos.z);
        let labelText = Math.abs((endPos.y - startPos.y) * 100).toFixed(this.precision);
        const upperStartLine = this.drawLabeledLine(startPos, endPos, Measurements.BOARD_MEASURE_COLOR, labelText);
        upperStartLine.renderingGroupId = 0;
        upperStartLine.setEnabled(false);

        // lower start
        startPos = startPos.subtract(BABYLON.Vector3.Up().scale(Board.BOARD_THICKNESS));
        endPos = lowerStart === undefined
            ? new BABYLON.Vector3(startPos.x, 0, startPos.z)
            : new BABYLON.Vector3(startPos.x, lowerStart.getHeight(), startPos.z);
        labelText = Math.abs((startPos.y - endPos.y) * 100).toFixed(this.precision);
        const lowerStartLine = this.drawLabeledLine(startPos, endPos, Measurements.BOARD_MEASURE_COLOR, labelText);
        lowerStartLine.renderingGroupId = 0;
        lowerStartLine.setEnabled(false);

        // upper end
        startPos = board.getPosition().clone() /* CHANGE HERE */
            .add(BABYLON.Vector3.Right().scale(this.shelf.getStrutSpacing() * (endIndex - startIndex)))
            .add(BABYLON.Vector3.Right().scale(-0.05));
        endPos = upperEnd === undefined
            ? new BABYLON.Vector3(startPos.x, this.shelf.getHeight(), startPos.z)
            : new BABYLON.Vector3(startPos.x, upperEnd.getHeight() - Board.BOARD_THICKNESS, startPos.z);
        labelText = Math.abs((endPos.y - startPos.y) * 100).toFixed(this.precision);
        const upperEndLine = this.drawLabeledLine(startPos, endPos, Measurements.BOARD_MEASURE_COLOR, labelText);
        upperEndLine.renderingGroupId = 0;
        upperEndLine.setEnabled(false);

        // lower end
        startPos = startPos.subtract(BABYLON.Vector3.Up().scale(Board.BOARD_THICKNESS));
        endPos = lowerEnd === undefined
            ? new BABYLON.Vector3(startPos.x, 0, startPos.z)
            : new BABYLON.Vector3(startPos.x, lowerEnd.getHeight(), startPos.z);
        labelText = Math.abs((startPos.y - endPos.y) * 100).toFixed(this.precision);
        const lowerEndLine = this.drawLabeledLine(startPos, endPos, Measurements.BOARD_MEASURE_COLOR, labelText);
        lowerEndLine.renderingGroupId = 0;
        lowerEndLine.setEnabled(false);

        this.boardMap.set(board, [upperStartLine, lowerStartLine, upperEndLine, lowerEndLine]);
    }

    createForBoard(board: Board) {
        this.removeForBoard(board);
        this.drawDistanceForBoard(board);

        const lines = this.boardMap.get(board);
        lines.forEach(line => line.setEnabled(this.isVisibile));
    }

    removeForBoard(board: Board) {
        const lines = this.boardMap.get(board);
        if (lines === undefined) {
            return;
        }

        const removeNode = (node: BABYLON.AbstractMesh) => {
            if (node.material) {
                node.material.getActiveTextures().forEach(texture => texture.dispose());
                node.material.dispose();
            }

            node.getChildMeshes().forEach(mesh => {
                removeNode(mesh);
            });

            node.dispose();
        };

        lines.forEach(line => {
            removeNode(line);
        });
    }

    setVisibility(isVisible: boolean) {
        this.isVisibile = isVisible;

        this.boardMap.forEach((lines, board) => {
            lines.forEach(line => line.setEnabled(isVisible));
        });

        if (!isVisible) {
            this.widthLineFront.setEnabled(false);
            this.widthLineBack.setEnabled(false);
            this.depthLineLeft.setEnabled(false);
            this.depthLineRight.setEnabled(false);
            this.heightLineFrontLeft.setEnabled(false);
            this.heightLineFrontRight.setEnabled(false);
            this.heightLineBackLeft.setEnabled(false);
            this.heightLineBackRight.setEnabled(false);
        } else {
            this.respondeMeasurementsToCamera();
        }
    }
}