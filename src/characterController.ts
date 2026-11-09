import { Scene, Vector3, Ray, TransformNode, Mesh, Color3, Color4, HighlightLayer, UniversalCamera, Quaternion, AnimationGroup, ExecuteCodeAction, ActionManager, ParticleSystem, Texture, SphereParticleEmitter, Sound, Observable, ShadowGenerator } from "@babylonjs/core";

export class Player extends TransformNode {
    public scene: Scene;

    //Player
    public mesh: Mesh; //outer collisionbox of player
    private _idle: AnimationGroup;
    private _currentAnim: AnimationGroup = null;

    constructor(assets, scene: Scene) {
        super("player", scene);
        this.scene = scene;

        this.mesh = assets.mesh;


    }


        //initialize current and previous


}