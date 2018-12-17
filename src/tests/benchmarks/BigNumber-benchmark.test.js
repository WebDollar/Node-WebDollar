/* eslint-disable */
import Serialization from 'common/utils/Serialization';
import TestsHelper from 'tests/Tests.helper'

var assert = require('assert')

describe('Decimal BenchMarks', () => {

    it('Creating 100K and Multiplication/Division', ()=>{

        let x = 6, y;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){
            x +=i ;
            y = x / 3523;
        }

        let end = new Date().getTime();
        let time = end - start;

        // console.log("Call to doSomething took " + time+ " milliseconds.")

    });

    it('creating 100K and Serialization/Deserialization', ()=>{

        let x = 6;
        let y, buffer;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){

            x += i * 2;
            y = x + TestsHelper.makeRandomNumber(undefined, false);

            buffer = Serialization.serializeNumber7Bytes(y);
            let y2 = Serialization.deserializeNumber7Bytes(buffer);

            assert(y2 === y, "Y and Y2 and not equals after serialization: "+y+"   "+y2)

        }
        let end = new Date().getTime();
        let time = end - start;

        // console.log("Call to doSomething took " + time+ " milliseconds.")

    });


});
