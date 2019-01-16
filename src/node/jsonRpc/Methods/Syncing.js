import {RpcMethod} from './../../../jsonRpc';
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

/**
 * Returns an object with data about the sync status.
 */
class Syncing extends RpcMethod
{
    constructor(name, oBlockchain) {
        super(name);

        this._oBlockchain = oBlockchain;
    }

    getHandler(args) {
        let isSynchronized = false;
        let nSecondsBehind = 0;
        let lastBlock      = this._oBlockchain.blocks.last;

        if (!(typeof lastBlock === 'undefined' || lastBlock === null))
        {
            const currentTimestamp = new Date().getTime();
            const oDate            = new Date((lastBlock.timeStamp + BlockchainGenesis.timeStampOffset) * 1000);
            const UNSYNC_THRESHOLD = 600 * 1000; // ~ 15 blocks

            nSecondsBehind = currentTimestamp - oDate.getTime();

            if (nSecondsBehind < UNSYNC_THRESHOLD)
            {
                isSynchronized = true;
            }
        }

        return {
            currentBlock  : this._oBlockchain.blocks.length,
            isSynchronized: isSynchronized,
            secondsBehind : nSecondsBehind < 0 ? 0 : nSecondsBehind / 1000,
        };
    }
}

export default Syncing;
