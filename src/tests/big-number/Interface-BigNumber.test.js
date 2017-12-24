var assert = require('assert')
var BigDecimal = require('decimal.js');

import TestsHelper from 'tests/Tests.helper'

describe('interfaceBigNumber', () => {

    it('creating big number', ()=>{

        let v = TestsHelper.makeRandomBigNumbersArray(5000, true);
        let sum1 = new BigDecimal(0);
        let sum2 = new BigDecimal(0);
        let prod1 = new BigDecimal(1);
        let prod2 = new BigDecimal(1);

        for (let i = 0; i < v.length; ++i) {
            sum1 = sum1.plus(v[i]);
            sum2 = sum2.minus(v[i]);
            prod1 = prod1.mul(v[i]);
            prod2 = prod2.mul(v[i]);
        }
        let diff1 = sum1.minus(sum2).minus(sum1.mul(new BigDecimal(2)));
        let diff2 = sum1.plus(sum2);
        let diff3 = prod1.minus(prod2)

        assert(diff1.equals(new BigDecimal(0)), diff1 + "!=" + 0);
        assert(diff2.equals(new BigDecimal(0)), diff2 + "!=" + 0);
        assert(diff3.equals(new BigDecimal(0)), diff3 + "!=" + 0);
    });
});