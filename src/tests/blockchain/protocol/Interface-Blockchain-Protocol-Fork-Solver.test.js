
var assert = require('assert')


import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/blockchain-protocol/Interface-Blockchain-Protocol-Fork-Solver'


function binarySearch(left, right, a, b){

    let mid = Math.floor( (left+right)/2 );

    if (left >= right){

        if (a[mid] !== b[mid]) {
            console.log("pos", mid, "vals", a[mid], b[mid])
            return mid;
        }
        else return -1;

    }

    if ( a[mid] !== b[mid] ) return binarySearch(left, mid);
    else return binarySearch(mid+1, right);

}


describe('test Interface Blockchain Protocol Fork Solver', () => {


    it('binary search test', ()=>{

        let a,b;

        a = [0,0,0,0,1,1,1];
        b = [0,0,0,2,2,2,2];
        assert(binarySearch(0, a.length-1, a,b) === 3, "test 1 didn't work");

        a = [0,0,0,0,1,1,1];
        b = [0,0,0,0,1,1,1];
        assert(binarySearch(0, a.length-1, a,b) === -1, "test 2 didn't work");


        a = [0,0,0,0,1,1,1];
        b = [0,0,0,0,1,1,0];
        assert(binarySearch(0, a.length-1, a,b) === a.length-1, "test 3 didn't work");

        a = [0,1,0,0,1,1,1];
        b = [0,0,0,0,0,0,0];
        assert(binarySearch(0, a.length-1, a,b) === 1, "test 4 didn't work");

    });



});

