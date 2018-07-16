import Serialization from './common/utils/Serialization';
import WebDollarCrypto from './common/crypto/WebDollar-Crypto';

var hashit = async(data) => {
    var { block, difficulty, start, batch } = data;

    difficulty = new Buffer(difficulty);

    block.height = parseInt(block.height);
    block.difficultyTargetPrev = new Buffer(block.difficultyTargetPrev);
    block.computedBlockPrefix = new Buffer(block.computedBlockPrefix);
    block.nonce = parseInt(block.nonce);

    for (let nonce = parseInt(start); nonce < parseInt(start) + parseInt(batch); nonce++) {
        if (nonce > 0xFFFFFFFF) {
            // batched
            process.send({ type: 'b' });

            return false;
        }

        try {
            let buffer = Buffer.concat([
                Serialization.serializeBufferRemovingLeadingZeros(Serialization.serializeNumber4Bytes(block.height)),
                Serialization.serializeBufferRemovingLeadingZeros(block.difficultyTargetPrev),
                block.computedBlockPrefix,
                Serialization.serializeNumber4Bytes(nonce),
            ]);

            let hash = await WebDollarCrypto.hashPOW(buffer);

            // console.log(nonce, hash);

            if (hash.compare(difficulty) <= 0) {
                // solved
                process.send({
                    type: 's',
                    solution: { nonce, hash }
                });

                return false;
            }

            // hashing
            process.send({ type: 'h' });

        } catch (error) {
            console.log(error);
        }
    }

    // batched
    process.send({ type: 'b' });

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
