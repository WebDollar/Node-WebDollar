import MiniBlockchainAdvanced from "./Mini-Blockchain-Advanced"

class MiniBlockchainAdvancedVirtualized extends MiniBlockchainAdvanced{

    async _loadBlockchain(){

        if (process.env.BROWSER) return;

        MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, false);

        try {
            let answer = await this.prover.provesCalculated._loadProvesCalculated();
        } catch (exception){
            console.error("Loading BLocks raised an error");
            MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true);
        }

    }

    async saveAccountantTree(serialization, length){

        if (process.env.BROWSER) return;

        MiniBlockchainAdvanced.prototype.saveAccountantTree.call(this, serialization.length);

        //save proofs
        let answer = await this.prover.provesCalculated._saveProvesCalculated();

    }

}

export default MiniBlockchainAdvancedVirtualized;