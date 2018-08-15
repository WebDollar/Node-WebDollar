import InterfaceTreeNode from 'common/trees/Interface-Tree-Node'
import BufferExtended from "common/utils/BufferExtended"
import WebDollarCryptoData from 'common/crypto/WebDollar-Crypto-Data'
import WebDollarCrypto from "common/crypto/WebDollar-Crypto";

class InterfaceMerkleTreeNode extends InterfaceTreeNode{

    // parent : Node
    // value : data
    // edges : [ of Edges]
    // hash

    constructor(root, parent, edges, value, hash){

        super(root, parent,  edges, value);

        if (hash === undefined)
            hash = new Buffer(32);

        this.hash = hash;

    }

    serializeNodeData(){

        return Buffer.concat ( [
            this.hash,
            InterfaceTreeNode.prototype.serializeNodeData.apply(this, arguments),
        ]);

    }


    deserializeNodeData(buffer, offset){

        this.hash =  BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        arguments[1] = offset;
        offset = InterfaceTreeNode.prototype.deserializeNodeData.apply( this, arguments );

        return offset;
    }



    /**
     * When an Operation is done to a done, let's calculate its hash
     * @param node
     */
    _changedNode(){

        if (this.root.autoMerklify)
            this._refreshHash(true);
    }




    validateTreeNode(validateMerkleTree){

        if (!InterfaceTreeNode.prototype.validateTreeNode.apply(this, arguments)) return false;

        if (typeof this.hash !== "object" ) throw {message: "hash or sha256 doesn't exist in node"}
        if ( !Buffer.isBuffer(this.hash) || this.hash.length !== 32 ) throw {message: "hash is not a Buffer(32)"}

        if (validateMerkleTree)
            return this._validateHash();

        return true;

    }

    /**
     * check the hash of node ... it must have an initial hash
     * @param node
     * @returns {boolean}
     */
    _validateHash(){

        //validate to up

        let initialHash = null;


        if ( this.hash === undefined || this.hash === null  )
            return false;
        else
            initialHash = this.hash;

        this._computeHash();

        if (initialHash === null && this.hash !== null)
            return false; // different hash

        if (this.hash.length !== initialHash.length)
            return false;

        if (!this.hash.equals(initialHash)) return false;

        return true;
    }

    /**
     * It returns the Value to be hashed
     * @param node
     * return buffer
     */
    _getValueToHash(){

        if (Buffer.isBuffer(this.value) )
            return this.value;
        else
            return WebDollarCryptoData.createWebDollarCryptoData(this.value, true).buffer;
    }

    /**
     * compute the hash of a given node
     * @returns {*}
     */
    _computeHash(){

        if (this === this.root && this.edges.length === 0){
            this.hash = new Buffer(32);
            return this.hash;
        }

        // calculating the value to hash which must be a buffer
        let valueToHash = this._getValueToHash(); //getting the node data

        if (this.edges.length === 0){ //Leaf Node (terminal node)

            if ( this.value === null)
                throw {message: "Leaf nodes has not value"};
            if ( this.isLeaf() === false)
                throw {message: "Node is not leaf"};

            // Let's hash

            this.hash  = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( valueToHash ) )

        } else
        if (this.edges.length > 0){

            let hashConcat = [];//it will be the hash

            for (let i = 0; i < this.edges.length; i++){

                // the hash was not calculated ....
                if (this.edges[i].targetNode.hash === null || this.edges[i].targetNode.hash === undefined)
                    this.edges[i].targetNode._computeHash();

                if (i === 0)
                    hashConcat.push( new Buffer(this.edges[i].targetNode.hash) );
                else
                    hashConcat.push ( this.edges[i].targetNode.hash );
            }

            if (hashConcat === [])
                throw {message: "Empty node with invalid sha256"};

            hashConcat = Buffer.concat(hashConcat);

            this.hash = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( Buffer.concat ( [valueToHash, hashConcat]  ) ));

            return this.hash;
        }

        return this.hash;
    }

    /**
     * Recalculate the hash of a node if it is different and propagate the change to the root
     * @param node
     * @returns {boolean}
     */
    _refreshHash(forced){

        let result = false;
        let hashAlreadyComputed = false;

        if ( forced === undefined || forced === false ) {
            // in case it must recalculate the hash by force
            hashAlreadyComputed = true;
            result  = this._validateHash();
        }

        // no changes...
        if (!result) {

            result = true;

            if (!hashAlreadyComputed)
                this._computeHash();

            if (this.root !== this) {
                if (this.parent === null || this.parent === undefined)
                    throw {message: "Couldn't compute hash because Node parent is empty"};

                result = result && this.parent._refreshHash(true);
            }

        }

        return result;
    }


}

export default InterfaceMerkleTreeNode;