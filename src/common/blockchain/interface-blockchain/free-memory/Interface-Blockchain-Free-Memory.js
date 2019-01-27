class InterfaceFreeMemory{

    constructor(blockchain){

        this.blockchain = blockchain;

        setTimeout( this._freeMemoryTimeout.bind(this), 5000 );
    }

    async freeMemory(){

        for (let i=this.blockchain.blocks.blocksStartingPoint; i < this.blockchain.blocks.length-50; i++){

            if (this.blockchain.blocks[i] === undefined ) continue;

            this.blockchain.blocks[i].computedBlockPrefix = undefined;

            for (let j=0; j<this.blockchain.blocks[i].data.transactions.transactions.length; j++)
                this.blockchain.blocks[i].data.transactions.transactions[j]._serializated = undefined;


            if (i % 10000 === 0) await this.blockchain.sleep(50);

        }

    }

    async _freeMemoryTimeout(){

        await this.freeMemory();

        setTimeout( this._freeMemoryTimeout.bind(this), 2*60*1000 );

    }

}

export default InterfaceFreeMemory;