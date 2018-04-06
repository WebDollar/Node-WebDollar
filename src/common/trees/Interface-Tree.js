import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';
import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";
import BufferExtended from "common/utils/BufferExtended";

class InterfaceTree{

    constructor(db){

        this.db = db;

        this.createRoot();
    }

    createRoot(){
        this.root = new InterfaceTreeNode(null, null, null, [], null);
        this.root.root = this.root;
    }

    validateRoot(){

        if (this.root === undefined || this.root === null)
            throw {message: "root is invalid"};

        return this.root.validateCompleteTreeNode.apply(this.root, arguments);
    }



    add(data, parent){

        if (!Buffer.isBuffer(data))
            data = WebDollarCryptoData.createWebDollarCryptoData(data).buffer

        if (parent === null || parent === undefined)
            parent = this.root;

        let node = this.root.createNewNode( parent, undefined, [], data )
        parent.edges.push( this.root.createNewEdge( node ) );

        node._changedNode();
        return node;
    }

    delete(value){

        if (!Buffer.isBuffer(value))
            value = WebDollarCryptoData.createWebDollarCryptoData(value).buffer

        if (value.length === 0)
            throw {message: 'No input to be deleted', value};

        let searchResult = this.search(value);

        //console.log("searchResult", searchResult)
        if (searchResult.node === undefined || searchResult.node === null)
            return false;

        let node = searchResult.node;

        node.value = null;
        let deleted = false;

        let nodeParent = node.parent;
        while (nodeParent !== null && nodeParent !== undefined && node.value === null){

            //delete the edge from parent to deleted child
            for (let i = 0; i < nodeParent.edges.length; i++)
                if (nodeParent.edges[i].targetNode === node){
                    nodeParent.edges.splice(i,1);
                    deleted = true;
                    break;
                }

            // incase the current node has children, let's move the childrens
            if (node.edges.length > 0)
                for (let i = 0; i < node.edges.length; i++) {
                    nodeParent.edges.push(this.root.createNewEdge(node.edges[i].targetNode))
                    node.edges[i].targetNode.parent = nodeParent;
                }

            if (nodeParent.edges.length === 0 && nodeParent.value === null){ //let's delete also the parent
                node = nodeParent;
            } else break;

            nodeParent = node.parent;
        }

        if (deleted) {

            if (nodeParent === null ||  nodeParent === undefined)
                nodeParent = this.root;

            nodeParent._changedNode(nodeParent)

            return true;
        }
        return false;

    }

    /**
     * DFS search for "value"
     * @param value
     * @param nodeStarting
     * @returns {*}
     */
    search(value, node){

        if ( value === undefined || value === null)
            return null;

        if ( node === undefined || node === null)
            node = this.root;

        if (!Buffer.isBuffer(value))
            value = WebDollarCryptoData.createWebDollarCryptoData(value).buffer;

        if ( node.value !== undefined && node.value !== null && BufferExtended.safeCompare(node.value, value) ) {
            return { result: true, node: node, value: node.value }
        }


        for (let i = 0; i < node.edges.length; i++) {
            let result = this.search(value, node.edges[i].targetNode);

            if (result.result !== false)
                return result;
        }

        return { result: false, node: null, value:null }

    }


    //Level Search
    levelSearch(node, level) {

        if (node === undefined)
            node = this.root;
        if (level === undefined)
            level =  0;

        let queue = [ {node: node, level: level} ];
        let result = [];

        let i = 0;
        while (i < queue.length){

            let node = queue[i].node;
            let level = queue[i].level;

            if (!result[level]) result[level] = [];

            result[level].push(node)

            for (let j=0; j<node.edges.length; j++)
                if (node.edges[j].targetNode !== null){
                    queue.push( {node: node.edges[j].targetNode, level: level+1 })
                }

            i++;
        }

        return result;
    }

    BFS(node, level) {

        let searchResult = this.levelSearch(node, level);

        let BFSResult = [];
        for (let i = 0; i < searchResult.length; i++)
            for (let j = 0; j < searchResult[i].length; j++)
                BFSResult.push( searchResult[i][j] );

        return BFSResult;
    }

