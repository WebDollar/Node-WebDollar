import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'
import NODES_TYPE from "node/lists/types/Nodes-Type"

const https = require('https');
const http = require('http');
const path = require('path')
const express = require('express')
const cors = require('cors');
const fs = require('fs')
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import NodesList from 'node/lists/Nodes-List'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import BufferExtended from "common/utils/BufferExtended";
import Serialization from "common/utils/Serialization";
var BigNumber = require ('bignumber.js');

class NodeExpress{

    constructor(){

        this.loaded = false;
        this.app = undefined;

        this.SSL = false;
        this.port = 0;
        this.domain = '';

    }

    _extractDomain( fileName ){

        const x509 = require('x509');
        let subject = x509.getSubject( fileName );

        let domain = subject.commonName;

        if (domain === undefined) domain = '';

        domain = domain.replace( "*.", "" );

        return domain;
    }

    startExpress(){

        if (this.loaded) //already open
            return;

        return new Promise((resolve)=>{

            this.app = express();
            this.app.use(cors({ credentials: true }));


            try {
                this.app.use('/.well-known/acme-challenge', express.static('certificates/well-known/acme-challenge'))
            } catch (exception){

                console.error("Couldn't read the SSL certificates");

            }

            let options = {};

            this.port = process.env.SERVER_PORT || consts.SETTINGS.NODE.PORT;

            this.loaded = true;

            try {

                if (!consts.SETTINGS.NODE.SSL) throw {message: "no ssl"};

                this.domain = process.env.DOMAIN || this._extractDomain('./certificates/certificate.crt');

                console.info("========================================");
                console.info("SSL certificate found for ", this.domain);

                if (this.domain === '')
                    console.error("Your domain from certificate was not recognized");

                options.key = fs.readFileSync('./certificates/private.key', 'utf8');
                options.cert = fs.readFileSync('./certificates/certificate.crt', 'utf8');
                options.ca = fs.readFileSync('./certificates/ca_bundle.crt', 'utf8');

                this.server = https.createServer(options, this.app).listen( this.port, ()=>{

                    this.SSL = true;

                    this._initializeRouter();

                    console.info("========================================");
                    console.info("HTTPS Express was opened on port "+ this.port);
                    console.info("========================================");

                    resolve(true);

                }).on('error',  (err) => {

                    console.error("Error Creating HTTPS Express Server");
                    console.error(err);

                    throw err;

                });

            } catch (exception){

                //cloudflare generates its own SSL certificate
                this.server = http.createServer(this.app).listen(this.port, () => {

                    this.domain = 'my-ip';

                    console.info("========================================");
                    console.info(`Express started at localhost: ${this.port}`);
                    console.info("========================================");

                    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL + consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER;

                    this._initializeRouter();

                    resolve(true);

                }).on('error', (err) => {

                    this.domain = '';

                    console.error("Error Creating Express Server");
                    console.error(err);

                    resolve(false);

                });


            }

        })
    }

