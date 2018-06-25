class RevertActions {

    constructor(blockchain){

        this.blockchain = blockchain;
        this._actions = [];

    }

    push(data){
        this._actions .push(data);
    }

    revertOperations(actionName='', all=''){

        for (let i=this._actions .length-1; i>=0; i--) {

            let action = this._actions [i];

            let done = true;

            try {

                if (action.name === "revert-updateAccount" && (actionName === '' || actionName === action.name)) {

                    this.blockchain.accountantTree.updateAccount(action.address, -action.value, action.tokenId, undefined, action.showUpdate);

                }
                else if (action.name === "revert-updateAccountNonce" && (actionName === '' || actionName === action.name)) {

                    this.blockchain.accountantTree.updateAccountNonce(action.address, -action.nonceChange, action.tokenId, undefined, action.showUpdate);

                }
                else if (action.name === "revert-skip-validation-transactions-from-values" && (actionName === '' || actionName === action.name)) {

                    action.block.blockValidation.blockValidationType["skip-validation-transactions-from-values"] = !action.value;
                }
                else if (action.name === "block-added" && (actionName === '' || actionName === action.name)) {

                    this.blockchain.blocks.spliceBlocks(action.height, true);

                    if (this.blockchain.agent.light) {
                        this.blockchain.lightPrevHashPrevs.splice(action.height);
                        this.blockchain.lightPrevTimeStamps.splice(action.height);
                        this.blockchain.lightPrevDifficultyTargets.splice(action.height);

                        this.blockchain.lightPrevHashPrevs[action.height] = this.blockchain.blocks[action.height-1].hash;
                        this.blockchain.lightPrevTimeStamps[action.height] = this.blockchain.blocks[action.height-1].timeStamp;
                        this.blockchain.lightPrevDifficultyTargets[action.height] = this.blockchain.blocks[action.height-1].difficultyTarget;

                    }

                } else if (action.name === "breakpoint" && (actionName === '' || actionName === action.name)) {

                    this._actions.splice(i, 1);

                    if (all !== 'all')
                        break;

                }
                else done = false;

            } catch (exception){
                console.error("#################################################")
                console.error("#################################################")
                console.error("revertOperations raised an error",exception)
                console.error("#################################################")
                console.error("#################################################")
            }

            if (done === true){
                action.name = '';
                this._actions.splice(i,1);
            }

        }


    }

    clearUntilBreakpoint(){

        for (let i=this._actions .length-1; i>=0; i--) {

            let action = this._actions[i];

            if (action.name === "breakpoint") {

                this._actions.splice(i);
                return;

            }

        }

        this._actions = [];

    }

    destroyRevertActions(){

        this.blockchain = undefined;
        this._actions = [];

    }

}

export default RevertActions;