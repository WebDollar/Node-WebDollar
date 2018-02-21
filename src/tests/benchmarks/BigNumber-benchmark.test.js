import Serialization from 'common/utils/Serialization';

var assert = require('assert')
var BigNumber = require('bignumber.js');

import TestsHelper from 'tests/Tests.helper'

describe('BigNumber BenchMarks', () => {

    it('Creating 100K BigNumbers and Multiplication/Division', ()=>{

        let x = new BigNumber(6), y;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){
            x = x.plus(new BigNumber(i) );
            y = x.dividedBy( 3.523);
        }

        let end = new Date().getTime();
        let time = end - start;

        console.log("Call to doSomething took " + time+ " milliseconds.")

    });

    it('creating 100K BigNumbers and Serialization/Deserialization', ()=>{

        let x = new BigNumber(6);
        let y, buffer;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){
            x = x.plus(new BigNumber(i) );
            y = x.dividedBy( 3.523);

            buffer = Serialization.serializeBigNumber(y);
            let y2 = Serialization.deserializeBigNumber(buffer).number;

            assert(y2.isEqualTo(y), "Y and Y2 and not equals after serialization")

        }
        let end = new Date().getTime();
        let time = end - start;

        console.log("Call to doSomething took " + time+ " milliseconds.")

    });


});