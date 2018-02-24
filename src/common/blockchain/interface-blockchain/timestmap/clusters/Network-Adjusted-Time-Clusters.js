import consts from 'consts/const_global'
import NetworkAdjustedTimeCluster from "./Network-Adjusted-Time-Cluster"

class NetworkAdjustedTimeClusters{

    constructor(){

        this.clearClusters();

    }

    clearClusters() {

        this.clusters = [];
        this.clusterBest = null;
    }

    addNAT(socket, socketTimeUTCOffset){

        let bestClusterAnswer = this._findNATCluster(socketTimeUTCOffset);
        let cluster = undefined;

        if (bestClusterAnswer === null){

            cluster = new NetworkAdjustedTimeCluster();
            cluster.pushSocket(socket, socketTimeUTCOffset );

            this.clusters.push (cluster);

        } else {

            cluster = this.clusters[ bestClusterAnswer.clusterIndex ];

            cluster.pushSocket(socket, socketTimeUTCOffset);

        }

        this._calculateBestCluster();

        return cluster;
    }

    deleteNAT(socket){

        let index = this._findNATClusterBySocket(socket);

        if (index === -1 )
            return false;
        else {

            let cluster = this.clusters[index];
            cluster.deleteSocket(socket);

            if (cluster.sockets.length === 0)
                this.clusters.splice(index, 1);
        }

        this._calculateBestCluster();
    }

    _findNATClusterBySocket(socket){

        for (let i=0; i<this.clusters.length; i++) {
            if (this.clusters[i].findSocketIncluded(socket) !== -1)
                return i;
        }

        return -1;
    }

    _findNATCluster(socketTimeUTCOffset){

        let bestCluster = null;

        for (let i=0; i<this.clusters.length; i++){

            let difference = Math.abs( socketTimeUTCOffset - this.clusters[i].socketTimeUTCOffset );

            if ( Math.abs( difference ) < consts.BLOCKCHAIN.TIMESTAMP.NETWORK_ADJUSTED_TIME_NODE_MAX_UTC_DIFFERENCE ){

                if (bestCluster === null || bestCluster.difference > Math.abs(difference))
                    bestCluster = {
                        difference: difference,
                        clusterIndex : i,
                    }


            }
        }
    }


    _calculateBestCluster(){

        let bestCluster = null;

        for (let i=0; i<this.clusters.length; i++)
            if ( bestCluster === null || this.clusters[i].sockets.length > bestCluster.sockets.length ){

                bestCluster = this.clusters[i];

            }


        this.clusterBest = bestCluster;

    }

}

export default NetworkAdjustedTimeClusters