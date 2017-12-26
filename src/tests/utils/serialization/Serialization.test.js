import Serialization from 'common/utils/Serialization';

var assert = require('assert')
var BigNumber = require('bignumber.js');

import TestsHelper from 'tests/Tests.helper'

describe('Serialization test', () => {

    it('Serialize Big Number - many random ', ()=>{

        let v = TestsHelper.makeRandomBigNumbersArray(5000, true);

        for (let i=0; i<v.length; i++){

            let serialization = Serialization.serializeBigNumber(v[i]);
            let deserialization = Serialization.deserializeBigNumber(serialization).number;


            assert(deserialization.equals(v[i]), "serialization/deserialization of big number didn't work " + v[i].toString()+" "+deserialization.toString() );

        }
    });

    it('Serialize Big Number tests ', ()=>{

        let v = ["0","-0.1","-0.000000000000000000001","5.5","1","999999999999999999999999998","0.000000000055","555555.555555555555","-.999999999999999", "9999999999999999999999999999999999999.9999999999999999999999"]

        for (let i=0; i<v.length; i++){

            v[i] = new BigNumber(v[i]);

            let serialization = Serialization.serializeBigNumber(v[i]);
            let deserialization = Serialization.deserializeBigNumber(serialization).number;


            assert(deserialization.equals(v[i]), "serialization/deserialization of big number didn't work " + v[i].toString()+" "+deserialization.toString() );

        }
    });

});