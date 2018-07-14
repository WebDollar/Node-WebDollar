import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodePropagationProtocol from 'common/sockets/protocol/Node-Propagation-Protocol'
import NodeSignalingServerProtocol from 'common/sockets/protocol/signaling/server/Node-Signaling-Server-Protocol';
import NodeSignalingClientProtocol from 'common/sockets/protocol/signaling/client/Node-Signaling-Client-Protocol';
import SocketAddress from 'common/sockets/protocol/extend-socket/Socket-Address'
import SocketProtocol from "./Socket-Protocol"
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

                SocketProtocol._processBufferArray(data);

                return callback(data);
            })
        } ;

        socket.node.once = (name, callback ) => {
            socket.once(name, (data)=>{

                if (global.TERMINATED)
                    return;

                SocketProtocol._processBufferArray(data);

                return callback(data);
            })
        } ;
        socket.node.sckAddress = SocketAddress.createSocketAddress(address, port, uuid);

        if (socket.webRTC)
            socket.node.sendRequest = SocketProtocol.prototype.sendRequestWebPeer.bind(socket);
        else
            socket.node.sendRequest = SocketProtocol.prototype.sendRequestSocket.bind(socket);

        socket.node.sendRequestWaitOnce = SocketProtocol.prototype.sendRequestWaitOnce.bind(socket);

        socket.node.protocol = {};
        socket.node.protocol.helloValidated = false;

        socket.node.protocol.blocks = 0;
        socket.node.protocol.blocksPrevious = 0;

        socket.node.protocol.justSendHello = NodeProtocol.prototype.justSendHello.bind(socket);
        socket.node.protocol.sendHello = NodeProtocol.prototype.sendHello.bind(socket);
        socket.node.protocol.processHello = NodeProtocol.prototype.processHello.bind(socket);

        socket.node.protocol.sendLastBlock = NodeProtocol.prototype.sendLastBlock.bind(socket);

        socket.node.protocol.propagation = {};
        socket.node.protocol.propagation.initializePropagation = () => { return NodePropagationProtocol.initializeSocketForPropagation(socket) };

        socket.node.protocol.signaling = {};
        socket.node.protocol.signaling.server = {};
        socket.node.protocol.signaling.server.initializeSignalingServerService = () => { return NodeSignalingServerProtocol.initializeSignalingServerService(socket) };

        socket.node.protocol.signaling.client = {};
        socket.node.protocol.signaling.client.initializeSignalingClientService = () => { return NodeSignalingClientProtocol.initializeSignalingClientService(socket, ) };

        socket.node.protocol.agent = {};
        socket.node.protocol.agent.startedAgentDone = false;



        NodePropagationProtocol.initializeNodesPropagation(socket);
    }



}


export default new SocketExtend();



