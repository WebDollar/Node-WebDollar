var assert = require('assert')
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'
import Blockchain from 'main-blockchain/Blockchain';
import consts from "consts/const_global"

describe('test Interface-Block save/load/remove to/from local storage', () => {


    let db = new InterfaceSatoshminDB();
    let version = consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION;
    let hash = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd30ca", "hex");
    let hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa", "hex");
    let timeStamp = Math.trunc(Math.random() * 100000);
    let nonce = Math.trunc(Math.random() * 1000);
    let minerAddress = BlockchainGenesis.minerAddress;
    let data = new InterfaceBlockchainBlockData(Blockchain.blockchain, minerAddress, [], undefined, undefined); //it will compute the hashData
    let height = Math.trunc(Math.random() * 1000);
    let block = null;
    
    let result = null;

    it('save/load/remove block to local storage, sample test', async () => {

        block = new InterfaceBlockchainBlock( Blockchain.blockchain,  Blockchain.blockchain.createBlockValidation(), version, hash, hashPrev, timeStamp, nonce, data, height, db );

        result = await block.saveBlock();
        assert(result === true, 'save: ' + result);

        result = await block.loadBlock();
        assert(result === true, 'load: ' + result);

        assert(block.version === version,'block version differ after load: ' + block.version + '!==' + version);
        assert(block.hash.equals(hash),'block hash differ after load: ' + block.hash.toString('hex') + '!==' + hash.toString('hex'));
        assert(block.hashPrev.equals(hashPrev),'block hashPrev differ after load: ' + block.hashPrev.toString('hex') + '!==' + hashPrev.toString('hex'));
        assert(block.data.equals(data),'block.data differ after load: ' + block.data.toString() + '!==' + data.toString());
        assert(block.timeStamp === timeStamp,'block timeStamp differ after load: ' + block.timeStamp + '!==' + timeStamp);
        assert(block.nonce === nonce,'block nonce differ after load: ' + block.nonce + '!==' + nonce);
        assert(block.data.minerAddress.toString() === data.minerAddress.toString(),'block data.minerAddress differ after load: ' + block.data.minerAddress + '!==' + data.minerAddress);
        assert(block.height === height,'block height differ after load: ' + block.height + '!==' + height);

        result = await block.removeBlock();
        assert(result === true, 'remove: ' + result);
        
        result = await block.removeBlock();
        assert(result !== true, 'remove: ' + result);
    });
    
    it('remove block from local storage, sample test', async () => {

        block = new InterfaceBlockchainBlock( Blockchain.blockchain,  Blockchain.blockchain.createBlockValidation(),  version, hash, hashPrev, timeStamp, nonce, data, height, db );
        
        result = await block.saveBlock();
        assert(result === true, 'save: ' + result);
        
        result = await block.removeBlock();
        assert(result === true, 'remove: ' + result);
        
        result = block.loadBlock();
        assert(result !== true, 'load: block was found after remove. ' + result);
        
        result = block.loadBlock();
        assert(result !== true, 'load: block was found after remove. ' + result);
        
        result = block.loadBlock();
        assert(result !== true, 'load: block was found after remove. ' + result);

    });

});
