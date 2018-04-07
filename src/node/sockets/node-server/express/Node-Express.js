const https = require('https');
const express = require('express')
const cors = require('cors');
const fs = require('fs')

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

            var options = {
                key: fs.readFileSync('./certificates/private.key', 'utf8'),
                cert: fs.readFileSync('./certificates/certificate.crt', 'utf8'),
                ca: fs.readFileSync('./certificates/ca_bundle.crt', 'utf8')
            };

            let port = process.env.SERVER_PORT || consts.SETTINGS.NODE.PORT;

            this.https = https.createServer(options, this.app).listen(port, ()=>{

                this._initializeRouter();

                console.log("HTTPS Express was opened on port "+port)
                resolve(true);

            });

        })
    }

    _initializeRouter(){

        // respond with "hello world" when a GET request is made to the homepage
        this.app.get('/', (req, res) => {

            res.json({
                name: 'WebDollar',
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

        /**
         *      Used for https://www.sslforfree.com to generate SSL certificates
         *
         */

        this.app.get('sslforce-key', (req, res) => {
            res.send( 'sslforce-answer' );
        })

    }

}

export default new NodeExpress();