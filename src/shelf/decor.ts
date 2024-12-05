import { ModelLoader } from "../3d/modelloader";
import { Entity } from "../entity_engine/entity";

export abstract class Decor extends Entity {

    constructor(modelloader: ModelLoader) {
        super(modelloader);

        // prevent ray picking
        this.root.isPickable = false;
        this.root.getChildMeshes().forEach(mesh => {
            mesh.isPickable = false;
        });
    }

    abstract clone(): Decor;
}