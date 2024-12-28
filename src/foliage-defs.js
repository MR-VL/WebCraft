import * as THREE from 'three';
import {noise} from "./noise.js";
import {math} from "./math.js";

export const foliageDefs = (() => {

    function sdCappedCone(p, a, b, ra, rb){
        const ba = b.clone().sub(a);
        const pa = p.clone().sub(a);
        const rba = rb -ra;
        const baba = ba.dot(ba);
        const papa = pa.dot(pa);
        const paba = pa.dot(ba);

        const x = Math.sqrt(papa - paba * paba * baba);
        const cax = Math.max(0.0, x - ((paba < 0.5) ? ra :rb));
        const cay = Math.abs(paba -0.5) - 0.5;
        const k = rba * rba + baba;
        const f = math.sat((rba * (x-ra) + paba * baba) / k);
        const cbx = x - ra -f * rba;
        const cby = paba - f;
        const s = (cbx < 0.0 && cay < 0.0) ? -1.0:1.0;
        return s * Math.sqrt(Math.min(cax*cax + cay * cay *baba,
                                        cbx * cbx + cby * cby * baba));

    }

    function sdCappedCylinder(p, a, b, r){
        const ba = b.clone().sub(a);
        const pa = p.clone().sub(a);
        const baba = ba.dot(ba);
        const papa = pa.dot(ba);
        const x = (pa.clone().multiplyScalar(baba).sub(ba.clone().multiplyScalar(paba))).length() - r * baba;
        const y = Math.abs(paba - baba * 0.5) - baba * 0.5;
        const x2 = x *x;
        const y2 = y*y;
        const d = (MAth.max(x,y) < 0.0) ? -Math.min(x2,y2): (((x>0.0)? x2:0.0) + ((y>0.0)? y2:0.0));
        return Math.sign(d) * Math.sqrt(Math.abs(d)) / baba;
    }

})();