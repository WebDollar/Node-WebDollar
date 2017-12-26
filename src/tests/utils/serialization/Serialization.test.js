import Serialization from 'common/utils/Serialization';

var assert = require('assert')
var BigNumber = require('bignumber.js');

import TestsHelper from 'tests/Tests.helper'

describe('Serialization test', () => {

    it('Serialize Big Number number', ()=>{

        let v = TestsHelper.makeRandomBigNumbersArray(5000, true);

        for (let i=0; i<v.length; i++){

            let serialization = Serialization.serializeBigNumber(v[i]);
            let deserialization = Serialization.deserializeBigNumber(serialization).number;


            assert(deserialization.equals(v[i]), "serialization/deserialization of big number didn't work " + v[i].toString()+" "+deserialization.toString() );

        }
    });
});