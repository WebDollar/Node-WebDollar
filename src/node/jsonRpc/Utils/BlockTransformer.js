import BlockchainGenesis from './../../../common/blockchain/global/Blockchain-Genesis';
import Serialization from './../../../common/utils/Serialization';
import InterfaceBlockchainAddressHelper from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';
import BufferExtended from './../../../common/utils/BufferExtended';
import WebDollarCoins from './../../../common/utils/coins/WebDollar-Coins';

class BlockTransformer
{
    constructor(oBlockDataHardForkProcessor, oTransactionTransformer) {
        this._oBlockDataHardForksProcessor = oBlockDataHardForkProcessor;
        this._oTransactionTransformer      = oTransactionTransformer;
    }

    transform(oBlock, oOptions) {
        let nBlockTimestampRaw = oBlock.timeStamp;
        let nBlockTimestamp    = nBlockTimestampRaw + BlockchainGenesis.timeStampOffset;
        let oBlockTimestampUTC = new Date(nBlockTimestamp * 1000);

        let oBlockData = {
            id             : oBlock.height,
            block_id       : oBlock.height,
            hash           : oBlock.hash.toString('hex'),
            nonce          : Serialization.deserializeNumber4Bytes_Positive(Serialization.serializeNumber4Bytes(oBlock.nonce)),
            nonce_raw      : oBlock.nonce,
            version        : oBlock.version,
            previous_hash  : oBlock.hashPrev.toString('hex'),
            timestamp      : oBlockTimestampUTC.toUTCString(),
            timestamp_UTC  : nBlockTimestamp,
            timestamp_block: nBlockTimestampRaw,
            hash_data      : oBlock.data.hashData.toString('hex'),
            miner_address  : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oBlock.data._minerAddress)),
            trxs_hash_data : oBlock.data.transactions.hashTransactions.toString('hex'),
            trxs_number    : oBlock.data.transactions.transactions.length,
            trxs           : oOptions.includeTransactions
                ? oBlock.data.transactions.transactions.map((tx, i) => this._oTransactionTransformer.transform(tx, oBlock, i))
                : oBlock.data.transactions.transactions.map((tx) => tx.txId.toString('hex')),
            reward         : oBlock.reward === null ? 0 : oBlock.reward / WebDollarCoins.WEBD,
            reward_raw     : oBlock.reward === null ? 0 : oBlock.reward,
            createdAtUTC   : oBlockTimestampUTC,
            block_raw      : BufferExtended.toBase(oBlock.serializeBlock().toString('hex')),
        };

        if (oOptions.processHardForks)
        {
            this._oBlockDataHardForksProcessor.processBlockData(oBlockData, oOptions.includeTransactions);
        }

        return oBlockData;
    }


}

export default BlockTransformer;
