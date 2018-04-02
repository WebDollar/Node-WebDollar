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


            if (action.name === "revert-add-accountant-tree" && (actionName === '' || actionName === action.name))
                this.blockchain.accountantTree.delete( action.data.address );
            else
            if (action.name === "revert-updateAccount" && (actionName === '' || actionName === action.name)) {
                let answer = this.blockchain.accountantTree.updateAccount(action.data.address, -action.value, action.tokenId);

                //force to delete first time miner
                if (answer === null && this.blockchain.accountantTree.getAccountNonce(action.data.address) === 0)
                    this.blockchain.accountantTree.delete(action.data.address);
            }
            else
            if (action.name === "revert-skip-validation-transactions-from-values"  && (actionName === '' || actionName === action.name))
                action.data.block.blockValidation.blockValidationType["skip-validation-transactions-from-values"] = !action.data.value;
            else
            if (action.name === "block-added"  && (actionName === '' || actionName === action.name))
                this.blockchain.blocks.spliceBlocks(action.data.height);

        }


    }

}

export default RevertActions;