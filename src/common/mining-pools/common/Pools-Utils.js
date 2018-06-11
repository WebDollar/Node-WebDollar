import  Utils from "common/utils/helpers/Utils"

class PoolsUtils {

    constructor(){
        this.servers = [];
    }

    processServersList(serversList){

        if (typeof serversList === "string") serversList =  serversList.split(",;: ");

        if (!Array.isArray(serversList)) throw {message: "serversList is not array"};

        for (let i=serversList.length-1; i>=0; i--){

            serversList[i] = serversList[i].replace(/\s+/, "");
            if (serversList[i] === ''){

                if (serversList.length === 1)
                    serversList = [];
                else
                    serversList = serversList.splice(i,1);
            }

        }

        for (let i=0; i<serversList.length; i++)
            if ( !Utils.validateUrl( serversList[i] ) ) throw {message: "serversList element is not a valid url", url: serversList[i]}

        return serversList;
    }

    convertServersList(servers){

        let string = '';

        for (let key in  servers ){
            string += servers[key]+",";
        }

        return string;
    }

}

export default new PoolsUtils();