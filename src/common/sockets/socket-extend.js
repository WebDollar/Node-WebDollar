import { Observable, Subscribable } from 'rxjs/Observable';

import {NodeProtocol} from './protocol/node-protocol';
import {NodePropagationProtocol} from './protocol/node-propagation-protocol';
import {NodeSignalingProtocol} from './protocol/node-signaling-protocol';
import {NodeLists} from '../../node/lists/node-lists.js';
import {SocketAddress} from './socket-address';

// Extending Socket / Simple Peer

class SocketExtend{

    extendSocket(socket, address, port){

        socket.node = {};

        socket.node.on = (name, callback ) => { socket.on(name, callback) } ;
        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port);

        socket.node.sendRequest = (request, requestData) => { return this.sendRequest(socket, request, requestData) };
        socket.node.sendRequestWaitOnce = (request, requestData) => {return this.sendRequestWaitOnce(socket, request, requestData) };
        socket.node.broadcastRequest = (request, data, type) => { return this.broadcastRequest(socket, request, data, type) };

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;
        socket.node.protocol.sendHello = () => { return NodeProtocol.sendHello(socket.node)  };

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = () => { return NodePropagationProtocol.initializeSocketForPropagation(socket.node) };

        socket.node.protocol.propagation.initializeSignalsAccepting = () => { return NodeSignalingProtocol.initializeSocketSignalsAccepting(socket.node) };
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


    broadcastRequest (socket, request, data, type){

        let sockets = NodeLists.getNodes(type);

        for (let i=0; i < sockets.length; i++)
            if (sockets[i] !== socket)
                this.sendRequest(sockets[i], request, data);

    }


}


exports.SocketExtend = new SocketExtend();



