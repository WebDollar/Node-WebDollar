import NodesList from 'node/lists/nodes-list'
import BansList from "common/utils/bans/BansList"

const MAX_TIPS_PROCESSING = 10;

class InterfaceBlockchainProtocolTipsManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        this._queue = [];

        setTimeout( async () => { return await this.processTips(); }, 200);

    }


    async processTips(){

        if (this.blockchain === undefined) {

            setTimeout( async () => { return await this.processTips(); }, 200 );
            return false;

        }

        this.blockchain.tipsAdministrator.processTipsNewForkLengths();

        for (let i=0; i<this._queue.length; i++){

            if (this._queue[i] === undefined || this._queue[i] === null){



            }

        }

        let bestTip = this.blockchain.tipsAdministrator.getBestTip();
        let result = false;

        if (bestTip !== null) {

            console.log("BEEEEEST TIIIP BEFORE");
            bestTip.toString();

            console.log("bans bans bans bans bans bans bans bans");
            console.log(this.blockchain.tipsAdministrator.bans);

            let forkAnswer = await this.protocol.forkSolver.discoverFork(bestTip);

            console.log("AFTER");
            bestTip.toString();

            if (!forkAnswer.result) {

                this.blockchain.tipsAdministrator.addBan(bestTip.socket.node.sckAddress);

                if (bestTip.forkResolve !== undefined)
                    bestTip.forkResolve(true);
            } else {

                this.blockchain.tipsAdministrator.deleteBan(bestTip.socket.node.sckAddress);

                if (bestTip.forkResolve !== undefined)
                    bestTip.forkResolve(false);
            }

            bestTip.forkResolve = undefined;

            result = true;
        }

        setTimeout(async () => { return await this.processTips(); }, 50);

        return result;
    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader){

        if (typeof newChainLength !== "number") throw {message: "newChainLength is not a number"};
        if (typeof newChainStartingPoint !== "number") throw {message: "newChainStartingPoint is not a number"};

        if (newChainLength < this.blockchain.blocks.length){

            socket.node.protocol.sendLastBlock();

            if (newChainLength < this.blockchain.blocks.length - 50)
                BansList.addBan(socket, 5000, "Your blockchain is way smaller than mine. "+newChainLength+" / "+this.blockchain.blocks.length );

            throw "Your blockchain is smaller than mine";

        }

        if (newChainStartingPoint > newChainLength) throw {message: "Incorrect newChainStartingPoint"};
        if (newChainStartingPoint < 0 ) throw {message: "Incorrect2 newChainStartingPoint"};
        if (newChainStartingPoint > forkLastBlockHeader.height ) throw {message: "Incorrect3 newChainStartingPoint"};

        let tip = this.blockchain.tipsAdministrator.getTip(socket);

        if (tip !== null) {
            this.blockchain.tipsAdministrator.updateTipNewForkLength(tip, newChainLength, newChainStartingPoint, forkLastBlockHeader);
            return tip.forkToDoPromise;
        }

        tip = this.blockchain.tipsAdministrator.addTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader);

        if (tip === null)
            return false; // the tip is not valid
        else
            return tip.forkPromise;
    }


}

export default InterfaceBlockchainProtocolTipsManager;