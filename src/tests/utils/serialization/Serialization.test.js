import Serialization from 'common/utils/Serialization';

var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'

describe('Serialization test', () => {

    it('Serialize Big Number - many random ', ()=>{

        let v = TestsHelper.makeRandomNumbersArray(5000, true, true);
        let sum1 = 0;
        let sum2 = 0;

        for (let i=0; i<v.length; i++){

            sum1 +=v[i];

            let serialization = Serialization.serializeNumber8Bytes(v[i]);
            let deserialization = Serialization.deserializeNumber(serialization).number;

            assert(deserialization === v[i], "serialization/deserialization of big number didn't work " + v[i].toString()+" "+deserialization.toString() );
            //console.log(v[i],deserialization.toString());

            sum2 += deserialization;
        }

        assert(sum1 === sum2, "sum1 is not equal with sum 2");

    });

    it('Serialize Big Number tests ', ()=>{

        let v = ["0.000661817095001",7500, "0","100000","-10000","-10", "10.00004","10","-10000","-0.1","-0.000000000000000000001","5.5","1","999999999999999999999999998","0.000000000055","555555.555555555555","-.999999999999999", "9999999999999999999999999999999999999.9999999999999999999999"]
        let x = [];

        for (let i=0; i<v.length; i++){

            x.push( v[i] );

            let serialization = Serialization.serializeNumber8Bytes(x[i]);
            let deserialization = Serialization.deserializeNumber(serialization).number;

            //console.log(v[i], serialization.toString("hex"), deserialization);

            assert(deserialization === x[i], "serialization/deserialization of big number didn't work " + v[i].toString()+" "+deserialization.toString() );

        }
    });

});