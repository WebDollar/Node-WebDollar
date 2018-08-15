import MiniBlockchainAdvanced from "./Mini-Blockchain-Advanced"

class MiniBlockchainAdvancedVirtualized extends MiniBlockchainAdvanced{

    async _loadBlockchain(){

        if (process.env.BROWSER) return;

        let numBlocks = await this.readNumberSavedBlocks();
        if( numBlocks === false ) return { result:false };

        await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, false);

        this.blocks.length = numBlocks;

        try {

            let answer = await this.prover.provesCalculated._loadProvesCalculated();

            if (answer === false)
                throw {message : "NiPoPoW Proves Calculated raised an error"};

        } catch (exception){

            console.error("Loading BLocks raised an error");
            await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true);

            await this.prover.provesCalculated._saveProvesCalculated();
            //save all difficulties for all blocks

        }

    }

    async saveAccountantTree(serialization, length){

        if (process.env.BROWSER) return;

        MiniBlockchainAdvanced.prototype.saveAccountantTree.call(this, serialization.length);

        console.log("intraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

        //save proofs
        let answer = await this.prover.provesCalculated._saveProvesCalculated();
        console.log("SAVEEEEEEEEED "+answer)

    }

}

export default MiniBlockchainAdvancedVirtualized;