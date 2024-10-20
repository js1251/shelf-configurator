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
        const updateBBox = (mesh : BABYLON.AbstractMesh, min: BABYLON.Vector3, max: BABYLON.Vector3) : [BABYLON.Vector3, BABYLON.Vector3] => {
            mesh.computeWorldMatrix(true);

            const hierarchyBounds = mesh.getHierarchyBoundingVectors();
            min = BABYLON.Vector3.Minimize(min, hierarchyBounds.min);
            max = BABYLON.Vector3.Maximize(max, hierarchyBounds.max);

            mesh.getChildMeshes().forEach((child) => {
                const result = updateBBox(child, min, max);
                min = result[0];
                max = result[1];
            });

            return [min, max];
        }
        
        var min = BABYLON.Vector3.One().scale(Infinity);
        var max = BABYLON.Vector3.One().scale(-Infinity);

        var updatedMinMax = updateBBox(this.root, min, max);

        if (min.equals(BABYLON.Vector3.One().scale(Infinity))) {
            min = BABYLON.Vector3.Zero();
        }
        if (max.equals(BABYLON.Vector3.One().scale(-Infinity))) {
            max = BABYLON.Vector3.Zero();
        }

        min = updatedMinMax[0].subtract(this.root.getAbsolutePosition());
        max = updatedMinMax[1].subtract(this.root.getAbsolutePosition());

        updatedMinMax = this.modifyBoundixInfo(min, max);
        min = updatedMinMax[0];
        max = updatedMinMax[1];

        var boundingInfo = new BABYLON.BoundingInfo(min, max);
        
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