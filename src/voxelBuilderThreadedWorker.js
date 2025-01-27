import {voxelBlockBuilder} from "./voxelBlockBuilder.js";

const Block = new voxelBlockBuilder.VoxelBlockBuilder();
self.onmessage = (message) => {
    if(message.data.subject === 'build_chunk'){
        Block.Init(message.data.params);
        const rebuiltData = Block.Rebuild();
        const buffers =[];
        for(let k in rebuiltData.opaque){
            buffers.push(rebuiltData.opaque[k].buffer);
        }
        for (let k in rebuiltData.transparent) {
            buffers.push(rebuiltData.transparent[k].buffer);
        }
        self.postMessage({subject: 'build_chunk_result', data: rebuiltData}, buffers);
    }
}

export const voxel_builder_threaded_worker = (() => {})();