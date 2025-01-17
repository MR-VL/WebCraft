import * as THREE from 'three';
import{entity} from "./Entity.js";
import{GameDefs} from "./Game-defs.js";
import{math} from "./Math.js";
import{voxelShader} from "./voxelShader.js";

export const cloudController = (function(){
    class CloudController extends entity.Component{

    }


    return {
        CloudController:CloudController
    };
})();