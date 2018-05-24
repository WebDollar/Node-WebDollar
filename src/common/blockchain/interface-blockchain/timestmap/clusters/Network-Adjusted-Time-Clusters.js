import consts from 'consts/const_global'
import NetworkAdjustedTimeCluster from "./Network-Adjusted-Time-Cluster"
import StatusEvents from "common/events/Status-Events"

class NetworkAdjustedTimeClusters{

    constructor(){

        this._clusterInitialization = false;
        this.clearClusters();

        setTimeout( ()=>{
            this._clusterInitialization = true;
            this._refreshClusterStatus();
        }, 130*1000);

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

        return bestCluster;
    }


    _calculateBestCluster(){

        let bestCluster = null;

        for (let i=0; i<this.clusters.length; i++)
            if ( bestCluster === null || this.clusters[i].sockets.length > bestCluster.sockets.length ){

                bestCluster = this.clusters[i];

            }


        if (this.clusterBest !== bestCluster)
            this.clusterBest = bestCluster;

        this._refreshClusterStatus();
    }

    _refreshClusterStatus(){

        if (!this._clusterInitialization) return;

        if (this.clusterBest === null)
            return StatusEvents.emit("blockchain/logs", {message: "Network Adjusted Time Error", reason: "ClusterBest is Empty"});


        // if (Math.abs(this.clusterBest.meanTimeUTCOffset) > consts.BLOCKCHAIN.NETWORK_ADJUSTED_TIME_NODE_MAX_UTC_DIFFERENCE)
        //     return StatusEvents.emit("blockchain/logs", {message: "Network Adjusted Time Error", reason: "Your timestamp is not set correctly. The UTC timestamp should have been: "+ this._timeConverter( new Date().getTime() + this.clusterBest.meanTimeUTCOffset ) });

        return StatusEvents.emit("blockchain/logs", {message: "Network Adjusted Time Success"});

    }

    _timeConverter(UNIX_timestamp){

        let a = new Date(UNIX_timestamp * 1000);
        let months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        let year = a.getFullYear();
        let month = months[a.getMonth()];
        let date = a.getDate();
        let hour = a.getHours();
        let min = a.getMinutes();
        let sec = a.getSeconds();
        let time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
        return time;
    }

}

export default NetworkAdjustedTimeClusters