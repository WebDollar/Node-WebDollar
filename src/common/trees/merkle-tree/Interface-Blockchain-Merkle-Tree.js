import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import InterfaceTree from 'common/trees/Interface-Tree'

class InterfaceBlockchainMerkleTree extends InterfaceTree{

    /**
     * check the hash of node ... it must have an initial hash
     * @param node
     * @returns {boolean}
     */
    verifyHashNode(node){

        //validate to up
        let initialHash = node.hash.buffer.toBytes();

        this.computeHash(node);

        if (node.hash.buffer.length !== initialHash.length) return false;

        for (let i=0; i<node.hash.buffer.length; i++)
            if (node.hash.buffer[i] !== initialHash[i] ) return false;

        return true;

    }

    /**
     * compute the hash of a given node
     * @param node
     * @returns {*}
     */
    _computeHash(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute hash because Node is empty";

        if (node.edges.length === 0){ //Lead Node (terminal node)

            if (node.value === null) throw ("Leaf nodes has not value");

            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( node.value ) )
            node.hash = sha256;

            return node.hash;

        } else
        if (node.edges.length > 0){

            let hashConcat = null;//it will be a WebDollarCryptoData

            for (let i=0; i < node.edges.length; i++){

                // the hash was not calculated ....
                if (node.edges[i].targetNode.hash === null || typeof node.edges[i].targetNode.hash === "undefined" || !WebDollarCryptoData.isWebDollarCryptoData(node.edges[i].targetNode.hash))
                    this.computeHash(node.edges[i].targetNode);

                if (i === 0)
                    hashConcat = node.edges[i].targetNode.hash;
                else
                    hashConcat.buffer = Buffer.concat( [hashSum.buffer, node.edges[i].targetNode.hash.buffer ] );

            }

            //Let's hash
            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( hashConcat ) )
            node.hash = sha256;

            return node.hash;
        }

    }

    refreshHash(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute hash because Node is empty";

        let result  = this.verifyHashNode(node)

        // no changes...
        if (result) return result;
        else {

            this._computeHash(node)

            if (node.parent !== null)
                this.refreshHash(node.parent)

        }

    }


}

export default InterfaceBlockchainMerkleTree