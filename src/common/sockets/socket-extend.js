import { Observable, Subscribable } from 'rxjs/Observable';

import {NodeProtocol} from './protocol/node-protocol';
import {NodePropagationProtocol} from './protocol/node-propagation-protocol';
import {NodeSignalingServerProtocol} from './protocol/signaling/server/node-signaling-server-protocol';
import {NodeSignalingClientProtocol} from './protocol/signaling/client/node-signaling-client-protocol';
import NodesList from 'node/lists/nodes-list'
import SocketAddress from 'common/sockets/socket-address'

// Extending Socket / Simple Peer

class SocketExtend{

    extendSocket(socket, address, port){

        socket.node = {};

        socket.node.getSocket = () => { return socket};

        socket.node.on = (name, callback ) => { socket.on(name, callback) } ;
        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port);

        socket.node.sendRequest = (request, requestData) => { return this.sendRequest(socket, request, requestData) };
        socket.node.sendRequestWaitOnce = (request, requestData, answerPrefix) => {return this.sendRequestWaitOnce(socket, request, requestData, answerPrefix) };
        socket.node.broadcastRequest = (request, data, type) => { return this.broadcastRequest(socket, request, data, type) };

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;
        socket.node.protocol.sendHello = () => { return NodeProtocol.sendHello(socket.node)  };

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = () => { return NodePropagationProtocol.initializeSocketForPropagation(socket.node) };

        socket.node.protocol.signaling = {};
        socket.node.protocol.signaling.server = {};
        socket.node.protocol.signaling.server.initializeSignalingServerService = () => { return NodeSignalingServerProtocol.initializeSignalingServerService(socket) };

        socket.node.protocol.signaling.client = {};
        socket.node.protocol.signaling.client.initializeSignalingClientService = (params) => { return NodeSignalingClientProtocol.initializeSignalingClientService(socket, params) };
    }

    sendRequest (socket, request, requestData) {

        //console.log("sendRequest ############### ", socket, request, requestData);

        if (typeof socket.emit === 'function')  return socket.emit( request, requestData ); //socket io and Simple-Peer WebRTC
        else
        if (typeof socket.send === 'function'){

            if (typeof socket.signal === 'function')
                return socket.send({request: request, data: requestData});
            else
                return socket.send( request, requestData ); // Simple Peer WebRTC - socket

        }

        console.log("ERROR!! Couldn't sendRequest ", socket, request, requestData);

    }


    /*
        Sending the Request and return the Promise to Wait Async
    */

    sendRequestWaitOnce (socket, request, requestData, answerPrefix) {

        if (typeof answerPrefix !== 'undefined') answerPrefix = String(answerPrefix); //in case it is a number

        return new Promise((resolve) => {

            let requestAnswer = request;
            if ( typeof answerPrefix === 'string' && answerPrefix.length > 0 ) {
                requestAnswer += (answerPrefix[1] !== '/' ? '/' : '') + answerPrefix;
                console.log("sendRequestWaitOnce", request)
            }

            socket.once(requestAnswer, function (resData) {
                resolve(resData);
            });

            this.sendRequest(socket, request, requestData);

        });
    }


    broadcastRequest (socket, request, data, type){

        let nodes = NodesList.getNodes(type);

        for (let i=0; i < nodes.length; i++)
            if (nodes[i].socket !== socket)
                this.sendRequest(nodes[i].socket, request, data);

    }


}


exports.SocketExtend = new SocketExtend();



