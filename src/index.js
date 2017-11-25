if((typeof window !== 'undefined' && !window._babelPolyfill) ||
    (typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

console.log(""); console.log(""); console.log("");
console.log("Node WebDollar");
console.log(process.env.PARAM);
console.log(""); console.log(""); console.log("");

let Node = require('node/Node.js');

exports.helloWord = function() {
    console.log("This is a message from the demo package");
};

let exportObject = {
    NodeServer : Node.NodeServer,
    NodeClientsService : Node.NodeClientsService,
    NodeWebPeersService : Node.NodeWebPeersService,
    NodesStats : Node.NodesStats,
    NodesList : Node.NodesList,
    NetworkMap : Node.NetworkMap,
};

module.exports =  exportObject;
//browser minimized script
if (typeof global.window !== 'undefined')
    global.window.NodeWebDollar = exportObject;
if (typeof window !== 'undefined')
    window.NodeWebDollar = exportObject;


// var mymodule = (function() { console.log("This is a message from the demo package"); })();
//
// if (module && module.exports) {
//     module.exports = mymodule;
// } else {
//     window.mymodule = mymodule;
// }

console.log("Node WebDollar End");


if ( !process.env.TESTING ) {
    const testNodeWebPeer = require ('./tests/node/Node-Web-Peer.test');
    //testNodeWebPeer.testWebPeer();
    //testNodeWebPeer.testNodeWebPeer();

    const testInterfaceBlockchainAddress = require ('./tests/blockchain/interface-blockchain/Interface-Blockchain-Address.test').default;
    testInterfaceBlockchainAddress.testAddressGenerator();
}