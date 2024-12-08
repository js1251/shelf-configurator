import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { LiteEvent } from "../event_engine/LiteEvent";

export abstract class Entity {
    protected modelloader: ModelLoader;
    root: BABYLON.AbstractMesh;
    private bboxMesh: BABYLON.AbstractMesh;
    private ignoreBboxNodes: BABYLON.TransformNode[] = [];
    static boundingBoxMaterial: BABYLON.StandardMaterial;

    private _showAABB = false;
    get showAABB() {
        return this._showAABB;
    }
    
    set showAABB(value) {
        value = value && this.root.isEnabled();
        this._showAABB = value;

        if (value) {
            this.updateBBMesh();
            this.bboxMesh.setEnabled(true);
        } else if (this.bboxMesh) {
            this.bboxMesh.dispose();
        }
    }

    private readonly onBboxChanged = new LiteEvent<BABYLON.BoundingBox>();
    public get BboxChanged() {
        return this.onBboxChanged.expose();
    }

    constructor(modelloader: ModelLoader) {
        this.modelloader = modelloader;

        this.root = this.constructMeshes();
        this.updateBoundingBox();

        this.freeze();

        this.root.showBoundingBox = true;
        setTimeout(() => {
            this.showAABB = true;
        }, 10);
    }

    freeze() {
        return;
        this.root.freezeWorldMatrix();

        this.root.getChildMeshes().forEach(mesh => {
            if (this.isFollower(mesh)) {
                return;
            }

            mesh.freezeWorldMatrix();
        });
    }

    unFreeze() {
        return;

        this.root.unfreezeWorldMatrix();

        this.root.getChildMeshes().forEach(mesh => {
            if (this.isFollower(mesh)) {
                return;
            }

            mesh.unfreezeWorldMatrix();
        });
    }

    getBoundingBox() {
        return this.root.getBoundingInfo().boundingBox;
    }

    setPosition(position) {
        this.unFreeze();

        this.root.setAbsolutePosition(position);
        this.updateBoundingBox();

        this.freeze();
    }

    getPosition() {
        return this.root.getAbsolutePosition();
    }

    setParent(parent: BABYLON.TransformNode) {
        this.root.setParent(parent);
    }

    getParent() {
        return this.root.parent;
    }

    collidesBbox(boundingBox: BABYLON.BoundingBox) : boolean {
        return BABYLON.BoundingBox.Intersects(this.getBoundingBox(), boundingBox);
    }

    collidesMesh(entity: Entity) : boolean{
        throw new Error("Method not implemented.");
        return this.root.intersectsMesh(entity.root, true, true);
    }

    remove() {        
        if (this.bboxMesh) {
            this.bboxMesh.dispose();
            
            console.log("disposed bbox mesh");
        }
        
        if (this.root) {
            this.root.dispose();
        }
    }

    addFollower(follower: BABYLON.TransformNode) {
        follower.setParent(this.root);
        this.addToBboxFilter(follower);
    }

    removeFollower(follower: BABYLON.TransformNode) {
        follower.setParent(null);
        this.removeFromBboxFilter(follower);
    }

    addBehavior(behaviour: BABYLON.Behavior<BABYLON.AbstractMesh>) {
        this.root.addBehavior(behaviour);
    }

    addToBboxFilter(node: BABYLON.TransformNode) {
        this.ignoreBboxNodes.push(node);
    }

    removeFromBboxFilter(node: BABYLON.TransformNode) {
        const index = this.ignoreBboxNodes.indexOf(node);

        if (index === -1) {
            return;
        }

        this.ignoreBboxNodes.splice(index, -1);
    }

    isFollower(node: BABYLON.TransformNode): boolean {
        if (this.ignoreBboxNodes.indexOf(node) > -1) {
            return true;
        }

        for (let i = 0; i < this.ignoreBboxNodes.length; i++) {
            if (node.isDescendantOf(this.ignoreBboxNodes[i])) {
                return true;
            }
        }

        return false;
    }
    
    // TODO: Does this need to be an abstract mesh? -> Performance
    protected abstract constructMeshes(): BABYLON.AbstractMesh;

    protected abstract modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3];

    protected updateBoundingBox() {
        console.log("updateBoundingBox");
        console.log(this.ignoreBboxNodes);
        this.root.getChildMeshes().forEach(mesh => {
            if (this.isFollower(mesh)) {
                console.log(`${mesh.name} is a follower`);
            }
        });

        const hierarchyBounds = this.root.getHierarchyBoundingVectors(true, (node) => !this.isFollower(node));

        hierarchyBounds.min = hierarchyBounds.min.subtract(this.root.getAbsolutePosition());
        hierarchyBounds.max = hierarchyBounds.max.subtract(this.root.getAbsolutePosition());

        const updatedMinMax = this.modifyBoundixInfo(hierarchyBounds.min, hierarchyBounds.max);
        hierarchyBounds.min = updatedMinMax[0];
        hierarchyBounds.max = updatedMinMax[1];

        // check if even changed
        const boundingInfo = this.root.getBoundingInfo();
        if (BABYLON.Vector3.DistanceSquared(boundingInfo.boundingBox.minimum, hierarchyBounds.min) <= 0.00001
            && BABYLON.Vector3.DistanceSquared(boundingInfo.boundingBox.maximum, hierarchyBounds.max) <= 0.00001) {
            return;
        }

        var newBoundingInfo = new BABYLON.BoundingInfo(hierarchyBounds.min, hierarchyBounds.max);
        this.root.setBoundingInfo(newBoundingInfo);
        this.root.computeWorldMatrix(true);

        if (this.showAABB) {
            this.updateBBMesh();
        }

        this.onBboxChanged.trigger(newBoundingInfo.boundingBox);
    }
    
    private updateBBMesh() {
        if (this.bboxMesh !== undefined) {
            this.bboxMesh.dispose();
            this.bboxMesh = undefined;
        }

        const bbox = this.getBoundingBox();
        
        this.bboxMesh = BABYLON.MeshBuilder.CreateBox("bbMesh", {
            width: bbox.extendSizeWorld.x * 2,
            height: bbox.extendSizeWorld.y * 2,
            depth: bbox.extendSizeWorld.z * 2,
        }, this.modelloader.scene);

        this.bboxMesh.position = bbox.centerWorld.clone();

        if (Entity.boundingBoxMaterial === undefined) {
            var mat = new BABYLON.StandardMaterial("mat");
            mat.diffuseColor = BABYLON.Color3.Green();
            mat.alpha = 0.3;
            Entity.boundingBoxMaterial = mat;
            mat.freeze();
        }

        this.bboxMesh.material = Entity.boundingBoxMaterial;
        this.bboxMesh.setEnabled(this._showAABB);
        this.bboxMesh.isPickable = false;

        this.addFollower(this.bboxMesh);
    } 
}