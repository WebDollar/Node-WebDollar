import {nodeVersionCompatibility, nodeVersion} from '../../../consts/const_global.js';
import {sendRequest, sendRequestWaitOnce, sendRequestSubscribe, subscribeSocketObservable} from './../sockets.js';

exports.sendHello = function (socket, initializeEvent){
    // Waiting for Protocol Confirmation
    sendRequestWaitOnce(socket, "HelloNode",{
        version: nodeVersion,
    }).then(response =>{

        console.log("RECEIVED HELLO NODE BACK", response);

        if ((response.hasOwnProperty("version"))&&(response.version <= nodeVersionCompatibility)){

            //check if it is a unique connection, add it to the list
            let result = NodeList.searchNodeSocketAddress(socket.address);

            if (result !== null){

                socket.helloValidated = true;
                initializeEvent(socket);
                return true;
            }
        }
        //delete socket;
        return false;

    });
}