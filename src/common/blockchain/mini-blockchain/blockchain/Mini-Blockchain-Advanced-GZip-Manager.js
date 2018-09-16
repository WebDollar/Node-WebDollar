import GZip from "common/utils/GZip";
import consts from "consts/const_global";

class MiniBlockchainAdvancedGZipManager{

    constructor(blockchain){

        this.blockchain = blockchain;


        setTimeout(this.processGZIP.bind(this), 10000);

    }

    async processAllAccountantTrees(){

        let index = this.blockchain.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE - 2;

        for (let i = this.blockchain.blocks.length - 1; i >= index; i--) {

            if (this.blockchain.lightAccountantTreeSerializationsGzipped[i] === undefined && this.blockchain.lightAccountantTreeSerializations[i] !== undefined)
                this.blockchain.lightAccountantTreeSerializationsGzipped[i] = await GZip.zip(this.blockchain.lightAccountantTreeSerializations[i]);

            await this.blockchain.sleep(5);
        }

    }

    async processGZIP(){

        try {

            if (consts.BLOCKCHAIN.LIGHT.GZIPPED)
                if (this.blockchain.semaphoreProcessing._list.length === 0 && this.blockchain.forksAdministrator.forks.length === 0) {

                    let index = this.blockchain.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES - 2;
                    let position;

                    for (let i = index; i < this.blockchain.blocks.length; i++) {

                        if (this.blockchain.lightAccountantTreeSerializationsGzipped[i] === undefined && this.blockchain.lightAccountantTreeSerializations[i] !== undefined)
                            position = i;

                    }


                    if (position !== undefined) {

                        console.info("processing gzip");

                        if (this.blockchain.lightAccountantTreeSerializationsGzipped[position] !== undefined)
                            position++;

                        if (this.blockchain.lightAccountantTreeSerializationsGzipped[position] === undefined && this.blockchain.lightAccountantTreeSerializations[position] !== undefined)
                            this.blockchain.lightAccountantTreeSerializationsGzipped[position] = await GZip.zip(this.blockchain.lightAccountantTreeSerializations[position]);
                    }

                }

        } catch (exception){

        }

        setTimeout(this.processGZIP.bind(this), 5000);

    }


}

export default MiniBlockchainAdvancedGZipManager;