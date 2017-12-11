import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

class InterfaceBlockchainMining{


    constructor (){

        this.nonce = null;

    }


    mine(block,  initialNonce){

        let nonce = initialNonce||0;

        while (nonce < 0x100000000){

            block.nonce = nonce;


        }

    }


}

export default InterfaceBlockchainMining;