    _initializeRouter(){


        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/', (req, res) => {

            let lastBlock = Blockchain.blockchain.blocks.last;

            res.json({

                protocol: consts.SETTINGS.NODE.PROTOCOL,
                version: consts.SETTINGS.NODE.VERSION,
                blocks: {
                    length: Blockchain.blockchain.blocks.length,
                    lastBlockHash: lastBlock !== undefined ? Blockchain.blockchain.blocks.last.hash.toString("hex") : '',
                },
                networkHashRate: Blockchain.blockchain.blocks.networkHashRate,
                sockets:{
                    clients: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
                    servers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
                    webpeers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC),
                },
                waitlist:{
                    list: NodesWaitlist.getJSONList( NODES_TYPE.NODE_TERMINAL, false ),
                }

            });

        });

        // Return blocks information
        this.app.get('/blocks/:blocks', (req, res) => {

          try {
            let block_start = parseInt(decodeURIComponent(req.params.blocks))
            if (block_start < Blockchain.blockchain.blocks.length) {
              let blocks_to_send = []
              for (let i=block_start; i<Blockchain.blockchain.blocks.length; i++) {
                blocks_to_send.push(Blockchain.blockchain.blocks[i].toJSON())
              }
              res.send({result: true, blocks: blocks_to_send})
              return
            } else {
              throw ("block start is not correct: " + block_start)
            }
          } catch (exception) {
            res.send({result: false, message: exception.message});
            return;
          }
        })


        // Return block information
        this.app.get('/block/:block', (req, res) => {
          try {
            let block = parseInt(decodeURIComponent(req.params.block))
            if (block < Blockchain.blockchain.blocks.length) {
              res.send({result: true, block: Blockchain.blockchain.blocks[block].toJSON()})
              return
            } else {
              throw "Block not found."
            }
          } catch (exception) {
            res.send({result: false, message: "Invalid Block"});
            return;
          }
        })


        // Return address info: balance, blocks mined and transactions
        this.app.get('/address/:address', (req, res) => {

            let address = decodeURIComponent(req.params.address);

            try {
                address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
            } catch (exception){
                res.send({result: false, message: "Invalid Address"});
                return;
            }

            let answer = []
            let minedBlocks = []
            let balance = 0
            let last_block = Blockchain.blockchain.blocks.length

            // Get balance
            balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);
            balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

            // Get mined blocks and transactions
            for (let i=0; i<Blockchain.blockchain.blocks.length; i++) {

                for (let j = 0; j < Blockchain.blockchain.blocks[i].data.transactions.transactions.length; j++) {

                    let transaction = Blockchain.blockchain.blocks[i].data.transactions.transactions[j];

                    let found = false;
                    for (let q = 0; q < transaction.from.addresses.length; q++)
                        if (transaction.from.addresses[q].unencodedAddress.equals(address)) {
                            found = true;
                            break;
                        }

                    for (let q = 0; q < transaction.to.addresses.length; q++)
                        if (transaction.to.addresses[q].unencodedAddress.equals(address)) {
                            found = true;
                            break;
                        }

                    if (found) {
                        answer.push(
                            {
                                blockId: Blockchain.blockchain.blocks[i].height,
                                timestamp: Blockchain.blockchain.blocks[i].timeStamp + BlockchainGenesis.timeStamp,
                                transaction: transaction.toJSON()
                            });
                    }

                }
                if (Blockchain.blockchain.blocks[i].data.minerAddress.equals(address)) {
                    minedBlocks.push(
                        {
                            blockId: Blockchain.blockchain.blocks[i].height,
                            timestamp: Blockchain.blockchain.blocks[i].timeStamp + BlockchainGenesis.timeStamp,
                            transactions: Blockchain.blockchain.blocks[i].data.transactions.transactions.length
                        });
                }
            }


            res.send({result: true, last_block: last_block,
                      balance: balance, minedBlocks: minedBlocks,
                      transactions: answer
                     });

        });

        //Get Address
        //TODO: optimize or limit the number of requests
        this.app.get('/wallets/balance/:address', (req, res) => {

            let address = decodeURIComponent(req.params.address);
            let balance = Blockchain.blockchain.accountantTree.getBalance(address, undefined);

            balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

            res.json(balance);

        });

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/mining/balance', (req, res) => {

                let addressString = Blockchain.blockchain.mining.minerAddress;
                let balance = Blockchain.blockchain.accountantTree.getBalance(addressString, undefined);

                balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

                res.json(balance);

            });

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/import', async (req, res) => {

                let content = {
                    version: '0.1',
                    address: decodeURIComponent(req.query.address),
                    publicKey: req.query.publicKey,
                    privateKey: req.query.privateKey
                };

                try {

                    let answer = await Blockchain.Wallet.importAddressFromJSON(content);

                    if (answer.result === true) {
                        console.log("Address successfully imported", answer.address);
                        await Blockchain.Wallet.saveWallet();
                        res.json(true);
                    } else {
                        console.error(answer.message);
                        res.json(false);
                    }

                } catch(err) {
                    console.error(err.message);
                    res.json(false);
                }

            });

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/transactions', async (req, res) => {

              let from = decodeURIComponent(req.query.from);
              let to = decodeURIComponent(req.query.to);
              let amount = parseInt(req.query.amount) * WebDollarCoins.WEBD;
              let fee = parseInt(req.query.fee) * WebDollarCoins.WEBD;

              let result = await Blockchain.Transactions.wizard.createTransactionSimple(from, to, amount, fee);

              res.json(result);

            });

          this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/export', async (req, res) => {
              let addressString = Blockchain.blockchain.mining.minerAddress;
              let answer = await Blockchain.Wallet.exportAddressToJSON(addressString);

              if (answer.data) {
                res.json(answer.data);
              } else {
                res.json({});
              }
          });

        }

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/hello', (req, res) => {
            res.send('world');
        });

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/ping', (req, res) => {
            res.json( { ping: "pong" });
        });

        this.app.get('/blockHeight/:blockHeight', (req, res) => {
            let nBlockHeight = parseInt(decodeURIComponent(req.params.blockHeight));
            let oBlock       = Blockchain.blockchain.blocks[nBlockHeight];

            if (typeof oBlock === "undefined") {
                res.status(404).json({result: false, message: "Block not found or invalid block number"});
                return;
            }

            try {
                res.json({result: true, block: this._processBlock(oBlock)});
            }
            catch (e) {
                res.status(500).json({result: false, message: e.message});
            }
        })

        this.app.get('/blockHeights/:blockHeights', (req, res) => {
            let aBlockHeights = decodeURIComponent(req.params.blockHeights).split(',');

            // unique heights
            aBlockHeights = Array.from(new Set(aBlockHeights));

            if (aBlockHeights.length > 50) {
                res.status(500).json({result: false, message: 'Limit exceeded'});
                return;
            }

            let aBlocks = [], nBlockHeight, oBlock, i;

            for (i in aBlockHeights)
            {
                nBlockHeight = parseInt(aBlockHeights[i]);

                if (nBlockHeight > Blockchain.blockchain.blocks.length)
                {
                    continue;
                }

                oBlock = Blockchain.blockchain.blocks[nBlockHeight];

                if (typeof oBlock === "undefined") {
                    continue;
                }

                try {
                    aBlocks.push(this._processBlock(oBlock));
                }
                catch (e) {
                    res.status(500).json({result: false, message: e.message});
                    return;
                }
            }

            res.json({result: true, blocks: aBlocks});
        })

        this.app.get('/blocksStartingWithHeight/:startBlockHeight', (req, res) => {
            let aBlocks           = [], nBlockHeight, oBlock;
            let nStartBlockHeight = parseInt(decodeURIComponent(req.params.startBlockHeight));
            let nEndBlockHeight   = nStartBlockHeight + 50;

            for (nBlockHeight=nStartBlockHeight; nBlockHeight<=nEndBlockHeight; nBlockHeight++)
            {
                // break if currentBlockHeight is smaller than our desired height
                // or if the block cannot be retrieved at the desired height
                // so we can return consecutive blocks each time (even if the returned number is smaller than 50)

                if (nBlockHeight > Blockchain.blockchain.blocks.length)
                {
                    break;
                }

                oBlock = Blockchain.blockchain.blocks[nBlockHeight];

                if (typeof oBlock === "undefined")
                {
                    break;
                }

                try
                {
                    aBlocks.push(this._processBlock(oBlock));
                }
                catch (e)
                {
                    res.status(500).json({result: false, message: e.message});
                    return;
                }
            }

            res.json({result: true, blocks: aBlocks});
        })
    }

    amIFallback(){

        for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++)
            if (NodesWaitlist.waitListFullNodes[i].isFallback && NodesWaitlist.waitListFullNodes[i].sckAddresses[0].address === this.domain)
                return true;

        return false;

    }

    _processBlock (oBlock) {
        let transactions       = [], i;
        let nBlockTimestampRaw = Blockchain.blockchain.getTimeStamp(oBlock.height);
        let nBlockTimestamp    = nBlockTimestampRaw + BlockchainGenesis.timeStampOffset;
        let oBlockTimestampUTC = new Date(nBlockTimestamp * 1000);

        for (i=0; i < oBlock.data.transactions.transactions.length; i++)
        {
            let oTransaction = oBlock.data.transactions.transactions[i];
            let nInputSum    = oTransaction.from.calculateInputSum();
            let nOutputSum   = oTransaction.to.calculateOutputSum();

            let aTransaction = {
                trx_id         : oTransaction.txId.toString('hex'),
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
                timestamp_raw  : Blockchain.blockchain.getTimeStamp(oBlock.height),
                createdAtUTC   : oBlockTimestampUTC,
                block_id       : oBlock.height,
                from           : {trsx: [], addresses: [], amount: nInputSum  / WebDollarCoins.WEBD, amount_raw: nInputSum},
                to             : {trsx: [], addresses: [], amount: nOutputSum / WebDollarCoins.WEBD, amount_raw: nOutputSum},
            };

            oTransaction.from.addresses.forEach((oAddress) => {
                aTransaction.from.trsx.push({
                    trx_from_address   : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)),
                    trx_from_pub_key   : oAddress.publicKey.toString("hex"),
                    trx_from_signature : oAddress.signature.toString("hex"),
                    trx_from_amount    : oAddress.amount / WebDollarCoins.WEBD,
                    trx_from_amount_raw: oAddress.amount
                });

                aTransaction.from.addresses.push(BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)));
            });

            oTransaction.to.addresses.forEach((oAddress) => {
                aTransaction.to.trsx.push({
                    trx_to_address   : BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)),
                    trx_to_amount    : oAddress.amount / WebDollarCoins.WEBD,
                    trx_to_amount_raw: oAddress.amount
                });

                aTransaction.to.addresses.push(BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(oAddress.unencodedAddress)));
            });

            transactions.push(aTransaction);
        }

        return {
            _id            : oBlock.height,
            _rev           : '',
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
            trxs           : transactions,
            block_raw      : BufferExtended.toBase(oBlock.serializeBlock().toString('hex')),
            reward         : oBlock.reward === null ? 0 : oBlock.reward / WebDollarCoins.WEBD,
            reward_raw     : oBlock.reward === null ? 0 : oBlock.reward,
            createdAtUTC   : oBlockTimestampUTC
        };
    }
}

export default new NodeExpress();
