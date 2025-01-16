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


    }
    return{
        PlayerController: PlayerController
    }
})();