import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/loaders/glTF";
import {
    Engine, Scene, ArcRotateCamera, Vector3, HighlightLayer, HemisphericLight, Mesh,  ExecuteCodeAction, ActionManager, MeshBuilder, FreeCamera, Matrix, Effect, Color4, StandardMaterial, PostProcess, Color3, SceneLoader
} from "@babylonjs/core";
import { AdvancedDynamicTexture, Button, Control, ScrollViewer, Rectangle, Image } from "@babylonjs/gui";
import { Environment } from "./environment";
import { Player } from "./characterController";
import { start } from "repl";


enum State { START = 0, GAME = 1}

class App {
    // General Entire Application
    private _scene: Scene;
    private _canvas: HTMLCanvasElement;
    private _engine: Engine;

    //Scene - related
    private _state: number = 0;
    private _gamescene: Scene;
    private _environment;
    private _player: Player;
    public assets;
    private _transition: boolean = false;

    constructor() {
        this._canvas = this._createCanvas();

        // initialize babylon scene and engine
        this._engine = new Engine(this._canvas, true, { stencil: true });
        this._scene = new Scene(this._engine);


        this._engine.setHardwareScalingLevel(1 / window.devicePixelRatio);

        // run the main render loop
        this._main();
    }

    private _createCanvas(): HTMLCanvasElement {

        //Commented out for development
        document.documentElement.style["overflow"] = "hidden";
        document.documentElement.style.overflow = "hidden";
        document.documentElement.style.width = "100%";
        document.documentElement.style.height = "100%";
        document.documentElement.style.margin = "0";
        document.documentElement.style.padding = "0";
        document.body.style.overflow = "hidden";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        document.body.style.margin = "0";
        document.body.style.padding = "0";

        //create the canvas html element and attach it to the webpage
        this._canvas = document.createElement("canvas");
        this._canvas.style.width = "100%";
        this._canvas.style.height = "100%";
        this._canvas.id = "gameCanvas";
        document.body.appendChild(this._canvas);

        return this._canvas;
    }

    private async _main(): Promise<void> {
        await this._goToStart();

        // Register a render loop to repeatedly render the scene
        this._engine.runRenderLoop(() => {
            switch (this._state) {
                case State.START:
                    this._scene.render();
                    break;
                case State.GAME:
                    this._scene.render();
                    break;
                default: break;
            }
        });

        //resize if the screen is resized/rotated
        window.addEventListener('resize', () => {
            this._engine.resize();
        });
    }
    private async _goToStart() {
        this._engine.displayLoadingUI();

        this._scene.detachControl();
        let scene = new Scene(this._engine);
        scene.clearColor = new Color4(0, 0, 0, 1);
        let camera = new FreeCamera("camera1", new Vector3(0, 0, 0), scene);
        camera.setTarget(Vector3.Zero());

        //create a fullscreen ui for all of our GUI elements
        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        guiMenu.idealHeight = 720; //fit our fullscreen ui to this height


        //create a simple button
        const startBtn = Button.CreateSimpleButton("start", "Ibtihal's Portfolio");
        startBtn.width = "250px";
        startBtn.height = "120px";
        startBtn.hoverCursor = "pointer";
        startBtn.color = "white";
        startBtn.thickness = 1
        startBtn.fontSize = "50"
        startBtn.fontFamily = "Orbitron"
        startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        guiMenu.addControl(startBtn);
        Effect.RegisterShader("fade",
            "precision highp float;" +
            "varying vec2 vUV;" +
            "uniform sampler2D textureSampler; " +
            "uniform float fadeLevel; " +
            "void main(void){" +
            "vec4 baseColor = texture2D(textureSampler, vUV) * fadeLevel;" +
            "baseColor.a = 1.0;" +
            "gl_FragColor = baseColor;" +
            "}");

        let fadeLevel = 1.0;
        this._transition = false;
        scene.registerBeforeRender(() => {
            if (this._transition) {
                fadeLevel -= .05;
                if (fadeLevel <= 0) {
                    this._goToGame();
                    this._transition = false;
                }
            }
        })

        //this handles interactions with the start button attached to the scene
        startBtn.onPointerDownObservable.add(() => {
            const postProcess = new PostProcess("Fade", "fade", ["fadeLevel"], null, 1.0, camera);
            postProcess.onApply = (effect) => {
                effect.setFloat("fadeLevel", fadeLevel);
            };
            this._transition = true;
            scene.detachControl();

            //observables disabled
        });

        //--SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        this._engine.hideLoadingUI();
        //lastly set the current state to the start state and set the scene to the start scene
        this._scene.dispose();
        this._scene = scene;
        this._state = State.START;
        var finishedLoading = false;
        await this._setUpGame().then(res => {
            finishedLoading = true;
        });

    }


