import {nodeVersionCompatibility, nodeVersion} from '../../../consts/const_global.js';

exports.sendHello = function (socket, initializeEvent){
    // Waiting for Protocol Confirmation
    sendRequestWaitOnce(socket, "HelloNode",{
        version: nodeVersion,
    }).then(response =>{

        console.log("RECEIVED HELLO NODE BACK", response);

        if ((response.hasOwnProperty("version"))&&(response.version <= nodeVersionCompatibility)){

            //check if it is a unique connection, add it to the list
            let result = NodeLists.checkAddServerSocket(socket);
            if (result){
                initializeEvent(socket);
                return true;
            }
        }
        //delete socket;
        return false;

    });
}