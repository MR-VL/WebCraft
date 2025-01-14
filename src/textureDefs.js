import * as THREE from 'three';

export const textureDefs = (() => {
    return{
        DEFS:{
            ocean:{
                color: new THREE.Color(0xffffff),
                texture: 'ocean.png'
            },
            dirt:{
                color: new THREE.Color(0xffffff),
                texture: 'dirt.png'
            },
            sand:{
                color: new THREE.Color(0xffffff),
                texture: 'sand.png'
            },
            stone:{
                color: new THREE.Color(0xffffff),
                texture: 'stone.png'
            },
            treeBark:{
                color: new THREE.Color(0xffffff),
                texture: 'treeBark.png'
            },
            treeLeaves:{
                color: new THREE.Color(0xffffff),
                texture: 'treeLeaves.png'
            },

        }
    }
})();