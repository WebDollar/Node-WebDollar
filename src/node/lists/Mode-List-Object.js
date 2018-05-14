/*
    TUTORIAL BASED ON https://www.npmjs.com/package/ipaddr.js/
 */

class NodesListObject {

    constructor(socket, connectionType, type, isFallback){

        this.socket = socket;

        this.connectionType = connectionType;
        this.type = type;
        this.date = new Date().getTime();
        this.isFallback = isFallback;

    }


    toJSON(){

        return {
            type: this.type,
            addr: this.socket.node.sckAddress.getAddress(true, true),
            connected: true,
        }

    }

}




export default NodesListObject;