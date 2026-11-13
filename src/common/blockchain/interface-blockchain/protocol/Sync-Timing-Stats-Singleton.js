// Instanță partajată de SyncTimingStats, ca să se poată instrumenta
// sub-etape din fișiere diferite (Fork-Solver, validarea per bloc) și
// toate să se agrege într-un singur raport. Vezi Sync-Timing-Stats.js
// pentru clasa testată; acest fișier nu are nevoie de test propriu
// (e doar o instanțiere, fără logică).
import SyncTimingStats from "./Sync-Timing-Stats";

export default new SyncTimingStats();
