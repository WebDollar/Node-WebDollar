import Serialization from 'common/utils/Serialization';

var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

describe('Serialization test', () => {

    it('Serialize WebDollarCoins', ()=>{

        let data = [WebDollarCoins.MAX_SAFE_COINS, 0, 1, 2, 3, 5, WebDollarCoins.MAX_SAFE_COINS-10, WebDollarCoins.MAX_SAFE_COINS-11 ];

        for (let i=0; i<data.length; i++){

            let y = data[i];

            let buffer = Serialization.serializeNumber8Bytes(y);
            let y2 = Serialization.deserializeNumber8BytesBuffer(buffer);

            assert(y2 === y, "Y and Y2 and not equals after serialization: "+y+"   "+y2);
            assert(y === y2, "Y and Y2 and not equals after serialization: "+y+"   "+y2);
        }

    });


    it('Serialize WebDollarCoins - many random ', ()=>{

        let v = TestsHelper.makeRandomNumbersArray(5000, true);
        let sum1 = 0;
        let sum2 = 0;

        for (let i=0; i<v.length; i++){

            sum1 +=v[i];

            let serialization = Serialization.serializeNumber8Bytes(v[i]);
            let deserialization = Serialization.deserializeNumber8BytesBuffer(serialization);

            assert(deserialization === v[i], "serialization/deserialization of 8 bytes didn't work " + v[i]+" "+deserialization );

            sum2 += deserialization;
        }

        assert(sum1 === sum2, "sum1 is not equal with sum 2");

    });


    it('Serialize WebDollarCoins tests ', ()=>{

        let v = ["321321",7500, "112","5555",32132333, 5551233, -51323, -0, 0, -312321312, -5553434, WebDollarCoins.MAX_SAFE_COINS, WebDollarCoins.MIN_SAFE_COINS];
        let x = [];

        for (let i=0; i<v.length; i++){

            x.push( v[i] );

            let serialization = Serialization.serializeNumber8Bytes(x[i]);
            let deserialization = Serialization.deserializeNumber8BytesBuffer(serialization);

            assert(deserialization === x[i], "serialization/deserialization of big number didn't work " + v[i]+" "+deserialization);

        }
    });

});