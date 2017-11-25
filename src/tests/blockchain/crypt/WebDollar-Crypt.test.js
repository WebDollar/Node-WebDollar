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

})

