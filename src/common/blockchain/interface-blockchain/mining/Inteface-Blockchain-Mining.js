import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'
import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'

class InterfaceBlockchainMining{


    constructor (){

        this.nonce = null;
        this.difficulty = null;

    }

    mine( block,  difficulty, initialNonce ){

        if (typeof difficulty === "undefined" && difficulty !== null && difficulty !== this.difficulty)
            this.setDifficulty(difficulty);

        let nonce = initialNonce||0;

        while (nonce < 0x100000000){

            let hash = block.hash(nonce);

            if ( hash >= difficulty)
                break;


        }

    }

    setDifficulty(newDifficulty){

        this.difficulty = newDifficulty;

    }


}

export default InterfaceBlockchainMining;