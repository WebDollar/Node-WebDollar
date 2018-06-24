import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'

import NodeAPIPublic from "../API/Node-API-Public";
import NodeAPIPrivate from "./../API/Node-API-Private";

const https = require('https');
const http = require('http');
const path = require('path')
const express = require('express')
const cors = require('cors');
const fs = require('fs')
import consts from 'consts/const_global'


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
        this.app.get('/', (req, res) => this._expressMiddleware(req, res, NodeAPIPublic.info ));

        // Return blocks information
        this.app.get('/blocks/:blocks', (req, res) => this._expressMiddleware(req, res, NodeAPIPublic.blocks ));

        // Return block information
        this.app.get('/block/:block', (req, res) => this._expressMiddleware(req, res, NodeAPIPublic.block ));

        //Get Address
        //TODO: optimize or limit the number of requests

        // Return address info: balance, blocks mined and transactions
        this.app.get('/address/:address', (req, res) => this._expressMiddleware(req, res, NodeAPIPublic.addressInfo ));

        this.app.get('/wallets/balance/:address', (req, res) => this._expressMiddleware(req, res, NodeAPIPublic.addressBalance) );

        if (process.env.WALLET_SECRET_URL && typeof process.env.WALLET_SECRET_URL === "string" && process.env.WALLET_SECRET_URL.length >= 30) {

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/mining/balance', (req, res) => this._expressMiddleware(req, res, NodeAPIPrivate.minerBalance) );

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/import', (req, res) => this._expressMiddleware(req, res, NodeAPIPrivate.walletImport) );

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/create-transaction', (req, res) => this._expressMiddleware(req, res, NodeAPIPrivate.walletCreateTransaction) );

            this.app.get('/'+process.env.WALLET_SECRET_URL+'/wallets/export', (req, res) => this._expressMiddleware(req, res, NodeAPIPrivate.walletExport) );

        }

        // respond with "hello"
        this.app.get('/hello', (req, res) => {
            res.send('world');
        });

        // respond with "ping"
        this.app.get('/ping', (req, res) => {
            res.json( { ping: "pong" });
        });


    }

    amIFallback(){

        for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++)
            if (NodesWaitlist.waitListFullNodes[i].isFallback && NodesWaitlist.waitListFullNodes[i].sckAddresses[0].address === this.domain)
                return true;

        return false;

    }

    //this will process the params
    async _expressMiddleware(req, res, callback){

        for (let k in req)
            req[k] = decodeURIComponent(req[k]);

        let answer = await callback(req,res);
        res.json(answer);

    }

}

export default new NodeExpress();
