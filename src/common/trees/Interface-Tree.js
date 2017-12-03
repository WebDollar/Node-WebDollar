import InterfaceTreeEdge from './Interface-Tree-Edge';
import InterfaceTreeNode from './Interface-Tree-Node';
import WebDollarCryptoData from "../crypto/Webdollar-Crypto-Data";

class InterfaceTree{

    constructor(){

        this.root = this.createNode(null, null, []);

    }

    createNode(){
        return new InterfaceTreeNode(arguments[0], arguments[1], arguments[2]);
    }

    createEdge(){
        return new InterfaceTreeEdge(arguments[0]);
    }

    changedNode(node){
        //no changes in a simple tree
    }

    add(data, parent){

        data = WebDollarCryptoData.createWebDollarCryptoData(data);

        if (parent === null || typeof parent ==="undefined") parent = this.root;

        let node = this.createNode( parent , data, [])
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


    printLevelSearch(){

        let result = this.levelSearch();

        console.log("BFS Levels", result.length);

        for (let i=0; i< result.length; i++) {

            let data = [];

            result[i].forEach( (node, index) => {

                let value = node.value === null  ? 'null' : node.value.toString()
                let edges = [];
                let hash = null;

                node.edges.forEach ((edge, index)=>{
                    edges.push( typeof edge.label  !== 'undefined' ? edge.label.toString() : '' )
                });

                if (typeof node.hash !== 'undefined') {
                    hash = node.hash;
                }

                let dataObject = {value: value, edges: edges};
                if (hash !== null) dataObject.hash = hash;

                data.push( dataObject );
            });


            let dataString = "values { ";
            data.forEach( (element) =>{
                dataString += element.value.toString()+" | ";
            });

            if (typeof data[0].hash !== 'undefined') {

                dataString += "} hashes { ";
                data.forEach((element) => {
                    dataString += element.hash.sha256.toString("hex") + " | ";
                });
            }

            dataString += "} edges { ";
            data.forEach( (element) =>{
                dataString += element.edges.toString() + " | ";
            });
            dataString += "} ";

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