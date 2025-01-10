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

    class WorkerPool{
        constructor(size){
            this.workers = [...Array(size)].map(_ => new WorkerThread());
            this.free = [...this.workers];
            this.busy = {};
            this.queue = [];
        }

        get length(){
            return this.workers.length;
        }

        get Busy(){
            return this.queue.length > 0 || Object.keys(this.busy).length >0;
        }

        enqueue(workItem, resolve){
            this.queue.push([workItem, resolve]);
            this.pumpQueue();
        }

        pumpQueue(){
            while(this.free.length>0 && this.queue.length > 0){
                const current = this.free.pop();
                this.busy[current.id] = current;

                const [workItem, workResolve] = this.queue.shift();

                current.postMessage(workItem, (version) => {
                    delete this.busy[current.id];
                    this.free.push(current);
                    workResolve(version);
                    this.pumpQueue();
                });
            }
        }
    }

    return{
        WorkerPool: WorkerPool
    };
})();