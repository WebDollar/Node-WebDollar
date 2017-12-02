import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import InterfaceTree from 'common/trees/Interface-Tree'

/*
    it extends the Tree Node with hash {sha256: WebDollarCryptoData }
 */

class InterfaceMerkleTree extends InterfaceTree{

    /**
     * check the hash of node ... it must have an initial hash
     * @param node
     * @returns {boolean}
     */
    verifyHash(node){

        //validate to up

        let initialHash = null;

        if (node.hash !== null && typeof node.hash !== 'undefined' && node.hash.hash256 !== null && typeof node.has.hash256 !== 'undefined') {
            initialHash = {};
            initialHash.sha256 = node.hash.sha256.toBytes();
        }

        this._computeHash(node);

        if (initialHash === null && node.hash !== null) return false; // different hash
        if (initialHash.sha256 === null && node.sha256.hash !== null) return false; // different hash

        if (node.hash.sha256.buffer.length !== initialHash.sha256.length) return false;

        for (let i=0; i<node.hash.sha256.buffer.length; i++)
            if (node.hash.sha256.buffer[i] !== initialHash.sha256[i] ) return false;

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
            node.hash = {sha256: sha256};

            return node.hash;

        } else
        if (node.edges.length > 0){

            let hashConcat = {sha256: null};//it will be a WebDollarCryptoData

            for (let i=0; i < node.edges.length; i++){

                // the hash was not calculated ....
                if (node.edges[i].targetNode.hash === null || typeof node.edges[i].targetNode.hash === "undefined" || !WebDollarCryptoData.isWebDollarCryptoData(node.edges[i].targetNode.hash))
                    this._computeHash(node.edges[i].targetNode);

                if (i === 0) {
                    hashConcat.sha256 = node.edges[i].targetNode.hash.sha256;
                }
                else {
                    hashConcat.sha256.buffer = Buffer.concat([hashConcat.sha256.buffer, node.edges[i].targetNode.hash.sha256.buffer]);
                }

            }

            // Let's hash
            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( hashConcat ) )
            node.hash = {sha256: sha256};

            return node.hash;
        }

    }

    /**
     * Recalculate the hash of a node if it is different and propagate the change to the root
     * @param node
     * @returns {boolean}
     */
    refreshHash(node){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute hash because Node is empty";

        let result  = this.verifyHash(node)

        // no changes...
        if (result) return result;
        else {

            this._computeHash(node)

            if (node.parent !== null)
                this.refreshHash(node.parent)

        }

    }


}

export default InterfaceMerkleTree