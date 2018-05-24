import BufferExtended from "./BufferExtended";

class Serialization{

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

        for (let i = 0; i < list.length; i++)
            buffer[i] = list[i];

        return buffer;
    }

    serializeBigNumber( bigNumber, length ){
        //converting number value into a buffer

        let buffer = new Buffer(length);
        let count = length-1;

        while (bigNumber.isGreaterThan(0)){

            buffer[count] = bigNumber.modulo(256).toNumber();
            bigNumber = bigNumber.dividedToIntegerBy(256);

            count --;
        }

        return buffer;
    }
    
    serializeNumber1Byte(data){
        //converting number value into a buffer
        let buffer = Buffer(1);
        buffer[0] = (data & 0xff);

        return  buffer;
    }

    serializeNumber2Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(2);
        buffer[1] = data & 0xff;
        buffer[0] = data>>8 & 0xff;

        return  buffer;
    }

    serializeNumber3Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(3);
        buffer[2] = data & 0xff;
        buffer[1] = data>>8 & 0xff;
        buffer[0] = data>>16 & 0xff;

        return  buffer;
    }

    serializeNumber4Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(4);
        buffer[3] = data & 0xff;
        buffer[2] = data>>8 & 0xff;
        buffer[1] = data>>16 & 0xff;
        buffer[0] = data>>24 & 0xff;

        return  buffer;
    }

    serializeNumber8Bytes(long){
        // we want to represent the input as a 8-bytes array
        var byteArray = new Buffer(7);

        for ( let index = 0; index < byteArray.length; index ++ ) {
            let byte = long & 0xff;
            byteArray [ index ] = byte;
            long = (long - byte) / 256 ;
        }

        return byteArray;
    }


    deserializeNumber8Bytes(byteArray){
        let value = 0;

        for ( let i = byteArray.length - 1; i >= 0; i--)
            value = (value * 256) + byteArray[i];

        return value;
    }

    deserializeNumber8BytesBuffer(buffer, offset = 0){

        let value = 0;

        for ( let i = offset + 6 ; i >= offset; i--)
            value = (value * 256) + buffer[i];

        return value;
    }

    deserializeNumber(buffer){

        if(buffer.length === 1) return buffer[0]; else

        if (buffer.length === 2) return buffer[1] | (buffer[0] << 8); else

        if (buffer.length === 3) return buffer[2] | (buffer[1] << 8) | (buffer[0] << 16); else

        if (buffer.length === 4) return buffer[3] | (buffer[2] << 8) | (buffer[1] << 16) | (buffer[0] << 24); else

        if (buffer.length === 6) return buffer[5] | (buffer[4] << 8) | (buffer[3] << 16) | (buffer[2] << 24) | (buffer[1] << 32) | (buffer[0] << 40);

    }

    /**
     * Convers buffer to a Fixed Length buffer
     * @returns {Buffer}
     */
    serializeToFixedBuffer(noBytes, buffer){

        if (buffer === undefined || buffer === null)
            return new Buffer(noBytes);
        if (buffer.length === noBytes) // in case has the same number of bits as output
            return buffer;

        let result = new Buffer(noBytes);

        let c = 0;
        for (let i = buffer.length-1; i >= 0; i--){
            c++;
            result[noBytes-c] = buffer[i];
        }

        return result;
    }

    serializeBufferRemovingLeadingZeros(buffer){

        let count = 0;
        while (count < buffer.length && buffer[count] === 0)
            count++;

        let result = new Buffer(1 + buffer.length - count );
        result [0] = buffer.length - count;

        for (let i = count; i < buffer.length; i++)
            result[i-count+1] = buffer[i];


        return result;

    }
    
    /**
     * Returns the position of most significant bit of 1
     * Eg: for n = 00000000000000000000000000001010 returns 3
     * @returns {number}
     */
    mostSignificantOneBitPosition(n){
        
        let num = 0;
        
        if (0xFFFF0000 & n) {
            n = (0xFFFF0000 & n)>>16;
            num += 16;
        }
        if (0xFF00 & n) {
            n = (0xFF00 & n) >> 8;
            num += 8;
        }
        if (0xF0 & n) {
            n = (0xF0 & n) >> 4;
            num += 4;
        }
        if (12 & n) {
            n = (12 & n) >> 2;
            num += 2;
        }
        if (2 & n) {
            n = (2 & n) >> 1;
            num += 1;
        }

        return num;
    }

}

export default new Serialization();