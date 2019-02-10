class InterfaceFreeMemory{

    constructor(blockchain){

        this.blockchain = blockchain;

        setTimeout( this._freeMemoryTimeout.bind(this), 5000 );
    }

    async freeMemory(){


        // for (let i=this.blockchain.blocks.blocksStartingPoint; i < this.blockchain.blocks.length-50; i++){
        //
        //     let block = await this.blockchain.getBlock(i);
        //
        //     if ( !block ) continue;
        //
        //     block.computedBlockPrefix = undefined;
        //
        //     for (let j=0; j<block.data.transactions.transactions.length; j++)
        //         delete block.data.transactions.transactions[j]._serializated ;
        //
        //
        //     if (i % 10000 === 0) await this.blockchain.sleep(100);
        //
        // }

    }

    async _freeMemoryTimeout(){

        try {
            await this.freeMemory();
        } catch (exception){

        }

        setTimeout( this._freeMemoryTimeout.bind(this), 2*60*1000 );

    }

}

export default InterfaceFreeMemory;