class BufferExtended {

    substr(buffer, index, count){
        if ( count === undefined) count = buffer.length;

        let length = Math.min(index+count, buffer.length);

        let array = new Buffer(length);

        for (let i=index; i<length; i++)
            array[i-index] = buffer[i];

        return array;
    }

    longestMatch(buffer, buffer2, startIndex){

        if ( startIndex === undefined) startIndex = 0;

        let i =0;
        while (i + startIndex < buffer.length && i < buffer2.length ) {

            if (buffer[i + startIndex] !== buffer2[i]) //no more match
                break;

            i++;
        }

        if (i !== 0){ //we have a match
            return this.substr(startIndex, i);
        }

        return  null;

    }

}

export default new BufferExtended();