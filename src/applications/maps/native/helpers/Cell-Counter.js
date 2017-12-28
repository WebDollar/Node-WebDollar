class CellCounter {

    constructor() {
        this._cellCount = {};
    }

    incCellCount(cell) {
        if (!this._cellCount[cell.cellId]) {
            this._cellCount[cell.cellId] = 0;
        }
        this._cellCount[cell.cellId]++;
    }

    decCellCount(cell) {
        if (!this._cellCount[cell.cellId]) {
            this._cellCount[cell.cellId] = 0;
        }
        if (this._cellCount[cell.cellId] > 0) {
            return --this._cellCount[cell.cellId];
        }
        return 0;
    }

    getCellCount(cell) {
        return this._cellCount[cell.cellId] || 0;
    }
}

export default CellCounter;