const https = require('https');
const http = require('http');
const path = require('path')
const express = require('express')
const cors = require('cors');
const fs = require('fs')
import consts from 'consts/const_global'
import Blockchain from "main-blockchain/Blockchain"
import CONNECTIONS_TYPE from "node/lists/types/Connections-Type"
import NodesList from 'node/lists/nodes-list'

class NodeExpress{

    constructor(){

        this.loaded = false;
        this.app = undefined;
        this.https = undefined;

        this.SSL = false;

    }

    startExpress(){

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

            try {

                if (!consts.SETTINGS.NODE.SSL) throw {message: "no ssl"};

                options.key = fs.readFileSync('./certificates/private.key', 'utf8');
                options.cert = fs.readFileSync('./certificates/certificate.crt', 'utf8');
                options.ca = fs.readFileSync('./certificates/ca_bundle.crt', 'utf8');

                this.server = https.createServer(options, this.app).listen(port, ()=>{

                    this.SSL = true;

                    this._initializeRouter();

                    console.log("HTTPS Express was opened on port "+port);
                    resolve(true);

                });

            } catch (exception){

                //cloudflare generates its own SSL certificate
                this.server = http.createServer(this.app).listen(port, ()=>{

                    console.log(`server started at localhost:${port}`);

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