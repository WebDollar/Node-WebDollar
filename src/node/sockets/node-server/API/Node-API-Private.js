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
        
        var from;
        var to;

        if (req.from && req.from != 'null' &&
          req.to && req.to != 'null' &&
          req.amount && req.amount != 'null') {
          from = req.from;
          to = req.to;
        } else if(req.from && req.from != 'null') {
          // fan out
          from = req.from;
          to = req.multiple_to;
        } else if(req.to && req.to != 'null') {
          // fan in
          from = req.multiple_from;
          to = req.to;
        }

        let amount = parseInt(req.amount) ? parseInt(req.amount) * WebDollarCoins.WEBD : undefined;
        let fee = parseInt(req.fee) * WebDollarCoins.WEBD;

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

    async walletCreate (){

        console.info('Create new address via API');
        try {
            let address = await Blockchain.Wallet.createNewAddress();
            console.info("Address was created: " + address.address);
            return {result: true, wallet: {
                address: address.address.toString('hex'),
                publicKey: address.publicKey.toString('hex'),
                privateKey: await address.exportAddressPrivateKeyToHex()
            }};
        } catch(err) {
            console.err(err);
            return false;
        }


    }

}


export default new NodeAPIPrivate();
