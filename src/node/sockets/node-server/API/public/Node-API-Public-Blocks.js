import Utils from "common/utils/helpers/Utils";
import Blockchain from "main-blockchain/Blockchain"

class NodeAPIPublicBlocks{



    async blocks(req, res){

        try {

            const LIMIT_BLOCKS = 25;

            const startMin = Math.max(0, Blockchain.blockchain.blocks.length - LIMIT_BLOCKS);
            const endMax = Blockchain.blockchain.blocks.length;

            let block_start = req.block_start || startMin;
            let block_end = req.block_end || endMax;

            if (block_start < 0 || block_start > endMax) throw {message: "block start is not correct: " + block_start};
            if (block_end < 0 || block_end > endMax ) throw {message: "block end is not correct: " + block_start};

            if (block_end - block_start > LIMIT_BLOCKS) throw {message: "requested too many blocks: " + block_end - block_start  };

            const blocks_to_send = [];
            for (let i=block_start; i<block_end; i++)
                blocks_to_send.push( (await Blockchain.blockchain.getBlock(i)).toJSON() )

            return {result: true, blocks: blocks_to_send};

        } catch (exception) {
            return {result: false, message: exception.message};
        }

    }

    async block(req, res){

        let index = req.block;

        try {

            if (index < Blockchain.blockchain.blocksStartingPoint) throw {message: "Invalid index."};
            if (index > Blockchain.blockchain.blocks.length)       throw {message: "Block not found."};

            return {result: true, block: (await Blockchain.blockchain.getBlock(index)).toJSON()}

        } catch (exception) {
            return {result: false, message: "Invalid Block"};
        }

    }


}

export default new NodeAPIPublicBlocks();