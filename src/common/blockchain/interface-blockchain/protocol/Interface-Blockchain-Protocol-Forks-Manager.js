import BansList from "common/utils/bans/BansList"
import Serialization from "common/utils/Serialization";
const BigInteger = require('big-integer');

class InterfaceBlockchainProtocolForksManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;


        this.processForksQueue();
    }

    /*
        may the fork2 be with you Otto
    */
    async newForkTip(socket, forkChainLength, forkChainStartingPoint, forkLastBlockHash, forkProof, forkChainWork){

        try {

            if (!this.blockchain.agent.consensus) return;

            if (typeof forkChainLength !== "number") throw "forkChainLength is not a number";
            if (typeof forkChainStartingPoint !== "number") throw "newChainStartingPoint is not a number";

            if (forkChainLength < 0 ) throw "Incorrect new Chain";
            if (forkChainStartingPoint > forkChainLength) throw "Incorrect newChainStartingPoint";
            if (forkChainStartingPoint < 0) throw "Incorrect2 newChainStartingPoint";
            if (forkChainStartingPoint > this.blockchain.blocks.length) throw {message: "Incorrect3 newChainStartingPoint", newChainStartingPoint:forkChainStartingPoint, blocks: this.blockchain.blocks.length};

            if (forkChainWork !== undefined)
                forkChainWork = Serialization.deserializeBigInteger(forkChainWork);
            else
                forkChainWork = new BigInteger(0);

            //for Light Nodes, I am also processing the smaller blocks
            //in case the hashes are the same, and I have already the block

            // todo should compare the proof because maybe it is the same with mine

            if ( (forkChainWork.greater(0) && forkChainWork.equals( this.blockchain.blocks.chainWork )
                 && (!this.blockchain.agent.light || (this.blockchain.agent.light && ( !forkProof || !this.blockchain.proofPi.validatesLastBlock() ))) )) {

                socket.node.protocol.blocks = forkChainLength;
                console.log("Error ForkTip 1");
                return false;
            }

            if ( (forkChainWork.greater(0) && forkChainWork.lesser( this.blockchain.blocks.chainWork ))
                && (!this.blockchain.agent.light || (this.blockchain.agent.light && ( !forkProof || !this.blockchain.proofPi.validatesLastBlock() ))) ) {
                socket.node.protocol.blocks = forkChainLength;
                socket.node.protocol.sendLastBlock();
                console.log("Error ForkTip 2");
                return false;
            }

            //I have a better chainWork
            if ( (forkChainWork.greater(0) && forkChainWork.lesser( this.blockchain.blocks.chainWork ))
                  && (!this.blockchain.agent.light || (this.blockchain.agent.light && ( !forkProof || !this.blockchain.proofPi.validatesLastBlock() ))) ) {
                socket.node.protocol.blocks = forkChainLength;
                socket.node.protocol.sendLastBlock();
                console.log("Error ForkTip 3");
                return false;
            }

            if (forkChainWork.equals(0))
                throw {message: "forkChainWork is zero"};


            let answer = await this.protocol.forkSolver.discoverFork(socket, forkChainLength, forkChainStartingPoint, forkLastBlockHash, forkProof, forkChainWork );

            if (answer.result){

                socket.node.protocol.blocks = forkChainLength;

                if (answer.fork !== undefined)
                    return answer.fork.forkPromise;
            }

            return false;
            console.log("Error ForkTip 4");

        } catch (exception){

            if (exception.message === "Your blockchain is smaller than mine" && Math.random() < 0.2)
                console.warn(exception);

            return false;
        }

    }

    async processForksQueue(){

        let bestFork;

        try {

            bestFork = await this._getBestFork();

        } catch (exception){

            console.error("processForksQueue error getting bestFork", exception  );
            let forkError = exception.fork;

            this.blockchain.forksAdministrator.deleteFork(forkError);

            bestFork = null;
        }

        if (bestFork !== null) {

            try {

                let answer = await this.protocol.forkSolver._solveFork ( bestFork );

                if (!answer)
                    throw { message: "Fork couldn't be solved" }

            } catch (exception) {

                try {

                    console.error("processForksQueue returned an error", exception);

                    let bIncludeBan = true;

                    if (this.blockchain.agent.light)
                        if (["fork is something new", "discoverAndProcessFork - fork already found by socket",
                             "same proof, but your blockchain is smaller than mine", "Your proof is worst than mine because you have the same block", "fork proof was already downloaded" ].indexOf( exception.message ) >= 0)
                            bIncludeBan = false;

                    if (bIncludeBan) {
                        let socket = bestFork.getSocket();
                        console.warn("BANNNNNNNNNNNNNNNNN", socket !== undefined ? socket.node.sckAddress.toString() : '', exception.message);
                        BansList.addBan(bestFork.getSocket(), 60000, exception.message);
                    }

                } catch (exception){

                }

            }

            this.blockchain.forksAdministrator.deleteFork(bestFork);

        }

        setTimeout( this.processForksQueue.bind(this), 200 );
    }


    //will select the best
    //will select the best
    _getBestFork(){

        let bestFork = null;
        let fork = null;

        try {

            for (let i = 0; i < this.blockchain.forksAdministrator.forks.length; i++)
                if (this.blockchain.forksAdministrator.forks[i].forkReady) {

                    fork = this.blockchain.forksAdministrator.forks[i];

                    if (bestFork === null || bestFork.forkChainLength < fork.forkChainLength)
                        bestFork = fork;

                }


            // if (Math.random() < 0.1)
                // console.warn("forksAdministrator.forks.length", this.blockchain.forksAdministrator.forks.length, bestFork !== null)

        } catch (exception){

            console.error("_getBestFork returned an exception", exception );
            throw {message: exception, fork: fork.toJSON() }
        }

        return bestFork;
    }

}

export default InterfaceBlockchainProtocolForksManager;