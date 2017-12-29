import MiniBlockchain from 'common/blockchain/mini-blockchain/blockchain/Mini-Blockchain'

class MainBlockchain extends  MiniBlockchain{

    constructor (  ) {

        super();
        
        if (this.load() !== true)
            this.save();
    }

}

export default MainBlockchain