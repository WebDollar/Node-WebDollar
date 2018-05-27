class PoolDataMinerInstance{

    constructor(publicKey){

        this.publicKey = publicKey;
        this.date = new Date().getTime();
        this.hashesPerSecond = 0;

    }

}

export default PoolDataMinerInstance;