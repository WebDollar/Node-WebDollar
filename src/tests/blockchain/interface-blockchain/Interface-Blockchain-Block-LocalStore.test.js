var assert = require('assert')
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import InterfaceBlockchainBlockData from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data'

describe('test blockchain save/load/remove blocks to/from local storage', () => {

    let blockchain = null;

    let db = new InterfaceSatoshminDB();
    let version = 1;
    let hash = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd30ca", "hex");
    let hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa", "hex");
    let timeStamp = 1994;
    let nonce = 1994;
    let minerAddress = '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4x';
    let data = new InterfaceBlockchainBlockData(blockchain, minerAddress, [], undefined); //it will compute the hashData
    let hashData = data.hashData;
    let height = 0;
    let block = null;
    
    let result = null;

    it('save/load/remove block to local storage, sample test', async () => {

        block = new InterfaceBlockchainBlock( blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db );

        result = await block.save();
        assert(result === true, 'save: ' + result);

        result = await block.load();
        assert(result === true, 'load: ' + result);

        assert(block.version === version,'block version differ after load: ' + block.version + '!==' + version);
        assert(block.hash.equals(hash),'block hash differ after load: ' + block.hash.toString('hex') + '!==' + hash.toString('hex'));
        assert(block.hashPrev.equals(hashPrev),'block hashPrev differ after load: ' + block.hashPrev.toString('hex') + '!==' + hashPrev.toString('hex'));
        assert(block.data.hashData.equals(hashData),'block hashData differ after load: ' + block.data.hashData.toString('hex') + '!==' + hashData.toString('hex'));
        assert(block.timeStamp === timeStamp,'block timeStamp differ after load: ' + block.timeStamp + '!==' + timeStamp);
        assert(block.nonce === nonce,'block nonce differ after load: ' + block.nonce + '!==' + nonce);
        assert(block.data.minerAddress.toString() === data.minerAddress.toString(),'block data.minerAddress differ after load: ' + block.data.minerAddress + '!==' + data.minerAddress);
        assert(block.height === height,'block height differ after load: ' + block.height + '!==' + height);

        result = await block.remove();
        assert(result === true, 'load: ' + result);
        
        result = await block.remove();
        assert(result !== true, 'load: ' + result);
    });
    
    it('remove block from local storage, sample test', async () => {

        block = new InterfaceBlockchainBlock( blockchain, version, hash, hashPrev, timeStamp, nonce, data, height, db );
        
        result = await block.save();
        assert(result === true, 'save: ' + result);
        
        result = await block.remove();
        assert(result === true, 'load: ' + result);
        
        result = block.load();
        assert(result !== true, 'load: block was found after remove. ' + result);
        
        result = block.load();
        assert(result !== true, 'load: block was found after remove. ' + result);
        
        result = block.load();
        assert(result !== true, 'load: block was found after remove. ' + result);

    });

});
