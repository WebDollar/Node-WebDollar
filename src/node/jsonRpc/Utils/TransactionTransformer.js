import BlockchainGenesis from './../../../common/blockchain/global/Blockchain-Genesis';
import WebDollarCoins from './../../../common/utils/coins/WebDollar-Coins';
import BufferExtended from './../../../common/utils/BufferExtended';
import InterfaceBlockchainAddressHelper from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

class TransactionTransformer
{
    /**
     * @param {InterfaceBlockchainTransaction} oTransaction
     * @param {InterfaceBlockchainBlock|null} oBlock
     * @param {int} i
     * @return Object
     */
    transform(oTransaction, oBlock = null, i) {
        const nInputSum  = oTransaction.from.calculateInputSum();
        const nOutputSum = oTransaction.to.calculateOutputSum();

        let aTransaction = {
            trx_id         : oTransaction.txId.toString('hex'),
            version        : oTransaction.version,
            nonce          : oTransaction.nonce,
            index          : i,
            time_lock      : oTransaction.timeLock,
            from_length    : oTransaction.from.addresses.length,
            to_length      : oTransaction.to.addresses.length,
            fee            : oTransaction.fee / WebDollarCoins.WEBD,
            fee_raw        : oTransaction.fee,
            timestamp      : null,
            timestamp_UTC  : null,
            timestamp_block: null,
            timestamp_raw  : null,
            createdAtUTC   : null,
            block_id       : null,
            from           : {trxs: [], addresses: [], amount: nInputSum  / WebDollarCoins.WEBD, amount_raw: nInputSum},
            to             : {trxs: [], addresses: [], amount: nOutputSum / WebDollarCoins.WEBD, amount_raw: nOutputSum},
            isConfirmed    : oTransaction.confirmed
        };

        if (oBlock !== null)
        {
            const nBlockTimestampRaw = oBlock.timeStamp;
            const nBlockTimestamp    = nBlockTimestampRaw + BlockchainGenesis.timeStampOffset;
            const oBlockTimestampUTC = new Date(nBlockTimestamp * 1000);

            aTransaction.timestamp       = oBlockTimestampUTC.toUTCString();
            aTransaction.timestamp_UTC   = nBlockTimestamp;
            aTransaction.timestamp_block = nBlockTimestampRaw;
            aTransaction.timestamp_raw   = nBlockTimestampRaw;
            aTransaction.createdAtUTC    = oBlockTimestampUTC;
            aTransaction.block_id        = oBlock.height;

        }

        oTransaction.from.addresses.forEach((oAddress) => {
            aTransaction.from.trxs.push({
                trx_from_address   : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)),
                trx_from_pub_key   : oAddress.publicKey.toString('hex'),
                trx_from_signature : oAddress.signature.toString('hex'),
                trx_from_amount    : oAddress.amount / WebDollarCoins.WEBD,
                trx_from_amount_raw: oAddress.amount
            });

            aTransaction.from.addresses.push(BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)));
        });

        oTransaction.to.addresses.forEach((oAddress) => {
            aTransaction.to.trxs.push({
                trx_to_address   : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)),
                trx_to_amount    : oAddress.amount / WebDollarCoins.WEBD,
                trx_to_amount_raw: oAddress.amount
            });

            aTransaction.to.addresses.push(BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)));
        });

        return aTransaction;
    }
}

export default TransactionTransformer;
