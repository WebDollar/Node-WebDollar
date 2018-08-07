var zlib = require('zlib');

class GZip{

    zip(buffer){

        return zlib.deflateSync(buffer);

    }

    unzip(buffer){

        return zlib.unzipSync(buffer);

    }

}

export default new GZip()