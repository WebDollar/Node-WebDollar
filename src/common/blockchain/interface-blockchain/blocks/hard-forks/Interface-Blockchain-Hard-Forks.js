import NodeAPIPublic from "node/sockets/node-server/API/Node-API-Public";
import InterfaceBlockchainAddressHelper from "../../addresses/Interface-Blockchain-Address-Helper";
import WebDollarCoins from "common/utils/coins/WebDollar-Coins"

class InterfaceBlockchainHardForks{

    constructor(blockchain){

        this.blockchain = blockchain;

        this._output = [];
        this._processed = [];

        this._txs = {};
    }


    async process (address, height) {

        address = InterfaceBlockchainAddressHelper.getUnencodedAddressFromWIF(address);

        let list = [address];

        let findAddressInList = (adr)=>{

            for (let i=0; i<list.length; i++)
                if (list[i].equals(adr))
                    return i;

            return -1;
        };


        // Get mined blocks and transactions
        for (let i=height; i<this.blockchain.blocks.length; i++) {

            let block = await this.blockchain.getBlock(i);

            for (let j = 0; j < block.data.transactions.transactions.length; j++) {

                let transaction = block.data.transactions.transactions[j];

                let addrIndex = findAddressInList(transaction.from.addresses[0].unencodedAddress);
                if (addrIndex !== -1) {

                    let from = InterfaceBlockchainAddressHelper.generateAddressWIF(transaction.from.addresses[0].unencodedAddress, false, true);
                    let to = InterfaceBlockchainAddressHelper.generateAddressWIF(transaction.to.addresses[0].unencodedAddress, false, true);

                    console.log("from ",from," => ", to, transaction.to.addresses[0].amount/WebDollarCoins.WEBD, " :: ", transaction.from.addresses[0].amount/WebDollarCoins.WEBD);

                    if (this._output[to] === undefined) this._output[to] = 0;
                    if (this._output[from] === undefined) this._output[from] = 0;

                    this._output[to]   += Math.min( this._output[from], transaction.to.addresses[0].amount);
                    this._output[from] -= Math.min( this._output[from], transaction.to.addresses[0].amount );


                    let fee = transaction.fee;

                    let miner = InterfaceBlockchainAddressHelper.generateAddressWIF( block.data.minerAddress, false, true);
                    if (this._output[miner] === undefined) this._output[miner] = 0;
                    this._output[miner] += Math.min( this._output[from], fee);


                    this._output[from] -= Math.min( this._output[from], fee );



                    console.log("miner  ", miner, "  ", fee / WebDollarCoins.WEBD);

                    list.push(transaction.to.addresses[0].unencodedAddress);
                    list.push( block.data.minerAddress);

                }


            }


        }

    }


    async revertAllTransactions(address, height, revertActions, totalAmount, finalAddress){

        this._output = {};
        this._processed = [];

        this._output[address] = totalAmount;

        await this.process( address, height ) ;



        console.log("===============OUTPUT===========");
        console.log("================================");

        for (let key in this._output)
            if (this._output[key] > 0 && this._output[key] < 200*10000)
                delete this._output[key];

        let sum = 0;

        for (let key in this._output) {
            sum += this._output[key];
            console.log(key, -this._output[key] / 10000);
        }
        console.log("TOTAL:", sum / 10000);

        let json = {};
        sum = 0;
        for (let key in this._output) {

            console.log( "key", key, this.blockchain.accountantTree.getBalance(key), -this._output[key] );

            if (key !== undefined && this._output[key] > 0) {
                this.blockchain.accountantTree.updateAccount(key, -this._output[key], undefined, revertActions, false);
                sum += this._output[key];

                json[key] = - this._output[key];
            }
        }

        for (let key in this._output)
            console.log(key, this.blockchain.accountantTree.getBalance(key) / WebDollarCoins.WEBD, "WEBD");

        this.blockchain.accountantTree.updateAccount( finalAddress, sum  );

        json[finalAddress] = sum;

        console.log("");
        console.log("");
        console.log("JSON", JSON.stringify(json));
        console.log("");
        console.log("");

        console.log("DONE", this.blockchain.accountantTree.getBalance( finalAddress )/WebDollarCoins.WEBD, "WEBD");

        return json;
    }

}

export default InterfaceBlockchainHardForks;