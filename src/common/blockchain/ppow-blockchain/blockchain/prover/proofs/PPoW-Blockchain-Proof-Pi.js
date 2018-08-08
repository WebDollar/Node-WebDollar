/**
 * Known as π
 */

import PPoWBlockchainProofBasic from "./PPoW-Blockchain-Proof-Basic"
import Serialization from 'common/utils/Serialization';
import BufferExtended from "../../../../../utils/BufferExtended";

class PPowBlockchainProofPi extends PPoWBlockchainProofBasic{

    /**
     * Returns ths upchain of current chain(C ↑ µ).
     */
    blocksGreaterLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (miu <= this.blocks[i].level)
                list.push(this.blocks[i]);

        return new PPowBlockchainProofPi(this.blockchain, list);
    }

    /**
     * Returns ths downchain of current chain(C ↓ µ).
     */
    blocksLessLevel(miu){

        let list = [];

        for (let i = 0; i < this.blocks.length; ++i)
            if (this.blocks[i].level <= miu)
                list.push(this.blocks[i]);

        return new PPowBlockchainProofPi(this.blockchain, list);
    }

    /**
     *
     * @param underlyingChain C
     * @param superChain C'
     */
    downSuperChainGetUnderlyingChain(underlyingChain ){

        //finding C[ C'[0] :
        let first = -1, last = -1;

        for (let i=0; i<this.blocks.length; i++)
            if (underlyingChain.blocks[i] === this.blocks[0]) {
                first = i;
                break;
            }

        //finding C[ : C'[-1] ]
        for (let i=0; i<underlyingChain.blocks.length; i++)
            if (underlyingChain.blocks[i] === this.blocks[this.blocks.length-1]) {
                last = i;
                break;
            }

        if (first === -1 || last === -1)
            return new PPowBlockchainProofPi(this.blockchain, []);
        else {

            let newUnderlyingChain = new PPowBlockchainProofPi(this.blockchain, []);

            if (last < first){
                let aux = last;
                last = first;
                first = aux;
            }

            for (let i=first; i<=last; i++)
                newUnderlyingChain.blocks.push(underlyingChain.blocks[i]);

            return newUnderlyingChain;
        }
    }

    //optimized
    downSuperChainGetUnderlyingChainLength(underlyingChain ){

        //finding C[ C'[0] :
        let first, last;

        for (let i=0; i<this.blocks.length; i++)
            if (underlyingChain.blocks[i] === this.blocks[0]) {
                first = i;
                break;
            }

        //finding C[ : C'[-1] ]
        for (let i=underlyingChain.blocks.length-1; i>=0; i--)
            if (underlyingChain.blocks[i] === this.blocks[this.blocks.length-1]) {
                last = i;
                break;
            }

        if (first === undefined || last === undefined)
            return 0 ;
        else {

            if (last < first){
                let aux = last;
                last = first;
                first = aux;
            }

            return last-first+1;
        }
    }

    serializeProof (proof){

        let buffer = [];

        buffer.push(Serialization.serializeNumber1Byte(proof.version));
        buffer.push(Serialization.serializeNumber3Bytes(proof.height));
        buffer.push(Serialization.serializeNumber4Bytes(proof.timeStamp));
        buffer.push(Serialization.serializeNumber4Bytes(proof.nonce));

        buffer.push(proof.data.hashData);
        buffer.push(proof.data.hashAccountantTree);

        buffer.push(Serialization.serializeHashOptimized(proof.difficultyTargetPrev));
        buffer.push(Serialization.serializeHashOptimized(proof.hash));
        buffer.push(Serialization.serializeHashOptimized(proof.hashPrev));

        buffer.push(Serialization.serializeNumber1Byte(proof.interlinks.length));

        let interlinks = [];
        let containGemesis = false;
        let genesisPosition = 0;

        for(let i=0; i<proof.interlinks.length; i++){

            if(proof.interlinks[i]===0)
                interlinks.push(Serialization.serializeNumber1Byte(0));
            else{
                interlinks.push(Serialization.serializeHashOptimized(proof.interlinks[i].bId));

                if(proof.interlinks[i].h === -1){
                    containGemesis = true;
                    genesisPosition = i;
                }else{
                    interlinks.push(Serialization.serializeNumber3Bytes(proof.interlinks[i].h));
                }

            }

        }

        if(containGemesis===true) {
            buffer.push(Serialization.serializeNumber1Byte( containGemesis === true ? 1 : 0 ));
            buffer.push(Serialization.serializeNumber1Byte( genesisPosition ));
        }else
            buffer.push(Serialization.serializeNumber1Byte( containGemesis === true ? 1 : 0 ));

        for (let i=0 ; i<interlinks.length ; i++) buffer.push(interlinks[i]);

        return Buffer.concat(buffer);

    }

    deserializeProof(buffer, offset = 0){

        let deserializeResult = {};
        let proof={
            data: {},
            interlinks : []
        };

        proof.version = Serialization.deserializeNumber1Bytes(buffer, offset);
        offset += 1;

        proof.height = Serialization.deserializeNumber3Bytes(buffer, offset);
        offset += 3;

        proof.timeStamp = Serialization.deserializeNumber4Bytes(buffer, offset);
        offset += 4;

        proof.nonce = Serialization.deserializeNumber4Bytes(buffer, offset);
        offset += 4;

        proof.data.hashData = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        proof.data.hashAccountantTree = BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        deserializeResult = Serialization.deserializeHashOptimized(buffer,offset);
        proof.difficultyTargetPrev = deserializeResult.hash;
        offset = deserializeResult.offset;

        deserializeResult = Serialization.deserializeHashOptimized(buffer,offset);
        proof.hash = deserializeResult.hash;
        offset = deserializeResult.offset;

        deserializeResult = Serialization.deserializeHashOptimized(buffer,offset);
        proof.hashPrev = deserializeResult.hash;
        offset = deserializeResult.offset;

        let currentInterlinkIterator = 0;
        let interlinksLength = Serialization.deserializeNumber1Bytes(buffer, offset);
        offset += 1;

        let genesisPosition = 0;
        let containsGenesis = Serialization.deserializeNumber1Bytes(buffer, offset);
        offset += 1;

        if(containsGenesis){
            genesisPosition = Serialization.deserializeNumber1Bytes(buffer, offset);
            offset += 1;
        }

        while(interlinksLength!==currentInterlinkIterator){

            let currentInterlinkPrefix = Serialization.deserializeNumber1Bytes(buffer, offset);

            if(currentInterlinkPrefix===0) {

                proof.interlinks.push(0);
                offset += 1;

            }
            else{

                deserializeResult = Serialization.deserializeHashOptimized(buffer,offset);
                offset = deserializeResult.offset;

                let deserializeHeight;

                if(containsGenesis && genesisPosition===currentInterlinkIterator)
                    deserializeHeight = -1;
                else{
                    deserializeHeight = Serialization.deserializeNumber3Bytes(buffer,offset);
                    offset += 3;
                }

                proof.interlinks.push({
                    h:deserializeHeight,
                    bId:deserializeResult.hash
                });

            }

            currentInterlinkIterator++;

        }

        return {
            data: proof,
            offset: offset
        };

    }

}

export default PPowBlockchainProofPi;