var assert = require('assert')
import NodeWebPeer from 'node/webrtc/web-peer/node-web-peer';

describe('test node WebPeer', async () =>{

    let webpeer = new NodeWebPeer();

    webpeer.createPeer();
    console.log("SIGNAL", await webpeer.createSignal());

});

// describe('test web peer', async ()=> {
//
//  if ( initiator === undefined) initiator = true;
//
//
//         if ( window === undefined) window = global;
//
//         if ( location === undefined) location = global.location||{};
//
//         var wrtc = require('wrtc');
//
//         console.log("inititator",location.hash , initiator);
//
//         var Peer = require('simple-peer')
//
//         var p = new Peer(
//             {
//                 initiator: initiator,
//                 trickle: false,
//                 wrtc: wrtc,
//             });
//
//         p.on('error', function (err) { console.log('error', err) })
//
//         p.on('signal', function (data) {
//             console.log('SIGNAL', JSON.stringify(data));
//             document.querySelector('#outgoing').textContent = JSON.stringify(data)
//         });
//
//         let index = Math.floor(Math.random()*100);
//
//         p.on('connect', function (data) {
//
//             console.log('CONNECT', data, p);
//
//             setInterval(function() {
//                 if (( p !== undefined)&& ( p !== null)) {
//                     console.log(p);
//                     p.send('whatever' + index + " ___ " + Math.random())
//                 }
//             }, 500);
//
//         })
//
//         p.on('data', function (data) {
//             console.log('data: ' + data)
//         });
//
//
// });
