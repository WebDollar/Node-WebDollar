import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceBlockchainAddressHelper from "common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper";

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

class NodeExpress{

    constructor(){

        this.loaded = false;
        this.app = undefined;
        this.https = undefined;

        this.SSL = false;

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

            let port = process.env.SERVER_PORT || consts.SETTINGS.NODE.PORT;

            this.loaded = true;

            try {

                if (!consts.SETTINGS.NODE.SSL) throw {message: "no ssl"};

                options.key = fs.readFileSync('./certificates/private.key', 'utf8');
                options.cert = fs.readFileSync('./certificates/certificate.crt', 'utf8');
                options.ca = fs.readFileSync('./certificates/ca_bundle.crt', 'utf8');

                this.server = https.createServer(options, this.app).listen(port, ()=>{

                    this.SSL = true;

                    this._initializeRouter();

                    console.info("========================================");
                    console.info("HTTPS Express was opened on port "+port);
                    console.info("========================================");

                    resolve(true);

                });

            } catch (exception){

                //cloudflare generates its own SSL certificate
                this.server = http.createServer(this.app).listen(port, ()=>{

                    console.info("========================================");
                    console.info(`Express started at localhost:${port}`);
                    console.info("========================================");

                    this._initializeRouter();

                    resolve(true);
                })


            }

        })
    }

    _initializeRouter(){


        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/', (req, res) => {

            res.json({

                protocol: 'WebDollar',
                version: consts.SETTINGS.NODE.VERSION,
                blocks: {
                    length: Blockchain.blockchain.blocks.length,
                    lastBlockHash: Blockchain.blockchain.blocks.last.hash.toString("hex"),
                },
                sockets:{
                    clients: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_CLIENT_SOCKET),
                    servers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_SERVER_SOCKET),
                    webpeers: NodesList.countNodesByConnectionType(CONNECTIONS_TYPE.CONNECTION_WEBRTC),
                }

            });

        });

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/address/:address', (req, res) => {

            let address = req.params.address;

            try {
                address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);
            } catch (exception){
                res.send({result: false, message: "Invalid Address"});
                return;
            }

            let answer = [];

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
                                timestamp: Blockchain.blockchain.blocks[i].timestamp + BlockchainGenesis.timestamp,
                                transaction: transaction.toJSON()
                            });
                    }

                }
            }


            res.send({result: true, transactions: answer});

        });

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/hello', (req, res) => {
            res.send('world');
        });

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/ping', (req, res) => {
            res.json( { ping: "pong" });
        });


    }

}

export default new NodeExpress();