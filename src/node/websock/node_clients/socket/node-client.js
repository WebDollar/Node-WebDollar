import * as io from 'socket.io-client';

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../../consts/const_global.js';
import {sendRequest} from '../../../../common/sockets/sockets.js';
import {SocketAddress} from '../../../../common/sockets/socket-address.js';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeProtocol} from '../../../../common/sockets/node/node-protocol.js';
import {NodePropagationProtocol} from '../../../../common/sockets/node/node-propagation-protocol.js';

class NodeClient {

    // socket : null,

    constructor(){

        //console.log("NodeClient constructor");

        this.socket = null;
    }

    connectTo(address, port){

        if (typeof port === 'undefined') port = nodePort;
        let that = this;

        return new Promise(function(resolve) {

            try
            {
                if (address.length < 3){
                    console.log("rejecting address",address);
                    resolve(false);
                    return false;
                }

                // in case the port is not included
                if (address.indexOf(":") === -1)  address += ":"+port;
                if (address.indexOf("http://") === -1 )  address = "http://"+address;

                console.log("connecting... to address", address);
                let socket = io.connect(address, {});
                that.socket = socket;


                //console.log(socket);

                socket.once("connect", response=>{

                    socket.address = SocketAddress(socket, socket.io.opts.hostname,  socket.io.opts.port);

                    console.log("Client connected to ", socket.address.toString());

                    NodeProtocol.sendHello(socket).then( (answer)=>{
                        that.initializeSocket(socket);
                    });

                    resolve(true);
                });

                socket.once("connect_error", response =>{
                    console.log("Client error connecting", address);
                    //NodeLists.disconnectSocket(that.socket);

                    resolve(false);
                });

                socket.once("connect_failed", response =>{
                    console.log("Client error connecting (connect_failed) ", address);
                    NodeLists.disconnectSocket(socket);

                    resolve(false);
                });

                socket.connect();

            }
            catch(Exception){
                console.log("Error Connecting Node to ", address," ", Exception.toString());
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(socket){

        let isUnique = NodeLists.addUniqueSocket(socket, true, false);

        socket.once("disconnect", response => {

            console.log("Client disconnected ",  socket.address);
            NodeLists.disconnectSocket(socket);

        });

        NodePropagationProtocol.initializeSocketForPropagation(socket);
    }


}

exports.NodeClient =  NodeClient;