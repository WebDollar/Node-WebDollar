const colors = require('colors/safe');
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (blockchain, forkId, sockets, forkStartingHeight, newChainLength, header){

        this.blockchain = blockchain;

        this.forkId = forkId;

        if (!Array.isArray(sockets))
            sockets = [sockets];

        this.sockets = sockets;
        this.forkStartingHeight = forkStartingHeight||0;
        this.forkChainLength = newChainLength||0;
        this.forkBlocks = [];
        this.forkHeader = header;

        this._blocksCopy = [];

    }

    async validateFork(){

        for (let i=0; i<this.forkBlocks.length; i++){

            if (! await this.validateForkBlock(this.forkBlocks[i], this.forkStartingHeight + i, i )) return false;

        }

        return true;
    }

    async includeForkBlock(block){

        if (! await this.validateForkBlock(block, block.height ) ) return false;

        this.forkBlocks.push(block);

        return true;
    }

    /**
     * It Will only validate the hashes of the Fork Blocks
     */
    async validateForkBlock(block, height){

        //calcuate the forkHeight
        let forkHeight = block.height - this.forkStartingHeight;

        if (block.height < this.forkStartingHeight) throw 'block height is smaller than the fork itself';
        if (block.height !== height) throw "block height is different than block's height";

        let prevDifficultyTarget, prevHash, prevTimeStamp;

        // transition from blockchain to fork
        if (height === 0) {

            // based on genesis block

        } else if ( forkHeight === 0) {

            // based on previous block from blockchain

            prevDifficultyTarget = this.blockchain.blocks[height-1].difficultyTarget;
            prevHash = this.blockchain.blocks[height-1].hash;
            prevTimeStamp = this.blockchain.blocks[height-1].timeStamp;

        } else { // just the fork

            prevDifficultyTarget = this.forkBlocks[forkHeight-1].difficultyTarget;
            prevHash = this.forkBlocks[forkHeight-1].hash;
            prevTimeStamp = this.forkBlocks[forkHeight-1].timeStamp;


        }

        block.difficultyTarget = prevDifficultyTarget;

        return await this.blockchain.validateBlockchainBlock(block, prevDifficultyTarget, prevHash, prevTimeStamp, {"skip-accountant-tree-validation": true} );

    }


    /**
     * Validate the Fork and Use the fork as main blockchain
     */
    async saveFork(){

        if (!await this.validateFork()) {
            console.log(colors.red("validateFork was not passed"));
            return false
        }
        // to do

        let useFork = false;

        if (this.blockchain.getBlockchainLength() < this.forkStartingHeight + this.forkBlocks.length)
            useFork = true;
        else
        if (this.blockchain.getBlockchainLength() === this.forkStartingHeight + this.forkBlocks.length){ //I need to check

        }

        //overwrite the blockchain blocks with the forkBlocks
        if (useFork){

            return await this.blockchain.processBlocksSempahoreCallback( async () => {

                this._blocksCopy = [];
                for (let i = this.forkStartingHeight; i < this.blockchain.getBlockchainLength(); i++)
                    this._blocksCopy.push(this.blockchain.blocks[i]);

                this.preFork();

                this.blockchain.blocks.splice(this.forkStartingHeight);

                let forkedSuccessfully = true;


                console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
                console.log('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')

                for (let i = 0; i < this.forkBlocks.length; i++)
                    if (!await this.blockchain.includeBlockchainBlock(this.forkBlocks[i], (i === this.forkBlocks.length - 1), "all", false, {})) {
                        console.log(colors.green("fork couldn't be included in main Blockchain ", i));
                        forkedSuccessfully = false;
                        break;
                    }

                //revert
                if (!forkedSuccessfully) {
                    this.blockchain.blocks.splice(this.forkStartingHeight);
                    for (let i = 0; i < this._blocksCopy.length; i++)
                        if (!await this.blockchain.includeBlockchainBlock(this._blocksCopy[i], (i === this._blocksCopy.length - 1), "all", false, {})) {
                            console.log(colors.green("blockchain couldn't restored after fork included in main Blockchain ", i));
                            break;
                        }
                }

                this.postFork(forkedSuccessfully);

                //propagating valid blocks
                if (forkedSuccessfully) {
                    this.blockchain.save();
                    this.blockchain.propagateBlocks(this.forkStartingHeight, this.sockets);
                }

                // it was done successfully
                if (forkedSuccessfully)
                    this.blockchain.forksAdministrator.deleteFork(this);

                return forkedSuccessfully;
            });

        }

        return false;
    }

    preFork(){

    }

    postFork(forkedSuccessfully){

    }


}

export default InterfaceBlockchainFork;