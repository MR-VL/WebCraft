export const workerPool = (() => {
    let ids = 0;

    class WorkerThread{
        constructor(){
            this.worker = new Worker(new URL('/src/voxel-builder-threaded-worker.js', import.meta.url), {type: 'module'});
            this.worker.onmessage = (event) => {
                this.OnMessage(event);
            };
            this.resolve = null;
            this.id = ids++;
        }

        OnMessage(event){
            const resolve = this.resolve;
            this.resolve = null;
            resolve(event.data);
        }

        get id(){
            return this.id;
        }

        postMessage(message, resolve){
            this.resolve = resolve;
            this.worker.postMessage(message);
        }
    }

    return{
        WorkerPool: WorkerPool
    };
})();