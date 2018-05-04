import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events";
import PPoWHelper from '../helpers/PPoW-Helper'
import BansList from "common/utils/bans/BansList";

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady);

        this.forkProofPi = null;
        this._forkProofPiClone = null;

    }

    destroy(){

        if (this._forkProofPiClone !== null && this._forkProofPiClone !== undefined && this.blockchain.proofPi !== this._forkProofPiClone )
            this._forkProofPiClone.destroy();

        this._forkProofPiClone = undefined;

        if (this.forkProofPi !== null && this.forkProofPi !== undefined && this.blockchain.proofPi !== this.forkProofPi )
            this.forkProofPi.destroy();

        this.forkProofPi = undefined;

        InterfaceBlockchainFork.prototype.destroy.call(this);

    }

    async initializeFork(){

        if ( this.blockchain.agent.light ) {
            if (! (await this._downloadProof()))
                return false;
        }

        return InterfaceBlockchainFork.prototype.initializeFork.call(this);
    }

    async _downloadProof(){

        //Downloading Proof Pi
        if (this.blockchain.agent.light ) {

            StatusEvents.emit( "agent/status", {message: "Downloading Proofs", blockHeight: this.forkStartingHeight } );

            let socket, proofPiData;

            //TODO parallel downloading

            for (let i=0; i<this.sockets.length; i++){

                socket = this.sockets[i];

                proofPiData = await socket.node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi/hash", {}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );

                if (proofPiData === null || proofPiData === undefined)
                    BansList.addBan(socket, 10000, "proofPiFailed");
                else {
                    this.sockets[0] = socket;
                    break;
                }
            }

            if (proofPiData === null || proofPiData === undefined)
                throw { message: "Proof Failed to answer" };

            if (typeof proofPiData.length !== "number" || proofPiData.length <= 0) throw {message: "Proof Pi length is invalid"};

            if (this.blockchain.proofPi !== null && this.blockchain.proofPi.hash.equals(proofPiData.hash)) {

                if (this.forkChainLength > this.blockchain.blocks.length ){
                    this.forkProofPi = this.blockchain.proofPi;
                    return true;
                } //you have actually more forks but with the same proof
                else throw {message: "same proof, but your blockchain is smaller than mine"}

            }

            if (this.blockchain.forksAdministrator.findForkByProofs(proofPiData.hash) !== null)
                throw {message: "fork proof was already downloaded"};


            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);
            this.forkProofPi.hash = proofPiData.hash;

            let i = 0, length = 100;
            let proofsList = [];

            while ( i*length < proofPiData.length && i < 100 ) {

                StatusEvents.emit( "agent/status", {message: "Proofs - Downloading", blockHeight: Math.min( (i+1) *length, proofPiData.length )  } );

                let answer = await socket.node.sendRequestWaitOnce( "get/nipopow-blockchain/headers/get-proofs/pi", { starting: i * length, length: length }, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );

                if (answer === null || answer === undefined) throw { message: "Proof is empty" };

                for (let i=0; i<answer.length; i++)
                    proofsList.push(answer[i]);

                i++;
            }

            if (proofsList.length === 0) throw {message: "Proofs was not downloaded successfully"};

            StatusEvents.emit( "agent/status", {message: "Proofs - Preparing", blockHeight: this.forkStartingHeight } );

            if (this.blockchain.proofPi !== null) {

                this.forkProofPi.blocks = proofsList;

                let LCA = PPoWHelper.LCA(this.blockchain.proofPi, this.forkProofPi);

                this._isProofBetter(LCA);

                this.forkProofPi.blocks = [];

                for (let i=0; i<this.blockchain.proofPi.blocks.length; i++)
                    if (this.blockchain.proofPi.blocks[i].height <= LCA.height ) {

                        let found = false;
                        for (let j=0; j<proofsList.length; j++)
                            if (proofsList[j].height === this.blockchain.proofPi.blocks[i].height )
                                found = true;

                        if (found)
                            this.forkProofPi.blocks.push(this.blockchain.proofPi.blocks[i]);
                    }

                if (this.forkProofPi.blocks.length === 0) throw {message: "Proof is invalid LCA nothing"};

                await this.importForkProofPiHeaders( proofsList, LCA.height );

            } else {
                await this.importForkProofPiHeaders( proofsList );
            }


            //this.forkProofPi.validateProof();
            if (! this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m))
                throw {message: "Prof Pi is invalid"};

            StatusEvents.emit( "agent/status", {message: "Proofs Validated", blockHeight: this.forkStartingHeight } );

            return true;



        }

    }

    _validateFork(validateHashesAgain, firstValidation ){

        //this._validateProofXi();

        if (!this.blockchain.agent.light)
            return InterfaceBlockchainFork.prototype._validateFork.call(this, validateHashesAgain );

        if (this.forkProofPi === null) throw {message: "Proof is invalid being null"};

        if ( this.blockchain.proofPi !== null ) {

            if (this._isProofBetter())
                return true;

        } else return true;

    }

    async importForkProofPiHeaders(blocksHeader, LCAHeight = -1 ){

        for (let i=0; i<blocksHeader.length; i++){

            if (blocksHeader[i].height <= LCAHeight) continue;

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.forkProofPi.blocks.push(block);

            StatusEvents.emit( "agent/status", { message: "Validating Proof ", blockHeight: i } );
        }

        this.forkProofPi.calculateProofHash();

    }


    getForkProofsPiBlock(height){
        if (height <= 0)  return BlockchainGenesis; // based on genesis block
        else {

            let block = this.forkProofPi.hasBlock(height - 1);
            if (block !== null) return block;

            return this.getForkBlock(height);

        }
    }


    preForkClone(cloneBlocks=true){

        if (this.blockchain.agent.light )
            this._forkProofPiClone = this.blockchain.proofPi;

        return InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    revertFork(){

        if (this.blockchain.agent.light )
            this.blockchain.proofPi = this._forkProofPiClone;

        return InterfaceBlockchainFork.prototype.revertFork.call(this);

    }

    _isProofBetter(LCA){

        let comparison = this.blockchain.verifier.compareProofs( this.blockchain.proofPi, this.forkProofPi, LCA );

        //in case my proof is equals with yours and it is not a new proof

        if (comparison > 0)
            if (this.forkStartingHeight < this.blockchain.proofPi.lastProofBlock.height) //it didn't make a real fork, but it has new blocks
                throw {message: "Proof is worst than mine"};

        if (comparison === 0 && this.forkProofPi.lastProofBlock.height <= this.blockchain.proofPi.lastProofBlock.height ) {

            if (comparison === 0 && this.forkChainLength < this.blockchain.blocks.length) throw {message: "Your proof is worst than mine"};

            if (comparison === 0 && this.forkChainLength === this.blockchain.blocks.length && this.forkHeaders[0].compare(this.blockchain.getHashPrev(this.forkStartingHeight + 1)) >= 0)
                throw {message: "Your proof is worst than mine because you have the same block"};

        }

        return true;

    }

    _shouldTakeNewProof(){

        if (this.blockchain.proofPi === null) return true;

        let comparison = this.blockchain.verifier.compareProofs( this.blockchain.proofPi, this.forkProofPi );

        //in case my proof is equals with yours and it is not a new proof

        if (comparison > 0) //it is worst than my proof
            return false;
        else
        if (comparison === 0 && this.forkProofPi.lastProofBlock.height <= this.blockchain.proofPi.lastProofBlock.height ) //you have less than my proof
            return false;

        //your proof is better than mine

        return true;


    }

}

export default PPoWBlockchainFork;