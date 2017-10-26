import { Observable, Subscribable } from 'rxjs/Observable';

import {NodeProtocol} from './protocol/node-protocol';
import {NodePropagationProtocol} from './protocol/node-propagation-protocol';
import {SocketAddress} from './socket-address';

// Extending Socket / Simple Peer

class SocketExtend{

    extendSocket(socket, address, port){

        socket.node = {};

        socket.node.on = (name, callback ) => { socket.on(name, callback) } ;
        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port);

        socket.node.sendRequest = (request, requestData) => { return this.sendRequest(socket, request, requestData) };
        socket.node.sendRequestWaitOnce = (request, requestData) => {return this.sendRequestWaitOnce(socket, request, requestData) };

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;
        socket.node.protocol.sendHello = () => { return NodeProtocol.sendHello(socket.node)  };
        socket.node.protocol.broadcastMessageAllSockets = (request, data) => { return NodeProtocol.broadcastMessageAllSockets(socket.node, request, data) };

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = () => { return NodePropagationProtocol.initializeSocketForPropagation(socket.node) };
    }

    sendRequest (socket, request, requestData) {

        //console.log("sendRequest ############### ", socket, request, requestData);

        if (typeof socket.emit === 'function')  return socket.emit( request, requestData ); //socket io
        else
        if (typeof socket.send === 'function')  return socket.send( request, requestData ); // socket
        else
        if (typeof socket.signal === 'function') { //webrtc peer
            try{
                requestData = JSON.parse(requestData);

            } catch (Exception){
                console.log("ERRROR! Couldn't convert JSON data ", requestData)
            }
            return socket.signal( request, requestData )
        }

        console.log("ERROR!! Couldn't sendRequest ", socket, request, requestData);

    }


    /*
        Sending the Request and return the Promise to Wait Async
    */

    sendRequestWaitOnce (socket, request, requestData) {

        return new Promise((resolve) => {

            this.sendRequest(socket, request, requestData);

            socket.once(request, function (resData) {
                resolve(resData);
            });
        });
    }


}


exports.SocketExtend = new SocketExtend();


