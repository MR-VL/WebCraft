import * as three from 'three'

export const defs = (() => {

    return {
        fogRange: [100,300],
        underWaterRange: [0,50],
        fogColor: new three.Color(0xbad2ed).convertSRGBToLinear(),
        moonColor: new three.Color(0xfaffd0).convertSRGBToLinear(),
        underWaterColor: new three.Color(0x327de0).convertSRGBToLinear(),
        skyColor: new three.Color(0xb3dbfb).convertSRGBToLinear(),
        playerPOS: [0,20,0],
        playerROT: [0,0,0]
    }

})();