import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'

const https = require('https');
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');

import consts from 'consts/const_global'

import NodeAPIRouter from "../API-router/Node-API-Router"
import NODE_API_TYPE from "../API-router/NODE_API_TYPE";

import NodeServerSocketAPI from "../sockets/Node-Server-Socket-API"; //required because it will process the SocketAPI

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

    async startExpress(){

        if (this.loaded) //already open
            return true;

        let loading = new Promise((resolve)=>{

            this.app = express();
            this.app.use(cors({ credentials: true }));
            this.app.use(bodyParser.json());

            try {
                this.app.use('/.well-known/acme-challenge', express.static('certificates/well-known/acme-challenge'))
            } catch (exception){

                console.error("Couldn't read the SSL certificates");

            }

            let options = {};

            this.port = process.env.PORT || process.env.SERVER_PORT || consts.SETTINGS.NODE.PORT;

            try {

                if (!consts.SETTINGS.NODE.SSL) throw {message: "no ssl"};

                this.domain = process.env.DOMAIN;

                let privateKey='', privateKeys = ["private.key","privateKey","private.crt"];
                for (let i=0; i<privateKeys.length; i++)
                    if (fs.existsSync(`./certificates/${privateKeys[i]}`)){
                        privateKey = `./certificates/${privateKeys[i]}`;
                        break;
                    }

                let cert = '', certificates = ["certificate.crt", "crt.crt", "certificate"];
                for (let i=0; i<certificates.length; i++)
                    if (fs.existsSync(`./certificates/${certificates[i]}`)){
                        cert = `./certificates/${certificates[i]}`;
                        break;
                    }

                let caBundle = '', certificateBundles = ["ca_bundle.crt", "bundle.crt", "ca_bundle"];
                for (let i=0; i<certificateBundles.length; i++)
                    if (fs.existsSync(`./certificates/${certificateBundles[i]}`)){
                        caBundle = `./certificates/${certificateBundles[i]}`;
                        break;
                    }

                if (privateKey === '' && cert === '' && caBundle === '') throw {message: "HTTPS server couldn't be started. Starting HTTP"};
                if (privateKey === '') throw {message: "HTTPS server couldn't be started because certificate private.key was not found"};
                if (cert === '') throw {message: "HTTPS server couldn't be started because certificate certificate.crt was not found"};
                if (caBundle === '') throw {message: "HTTPS server couldn't be started because certificate ca_bundle.crt was not found"};

                try {
                    if (this.domain === undefined || this.domain === "undefined") this.domain = this._extractDomain(cert);
                } catch (exception){
                    console.error("Couldn't determine the SSL Certificate Host Name");
                }

                options.key = fs.readFileSync(privateKey, 'utf8');
                options.cert = fs.readFileSync(cert, 'utf8');
                options.caBundle = fs.readFileSync(caBundle, 'utf8');

                this.server = https.createServer(options, this.app).listen( this.port, ()=>{

                    console.info("========================================");
                    console.info("SSL certificate found for ", this.domain||'domain.com');

                    if (this.domain === '')
                        console.error("Your domain from certificate was not recognized");


                    this.SSL = true;

                    this._initializeRouter(this.app);

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

                console.error("HTTP Express raised an error", exception);

                //cloudflare generates its own SSL certificate
                this.server = http.createServer(this.app).listen(this.port, () => {

                    this.domain = 'my-ip';

                    console.info("========================================");
                    console.info(`Express started at localhost: ${this.port}`);
                    console.info("========================================");

                    consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL = consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_TERMINAL + consts.SETTINGS.PARAMS.CONNECTIONS.TERMINAL.SERVER.MAXIMUM_CONNECTIONS_FROM_BROWSER;

                    this._initializeRouter(this.app);

                    resolve(true);

                }).on('error', (err) => {

                    this.domain = '';

                    console.error("Error Creating Express Server");
                    console.error(err);

                    resolve(false);

                });


            }

        });

        if (await loading)
            this.loaded = true;
        else
            this.loaded = false;

        return loading;

    }

    _initializeRouter(app){


        NodeAPIRouter._routesEnabled = true;
        NodeAPIRouter.initializeRouter( this.app.all.bind(this.app), this._expressMiddleware, '/', NODE_API_TYPE.NODE_API_TYPE_HTTP );
        NodeAPIRouter.initializeRouterCallbacks( this.app.get.bind(this.app), this._expressMiddlewareCallback, '/', NODE_API_TYPE.NODE_API_TYPE_HTTP );
        NodeAPIRouter._routesEnabled = false;

    }


    amIFallback(){

        for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++)
            if (NodesWaitlist.waitListFullNodes[i].isFallback && NodesWaitlist.waitListFullNodes[i].sckAddresses[0].address === this.domain)
                return true;

        return false;

    }

    //this will process the params
    async _expressMiddleware(req, res, callback){

        try {
            for (let k in req.params)
                req.params[k] = decodeURIComponent(req.params[k]);

            let merged = req.body ? Object.assign(req.params, req.body) : req.params;

            let answer = await callback(merged, res);
            res.json(answer);

        } catch (exception){
            res.json({result:false, message: exception.message});
        }

    }

    async _expressMiddlewareCallback(req, res, callback){

        try {
            for (let k in req.params)
                req.params[k] = decodeURIComponent(req.params[k]);

            let url = req.url;

            if (typeof url !== "string") throw {message: "url not specified"};

            let answer = await callback(req, res, (data)=>{ this._notifyHTTPSubscriber(url, data) });
            res.json(answer);

        } catch (exception){
            res.json({result:false, message: exception.message});
        }

    }

    _notifyHTTPSubscriber(url, data){

        //TODO notify via http get/post via axios ?

    }

}

export default new NodeExpress();
