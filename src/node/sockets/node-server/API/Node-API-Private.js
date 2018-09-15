import Blockchain from "main-blockchain/Blockchain"
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

class NodeAPIPrivate{

    constructor(){

    }

    minerBalance(req, res){

        let addressString = Blockchain.blockchain.mining.minerAddress;
        let balance = Blockchain.blockchain.accountantTree.getBalance(addressString, undefined);

        balance = (balance === null) ? 0 : (balance / WebDollarCoins.WEBD);

        return {address: addressString, balance: balance};

    }

    async walletImport(req, res){

        let address = req.address;
        let publicKey = req.publicKey;
        let privateKey = req.privateKey;

        let content = {
            version: '0.1',
            address: address,
            publicKey: publicKey,
            privateKey: privateKey,
        };

        try {

            let answer = await Blockchain.Wallet.importAddressFromJSON(content);

            if (answer.result === true) {
                await Blockchain.Wallet.saveWallet();
                return {result: true, address: address};
            } else
                return {result: false, message: answer.message};

        } catch(err) {
            return {result: false, message: err.message};
        }

    }

    async walletCreateTransaction(req, res){

        let from = req.from;
        let to = req.to;
        let amount = req.amount;
        let fee = req.fee;

        amount = parseInt(amount) * WebDollarCoins.WEBD;
        fee = parseInt(fee) * WebDollarCoins.WEBD;

        let result = await Blockchain.Transactions.wizard.createTransactionSimple(from, to, amount, fee);

        return result;


    }

    async walletExport (){

        let addressString = Blockchain.blockchain.mining.minerAddress;
        let answer = await Blockchain.Wallet.exportAddressToJSON(addressString);

        if (answer.data)
            return {result: true, wallet: answer.data};

        return {result: false};

    }

}


export default new NodeAPIPrivate();
