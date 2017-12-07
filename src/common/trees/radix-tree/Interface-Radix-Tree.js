/*
    Used to Radix Tree (Patricia Tree) a Buffer (CryptoWebDollarData)

    Radix Tree is an optimized Trie especially for very log texts

    Tutorials:

        https://en.wikipedia.org/wiki/Radix_tree

        https://www.cs.usfca.edu/~galles/visualization/RadixTree.html   - animated demo
 */

import WebDollarCryptoData from "common/crypto/Webdollar-Crypto-Data";

import InterfaceRadixTreeNode from "./Interface-Radix-Tree-Node"
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"

import InterfaceTree from "common/trees/Interface-Tree"

class InterfaceRadixTree extends InterfaceTree{

    constructor(){

        super();

        this.root = this.createNode(null,  [], null);
    }

    createNode(parent, edges, value){
        return new InterfaceRadixTreeNode(parent, edges, value);
    }

    setNode(node, value){
        node.value = value;
    }

    createEdge(label, targetNode){
        return new InterfaceRadixTreeEdge(label, targetNode);
    }

    changedNode(node){

        if (!this.checkInvalidNode(node)) {
            console.log("Invalid Radix Tree", node)
            this.printLevelSearch();
            throw( 'The Radix Tree is no longer valid at the node ' + JSON.stringify(node))
        }
    }

    checkInvalidNode(node){

        // Leaf nodes should have values
        // Other nodes should not have values

        if ( !node.isLeaf() )  {

            if (node.isLeaf() !== false) return false; //it should not be a leaf

            return true;

        } else {

            if (node !== this.root){

                if (node.isLeaf() !== true) return false; // it should be a leaf
                if (node.value === null || typeof node.value === 'undefined')
                    return false; //it should have a valid value

            } else
            if (node === this.root){
                return true;
            }

            return true;
        }
    }



