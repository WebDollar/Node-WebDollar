const argon2 = require('argon2');

let hash = async (data) => {

    try{

        return await argon2.hash(data, {
            salt: Buffer.from("Satoshi_is_Finney"),
            timeCost: Buffer.from("Satoshi_is_Finney"),
            memoryCost: 8,
            parallelism: 2,
            type: 0,
            hashLength: 32,
            raw: true,
        })

    } catch (Exception){
        console.log("Argon2 exception Argon2-Node.hash", Exception.message, Exception.code)

        throw Exception
    }

};


var send = (msg) => {
    try {
        process.send(msg);
    } catch (e) {
        // console.log(e);
    }
};

var hashit = async(data) => {


    // batched
    send({ type: 'b' });
    return false;

    var { block, height, difficultyTargetPrev, computedBlockPrefix, difficulty, start, batch } = data;

    // pool mining
    let constant_prefix = [(block) ? new Buffer(block) : false];
    let constant_prefix_length = constant_prefix.length;

    // solo mining
    if (!block) {
        height = serializeBufferRemovingLeadingZeros(serializeNumber4Bytes(parseInt(height)));
        difficultyTargetPrev = serializeBufferRemovingLeadingZeros(new Buffer(difficultyTargetPrev));
        computedBlockPrefix = new Buffer(computedBlockPrefix);

        // first part
        constant_prefix = [
            height,
            difficultyTargetPrev,
            computedBlockPrefix,
        ];

        constant_prefix_length = constant_prefix.length;
    }

    // difficulty
    if (!Buffer.isBuffer(difficulty))
        difficulty = new Buffer(difficulty);


    for (let nonce = parseInt(start); nonce < parseInt(start) + parseInt(batch); nonce++) {
        if (nonce > 0xFFFFFFFF) {
            // batched
            send({ type: 'b' });

            return false;
        }

        try {
            constant_prefix[constant_prefix_length] = serializeNumber4Bytes(nonce);

            let buffer = Buffer.concat(constant_prefix);

            let hash = await hash(buffer);

            // console.log(nonce, hash);

            if (hash.compare(difficulty) <= 0) {
                // solved
                send({
                    type: 's',
                    solution: { nonce, hash }
                });

                return false;
            }

            // hashing
            send({ type: 'h' });

        } catch (error) {
            console.log(error);
        }
    }

    // batched
    send({ type: 'b' });

    return false;
}

process.on('message', (msg) => {
    send({ type: 'b' })
    if (msg.command === 'start') {
        try {
            hashit(msg.data);
        } catch (error) {
            console.log(error);
        }
    }
});









var serializeBufferRemovingLeadingZeros = (buffer) => {

    let count = 0;
    while (count < buffer.length && buffer[count] === 0)
        count++;

    let result = new Buffer(1 + buffer.length - count );
    result [0] = buffer.length - count;

    for (let i = count; i < buffer.length; i++)
        result[i-count+1] = buffer[i];


    return result;

}

var serializeNumber4Bytes = (data) => {
    let buffer = Buffer(4);
    buffer[3] = data & 0xff;
    buffer[2] = data>>8 & 0xff;
    buffer[1] = data>>16 & 0xff;
    buffer[0] = data>>24 & 0xff;

    return  buffer;
}
