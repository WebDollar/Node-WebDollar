import BlockchainGenesis from "../../../common/blockchain/interface-blockchain/blocks/Blockchain-Genesis";

var assert = require('assert')
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

describe('test blockchain save blocks to local storage', () => {

    let db = new InterfacePouchDB();
    let version = 1;
    let hash = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd30ca", "hex");
    let hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa", "hex");
    let hashData = new Buffer('1F1tAaz5Nn4xqX', 'hex');
    let timeStamp = 1994;
    let nonce = 1994;
    let minerAddress = '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4x';
    let data = {minerAddress: minerAddress, transactions: []};
    let height = 0;
    let block = null;

    it('save blocks to local storage, sample test', ()=>{

        block = new InterfaceBlockchainBlock( version, hash, hashPrev, hashData, timeStamp, nonce, data, height, db );

        return block.save().then((result) => {
            
            return block.load().then((result) => {
                
                assert(block.version === version,'block version differ after load: ' + block.version + '!==' + version);
                assert(block.hash.equals(hash),'block hash differ after load: ' + block.hash.toString('hex') + '!==' + hash.toString('hex'));
                assert(block.hashPrev.equals(hashPrev),'block hashPrev differ after load: ' + block.hashPrev.toString('hex') + '!==' + hashPrev.toString('hex'));
                assert(block.hashData.equals(hashData),'block hashData differ after load: ' + block.hashData.toString('hex') + '!==' + hashData.toString('hex'));
                assert(block.timeStamp === timeStamp,'block timeStamp differ after load: ' + block.timeStamp + '!==' + timeStamp);
                assert(block.nonce === nonce,'block nonce differ after load: ' + block.nonce + '!==' + nonce);
                assert(block.data.minerAddress.toString() === data.minerAddress.toString(),'block data.minerAddress differ after load: ' + block.data.minerAddress + '!==' + data.minerAddress);
                assert(block.height === height,'block height differ after load: ' + block.height + '!==' + height);
            
            });
        
        });

    });

});
