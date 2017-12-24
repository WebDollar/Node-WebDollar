class Serialization{

    /**
     * Serialize a Big Number object into an optimal Buffer
     */
    static serializeBigNumber(bigNumber){

    }

    /**
     * Deserialize a Big Number object from an optimal Buffer
     */
    static deserializeBigNumber(buffer){

    }

    /**
     *
     * @param data
     */
    static serializeBigInteger(bigInteger){
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

    static serializeNumber4Bytes(data){
        //converting number value into a buffer
        let buffer = Buffer(4);
        buffer[0] = (data & 0xff);
        buffer[1] = (data>>8 & 0xff);
        buffer[2] = (data>>16 & 0xff);
        buffer[3] = (data>>24 & 0xff);

        return  buffer;
    }

    static serializeNumber1Byte(data){
        //converting number value into a buffer
        let buffer = Buffer(1);
        buffer[0] = (data & 0xff);

        return  buffer;
    }

    static deserializeNumber(buffer){
        if (buffer.length === 2){
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
    static serializeToFixedBuffer(noBits, buffer){

        if (buffer.length === noBits) return buffer; // in case has the same number of bits as output

        let result = new Buffer(noBits);

        for (let i=0; i<buffer.length; i++)
            result[i]= buffer[i];

        return result;

    }

}

export default Serialization;