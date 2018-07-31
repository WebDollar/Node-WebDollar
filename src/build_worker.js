import Serialization from './common/utils/Serialization';
import WebDollarCrypto from './common/crypto/WebDollar-Crypto';

var send = (msg) => {
    try {
        process.send(msg);
    } catch (e) {
        // console.log(e);
    }
}

var hashit = async(data) => {
    var { block, height, difficultyTargetPrev, computedBlockPrefix, difficulty, start, batch } = data;

    // pool mining
    let constant_prefix = [(block) ? new Buffer(block) : false];
    let constant_prefix_length = constant_prefix.length;

    // solo mining
    if (!block) {
        height = Serialization.serializeBufferRemovingLeadingZeros(Serialization.serializeNumber4Bytes(parseInt(height)));
        difficultyTargetPrev = Serialization.serializeBufferRemovingLeadingZeros(new Buffer(difficultyTargetPrev));
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
    difficulty = new Buffer(difficulty);

    for (let nonce = parseInt(start); nonce < parseInt(start) + parseInt(batch); nonce++) {
        if (nonce > 0xFFFFFFFF) {
            // batched
            send({ type: 'b' });

            return false;
        }

        try {
            constant_prefix[constant_prefix_length] = Serialization.serializeNumber4Bytes(nonce);

            let buffer = Buffer.concat(constant_prefix);

            let hash = await WebDollarCrypto.hashPOW(buffer);

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
    if (msg.command === 'start') {
        try {
            hashit(msg.data);
        } catch (error) {
            console.log(error);
        }
    }
});
