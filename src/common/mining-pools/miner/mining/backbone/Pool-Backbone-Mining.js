import InterfaceBlockchainBackboneMining from "common/blockchain/interface-blockchain/mining/backbone/Interface-Blockchain-Backbone-Mining";
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from "consts/const_global";

class PoolBackboneMining extends InterfaceBlockchainBackboneMining {


    constructor(){

        super(undefined, undefined, 0);
        this.work = undefined;

    }

    async mineNonces(){

        if (this.work === undefined) return {
            result: false,
            bestHash: new Buffer(32),
            bestHashNonce: -1,
        };

        let start = this.work.start || 0;
        let end = this.work.end || 0xFFFFFFFF;

        if (start > end) return {
            result: false,
            bestHash: new Buffer(32),
            bestHashNonce: -1,
        };


        let bestHash = undefined;
        let bestHashNonce = undefined;

        try {

            for (let i = start; i < end; i++) {

                if (this._nonce > 0xFFFFFFFF || !this.started ) {
                    return {
                        result:false,
                        bestHash: bestHash,
                        bestHashNonce: bestHashNonce,
                    }
                }

                let hash = await InterfaceBlockchainBlock.computeHashStatic(this.work.block, i);

                if ( bestHash === undefined || hash.compare(bestHash) < 0 ){

                    bestHash = hash;
                    bestHashNonce = i;

                    if (bestHash.compare(this.work.difficultyTarget) <= 0) {

                        return {
                            result: true,
                            bestHash: bestHash,
                            bestHashNonce: bestHashNonce,
                        }

                    }

                }

                this._hashesPerSecond++;

            }

            return {
                result:false,
                bestHash: bestHash,
                bestHashNonce: bestHashNonce,
            }

        } catch (exception){
            console.error("poolMining returned error", exception);
            return false;
        }

    }

    /**
     *
     * @param blockData contains only the data needed for mining.
     * @param difficultyTarget
     * @returns {Promise<any>}
     */
    mine(work){

        this.started = true;
        this.work = work;

        return this.mineNonces( );

    }
}

export default PoolBackboneMining;