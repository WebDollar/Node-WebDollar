var assert = require('assert')
import InterfaceBlockchainBlockDataTransactions from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Data-Transactions'
import Blockchain from 'main-blockchain/Blockchain'

// Măsurat empiric (SYNC_TIMING_DEBUG=1, daniuda.ddns.net): chiar și cu
// skip-sleep aplicat pe 9 din 10 blocuri (fix anterior), blocul al 10-lea
// rămas "neprotejat" poate costa enorm dacă are multe tranzacții, pentru
// că sleep(2) rula O DATĂ PE TRANZACȚIE, nu o dată per bloc. Fix: sleep-ul
// de respirație pentru event loop (introdus deliberat în 2018, commit
// 1b3d15e1) rulează cel mult o dată per bloc, indiferent de câte
// tranzacții are — păstrează intenția (ocazional, cedează controlul),
// elimină costul proporțional cu numărul de tranzacții.
describe('InterfaceBlockchainBlockDataTransactions validateTransactions — granularitatea sleep-ului', () => {

    let originalSleep;

    beforeEach(() => {
        originalSleep = Blockchain.blockchain ? Blockchain.blockchain.sleep : undefined;
    });

    afterEach(() => {
        if (Blockchain.blockchain) Blockchain.blockchain.sleep = originalSleep;
    });

    function makeFakeTransactionsHolder(transactionCount){

        const fakeHash = Buffer.from('aa', 'hex');

        const holder = {
            transactions: [],
            hashTransactions: fakeHash,
            calculateHashTransactions: () => fakeHash,
            validateDuplicateTransactions: () => true,
        };

        for (let i = 0; i < transactionCount; i++)
            holder.transactions.push({ validateTransactionOnce: () => true });

        return holder;
    }

    it('cu skip-sleep nesetat, cheamă sleep cel mult o dată, indiferent de numărul de tranzacții', async () => {

        let sleepCallCount = 0;
        Blockchain.blockchain = { sleep: async () => { sleepCallCount++; } };

        const holder = makeFakeTransactionsHolder(50);

        await InterfaceBlockchainBlockDataTransactions.prototype.validateTransactions.call(holder, 100, {});

        assert.strictEqual(sleepCallCount, 1, 'sleep ar trebui chemat o singură dată, nu per tranzacție');

    });

    it('cu skip-sleep=true, nu cheamă sleep deloc', async () => {

        let sleepCallCount = 0;
        Blockchain.blockchain = { sleep: async () => { sleepCallCount++; } };

        const holder = makeFakeTransactionsHolder(50);

        await InterfaceBlockchainBlockDataTransactions.prototype.validateTransactions.call(holder, 100, { 'skip-sleep': true });

        assert.strictEqual(sleepCallCount, 0);

    });

    it('cu zero tranzacții și skip-sleep nesetat, nu cheamă sleep (nimic de validat)', async () => {

        let sleepCallCount = 0;
        Blockchain.blockchain = { sleep: async () => { sleepCallCount++; } };

        const holder = makeFakeTransactionsHolder(0);

        await InterfaceBlockchainBlockDataTransactions.prototype.validateTransactions.call(holder, 100, {});

        assert.strictEqual(sleepCallCount, 0);

    });

});
