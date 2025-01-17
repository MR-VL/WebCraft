import * as THREE from "three";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import {entity} from "./Entity.js";
import {GameDefs} from "./Game-defs.js";

export const playerController = (() => {

    class PlayerController extends entity.Component {
        static className = 'PlayerController';

        get Name(){
            return PlayerController.className;
        }

        constructor() {
            super();
        }

        InitEntity(){
            this.radius = 1.5;
            this.keys = {
                forward: false,
                backward: false,
                left: false,
                right: false
            };

            this.standing = true;
            //todo change velocity and acc/dec
            this.velocity = new THREE.Vector3(0, 0, 0);
            this.decceleration = new THREE.Vector3(-10, -9.8*5, -10);
            this.acceleration = new THREE.Vector3(75, 20, 75);
            this.acceleration = new THREE.Vector3(200, 25, 200);

            const threejs = this.FindEntity('renderer').GetComponent('ThreeJSController');
            this.element = threejs.threejs.domElement;
            this.camera = threejs.camera;
            this.SetupPointerLock();

            this.controls = new PointerLockControls(this.camera, document.body);
            threejs.scene.add(this.controls.getObject());

            if(GameDefs.enabled){
                this.controls.getObject().position.set(...GameDefs.playerPOS);
                this.controls.getObject().position.set(...GameDefs.playerROT);
                this.decceleration = new THREE.Vector3(...GameDefs.cameraDeceleration);
            }

            this.controls.getObject().position.copy(this.Parent.Position);

            document.addEventListener('keydown', (event) => this.OnKeyDown(event), false);
            document.addEventListener('keyup', (event) => this.OnKeyUp(event), false);
        }

        OnKeyDown(event){
            switch (event.keyCode){
                case 38: //up arrow
                case 87: // w key
                    this.keys.forward = true;
                    break;

                case 37: //left arrow
                case 65: // a key
                    this.keys.left = true;
                    break;

                case 40: //down arrow
                case 83: // s key
                    this.keys.backward = true;
                    break;

                case 39: //right arrow
                case 68: //d key
                    this.keys.right = true;
                    break;

                case 32: //space
                    if(this.standing){
                        this.velocity.y = -this.acceleration.y;
                        this.standing = false;
                    }
                    break;
            }
        }

        OnKeyUp(event){
            switch (event.keyCode){
                case 38: //up arrow
                case 87: // w key
                    this.keys.forward = false;
                    break;

                case 37: //left arrow
                case 65: // a key
                    this.keys.left = false;
                    break;

                case 40: //down arrow
                case 83: // s key
                    this.keys.backward = false;
                    break;

                case 39: //right arrow
                case 68: //d key
                    this.keys.right = false;
                    break;

                case 84: // t key
                    this.OnCycleTools();
                    break;

                case 219: // [ key
                    this.OnCycleTextures(-1);
                    break;

                case 221: // ] key
                    this.OnCycleTextures(1);
                    break;

                case 189: // - key
                    this.cells.ChangeActiveTool(-1);
                    break;

                case 187: // = key
                    this.cells.ChangeActiveTool(1);
                    break;

                case 13: //enter key
                    this.keys.enter = true;
                    break;
            }
        }

        OnMouseUp(event){
            this.keys.enter = true;
        }

        SetupPointerLock(){
            const hasPointerLock = ('pointerLockElement' in document ||  'mozPointerLockElement' in document || 'webkitPointerLockElement' in document);

            if(hasPointerLock){
                const lockChange = (event) => {
                    if(document.pointerLockElement === document.body|| document.mozPointerLockElement === document.body || document.webkitPointerLockElement === document.body){
                        this.enabled = ture;
                        this.controls.enabled = true;
                    }
                    else{
                        this.controls.enabled = false;
                    }
                };

                const lockError = (event) => {
                    console.log("lockError", event);
                };

                document.addEventListener('pointerlockchange', lockChange, false);
                document.addEventListener('webkitpointerlockchange', lockChange, false);
                document.addEventListener('onpointerlockchange', lockChange, false);
                document.addEventListener('pointerlockerror', lockError, false);
                document.addEventListener('onpointerlockerror', lockError, false);
                document.addEventListener('webkitpointerlockerror', lockError, false);

                this.element.addEventListener('click', (event) => {
                    document.body.requestPointerLock(document.body.requestPointerLock ||
                        document.body.mozRequestPointerLock ||
                        document.body.webkitRequestPointerLock
                    );

                    if (/Firefox/i.test(navigator.userAgent)) {
                        const fullScreenChange = (event) => {
                            if (document.fullscreenElement === document.body ||
                                document.mozFullscreenElement === document.body ||
                                document.mozFullScreenElement === document.body) {
                                document.removeEventListener('fullscreenchange', fullScreenChange);
                                document.removeEventListener('mozfullscreenchange', fullScreenChange);
                                document.body.requestPointerLock();
                            }
                        };
                        document.addEventListener(
                            'fullscreenchange', fullScreenChange, false);
                        document.addEventListener(
                            'mozfullscreenchange', fullScreenChange, false);
                        document.body.requestFullscreen = (
                            document.body.requestFullscreen ||
                            document.body.mozRequestFullscreen ||
                            document.body.mozRequestFullScreen ||
                            document.body.webkitRequestFullscreen);
                        document.body.requestFullscreen();
                    }
                    else {
                        document.body.requestPointerLock();
                    }
                }, false);
            }//end pointerlock if stmt
        }//end setupPointerlock

        FindIntersections(boxes, position){
            const sphere = new THREE.Sphere(position, this.radius);
            return boxes.filter(b => {
                return sphere.intersectsBox(b);
            });
        }

        OnCycleTools(){
            const ui = this.FindEntity('ui').GetComponent('UIController');
            ui.CycleTool();
        }

        OnCycleTextures(directory){
            const ui = this.FindEntity('ui').GetComponent('UIController');
            ui.CycleBuildIcon(directory);
        }

        Update(timeInSeconds){
            const controlObject = this.controls.getObject();
            const demo = false;
            if(demo){
                controlObject.position.x += timeInSeconds * 5;
                controlObject.position.z += timeInSeconds * 5;
                this.Parent.SetPosition(controlObject.position);
                this.Parent.Position.x += 220;
                this.Parent.Position.z += 220;
                return;
            }

            if(this.keys.enter){
                this.Broadcast({topic: 'input.pressed', value:'enter'});
            }

            this.keys.enter = false;
            const velocity = this.velocity;
            const frameDeceleration = new THREE.Vector3(
                this.velocity.x * this.decceleration,
                this.decceleration.y,
                this.velocity.z * this.decceleration.z
            );

            frameDeceleration.multiplyScalar(timeInSeconds);
            frameDeceleration.z = Math.sign(frameDeceleration.z) * Math.min(Math.abs(frameDeceleration.z), Math.abs(velocity.z));

            if(GameDefs.skipGravity){
                frameDeceleration.y = Math.sign(frameDeceleration.y) * Math.min(Math.abs(frameDeceleration.y), Math.abs(velocity.y));
            }
//todo fix gravity and make it stronger so that im not bouncing around
            this.velocity.add(frameDeceleration);

            if(!GameDefs.skipGravity){
                this.velocity.y = Math.max(this.velocity.y, -50);
            }

            if(this.keys.forward){
                this.velocity.z -= this.acceleration.z * timeInSeconds;
            }
            if(this.keys.backward){
                this.velocity.z += this.acceleration.z * timeInSeconds;
            }

            if(this.keys.left){
                this.velocity.x -= this.acceleration.x * timeInSeconds;
            }
            if(this.keys.right){
                this.velocity.x += this.acceleration.x * timeInSeconds;
            }

        }



    }
    return{
        PlayerController: PlayerController
    }
})();