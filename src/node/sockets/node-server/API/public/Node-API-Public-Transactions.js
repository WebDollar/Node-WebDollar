import Blockchain from "main-blockchain/Blockchain";


class NodeAPIPublicTransactions {


  pending(req, res) {
    return Blockchain.Transactions.pendingQueue.list;
  }

}

export default new NodeAPIPublicTransactions();
