class NodeSignalingServerWaitlistObject{

    constructor(socket, acceptWebPeers){

        this.socket = socket;

        this.acceptWebPeers = acceptWebPeers;

    }


    set acceptWebPeers(acceptWebPeers){

        this._acceptWebPeers = acceptWebPeers;

    }

    get acceptWebPeers(){

        return this._acceptWebPeers;

    }

}

export default NodeSignalingServerWaitlistObject;