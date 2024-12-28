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

})();