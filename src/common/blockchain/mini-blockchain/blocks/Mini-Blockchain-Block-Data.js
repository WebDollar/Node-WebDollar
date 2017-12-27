import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import BufferExtended from 'common/utils/BufferExtended'

class MiniBlockchainBlockData extends  InterfaceBlockchainBlockData {

    constructor (blockchain, minerAddress, transactions, hashData, hashAccountantTree){

        super(blockchain, minerAddress, transactions, hashData, );

        this.hashAccountantTree = hashAccountantTree;

        if (this.hashAccountantTree === undefined)
            this.computeAccountantTreeHashBlockData();

        //recalculate hashData
        if (hashData === undefined || hashData === null)
            this.hashData = this.computeHashBlockData();

    }


    validateBlockData(validationType){

        let result = InterfaceBlockchainBlockData.prototype.validateBlockData.call(this,  );

        if (!result) return false;

        if (this.hashAccountantTree === undefined || this.hashAccountantTree === null || !Buffer.isBuffer(this.hashAccountantTree)) throw ('hashAccountantTree is empty');

        if (validationType !== "just-blocks") {

            //validate hashAccountantTree
            let hashAccountantTree = this.calculateAccountantTreeHashBlockData();

            console.log("hashAccountantTree", this.hashAccountantTree.toString("hex"), hashAccountantTree.toString("hex"));

            if (!hashAccountantTree.equals(this.hashAccountantTree)) throw "block.data hashAccountantTree is not right";
        }

        return true;

    }

    _computeBlockDataHeaderPrefix(){

        if (!Buffer.isBuffer(this.hashAccountantTree) || this.hashAccountantTree.length !== 32)
            this.computeAccountantTreeHashBlockData();

        return Buffer.concat (
            [
                InterfaceBlockchainBlockData.prototype._computeBlockDataHeaderPrefix.call(this),
                this.hashAccountantTree,
            ]);
    }

    calculateAccountantTreeHashBlockData(){
        return this.blockchain.accountantTree.root.hash.sha256;
    }

    computeAccountantTreeHashBlockData(){
        this.hashAccountantTree = this.calculateAccountantTreeHashBlockData();
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