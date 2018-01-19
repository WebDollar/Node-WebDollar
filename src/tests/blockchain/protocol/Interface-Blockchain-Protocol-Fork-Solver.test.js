var assert = require('assert')
import TestsHelper from 'tests/Tests.helper'

import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'

let a,b;

function binarySearch(left, right){

    let mid = Math.trunc( (left+right)/2 );

    if (left >= right){

        if (a[mid] !== b[mid]) {
            //console.log("pos", mid, "vals", a[mid], b[mid])
            return mid;
        }
        else return -1;

    }

    if ( a[mid] !== b[mid] ) return binarySearch(left, mid);
    else return binarySearch(mid+1, right);

}


describe('test Interface Blockchain Protocol Fork Solver', () => {


    it('binary search test', ()=>{

        a = [0,0,0,0,1,1,1];
        b = [0,0,0,2,2,2,2];
        assert(binarySearch(0, a.length-1, a,b) === 3, "test 1 didn't work");

        a = [0,0,0,0,1,1,1];
        b = [0,0,0,0,1,1,1];
        assert(binarySearch(0, a.length-1, a,b) === -1, "test 2 didn't work");


        a = [0,0,0,0,1,1,1];
        b = [0,0,0,0,1,1,0];
        assert(binarySearch(0, a.length-1, a,b) === (a.length-1), "test 3 didn't work");

        a = [0,1,0,0,1,1,1];
        b = [0,3,3,3,3,3,3];
        assert(binarySearch(0, a.length-1, a,b) === 1, "test 4 didn't work");

        let tests = Math.floor(Math.random()*1000)+100;
        for (let i=0; i<tests; i++){

            let test = TestsHelper.makeId(40, true);
            let test2 ='';

            let pos = Math.floor(Math.random() * (test.length+1)-1 );

            for (let i=0; i<test.length; i++)
                if (i < pos || pos === -1)
                    test2 +=  test[i];
                else
                    test2 += '`';


            a = test;
            b = test2;
            assert(binarySearch(0, test.length-1, test, test2) === pos, "testdn't work on "+a+b);

        }

    });



});

