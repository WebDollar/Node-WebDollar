import { authenticatedMethod, RpcMethod } from './../../../../jsonRpc';
import BlockchainGenesis from '../../../../common/blockchain/global/Blockchain-Genesis';
/**
 * The status of node mining.
 */
class GetMiningStatus extends RpcMethod
{
    constructor(name, oMining) {
        super(name);
        this._oMining = oMining;
    }

    getHandler(args) {
        const nCurrentBlockHeight = this._oMining.blockchain.blocks.last.height;
        const bIsPOS              = BlockchainGenesis.isPoSActivated(nCurrentBlockHeight + 1);
        return {
            isMining: this._oMining.started,
            miningAddress: this._oMining.minerAddress,
            hashRate: this._oMining._intervalPerMinute ? this._oMining._hashesPerSecond / 30 : this._oMining._hashesPerSecond,
            nextBlockHeight: nCurrentBlockHeight + 1,
            nextRoundIsPOS: bIsPOS,
            nextRoundIsPOW: bIsPOS === false,
            nextRoundType: bIsPOS ? 1 : 0,
        };
    }
}

export default authenticatedMethod(GetMiningStatus);
