var ioClient = require('socket.io-client');
var constGlobal = require('../../../consts/const_global.js');

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
 Sending the Request and Obtain the Promise to Wait Async
 */
    sendRequestGetData(sRequestName, sRequestData, receivingSuffix) {

        if (typeof receivingSuffix === 'undefined') receivingSuffix = '';

        return new Promise((resolve) => {

            this.sendRequest(sRequestName, sRequestData);

        this.socket.once(constants.SERVICE_WEBSOCK_API + sRequestName + (receivingSuffix !== '' ? '/'+receivingSuffix : ''), function (resData) {

            /*console.log('SOCKET RECEIVED: ');
             console.log(resData);*/

            resolve(resData);

        });

    });
    }

    /*
     Sending Request and Obtain the Observable Object
     */
    sendRequestObservable(sRequestName, sRequestData) {

        var result = this.sendRequest(sRequestName, sRequestData);

        return this.setSocketReadObservable(sRequestName);
    }

    setSocketReadObservable(sRequestName) {

        if ((sRequestName !== "connect") && (sRequestName !== "disconnect") && (sRequestName !== 'connect_failed')&&(sRequestName !== 'connect_error'))
            sRequestName = constants.SERVICE_WEBSOCK_API + sRequestName;

        //let observable = new Observable < Object > (observer => {
        let observable = Observable.create(observer => {
            this.socket.on(sRequestName, (data) => {
            observer.next(data);
    });
    });

        //console.log("OBSERVABLE for "+sRequestName,observable,);
        return observable;
    }

}

exports.client =  NodeClient;