    /**
     * Adding an input to the Radix Tree
     * @param element can be a Base String, Buffer or CryptoWebDollarData
     */
    add(input, value, param){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        if (input.buffer.length === 0) throw 'No input';

        let nodeCurrent = this.root;

        // console.log("input.buffer", input.buffer)

        let i=0;
        while (i < input.buffer.length) {

            //searching for existence of input[i...] in nodeCurrent list

            let childFound = false;
            let match = null;

            let skipOptimization = true; // including multiple not-finished nodes
            while (skipOptimization && childFound === false && nodeCurrent !== null) { //

                let nodePrevious = nodeCurrent;

                for (let j = 0; j < nodeCurrent.edges.length; j++){

                    match = input.longestMatch(nodeCurrent.edges[j].label, i);

                    //console.log("match", match);

                    if (match !== null){   //we found  a match in the edge

                        //the match is smaller

                        if (match.buffer.length < nodeCurrent.edges[j].label.buffer.length){

                            let originalEdgeLength = nodeCurrent.edges[j].label.buffer.length;
                            let edge = nodeCurrent.edges[j];

                            // We remove edge j
                            nodeCurrent.edges.splice(j,1);

                            let nodeMatch = null;

                            if ( i + originalEdgeLength >  input.buffer.length &&  (i + match.buffer.length) === input.buffer.length ){

                                // Adding the new nodeMatch by edge Match

                                nodeMatch = this.createNode( nodeCurrent,  [], value, param);
                                nodeCurrent.edges.push( this.createEdge( match, nodeMatch ));

                                // Adding the new nodeEdge to the nodeMatch
                                nodeMatch.edges.push( this.createEdge( edge.label.substr(match.buffer.length), edge.targetNode), )
                                edge.targetNode.parent = nodeMatch;

                                nodeCurrent = edge.targetNode;

                            } else {


                                // Adding the new nodeMatch by edge Match

                                nodeMatch = this.createNode( nodeCurrent,  [], null, null);
                                nodeCurrent.edges.push( this.createEdge( match, nodeMatch ));

                                // Adding the new nodeEdge to the nodeMatch
                                nodeMatch.edges.push( this.createEdge( edge.label.substr(match.buffer.length), edge.targetNode), )
                                edge.targetNode.parent = nodeMatch;

                                // Adding thew new nodeChild with current Value
                                let nodeChild = this.createNode( nodeMatch, [], value, param );
                                nodeMatch.edges.push( this.createEdge(input.substr(i+match.buffer.length), nodeChild));

                                nodeCurrent = nodeChild;

                            }

                            // console.log("nodeCurrent",nodeCurrent.value);
                            // console.log("nodeMatch",nodeMatch.value);
                            this.changedNode(nodeCurrent)
                            this.changedNode(nodeMatch)

                            // Marking that it is done
                            i = input.buffer.length+1;

                        } else {
                            i += nodeCurrent.edges[j].label.buffer.length;


                            nodeCurrent = nodeCurrent.edges[j].targetNode;

                            if (i === input.buffer.length){ //the prefix became a solution

                                if (nodeCurrent.value !== null) throw ('the node already includes a value....');
                                else this.setNode(nodeCurrent, value, param);

                                console.log("nodeCurrent_2",nodeCurrent.value);
                                this.changedNode(nodeCurrent)
                            }

                        }
                        childFound = true;
                        break;

                    }
                }

                //in case it got stuck in the root
                if (nodePrevious !== nodeCurrent) skipOptimization = true;
                else skipOptimization = false;
            }

            if (!childFound) { //child not found, let's create a new Child with the remaining input [i...]

                // no more Children...

                let nodeChild = this.createNode(nodeCurrent, [], value, param);
                nodeCurrent.edges.push( this.createEdge( input.substr(i), nodeChild ));

                //console.log("nodeChild2", nodeChild)
                this.changedNode(nodeChild)

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

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        if (input.buffer.length === 0) throw 'No input';

        let searchResult = this.search(input);

        //console.log("searchResult", searchResult)
        if (typeof searchResult.node === "undefined" || searchResult.node === null) return false;

        //it is the last element, we should delete it
        let finished = false;

        if (!searchResult.node.isLeaf()) throw ("couldn't delete because input is not a leaf node");

        let node = searchResult.node;

        node.value = null;
        node._previousEdges = node.edges.slice();
        node.edges = [];

        // node must be deleted
        while ( !finished && node !== null){

            let nodeParent = node.parent;

            finished = true;

            //remove empty parent nodes

            if ( node !== null  && node.value === null && nodeParent !== null && nodeParent.edges.length > 0 && !nodeParent.isLeaf() && node.edges.length === 0){

                //console.log("node simplu before", node, node.parent);

                //removing edge to current node from my direct parent
                let deletedParentEdge = null;
                for (let i=0; i<nodeParent.edges.length; i++)
                    if (nodeParent.edges[i].targetNode === node) {
                        deletedParentEdge = nodeParent.edges[i];
                        nodeParent.edges.splice(i, 1);
                        break;
                    }

                if (deletedParentEdge !== null){

                    // remove now useless prefixes nodes

                    // prefix slow => slowly
                    if ( node._previousEdges.length === 1 ){

                        nodeParent.edges.push(  this.createEdge( new WebDollarCryptoData.createWebDollarCryptoData( Buffer.concat( [ deletedParentEdge.label.buffer,  node._previousEdges[0].label.buffer  ] )), node._previousEdges[0].targetNode) );

                        node = node._previousEdges[0].targetNode;
                        node.parent = nodeParent;

                        this.changedNode(node);
                        break;

                    } else
                    if ( node._previousEdges.length > 1 ){

                        node.edges = node._previousEdges;
                        nodeParent.edges.push( deletedParentEdge ) ;

                        this.changedNode(node);
                        break;

                    } else
                    if (  !nodeParent.isLeaf()  && nodeParent.edges.length === 1 ){  // my parent has one more node

                        if (nodeParent.parent !== null){

                            let edge = nodeParent.edges[0];
                            node = nodeParent.edges[0].targetNode;
                            let grandParent = nodeParent.parent;

                            //replace grand parent edge child
                            for (let i=0; i<grandParent.edges.length; i++)
                                if (grandParent.edges[i].targetNode === nodeParent){

                                    grandParent.edges[i].label = new WebDollarCryptoData.createWebDollarCryptoData( Buffer.concat( [ grandParent.edges[i].label.buffer, edge.label.buffer  ] ));
                                    grandParent.edges[i].targetNode = node;

                                    node.parent = grandParent;

                                    // it is not necessary its parent
                                    //console.log("this.changedNode 1");
                                    this.changedNode(node);

                                    //console.log("grandParent deletion", node, nodeParent);
                                    break;
                                }
                        }

                    }
                    else {
                        node = nodeParent;
                    }

                    finished = false;
                    nodeParent = node.parent;

                    //console.log("this.changedNode 2");
                    this.changedNode(node)


                }

                //console.log("node simplu after", node, node.parent);
            }


            // //delete edges to empty child nodes
            // if (node !== null && !node.isLeaf() && node.edges.length > 0){
            //
            //     //console.log("node..... ", nodeParent, node.value, node.edges)
            //
            //     let bDeleted = false;
            //     for (let i=node.edges.length-1; i>=0; i--)
            //         if (node.edges[i].targetNode.isLeaf() && node.edges[i].targetNode.value === null && node.edges[i].targetNode.edges.length === 0 ) {
            //             console.log("target node deleted ", node.edges[i].label.toString())
            //             node.edges.splice(i, 1);
            //             bDeleted = true;
            //         }
            //
            //     if (bDeleted) finished = false;
            //
            //     console.log("node deleted", node)
            // }

            if (node !== null && nodeParent !== null && node.value === null && node.edges.length === 0 && node !== this.root ){

                //console.log("node22..... ", node.value, node.edges)

                for (let i=nodeParent.edges.length-1; i>=0; i--)
                    if (nodeParent.edges[i].targetNode === node) {

                        nodeParent.edges.splice(i, 1);
                        finished = false;

                        node = node.parent;
                        nodeParent = node.parent;

                        //console.log("this.changedNode 3");
                        this.changedNode(node);
                        break;
                    }
            }

        }

        return true;
    }


    /**
     * Searching an input in the Radix Tree
     * @param input
     */
    search(input){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        let nodeCurrent = this.root;

        let i=0;
        while (i < input.buffer.length) {

            // searching for existence of input[i...] in nodeCurrent list

            let childFound = false;

            for (let j = 0; j < nodeCurrent.edges.length; j++){

                let match = input.longestMatch( nodeCurrent.edges[j].label, i );

                //console.log("matchFound", nodeCurrent.edges[j].label.toString(), " in ", input.toString(), " i= ",i, match === null ? "null" : match.toString() );

                if (match !== null && match.buffer.length === nodeCurrent.edges[j].label.buffer.length) {   //we found  a match in the edge

                    nodeCurrent = nodeCurrent.edges[j].targetNode;

                    i += match.buffer.length;

                    childFound = true;
                    break;
                }

            }

            if (!childFound) //child not found, we should search no more
                return {result: false }
        }

        return { result: (nodeCurrent.value !== null), node: nodeCurrent, value: nodeCurrent.value }
    }

}

export default InterfaceRadixTree