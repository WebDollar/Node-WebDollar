class NodeAPIAntiDos{

    constructor(){

        this.waitlist = [];

        this.totalWeights = {};

        setInterval(this._reduceWeights.bind(this), 1000);

    }

    allowIP(ip){

        if (this.waitlist.length > 0){
            for (let i=0; i<this.waitlist.length; i++)
                if (this.waitlist[i] === ip)
                    return true;
        }

        return false;
    }

    addRouteWeight(route, totalWeight){

        if (this.totalWeights[route] === undefined)
            this.totalWeights[route] = {weight:0, max: 0};

        this.totalWeights[route].max = totalWeight||1000;

    }

    _reduceWeights(){

        for (let key in this.totalWeights)
            this.totalWeights[key].weight = 0;

    }

    protectRoute(route, callback){

        let element = this.totalWeights[route];

        if (element === undefined) return callback();

        if (element.weight >= element.max )
            return {result:false, message: "TOO MANY REQUESTS"};

        element.weight++;

        return callback();


    }

}

export default new NodeAPIAntiDos();