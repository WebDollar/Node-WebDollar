import Serialization from 'common/utils/Serialization';

var assert = require('assert')

describe('BigNumber BenchMarks', () => {

    it('Creating 100K and Multiplication/Division', ()=>{

        let x = 6, y;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){
            x +=i ;
            y = x / 3523;
        }

        let end = new Date().getTime();
        let time = end - start;

        console.log("Call to doSomething took " + time+ " milliseconds.")

    });

    it('creating 100K and Serialization/Deserialization', ()=>{

        let x = 6;
        let y, buffer;

        let start = new Date().getTime();

        for (let i=0; i<100000; i++){
            x += i;
            y = x / 3523;

            buffer = Serialization.serializeNumber8Bytes(y);
            let y2 = Serialization.deserializeNumber8Bytes(buffer);

            assert(y2 === y, "Y and Y2 and not equals after serialization")

        }
        let end = new Date().getTime();
        let time = end - start;

        console.log("Call to doSomething took " + time+ " milliseconds.")

    });


});