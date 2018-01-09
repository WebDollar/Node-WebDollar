import InterfaceBlockchainBlock from "../../../common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block";

var assert = require('assert')

import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import consts from 'consts/const_global'

describe('test PPoW-Blockchain interlink data structure', () => {

    let blockchain = null;
    let response = null;

    it('test blockchain ppow interlink', async () => {

        blockchain = new PPoWBlockchain();

        //values are optained from mining simulation :)
        let input = [
            {"hashPrev":"7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa","nonce":168,"difficultyTarget":"187097214288231334040962710376665673292681107658581124152300718972996320839555317"},
            {"hashPrev":"0156a5d7cfff0753d08f521b0a15845902722f0be9665378731aa777a8a66ef2","nonce":42,"difficultyTarget":"187188570349895509497037399200091779578468549605680040716828209558432354199340256"},
            {"hashPrev":"0374f81cba266e5aeee74fe6c5a19ff1c3eb1682f1b5aba735327ae6a9f1a6dc","nonce":3,"difficultyTarget":"187279971019011669413783999492669949392715848702167189174209473332630807497289152"},
            {"hashPrev":"03c3582647733d83d79ef6f560ba3cad4a58a219c2e7cc6638d4803d6dea9435","nonce":35,"difficultyTarget":"187371416317360796205489948711172229641442760737666294247048442802031506133762437"},
            {"hashPrev":"0565d0c2d89dbf9c03be3498e95df1183ea4f957915caa0af7b28e8676ccf0ac","nonce":33,"difficultyTarget":"187462906266734507531762160600191356706697371460682732867286259424493435580116813"},
            {"hashPrev":"05ac6928d15baf80fdc6fc720ef89e82f385e625daea2961a1e2b3ff3492e5ed","nonce":69,"difficultyTarget":"187554440888935061490517903842671918892589313536591269357944114043353051515458666"},
            {"hashPrev":"02fd6ab34e314de57c06f8a4c6df9465835e73f6ac8a8900454ea469ff7ff059","nonce":60,"difficultyTarget":"187646020205775361813511320787907598540486085662341558063685297692788282497643948"},
            {"hashPrev":"05d1171f452e782ad00ddf54f80eaf6a871de0fd04c29789776ca7465e6c7b69","nonce":58,"difficultyTarget":"187737644239078963064396824362511069047585932383856373277583581529552339276207250"},
            {"hashPrev":"0002f16f6969d36db166a0c8cb8e40befb14b0d89f8fc820900194afe89ee213","nonce":64,"difficultyTarget":"187829313010680075839330611874406826405519323952403178147348026637721066004369460"},
            {"hashPrev":"04e34f9723063bf3168c315a1fa251062dc32ab0ddc173c076cd458cd65b7dce","nonce":65,"difficultyTarget":"187921026542423571970111535024736126613725143934801812511677786416352765743629406"},
            {"hashPrev":"05ae71ada24763017b801e9fd4cc97bbf5469c0998b253f6036ba4c43f63e02f","nonce":15,"difficultyTarget":"188012784856164989729862566047697423550548251915238727459193254085501375492527662"},
            {"hashPrev":"03b563b41dc25ebc776d014fc5836638cb632dca026d5c76794194b4ade806c0","nonce":55,"difficultyTarget":"188104587973770539041254100503775400808141293053869215119085438291597811711029872"},
            {"hashPrev":"01b958428bf8f237f4f65286b434ac16a05f08ae9341e8f10026f8b7599c5733","nonce":53,"difficultyTarget":"188196435917117106687270337857537009890567143294618174696780304228263630955029398"},
            {"hashPrev":"05a777f7af1ad41f6dcf5a3fa53ac552d06d0356a8a58d16f35ac312a12059d9","nonce":109,"difficultyTarget":"188288328708092261524519981577194010383677771782554999977393966486187587806081658"}];


        for (let i = 0; i < input.length; ++i) {
            blockchain.blocks[i] = new PPoWBlockchainBlock(blockchain, 0x01, new Buffer(consts.BLOCKS_POW_LENGTH), input[i].hashPrev, undefined, input[i].nonce, undefined, 0, blockchain.db);
            blockchain.blocks[i].difficultyTarget = input[i].difficultyTarget;
        }

        //check if links point correctly
        for (let i = 0; i < blockchain.blocks.length; ++i){
            let block = blockchain.blocks[i];
            console.log('B.height=', block.height, block.interlink.length);
            for (let j = 0; j < block.interlink.length; ++j){
                let link = block.interlink[i];
                console.log('height=', link.height);
                console.log('blockId=', link.blockId);
            }
        }

    });

});