    private async _setUpGame() {
        let scene = new Scene(this._engine);
        this._gamescene = scene;

        //--CREATE ENVIRONMENT--
        const environment = new Environment(scene);
        this._environment = environment; //class variable for App
        await this._environment.load();//environment
        await this._loadCharacterAssets(scene);


    }

    private async _goToGame() {
        //--SETUP SCENE--
        this._scene.detachControl();
        let scene = this._gamescene;
        scene.clearColor = new Color4(0.010947, 0.009669, 0.021937); // a color that fit the overall color scheme better
        let camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new Vector3(6, 2, 0), scene);
        camera.setTarget(new Vector3(0, 0, -2));
        camera.attachControl(scene, true);
        camera.minZ = 0;
        camera.maxZ = 20;
        camera.lowerRadiusLimit = 2;
        camera.upperRadiusLimit = 10;
        camera.checkCollisions = true;
        camera.collisionRadius = new Vector3(0.5, 0.5, 0.5);

        camera.wheelPrecision = 20;

        //--GUI--
        //dont detect any inputs from this ui while the game is loading
        this._engine.displayLoadingUI();


        //temporary scene objects
        var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        //get rid of start scene, switch to gamescene and change states
        this._scene.dispose();
        this._state = State.GAME;
        this._scene = scene;
        this._engine.hideLoadingUI();
        //the game is ready, attach control back
        this._scene.attachControl();
        //primitive character and setting
        await this._initializeGameAsync(scene);

