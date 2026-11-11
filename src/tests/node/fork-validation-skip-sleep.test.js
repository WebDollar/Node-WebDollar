var assert = require('assert')
import InterfaceBlockchainForkBasic from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork-Basic'

// Măsurat empiric (SYNC_TIMING_DEBUG=1, container Docker conectat la
// daniuda.ddns.net): costul de validare per bloc la resincronizare crește
// ~10x în 300 de blocuri, dominat de un `sleep(2)` necondiționat per
// tranzacție în validateTransactions(). Trecerea de salvare (saveFork)
// deja sare peste acest sleep în majoritatea cazurilor — trecerea de
// descărcare/validare (_solveFork, unde se cheltuie de fapt timpul) nu o
// face, pentru că _createBlockValidation_ForkValidation nu seta
// "skip-sleep" deloc.
describe('Interface-Blockchain-Fork-Basic _createBlockValidation_ForkValidation skip-sleep', () => {

    it('setează skip-sleep=true când nu e backlog mare (downloadBlocksSleep=false)', () => {

        const fork = new InterfaceBlockchainForkBasic();
        fork.downloadBlocksSleep = false;

        const validation = fork._createBlockValidation_ForkValidation(100, 5);

        assert.strictEqual(validation.blockValidationType['skip-sleep'], true);

    });

    it('cu backlog mare (downloadBlocksSleep=true), sare sleep-ul doar în afara fiecărui al 10-lea bloc', () => {

        const fork = new InterfaceBlockchainForkBasic();
        fork.downloadBlocksSleep = true;

        const validationIndex9  = fork._createBlockValidation_ForkValidation(100, 9);
        const validationIndex10 = fork._createBlockValidation_ForkValidation(100, 10);
        const validationIndex11 = fork._createBlockValidation_ForkValidation(100, 11);

        assert.strictEqual(validationIndex9.blockValidationType['skip-sleep'], true, 'index 9 ar trebui să sară sleep-ul');
        assert.strictEqual(validationIndex10.blockValidationType['skip-sleep'], undefined, 'index 10 (multiplu de 10) ar trebui să NU sară sleep-ul');
        assert.strictEqual(validationIndex11.blockValidationType['skip-sleep'], true, 'index 11 ar trebui să sară sleep-ul');

    });

    it('la index 0, cu backlog mare, NU sare sleep-ul (consistent cu saveFork)', () => {

        const fork = new InterfaceBlockchainForkBasic();
        fork.downloadBlocksSleep = true;

        const validation = fork._createBlockValidation_ForkValidation(100, 0);

        assert.strictEqual(validation.blockValidationType['skip-sleep'], undefined);

    });

});
