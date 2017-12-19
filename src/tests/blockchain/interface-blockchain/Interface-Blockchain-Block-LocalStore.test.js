import BlockchainGenesis from "../../../common/blockchain/interface-blockchain/blocks/Blockchain-Genesis";

var assert = require('assert')
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import InterfacePouchDB from 'common/pouchdb/Interface-PouchDB'

describe('test blockchain save blocks to local storage', () => {

    let db = new InterfacePouchDB();
    let version = 1;
    let hash = new Buffer("7bb3e84e6892c7e95d50b5462806b92be0cbccd31fa", "hex");
    let hashPrev = new Buffer("7bb3e84e6892c7e76be2beedb94a1035b7f095d50b5462806b92be0cbccd31fa", "hex");
    let hashData = '1F1tAaz5Nn4xqX';
    let timeStamp = 1994;
    let nonce = 1994;
    let minerAddress = '1F1tAaz5x1HUXrCNLbtMDqcw6o5GNn4xqX';
    let data = {minerAddress: minerAddress, transactions: []};
    let height = 0;

    it('save blocks to local storage, sample test', ()=>{

        let block = new InterfaceBlockchainBlock( version, hash, hashPrev, hashData, timeStamp, nonce, data, height, db );
        block.save(db);
        block.version = 0;

        block.load(db);

        assert(block.version === version,'block version differ after load: ' + block.version + '!==' + version);
      /*  assert(block.hash === hash,'block version differ after load: ' + block.hash + '!==' + hash);
        assert(block.hashPrev === hashPrev,'block hashPrev differ after load: ' + block.hashPrev + '!==' + hashPrev);
        assert(block.hashData === hashData,'block hashData differ after load: ' + block.hashData + '!==' + hashData);
        assert(block.timeStamp === timeStamp,'block timeStamp differ after load: ' + block.timeStamp + '!==' + timeStamp);
        assert(block.nonce === nonce,'block nonce differ after load: ' + block.nonce + '!==' + nonce);
        assert(block.data === data,'block data differ after load: ' + block.data + '!==' + data);
        assert(block.height === height,'block height differ after load: ' + block.height + '!==' + height);*/
    });

});
