import InterfaceBlockchainTip from './Interface-Blockchain-Tip'
import NodesList from 'node/lists/nodes-list'
import BansList from "common/utils/bans/BansList"

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainTipsAdministrator {


    constructor (blockchain, agent){

        this.blockchain = blockchain;
        this.agent = agent;

        this._tips = [];

        this._initializeProtocol();

    }

    _initializeProtocol(){

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject) => {

            for (let i = 0; i < this._tips.length; i++)
                if (this._tips[i].socket === nodesListObject.socket ) {

                    try {
                        if (this._tips[i].forkResolve !== undefined)
                            this._tips[i].forkResolve(true);
                    } catch (exception){

                    }

                    this._tips[i].socket = undefined;
                    this._tips.splice(i,1);

                    return true;

                }

        });
    }

    getBestTip(){

        let maxTip = null;
        let maxTipChainLength = 0;

        for (let i = 0; i < this._tips.length; i++)
            if (this._tips[i].forkChainLength > maxTipChainLength && !BansList.isBanned(this._tips[i].socket.node.sckAddress)){

                maxTipChainLength = this._tips[i].forkChainLength;
                maxTip = this._tips[i];

            }

        return maxTip;
    }


    findTip(socket){

        for (let i = 0; i < this._tips.length; i++)
            if (this._tips[i] === socket || this._tips[i].socket === socket || this._tips[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress) )
                return i;

        return null;

    }

    getTip(socket){

        let index = this.findTip(socket);
        if (index === null)
            return null;
        else
            return this._tips[index];

    }



    addTip(socket,  forkChainLength, forkChainStartingPoint,  forkLastBlockHeader) {

        let tip = this.findTip(socket);

        if ( tip === null) {

            tip = new InterfaceBlockchainTip(this.blockchain, socket, forkChainLength, forkChainStartingPoint, forkLastBlockHeader);

            if (!tip.validateTip())
                return null;

            this._tips.push(tip);

        }

        return tip;
    }

    updateTipNewForkLength(tip, forkToDoChainLength, forkToDoChainStartingPoint, forkToDoLastBlockHeader ){

        if (tip === null)
            return null;

        if (tip.forkChainLength > forkToDoChainLength) //nothing to update
            return null;

        if (tip.forkToDoResolve !== undefined){
            tip.forkToDoResolve(false);
            tip.forkToDoResolve = undefined;
        }

        tip.forkToDoChainLength = forkToDoChainLength;
        tip.forkToDoChainStartingPoint = forkToDoChainStartingPoint;
        tip.forkToDoLastBlockHeader = forkToDoLastBlockHeader;

        if (tip.forkToDoPromise === undefined){
            tip.forkToDoPromise = new Promise((resolve)=>{
                tip.forkToDoResolve = resolve;
            })
        }

        return tip;

    }

    processTipsNewForkLengths(){

        for (let i = this._tips.length - 1; i >= 0; i--){

            if (this._tips[i] === null || this._tips[i] === undefined)
                this._tips.splice(i, 1);

            this._tips[i].updateToDo();

            if (!this._tips[i].validateTip()){

                if (this._tips[i].forkResolve !== undefined)
                    this._tips[i].forkResolve(false);

                this._tips.splice(i,1);
            }

        }

    }

}

export default InterfaceBlockchainTipsAdministrator;