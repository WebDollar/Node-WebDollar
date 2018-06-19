import Blockchain from "main-blockchain/Blockchain";
import Utils from "common/utils/helpers/Utils";

class PoolWork {

    constructor(poolManagement, blockchain){

        this.poolManagement = poolManagement;
        this.blockchain = blockchain;

        this.lastBlockPromise = undefined;
        this.lastBlock = undefined;
        this.lastBlockNonce = 0;

    }

    getNextBlockForWork(){

        //still pending
        if (this.lastBlockPromise !== undefined && this.lastBlockPromise.isPending() )
            return this.lastBlockPromise;

        //new work

        if (!Blockchain.synchronized)
            throw {message: "Blockchain is not yet synchronized"};

        let promise = new Promise( async (resolve)=>{

            console.log(222);

            this.lastBlock = await this.blockchain.mining.getNextBlock();
            this.lastBlockNonce = 0;

            if (this.lastBlock.computedBlockPrefix === null )
                this.lastBlock._computeBlockHeaderPrefix();

            resolve(true);
        });

        this.lastBlockPromise = Utils.MakeQuerablePromise( promise );

        return this.lastBlockPromise;


    }


    gerbageCollector(){
        
    }

}

export default PoolWork;