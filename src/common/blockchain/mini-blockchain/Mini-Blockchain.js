
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from './state/Mini-Blockchain-Accountant-Tree'

class MiniBlockchain extends  InterfaceBlockchain{

    constructor (){
        super();

        this.accountantTree = new MiniBlockchainAccountantTree();

    }

    // operate the mini-blockchain accountant tree
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast){

        //inheriting blockchain add
        await InterfaceBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast);

        let result = this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined )
        //console.log(result);

        let balances = this.accountantTree.listBalances( block.data.minerAddress )
        //console.log("balances", balances );

        return result;

    }

    getBalances(address){

        return this.accountantTree.getBalances(address);

    }

}

export default MiniBlockchain