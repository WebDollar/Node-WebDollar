const argon2 = require('argon2');

const opt = {
    salt: Buffer.from("Satoshi_is_Finney"),
    timeCost: 2,
    memoryCost: 8,
    parallelism: 2,
    type: 0,
    hashLength: 32,
    raw: true,
};



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
var mineNoncesBatch = async (block, difficulty, start, batch) => {

    block = new Buffer(block);
    difficulty = new Buffer(difficulty);

    // pool mining
    let length = block.length;
    let buffer = Buffer.concat([block, new Buffer(4) ]);

    // difficulty
    let bestHash = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");
    let bestNonce = 0;

    for (let nonce = parseInt(start), n=(parseInt(start) + parseInt(batch)); nonce < n; nonce++) {

        if (nonce > 0xFFFFFFFF) {
            // batched: signal main process that it finished this batch
            sendMessage({ type: 'b' });

            return false;
        }

        try {
            buffer[length + 3] = nonce & 0xff;
            buffer[length + 2] = nonce >> 8 & 0xff;
            buffer[length + 1] = nonce >> 16 & 0xff;
            buffer[length    ] = nonce >> 24 & 0xff;

            let hash = await argon2.hash(buffer, opt );

            // console.log(nonce, hash);

            let change = false;

            for (let i = 0, l = bestHash.length; i < l; i++)
                if (hash[i] < bestHash[i]) {
                    change = true;
                    break;
                }
                else if (hash[i] > bestHash[i])
                    break;

            if ( change ) {

                bestHash = hash;
                bestNonce = nonce;

                if (hash.compare(difficulty) <= 0) {

                    // solved: signal main process that we got a solution
                    sendMessage({
                        type: 's',
                        nonce:nonce,
                        hash: hash,
                    });

                    return false;
                }

            }


            // hashing: signal main process that we hashed one time

            if (nonce % 3 === 0)
                sendMessage({ type: 'h' });

        } catch (error) {
            console.log(error);
        }
    }

    // batched: signal main process that it finished this batch
    sendMessage({ type: 'b', bestHash:bestHash, bestNone: bestNonce });

    return false;
};

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
            sendMessage('0')
            mineNoncesBatch(msg.data.block, msg.data.difficulty, msg.data.start, msg.data.batch);
        } catch (error) {
            console.log(error);
        }
    }
});
