class RevertActions {

    constructor(blockchain){

        this.blockchain = blockchain;
        this._actions = [];

    }

    push(data){
        this._actions .push(data);
    }

    revertOperations(){

        for (let i=this._actions .length-1; i>=0; i--) {

            let action = this._actions [i];

            switch (action.name){

                case "revert-add-accountant-tree":
                    this.blockchain.accountantTree.delete( action.data.address );
                    break;

                case "revert-updateAccount":
                    let answer = this.blockchain.accountantTree.updateAccount( action.data.address, -action.value, action.tokenId  );

                    //force to delete first time miner
                    if (answer === null && this.blockchain.accountantTree.getAccountNonce(action.data.address) === 0)
                        this.blockchain.accountantTree.delete(action.data.address);

                    break;

                case "revert-skip-validation-transactions-from-values":
                    action.data.block.blockValidation.blockValidationType["skip-validation-transactions-from-values"] = !action.data.value;
                    break;

                case "block-added":
                    this.blockchain.blocks.spliceBlocks(action.data.height);
                    break;

            }

        }

        this.accountantTree.updateAccount(block.data.minerAddress, -block.reward, undefined);

        //force to delete first time miner
        if (answer === null && this.accountantTree.getAccountNonce(block.data.minerAddress) === 0)
            this.accountantTree.delete(block.data.minerAddress);
    }

}

export default RevertActions;