import * as THREE from "three";

export const textures = (() => {

    function GetImageData(image){
        var canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        var context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, image.width, image.height);
    }

    class Texture {
        constructor(){
            this.Create();
            this.onLoad = () => {};
        }

        Load(atlas, names){

        }
    }


    return{
        TextureAtlas: TextureAtlas
    };
})();