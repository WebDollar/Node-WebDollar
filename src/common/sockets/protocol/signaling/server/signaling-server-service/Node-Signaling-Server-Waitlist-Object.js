class NodeSignalingServerWaitlistObject{

    constructor(socket, acceptWebPeers){

        this.socket = socket;

        this.lastTimeCheckedAvailability = undefined;

        this.acceptWebPeers = acceptWebPeers;

    }

    async checkAvailability(){

        let answer = await this.socket.node.sendRequestWaitOnce("signals/client/do-you-have-free-room", {}, "answer", 5000);

        try {

            if (answer === null || answer.result === false) {
                this.acceptWebPeers = false;
                //TODO it should actually ban him som time
            } else {

                if (typeof answer.acceptWebPeers !== "boolean")
                    answer.acceptWebPeers = false;
                else
                    this.acceptWebPeers = answer.acceptWebPeers;
            }

        } catch (exception){
            console.warn("_determineWebPeersAvailability raised an error", exception);
        }
    }

    set acceptWebPeers(acceptWebPeers){

        this._acceptWebPeers = acceptWebPeers;
        this.lastTimeCheckedAvailability = new Date();

    }

    get acceptWebPeers(){

        return this._acceptWebPeers;

    }

}

export default NodeSignalingServerWaitlistObject;