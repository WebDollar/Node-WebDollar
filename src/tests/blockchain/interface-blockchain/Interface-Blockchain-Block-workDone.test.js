var assert = require('assert');
const BigInteger = require('big-integer');

import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import consts from 'consts/const_global';

// Regresie: commit-ul 0c68647b (refactor importuri ESM) a șters importul
// `big-integer` din Interface-Blockchain-Block.js, dar `get workDone` îl
// folosește în continuare. `workDone` e pe calea de consens (getChainWork,
// comparația fork-urilor), deci un ReferenceError aici blochează nodul exact
// când apare un fork.
describe('InterfaceBlockchainBlock.workDone', () => {

    const blockWithTarget = (hexTarget) => new InterfaceBlockchainBlock(
        undefined,          // blockchain — nefolosit de workDone
        {},                 // blockValidation — evită createBlockValidation()
        1, null, null,
        Buffer.from(hexTarget, 'hex'),
        null, null, 0,
        {},                 // data — evită blockCreator
        1, undefined
    );

    it('computes MAX_TARGET / difficultyTargetPrev without throwing', () => {
        const block = blockWithTarget('0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');

        const work = block.workDone;

        const expected = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET_BIG_INTEGER.divide(
            BigInteger('0000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 16)
        );
        assert.strictEqual(work.toString(), expected.toString());
        // (2^256-1) / (2^240-1) = 65536 rest 65535
        assert.strictEqual(work.toString(), '65536');
    });

    it('returns 1 for the maximum (easiest) target', () => {
        const block = blockWithTarget('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF');
        assert.strictEqual(block.workDone.toString(), '1');
    });

});
