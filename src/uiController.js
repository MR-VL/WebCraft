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
                ent.style = "background-image: url('./resources/Blocks/" + textureName + "');";
                ent.blockType = block;

                this.iconbar.appendChild(ent);
                this.icons.push(ent);
            }

            this.toolTypes = ['build', 'break'];
            this.toolIndex = 0;
            this.iconIndex = 0;
            this.icons[0].classList.toggle('highlight');
            this.UpdateToolBlockType();
            this.UpdateToolType();

            if(!GameDefs.showTools){
                this.iconbar.style.display = 'none';
            }
        }

        CycleBuildIcon(direction){
            this.icons[this.iconIndex].classList.remove('highlight');
            this.iconIndex = (this.iconIndex + this.icons.length + direction) % this.icons.length;
            this.UpdateToolBlockType();
        }

        CycleTool(){
            this.toolIndex = (this.toolIndex + 1) % this.toolTypes.length;
            this.UpdateToolType();
        }

        UpdateToolBlockType(){
            const player = this.FindEntity('player');
            player.BroadCast({
                topic: 'ui.blockChanged',
                value: this.icons[this.iconIndex].blockType
            });
        }

        UpdateToolType(){
            const player = this.FindEntity('player');
            player.BroadCast({
                topic: 'ui.toolChanged',
                value: this.toolTypes[this.toolIndex]
            });
        }
    }

    return{
        UIController:UIController
    }
})();
