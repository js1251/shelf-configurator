import * as BABYLON from "@babylonjs/core";

export class ModelLoader {
    private scene: BABYLON.Scene;
    private preloadedMeshes: Map<string, BABYLON.Mesh>;

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.preloadedMeshes = new Map<string, BABYLON.Mesh>();
    }

    public preloadModel(modelUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", // Leave empty to load all meshes
                modelUrl,
                "",
                this.scene,
                (meshes) => {
                    if (meshes.length > 0) {
                        if (meshes[0] instanceof BABYLON.Mesh) {
                        this.preloadedMeshes.set(modelUrl, meshes[0]);
                        meshes[0].setEnabled(false); // Hide the preloaded mesh
                        resolve();
                        } else {
                            reject(new Error("No meshes were loaded"));
                            return;
                        }
                    } else {
                        reject(new Error("No meshes were loaded"));
                    }
                },
                null,
                (scene, message, exception) => {
                    reject(new Error(message));
                }
            );
        });
    }

    public createInstance(modelUrl: string, position: BABYLON.Vector3): BABYLON.AbstractMesh | null {
        const preloadedMesh = this.preloadedMeshes.get(modelUrl);
        if (preloadedMesh) {
            const instance = preloadedMesh.createInstance(`instance_${Date.now()}`);
            instance.position = position;
            instance.setEnabled(true); // Show the instance
            return instance;
        } else {
            console.error("Model not preloaded");
            return null;
        }
    }

    public moveInstance(instance: BABYLON.AbstractMesh, direction: BABYLON.Vector3): void {
        instance.position.addInPlace(direction);
        this.emitEvent("instanceMoved", { instance });
    }

    private emitEvent(eventName: string, detail: object): void {
        const event = new CustomEvent(eventName, { detail });
        document.dispatchEvent(event);
    }
}
