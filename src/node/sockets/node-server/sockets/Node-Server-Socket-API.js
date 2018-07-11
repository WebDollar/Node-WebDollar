import NodesList from 'node/lists/Nodes-List';
import NodeAPIRouter from "../API-router/Node-API-Router"
import CONNECTION_TYPE from "node/lists/types/Connection-Type";
import NODE_API_TYPE from "../API-router/NODE_API_TYPE";

class NodeServerSocketAPI{

    constructor(){

        NodesList.emitter.on("nodes-list/connected", (nodesListObject) => { this._connectAPI(nodesListObject.socket) } );

    }

    _connectAPI(socket){

        if (socket.node.protocol.connectionType !== CONNECTION_TYPE.CONNECTION_SERVER_SOCKET) return;

        socket.node.once("api/start", (data)=>{

            if (data.login === "true"){

                //authenticate based on a secret token

            }

            NodeAPIRouter.initializeRouter( this._socketRouteMiddleware.bind(socket), this._socketMiddleware.bind(socket), "api/" , socket, NODE_API_TYPE.NODE_API_TYPE_SOCKET);

            socket.node.sendRequest("api/start/answer", {result: true} );

        });

        socket.node.once("api/start-subscribers", ( data )=>{

            NodeAPIRouter.initializeRouterCallbacks( this._socketRouteMiddleware.bind(socket), this._socketMiddlewareCallback.bind(socket), "api/" , socket, NODE_API_TYPE.NODE_API_TYPE_SOCKET);

            socket.node.sendRequest("api/start-subscribers/answer",{result: true});

        });

    }

    /**
     * this => socket
     * @param route
     * @param callback
     * @private
     */
    _socketRouteMiddleware(route, callback){

        if (route.indexOf("/:")>=0)
            route = route.substr(0, route.indexOf("/:"));


        this.node.on( route, (req, ack) => {
            req._route = route;
            callback(req, ack )
        });

    }

    async _socketMiddleware(req, res, callback){

        let answer = await callback(req, this);
        let suffix = (answer._suffix !== '' ? '/'+answer._suffix : '' );
        delete answer._suffix;

        return this.node.sendRequest(req._route+"/answer"+suffix, answer,);
    }

    async _socketMiddlewareCallback(req, send, callback){

        let answer = await callback(req, this, dataSubscriber => {

            let suffix = (answer._suffix !== '' ? '/'+answer._suffix : '' );

            this.node.sendRequest( req._route+"/answer"+suffix, dataSubscriber);
        } );

        let suffix = (answer._suffix !== '' ? '/'+answer._suffix : '' );

        return this.node.sendRequest(req._route+"/answer"+suffix, answer);

    }

}

export default new NodeServerSocketAPI();