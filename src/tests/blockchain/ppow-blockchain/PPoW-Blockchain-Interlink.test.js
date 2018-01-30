import InterfaceBlockchainBlock from "common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block";

var assert = require('assert')

import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import MiniBlockcainBlock from 'common/blockchain/mini-blockchain/blocks/Mini-Blockchain-Block'
import MiniBlockcain from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import WebDollarCrypto from "../../../common/crypto/WebDollar-Crypto";

describe('test PPoW-Blockchain interlink data structure', () => {

    let blockchain = null;

    it('test serialize interlink data structure', async () => {

        let numInterlinks = 255;
        let logLen = Math.trunc(Math.log(numInterlinks));
        let interlink = [];
        let height = [];
        let blockId = [];
        let blockchain = new MiniBlockcain();
        let block = new MiniBlockcainBlock( blockchain, 0x01, new Buffer(consts.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 0, blockchain.db );

        for (let i = 0; i < logLen; ++i) {
            height.push(i);
            blockId.push( await WebDollarCrypto.hashPOW(WebDollarCrypto.getBufferRandomValues()) );
        }

        for (let i = 0; i < numInterlinks; ++i) {
            let pos = Math.trunc(Math.random() * 10000) % logLen;
            interlink.push( {height: height[pos], blockId: blockId[pos]} );
        }

        block.interlink = interlink;
        let serializedBuffer = block._serializeInterlink();
        block._deserializeInterlink(serializedBuffer, 0);

        assert(block.interlink.length === interlink.length, "Interlink length differ: " + block.interlink.length + "!==" + interlink.length);

        for (let i = 0; i < interlink.length; ++i) {
            assert(block.interlink[i].height === interlink[i].height, "Interlink height differ: " + block.interlink[i].height + "!==" + interlink[i].height);
            assert(block.interlink[i].blockId.equals(interlink[i].blockId), "Interlink blockId differ: " + block.interlink[i].blockId.toString("hex") + "!==" + interlink[i].blockId.toString("hex") + "i = " + i);
        }

    });

    it('test creating Interlink data structure', async () => {

        blockchain = new MiniBlockcain();

        //values are optained from mining simulation :)
        let serialized = [
            "025ec280b8ca448ec70618e4827e429b77733a85658dc772c0c14df282a861110000007e00017bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa0008f9d3d829b44ce8486bb09df9a79821ce767e0ed6b3fd20c65f5dd857fce114ace6f233c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456f10db1a01b2e8aab1e7a79aab25285577f10f0666e88daba63ee1bb364479a1301000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00296236b36b8f21a0e0f554d2f6422c541f7f4dcb8e41cf95059c9e2ce9c247000000de0001025ec280b8ca448ec70618e4827e429b77733a85658dc772c0c14df282a861110008f9d3142ec1e94d939a1737a67d531dc1b6f94adcab60dbb94c5f1d4da2be52edb70f33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456bb551471275b3e82811c1519c2eefb16282cce81979a3703beb85c6447ee59c401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "019b2a7f10ac315de98954b8afe1d7ce452f58a143ac9c87504d20e5598d3fe30000004e000100296236b36b8f21a0e0f554d2f6422c541f7f4dcb8e41cf95059c9e2ce9c2470008f9d4fed3807d07c73fd4b837161d2e5042970ac1cb22dd7060d9cbd2dfa9158cb82033c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94569a7ca6a3a4482838f49355a6a7e2fa7727d566ef7fc959042e7c16aa778260ee01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "0067a52c02b7c232f8d2a59d483522b213eebc26ae14a7f0f04388c3d5a3f3f60000000f0001019b2a7f10ac315de98954b8afe1d7ce452f58a143ac9c87504d20e5598d3fe30008f9d48c145debb944be15cf80f4fd069e06e0b88766b223350b82a6ef49848f03a6ad33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945649325f7af52ea60d66cd538baccedfd9ad000cdddc5b7e79ec3a1f5b065562dd01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00fe3765a2a3f1137e6738f69db727f950442bffd02001c1ea715e31f9c3a6980000013000010067a52c02b7c232f8d2a59d483522b213eebc26ae14a7f0f04388c3d5a3f3f60008f9d49192227eb00023aec5535a1e8da45143e450bd7c1e55af1a350aa95b1a91639033c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945666ac4f30c54d6adf4f659403d40614d351bfa5a3d500f1b96ef639090aa5c65101000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "019f25a33aab0c89e56c91b2e022e8a18467bbf8bf3798396108bf2bac8ca1f700000076000100fe3765a2a3f1137e6738f69db727f950442bffd02001c1ea715e31f9c3a6980008f9d58ff72204b68ab9e5c0262a58252ca05648d8b1e4a028f80ade77ec0c6f0ae91b33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94563e93ee6f168054451a37fe98c80a7c1e96b3fafb3366f4545bb1604feddc8dfa01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00e3f441e79c99f169e76e4de2c37fa4ccb593eb1c34c8bda007d3734aec3ac5000000580001019f25a33aab0c89e56c91b2e022e8a18467bbf8bf3798396108bf2bac8ca1f70008f9d5b50ccf2ccbfc434e392b8880e940d63f1354355b1f8174e652bfcc96f67888ff33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456849ea604058ec5cb2b8719162ca850c45ccc6dc12f8c85513bfa651521d5c19e01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00d66b2e90dce7731438084353f6b40547f9d1fe67ec8188bd7f6cf1f14602830000003c000100e3f441e79c99f169e76e4de2c37fa4ccb593eb1c34c8bda007d3734aec3ac50008f9d6edf8584628a1e4094ad5f004790ab5f6ed25983958d3206bc63fe55b53f9dceb33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456a6ff8a70adce9d5c52c33f12e859f30cce93db4f08d65fa2f908f5164e1ed94c01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00fedc614c9f42825b2f05039e54798c06c1b8528362b17485ef5c0b5d92016700000043000100d66b2e90dce7731438084353f6b40547f9d1fe67ec8188bd7f6cf1f14602830008f9d69486d89401aa74e3f673ed92b5be8618b8a9e5250cb61aaa0c9046d2dec7c43b33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94568ffc07ab8b93fadea3bd0f27a0f16fa2efa0da6e5b91e28b2007231d715a3fb401000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00779cc96f476602ad3e72be1f3b11ca3afd39ee1346908d7c7d77174d42aa9200000047000100fedc614c9f42825b2f05039e54798c06c1b8528362b17485ef5c0b5d9201670008f9d6a973a5e354bd51f964b085344d928a6a40b4a760019de4feac8a21f9fbce84c133c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c94563aefef98b2d1f7de37352f6ddea787bc4b059d5685c53373b3596b0fc0c0708901000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa",
            "00e48a2b24940e125acaad47410b27f127e2a7353b2df114a090b7f4e8f7033200000075000100779cc96f476602ad3e72be1f3b11ca3afd39ee1346908d7c7d77174d42aa920008f9d629b473bb9fbf9515d3a9fe2c7b3a995a88bd9b0b63921671ba413229281ea85a33c871f3c26cd3e08b14737162ad67f5b7e2d8a3e09d217266203492d58b33a35df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c945671a867b242cbe55463ef9fe18201a0b7e83fe6e2ff320ffc5a4cce943301ab2b01000000007bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa"
            ];

        //create a dummy block and deserialize from serialized array
        
        for (let i = 0; i < serialized.length; ++i) {

            let block = new MiniBlockcainBlock( blockchain, 0x01, new Buffer(consts.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKS_POW_LENGTH), undefined, undefined, undefined, i, blockchain.db );
            let buffer = new Buffer(serialized[i], 'hex');

            block.deserializeBlock(buffer);

            await blockchain.includeBlockchainBlock(block, undefined, undefined, false, {});
        }
    });

    it('test links validity', async () => {

        for (let i = 0; i < blockchain.blocks.length; ++i){
            let block = blockchain.blocks[i];

            console.log('interlink=', block.interlink);
            assert(block.interlink[0].height === -1, "Genesis height !== -1, height=" + block.interlink[0].height);
            assert(block.interlink[0].blockId.equals(BlockchainGenesis.hashPrev), "Genesis hash differ: " + block.interlink[0].blockId.toString('hex') + "!==" + BlockchainGenesis.hashPrev.toString('hex'));

            for (let j = 1; j < block.interlink.length; ++j){
                let link = block.interlink[j];
                let prevBlock = blockchain.blocks[link.height];
                assert(prevBlock.hash.equals(link.blockId), "prevHash differ: " + prevBlock.hash.toString('hex') + "!==" + link.blockId.toString('hex'));
            }
        }
    });

   /*it('test validation with Interlink', async () => {

        let sol = [];

        //check if links point correctly
        for (let i = 0; i < blockchain.blocks.length; ++i){
            let block = blockchain.blocks[i];
            sol.push(1);

            for (let j = 0; j < block.interlink.length; ++j){
                let link = block.interlink[j];
                let prevBlock = blockchain.blocks[link.height];

                //link must point to a block which has a path to Genesis
                //assert(sol[] === 1);
            }

            //each block mush have a path to Genesis
            assert(sol[i] === 1, "Block doesn't have path to Genesis" + block.interlink );
        }

    });*/

});
