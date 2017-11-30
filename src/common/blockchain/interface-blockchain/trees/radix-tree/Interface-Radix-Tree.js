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


class InterfaceRadixTree {

    constructor(){

        this.root = new InterfaceRadixTreeNode(null, null, [] );

    }

    /**
     * Adding an input to the Radix Tree
     * @param element can be a Base String, Buffer or CryptoWebDollarData
     */
    radixAdd(input, value){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        let nodeCurrent = this.root;

        console.log("input.buffer", input.buffer)

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

                    console.log("match", match);

                    if (match !== null){   //we found  a match in the edge

                        //the match is smaller
                        if (match.buffer.length < nodeCurrent.edges[j].label.buffer.length){

                            let edge = nodeCurrent.edges[j];

                            // We remove edge j
                            nodeCurrent.edges.splice(j,1);

                            // Adding the new nodeMatch by edge Match
                            let nodeMatch = new InterfaceRadixTreeNode(nodeCurrent.parent, null, [] );
                            nodeCurrent.edges.push( new InterfaceRadixTreeEdge( match, nodeMatch ));

                            // Adding the new nodeEdge to the nodeMatch
                            nodeMatch.edges.push( new InterfaceRadixTreeEdge( edge.label.substr(match.buffer.length), edge.targetNode), )
                            edge.targetNode.parent = nodeMatch;

                            // Adding thew new nodeChild with current Value
                            let nodeChild = new InterfaceRadixTreeNode(nodeMatch, value, []);
                            nodeMatch.edges.push(new InterfaceRadixTreeEdge(input.substr(i), nodeChild));

                            nodeCurrent = nodeChild;

                            // Marking that it is done
                            i = input.buffer.length+1;


                        } else {
                            nodeCurrent = nodeCurrent.edges[j].targetNode;
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
                let nodeChild = new InterfaceRadixTreeNode(nodeCurrent, value, []);
                nodeCurrent.edges.push(new InterfaceRadixTreeEdge(input.substr(i), nodeChild));
                nodeCurrent = nodeChild;

                break; //done
            }

            i++;
        }

        //nodeCurrent will be the last child added in the list
        return nodeCurrent;

    }

    /**
     * Delete Node from the Radix Tree
     * @param input
     */
    radixDelete(input){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        let searchResult = this.radixSearch(input);

        if (searchResult.result === false || searchResult.node === null) return false;

        //it is the last element, we should delete it
        if ( searchResult.index === input.buffer.length-1){
            let nodeChild = searchResult.node;
            let nodeParent = searchResult.node.parent;

            nodeChild.value = null;

            //remove empty parent nodes
            while (nodeChild !== null && nodeParent !== null && nodeChild.edges.length === 0){

                //removing edge to child from parent
                for (let i=0; i<nodeParent.edges.length; i++)
                    if (nodeParent[i].targetNode === nodeChild) {
                        nodeParent.edges.splice(i, 1);
                        break;
                    }

                nodeChild = nodeParent;
            }

            return true;
        }

        return false;
    }


    /**
     * Searching an input in the Radix Tree
     * @param input
     */
    radixSearch(input){

        input = WebDollarCryptoData.createWebDollarCryptoData(input)

        let nodeCurrent = this.root;

        for (let i=0; i<input.buffer.length; i++){

            //searching for existence of input[i] in nodeCurrent list

            let childFound = false;
            for (let j=0; j<nodeCurrent.edges.length; j++)
                //we found the targetNode of label input[i]
                if (nodeCurrent.edges[j].label === input.buffer[i] ) {
                    nodeCurrent = nodeCurrent.edges[j].targetNode;
                    childFound = true;
                    break;
                }

            if (!childFound){
                return {result: false, index: -1, node: null};
            }

        }

        //nodeCurrent will be the last child added in the list
        return {result: true, index: input.buffer.length, edgeIndex: j, node: nodeCurrent};
    }

    //BreadFirstSearch
    BFS(node, level) {

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

    printBFS(){

        let result = this.BFS();

        console.log("RADIX BFS Levels", result.length);

        for (let i=0; i< result.length; i++)
            console.log("RADIX BFS Level: ",i , "count", result[i].length)
    }

}

export default InterfaceRadixTree