class RevertActions {

    constructor(blockchain){

        this.blockchain = blockchain;
        this._actions = [];

    }

    push(data){
        this._actions .push(data);
    }

    revertOperations(actionName=''){

        for (let i=this._actions .length-1; i>=0; i--) {

            let action = this._actions [i];


            let done = true;

            if (action.name === "revert-updateAccount" && (actionName === '' || actionName === action.name)) {

                this.blockchain.accountantTree.updateAccount(action.address, -action.value, action.tokenId);

            }
            else
            if (action.name === "revert-updateAccountNonce" && (actionName === '' || actionName === action.name)) {

                let nonce = this.blockchain.accountantTree.updateAccountNonce(action.address, -action.nonceChange, action.tokenId);

            }
            else
            if (action.name === "revert-skip-validation-transactions-from-values"  && (actionName === '' || actionName === action.name)) {

                action.block.blockValidation.blockValidationType["skip-validation-transactions-from-values"] = !action.value;
            }
            else
            if (action.name === "block-added"  && (actionName === '' || actionName === action.name)) {

                this.blockchain.blocks.spliceBlocks(action.height);

            } else
            if (action.name === "breakpoint"  && (actionName === '' || actionName === action.name)) {

                this._actions.splice(i,1);
                break;

            }
            else done = false;

            if (done === true){
                action.name = '';
                this._actions.splice(i,1);
            }

        }


    }

}

export default RevertActions;