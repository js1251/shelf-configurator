import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../modelloader";

export abstract class Entity {
    protected modelloader: ModelLoader;
    root: BABYLON.AbstractMesh;
    private bboxMesh: BABYLON.AbstractMesh;

    private _showAABB = false;
    get showAABB() {
        return this._showAABB;
    }
    
    set showAABB(value) {
        value = value && this.root.isEnabled();

        this._showAABB = value;
        this.bboxMesh.setEnabled(value);
    }

    constructor(modelloader: ModelLoader) {
        this.modelloader = modelloader;

        this.root = this.constructMeshes();
        this.updateBoundingBox();

        /*
        setTimeout(() => {
            this.showAABB = true;
        }, 10);
        */
    }

    getBoundingBox() {
        return this.root.getBoundingInfo().boundingBox;
    }

    setPosition(position) {
        this.root.setAbsolutePosition(position);
        this.updateBoundingBox();
    }

    getPosition() {
        return this.root.getAbsolutePosition();
    }

    setParent(parent: BABYLON.Node) {
        this.root.setParent(parent);
    }

    getParent() {
        return this.root.parent;
    }

    collidesBbox(boundingBox: BABYLON.BoundingBox) : boolean{
        return BABYLON.BoundingBox.Intersects(this.getBoundingBox(), boundingBox);
    }

    collidesMesh(entity: Entity) : boolean{
        throw new Error("Method not implemented.");
        return this.root.intersectsMesh(entity.root, true, true);
    }

    remove() {
        this.root.dispose();
        this.bboxMesh.dispose();
    }

    addBehavior(behaviour: BABYLON.Behavior<BABYLON.AbstractMesh>) {
        this.root.addBehavior(behaviour);
    }
    
    protected abstract constructMeshes(): BABYLON.AbstractMesh;

    protected abstract modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3];

    protected updateBoundingBox() {
        const hierarchyBounds = this.root.getHierarchyBoundingVectors();

        hierarchyBounds.min = hierarchyBounds.min.subtract(this.root.getAbsolutePosition());
        hierarchyBounds.max = hierarchyBounds.max.subtract(this.root.getAbsolutePosition());

        const updatedMinMax = this.modifyBoundixInfo(hierarchyBounds.min, hierarchyBounds.max);
        hierarchyBounds.min = updatedMinMax[0];
        hierarchyBounds.max = updatedMinMax[1];

        var boundingInfo = new BABYLON.BoundingInfo(hierarchyBounds.min, hierarchyBounds.max);
        
        this.root.setBoundingInfo(boundingInfo);

        this.updateBBMesh();
    }

    static boundingBoxMaterial: BABYLON.StandardMaterial;
    
    private updateBBMesh() {
        if (this.bboxMesh !== undefined) {
            this.bboxMesh.dispose();
        }

        const bbox = this.getBoundingBox();
        
        this.bboxMesh = BABYLON.MeshBuilder.CreateBox("bbMesh", {
            width: bbox.extendSizeWorld.x * 2,
            height: bbox.extendSizeWorld.y * 2,
            depth: bbox.extendSizeWorld.z * 2,
        }, this.modelloader.scene);

        this.bboxMesh.position = bbox.centerWorld;

        if (Entity.boundingBoxMaterial === undefined) {
            var mat = new BABYLON.StandardMaterial("mat");
            mat.diffuseColor = BABYLON.Color3.Green();
            mat.alpha = 0.3;
            Entity.boundingBoxMaterial = mat;
        }

        this.bboxMesh.material = Entity.boundingBoxMaterial;
        this.bboxMesh.setEnabled(this._showAABB);
        this.bboxMesh.isPickable = false;
    } 
}