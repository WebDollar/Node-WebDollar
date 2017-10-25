import * as io from 'socket.io-client';

import {nodeVersionCompatibility, nodeVersion, nodePort} from '../../../../consts/const_global.js';
import {SocketExtend} from '../../../../common/sockets/socket-extend';
import {SocketAddress} from '../../../../common/sockets/socket-address';
import {NodeLists} from '../../../lists/node-lists.js';
import {NodeProtocol} from '../../../../common/sockets/protocol/node-protocol.js';

class NodeClient {

    // socket : null,

    constructor(){

        //console.log("NodeClient constructor");

        this.socket = null;
    }

    connectTo(address, port){

        let sckAddress = SocketAddress.createSocketAddress(address, port);


        address = sckAddress.getAddress();
        port = sckAddress.port;

        return new Promise( (resolve) => {

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

                let socket = null;
                try {
                    socket = io.connect(address, {});
                }  catch (Exception){
                    console.log("Error Connecting Node to ", address," ", Exception.toString());
                    resolve(false);
                }
                this.socket = socket;

                SocketExtend.extendSocket(socket, "address" );
                console.log("soooocket", socket.node.protocol.sendHello());

                //console.log(socket);

                socket.once("connect", response=>{

                    SocketExtend.extendSocket(socket, socket.io.opts.hostname||sckAddress.getAddress(),  socket.io.opts.port||sckAddress.port );

                    console.log("Client connected to ", socket.node.sckAddress.getAddress() );

                    socket.node.protocol.sendHello().then( (answer)=>{
                        this.initializeSocket(socket);
                    });

                    resolve(true);
                });

                socket.once("connect_error", response =>{
                    console.log("Client error connecting", address);
                    //NodeLists.disconnectSocket(this.socket);

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
                console.log("Error Raised when connecting Node to ", address," ", Exception.toString());
                resolve(false);
            }

            resolve(true);

        });

    }

    initializeSocket(socket){

        //it is not unique... then I have to disconnect
        if (NodeLists.addUniqueSocket(socket, "client") === false){
            return false;
        }

        socket.once("disconnect", response => {

            console.log("Client disconnected ",  socket.node.sckAddress.toString() );
            NodeLists.disconnectSocket(socket);

        });

        socket.node.protocol.propagation.initializePropagation();
    }


}

exports.NodeClient =  NodeClient;