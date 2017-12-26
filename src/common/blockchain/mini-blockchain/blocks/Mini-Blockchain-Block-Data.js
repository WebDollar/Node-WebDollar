import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BufferExtended from 'common/utils/BufferExtended'

class MiniBlockchainBlockData extends  InterfaceBlockchainBlockData {

    constructor (blockchain, minerAddress, transactions, hashData, hashAccountantTree){

        super(blockchain, minerAddress, transactions, hashData, );

        if (hashAccountantTree === undefined)
            hashAccountantTree = this.computeAccountantTreeHashBlockData();

        this.hashAccountantTree = hashAccountantTree;

        //recalculate hashData
        if (hashData === undefined || hashData === null)
            this.hashData = this.computeHashBlockData();

    }


    validateBlockData(){

        let result = InterfaceBlockchainBlockData.prototype.validateBlockData.call(this,  );

        if (!result) return false;

        if (this.hashAccountantTree === undefined || this.hashAccountantTree === null || !Buffer.isBuffer(this.hashAccountantTree)) throw ('hashAccountantTree is empty');

        //validate hashAccountantTree
        let hashAccountantTree = this.computeAccountantTreeHashBlockData();

        console.log("hashAccountantTree", this.hashAccountantTree.toString("hex"), hashAccountantTree.toString("hex") );

        if (!hashAccountantTree.equals(this.hashAccountantTree)) throw "block.data hashAccountantTree is not right";

        return true;

    }

    computeAccountantTreeHashBlockData(){
        return this.blockchain.accountantTree.root.hash.sha256;
    }

    serializeData(){
        let buffer = InterfaceBlockchainBlockData.prototype.serializeData.call(this);

        return Buffer.concat(
            [
                buffer,
                this.hashAccountantTree,
            ]);
    }

    deserializeData(buffer){

        let data = buffer;

        let offset = InterfaceBlockchainBlockData.prototype.deserializeData.call(this, buffer);

        this.hashAccountantTree = BufferExtended.substr(data, offset, 32);
        offset += 32;

        return offset;

    }


}

export default MiniBlockchainBlockData;