import MiniBlockchainAdvanced from "./Mini-Blockchain-Advanced"

class MiniBlockchainAdvancedVirtualized extends MiniBlockchainAdvanced{

    async _loadBlockchain(){

        if (process.env.BROWSER) return;


        try {

            let answer = await this.prover.provesCalculated._loadProvesCalculated();

            if (answer === false)
                throw {message : "NiPoPoW Proves Calculated raised an error"};

        } catch (exception){

            console.error("Loading BLocks raised an error");
            await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true, undefined);

            await this.prover.provesCalculated._saveProvesCalculated();

            //save all difficulties for all blocks
            await this.saveVirtualizedDificulties();

            return;

        }


        let numBlocks = await this.readNumberSavedBlocks();
        if( numBlocks === false ) return { result:false };

        await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true, true );

        this.blocks.length = numBlocks;

        if (this.prover.proofActivated)
            await this.prover.createProofs();

    }

    async saveAccountantTree(serialization, length){

        if (process.env.BROWSER) return;

        MiniBlockchainAdvanced.prototype.saveAccountantTree.apply(this, arguments );

        console.log("intraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")

        //save proofs
        let answer = await this.prover.provesCalculated._saveProvesCalculated();
        console.log("SAVEEEEEEEEED "+answer)

    }

    async saveVirtualizedDificulties(){

        for (let i=0; i<this.blocks.length; i++)
            await (await this.getBlock(i)).saveBlockDifficulty();

    }

}

export default MiniBlockchainAdvancedVirtualized;