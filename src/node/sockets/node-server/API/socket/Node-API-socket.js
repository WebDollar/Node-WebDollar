import NodesList from 'node/lists/Nodes-List';

class NodeAPISocket{

    constructor(){

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._connectAPI(nodesListObject.socket) } );
        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject ) => { this._disconnectAPI(nodesListObject.socket, false ) });

    }

    _connectAPI(socket){

        socket.on("api/start",(data)=>{

            if (data.login === "true"){

                //authenticate based on a secret token

            }

            this._initializeSimpleAPI(socket);

        });

    }

    _disconnectAPI(socket){

    }


    _initializeSimpleAPI(){



    }

}

export default new NodeAPISocket();