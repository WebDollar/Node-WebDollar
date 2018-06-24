import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist'

const https = require('https');
const http = require('http');
const path = require('path')
const express = require('express')
const cors = require('cors');
const fs = require('fs')
import consts from 'consts/const_global'

import NodeAPIRouter from "../API-router/Node-API-Router"
import NODE_API_TYPE from "../API-router/NODE_API_TYPE";

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

                    NodeAPIRouter.initializeRouter( this.app.get, this._expressMiddleware, '/', NODE_API_TYPE.NODE_API_TYPE_HTTP );
                    NodeAPIRouter.initializeRouterCallbacks( this.app.get, this._expressMiddlewareCallback, '/', this.app, NODE_API_TYPE.NODE_API_TYPE_HTTP );

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



    amIFallback(){

        for (let i=0; i<NodesWaitlist.waitListFullNodes.length; i++)
            if (NodesWaitlist.waitListFullNodes[i].isFallback && NodesWaitlist.waitListFullNodes[i].sckAddresses[0].address === this.domain)
                return true;

        return false;

    }

    //this will process the params
    async _expressMiddleware(req, res, callback){

        try {
            for (let k in req)
                req[k] = decodeURIComponent(req[k]);

            let answer = await callback(req, res);
            res.json(answer);

        } catch (exception){
            res.json({result:false, message: exception.message});
        }

    }

    async _expressMiddlewareCallback(req, res, callback){

        try {
            for (let k in req)
                req[k] = decodeURIComponent(req[k]);

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
