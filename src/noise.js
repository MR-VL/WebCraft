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
            const ys = y / this.params.scale;
            const zs = z / this.params.scale;
            const noiseFunction = this.noise;


            let amplitude = 1.0;
            let frequency = 1.0;
            let normalization = 1.0;
            let total = 0;

            for (let i = 0; i<this.params.octaves; i++){
                let noiseValue = noiseFunction.noise3d(xs * frequency, ys*frequency, zs * frequency);

                total += noiseValue * amplitude;
                normalization += amplitude;
                amplitude *= G;
                frequency *= this.params.lacunarity;
            }

            total /= normalization;

            if(this.params.ridged){
                total = 1.0 - Math.abs(total);
            }
            else{
                total = total * 0.5 + 0.5;
            }

            total = Math.pow(total, this.params.exponentiation);

            if(this.params.range){
                const range = this.params.range;
                total = range[0] + (range[1]-range[0]) * total;
            }

            return total * this.params.height;
        }
    }
    return{
        Noise: noiseGenerator
    }

})();