        //--WHEN SCENE FINISHED LOADING--
        await scene.whenReadyAsync();
        /*var onPointerMove = function (e) {
            var result = scene.pick(scene.pointerX, scene.pointerY);
            //var hl = new HighlightLayer("hl", this._scene);
            //hl.removeAllMeshes();
            if (result.pickedMesh) {
                //pickedMesh = result.pickedMesh;
                //hl.addMesh(result.pickedMesh, Color3.Blue());
                console.log("heyo");
                console.log(result.pickedMesh)
            }
            console.log(result.pickedMesh)
        };
        window.addEventListener("pointermove", onPointerMove, false);*/
        var ordi = scene.getMeshByName("ordinateur") as Mesh;
        var bloc = scene.getMeshByName("blocnotes") as Mesh;
        var arcade = scene.getMeshByName("arcade") as Mesh;
        //ordi.metadata = "ordinateur";
        ordi.actionManager = new ActionManager(scene);
        bloc.actionManager = new ActionManager(scene);
        arcade.actionManager = new ActionManager(scene);
        var hlight = new HighlightLayer("hlight", scene);
        hlight.addMesh(bloc, Color3.White())
        var hl = new HighlightLayer("hl1", scene);
        var hli = new HighlightLayer("hl2", scene);
        hli.addMesh(ordi, Color3.White());
        var hlarcade = new HighlightLayer("hlightarcade", scene);
        hlarcade.addMesh(arcade, Color3.White())
        const arc = Button.CreateSimpleButton("itchio", "My Itchio");
        arc.isVisible = false;
        arcade.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, function (ev) {
            arc.isVisible = true;
            hlarcade.removeMesh(arcade);
            hlarcade.addMesh(arcade, Color3.Green());
            arc.width = "250px";
            arc.highlightColor = "white";
            arc.height = "120px";
            arc.color = "white";
            arc.thickness = 2;
            arc.fontSize = "25";
            arc.fontFamily = "Orbitron";
            arc.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            arc.isPointerBlocker = false;
            guiMenu.addControl(arc)
            arcade.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, function (ev) {
                hlarcade.removeMesh(arcade);
                arc.isVisible = false;
                hlarcade.addMesh(arcade, Color3.White())
            }));

        }));
        arcade.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, function (ev) {
            window.open("https://itch.io/profile/ibaucarrre")
            console.log("link ouvert")
        }));

        const guiMenu = AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const blocnotes = Button.CreateSimpleButton("blocnotes", "About Me");
        blocnotes.isVisible = false;
        bloc.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, function (ev) {
            hlight.removeMesh(bloc);
            scene.hoverCursor = "pointer";
            hlight.addMesh(bloc, Color3.Green());
            blocnotes.isVisible = true;
            blocnotes.width = "250px";
            blocnotes.highlightColor = "white";
            blocnotes.height = "120px";
            blocnotes.color = "white";
            blocnotes.thickness = 2;
            blocnotes.fontSize = "25";
            blocnotes.fontFamily = "Orbitron";
            blocnotes.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            blocnotes.isPointerBlocker = false;
            guiMenu.addControl(blocnotes);
            bloc.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, function (ev) {

                var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
                var rc = new Rectangle();
                rc.heightInPixels = 600;
                rc.widthInPixels = 800;
                rc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                rc.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                rc.thickness = 0;
                advancedTexture.addControl(rc);
                var image = new Image("blocnotes", "./models/blocnotes.png");
                image.stretch = Image.STRETCH_UNIFORM;
                rc.addControl(image);
                const quit = Button.CreateImageOnlyButton("quit", "./models/close.jpg");
                quit.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                quit.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                rc.addControl(quit);
                quit.width = "40px";
                quit.height = "40px";
                quit.hoverCursor = "pointer";
                quit.onPointerDownObservable.add(() => {
                    camera.attachControl();
                    advancedTexture.dispose();
                });
            }));
        }));
        bloc.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, function (ev) {
            hlight.removeMesh(bloc);
            blocnotes.isVisible = false;
            hlight.addMesh(bloc, Color3.White());

        }));





        const startBtn = Button.CreateSimpleButton("start", "My Portfolio");
        startBtn.isVisible = false;
        ordi.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, function (ev) {
            hli.removeMesh(ordi);
            scene.hoverCursor = "pointer";
            hl.addMesh(ordi, Color3.Green());
            startBtn.isVisible = true;
            startBtn.width = "250px";
            startBtn.highlightColor = "white";
            startBtn.height = "120px";
            startBtn.color = "white";
            startBtn.thickness = 2;
            startBtn.fontSize = "25";
            startBtn.fontFamily = "Orbitron";
            startBtn.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            startBtn.isPointerBlocker = false;
            guiMenu.addControl(startBtn);

            ordi.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, function (ev) {
                artstation.isVisible = true;
                var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");
                var sv = new ScrollViewer();
                //sv.thumbImage = new Image("thumb", "./models/thumb_image.jpg");
                //sv.barImage = new Image("thumb", "./models/thumb_bar.jpg");
                //sv.thumbImage.width = "200";
                //sv.thumbImage.height = "300";
                //sv.thumbImage.populateNinePatchSlicesFromImage = true;
                //sv.thumbImage.stretch = Image.STRETCH_NINE_PATCH;
                //sv.thumbImage.sliceLeft = 10;
                //sv.thumbImage.sliceTop = 9;
                //sv.thumbImage.sliceBottom = 45;
                //sv.thumbImage.sliceRight = 74;
                //sv.barImage.stretch = Image.STRETCH_UNIFORM;
                sv.fixedRatio = 1.765;
                sv.height=0.8;
                sv.background = "transparent";
                advancedTexture.addControl(sv);
                var rc = new Rectangle();
                rc.adaptWidthToChildren;
                rc.fixedRatio = 6.07342430149;
                rc.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
                rc.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                sv.addControl(rc);
                var image = new Image("portfolio", "./models/portfolioo.jpg");
                image.stretch = Image.STRETCH_UNIFORM;

                rc.addControl(image);
                advancedTexture.canRescale;
                camera.detachControl();
                const quit = Button.CreateImageOnlyButton("quit", "./models/close.jpg");
                quit.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                quit.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                rc.addControl(quit);
                quit.width = "40px";
                quit.height = "40px";
                quit.hoverCursor = "pointer";
                quit.onPointerDownObservable.add(() => {
                    camera.attachControl();
                    artstation.isVisible = false;
                    advancedTexture.dispose();
                });



            }));
        }));
        ordi.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, function (ev) {
            hl.removeMesh(ordi);
            startBtn.isVisible = false;
            hli.addMesh(ordi, Color3.White());

        }));
        const artstation = Button.CreateImageOnlyButton("artstation", "./models/artstation.jpg");
                artstation.isVisible = false;
                artstation.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
                artstation.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                artstation.width = "250px";
                artstation.height = "105px";
                artstation.hoverCursor = "pointer";
                artstation.color = "white";
                artstation.thickness = 1
                guiMenu.addControl(artstation);
                artstation.onPointerClickObservable.add(() => {
                    window.open("https://www.artstation.com/ibtihalbaaziz1")
                });
        //scene.onPointerMove = function castRay() {
        //    var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, Matrix.Identity(), camera);

        //    var hit = scene.pickWithRay(ray);

        //    if (hit.pickedMesh && hit.pickedMesh.name == "ordinateur") {
        //        console.log("salut");
        //        scene.hoverCursor = "pointer";
        //    }
        //    else {

        //    }
        //}




    }
    private async _loadCharacterAssets(scene) {

        async function loadCharacter() {

            return SceneLoader.ImportMeshAsync(null, "./models/", "scene.glb", scene).then((result) => {
                const body = result.meshes[0];
                body.alwaysSelectAsActiveMesh = true;
                body.checkCollisions = true;
                body.doNotSyncBoundingInfo = true;

                //body is our actual player mesh

                return {
                    mesh: body as Mesh,
                }
            });
        }
        return loadCharacter().then(assets => {
            this.assets = assets;
        })

    }

    private async _initializeGameAsync(scene): Promise<void> {





        //Create the player
        this._player = new Player(this.assets, scene);

    }



}
new App();
