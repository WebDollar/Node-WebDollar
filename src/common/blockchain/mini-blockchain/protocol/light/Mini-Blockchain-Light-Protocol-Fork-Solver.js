const colors = require('colors/safe');
import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'
import PPowBlockchainProtocolForkSolver from 'common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol-Fork-Solver'
import consts from 'consts/const_global'

let inheritForkSolver;

if (consts.POPOW_PARAMS.ACTIVATED) inheritForkSolver = PPowBlockchainProtocolForkSolver;
else inheritForkSolver = InterfaceBlockchainProtocolForkSolver;


class MiniBlockchainLightProtocolForkSolver extends inheritForkSolver{


    async _getLastBlocks(socket, heightRequired){

        let blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: heightRequired }, heightRequired );

        if (blockHeaderResult === null)
            throw "LightProtocolForkSolver _calculateForkBinarySearch headers-info dropped " + heightRequired;

        return {position: heightRequired, header: blockHeaderResult};

    }

    async _calculateForkBinarySearch(socket, newChainStartingPoint, newChainLength, currentBlockchainLength){

        console.log("newChainStartingPoint", newChainStartingPoint, "newChainLength", newChainLength, "currentBlockchainLength", currentBlockchainLength)

        if (newChainStartingPoint > currentBlockchainLength-1) {

            return await this._getLastBlocks(socket, newChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS-1);

        } else {

            let result = await inheritForkSolver.prototype._calculateForkBinarySearch.call(this, socket, newChainStartingPoint, newChainLength, currentBlockchainLength);

            console.log(colors.yellow("_calculateForkBinarySearch"), result);

            if (this.blockchain.agent.light){

                if (result.position === -1)
                    return await this._getLastBlocks(socket, newChainStartingPoint);
            }

            return result;
        }

    }

    _calculateBlockRequestsForLight(fork){

        /**

         12...21
         0..... 7, 8,          9,  10,  11, [12, 13, 14, 15, 16, 17, 18,   19,      20, 21 ]
         diff1        	  diff2                                        diff3

         pt 11: am nevoie 0,1,2,3,4,5,6,7,8,9,10, 11,

         -----------------------------------------------

         18...28
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, [18,   19,   20, 21, 22, 23, 24, 25, 26, 27, 28]
         diff1        	  diff2                                          diff3

         pt 18: am nevoie 0, 1, 2,3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ,13,14,15,16,17


         ------------------------------------------------

         19...29
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   [19,   20, 21, 22, 23, 24, 25, 26, 27, 28, 29 ]
         diff1        	  diff2                                         diff3

         pt 19: am nevoie 10, 11, 12 ,13,14,15,16,17,18,

         ------------------------------------------------

         20...30
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   [20, 21, 22, 23, 24, 25, 26, 27, 28, 29 30 ]
         diff1        	  diff2                                         diff3

         pt 20: am nevoie 10, 11, 12 ,13,14,15,16,17,18, 19

         -----------------------------------------------

         21...31
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, [ 21, 22, 23, 24, 25, 26, 27, 28, 29 30  31]
         diff1        	  diff2                                         diff3

         pt 21: am nevoie 10, 11, 12 ,13,14,15,16,17,18, 19, 20

         -----------------------------------------------

         28...38
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, 21, 22, 23, 24, 25, 26, 27, [ 28, 29     30  31 32 33 34 35 36 37 38]
         diff1        	  diff2                                         diff3 					     diff4

         pt 28: am nevoie 10, 11, 12 ,13,14,15,16,17,18, 19, 20, 21 22 23 24 25 26 27 28

         -----------------------------------------------


         29...39
         0..... 7, 8,          9,  10,  11, 12, 13, 14, 15, 16, 17, 18,   19,   20, 21, 22, 23, 24, 25, 26, 27, 28, [29         30 31 32 33 34 35 36 37 38 39] 40
         diff1        	  diff2                                         diff3 					                    diff4

         pt 29: am nevoie 20,21,22,23,24,25,26,27,28

         -----------------------------------------------

         [30...40]

         19     20 21 22 23 24 25 26 27 28  29       [30 31 32 33 34 35 36 37 38  39     40]
         diff3                              diff4		                 diff5


         pt 30: am nevoie: 20,21,22,23,24,25,26,27,28,29

         */

        let forkPosition = fork.forkStartingHeight;
        let forkAdditionalBlocksBlocksRequired = [];

        for (let i = forkPosition - (forkPosition+1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS ; i < forkPosition; i++)
            forkAdditionalBlocksBlocksRequired.push(i);

        return {
            difficultyAdditionalBlocks: forkAdditionalBlocksBlocksRequired,
            difficultyCalculationStarts: forkPosition - (forkPosition+1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS,
        }

    }

    async solveFork(fork) {

        let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

        //download the new Accountant Tree, in case there is a new fork and I don't have anything in common
        console.log(colors.yellow(" fork.forkChainStartingPoint "+ fork.forkChainStartingPoint + "  "+ "fork.forkStartingHeight "+ fork.forkStartingHeight + " length "+ fork.forkChainLength));

        if (fork.forkChainStartingPoint === fork.forkStartingHeight) {

            //light solutions requires more blocks
            fork.forkDifficultyCalculation = this._calculateBlockRequestsForLight(fork);

            fork.forkStartingHeight = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[0];
            fork.forkChainStartingPoint = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[0];

            //downloading the accountant tree
            let answer = await socket.node.sendRequestWaitOnce("get/blockchain/accountant-tree/get-accountant-tree", {height: fork.forkStartingHeight }, fork.forkStartingHeight );

            if (answer === null)
                throw "get-accountant-tree never received " + (fork.forkStartingHeight);
            
            if (!answer.result)
                throw "get-accountant-tree return false "+ answer.message;

            fork.forkPrevAccountantTree = answer.accountantTree;

            //downloading the light settings
            answer = await socket.node.sendRequestWaitOnce("get/blockchain/light/get-light-settings", {height: fork.forkStartingHeight  }, fork.forkStartingHeight );

            if (answer === null)
                throw "get-light-settings never received " + (fork.forkChainStartingPoint);
            
            if (answer.result === false)
                throw "get-light-settings return false "+ answer.message;

            if (answer.difficultyTarget === null )
                throw "get-light-settings difficultyTarget is null";
            
            if (answer.timeStamp === null )
                throw "get-light-settings timeStamp is null";
            
            if (answer.hashPrev === null )
                throw "get-light-settings hashPrev is null";

            console.log("answer.difficultyTarget",answer.difficultyTarget);

            fork.forkPrevDifficultyTarget = answer.difficultyTarget;
            fork.forkPrevTimeStamp = answer.timeStamp;
            fork.forkPrevHashPrev = answer.hashPrev;


            //let's download the requested blocks for proving the difficulty
            for (let i = 0; i < fork.forkDifficultyCalculation.difficultyAdditionalBlocks.length; i++ ){

                let blockRequested = fork.forkDifficultyCalculation.difficultyAdditionalBlocks[i];

                //TODO it is not necessary to download full blocks, but rather also other nodes will require
                answer = await socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", { height: blockRequested, onlyHeader: false }, blockRequested );

                if ( answer === null || answer === undefined )
                    throw "block never received "+ blockRequested;

                if ( answer === undefined || answer === null || !answer.result || answer.block === undefined  || !Buffer.isBuffer(answer.block) )
                    throw "block for difficulty never received "+ blockRequested;

                let blockValidation = fork._createBlockValidation_ForkValidation(blockRequested, fork.forkBlocks.length-1);
                let block = this._deserializeForkBlock( answer.block, blockRequested , blockValidation);

                if (blockRequested < fork.forkDifficultyCalculation.difficultyCalculationStarts)
                    block.difficultyTarget = fork.forkPrevDifficultyTarget;

                try {

                    let result = await fork.includeForkBlock(block);

                    if (!result )
                        throw "The block "+ blockRequested+" was not includedForkBlock successfully"

                } catch (exception){
                    console.error("Exception including Light Block", exception);
                    return false;
                }

            }


        } else {
            fork.forkPrevAccountantTree = null;
            fork.forkPrevDifficultyTarget = null;
            fork.forkPrevTimeStamp = null;
            fork.forkPrevHashPrev = null;
        }

        return await inheritForkSolver.prototype.solveFork.call(this, fork);
    }

}

export default MiniBlockchainLightProtocolForkSolver