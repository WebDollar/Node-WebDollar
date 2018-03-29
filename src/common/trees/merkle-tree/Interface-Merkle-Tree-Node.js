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

        super(root, parent, edges, value);

        if (hash === undefined)
            hash = {sha256: new Buffer(32)};

        this.hash = hash;

    }

    serializeNodeData(){

        return Buffer.concat ( [
            this.hash.sha256,
            InterfaceTreeNode.prototype.serializeNodeData.apply(this, arguments),
        ]);

    }


    deserializeNodeData(buffer, offset){

        let hashSha256 =  BufferExtended.substr(buffer, offset, 32);
        offset += 32;

        this.hash = {sha256: hashSha256};

        arguments[1] = offset;
        offset = InterfaceTreeNode.prototype.deserializeNodeData.apply( this, arguments );

        return offset;
    }



    /**
     * When an Operation is done to a done, let's calculate its hash
     * @param node
     */
    _changedNode(node){

        if (this.root.autoMerklify)
            this.node._refreshHash(true);
    }




    validateTreeNode(validateMerkleTree){

        if (!InterfaceTreeNode.prototype.validateTreeNode.apply(this, arguments)) return false;

        if (typeof this.hash !== "object" || typeof this.hash.sha256 !== "object") throw {message: "hash or sha256 doesn't exist in node"}
        if ( !Buffer.isBuffer(this.hash.sha256) || this.hash.sha256.length !== 32 ) throw {message: "hash.sha256 is not a Buffer(32)"}

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


        if ( this.hash === undefined || this.hash === null || this.hash.sha256 === undefined || this.hash.sha256 === null )
            return false;
        else {
            initialHash = {};
            initialHash.sha256 = this.hash.sha256;
        }

        this._computeHash();

        if (initialHash === null && this.hash !== null)
            return false; // different hash
        if (initialHash.sha256 === null && this.hash.sha256 !== null) // different hash
            return false;

        if (this.hash.sha256.length !== initialHash.sha256.length)
            return false;

        for (let i = 0; i < this.hash.sha256.length; i++)
            if (this.hash.sha256[i] !== initialHash.sha256[i])
                return false;

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
            this.hash = { sha256: new Buffer(32) };
            return this.hash;
        }

        // calculating the value to hash which must be a buffer
        let valueToHash = this._getValueToHash(); //getting the node data

        if (this.edges.length === 0){ //Leaf Node (terminal node)

            if ( this.value === null)
                throw ("Leaf nodes has not value");
            if ( this.isLeaf() === false)
                throw ("Node is not leaf");

            // Let's hash

            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( valueToHash ) )
            this.hash = {sha256: sha256};

        } else
        if (this.edges.length > 0){

            let hashConcat = [];//it will be the hash

            for (let i = 0; i < this.edges.length; i++){

                // the hash was not calculated ....
                if (this.edges[i].targetNode.hash === null || this.edges[i].targetNode.hash === undefined)
                    this.edges[i].targetNode._computeHash();

                if (i === 0)
                    hashConcat.push( new Buffer(this.edges[i].targetNode.hash.sha256) );
                else
                    hashConcat.push ( this.edges[i].targetNode.hash.sha256 );
            }

            if (hashConcat === [])
                throw ("Empty node with invalid sha256");

            hashConcat = Buffer.concat(hashConcat);

            let sha256 = WebDollarCrypto.SHA256( WebDollarCrypto.SHA256( Buffer.concat ( [valueToHash, hashConcat]  ) ));
            this.hash = {sha256: sha256};

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

            if (this.parent !== null && this.parent !== undefined) throw {message: "Couldn't compute hash because Node parent is empty"};

            result = result && this.parent._refreshHash(true);

        }

        return result;
    }


}

export default InterfaceMerkleTreeNode;