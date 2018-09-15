/**
 * Backbone Worker based on node-gyp and multi-threading in node.js
 */

const argon2 = require('argon2');

const opt = {
    salt: Buffer.from("Satoshi_is_Finney"),
    timeCost: 2,
    memoryCost: 256,
    parallelism: 2,
    type: 0,
    hashLength: 32,
    raw: true,
};

const MAX_TARGET = Buffer.from("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", "hex");


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

var difficulty = new Buffer(32);
var start = 0;
var end = 0;
var blockId = 0;
var length = 0;
var buffer = 0;
var bestHash = new Buffer(32);
var bestNonce = 0;

var mineNoncesBatch = (myBlock, myDifficulty, myStart, myBatch, myBlockId) => {

    myBlock = new Buffer(myBlock);
    difficulty = new Buffer(myDifficulty);

    // pool mining
    length = myBlock.length;
    buffer = Buffer.concat([myBlock, new Buffer(4) ]);

    start = parseInt(myStart);
    end = parseInt(myStart) + parseInt(myBatch);

    blockId = myBlockId;

    // difficulty
    bestHash = MAX_TARGET;
    bestNonce = -1;

    return false;
};


var executionLoop = async ()=>{

    var nonce = 0;
    var change, found;

    while (1===1){

        if (start < end){

            nonce = start;
            start++;

            if (nonce > 0xFFFFFFFF) {
                // batched: signal main process that it finished this batch
                sendMessage({ type: 'b', bestHash:bestHash, bestNone: bestNonce, blockId: blockId  });
                bestNonce = -1;
                continue;
            }

            try {

                buffer[length + 3] = nonce & 0xff;
                buffer[length + 2] = nonce >> 8 & 0xff;
                buffer[length + 1] = nonce >> 16 & 0xff;
                buffer[length    ] = nonce >> 24 & 0xff;

                let hash = await argon2.hash(buffer, opt );

                // console.log(nonce, hash);

                change = false;

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

                    found = false;
                    for (let i = 0, l = difficulty.length; i < l; i++)
                        if (hash[i] < difficulty[i]) {
                            found = true;
                            break;
                        }
                        else if (hash[i] > difficulty[i])
                            break;

                    if (found) {

                        // solved: signal main process that we got a solution
                        sendMessage({ type: 's',  nonce:nonce,  hash: hash, blockId: blockId });

                        start = end+1;
                        bestNonce = -1;

                        continue;

                    }

                }


                // hashing: signal main process that we hashed one time

                if (nonce % 3 === 0)
                    sendMessage({ type: 'h' });

            } catch (error) {
                console.log(error);
            }

        } else
            if (bestNonce !== -1) {
                // batched: signal main process that it finished this batch
                sendMessage( { type: 'b', bestHash: bestHash, bestNonce: bestNonce, blockId: blockId } );
                bestNonce = -1;
            } else
                await sleep(3);

    }

};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

executionLoop();

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
            mineNoncesBatch(msg.data.block, msg.data.difficulty, msg.data.start, msg.data.batch);
        } catch (error) {
            console.log(error);
        }
    }
});
