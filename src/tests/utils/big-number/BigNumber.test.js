var assert = require('assert')

//big number replaced

import TestsHelper from 'tests/Tests.helper'

describe('test', () => {

    it('creating big number', ()=>{

        let v = TestsHelper.makeRandomNumbersArray(5000, true, true);

        let sum1 = 0;
        let sum2 = 0;
        let prod1 = 1;
        let prod2 = 1;

        for (let i = 0; i < v.length; ++i) {
            sum1 += v[i];
            sum2 -= v[i];
            prod1 *= v[i];
            prod2 *= v[i];
        }
        let diff1 = sum1-sum2-sum1*2;
        let diff2 = sum1+sum2;
        let diff3 = prod1-prod2;

        assert(diff1===0, diff1 + "!=" + 0);
        assert(diff2===0, diff2 + "!=" + 0);
        assert(diff3===0, diff3 + "!=" + 0);
    });

    it('Big Number 1/3+1/3+1/3 === 1', ()=>{

        let a = 1/3;
        let b = a+a+ 1/3;

        //console.log("1/3+1/3+1/3", b);
        assert(b>0.999999999999, "1/3+1/3+1/3 >= 0.999999999999");
        assert(b<1.0, "1/3+1/3+1/3 < 1");

    });
});