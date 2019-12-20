import Blockchain from "main-blockchain/Blockchain";


class NodeAPIPublicTransactions {


  pending(req, res) {
    return Blockchain.Transactions.pendingQueue.listArray;
  }

  pendingObject(req, res) {
    return Blockchain.Transactions.pendingQueue.listObject;
  }

  async checkTransactionExists(req, res){

    try{

      let txId = req.tx_id;
      if ( typeof txId !== "string" || txId.length !== 64 ) throw {message: "Invalid Tx Id"}

      let answer = await Blockchain.blockchain.blocks.loadingManager.getTxBlockHeight( req.tx_id );
      return {result: !!answer , height: !!answer ? answer : undefined };

    }catch(exception){
      return {result: false, message: exception.message}
    }

  }

  async getTransaction(req, res){

    try{

      let txId = req.tx_id;
      if ( typeof txId !== "string" || txId.length !== 64 ) throw {message: "Invalid Tx Id"}

      let answer = await Blockchain.blockchain.blocks.loadingManager.getTxBlockHeight( req.tx_id );

      if (!!answer){

        const block = await Blockchain.blockchain.getBlock(answer);

        const txIndex = block.data.transactions.findTransactionInBlockData(txId);

        if (txIndex === -1) throw {message: "Transaction not found in block"};

        const tx = block.data.transactions.transactions[txIndex];

        return { result: true, tx: tx.toJSON() };

      } else
        throw {result: false, message: "Transaction not found"};

    }catch(exception){
      return {result: false, message: exception.message}
    }

  }

}

export default new NodeAPIPublicTransactions();
