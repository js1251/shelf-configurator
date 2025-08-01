import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../../3d/modelloader";
import { Strut } from "./strut";
import { LiteEvent } from "../../event_engine/LiteEvent";
import { ProductEntity } from "../../entity_engine/product_entity";
import { ProductOptions } from "../product_options";
import * as Resources from "../../shelf/materials";

export class Board extends ProductEntity {
    private height_m: number;
    private startStrut: Strut;
    private endStrut: Strut;
    private spacing: number;

    private start: BABYLON.AbstractMesh;
    private middles: BABYLON.AbstractMesh[] = [];
    private stretches: BABYLON.AbstractMesh[] = [];
    private end: BABYLON.AbstractMesh;
    
    static BOARD_WIDTH = 0.2;
    static BOARD_THICKNESS = 0.02; // technically its 0.018 but it makes the numbers easier using 0.02

    private readonly onBoardHeightChanged = new LiteEvent<void>();
    public get BoardHeightChanged() {
        return this.onBoardHeightChanged.expose();
    }

    private readonly onBoardStrutsChanged = new LiteEvent<void>();
    public get BoardStrutChanged() {
        return this.onBoardStrutsChanged.expose();
    }

    constructor(modelloader: ModelLoader, height_m: number, startStrut: Strut, endStrut: Strut, spacing: number) {
        super(modelloader);

        this.spacing = spacing;

        this.setHeight(height_m);
        this.setSpanStruts(startStrut, endStrut);
    }

    setHeight(height_m: number) {
        this.unFreeze();

        this.height_m = height_m;

        const newPosition = this.getPosition().clone();
        newPosition.y = this.height_m;
        this.setPosition(newPosition);

        this.recursiveComputeWorldMatrix(this.root);

        this.onBoardHeightChanged.trigger();

        this.freeze();
    }

    getHeight(): number {
        return this.height_m;
    }

    setSpanStruts(startStrut: Strut, endStrut: Strut) {
        this.unFreeze();

        this.startStrut = startStrut;
        this.endStrut = endStrut;

        const startParent = this.start.parent;

        this.start.setParent(null);
        this.end.setParent(null);

        const startStrutPosition = this.startStrut.getPosition().clone();
        startStrutPosition.y = this.height_m;
        this.setPosition(startStrutPosition);

        const endStrutPosition = this.endStrut.getPosition().clone();
        endStrutPosition.y = this.height_m;
        this.end.position = endStrutPosition;
        
        this.end.setParent(this.start);
        this.start.setParent(startParent);

        this.handleMiddle();

        // refresh material to apply it to potential new meshes
        this.applyMaterial(this.material);
        
        this.updateBoundingBox();
        this.onBoardStrutsChanged.trigger();
        this.onPriceChanged.trigger(this.getPrice());

        this.freeze();
    }


    getStartStrut(): Strut {
        return this.startStrut;
    }

    getEndStrut(): Strut {
        return this.endStrut;
    }

    override remove() {
        super.remove();
    }

    get SKU(): string {
        const width = this.getBoundingBox().extendSize.x * 2;
        let lengthRange = this.getRangeOption(width * 100, ProductOptions.availableBoardLengths);
        return `BOARD-${this.material}-OILED-${lengthRange}`;
    }

    protected applyMaterial(material: string) {
        const shelfMaterial = Resources.getShelfMaterialForStringMaterial(material);
        
        this.start.getChildMeshes().forEach(child => {
            // if the child is a clamp, don't change the material
            if (child.name.includes("clamp")) {
                return;
            }

            if (this.isFollower(child)) {
                return;
            }

            child.material = shelfMaterial.material;
        });
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        const start = this.modelloader.createInstance("models/shelf_start.glb");
        const startClamp = this.modelloader.createInstance("models/clamp.glb");
        start.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        startClamp.setParent(start);

        this.start = start;

        const end = this.modelloader.createInstance("models/shelf_end.glb");
        const endClamp = this.modelloader.createInstance("models/clamp.glb");
        end.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
        endClamp.setParent(end);

        end.setParent(start);

        this.end = end;

        return start;
    }

    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        return [min, max];
    }

    private handleMiddle() {
        if (this.startStrut === undefined || this.endStrut === undefined) {
            return;
        }

        const span = this.endStrut.getIndex() - this.startStrut.getIndex();

        const requiredMiddles = span - 1;
        const requiredStretches = span;

        // if there are too many middles, remove the last one
        while (this.middles.length > requiredMiddles) {
            this.middles.pop().dispose();
        }

        // if there are too few middles, add more
        while (this.middles.length < requiredMiddles) {
            const middle = this.modelloader.createInstance("models/shelf_middle.glb", BABYLON.Vector3.Zero());
            const middleClamp = this.modelloader.createInstance("models/clamp.glb", BABYLON.Vector3.Zero());
            middle.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);
            
            middleClamp.setParent(middle);

            middle.setParent(this.start);
            middle.setEnabled(true);

            this.middles.push(middle);
        }

        const startStrutPosition = this.startStrut.getPosition().clone();

        for (var i = 0; i < this.middles.length; i++) {
            const middle = this.middles[i];
            
            middle.setParent(null);
            middle.position = new BABYLON.Vector3(startStrutPosition.x + this.spacing * (i + 1), this.height_m, startStrutPosition.z);
            middle.setParent(this.start);
        }
        
        // if there are too many stretches, remove the last one
        while (this.stretches.length > requiredStretches) {
            this.stretches.pop().dispose();
        }

        // if there are too few stretches, add more
        while (this.stretches.length < requiredStretches) {
            const stretch = this.modelloader.createInstance("models/shelf_stretch.glb", BABYLON.Vector3.Zero());
            stretch.rotate(BABYLON.Axis.Y, Math.PI, BABYLON.Space.LOCAL);

            stretch.setParent(this.start);
            stretch.setEnabled(true);
    
            this.stretches.push(stretch);
        }

        for (var i = 0; i < this.stretches.length; i++) {
            const stretch = this.stretches[i];
            
            stretch.setParent(null);
            stretch.position = new BABYLON.Vector3(startStrutPosition.x + this.spacing * i + Board.BOARD_WIDTH / 2, this.height_m, startStrutPosition.z);
            stretch.scaling.x = (this.spacing - Board.BOARD_WIDTH)/ 0.1;
            stretch.setParent(this.start);
        }
    }
}