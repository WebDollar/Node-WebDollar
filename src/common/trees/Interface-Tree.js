import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';
import WebDollarCryptoData from "../crypto/Webdollar-Crypto-Data";

class InterfaceTree{

    constructor(){

        this.root = this.createNode(null,  [], null );

    }

    validateTree(node, list){

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
        parent.edges.push( this.createEdge( node ));

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

    search(){

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
                let amount = node.amount === null  ? 'null' : node.amount
                let edges = [];
                let hash = null;

                node.edges.forEach ((edge, index)=>{
                    edges.push( typeof edge.label  !== 'undefined' ? edge.label.toString() : '' )
                });

                if (typeof node.hash !== 'undefined')
                    hash = node.hash;

                let dataObject = {id: node.id, parentId: (node.parent !== null ? node.parent.id : -666), value: value, amount: amount, edges: edges};

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

                    if (element.amount !== 'null') {
                        dataString += " , amount: ";

                        if (Buffer.isBuffer(element.amount)) dataString += element.amount.toString();
                        else if (typeof element.amount === "object") dataString += JSON.stringify(element.amount);
                        else dataString += element.amount;
                    }

                } catch (exception){
                    dataString += "invalid";
                    console.log("interface tree to json, exception" , exception.toString(), element.amount);
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