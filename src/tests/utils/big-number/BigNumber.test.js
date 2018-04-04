var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'

describe('test', () => {


    it('creating WebDollarCoins number', ()=>{

        let v = TestsHelper.makeRandomNumbersArray(5000, true);

        let sum1 = 0;
        let sum2 = 0;

        for (let i = 0; i < v.length; ++i) {
            sum1 += v[i];
            sum2 -= v[i];
        }

        let diff1 = sum1-sum2-sum1*2;
        let diff2 = sum1+sum2;

        assert(diff1===0, diff1 + "!=" + 0);
        assert(diff2===0, diff2 + "!=" + 0);
    });

    it('Big Number 1/3+1/3+1/3 === 1', ()=>{

        let a = 55555;
        let b = 33333;

        //console.log("1/3+1/3+1/3", b);
        assert( a + b === 88888, "55555 + 33333");
        assert( a - b === - (b-a), "a-b === b-a");

    });
});