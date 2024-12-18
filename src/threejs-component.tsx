import * as three from 'three'

import {EffectComposer} from 'three/examples/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/examples/jsm/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {GammaCorrectionShader} from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import {FXAAShader} from 'three/examples/jsm/shaders/FXAAShader.js';

import {entity} from "./Entity.tsx";
import {definitions} from "./definitions.tsx";
import {defs} from "./defs.tsx";

export const threejs_component = (() => {

    const vs = ```
  varying vec3 vWorldPosition;
  
  void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
  
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }```;


    const fs = ```
  uniform vec3 topColor;
  uniform vec3 bottomColor;
  uniform vec3 playerPos;
  uniform float offset;
  uniform float exponent;
  uniform float whiteBlend;
  uniform float time;
  uniform samplerCube background;
  
  varying vec3 vWorldPosition;
  
  float sdPlane(vec3 p, vec3 n, float h) {
    // n must be normalized
    return dot(p, n) + h;
  }

  void main() {
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 stars = sRGBToLinear(textureCube(background, viewDirection)).xyz;
 
    float h = normalize(vWorldPosition + offset).y;
    float t = max(pow(max(h, 0.0), exponent), 0.0);
  
    float f = exp(min(0.0, -vWorldPosition.y * 0.0125));
  
    float heightMix = clamp((playerPos.y - 500.0) / 1000.0, 0.0, 1.0);
    heightMix = smoothstep(0.0, 1.0, heightMix);
    heightMix = smoothstep(0.0, 1.0, heightMix);

    float wrapFactor = playerPos.y / 500.0;
    float normalMix = clamp((viewDirection.y + wrapFactor) / (1.0 + wrapFactor), 0.0, 1.0);
    normalMix = pow(normalMix, 0.250);

    vec3 topMix = mix(topColor, stars, heightMix * normalMix);

    // Normal
    vec3 sky = mix(topMix, bottomColor, f);
    // Moon
    // vec3 sky = mix(stars, bottomColor, f);
    float skyMix = clamp(whiteBlend, 0.0, 1.0);
    sky = mix(bottomColor, sky, skyMix * skyMix);
    gl_FragColor = vec4(sky, 1.0);
    // gl_FragColor = vec4(vec3(normalMix * normalMix), 1.0);
  }```;

    class ThreeJSController extends entity().Component{
        static className = 'ThreeJSController';
        private threejs: any;


        get Name(){
            return ThreeJSController.className
        }

        constructor() {
            super();

        }

        InitEntity() {
            this.threejs = new three.WebGLRenderer({
                antialias: false;
            })
        }

    }
})();