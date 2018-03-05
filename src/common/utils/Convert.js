import BufferExtended from "./BufferExtended";

const BigNumber = require('bignumber.js');
const BigInteger = require('big-integer');

class Convert{

    toString(data, base){
        return data.toString();
    }
    
    toBufferHex(data){

        if (typeof data === "string")
            return Buffer.from(data, "hex");

        return Buffer.from(data.toString(16), "hex");
    }
    
    bigNumberToBigIntegerHex(data){
        
        return new BigInteger(data.toString(16), 16);
    }
    
    bigIntegerToBigNumberHex(data){
        
        return new BigNumber(data.toString(16), 16 );
    }
    
    bufferToBigNumberHex(data){
    
        return new BigNumber(data.toString("hex"), 16);
    }
    
    bufferToBigIntegerHex(data){
        
        return new BigInteger(data.toString("hex"), 16);
    }

}

export default new Convert();