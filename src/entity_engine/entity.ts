import * as BABYLON from "@babylonjs/core";
import { ModelLoader } from "../3d/modelloader";
import { LiteEvent } from "../event_engine/LiteEvent";

export abstract class Entity {
    protected modelloader: ModelLoader;
    root: BABYLON.AbstractMesh;
    private bboxMesh: BABYLON.AbstractMesh;
    private followers: BABYLON.TransformNode[] = [];
    static boundingBoxMaterial: BABYLON.StandardMaterial;
    private parentEntity: Entity;
    private children: Entity[] = [];

    private _showAABB = false;
    get showAABB() {
        return this._showAABB;
    }
    
    set showAABB(value) {
        value = value && this.root.isEnabled();
        this._showAABB = value;

        if (value) {
            this.updateBBMesh(this.getBoundingBox());
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

        /*
        this.root.showBoundingBox = true;
        setTimeout(() => {
            this.showAABB = true;
        }, 10);
        */
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
        this.recursiveComputeWorldMatrix(this.root);

        this.freeze();
    }

    getPosition() {
        return this.root.getAbsolutePosition();
    }

    setParent(entity: Entity) {
        this.parentEntity = entity;
        this.root.setParent(entity.root);

        if (entity) {
            entity.addChild(this);
        } else {
            this.parentEntity.removeChild(this);
        }
    }

    private addChild(entity: Entity) {
        this.children.push(entity);
    }

    private removeChild(entity: Entity) {
        const index = this.children.indexOf(entity);

        if (index === -1) {
            return;
        }

        this.children.splice(index, 1);
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
        }
        
        // this will include all followers
        if (this.root) {
            this.root.dispose();
        }

        this.children.forEach(child => {
            child.remove();
        });

        if (this.parentEntity) {
            this.parentEntity.removeChild(this);
        }
    }

    addFollower(follower: BABYLON.TransformNode) {
        follower.setParent(this.root);
        this.followers.push(follower);
    }

    removeFollower(follower: BABYLON.TransformNode) {
        follower.setParent(null);
        this.removeFromBboxFilter(follower);
    }

    addBehavior(behaviour: BABYLON.Behavior<BABYLON.AbstractMesh>) {
        this.root.addBehavior(behaviour);
    }

    removeFromBboxFilter(node: BABYLON.TransformNode) {
        const index = this.followers.indexOf(node);

        if (index === -1) {
            return;
        }

        this.followers.splice(index, -1);
    }

    isFollower(node: BABYLON.TransformNode): boolean {
        if (this.followers.indexOf(node) > -1) {
            return true;
        }

        for (let i = 0; i < this.followers.length; i++) {
            if (node.isDescendantOf(this.followers[i])) {
                return true;
            }
        }

        return false;
    }
    
    // TODO: Does this need to be an abstract mesh? -> Performance
    protected abstract constructMeshes(): BABYLON.AbstractMesh;

    protected abstract modifyBoundixInfo(min: BABYLON.Vector3, max: BABYLON.Vector3): [BABYLON.Vector3, BABYLON.Vector3];

    protected recursiveComputeWorldMatrix(node: BABYLON.Node) {
        node.computeWorldMatrix(true);

        if (node instanceof BABYLON.TransformNode) {
            node.getChildMeshes().forEach(mesh => {
                this.recursiveComputeWorldMatrix(mesh);
            });
        }
    };

    protected updateBoundingBox() {
        this.recursiveComputeWorldMatrix(this.root);

        // only get direct child nodes, but ignore followers and nodes that are the root of other entities
        const recursiveGetDirectChildren = (node: BABYLON.Node, children?: BABYLON.AbstractMesh[]): BABYLON.AbstractMesh[] => {
            if (children === undefined) {
                children = [];
            }

            node.getChildMeshes(true).forEach(mesh => {
                if (this.isFollower(mesh)) {
                    return;
                }

                if (this.children.some(child => child.root === mesh)) {
                    return;
                }

                children.push(mesh);
                recursiveGetDirectChildren(mesh, children);
            });

            return children;
        };

        // Note: assuming that the root has no mesh! Since the root bbox is updated here, it would return its previous bbox here
        // therefore never allowing its bbox to shrink, only grow
        let min: BABYLON.Vector3;
        let max: BABYLON.Vector3;

        // First, get bbox from all meshes in this entity
        recursiveGetDirectChildren(this.root).forEach(mesh => {
            // continue if mesh has no vertices
            if (mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) === null) {
                return;
            }

            const bbox = mesh.getBoundingInfo().boundingBox;

            if (min === undefined) {
                min = bbox.minimumWorld.clone();
            } else {
                min = BABYLON.Vector3.Minimize(min, bbox.minimumWorld);
            }

            if (max === undefined) {
                max = bbox.maximumWorld.clone();
            } else {
                max = BABYLON.Vector3.Maximize(max, bbox.maximumWorld);
            }
        });

        // Second, merge with bbox from children entities
        this.children.forEach(child => {
            const childBbox = child.getBoundingBox();

            if (min === undefined) {
                min = childBbox.minimumWorld.clone();
            } else {
                min = BABYLON.Vector3.Minimize(min, childBbox.minimumWorld);
            }

            if (max === undefined) {
                max = childBbox.maximumWorld.clone();
            } else {
                max = BABYLON.Vector3.Maximize(max, childBbox.maximumWorld);
            }
        });

        if (min === undefined || max === undefined) {
            return;
        }

        // return to local
        min = min.subtract(this.root.getAbsolutePosition());
        max = max.subtract(this.root.getAbsolutePosition());
        
        // apply optional modifications
        const updatedMinMax = this.modifyBoundixInfo(min, max);
        min = updatedMinMax[0];
        max = updatedMinMax[1];

        // check if even changed
        const boundingInfo = this.root.getBoundingInfo();
        if (BABYLON.Vector3.DistanceSquared(boundingInfo.boundingBox.minimum, min) <= 0.00001
            && BABYLON.Vector3.DistanceSquared(boundingInfo.boundingBox.maximum, max) <= 0.00001) {
            return;
        }
        
        var newBoundingInfo = new BABYLON.BoundingInfo(min, max);
        this.root.setBoundingInfo(newBoundingInfo);
        this.root.computeWorldMatrix(true);

        if (this.showAABB) {
            this.updateBBMesh(newBoundingInfo.boundingBox);
        }

        this.onBboxChanged.trigger(newBoundingInfo.boundingBox);
    }
    
    private updateBBMesh(bbox: BABYLON.BoundingBox) {
        if (this.bboxMesh !== undefined) {
            this.bboxMesh.dispose();
            this.bboxMesh = undefined;
        }
        
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