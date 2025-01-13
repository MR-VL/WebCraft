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

    class TextureAtlas {
        constructor(){
            this.Create();
            this.onLoad = () => {};
        }

        Load(atlas, names){
            this.LoadAtlas(atlas, names);
        }

        Create(){
            this.manager = new THREE.LoadingManager();
            this.loader = new THREE.TextureLoader(this.manager);
            this.textures = {};

            this.manager.onLoad = () => {
                this.onLoad();
            };
        }

        get Info(){
            return this.textures;
        }

        LoadTexture(name){
            const texture = this.loader.load(name);
            texture.encoding = THREE.sRGBEncoding;
            return texture;
        }

        OnLoad(){
            for(let k in this.textures){
                const atlas = this.textures[k];
                const data = new Uint8Array(atlas.textures.length * 4 * 16 * 16);

                for(let texture = 0; texture < atlas.textures.length; texture++) {
                    const currentTexture = atlas.textures[texture];
                    const currentData = GetImageData(currentTexture.image);
                    const offset = texture * (4 * 16 * 16);
                    data.set(currentData.data, offset);
                }

                const diffuse = new THREE.DataTexture2DArray(data, 16, 16, atlas.textures.length);
                diffuse.format = THREE.RGBAFormat;
                diffuse.type = THREE.UnsignedByteType;
                diffuse.minFilter = THREE.LinearMipMapLinearFilter;
                diffuse.magFilter = THREE.NearestFilter;
                diffuse.wrapS = THREE.ClampToEdgeWrapping;
                diffuse.wrapT = THREE.ClampToEdgeWrapping;
                diffuse.generateMipmaps = true;
                diffuse.encoding = THREE.sRGBEncoding;

                atlas.atlas = diffuse;
            }
            this.onLoad();
        }

        LoadAtlas(atlas, names){
            this.textures[atlas] = {
                textures: names.map(name => this.LoadTexture(name)),
                atlas: null
            };
        }

    }

    return{
        TextureAtlas: TextureAtlas
    };
})();