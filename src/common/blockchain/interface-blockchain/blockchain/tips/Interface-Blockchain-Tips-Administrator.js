import InterfaceBlockchainTip from './Interface-Blockchain-Tip'
import InterfaceBlockchainTipBan from './Interface-Blockchain-Tip-Ban'
import NodesList from 'node/lists/nodes-list'

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainTipsAdministrator {


    constructor (blockchain, agent){

        this.blockchain = blockchain;
        this.agent = agent;

        this.tips = [];
        this.bans = [];

        this._initializeProtocol();
    }

    _initializeProtocol(){

        NodesList.emitter.on("nodes-list/disconnected", (nodesListObject) => {

            for (let i = 0; i < this.tips.length; i++)
                if (this.tips[i].socket.node.sckAddress.matchAddress(nodesListObject.socket.node.sckAddress, ["uuid"])) {

                    if (this.tips[i].forkResolve !== undefined)
                        this.tips[i].forkResolve(true);

                    this.tips.splice(i,1);
                    return true;
                }

        });
    }

    getBestTip(){

        let maxTip = null;
        let maxTipChainLength = 0;

        for (let i = 0; i < this.tips.length; i++)
            if (this.tips[i].forkChainLength > maxTipChainLength && !this.isBanned(this.tips[i].socket.node.sckAddress)){
                maxTipChainLength = this.tips[i].forkChainLength;
                maxTip = this.tips[i];
            }

        return maxTip;
    }


    findTip(socket){

        for (let i = 0; i < this.tips.length; i++)
            if (this.tips[i] === socket || this.tips[i].socket === socket || this.tips[i].socket.node.sckAddress.matchAddress(socket.node.sckAddress) )
                return i;

        return null;
    }

    getTip(socket){
        let index = this.findTip(socket);
        if (index === null)
            return null;
        else
            return this.tips[index];
    }



    addTip(socket,  forkChainLength, forkLastBlockHeader) {

        let tip = this.findTip(socket);

        if ( tip === null) {

            tip = new InterfaceBlockchainTip(this.blockchain, socket, forkChainLength, forkLastBlockHeader);

            if (!tip.validateTip())
                return null;

            this.tips.push(tip);
        }

        return tip;
    }

    updateTipNewForkLength(tip, forkToDoChainLength, forkToDoLastBlockHeader ){

        if (tip === null)
            return null;

        if (tip.forkChainLength > forkToDoChainLength) //nothing to update
            return null;

        if (tip.forkToDoResolve !== undefined){
            tip.forkToDoResolve(false);
            tip.forkToDoResolve = undefined;
        }

        tip.forkToDoChainLength = forkToDoChainLength;
        tip.forkToDoLastBlockHeader = forkToDoLastBlockHeader;

        if (tip.forkToDoPromise === undefined){
            tip.forkToDoPromise = new Promise((resolve)=>{
                tip.forkToDoResolve = resolve;
            })
        }

        return tip;
    }

    processTipsNewForkLengths(){

        for (let i = this.tips.length - 1; i >= 0; i--){

            if (this.tips[i] === null || this.tips[i] === undefined)
                this.tips.splice(i, 1);

            this.tips[i].updateToDo();

            if (!this.tips[i].validateTip()){

                if (this.tips[i].forkResolve !== undefined)
                    this.tips[i].forkResolve(false);

                this.tips.splice(i,1);
            }

        }

    }



    isBanned(sckAddress){

        let ban = this.getBan(sckAddress);
        if (ban === null)
            return false;

        return ban.isBanned(sckAddress);
    }

    addBan(sckAddress){

        let ban = this.getBan(sckAddress);

        if (ban === null) {

            ban = new InterfaceBlockchainTipBan(sckAddress);
            this.bans.push(ban);

        } else {

            ban.increaseBanTrials();

        }

        return ban;
    }

    findBan(sckAddress){

        for (let i = 0; i < this.bans.length; i++)
            if (this.bans[i].sckAddress.matchAddress(sckAddress, ["uuid"]) )
                return i;

        return null;
    }

    getBan(sckAddress){

        let index = this.findBan(sckAddress);
        if (index !== null)
            return this.bans[index];

        return null;
    }

    deleteBan(sckAddress){

        let ban = this.getBan(sckAddress);

        if (ban !== null)
            ban.upLiftBan();

    }

}

export default InterfaceBlockchainTipsAdministrator;