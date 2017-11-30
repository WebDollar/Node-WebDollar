/*
    Used to Radix Tree a Buffer (CryptoWebDollarData)

    Tutorials:
        https://en.wikipedia.org/wiki/Radix_tree

        https://www.cs.usfca.edu/~galles/visualization/RadixTree.html   - animated demo
 */

import WebDollarCryptData from "common/crypto/Webdollar-Crypt-Data";
import InterfaceRadixTreeNode from "./Interface-Radix-Tree-Node"
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"


class InterfaceRadixTree {

    constructor(){

        this.radixRoot = new InterfaceRadixTreeNode(null, null, [] );

    }

    /**
     * Adding an input to the Radix Tree
     * @param element can be a Base String, Buffer or CryptoWebDollarData
     */
    radixAdd(input, value){

        input = WebDollarCryptData.createWebDollarCryptData(input)

        let nodeCurrent = this.radixRoot;

        let i=0;
        while (i < input.buffer.length) {

            //searching for existence of input[i...] in nodeCurrent list

            let childFound = false;

            let isDataNode = false; // including multiple not-finished nodes
            while (!isDataNode) { //

                for (let j = 0; j < nodeCurrent.edges.length; j++){

                    let match = input.longestMatch(nodeCurrent.edges[j].label, i);

                    if (match !== null){   //we found  a match in the edge
                        nodeCurrent = nodeCurrent.edges[j].targetNode;
                        childFound = true;
                        break;
                    }
                }

                isDataNode = nodeCurrent.value !== null;
            }

            if (!childFound) { //child not found, let's create a new Child

                // no more Children...
                if (nodeCurrent.edges.length === 0) {

                    let nodeChild = new InterfaceRadixTreeNode(nodeCurrent, value, []);
                    nodeCurrent.edges.push(new InterfaceRadixTreeEdge(input.substr(i), nodeChild));
                    break; //done
                }

                //creating a new node
                let nodeChild = new InterfaceRadixTreeNode(nodeCurrent, i === (input.buffer.length - 1) ? value : null, []);

                nodeCurrent.edges.push(new InterfaceRadixTreeEdge(input.buffer[i], nodeChild));

                nodeCurrent = nodeChild;
            }

            i++;
        }

        //nodeCurrent will be the last child added in the list
        return nodeCurrent;

    }

    /**
     *
     * @param input
     */
    radixDelete(input){

        input = WebDollarCryptData.createWebDollarCryptData(input)

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

        input = WebDollarCryptData.createWebDollarCryptData(input)

        let nodeCurrent = this.radixRoot;

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

}