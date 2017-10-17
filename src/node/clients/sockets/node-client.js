let ioClient = require('socket.io-client');
let constGlobal = require('../../../consts/const_global.js');

import { Observable, Subscribable } from 'rxjs/Observable';

class NodeClient {

    // socket : null,

    constructor(){

        console.log("NodeClient constructor");

        this.socket = null;
        this.onConnect = null;
        this.onDisconnect = null;
    }

    connectTo(address){

        try
        {
            let client = ioClient(address);

            this.socket = client;

            this.subscribeSocketObservable("connection").subscribe(response => {

                console.log("Client connected");

                if (typeof this.onConnect !== 'undefined')
                    this.onConnect(client);

            });

            this.subscribeSocketObservable("disconnect").subscribe(response => {

                console.log("Client connected");

                if (typeof this.onConnect !== 'undefined')
                    this.onConnect(client);

            });


            this.sendRequestWaitOnce("HelloNode",{
                version:constGlobal.nodeVersion,
            }).then(response =>{

                console.log("RECEIVED HELLO NODE BACK", response);

            });

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
        return this.socket.emit( request, requestData);
    }


    /*
        Sending the Request and return the Promise to Wait Async
    */
    sendRequestWaitOnce(request, requestData) {

        return new Promise((resolve) => {

            this.sendRequest(request, requestData);

            this.socket.once(request, function (resData) {

                resolve(resData);

            });

        });
    }

    /*
     Sending Request and Obtain the Observable Object
     */
    sendRequestSubscribe(request, requestData) {

        let result = this.sendRequest(request, requestData);

        return this.subscribeSocketObservable(request);
    }

    subscribeSocketObservable(request) {

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