
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import MiniBlockchainFork from './forks/Mini-Blockchain-Fork'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainForksAdministrator from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Forks-Administrator'

class MiniBlockchain extends  InterfaceBlockchain{

    constructor (){

        super();

        this.accountantTree = new MiniBlockchainAccountantTree();
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.dataBase, MiniBlockchainBlock, MiniBlockchainBlockData)
        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this, MiniBlockchainFork );
    }

    // operate the mini-blockchain accountant tree
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast){

        //inheriting blockchain add
        let result = await InterfaceBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast);

        if (!result) return false;

        result = this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined );
        //console.log(result);

        let balances = this.accountantTree.listBalances( block.data.minerAddress );
        //console.log("balances", balances );

        return result;

    }

    getBalances(address){

        return this.accountantTree.getBalances(address);

    }

}

export default MiniBlockchain