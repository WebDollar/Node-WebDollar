import Blockchain from "main-blockchain/Blockchain";


class NodeAPIPublicTransactions {


  pending(req, res) {
    return Blockchain.Transactions.pendingQueue.listArray;
  }

  async checkTransactionExists(req, res){

    try{

      let txId = req.tx_id;
      if ( typeof txId !== "string" || txId.length !== 64 ) throw {message: "Invalid Tx Id"}

      let answer = await Blockchain.Transactions.checkVirtualizedTxId( req.tx_id );
      return {result: !!answer , height: !!answer ? answer : undefined };

    }catch(exception){
      return {result: false, message: exception.message}
    }


  }

}

export default new NodeAPIPublicTransactions();
