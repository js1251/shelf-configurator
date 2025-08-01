import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../../3d/modelloader";
import { ProductEntity } from "../../entity_engine/product_entity";
import { ProductOptions } from "../product_options";
import * as Resources from "../../shelf/materials";

export class Strut extends ProductEntity {
    private height_m: number;
    private index: number;
    
    private strut: BABYLON.AbstractMesh;
    private footTop: BABYLON.AbstractMesh;
    private footBottom: BABYLON.AbstractMesh;

    static STRUT_DIAMETER = 0.028;

    constructor(modelloader: ModelLoader, height_m: number, index: number) {
        super(modelloader);
        this.index = index;

        this.setHeight(height_m);
    }

    setIndex(index: number) {
        this.index = index;
    }

    getIndex(): number {
        return this.index;
    }

    getHeight(): number {
        return this.height_m;
    }

    setHeight(height_m: number) {
        this.unFreeze();

        this.height_m = height_m;

        this.footTop.setParent(null);
        this.footBottom.setParent(null);

        const newPosition = this.getPosition().clone();
        newPosition.y = this.height_m / 2;
        this.setPosition(newPosition);
        this.strut.getChildMeshes()[0].scaling.y = (this.height_m - 0.04 * 2) * 10;

        const strutPosition = newPosition.clone();
        strutPosition.y = 0;
        this.footTop.position = strutPosition.add(BABYLON.Vector3.Up().scale(this.height_m - 0.04));
        this.footTop.setParent(this.strut);

        this.footBottom.position = strutPosition.add(BABYLON.Vector3.Up().scale(0.04));
        this.footBottom.setParent(this.strut);

        this.updateBoundingBox();
        this.freeze();
        
        this.onPriceChanged.trigger(this.getPrice());
    }

    get SKU(): string {
        let heightRange = this.getRangeOption(this.height_m * 100, ProductOptions.availableStrutHeights);
        return `STRUT-${this.material}-${heightRange}`;
    }

    protected applyMaterial(material: string) {
        const shelfMaterial = Resources.getShelfMaterialForStringMaterial(material);
        this.strut.getChildMeshes()[0].material = shelfMaterial.material;
    }

    protected constructMeshes(): BABYLON.AbstractMesh {
        this.strut = this.modelloader.createInstance("models/strut.glb");
        this.strut.getChildMeshes()[0].scaling.y = 2;
        
        this.footTop = this.modelloader.createInstance("models/foot.glb");
        this.footTop.translate(BABYLON.Vector3.Up(), 0.05);
        this.footTop.setParent(this.strut);

        this.footBottom = this.modelloader.createInstance("models/foot.glb");
        this.footBottom.translate(BABYLON.Vector3.Up(), -0.05);
        this.footBottom.rotate(BABYLON.Axis.X, Math.PI, BABYLON.Space.LOCAL);
        this.footBottom.setParent(this.strut);

        return this.strut;
    }

    protected modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3] {
        min.x += 0.01;
        max.x -= 0.01;

        min.z += 0.01;
        max.z -= 0.01;
        
        return [min, max];
    }
}