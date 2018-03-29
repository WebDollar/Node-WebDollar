/*
    Used to Radix Tree (Patricia Tree) a Buffer (CryptoWebDollarData)

    Radix Tree is an optimized Trie especially for very log texts

    Tutorials:

        https://en.wikipedia.org/wiki/Radix_tree

        https://www.cs.usfca.edu/~galles/visualization/RadixTree.html   - animated demo
 */

import WebDollarCryptoData from "common/crypto/WebDollar-Crypto-Data";

import InterfaceRadixTreeNode from "./Interface-Radix-Tree-Node"
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"

import InterfaceTree from "common/trees/Interface-Tree"
import BufferExtended from "common/utils/BufferExtended"

class InterfaceRadixTree extends InterfaceTree{

    createRoot(parent, edges, value){
        this.root = new InterfaceRadixTreeNode(null, parent, edges, value);
        this.root.root = this.root;
    }



    /**
     * Adding an input to the Radix Tree
     * @param element can be a Base String, Buffer or CryptoWebDollarData
     */
    add(input, value){

        if (!Buffer.isBuffer(input))
            input = WebDollarCryptoData.createWebDollarCryptoData(input).buffer;

        if (input.length === 0)
            throw {message: 'No input'};

        let nodeCurrent = this.root;

        // console.log("input", input)

        let i = 0;
        while (i < input.length) {

            //searching for existence of input[i...] in nodeCurrent list

            let childFound = false;
            let match = null;

            let skipOptimization = true; // including multiple not-finished nodes
            while (skipOptimization && childFound === false && nodeCurrent !== null) { //

                let nodePrevious = nodeCurrent;

                for (let j = 0; j < nodeCurrent.edges.length; j++){

                    match = BufferExtended.longestMatch(input, nodeCurrent.edges[j].label, i);

                    //console.log("match", match);

                    if (match !== null){   //we found  a match in the edge

                        //the match is smaller

                        if (match.length < nodeCurrent.edges[j].label.length){

                            let originalEdgeLength = nodeCurrent.edges[j].label.length;
                            let edge = nodeCurrent.edges[j];

                            // We remove edge j
                            nodeCurrent.edges.splice(j,1);

                            let nodeMatch = null;

                            if ( i + originalEdgeLength >  input.length &&  (i + match.length) === input.length ){

                                // Adding the new nodeMatch by edge Match

                                nodeMatch = this.root.createNewNode( nodeCurrent,  [], value);
                                nodeCurrent.edges.push( this.root.createNewEdge( match, nodeMatch ));

                                // Adding the new nodeEdge to the nodeMatch
                                nodeMatch.edges.push( this.root.createNewEdge( BufferExtended.substr(edge.label, match.length), edge.targetNode), );
                                edge.targetNode.parent = nodeMatch;

                                nodeCurrent = edge.targetNode;

                            } else {


                                // Adding the new nodeMatch by edge Match

                                nodeMatch = this.root.createNewNode( nodeCurrent,  [], null);
                                nodeCurrent.edges.push( this.root.createNewEdge( match, nodeMatch ));

                                // Adding the new nodeEdge to the nodeMatch
                                nodeMatch.edges.push( this.root.createNewEdge( BufferExtended.substr(edge.label, match.length), edge.targetNode), );
                                edge.targetNode.parent = nodeMatch;

                                // Adding thew new nodeChild with current Value
                                let nodeChild = this.root.createNewNode( nodeMatch, [], value);
                                nodeMatch.edges.push( this.root.createNewEdge(BufferExtended.substr(input, i+match.length), nodeChild));

                                nodeCurrent = nodeChild;

                            }

                            // console.log("nodeCurrent",nodeCurrent.value);
                            // console.log("nodeMatch",nodeMatch.value);
                            this._changedNode(nodeCurrent);
                            this._changedNode(nodeMatch);

                            // Marking that it is done
                            i = input.length + 1;

                        } else {
                            i += nodeCurrent.edges[j].label.length;


                            nodeCurrent = nodeCurrent.edges[j].targetNode;

                            if (i === input.length){ //the prefix became a solution

                                if (nodeCurrent.value !== null)
                                    throw ('the node already includes a value....');
                                else
                                    nodeCurrent._setNodeValue(value);

                                //console.log("nodeCurrent_2",nodeCurrent.value, nodeCurrent);

                                this._changedNode(nodeCurrent)
                            }

                        }
                        childFound = true;
                        break;

                    }
                }

                //in case it got stuck in the root
                if (nodePrevious !== nodeCurrent)
                    skipOptimization = true;
                else skipOptimization = false;
            }

            if (!childFound) { //child not found, let's create a new Child with the remaining input [i...]

                // no more Children...

                let nodeChild = this.root.createNewNode(nodeCurrent, [], value);
                nodeCurrent.edges.push( this.root.createNewEdge( BufferExtended.substr(input, i), nodeChild ));

                //console.log("nodeChild2", nodeChild)
                this._changedNode(nodeChild);

                //console.log("nodeChild",nodeChild.value);

                nodeCurrent = nodeChild;
                break; //done
            }


        }

        //nodeCurrent will be the last child added in the list
        return nodeCurrent;

    }

