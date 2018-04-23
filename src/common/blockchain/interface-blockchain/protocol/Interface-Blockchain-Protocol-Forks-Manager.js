import BansList from "common/utils/bans/BansList"
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

class InterfaceBlockchainProtocolForksManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;


        this.processForksQueue();
    }

    /*
        may the fork2 be with you Otto
    */
    async newForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader, forkProof){

        try {

            if (typeof newChainLength !== "number") throw "newChainLength is not a number";
            if (typeof newChainStartingPoint !== "number") throw "newChainStartingPoint is not a number";

            if (newChainStartingPoint > newChainLength) throw "Incorrect newChainStartingPoint";
            if (newChainStartingPoint < 0) throw "Incorrect2 newChainStartingPoint";
            if (newChainStartingPoint > forkLastBlockHeader.height) throw "Incorrect3 newChainStartingPoint";

            //for Light Nodes, I am also processing the smaller blocks

            //in case the hashes are the same, and I have already the block
            if (( (!this.blockchain.agent.light || (this.blockchain.agent.light && !forkProof)) && newChainLength > 0 && this.blockchain.blocks.length === newChainLength )) {

                //in case the hashes are exactly the same, there is no reason why we should download it
                if ( this.blockchain.blocks[this.blockchain.blocks.length - 1].hash.compare( forkLastBlockHeader ) <= 0)
                    return;

            }

            if ( (!this.blockchain.agent.light || (this.blockchain.agent.light && !forkProof) ) && newChainLength < this.blockchain.blocks.length) {

                socket.node.sendRequest("head/new-block", {
                    l: this.blockchain.blocks.length,
                    h: this.blockchain.blocks.last.hash,
                    s: this.blockchain.blocks.blocksStartingPoint,
                    p: this.blockchain.agent.light ? ( this.blockchain.proofPi !== null && this.blockchain.proofPi.validatesLastBlock() ? true : false ) : true // i also have the proof
                });

                if (newChainLength < this.blockchain.blocks.length - 50)
                    BansList.addBan(socket, 5000, "Your blockchain is way smaller than mine");

                throw "Your blockchain is smaller than mine";

            }

            let answer = await this.protocol.forkSolver.discoverFork(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader, forkProof);

            if (answer.result && answer.fork !== undefined)
                return answer.fork.forkPromise;
            else
                return false;

        } catch (exception){
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
                        if (["fork is something new", "blockchain has same length, but your block is not better than mine", "discoverAndProcessFork - fork already found by socket", "my blockchain is larger than yours"].indexOf( exception.message ) >= 0)
                            bIncludeBan = false;

                    if (bIncludeBan) {
                        console.warn("BANNNNNNNNNNNNNNNNN", bestFork.getSocket().node.sckAddress.toString(), exception.message);
                        BansList.addBan(bestFork.getSocket(), 10000, exception.message);
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


            if (Math.random() < 0.1)
            console.warn("forksAdministrator.forks.length", this.blockchain.forksAdministrator.forks.length, bestFork !== null)

        } catch (exception){

            console.error("_getBestFork returned an exception", exception );
            throw {message: exception, fork: fork}
        }

        return bestFork;
    }

}

export default InterfaceBlockchainProtocolForksManager;