import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/Webdollar-Crypto-Data'

import InterfaceTree from 'common/trees/Interface-Tree'

/*
    it extends the Tree Node with hash {sha256: WebDollarCryptoData }
 */

class InterfaceMerkleTree extends InterfaceTree{

    /**
     * When an Operation is done to a done, let's calculate its hash
     * @param node
     */
    changedNode(node){
        this.refreshHash(node);
    }

    /**
     * Validate the Merkle Tree if the Hashes were calculated correctly
     * @param node
     * @returns {*}
     */
    validateTree(node, list){

        //recalculate list, not really necessary if it was provided
        if (typeof list === 'undefined' || list === null || list === [])
            list = this.levelSearch(node);

        for (let i=list.length-1; i >= 0; i--)
            for (let j=list[i].length-1; j >=0; j-- ) {

                let result = this.validateHash(list[i][j]);

                if (!result) {
                    console.log("validateTree", i,j, list[i][j], false)
                    return false;
                }
            }

        return true;
    }

    /**
     * check the hash of node ... it must have an initial hash
     * @param node
     * @returns {boolean}
     */
    validateHash(node){

        //validate to up

        let initialHash = null;


        if (typeof node.hash === 'undefined' || node.hash === null  || typeof node.hash.sha256 === 'undefined' || node.hash.sha256 === null )  return false;
        else {
            initialHash = {};
            initialHash.sha256 = node.hash.sha256.toUint8Array();
        }


        this._computeHash(node);

        if (initialHash === null && node.hash !== null) return false; // different hash
        if (initialHash.sha256 === null && node.hash.sha256 !== null) return false; // different hash


        if (node.hash.sha256.buffer.length !== initialHash.sha256.length) return false;

        for (let i=0; i<node.hash.sha256.buffer.length; i++)
            if (node.hash.sha256.buffer[i] !== initialHash.sha256[i]) return false;

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

            if ( !node.leaf  || node.value === null || typeof node === "undefined") throw ("Leaf nodes has not value");


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
                    hashConcat.sha256 = new Buffer ( node.edges[i].targetNode.hash.sha256.buffer);
                }
                else {
                    hashConcat.sha256 = Buffer.concat( [hashConcat.sha256, node.edges[i].targetNode.hash.sha256.buffer]);
                }

            }

            if (hashConcat.sha256 === null) throw ("Empty node with invalid sha256");

            // Let's hash
            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( WebDollarCryptoData.createWebDollarCryptoData( hashConcat.sha256 )  ) )
            node.hash = {sha256: sha256};

            return node.hash;
        }

    }

    /**
     * Recalculate the hash of a node if it is different and propagate the change to the root
     * @param node
     * @returns {boolean}
     */
    refreshHash(node, forced){

        if (node === null || typeof node === 'undefined') throw "Couldn't compute hash because Node is empty";

        let result = false;

        if ( typeof forced === "undefined" || forced === false ) result  = this.validateHash(node); // in case it must recalculate the hash by force

        // no changes...
        if (!result) {

            result = true;

            this._computeHash(node)

            if (node.parent !== null)
                result = result && this.refreshHash(node.parent, true)

        }

        return result;
    }


}

export default InterfaceMerkleTree