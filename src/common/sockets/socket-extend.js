import { Observable, Subscribable } from 'rxjs/Observable';

import {NodeProtocol} from './protocol/node-protocol';
import {NodePropagationProtocol} from './protocol/node-propagation-protocol';
import {SocketAddress} from './socket-address';

// Extending Socket / Simple Peer

class SocketExtend{

    extendSocket(socket, address, port){

        socket.node = {};

        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port);

        socket.node.sendRequest = this.sendRequest;
        socket.node.sendRequestWaitOnce = this.sendRequestWaitOnce;

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;
        socket.node.protocol.sendHello = NodeProtocol.sendHello;
        socket.node.protocol.broadcastMessageAllSockets = NodeProtocol.broadcastMessageAllSockets;

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = NodePropagationProtocol.initializeSocketForPropagation;

        socket.node.protocol.SocketAddress.createSocketAddress(socket.io.opts.hostname||sckAddress.getAddress(),  socket.io.opts.port||sckAddress.port);
    }

    sendRequest (request, requestData) {
        //console.log("sendRequest",request, requestData);

        if (typeof this.emit === 'function')  return this.emit( request, requestData );
        else return this.send( request, requestData);
    }


    /*
        Sending the Request and return the Promise to Wait Async
    */

    sendRequestWaitOnce (request, requestData) {

        return new Promise((resolve) => {

            this.sendRequest(request, requestData);

            this.once(request, function (resData) {
                resolve(resData);
            });
        });
    }


}


exports.SocketExtend = new SocketExtend();


