import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';
import WebDollarCryptoData from "../crypto/Webdollar-Crypto-Data";

class InterfaceTree{

    constructor(){

        this.root = this.createNode(null,  [], null );

    }

    validateRoot(){
        return this.validateTree(this.root);
    }

    /**
     * valdiate Tree based on DFS (depth first search)
     * @param node
     * @param callback
     * @returns {boolean}
     */
    validateTree(node, callback){

        if (typeof node === 'undefined' || node === null) throw ('Tree Validation Errror. Node is null');

        for (let i=0; i < node.edges.length; i++) {

            if ( typeof node.edges[i].targetNode === 'undefined' || node.edges[i].targetNode === null ){
                console.log("Edge target node is Null", node, node.edges[i], i)
                throw('Edge target node is Null')
            }
            if (node.edges[i].targetNode.parent !== node) throw ('Edge target node parent is different that current node');

            if (typeof callback === 'function') {
                let result = this.validateTree(node.edges[i].targetNode, callback);

                if (!result) {
                    console.log("validateTree", node)
                    return false;
                }

            }
        }

        if (typeof callback === 'function'){
            let result = callback.call(this, node);
            if (!result){
                console.log("validateTree - callback ", node);
                return false;
            }
        }

        return true;
    }

    createNode(parent, edges, value){
        return new InterfaceTreeNode(parent, edges, value);
    }

    createEdge(targetNode){
        return new InterfaceTreeEdge(targetNode);
    }

    changedNode(node){
        //no changes in a simple tree
    }

    add(data, parent){

        data = WebDollarCryptoData.createWebDollarCryptoData(data);

        if (parent === null || typeof parent ==="undefined") parent = this.root;

        let node = this.createNode( parent , [], data )
        parent.edges.push( this.createEdge( node ) );

        this.changedNode(node);
        return node;
    }

    delete(node){

        node.value = null;
        let deleted = false;

        let nodeParent = node.parent;
        while (nodeParent !== null && node.value === null){

            for (let i=0; i<nodeParent.edges.length; i++)
                if (nodeParent.edges[i].targetNode === node){
                    nodeParent.edges.splice(i,1);
                    deleted = true;
                    break;
                }

            if (nodeParent.edges.length === 0){
                node = nodeParent;
            }
        }

        if (deleted) {
            this.changedNode(node)
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
    search(value, nodeStarting){

        if (typeof nodeStarting === 'undefined' || nodeStarting === null) nodeStarting = this.root;

        if (nodeStarting.value === value) return nodeStarting;

        for (let i=0; i<nodeStarting.edges.length; i++) {
            let result = this.search(value, nodeStarting.edges[i].targetNode);

            if (result !== null) return result;
        }

        return null;

    }


    //Level Search
    levelSearch(node, level) {

        if (typeof node === "undefined") node = this.root;
        if (typeof level === "undefined") level =  0;

        let queue = [ {node: node, level: level} ];
        let result = [];

        let i =0;
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
        for (let i=0; i<searchResult.length; i++)
            for (let j=0; j<searchResult[i].length; j++)
                BFSResult.push( searchResult[i][j] );

        return BFSResult;
    }

    validateParentsAndChildrenEdges(node, parent){

        if (typeof node === 'undefined') node = this.root;
        if (typeof parent === 'undefined') parent = null;

        if (node.parent !== parent) return false;

        for (let i=0; i<node.edges.length; i++) {

            if (node.edges[i].targetNode.parent !== node)
                return false;

            if ( ! this.validateParentsAndChildrenEdges(node.edges[i].targetNode, node) )
                return false;
        }

        let nodeLevel=-1, parentLevel=-2;
        let bfs = this.BFS();
        for (let i=0; i<bfs.length; i++)
            for (let j=0; j<bfs[i].length; j++)
                if (bfs[i][j] === node) nodeLevel = i;
                else if (bfs[i][j] === parent ) parentLevel = i;

        if (node !== this.root && parentLevel !== nodeLevel - 1) return false;


        return true;
    }


    printLevelSearch(){

        let result = this.levelSearch();

        console.log("BFS Levels", result.length);

        for (let i=0; i< result.length; i++) {

            let data = []; let hasHashses = false;

            result[i].forEach( (node, index) => {

                let value = node.value === null  ? 'null' : node.value
                let sum = node.sum === null  ? 'null' : node.sum
                let edges = [];
                let hash = null;

                node.edges.forEach ((edge, index)=>{
                    edges.push( typeof edge.label  !== 'undefined' ? edge.label.toString() : '' )
                });

                if (typeof node.hash !== 'undefined')
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

                    if (Buffer.isBuffer(element.value))  dataString += element.value.toString();
                    else if (typeof element.value === "object")  dataString += JSON.stringify(element.value);
                    else dataString += " null";

                } catch (exception){
                    dataString += "invalid";
                    console.log("interface tree to json, exception" , exception.toString(), element.value);
                }

                dataString += " , ";

                try {

                    if (element.sum !== 'null' && typeof element.sum !== 'undefined') {
                        dataString += " , sum: ";

                        if (Buffer.isBuffer(element.sum)) dataString += element.sum.toString();
                        else if (typeof element.sum === "object") dataString += JSON.stringify(element.sum);
                        else dataString += element.sum;
                    }

                } catch (exception){
                    dataString += "invalid";
                    console.log("interface tree to json, exception" , exception.toString(), element.sum);
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

    save(){
    }

    load(){
    }

    toJSON(){

    }

    toString(){

    }

}

export default InterfaceTree