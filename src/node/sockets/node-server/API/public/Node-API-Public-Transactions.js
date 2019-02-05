import Blockchain from "main-blockchain/Blockchain";


class NodeAPIPublicTransactions {


  pending(req, res) {
    return Blockchain.Transactions.pendingQueue.listArray;
  }

}

export default new NodeAPIPublicTransactions();
