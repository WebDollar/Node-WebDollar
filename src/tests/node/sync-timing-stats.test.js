var assert = require('assert')
import SyncTimingStats from 'common/blockchain/interface-blockchain/protocol/Sync-Timing-Stats'

describe('SyncTimingStats', () => {

    it('record acumulează timpul per etapă și count-ul de apeluri', () => {

        const stats = new SyncTimingStats();
        stats.record('download', 100);
        stats.record('download', 50);
        stats.record('validate', 30);

        const summary = stats.summary();

        assert.strictEqual(summary.download.totalMs, 150);
        assert.strictEqual(summary.download.count, 2);
        assert.strictEqual(summary.validate.totalMs, 30);
        assert.strictEqual(summary.validate.count, 1);

    });

    it('summary calculează procentul din total pentru fiecare etapă', () => {

        const stats = new SyncTimingStats();
        stats.record('download', 60);
        stats.record('validate', 30);
        stats.record('save', 10);

        const summary = stats.summary();

        assert.strictEqual(summary.download.percent, 60);
        assert.strictEqual(summary.validate.percent, 30);
        assert.strictEqual(summary.save.percent, 10);

    });

    it('summary cu zero înregistrări nu crapă (procent 0, nu NaN/Infinity)', () => {

        const stats = new SyncTimingStats();
        const summary = stats.summary();

        assert.strictEqual(Object.keys(summary).length, 0);

    });

    it('formatLine produce un text citibil cu ms totale, count și procent', () => {

        const stats = new SyncTimingStats();
        stats.record('download', 200);
        stats.record('validate', 100);

        const line = stats.formatLine();

        assert( line.indexOf('download') >= 0, 'ar trebui să conțină "download"' );
        assert( line.indexOf('200') >= 0, 'ar trebui să conțină timpul total de download' );
        assert( line.indexOf('67') >= 0, 'ar trebui să conțină procentul rotunjit (200/300 = 66.6% -> 67%)' );

    });

});
