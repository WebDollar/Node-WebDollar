import NodeProtocol from 'common/sockets/protocol/node-protocol';
import NodePropagationProtocol from 'common/sockets/protocol/node-propagation-protocol'
import NodeSignalingServerProtocol from 'common/sockets/protocol/signaling/server/Node-Signaling-Server-Protocol';
import NodeSignalingClientProtocol from 'common/sockets/protocol/signaling/client/Node-Signaling-Client-Protocol';
import SocketAddress from 'common/sockets/socket-address'
import isArrayBuffer from 'is-array-buffer';
import global from "consts/global"

// Extending Socket / Simple Peer

class SocketExtend{

    extendSocket(socket, address, port, uuid, level){

        socket.level = level;

        socket.node = {
            level: level,
        };

        socket.node.getSocket = () => { return socket; };

        socket.node.on = (name, callback ) => {
            socket.on(name, (data)=>{

                if (global.TERMINATED)
                    return;

                this._processBufferArray(data);

                return callback(data);
            })
        } ;

        socket.node.once = (name, callback ) => {
            socket.once(name, (data)=>{

                if (global.TERMINATED)
                    return;

                this._processBufferArray(data);

                return callback(data);
            })
        } ;

        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port, uuid);

        socket.node.sendRequest = (request, requestData) => { return this.sendRequest(socket, request, requestData) };
        socket.node.sendRequestWaitOnce = (request, requestData, answerSuffix, timeOutInterval) => {return this.sendRequestWaitOnce(socket, request, requestData, answerSuffix, timeOutInterval) };
        socket.node.broadcastRequest = (request, data, type, exceptSockets) => {

            if (exceptSockets !== undefined && exceptSockets !== null && !Array.isArray(exceptSockets))
                exceptSockets = [exceptSockets];

            return NodeProtocol.broadcastRequest(request, data, type, exceptSockets === null ? [socket] :  exceptSockets.concat(socket))
        };

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;
        socket.node.protocol.sendHello = (validationDoubleConnectionsTypes) => { return NodeProtocol.sendHello(socket.node, validationDoubleConnectionsTypes)  };

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = () => { return NodePropagationProtocol.initializeSocketForPropagation(socket.node) };

        socket.node.protocol.signaling = {};
        socket.node.protocol.signaling.server = {};
        socket.node.protocol.signaling.server.initializeSignalingServerService = () => { return NodeSignalingServerProtocol.initializeSignalingServerService(socket) };

        socket.node.protocol.signaling.client = {};
        socket.node.protocol.signaling.client.initializeSignalingClientService = () => { return NodeSignalingClientProtocol.initializeSignalingClientService(socket, ) };

        socket.node.protocol.agent = {};
        socket.node.protocol.agent.startedAgentDone = false;
    }

    sendRequest (socket, request, requestData) {

        //console.log("sendRequest ############### ", socket, request, requestData);

        try {

            if (typeof socket.emit === 'function')
                return socket.emit(request, requestData); //socket io and Simple-Peer WebRTC
            else
            if (typeof socket.send === 'function') {

                if (typeof socket.signal === 'function')
                    return socket.send({request: request, data: requestData});
                else
                    return socket.send(request, requestData); // Simple Peer WebRTC - socket
            }

        } catch (exception){
            console.error("Error sending request" + exception, exception);
            return null;
        }

        console.log("ERROR!! Couldn't sendRequest ", socket, request, requestData);

    }


    /*
        Sending the Request and return the Promise to Wait Async
    */

    sendRequestWaitOnce (socket, request, requestData, answerSuffix, timeOutInterval=4000) {

        if ( answerSuffix !== undefined) answerSuffix = String(answerSuffix); //in case it is a number

        return new Promise((resolve) => {

            let requestAnswer = request;
            let timeoutId;

            if ( typeof answerSuffix === 'string' && answerSuffix.length > 0 ) {
                requestAnswer += (answerSuffix[1] !== '/' ? '/' : '') + answerSuffix;
                //console.log("sendRequestWaitOnce", request)
            }

            let requestFunction = (resData) => {

                if (global.TERMINATED) return;

                if (timeoutId !== undefined) clearTimeout(timeoutId);

                this._processBufferArray(resData);

                resolve(resData);
            };

            let clearReturnFunction = ()=>{
                if (socket !== null && socket !== undefined)
                    if (socket.removeListener !== undefined) //websocket io
                        socket.removeListener(requestAnswer, requestFunction);
                    else
                    if (1 === 2) //webRTC
                    {
                        //TODO WEBRTC create an EventEmitter
                    }
                //socket.off(onceId);
                resolve(null);
            };

            socket.once(requestAnswer, requestFunction );

            if (timeOutInterval !== undefined)
                timeoutId = setTimeout( clearReturnFunction, timeOutInterval);

            let answer = this.sendRequest(socket, request, requestData);

            if (answer === null)
                clearReturnFunction();

        });
    }

    _isIterable(obj) {
        // checks for null and undefined
        if (obj === null || obj === undefined) {
            return false;
        }
        return typeof obj[Symbol.iterator] === 'function';
    }

    /**
     * Browser sockets receives ArrayBuffer and it is not compatible with Buffer (UIntArray) in the Browser
     */
    _processBufferArray(data){

        if (typeof data === "object" && data !== null)
            for (let prop in data){
                if (data.hasOwnProperty(prop)){

                    if (isArrayBuffer(data[prop]))
                        data[prop] = Buffer.from(data[prop]);
                    else
                    if (prop === "type" && data.type === "Buffer" && data.hasOwnProperty("data")) {
                        data = new Buffer(data);
                        return data;
                    }
                    else
                        data[prop] = this._processBufferArray(data[prop]);

                }
            }

        return data;
    }

}


export default new SocketExtend();



