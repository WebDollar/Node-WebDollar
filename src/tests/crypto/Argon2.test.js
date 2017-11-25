var assert = require('assert')
import Argon2 from 'common/crypto/Argon2/Argon2'
import TestsHelper from 'tests/tests.helper'


describe('Argon2', ()=>{

    it('Argon2 Hash ', async ()=>{

        const message1 = TestsHelper.makeid();
        const message1_copy = message1;

        const message2 = TestsHelper.makeid();

        let hash1 = await Argon2.hash(message1)
        let hash1_copy = await Argon2.hash(message1_copy)
        let hash2 = await Argon2.hash(message2)

        console.log(hash1);
        console.log(hash1_copy);
        console.log(hash2);

        // assert(typeof hash1 === 'string', "Hash1 is not String");
        // assert(typeof hash1_copy === 'string', "Hash1_copy is not String");
        // assert(typeof hash2 === 'string', "Hash2 is not String");
        //
        // assert(await WebDollarCrypt.verifyHashPOW(hash1, message1), "Hash1 is not good");
        // assert(await WebDollarCrypt.verifyHashPOW(hash1_copy, message1_copy) , "Hash1_copy is not good");
        // assert(await WebDollarCrypt.verifyHashPOW(hash2, message2) , "Hash2 is not good");
        //
        // assert(! await WebDollarCrypt.verifyHashPOW(hash1, message2), "Hash1 is not good because message2 "+message2);
        // assert(! await WebDollarCrypt.verifyHashPOW(hash1_copy, message2), "Hash1_copy is not good because message2 "+message2);
        // assert(! await WebDollarCrypt.verifyHashPOW(hash2, message1), "Hash2 is not good because message1 "+message1);


    })

});