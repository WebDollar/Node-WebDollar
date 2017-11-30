/*
    Used to Radix Tree a Buffer
 */

import WebDollarCryptData from "common/crypto/Webdollar-Crypt-Data";
import InterfaceRadixTreeNode from "./Interface-Radix-Tree-Node"
import InterfaceRadixTreeEdge from "./Interface-Radix-Tree-Edge"


class InterfaceRadixTree {

    constructor(){

        this.radixRoot = new InterfaceRadixTreeNode(null, null, [] );

    }

    /**
     *
     * @param element can be a Base String, Buffer or CryptoWebDollarData
     */
    radixAdd(input, value){

        input = WebDollarCryptData.createWebDollarCryptData(input)

        let nodeCurrent = this.radixRoot;

        for (let i=0; i<input.length; i++){

            //searching for existence of input[i] in nodeCurrent list

            for (let j=0; j<nodeCurrent.edges.length; j++)

                //we found the targetNode of label input[i]
                if (nodeCurrent.edges[j].label === input[i] ) {
                    nodeCurrent = nodeCurrent.edges[j].targetNode;
                    break;
                } else
                if (nodeCurrent.edges[j].label !== input[i] ) {
                    //creating a new node
                    let nodeChild = new InterfaceRadixTreeNode(nodeCurrent,  i === (input.length-1) ? value : null, [] );

                    nodeCurrent.edges.push( new InterfaceRadixTreeEdge(input[i], nodeChild));

                    nodeCurrent = nodeChild;
                    break;
                }
        }


    }

}