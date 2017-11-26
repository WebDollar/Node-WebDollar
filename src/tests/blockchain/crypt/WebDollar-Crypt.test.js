var assert = require('assert')

import WebDollarCrypt from 'common/crypto/WebDollar-Crypt'
import TestsHelper from 'tests/tests.helper'

describe('WebDollar crypt', ()=>{

    it('encodeBase64 - should return encoded', async ()=>{

        let bytes = [255, 0, 1,2,3,4, 255, 10]
        let result = WebDollarCrypt.encodeBase64(bytes);

        console.log("REEESULT" , result)
        assert(typeof result === 'string', 'encodeBase64 is not STRING')
        assert(result.length > bytes.length, result.length+' encodeBase64 doesnt match the length of bytes')

    })

    it('getByteRandomValues ', ()=>{

        const count = Math.floor(Math.random()*200);
        let bytes = WebDollarCrypt.getByteRandomValues(count)

        assert(bytes.length === count, 'getByteRandomValues should return '+count+' elements')

    })

    it('hash Proof Of Work function ', async ()=>{

        const message1 = TestsHelper.makeid();
        const message1_copy = message1;

        const message2 = TestsHelper.makeid();

        let hash1 = await WebDollarCrypt.hashPOW(message1)
        let hash1_copy = await WebDollarCrypt.hashPOW(message1_copy)
        let hash2 = await WebDollarCrypt.hashPOW(message2)

        console.log("POW buffer ",hash1, typeof hash1, Buffer.isBuffer(hash1));
        console.log("POW buffer ",hash1_copy, typeof hash1_copy, Buffer.isBuffer(hash1_copy));
        console.log("POW buffer ",hash2, typeof hash2, Buffer.isBuffer(hash2));


        assert(typeof hash1 === 'object' && Buffer.isBuffer(hash1), "Hash1 is not Buffer");
        assert(typeof hash1_copy === 'object' && Buffer.isBuffer(hash1_copy), "Hash1_copy is not Buffer");
        assert(typeof hash2 === 'object' && Buffer.isBuffer(hash2), "Hash2 is not Buffer");

        assert(await WebDollarCrypt.verifyHashPOW(hash1, message1), "Hash1 is not good");
        assert(await WebDollarCrypt.verifyHashPOW(hash1_copy, message1_copy) , "Hash1_copy is not good");
        assert(await WebDollarCrypt.verifyHashPOW(hash2, message2) , "Hash2 is not good");

        assert(! await WebDollarCrypt.verifyHashPOW(hash1, message2), "Hash1 is not good because message2 "+message2);
        assert(! await WebDollarCrypt.verifyHashPOW(hash1_copy, message2), "Hash1_copy is not good because message2 "+message2);
        assert(! await WebDollarCrypt.verifyHashPOW(hash2, message1), "Hash2 is not good because message1 "+message1);
    })

    it('hash Proof Of Work function string ', async ()=>{

        const message1 = TestsHelper.makeid();
        const message1_copy = message1;

        const message2 = TestsHelper.makeid();

        let hash1 = await WebDollarCrypt.hashPOW_String(message1)
        let hash1_copy = await WebDollarCrypt.hashPOW_String(message1_copy)
        let hash2 = await WebDollarCrypt.hashPOW_String(message2)

        console.log(hash1);
        console.log(hash1_copy);

        assert(typeof hash1 === 'string', "Hash1 is not String");
        assert(typeof hash1_copy === 'string', "Hash1_copy is not String");
        assert(typeof hash2 === 'string', "Hash2 is not String");

        assert(await WebDollarCrypt.verifyHashPOW(hash1, message1), "Hash1 is not good");
        assert(await WebDollarCrypt.verifyHashPOW(hash1_copy, message1_copy) , "Hash1_copy is not good");
        assert(await WebDollarCrypt.verifyHashPOW(hash2, message2) , "Hash2 is not good");

        assert(! await WebDollarCrypt.verifyHashPOW(hash1, message2), "Hash1 is not good because message2 "+message2);
        assert(! await WebDollarCrypt.verifyHashPOW(hash1_copy, message2), "Hash1_copy is not good because message2 "+message2);
        assert(! await WebDollarCrypt.verifyHashPOW(hash2, message1), "Hash2 is not good because message1 "+message1);


    })

})



