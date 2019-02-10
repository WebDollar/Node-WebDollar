import {isArray, isInteger, uniq, defaults} from 'lodash';
// import BufferExtended                from './../../../common/utils/BufferExtended';
// import InterfaceBlockchainAddressHelper from './../../../common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper';

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
    findByNumberOrTag(mBlockNumber) {
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

        const oBlock = this._oBlockchain.blocks[mBlockNumber];

        return typeof oBlock === 'undefined' ? null : oBlock;
    }

    /**
     * @param {int} mStartingNumber
     * @param {int|string} mEndingNumber
     * @return {InterfaceBlockchainBlock[]|Array}
     */
    findByRange(mStartingNumber, mEndingNumber) {
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

        mEndingNumber = mEndingNumber > this._oBlockchain.blocks.last.height ? this._oBlockchain.blocks.last.height : mEndingNumber;

        if (mEndingNumber < mStartingNumber) {
            [mStartingNumber, mEndingNumber] = [mEndingNumber, mStartingNumber];
        }

        for (let i = mStartingNumber; i <= mEndingNumber; i++) {
            let oBlock = this.findByNumberOrTag(i);

            if (oBlock === null) {
                throw new Error('Block "' + i + '" was not found');
            }

            aBlocks.push(this.findByNumberOrTag(i));

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
    findByNumbers(aBlockNumbers) {
        let aBlocks = [];

        if (isArray(aBlockNumbers) === false) {
            return aBlocks;
        }

        aBlockNumbers = uniq(aBlockNumbers);

        for (const nBlockNumber of aBlockNumbers) {
            aBlocks.push(this.findByNumberOrTag(nBlockNumber));

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
     * @FIXME This method is very very slow as it iterates over the whole blockchain. Use it with caution
     * @param {string} sHash
     * @return {InterfaceBlockchainBlock|null}
     */
    findByHash(sHash) {
        throw new Error('Find By Hash is not supported. Block hash: ' + sHash);

        //@FIXME Find a better way, other than iterating over the whole blockchain

        // const aBlockNumbers = Array.apply(null, {length: this._oBlockchain.blocks.last.height}).map(Number.call, Number);
        //
        // for (const nBlockNumber of aBlockNumbers)
        // {
        //     if (sHash === this._oBlockchain.blocks[nBlockNumber].hash.toString('hex'))
        //     {
        //         return this._oBlockchain.blocks[nBlockNumber];
        //     }
        // }
        //
        // return null;
    }
}

export default BlockRepository;
