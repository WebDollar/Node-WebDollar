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
    async newForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader){

        try {
            if (typeof newChainLength !== "number") throw "newChainLength is not a number";
            if (typeof newChainStartingPoint !== "number") throw "newChainStartingPoint is not a number";

            if (newChainStartingPoint > newChainLength) throw "Incorrect newChainStartingPoint";
            if (newChainStartingPoint < 0) throw "Incorrect2 newChainStartingPoint";
            if (newChainStartingPoint > forkLastBlockHeader.height) throw "Incorrect3 newChainStartingPoint";

            if (newChainLength < this.blockchain.blocks.length) {

                socket.node.sendRequest("head/new-block", {
                    l: this.blockchain.blocks.length,
                    h: this.blockchain.blocks.last.hash,
                    s: this.blockchain.blocks.blocksStartingPoint,
                });

                if (newChainLength < this.blockchain.blocks.length - 50)
                    BansList.addBan(socket, 500, "Your blockchain is way smaller than mine");

                throw "Your blockchain is smaller than mine";

            }

            let answer = await this.protocol.forkSolver.discoverFork(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader);

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

            let answer= false;

            try {

                answer = await this.protocol.forkSolver.processFork( bestFork );

                if (!answer)
                    throw { message: "Invalid Fork" }

            } catch (exception) {

                console.error("processForksQueue returned an error", exception);
                console.warn("BANNNNNNNNNNNNNNNNN", bestFork.getSocket().node.sckAddress.toString(), exception.message);

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
        } catch (exception){

            console.error("_getBestFork returned an exception", exception );
            throw {message: exception, fork: fork}
        }

        return bestFork;
    }

}

export default InterfaceBlockchainProtocolForksManager;