import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";

class InterfaceBlockchainBackboneMining extends InterfaceBlockchainMining {


    //backbone mining is the same with InterfaceBlockchainMining

    constructor(blockchain, minerAddress){

        super(blockchain, minerAddress);

        this.WORKER_NONCES_WORK = 200;

        this.block = undefined;
        this.undefined = undefined;
        this._workerResolve = undefined;
    }

    async mineNonces(){

        try {
            for (let i = 0; i < this.WORKER_NONCES_WORK; i++) {

                if (this._nonce > 0xFFFFFFFF || !this.started || this.reset) {
                    this._workerResolve({result: false});
                    return false;
                }

                let hash = await this.block.computeHash(this._nonce);

                //console.log('Mining WebDollar Argon2 - this._nonce', this._nonce, hash.toString("hex") );

                if (hash.compare(this.difficulty) <= 0) {

                    this._workerResolve({
                        result: true,
                        nonce: this._nonce,
                        hash: hash,
                    });

                    return;
                }

                this._nonce++;
                this._hashesPerSecond++;

            }

        } catch (exception){
            console.log("mineNonces returned error", exception);
            return false;
        }


        setTimeout( async () => { return await this.mineNonces() }, 10);

    }

    mine(block, difficultyTarget){

        this.block = block;
        this.difficulty = difficultyTarget;

        let promiseResolve = new Promise ( (resolve)=>{


            this._workerResolve = resolve;
            setTimeout(async () => {return await this.mineNonces() }, 10);


        } );

        return promiseResolve;

    }


}

export default InterfaceBlockchainBackboneMining