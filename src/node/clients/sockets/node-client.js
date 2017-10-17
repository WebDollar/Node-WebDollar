let ioClient = require('socket.io-client');
let constGlobal = require('../../../consts/const_global.js');

import { Observable, Subscribable } from 'rxjs/Observable';

class NodeClient {

    // client : null,

    constructor(){

        console.log("NodeClient constructor");
        this.client = null;
    }

    connectTo(address){

        try
        {
            var client = ioClient(address);

            client.on('connection', function(){
                console.log("Client connected");

                if (typeof this.onConnect !== 'undefined')
                    this.onConnect(client);
            });

            client.on('disconnect', function(){
                console.log("Client disconnected");
            });

            client.emit("HelloNode", {
                version:constGlobal.nodeVersion,
            });

            this.client = client;
        }
        catch(Exception){
            console.log("Error Connecting Node to ",address);
            console.log(" Exception", Exception.toString());
            return false;
        }

        return true;
    }

    startDiscoverOtherNodes(){

    }

    /*
        FUNCTIONS
    */

    sendRequest(request, requestData) {
        return this.client.emit( request, requestData);
    }


    /*
        Sending the Request and Obtain the Promise to Wait Async
    */


    sendRequestGetData(request, requestData) {

        return new Promise((resolve) => {

            this.sendRequest(request, requestData);

            this.client.once(request, function (resData) {

                resolve(resData);

            });

        });
    }

    /*
     Sending Request and Obtain the Observable Object
     */
    sendRequestObservable(request, requestData) {

        let result = this.sendRequest(request, requestData);

        return this.setSocketReadObservable(request);
    }

    setSocketReadObservable(request) {

        //let observable = new Observable < Object > (observer => {
        let observable = Observable.create(observer => {
                this.socket.on(request, (data) => {
                observer.next(data);
            });
        });

        //console.log("OBSERVABLE for "+sRequestName,observable,);
        return observable;
    }

}

exports.client =  NodeClient;