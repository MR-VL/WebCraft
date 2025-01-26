import {entity} from "./Entity.js";
import {textureDefs} from "./textureDefs.js";
import {GameDefs} from "./Game-Defs.js";

export const uiController = (() => {
    class UIController extends entity.Component{
        static className = "UIController";

        get Name(){
            return UIController.className;
        }

        constructor() {
            super();
        }

        InitEntity(){
            this.iconbar = document.getElementById('icon-bar');
            this.icons = [];

            const blockTypes = [
                'dirt', 'stone', 'sand', 'grass', 'snow', 'moon', 'tree_bark', 'tree_leaves'
            ];

            for(let block of blockTypes){
                const ent = document.createElement('DIV');
                let textureName = textureDefs.DEFS[block].texture;
                if(textureName instanceof Array){
                    textureName = textureName[2];
                }

                ent.className = 'icon-bar-item';

            }
        }
    }

    return{
        UIController:UIController
    }
})();