    /**
     * Delete Node from the Radix Tree
     * @param input
     */
    delete(input){

        let searchResult;

        if ( input instanceof InterfaceRadixTreeNode === false) {

            if (!Buffer.isBuffer(input))
                input = WebDollarCryptoData.createWebDollarCryptoData(input).buffer

            searchResult = this.search(input);

            //console.log("searchResult", searchResult)
            if (searchResult.node === undefined || searchResult.node === null)
                return false;

        } else {
            searchResult = {node: input, }
        }

        //it is the last element, we should delete it
        let finished = false;

        if (!searchResult.node.isLeaf())
            throw ("couldn't delete because input is not a leaf node");

        let node = searchResult.node;

        node.value = null;
        node._previousEdges = node.edges.slice();
        node.edges = [];

        // node must be deleted
        while ( !finished && node !== null){

            let nodeParent = node.parent;

            finished = true;

            //remove empty parent nodes

            if ( node !== null  && node.value === null && nodeParent !== null && nodeParent.edges.length > 0  && node.edges.length === 0){

                //console.log("node simplu before", node, node.parent);

                //removing edge to current node from my direct parent
                let deletedParentEdge = null;
                for (let i = 0; i < nodeParent.edges.length; i++)
                    if (nodeParent.edges[i].targetNode === node) {
                        deletedParentEdge = nodeParent.edges[i];
                        nodeParent.edges.splice(i, 1);
                        break;
                    }

                if (deletedParentEdge !== null){

                    // remove now useless prefixes nodes

                    // prefix slow => slowly
                    if ( node._previousEdges.length === 1 ){

                        nodeParent.edges.push(  this.root.createNewEdge( Buffer.concat( [ deletedParentEdge.label,  node._previousEdges[0].label  ] ), node._previousEdges[0].targetNode) );

                        node = node._previousEdges[0].targetNode;
                        node.parent = nodeParent;

                        //console.log("this._changedNode 1_0");

                        break;

                    } else
                    if ( node._previousEdges.length > 1 ){

                        node.edges = node._previousEdges;
                        nodeParent.edges.push( deletedParentEdge ) ;

                        //console.log("this._changedNode 1_1");

                        break;

                    } else
                    if (  !nodeParent.isLeaf()  && nodeParent.edges.length === 1 ){  // my parent has one more node

                        if (nodeParent.parent !== null){

                            let edge = nodeParent.edges[0];
                            node = nodeParent.edges[0].targetNode;
                            let grandParent = nodeParent.parent;

                            //replace grand parent edge child
                            for (let i = 0; i < grandParent.edges.length; i++)
                                if (grandParent.edges[i].targetNode === nodeParent){

                                    grandParent.edges[i].label =  Buffer.concat( [ grandParent.edges[i].label, edge.label  ] );
                                    grandParent.edges[i].targetNode = node;

                                    node.parent = grandParent;

                                    // it is not necessary its parent
                                    //console.log("this._changedNode 1_2");

                                    //console.log("grandParent deletion", node, nodeParent);
                                    break;
                                }

                        } else {
                            node = node.parent;
                            //console.log("this._changedNode 1_3");
                        }

                    }
                    else {
                        node = nodeParent;
                        //console.log("this._changedNode 1_4");
                    }

                    finished = false;
                    nodeParent = node.parent;

                    //console.log("this._changedNode 2");


                }

                //console.log("node simplu after", node, node.parent);
            }

            if (node !== null && nodeParent !== null && node.value === null && node.edges.length === 0 && node !== this.root ){

                //console.log("node22..... ", node.value, node.edges)

                for (let i = nodeParent.edges.length - 1; i >= 0; i--)
                    if (nodeParent.edges[i].targetNode === node) {

                        nodeParent.edges.splice(i, 1);
                        finished = false;

                        node = node.parent;
                        nodeParent = node.parent;

                        //console.log(" this._changedNode 3 ");

                        break;
                    }
            }

        }


        //console.log("this.printLevelSearch() node", node);
        //this.printLevelSearch();

        this._changedNode( node );

        return true;
    }


    /**
     * Searching an input in the Radix Tree
     * @param input
     */
    search(input){

        if (!Buffer.isBuffer(input))
            input = WebDollarCryptoData.createWebDollarCryptoData(input).buffer

        if (input.length === 0)
            throw {message: 'No input'};

        let nodeCurrent = this.root;

        try {

            let i = 0;
            while (i < input.length) {

                // searching for existence of input[i...] in nodeCurrent list

                let childFound = false;

                for (let j = 0; j < nodeCurrent.edges.length; j++) {

                    let match = BufferExtended.longestMatch(input, nodeCurrent.edges[j].label, i);

                    //console.log("matchFound", nodeCurrent.edges[j].label.toString(), " in ", input.toString(), " i= ",i, match === null ? "null" : match.toString() );

                    if (match !== null && match.length === nodeCurrent.edges[j].label.length) {   //we found  a match in the edge

                        nodeCurrent = nodeCurrent.edges[j].targetNode;

                        i += match.length;

                        childFound = true;
                        break;
                    }

                }

                if (!childFound) //child not found, we should search no more
                    return {result: false}
            }

        } catch (exception){
            console.log("Radix Search Error", exception);
        }

        return { result: (nodeCurrent.value !== null), node: nodeCurrent, value: nodeCurrent.value }
    }

    /**
     * update a node in the radix tree
     * @param input
     * @param value
     * @returns {boolean}
     */
    update(input, value){

        if (!Buffer.isBuffer(input))
            input = WebDollarCryptoData.createWebDollarCryptoData(input).buffer

        let searchResult = this.search(input);

        // nothing to update
        if ( searchResult.node === undefined || searchResult.node === null)
            return false;

        if (!searchResult.node.isLeaf())
            throw ("couldn't delete because input is not a leaf node");

        let node = searchResult.node;

        node.value = value;
        this._changedNode( node );

    }


}

export default InterfaceRadixTree