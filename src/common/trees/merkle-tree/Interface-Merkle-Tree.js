import WebDollarCrypto from 'common/crypto/WebDollar-Crypto'
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'

import InterfaceTree from 'common/trees/Interface-Tree'
import InterfaceMerkleTreeNode from './Interface-Merkle-Tree-Node'

/*
    it extends the Tree Node with hash {sha256: WebDollarCryptoData }
 */

class InterfaceMerkleTree extends InterfaceTree{

    constructor(){
        super();

        this.autoMerklify = true;
    }

    createNode(parent, edges, value){
        return new InterfaceMerkleTreeNode(parent, edges, value);
    }


    /**
     * When an Operation is done to a done, let's calculate its hash
     * @param node
     */
    changedNode(node){

        if (this.autoMerklify)
            this.refreshHash(node, true);
    }


    /**
     * Validate the Merkle Tree if the Hashes were calculated correctly
     * @param node
     * @returns {*}
     */
    validateTree(node){

        let result = InterfaceTree.prototype.validateTree.call(this, node, this.validateHash);
        if (!result) return false;

        return true;
    }

    checkInvalidNode(node){
        //it should have a valid hash

        if ( node.hash === undefined || node.hash === null) return false;

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


        if ( node.hash === undefined || node.hash === null  ||  node.hash.sha256 === undefined || node.hash.sha256 === null )  return false;
        else {
            initialHash = {};
            initialHash.sha256 = node.hash.sha256;
        }


        this._computeHash(node);

        if (initialHash === null && node.hash !== null) return false; // different hash
        if (initialHash.sha256 === null && node.hash.sha256 !== null) return false; // different hash


        if (node.hash.sha256.length !== initialHash.sha256.length) return false;

        for (let i=0; i<node.hash.sha256.length; i++)
            if (node.hash.sha256[i] !== initialHash.sha256[i]) return false;

        return true;

    }

    /**
     * It returns the Value to be hashed
     * @param node
     * return WebDollarCryptoData
     */
    getValueToHash(node){
        // if (!Buffer.isBuffer(node.value))
        //     console.log("getValueToHash", node.value);

        return WebDollarCryptoData.createWebDollarCryptoData(node.value, true).buffer;
    }

    /**
     * compute the hash of a given node
     * @param node
     * @returns {*}
     */
    _computeHash(node){

        if (node === null ||  node === undefined) throw "Couldn't compute hash because Node is empty";

        if (node === this.root && node.edges.length === 0){
            node.hash = { sha256: new Buffer(0) };
            return node.hash;
        }

        // calcuating the value to hash which must be a buffer
        let valueToHash = this.getValueToHash(node); //getting the node data

        if (node.edges.length === 0){ //Leaf Node (terminal node)

            if ( node.value === null || node === undefined) throw ("Leaf nodes has not value");
            if ( node.isLeaf() === false) throw ("Node is not leaf");

            // Let's hash

            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( valueToHash ) )
            node.hash = {sha256: sha256};

        } else
        if (node.edges.length > 0){

            let hashConcat = {sha256: null};//it will be the hash

            for (let i=0; i < node.edges.length; i++){

                // the hash was not calculated ....
                if (node.edges[i].targetNode.hash === null || node.edges[i].targetNode.hash === undefined )
                    this._computeHash(node.edges[i].targetNode);

                if (i === 0) {
                    hashConcat.sha256 = node.edges[i].targetNode.hash.sha256;
                }
                else {
                    Buffer.concat ( [hashConcat.sha256, node.edges[i].targetNode.hash.sha256]);
                }

            }

            if (hashConcat.sha256 === null) throw ("Empty node with invalid sha256");

            // Let's hash
            // console.log("valueToHash222", typeof valueToHash, valueToHash)
            // console.log("hashConcat.sha256 ", typeof hashConcat.sha256 , hashConcat.sha256 )

            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( Buffer.concat ( [valueToHash, hashConcat.sha256 ]  ) ));
            node.hash = {sha256: sha256};

            return node.hash;
        }



        return node.hash;

    }

    /**
     * Recalculate the hash of a node if it is different and propagate the change to the root
     * @param node
     * @returns {boolean}
     */
    refreshHash(node, forced){

        if (node === null ||  node === undefined) throw "Couldn't compute hash because Node is empty";

        let result = false;
        let hashAlreadyComputed = false;

        if ( forced === undefined || forced === false ) {
            // in case it must recalculate the hash by force
            hashAlreadyComputed = true;
            result  = this.validateHash(node);
        }

        // no changes...
        if (!result) {

            result = true;

            if (!hashAlreadyComputed)
                this._computeHash(node)

            if (node.parent !== null)
                if (!this.validateHash(node.parent))
                    result = result && this.refreshHash(node.parent, true)

        }

        return result;
    }


}

export default InterfaceMerkleTree