const argon2 = require('argon2');

var computeHash = async(data) => {
    try {
        return await argon2.hash(data, {
            salt: Buffer.from("Satoshi_is_Finney"),
            timeCost: 2,
            memoryCost: 8,
            parallelism: 2,
            type: 0,
            hashLength: 32,
            raw: true,
        });

    } catch (Exception) {
        console.log("Argon2 exception Argon2-Node.hash", Exception.message, Exception.code)

        throw Exception
    }
};

var serializeBufferRemovingLeadingZeros = (buffer) => {
    let count = 0;
    while (count < buffer.length && buffer[count] === 0)
        count++;

    let result = new Buffer(1 + buffer.length - count);
    result[0] = buffer.length - count;

    for (let i = count; i < buffer.length; i++)
        result[i - count + 1] = buffer[i];

    return result;

}

var serializeNumber4Bytes = (data) => {
    let buffer = Buffer(4);
    buffer[3] = data & 0xff;
    buffer[2] = data >> 8 & 0xff;
    buffer[1] = data >> 16 & 0xff;
    buffer[0] = data >> 24 & 0xff;

    return buffer;
}

/**
 * Send message to main process.
 *
 * @param {Object} msg
 */
var sendMessage = (msg) => {
    try {
        process.send(msg);
    } catch (e) {
        // console.log(e);
    }
};

/**
 * Loops through a batch of nonces.
 *
 * Notes on data:
 * - All data gets serialised in an object or an array while pased through
 *   messages from main process to this child process.
 *   So all data needs to be adjusted to it's original state.
 *
 * Notes on workflow:
 * - If data.block is false, then it means it mines solo
 *   and it reconstructs the block with all it's (Buffer) parts.
 * - If it has a data.block it means it mines in a pool.
 *
 *
 * @param {Object} data
 *
 * @return {Boolean}
 */
var mineNoncesBatch = async(data) => {
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
            // batched: signal main process that it finished this batch
            sendMessage({ type: 'b' });

            return false;
        }

        try {
            constant_prefix[constant_prefix_length] = serializeNumber4Bytes(nonce);

            let buffer = Buffer.concat(constant_prefix);

            let hash = await computeHash(buffer);

            // console.log(nonce, hash);

            if (hash.compare(difficulty) <= 0) {
                // solved: signal main process that we got a solution
                sendMessage({
                    type: 's',
                    solution: { nonce, hash }
                });

                return false;
            }

            // hashing: signal main process that we hashed one time
            sendMessage({ type: 'h' });

        } catch (error) {
            console.log(error);
        }
    }

    // batched: signal main process that it finished this batch
    sendMessage({ type: 'b' });

    return false;
}

/**
 * Gets called by main process
 *
 * @param {String} 'message'
 * @param {Object} (msg
 *
 */
process.on('message', (msg) => {
    if (msg.command === 'start') {
        try {
            mineNoncesBatch(msg.data);
        } catch (error) {
            console.log(error);
        }
    }
});
