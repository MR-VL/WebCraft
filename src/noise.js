import SimplexNoise from 'SimplexNoise';

export const noise = (function(){

    class noiseGenerator{
        constructor(params){
            this.params = params;
            this.init();
        }

        init(){
            this.noise = new SimplexNoise(this.params.seed);
        }

        Get(x, y, z){
            const G = 2.0 ** (-this.params.persistence);
            const xs = x / this.params.scale;


        }
    }
    return{
        Noise: noiseGenerator
    }

})();