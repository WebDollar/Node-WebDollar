import {isArray, isInteger, uniq, defaults} from 'lodash';
import BufferExtended from '../../../common/utils/BufferExtended';
import InterfaceBlockchainAddressHelper from '../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

/**
 * Repository for Blocks
 */
class BlockRepository {
    constructor(oBlockchain, oConfig = {}) {
        this._oBlockchain = oBlockchain;
        this._oConfig     = defaults(oConfig, {
            limit: 50
        });
    }

    /**
     * @param {string|int}mBlockNumber
     * @return {InterfaceBlockchainBlock|null}
     */
    async findByNumberOrTag(mBlockNumber) {
        switch(mBlockNumber) {
            case 'latest':
                mBlockNumber = this._oBlockchain.blocks.last.height;
                break;
            case 'earliest':
                mBlockNumber = 0;
                break;
            case 'pending':
                return null;
        }

        if (isInteger(mBlockNumber) === false || mBlockNumber < this._oBlockchain.blocksStartingPoint || mBlockNumber > this._oBlockchain.blocks.last.height) {
            return null;
        }

        try {
            return await this._oBlockchain.getBlock(mBlockNumber);
        }
        catch (e) {
            return null;
        }
    }

    /**
     * @param {int} mStartingNumber
     * @param {int|string} mEndingNumber
     * @return {InterfaceBlockchainBlock[]|Array}
     */
    async findByRange(mStartingNumber, mEndingNumber) {
        let aBlocks = [];

        switch(mEndingNumber) {
            case 'latest':
                mEndingNumber = this._oBlockchain.blocks.last.height;
                break;
            case 'earliest':
                throw new Error('Finding a block by "earliest" is not supported');
            case 'pending':
                throw new Error('Finding a block by "pending" is not supported');
        }

        if (isInteger(mStartingNumber) === false || isInteger(mEndingNumber) === false) {
            return aBlocks;
        }

        if (mEndingNumber < mStartingNumber) {
            [mStartingNumber, mEndingNumber] = [mEndingNumber, mStartingNumber];
        }

        for (let i = mStartingNumber; i <= mEndingNumber; i++) {
            let oBlock = await this.findByNumberOrTag(i);

            if (oBlock !== null) {
                aBlocks.push(await this.findByNumberOrTag(i));
            }

            if (aBlocks.length === this._oConfig.limit) {
                break;
            }
        }

        return aBlocks;
    }

    /**
     * @param {Array|int[]}aBlockNumbers
     * @return {InterfaceBlockchainBlock[]|Array}
     */
    async findByNumbers(aBlockNumbers) {
        let aBlocks = [];

        if (isArray(aBlockNumbers) === false) {
            return aBlocks;
        }

        aBlockNumbers = uniq(aBlockNumbers);

        for (const nBlockNumber of aBlockNumbers) {
            const oBlock = await this.findByNumberOrTag(nBlockNumber);

            if (oBlock !== null) {
                aBlocks.push(oBlock);
            }

            if (aBlocks.length === this._oConfig.limit) {
                break;
            }
        }

        return aBlocks;
    }

    /**
     * @FIXME This method is very very slow as it iterates over the whole blockchain. Use it with caution
     * @param {string} sAddress
     * @return {int}
     */
    countByAddress(sAddress) {
        throw new Error('Count by Address is not supported. Address: ' + sAddress);

        //@FIXME Find a better way, other than iterating over the whole blockchain

        // let nCount = 0;
        //
        // const aBlockNumbers = Array.apply(null, {length: this._oBlockchain.blocks.last.height}).map(Number.call, Number);
        //
        // for (const nBlockNumber of aBlockNumbers)
        // {
        //     const sMinerAddress = BufferExtended.toBase(InterfaceBlockchainAddressHelper.generateAddressWIF(this._oBlockchain.blocks[nBlockNumber].data._minerAddress));
        //     if (sMinerAddress === sAddress)
        //     {
        //         nCount++;
        //     }
        // }
        //
        // return nCount;
    }

    /**
     * @param {string} sHash
     * @return {InterfaceBlockchainBlock|null}
     */
    async findByHash(sHash) {
        return await this._oBlockchain.getBlockByHash(sHash);
    }
}

export default BlockRepository;
