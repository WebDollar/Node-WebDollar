import MiniBlockchainAdvanced from "./Mini-Blockchain-Advanced"
import global from "../../../../consts/global";

class MiniBlockchainAdvancedVirtualized extends MiniBlockchainAdvanced{

    async _loadBlockchain(){

        if (process.env.BROWSER) return;


        try {

            let answer = await this.prover.provesCalculated._loadProvesCalculated();

            if ( !answer )
                throw {message : "NiPoPoW Proves Calculated raised an error"};

        } catch (exception){

            console.error("Loading BLocks raised an error");
            await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true, undefined);

            return;
        }


        let numBlocks = await this.blocks.readBlockchainLength();
        if( !numBlocks ) return { result:false };

        await MiniBlockchainAdvanced.prototype._loadBlockchain.call(this, true, true );

        this.blocks.length = numBlocks;

        if (this.prover.proofActivated)
            await this.prover.createProofs();

    }

    async saveMiniBlockchain(){

        if (process.env.BROWSER) return;

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

        let answer = await MiniBlockchainAdvanced.prototype.saveMiniBlockchain.call(this, false );

        //save proofs
        answer = answer && await this.prover.provesCalculated._saveProvesCalculated();

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;
    }

    async saveVirtualizedDificulties(){

        for (let i=0; i<this.blocks.length; i++)
            await (await this.getBlock(i)).saveBlockDifficulty();

    }

}

export default MiniBlockchainAdvancedVirtualized;