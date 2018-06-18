import InterfaceBlockchainMining from "../Interface-Blockchain-Mining";

class InterfaceBlockchainBackboneMining extends InterfaceBlockchainMining {


    //backbone mining is the same with InterfaceBlockchainMining

    constructor(blockchain, minerAddress, miningFeeThreshold){

        super(blockchain, minerAddress, miningFeeThreshold);

        this.WORKER_NONCES_WORK = 200;

        this.block = undefined;
        this.undefined = undefined;
        this._workerResolve = undefined;

        this.end = 0;
    }

    async _mineNonces(start, end){

        let answer = await InterfaceBlockchainMining.prototype._mineNonces.call(this, start, Math.min(this.end, start+this.WORKER_NONCES_WORK) );

        if (!answer.result && (start + this.WORKER_NONCES_WORK+1 <= this.end)){

            let answer2 = await (new Promise((resolve)=>{

                setTimeout( async () => {

                    let newAnswer = await this._mineNonces(start + this.WORKER_NONCES_WORK+1, Math.min(this.end, start+this.WORKER_NONCES_WORK+this.WORKER_NONCES_WORK ));
                    resolve(newAnswer);

                }, 5);

            }));

            if (answer2.hash.compare(answer.hash) < 0) answer = answer2;

        }



        return answer;

    }

    async mine(block, difficulty, start, end){

        this.block = block;
        this.difficulty = difficulty;
        this.end = Math.min(end, 0xFFFFFFFF);

        return await this._mineNonces(start, start + this.WORKER_NONCES_WORK);

    }


}

export default InterfaceBlockchainBackboneMining;