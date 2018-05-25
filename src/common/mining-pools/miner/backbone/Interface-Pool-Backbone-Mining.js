import InterfaceBlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Interface-Blockchain-Backbone-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class InterfacePoolBackboneMining extends InterfaceBlockchainBackboneMining {


    constructor(miningFeeThreshold){

        super(undefined, undefined, miningFeeThreshold);

        this.WORKER_NONCES_WORK = 200;

        this.undefined = undefined;
        this._workerResolve = undefined;
        //TODO: _workerResolve sends data to pool leader?
    }

    async mineNonces(){

        try {
            for (let i = 0; i < this.WORKER_NONCES_WORK; i++) {

                if (this._nonce > 0xFFFFFFFF || !this.started || this.reset) {
                    console.log("heh");
                    this._workerResolve({result: false});
                    return false;
                }

                let hash = await InterfaceBlockchainBlock.computeHashStatic(this._nonce, this.blockData.height, this.blockData.difficultyTargetPrev,
                    this.blockData.computedBlockPrefix, this.blockData.nonce);

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

    /**
     *
     * @param blockData contains only the data needed for mining.
     * @param difficultyTarget
     * @returns {Promise<any>}
     */
    mine(blockData, difficultyTarget){

        this.difficulty = difficultyTarget;
        this.blockData = blockData;
        this.started = true;
        
        let promiseResolve = new Promise ( (resolve) => {


            this._workerResolve = resolve;
            setTimeout(async () => {return await this.mineNonces() }, 10);


        } );

        return promiseResolve;

    }
}

export default InterfacePoolBackboneMining;