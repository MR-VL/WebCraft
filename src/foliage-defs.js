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

    function sdSphere(position, radius){
        return position.length() - radius;
    }

    const tmp1 = new THREE.Vector3();

    //box
    const tmpB1 = new THREE.Box3;
    const tmpB2 = new THREE.Box3;
    const tmpB3 = new THREE.Box3;

    //sphere
    const tmpS1 = new THREE.Sphere();

    //quaternion defs
    const tmpQ = new THREE.Quaternion();
    const tmpQ1 = new THREE.Quaternion();
    const tmpQ2 = new THREE.Quaternion();

    //axis defs
    const XAxis = new THREE.Vector3(1,0,0);
    const YAxis = new THREE.Vector3(0,1,0);
    const ZAxis = new THREE.Vector3(0,0,1);
    const Origin = new THREE.Vector3(0,0,0);

    class SDF{
        constructor(position){
            this.sdfs = [];
            this.position = position.clone();
            this.aabb = new THREE.Box3(this.position.clone(), this.position.clone())
        }

        get AABB(){
            return this.aabb;
        }

        AddSphere(type, origin, radius){
            tmpS1.set(this.position.clone(), radius);
            tmpS1.translate(origin);
            tmpS1.getBoundingBox(tmpB1);

            this.aabb.union(tmpB1);
            const ori = origin.clone();

            this.sdfs.push((position) => {
                tmp1.copy(position);
                tmp1.sub(ori);
                tmp1.sub(this.position);

                if (sdSphere(tmp1, radius) < 0){
                    return type;
                }
                return null;
            });
        }

        AddCappedCone(type, offset, start, end, startRadius, endRadius){
            tmpS1.set(start.clone(), startRadius);
            tmpS1.getBoundingBox(tmpB2);
            tmpS1.set(end.clone(), endRadius);
            tmpS1.getBoundingBox(tmpB3);

            tmpB1.makeEmpty();
            tmpB2.union(tmpB2);
            tmpB1.union(tmpB3);
            tmpB1.translate(offset);
            tmpB1.translate(this.position);

            this.aabb.union(tmpB1);

            const startPos = start.clone();
            const endPos = end.clone();
            const offsetPos = offset.clone();

            this.sdfs.push((position) => {
                tmp1.copy(position);
                tmp1.sub(offsetPos);
                tmp1.sub(this.position)

                if(sdCappedCone(tmp1, startPos, endPos, startRadius, endRadius) < 0){
                    return type;
                }
                return null;
            })
        }

        Evaluate(position){
            for(let i = 0; i < this.sdfs.length; ++i){
                const result = this.sdfs[i](position);
                if (result){
                    return result;
                }
            }
            return null;
        }
    }

    const noiseFoliage = new noise.Noise({
        seed: 7,
        octaves: 1,
        scale: 1,
        persistence: 0.5,
        lacunarity: 2.0,
        exponentiation: 1,
        height: 1
    })

    function TREE1(xPos, yPos, zPos){
        // TODO dynamic generation of height and lean
        const height = 15;
        const lean = 5;
        const trunkEnd = new THREE.Vector3(lean, height, 0);
        const rootEnd1 = new THREE.Vector3(-6, 0, 1);
        const rootEnd2 = new THREE.Vector3(9, 0, -7);
        const rootEnd3 = new THREE.Vector3(8, 0, 6);

        // TODO dynamic gen leaves
        const leavesRadius = 4;
        const angle = noiseFoliage.Get(xPos, 9, zPos) * 2 * Math.PI;
        tmpQ.setFromAxisAngle(YAxis, angle);

        trunkEnd.applyQuaternion(tmpQ);
        rootEnd1.applyQuaternion(tmpQ);
        rootEnd2.applyQuaternion(tmpQ);
        rootEnd3.applyQuaternion(tmpQ);

        //TODO leaf pos

        const treeSDF = new SDF(new THREE.Vector3(xPos, yPos, zPos));
        treeSDF.AddCappedCone(
            'treeBark',
            new THREE.Vector3(),
            new THREE.Vector3(0, -2, 0),
            trunkEnd,
            3, 0.5
        );

        treeSDF.AddCappedCone(
            'treeBark',
            new THREE.Vector3(),
            new THREE.Vector3(0, 4, 0),
            rootEnd1,
            1, 1
        );

        treeSDF.AddCappedCone(
            'treeBark',
            new THREE.Vector3(),
            new THREE.Vector3(0, 4, 0),
            rootEnd2,
            2, 1
        );

        treeSDF.AddCappedCone(
            'treeBark',
            new THREE.Vector3(),
            new THREE.Vector3(0, 4, 0),
            rootEnd3,
            2, 1
        );

        treeSDF.AddSphere('treeLeaves', trunkEnd, leavesRadius);
        // todo more leaves per tree

        return treeSDF;
    }



    return {
        TREE1: TREE1
    }
})();