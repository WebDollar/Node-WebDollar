const https = require('https');
const path = require('path')
const express = require('express')
const cors = require('cors');
const fs = require('fs')
const resolve = file => path.resolve(__dirname, file)
const serve = (path, cache) => express.static(resolve(path), {
    maxAge: cache ? 1000 * 60 * 60 * 24 * 30 : 0
});

import consts from 'consts/const_global'

class NodeExpress{

    constructor(){

        this.loaded = false;
        this.app = undefined;
        this.https = undefined;

    }

    startExpress(){

        return new Promise((resolve)=>{

            this.app = express();
            this.app.use(cors({ credentials: true }));
            this.app.use('/.well-known/acme-challenge', serve('./certificates/well-known/acme-challenge', true) );

            let options = {};

            let port = process.env.SERVER_PORT || consts.SETTINGS.NODE.PORT;

            try {

                options.key = fs.readFileSync('./certificates/private.key', 'utf8');
                options.cert = fs.readFileSync('./certificates/certificate.crt', 'utf8');
                options.ca = fs.readFileSync('./certificates/ca_bundle.crt', 'utf8');

                this.https = https.createServer(options, this.app).listen(port, ()=>{

                    this._initializeRouter();

                    console.log("HTTPS Express was opened on port "+port);
                    resolve(true);

                });

            } catch (exception){

                //cloudflare generates its own SSL certificate
                this.app.listen(port, () => {
                    console.log(`server started at localhost:${port}`)
                    this._initializeRouter();
                });


            }

        })
    }

    _initializeRouter(){



        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/', (req, res) => {

            res.json({
                protocol: 'WebDollar',
                version: consts.SETTINGS.NODE.VERSION
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