var assert = require('assert')
import WebDollarCrypt from 'common/blockchain/crypt/WebDollar-Crypt'

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

        assert(bytes.length, 50, 'getByteRandomValues should return ',count,' elements')

    })

    it('hash function ', async ()=>{

        const message1 = makeid();
        const message1_copy = message1;

        const message2 = makeid();

        let hash1 = await WebDollarCrypt.hashPOW(message1)
        let hash1_copy = await WebDollarCrypt.hashPOW(message1_copy)
        let hash2 = await WebDollarCrypt.hashPOW(message2)

        console.log(hash1);
        console.log(hash1_copy);

        assert(typeof hash1 === 'object' && Buffer.isBuffer(hash1) , "Hash1 is not Buffer");
        assert(typeof hash1_copy === 'string' && Buffer.isBuffer(hash1_copy), "Hash1 is not Buffer");
        assert(typeof hash2 === 'string' && Buffer.isBuffer(hash2) === "Buffer", "Hash1 is not Buffer");

        assert(hash1 === hash1_copy, "Hash1 and Hash1_copy are not Equal");
        assert(hash1 !== hash2, "Hash1 and Hash2 are not Different");

    })

    it('hash function string ', async ()=>{

        const message1 = makeid();
        const message1_copy = message1;

        const message2 = makeid();

        let hash1 = await WebDollarCrypt.hashPOWString(message1)
        let hash1_copy = await WebDollarCrypt.hashPOWString(message1_copy)
        let hash2 = await WebDollarCrypt.hashPOWString(message2)

        console.log(hash1);
        console.log(hash1_copy);

        assert(typeof hash1 === 'string', "Hash1 is not String");
        assert(typeof hash1_copy === 'string', "Hash1 is not String");
        assert(typeof hash2 === 'string', "Hash1 is not String");

        assert(hash1 === hash1_copy, "Hash1 and Hash1_copy are not Equal");
        assert(hash1 !== hash2, "Hash1 and Hash2 are not Different");

    })

})


function makeid(count) {

  if (typeof count === 'undefined') count = Math.floor(Math.random()*100)

  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < count; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}