    validateParentsAndChildrenEdges(node, parent){

        if (node === undefined)
            node = this.root;
        if (parent === undefined)
            parent = null;

        if (node !== this.root && node.parent !== parent)
            return false;

        for (let i = 0; i < node.edges.length; i++) {

            if (node.edges[i].targetNode.parent !== node)
                return false;

            if ( ! this.validateParentsAndChildrenEdges(node.edges[i].targetNode, node) )
                return false;
        }

        let nodeLevel=-1, parentLevel=-2;
        let bfs = this.BFS();
        for (let i = 0; i < bfs.length; i++)
            for (let j = 0; j < bfs[i].length; j++)
                if (bfs[i][j] === node)
                    nodeLevel = i;
                else if (bfs[i][j] === parent )
                    parentLevel = i;

        if (node !== this.root && parentLevel !== nodeLevel - 1)
            return false;

        return true;
    }


    printLevelSearch(){

        let result = this.levelSearch();

        console.log("BFS Levels", result.length);

        for (let i = 0; i < result.length; i++) {

            let data = [];
            let hasHashses = false;

            result[i].forEach( (node, index) => {

                let value = node.value === null  ? 'null' : node.value
                let sum = node.sum === null  ? 'null' : node.sum
                let edges = [];
                let hash = null;

                node.edges.forEach ((edge, index)=>{
                    edges.push(  edge.label  !== undefined ? edge.label.toString() : '' )
                });

                if ( node.hash !== undefined)
                    hash = node.hash;

                let dataObject = {id: node.id, parentId: (node.parent !== null ? node.parent.id : -666), value: value, sum: sum, edges: edges};

                if (hash !== null){
                    dataObject.hash = hash;
                    hasHashses = true;
                }

                data.push( dataObject );
            });


            let dataString = "values { ";
            data.forEach( (element) =>{

                dataString += " { "

                try {

                    dataString += "id: "+element.id + " parentId: "+element.parentId+ "   ";

                    if (Buffer.isBuffer(element.value))
                        dataString += element.value.toString();
                    else
                    if (typeof element.value === "object")
                        dataString += JSON.stringify(element.value);
                    else
                        dataString += " null";

                } catch (exception){
                    dataString += "invalid";
                    console.error("interface tree to json, exception" , exception, element.value);
                }

                dataString += " , ";

                try {

                    if (element.sum !== 'null' &&  element.sum !== undefined) {
                        dataString += " , sum: ";

                        if (Buffer.isBuffer(element.sum))
                            dataString += element.sum.toString();
                        else
                        if (typeof element.sum === "object")
                            dataString += JSON.stringify(element.sum);
                        else
                            dataString += element.sum;
                    }

                } catch (exception){
                    dataString += "invalid";
                    console.log("interface tree to json, exception" , exception, element.sum);
                }

                dataString += " , ";
                dataString += element.edges.toString() + "} | ";
            });


            if ( hasHashses ) {
                dataString += "} hashes { ";
                data.forEach((element) => {
                    dataString += element.hash.sha256.toString("hex") + " | ";
                });
            }

            console.log("BFS Level: ", i, "count", result[i].length, dataString )
        }
    }

    cloneTree(){
        //cloning tutorial based on https://stackoverflow.com/questions/41474986/how-to-clone-a-javascript-es6-class-instance
        let cloneRoot = Object.assign( Object.create( Object.getPrototypeOf(this.root)), this.root);
        return cloneRoot;
    }


    _serializeTree(includeHashes){
        return this.root.serializeNode(true, includeHashes);
    }

    _deserializeTree(buffer, offset, includeHashes){

        this.createRoot();

        if (buffer.length === 1) return true; // nothing to deserialize
        return this.root.deserializeNode(buffer, offset, true, includeHashes);
    }

    toJSON(){

    }

    toString(){

    }

    async saveTree(key, includeHashes, serialization){

        if (serialization === undefined || serialization === null)
            serialization = this._serializeTree(includeHashes);

        return await this.db.save(key, serialization);
    }

    async loadTree(key, buffer, offset, includeHashes){

        if (buffer === undefined)
            buffer = await this.db.get(key);

        if (! Buffer.isBuffer(buffer) ) throw {message: "InterfaceTree - buffer is not Buffer"};

        return this._deserializeTree(buffer, offset||0, includeHashes);
    }

    matches(tree){

        let result = this.validateRoot();
        result = result && tree.validateRoot();

        return result;
    }

}

export default InterfaceTree