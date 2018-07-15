import Utils from "common/utils/helpers/Utils";
import Blockchain from "main-blockchain/Blockchain"

class NodeAPIPublicBlocks{



    blocks(req, res){

        let block_start = req.block_start;

        try {

            if (block_start >= Blockchain.blockchain.blocks.length) throw {message: "block start is not correct: " + block_start};

            let blocks_to_send = [];
            for (let i=block_start; i<Blockchain.blockchain.blocks.length; i++)
                blocks_to_send.push(Blockchain.blockchain.blocks[i].toJSON())

            return {result: true, blocks: blocks_to_send};

        } catch (exception) {
            return {result: false, message: exception.message};
        }

    }

    block(req, res){

        let index = req.block;

        try {

            if (index < Blockchain.blockchain.blocksStartingPoint) throw {message: "Invalid index."};
            if (index > Blockchain.blockchain.blocks.length)       throw {message: "Block not found."};

            return {result: true, block: Blockchain.blockchain.blocks[index].toJSON()}

        } catch (exception) {
            return {result: false, message: "Invalid Block"};
        }

    }


}

export default new NodeAPIPublicBlocks();