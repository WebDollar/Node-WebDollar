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
    var { height, difficultyTargetPrev, computedBlockPrefix, difficulty, start, batch } = data;

    // block
    height = parseInt(height);
    difficultyTargetPrev = new Buffer(difficultyTargetPrev);
    computedBlockPrefix = new Buffer(computedBlockPrefix);

    // difficulty
    difficulty = new Buffer(difficulty);

    for (let nonce = parseInt(start); nonce < parseInt(start) + parseInt(batch); nonce++) {
        if (nonce > 0xFFFFFFFF) {
            // batched
            send({ type: 'b' });

            return false;
        }

        try {
            let buffer = Buffer.concat([
                Serialization.serializeBufferRemovingLeadingZeros(Serialization.serializeNumber4Bytes(height)),
                Serialization.serializeBufferRemovingLeadingZeros(difficultyTargetPrev),
                computedBlockPrefix,
                Serialization.serializeNumber4Bytes(nonce),
            ]);

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
