 import * as THREE from "three";
import {PointerLockControls} from "three/examples/jsm/controls/PointerLockControls.js";
import {entity} from "./Entity.js";
import {GameDefs} from "./Game-defs.js";

export const playerController = (() => {

    return{
        PlayerController: PlayerController
    }
})();