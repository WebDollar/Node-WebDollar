var BigNumber = require('bignumber.js');

class Serialization{

    /**
     * Serialize a Big Number object into an optimal Buffer
     * based on https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
     */
    serializeBigNumber(data){
        //9999999999.99999999999
        // d: [999, 9999999, 9999999, 9999000]
        // d biggest number is 0x5AF3107A3FFF
        // e: 9  - it can also be negative
        // s: 1

        if (! data instanceof BigNumber) throw 'data is not big decimal';
        if ( data.c.length === 0 ) throw "data is 0 and can't be ";

        let buffer = new Buffer( 1 + 1 + data.c.length*6 );

        buffer[0] = Math.abs(data.e) % 128 + (data.e >= 0 ? 0 : 1)*128;
        buffer[1] = data.c.length % 128 + (data.s >= 0? 0 : 1)*128;

        for (let i=0; i<data.c.length; i++) {

            //converting the number to buffer
            let long = data.c[i], byte;

            byte = long & 0xff;
            buffer[2 + (i * 6  )]  = byte;
            long = (long - byte) / 256 ;

            byte = long & 0xff;
            buffer[2 + (i * 6  + 1 )]  = byte;
            long = (long - byte) / 256 ;

            byte = long & 0xff;
            buffer[2 + (i * 6  + 2 )]  = byte;
            long = (long - byte) / 256 ;

            byte = long & 0xff;
            buffer[2 + (i * 6  + 3 )]  = byte;
            long = (long - byte) / 256 ;

            byte = long & 0xff;
            buffer[2 + (i * 6  + 4 )]  = byte;
            long = (long - byte) / 256 ;

            byte = long & 0xff;
            buffer[2 + (i * 6  + 5 )]  = byte;
            long = (long - byte) / 256 ;

        }

        return buffer;
    }

    /**
     * Deserialize a Big Number object from an optimal Buffer
     * based on https://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
     */
    deserializeBigNumber(buffer, offset ){

        offset = offset || 0;

        let bigNumber = {e:0, s:0, c: []};

        if (!Buffer.isBuffer(buffer)) throw "Can't deserialize Big Number because it is not a buffer";

        bigNumber.e = buffer[0 + offset ] % 128;
        bigNumber.e *= Math.floor(buffer[0] / 128) === 0 ? 1 : -1;

        let length = buffer[1 + offset ] % 128;
        bigNumber.s = Math.floor(buffer[1] / 128) === 0 ? 1 : -1;

        for (let i=0; i<length; i++){

            let nr = 0 ;

            nr = buffer[2 + i*6 + 5 + offset ];
            nr = (nr * 256) + buffer[2 + i*6 + 4 + offset ];
            nr = (nr * 256) + buffer[2 + i*6 + 3 + offset ];
            nr = (nr * 256) + buffer[2 + i*6 + 2 + offset ];
            nr = (nr  * 256) + buffer[2 + i*6 + 1 + offset ];
            nr = (nr  * 256) + buffer[2 + i*6 + 0 + offset ];

            bigNumber.c.push(nr);
        }

        //console.log("bigNumber", bigNumber);
        let res = new BigNumber(0);
        res.c = bigNumber.c;
        res.s = bigNumber.s;
        res.e = bigNumber.e;

        return {
            number: res,
            newOffset: 2+length*6 + offset,
        }
    }

    /**
     *
     * @param data
     */
    serializeBigInteger(bigInteger){
        //converting number value into a buffer

        let list = [];
        while (bigInteger.greater(0)){

            let division = bigInteger.divmod(256);

            list.unshift ( division.remainder );
            bigInteger = division.quotient;
        }

        let buffer = new Buffer( list.length );

        for (let i=0; i<list.length; i++)
            buffer[i] = list[i];

        return buffer;
    }

    serializeNumber2Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(2);
        buffer[0] = data & 0xff;
        buffer[1] = data>>8 & 0xff;

        return  buffer;
    }

    serializeNumber4Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(4);
        buffer[0] = data & 0xff;
        buffer[1] = data>>8 & 0xff;
        buffer[2] = data>>16 & 0xff;
        buffer[3] = data>>24 & 0xff;

        return  buffer;
    }

    serializeNumber1Byte(data){
        //converting number value into a buffer
        let buffer = Buffer(1);
        buffer[0] = (data & 0xff);

        return  buffer;
    }

    deserializeNumber(buffer){
        if(buffer.length === 1){
            return buffer[0];
        } else if (buffer.length === 2){
            return buffer[0] | (buffer[1] << 8);
        } else if (buffer.length === 4){
            return buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);

        } else if (buffer.length === 6){
            return buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24) | (buffer[4] << 32) | (buffer[5] << 40);
        }
    }

    /**
     * Convers buffer to a Fixed Length buffer
     * @returns {Buffer}
     */
    serializeToFixedBuffer(noBits, buffer){

        if (buffer.length === noBits) return buffer; // in case has the same number of bits as output

        let result = new Buffer(noBits);

        for (let i=0; i<buffer.length; i++)
            result[i]= buffer[i];

        return result;

    }

}

export default new Serialization();