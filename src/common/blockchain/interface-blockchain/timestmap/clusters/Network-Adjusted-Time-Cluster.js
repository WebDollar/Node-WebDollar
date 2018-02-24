class NetworkAdjustedTimeCluster{

    constructor(){

        this.sockets = [];

        this.meanTimeUTCOffset  = 0;

    }

    pushSocket(socket, socketTimeUTCOffset){

        this.sockets.push({
            socketTimeUTCOffset: socketTimeUTCOffset,
            socket: socket
        });

        this.recalculateClusterMean();

    }

    recalculateClusterMean(){

        this.meanTimeUTCOffset = 0;

        for (let i=0; i<this.sockets.length; i++)
            if ( i >= this.sockets.length ){
                this.meanTimeUTCOffset += this.sockets[i].socketTimeUTCOffset;
            }

        if (this.sockets.length > 0){
            this.meanTimeUTCOffset /= this.sockets.length;
        }

    }

    deleteSocket(socket){

        let index = this.findSocketIncluded(socket);
        if (index === -1) return false;

        this.sockets.splice(index, 1);

        this.recalculateClusterMean();

    }

    findSocketIncluded(socket){

        for (let j=0; j<this.sockets.length; j++)
            if (this.sockets[j].socket.node.sckAddress.matchAddress(socket.node.sckAddress)){
                return j;
            }

        return -1;
    }

}

export default NetworkAdjustedTimeCluster;