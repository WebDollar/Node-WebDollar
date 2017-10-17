

class NodeLists {

    // clientSockets : [],
    // serverSockets : [],

    constructor(){

        console.log("NodeLists constructor");

        this.clientSockets = [];
        this.serverSockets = [];
    }


    searchNodeSocketAddress(address, searchClientSockets, searchServerSockets){

        if (typeof searchClientSockets === 'undefined') searchClientSockets = true;
        if (typeof searchServerSockets === 'undefined') searchServerSockets = true;
        address = address.toLowerCase();

        if (searchClientSockets)
            for (let i=0; i<this.clientSockets.length; i++)
                if (this.clientSockets[i].address.toLowerCase() === address){
                    return this.clientSockets[i];
                }

        if (searchServerSockets)
            for (let i=0; i<this.serverSockets.length; i++)
                if (this.serverSockets[i].address.toLowerCase() === address){
                    return this.serverSockets[i];
                }


        return null;
    }

    checkAddClientSocket(socket){
        if (this.searchNodeSocketAddress(socket) === null) {
            this.clientSockets.push(socket);
            return true;
        }
        else socket.disconnect();
        return false;
    }

    checkAddServerSocket(socket){
        if (this.searchNodeSocketAddress(socket) === null) {
            this.serverSockets.push(socket);
            return true;
        }
        else socket.disconnect();
        return false;
    }

}

exports.NodeLists =  new NodeLists();