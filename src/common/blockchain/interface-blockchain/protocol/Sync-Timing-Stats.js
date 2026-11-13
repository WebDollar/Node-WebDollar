/**
 * Acumulator simplu, pur, pentru timpul petrecut în etapele resincronizării
 * (descărcare / validare / scriere pe disc), ca să se poată măsura empiric
 * unde se pierde timpul la o resincronizare lungă, în loc să se ghicească.
 * Activat doar cu SYNC_TIMING_DEBUG=1 (vezi wiring în Fork-Solver).
 */
export default class SyncTimingStats {

    constructor(){
        this.stages = {};
    }

    record(stage, ms){
        if (!this.stages[stage]) this.stages[stage] = { totalMs: 0, count: 0 };
        this.stages[stage].totalMs += ms;
        this.stages[stage].count += 1;
    }

    summary(){

        const grandTotal = Object.values(this.stages).reduce((sum, s) => sum + s.totalMs, 0);
        const out = {};

        for (const stage of Object.keys(this.stages)){
            const s = this.stages[stage];
            out[stage] = {
                totalMs: s.totalMs,
                count: s.count,
                percent: grandTotal === 0 ? 0 : Math.round((s.totalMs / grandTotal) * 10000) / 100,
            };
        }

        return out;
    }

    formatLine(){

        const summary = this.summary();

        return Object.keys(summary).map((stage) => {
            const s = summary[stage];
            return `${stage}: ${s.totalMs}ms/${s.count} (${Math.round(s.percent)}%)`;
        }).join('  |  ');
    }

}
