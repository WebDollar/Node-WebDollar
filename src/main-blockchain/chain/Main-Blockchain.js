import MiniBlockchain from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain'

class MainBlockchain extends  MiniBlockchain{

    constructor (  ) {

        super();
        
        this.load().then(async (response) => {
            if (response !== true) {
                await this.save();
            }
        });

    }

}

export default MainBlockchain