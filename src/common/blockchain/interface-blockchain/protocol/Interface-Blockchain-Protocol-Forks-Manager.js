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
    async newForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHash, forkProof){

        try {

            if (!this.blockchain.agent.consenus) return;

            if (typeof newChainLength !== "number") throw "newChainLength is not a number";
            if (typeof newChainStartingPoint !== "number") throw "newChainStartingPoint is not a number";

            if (newChainStartingPoint > newChainLength) throw "Incorrect newChainStartingPoint";
            if (newChainStartingPoint < 0) throw "Incorrect2 newChainStartingPoint";
            if (newChainStartingPoint > this.blockchain.blocks.length) throw {message: "Incorrect3 newChainStartingPoint", newChainStartingPoint:newChainStartingPoint, blocks: this.blockchain.blocks.length};

            //for Light Nodes, I am also processing the smaller blocks

            //in case the hashes are the same, and I have already the block

            //todo should compare the proof because maybe it is the same with mine
            if ( newChainLength > 0 && this.blockchain.blocks.length === newChainLength && (!this.blockchain.agent.light || (this.blockchain.agent.light && ( !forkProof || !this.blockchain.proofPi.validatesLastBlock() ))) ) {

                //in case the hashes are exactly the same, there is no reason why we should download it
                let comparison = this.blockchain.blocks[this.blockchain.blocks.length - 1].hash.compare( forkLastBlockHash );

                if ( comparison < 0) {
                    socket.node.protocol.sendLastBlock();
                    return false;
                }

                if ( comparison === 0) {
                    socket.node.protocol.blocks = newChainLength;
                    return true;
                }

            }

            if ( newChainLength < this.blockchain.blocks.length && (!this.blockchain.agent.light || (this.blockchain.agent.light && ( !forkProof || !this.blockchain.proofPi.validatesLastBlock() )))) {

                if (this.blockchain.blocks[newChainLength] !== undefined && this.blockchain.blocks[newChainLength].hash.equals( forkLastBlockHash ))
                    socket.node.protocol.blocks = newChainLength;

                if (Math.random() < 0.5)
                    socket.node.protocol.sendLastBlock();

                if (newChainLength < this.blockchain.blocks.length - 50)
                    BansList.addBan(socket, 5000, "Your blockchain is way smaller than mine. "+newChainLength+" / "+this.blockchain.blocks.length );

                throw "Your blockchain is smaller than mine";

            }

            let answer = await this.protocol.forkSolver.discoverFork(socket, newChainLength, newChainStartingPoint, forkLastBlockHash, forkProof);

            if (answer.result){

                socket.node.protocol.blocks = newChainLength;

                if (answer.fork !== undefined)
                    return answer.fork.forkPromise;
            }

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
                        if (["fork is something new", "blockchain has same length, but your block is not better than mine",
                             "discoverAndProcessFork - fork already found by socket", "my blockchain is larger than yours",
                             "same proof, but your blockchain is smaller than mine", "Your proof is worst than mine because you have the same block", "fork proof was already downloaded" ].indexOf( exception.message ) >= 0)
                            bIncludeBan = false;

                    if (bIncludeBan) {
                        let socket = bestFork.getSocket();
                        console.warn("BANNNNNNNNNNNNNNNNN", socket !== undefined ? socket.node.sckAddress.toString() : '', exception.message);
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


            // if (Math.random() < 0.1)
                // console.warn("forksAdministrator.forks.length", this.blockchain.forksAdministrator.forks.length, bestFork !== null)

        } catch (exception){

            console.error("_getBestFork returned an exception", exception );
            throw {message: exception, fork: fork}
        }

        return bestFork;
    }

}

export default InterfaceBlockchainProtocolForksManager;