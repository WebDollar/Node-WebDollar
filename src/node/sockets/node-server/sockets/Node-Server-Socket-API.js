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

        socket.node.on("api/start", (data)=>{

            if (data.login === "true"){

                //authenticate based on a secret token

            }

            NodeAPIRouter.initializeRouter( this._socketRouteMiddleware.bind(socket), this._socketMiddleware, "api/" , socket, NODE_API_TYPE.NODE_API_TYPE_SOCKET);

        });

        socket.node.on("api/start-subscribers", (data)=>{

            NodeAPIRouter.initializeRouterCallbacks( this._socketRouteMiddleware.bind(socket), this._socketMiddlewareCallback, "api/" , socket, NODE_API_TYPE.NODE_API_TYPE_SOCKET);

        });

    }

    /**
     * this => socket
     * @param route
     * @param callback
     * @private
     */
    _socketRouteMiddleware(route, callback){

        if (route.index("/:")>=0)
            route = route.substr(0, route.index("/:"));

        this.node.on( route, callback);

    }

    async _socketMiddleware(req, send, callback){

        let answer = await callback(req);

        return send(answer);
    }

    async _socketMiddlewareCallback(req, send, socket, callback){

        let answer = await callback(req, send, (data)=>{ send( data ) });

        return send(answer);

    }

}

export default new NodeServerSocketAPI();