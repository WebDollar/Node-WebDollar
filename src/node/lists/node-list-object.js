const ipaddr = require('ipaddr.js');

/*
    TUTORIAL BASED ON https://www.npmjs.com/package/ipaddr.js/
 */

class NodesListObject {

    constructor(socket, type){

        this.socket = socket;
        this.type = type;
    }


    toJSON(){

        return {
            type: this.type,
            addr: this.socket.node.sckAddress.addressString,
            port: this.socket.node.sckAddress.port,
            connected: true,
        }

    }

}




export default NodesListObject;