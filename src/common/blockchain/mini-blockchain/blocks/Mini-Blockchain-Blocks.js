import InterfaceBlockchainBlocks from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Blocks'
import RevertActions from "../../../utils/Revert-Actions/Revert-Actions";

class MiniBlockchainBlocks extends InterfaceBlockchainBlocks{

    async spliceBlocks(after, showUpdate = true, revertActions){

        let oldLength = this.length ;

        if (!revertActions)
            revertActions = new RevertActions( this.blockchain );

        let removedBlocks = [];

        //remove transactions and rewards from each blocks
        if (after === 0){

            this.blockchain.accountantTree.clear();

        } else
            for (let i = oldLength - 1; i >= after; i--) {

                let block = await this.blockchain.getBlock( i );
                removedBlocks.push(block);

                // remove transactions
                for (let j=block.data.transactions.transactions.length-1; j>=0; j--)
                    block.data.transactions.transactions[j].processTransaction( -1, block.data.minerAddress, undefined, showUpdate );

                // remove reward
                this.blockchain.accountantTree.updateAccount( block.data.minerAddress, - block.reward, undefined, undefined, showUpdate);

                revertActions.push({
                    name: "block-removed",
                    height: this.length-1,
                    data: block,
                });

            }

        await InterfaceBlockchainBlocks.prototype.spliceBlocks.apply(this, arguments);

        return removedBlocks;

    }

}

export default MiniBlockchainBlocks;