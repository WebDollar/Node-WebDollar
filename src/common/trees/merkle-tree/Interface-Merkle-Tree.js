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

    _createNode(parent, edges, value){
        return new InterfaceMerkleTreeNode(parent, edges, value);
    }


    /**
     * When an Operation is done to a done, let's calculate its hash
     * @param node
     */
    _changedNode(node){

        if (this.autoMerklify)
            this._refreshHash(node, true);
    }


    /**
     * Validate the Merkle Tree if the Hashes were calculated correctly
     * @param node
     * @returns {*}
     */
    _validateHash(node){

        let result = InterfaceTree.prototype._validateHash.call(this, node, this._validateHash);
        if (!result) return false;

        return true;
    }

    _checkInvalidNode(node){
        //it should have a valid hash

        if ( node.hash === undefined || node.hash === null) return false;

        return true;
    }

    /**
     * check the hash of node ... it must have an initial hash
     * @param node
     * @returns {boolean}
     */
    _validateHash(node){

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
     * return buffer
     */
    _getValueToHash(node){
        // if (!Buffer.isBuffer(node.value))
        //     console.log("_getValueToHash", node.value);

        if (Buffer.isBuffer(node.value) )
            return node.value
        else
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
            node.hash = { sha256: new Buffer(32) };
            return node.hash;
        }

        // calcuating the value to hash which must be a buffer
        let valueToHash = this._getValueToHash(node); //getting the node data

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
                    hashConcat.sha256 = new Buffer(node.edges[i].targetNode.hash.sha256);
                }
                else {
                    hashConcat.sha256 = Buffer.concat ( [hashConcat.sha256, node.edges[i].targetNode.hash.sha256]);
                }

            }

            if (hashConcat.sha256 === null) throw ("Empty node with invalid sha256");

            // Let's hash
            console.log("valueToHash222", typeof valueToHash, valueToHash.toString("hex"))
            console.log("hashConcat.sha256 ", typeof hashConcat.sha256 , hashConcat.sha256.toString("hex") )

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
    _refreshHash(node, forced){

        if (node === null ||  node === undefined) throw "Couldn't compute hash because Node is empty";

        let result = false;
        let hashAlreadyComputed = false;

        console.log("_refreshHash", forced);
        if ( forced === undefined || forced === false ) {
            // in case it must recalculate the hash by force
            hashAlreadyComputed = true;
            result  = this._validateHash(node);
        }

        // no changes...
        if (!result) {

            result = true;

            console.log("sha_before", node.hash.sha256.toString("hex"));

            if (!hashAlreadyComputed)
                this._computeHash(node)

            console.log("sha_after", node.hash.sha256.toString("hex"));

            if (node.parent !== null && node.parent !== undefined) {
                for (let j=0; j<node.parent.edges.length; j++) {
                    console.log(j, "node === node.parent.edges[j].targetNode", node === node.parent.edges[j].targetNode);
                }
            }
            console.log("_refreshHash", node.parent);

            if (node.parent !== null)
                result = result && this._refreshHash(node.parent, true)

        }

        return result;
    }

    /**
     * Verify two trees and its hashes
     * @param tree
     * @returns boolean
     */
    matches(tree){

        let result = this.validateRoot();
        result = result && tree.validateRoot();

        result = result && this.root.hash.sha256.equals(tree.root.hash.sha256);

        return result;
    }

}

export default InterfaceMerkleTree