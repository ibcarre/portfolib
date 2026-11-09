import { Scene, Mesh, Vector3, Color3, GlowLayer, TransformNode, Logger, HighlightLayer,SceneLoader, Color4, Texture, PBRMetallicRoughnessMaterial, StandardMaterial, Vector2, VertexBuffer, AnimationGroup, Sound, ExecuteCodeAction, ActionManager, Tags, ShadowGenerator, MeshBuilder, PBRMaterial, Particle, Material} from "@babylonjs/core";
import { appendFileSync } from "fs";

export class Environment {
    private _scene: Scene;


    constructor(scene: Scene) {
        this._scene = scene;


    }

    public async load() {
        const assets = await this._loadAsset();


        //Loop through all environment meshes that were imported
        assets.allMeshes.forEach((m) => {
            m.receiveShadows = true;
            m.checkCollisions = true;


        });



    }
    public async _loadAsset() {
        const result = await SceneLoader.ImportMeshAsync(null, "./models/", "scene7.glb", this._scene)
        const etoiles = await SceneLoader.ImportMeshAsync(null, "./models/", "etoiles.glb", this._scene)
        let env = result.meshes[0];
        let enviro = etoiles.meshes[0];
        let allMeshes = env.getChildMeshes();

        let etoile = enviro.getChildMeshes();
        const gl = new GlowLayer("glow", this._scene);
        gl.intensity = 0.3;
        var ordi = this._scene.getMeshByName("ordinateur");
        var bloc = this._scene.getMeshByName("blocnotes");
        var arcade = this._scene.getMeshByName("arcade");
        var decor = this._scene.getMeshByName("enviro");
        decor.material.backFaceCulling = true;
        bloc.isPickable = true;
        ordi.isPickable = true;
        arcade.isPickable = true;

        //this.hlight(ordi);


        return {
            env: env, //reference to our entire imported glb (meshes and transform nodes)
            allMeshes: allMeshes, // all of the meshes that are in the environment
            enviro: enviro,
            etoile: etoile,

        };


    }


    }


