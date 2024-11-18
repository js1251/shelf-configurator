import * as BABYLON from "@babylonjs/core";
import * as BABYLONGUI from "@babylonjs/gui";

export class ModelLoader {
    scene: BABYLON.Scene;
    private shadowGenerator: BABYLON.ShadowGenerator;
    private preloadedMeshes: Map<string, BABYLON.Mesh>;
    private spawnCount: number = 0;

    private root: BABYLON.Node;
    private GUIManager: BABYLONGUI.GUI3DManager;

    constructor(scene: BABYLON.Scene, shadowGenerator: BABYLON.ShadowGenerator) {
        this.scene = scene;
        this.shadowGenerator = shadowGenerator;
        this.preloadedMeshes = new Map<string, BABYLON.Mesh>();

        this.root = new BABYLON.Node("model_root", scene);
        this.GUIManager = new BABYLONGUI.GUI3DManager(scene);
        this.GUIManager.utilityLayer.utilityLayerScene.removeLight(this.GUIManager.utilityLayer.utilityLayerScene.lights[0]);
    }

    public preloadModel(modelUrl: string, material: BABYLON.Material = undefined): Promise<void> {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "",
                modelUrl,
                "",
                this.scene,
                (meshes) => {
                    if (meshes.length > 0) {
                        const root = meshes[0];
                        const mesh = meshes[1];

                        if (root instanceof BABYLON.Mesh && mesh instanceof BABYLON.Mesh) {
                            root.setEnabled(false);

                            if (material) {
                                mesh.material = material;
                            }

                            this.shadowGenerator.getShadowMap().renderList.push(mesh);
                            this.shadowGenerator.addShadowCaster(mesh);
                            mesh.receiveShadows = true;

                            this.preloadedMeshes.set(modelUrl, root);
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

    public createInstance(modelUrl: string, position: BABYLON.Vector3 = BABYLON.Vector3.Zero()): BABYLON.AbstractMesh {
        const preloadedMesh = this.preloadedMeshes.get(modelUrl);
        if (preloadedMesh) {
            const instance = preloadedMesh.clone(`${modelUrl}_instance_${this.spawnCount++}`);

            instance.position = position;
            instance.setEnabled(true);

            this.shadowGenerator.getShadowMap().renderList.push(instance);
            this.shadowGenerator.addShadowCaster(instance);
            instance.receiveShadows = true;

            return instance;
        } else {
            throw new Error(`Model ${modelUrl} not preloaded`);
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

    public createButton(onClick: () => void): BABYLONGUI.Button3D {
        var button = new BABYLONGUI.Button3D();
        this.GUIManager.addControl(button);

        return button;
    }
}
