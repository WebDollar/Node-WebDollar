const btoa = require('btoa');
import BufferExtended from "common/utils/BufferExtended";
import Serialization from "common/utils/Serialization";
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import BlockDataHardForksProcessor from './BlockDataHardForksProcessor'

class JsonRpcServer
{
    constructor(expressApp, Blockchain, config) {
        this._expressApp  = expressApp;
        this._oBlockchain = Blockchain;
        this._config      = config || {};
        this._methods     = new Map();


        //@TODO SUpport for multiple users with different permissions
        if (process.env.JSON_RPC_USERNAME !== '' && process.env.JSON_RPC_PASSWORD !== '')
        {
            this._config.auth = {username: process.env.JSON_RPC_USERNAME, password: process.env.JSON_RPC_PASSWORD}
        }

        this.initMethods();
        this._expressApp.post('/json-rpc', this._processRequest.bind(this))
    }

    initMethods() {
        this._addMethod('accounts', true);
        this._addMethod('blockNumber');
        this._addMethod('getBalance');
        this._addMethod('getBlockTransactionCountByNumber');
        this._addMethod('sendTransaction', true);
        this._addMethod('getBlockByNumber');

        // this._addMethod('createAccount', true);
    }

    _addMethod(method, requiresAuthentication = false) {
        // maybe add a check to see if the server is started on localhost and enable some methods (security)
        this._methods.set(method, {
            name                  : '_' + method,
            requiresAuthentication: requiresAuthentication
        })
    }

    async _accounts() {
        const self = this;

        return this._oBlockchain.Wallet.addresses.map((oAddress) => {
            const balance_raw = self._oBlockchain.blockchain.accountantTree.getBalance(oAddress.address, undefined);

            return {
                address: oAddress.address,
                balance: balance_raw === null ? 0 : (balance_raw / WebDollarCoins.WEBD),
                balance_raw: balance_raw || 0
            }
        });
    }

    async _blockNumber() {
        return this._oBlockchain.blockchain.blocks.last.height;
    }

    async _getBalance(options) {
        if (typeof options.address === 'undefined')
        {
            throw {message: 'Address is not defined'};
        }

        return this._oBlockchain.blockchain.accountantTree.getBalance(options.address, undefined) || 0;
    }

    async _getBlockTransactionCountByNumber(options) {
        return this._findBlockByNumber(options.blockNumber || 'latest').data.transactions.transactions.length;
    }

    async _sendTransaction(options) {
        let fromAddress = options.from;
        let toAddress   = options.to;

        if (typeof options.from !== 'string')
        {
            throw {message: "From address is invalid. Only string value is supported."}
        }

        if (typeof options.to !== 'string')
        {
            throw {message: "To address is invalid. Only string value is supported."}
        }

        if (typeof options.amount !== 'number' || options.amount < 0)
        {
            throw {message: "Amount is invalid. Only numerical values are supported."}
        }

        if (typeof options.fee !== 'undefined' && typeof options.fee !== 'number')
        {
            throw {message: "Fee is invalid. Only numerical values are supported."}
        }

        //@FIXME doesn`t work as expected
        let oTransaction = await this._oBlockchain.Transactions.wizard.createTransactionSimple( fromAddress, toAddress, options.amount, options.fee, undefined, options.password)

        if (!oTransaction.result)
        {
            throw {message: "Transaction not accepted. " + oTransaction.message};
        }
    }

    async _getBlockByNumber(options) {
        const mBlockNumber         = options.blockNumber || 'latest';
        const bIncludeTransactions = options.includeTransactions || false;
        const bPretty              = options.pretty || false;
        const bProcessHardForks    = options.hardForks || true;

        try
        {
            const oBlock = this._findBlockByNumber(mBlockNumber);
            return bPretty ? this._blockToObj(oBlock, bIncludeTransactions, bProcessHardForks) : oBlock.toJSON();
        }
        catch (exception)
        {
            throw {message: "Invalid Block"};
        }

    }

    _findBlockByNumber(mBlockNumber) {
        switch(mBlockNumber)
        {
            case 'latest':
                mBlockNumber = this._oBlockchain.blockchain.blocks.last.height
                break;
            case 'earliest':
                mBlockNumber = 0;
                break;
        }

        if (Number.isInteger(mBlockNumber) === false)
        {
            throw {message: 'Invalid block number'};
        }

        if (mBlockNumber < this._oBlockchain.blockchain.blocksStartingPoint)
        {
            throw {message: "Invalid block number"};
        }

        if (mBlockNumber > this._oBlockchain.blockchain.blocks.length)
        {
            throw {message: "Block not found."};
        }

        try
        {
            return this._oBlockchain.blockchain.blocks[mBlockNumber];
        }
        catch (exception)
        {
            throw {message: "Invalid Block"};
        }
    }

    _blockToObj(oBlock, bIncludeTransactions = false, bProcessHardForks = true) {
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
            trxs           : bIncludeTransactions
                ? oBlock.data.transactions.transactions.map((tx, i) => this._transactionToObj(tx, oBlock, i))
                : oBlock.data.transactions.transactions.map((tx) => tx.txId.toString('hex')),
            reward         : oBlock.reward === null ? 0 : oBlock.reward / WebDollarCoins.WEBD,
            reward_raw     : oBlock.reward === null ? 0 : oBlock.reward,
            createdAtUTC   : oBlockTimestampUTC,
            block_raw      : BufferExtended.toBase(oBlock.serializeBlock().toString('hex')),
        };

        if (bProcessHardForks)
        {
            BlockDataHardForksProcessor.processBlockData(oBlockData, bIncludeTransactions);
        }

        return oBlockData;
    }

    _transactionToObj(oTransaction, oBlock, i) {
        const nBlockTimestampRaw = oBlock.timeStamp;
        const nBlockTimestamp    = nBlockTimestampRaw + BlockchainGenesis.timeStampOffset;
        const oBlockTimestampUTC = new Date(nBlockTimestamp * 1000);

        const nInputSum  = oTransaction.from.calculateInputSum();
        const nOutputSum = oTransaction.to.calculateOutputSum();

        let aTransaction = {
            trx_id         : oTransaction.txId.toString("hex"),
            version        : oTransaction.version,
            nonce          : oTransaction.nonce,
            time_lock      : oTransaction.timeLock,
            from_length    : oTransaction.from.addresses.length,
            to_length      : oTransaction.to.addresses.length,
            fee            : oTransaction.fee / WebDollarCoins.WEBD,
            fee_raw        : oTransaction.fee,
            timestamp      : oBlockTimestampUTC.toUTCString(),
            timestamp_UTC  : nBlockTimestamp,
            timestamp_block: nBlockTimestampRaw,
            timestamp_raw  : nBlockTimestampRaw,
            createdAtUTC   : oBlockTimestampUTC,
            block_id       : oBlock.height,
            from           : {trxs: [], addresses: [], amount: nInputSum  / WebDollarCoins.WEBD, amount_raw: nInputSum},
            to             : {trxs: [], addresses: [], amount: nOutputSum / WebDollarCoins.WEBD, amount_raw: nOutputSum},
        };

        oTransaction.from.addresses.forEach((oAddress) => {
            aTransaction.from.trxs.push({
                trx_from_address   : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)),
                trx_from_pub_key   : oAddress.publicKey.toString("hex"),
                trx_from_signature : oAddress.signature.toString("hex"),
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

    _processRequest(req, res, next) {
        let aBody = [];
        let self  = this;

        req.on('data', chunk => {
            aBody.push(chunk);
        });

        req.on('end', async () => {
            try {
                aBody = JSON.parse(Buffer.concat(aBody).toString());
            }
            catch (e)
            {
                aBody = null;
            }

            if (!aBody)
            {
                res.status(400).json({
                    'jsonrpc': '2.0',
                    'error'  : {'code': -32700, 'message': 'Parse error.'},
                    'id'     : null
                });
                return;
            }

            if (aBody.jsonrpc !== '2.0' || !aBody.method)
            {
                res.status(400).json({
                    'jsonrpc': '2.0',
                    'error'  : {'code': -32600, 'message': 'Invalid Request.'},
                    'id'     : aBody.id
                });
                return;
            }

            if (this._methods.has(aBody.method) === false)
            {
                res.status(400).json({
                    'jsonrpc': '2.0',
                    'error'  : {'code': -32601, 'message': 'Method not found.'},
                    'id'     : aBody.id
                });
                return;
            }

            let oAuth = self._config.auth;

            if (typeof oAuth !== 'undefined' || self._methods.get(aBody.method).requiresAuthentication)
            {
                if (typeof oAuth === 'undefined' || (oAuth.username && oAuth.password && req.headers.authorization !== `Basic ${btoa(`${oAuth.username}:${oAuth.password}`)}`))
                {
                    res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Use user-defined username and password to access the JSON-RPC API." charset="UTF-8"'});
                    res.end();
                    return false;
                }
            }

            let response;
            try
            {
                const sMethodName    = self._methods.get(aBody.method).name;
                const methodResponse = await self[sMethodName].apply(self, [aBody.params || {}]);

                response = {'jsonrpc': '2.0', 'result': methodResponse, 'id': aBody.id};
            }
            catch (e)
            {
                response = {
                    'jsonrpc': '2.0',
                    'error'  : {'code': e.code || 1, 'message': e.message || e.toString()},
                    'id'     : aBody.id
                };
            }

            res.status(200).json(response);
        });
    }
}

export default JsonRpcServer;
