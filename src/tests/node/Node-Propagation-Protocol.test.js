var assert = require('assert');
var sinon = require('sinon');

import NodePropagationProtocol from 'common/sockets/protocol/Node-Propagation-Protocol';
import NodeProtocol from 'common/sockets/protocol/extend-socket/Node-Protocol';
import NodesList from 'node/lists/Nodes-List';
import NodesWaitlist from 'node/lists/waitlist/Nodes-Waitlist';
import NODE_TYPE from 'node/lists/types/Node-Type';
import CONNECTION_TYPE from 'node/lists/types/Connection-Type';

const fakeNode = (address, socket) => ({
    nodeType: NODE_TYPE.NODE_TERMINAL,
    connectionType: CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET,
    socket: socket || {},
    toJSON: () => ({ a: address, t: NODE_TYPE.NODE_TERMINAL, c: true }),
});

describe('NodePropagationProtocol gossip', () => {

    let broadcastStub;

    beforeEach(() => {
        broadcastStub = sinon.stub(NodeProtocol, 'broadcastRequest');
        NodePropagationProtocol.initializePropagationProtocol();
    });

    afterEach(() => broadcastStub.restore());

    it('broadcasts once when a validated connection is made', () => {
        NodesList.emitter.emit('nodes-list/connected', fakeNode('1.2.3.4:8080'));
        assert.strictEqual(broadcastStub.callCount, 1);
        assert.strictEqual(broadcastStub.firstCall.args[0], 'propagation/nodes');
    });

    it('does not re-broadcast the same address within the throttle window (anti-flapping)', () => {
        const node = fakeNode('5.6.7.8:8080');
        NodesList.emitter.emit('nodes-list/connected', node);
        NodesList.emitter.emit('nodes-list/connected', node);
        assert.strictEqual(broadcastStub.callCount, 1);
    });

    it('excludes the newly connected peer itself from the broadcast recipients', () => {
        const peerSocket = { marker: 'peer-socket' };
        NodesList.emitter.emit('nodes-list/connected', fakeNode('9.9.9.9:8080', peerSocket));
        assert.strictEqual(broadcastStub.firstCall.args[3], peerSocket);
    });

    it('does NOT broadcast merely because an address was added to the waitlist (hearsay)', () => {
        NodesWaitlist.emitter.emit('waitlist/new-node', fakeNode('10.10.10.10:8080'));
        assert.strictEqual(broadcastStub.callCount, 0);
    });

    it('announces the peer\'s self-reported listening domain, not the raw socket address, for an inbound connection', () => {
        // Reprodus la testul de integrare cu 3 noduri (Task 3): când NOI suntem
        // server-ul, adresa brută a socket-ului e portul TCP efemer al
        // clientului, nu portul lui de ascultare — inutilizabilă pentru
        // reconectare. `registerUniqueSocket` rezolvă deja asta pentru propriul
        // waitlist folosind `socket.node.protocol.nodeDomain` (auto-raportat
        // prin Hello); gossip-ul trebuie să facă la fel.
        const node = Object.assign(
            fakeNode('127.0.0.1:53621'), // adresa brută a socket-ului (efemeră)
            {
                connectionType: CONNECTION_TYPE.CONNECTION_SERVER_SOCKET,
                socket: {
                    node: {
                        sckAddress: { address: '127.0.0.1' }, // IP observat real al conexiunii TCP
                        protocol: { nodeDomain: 'http://127.0.0.1:30801' },
                    },
                },
            }
        );

        NodesList.emitter.emit('nodes-list/connected', node);

        const broadcastedAddresses = broadcastStub.firstCall.args[1].addresses;
        assert.strictEqual(broadcastedAddresses[0].a, 'http://127.0.0.1:30801');
    });

    it('still matches when the observed socket IP or the domain host is IPv4-mapped-IPv6 (::ffff: prefix)', () => {
        // Găsit la testul de integrare: Node/OS raportează inconsecvent adresa
        // unui socket dual-stack, câteodată cu prefixul "::ffff:". Fără
        // normalizare, validarea de securitate de mai sus ar respinge un
        // anunț complet legitim doar din cauza formatării.
        const node = Object.assign(
            fakeNode('127.0.0.1:53621'),
            {
                connectionType: CONNECTION_TYPE.CONNECTION_SERVER_SOCKET,
                socket: {
                    node: {
                        sckAddress: { address: '127.0.0.1' },
                        protocol: { nodeDomain: 'http://::ffff:127.0.0.1:30801' },
                    },
                },
            }
        );

        NodesList.emitter.emit('nodes-list/connected', node);

        const broadcastedAddresses = broadcastStub.firstCall.args[1].addresses;
        assert.strictEqual(broadcastedAddresses[0].a, 'http://::ffff:127.0.0.1:30801');
    });

    it('does NOT announce an inbound peer with no self-reported domain (would leak its ephemeral TCP port)', () => {
        // Găsit la revizuirea finală: minerii conectați la un pool, sau alte
        // noduri fără server propriu, raportează domain gol prin Hello
        // (Node-Server.js). Fără acest test, _reconnectableAddress ar recădea
        // pe adresa brută a socket-ului — exact bug-ul reparat mai sus,
        // repetat pentru cazul "fără domeniu deloc".
        const node = Object.assign(
            fakeNode('127.0.0.1:53621'),
            {
                connectionType: CONNECTION_TYPE.CONNECTION_SERVER_SOCKET,
                socket: {
                    node: {
                        sckAddress: { address: '127.0.0.1' },
                        protocol: { nodeDomain: '' },
                    },
                },
            }
        );

        NodesList.emitter.emit('nodes-list/connected', node);

        assert.strictEqual(broadcastStub.callCount, 0);
    });

    it('does NOT announce a self-reported domain whose host does not match the real TCP source IP (spoofing)', () => {
        // Găsit la revizuirea finală: `nodeDomain` vine direct din query-ul
        // clientului la Hello (Node-Server.js), necontrolat — un peer poate
        // raporta orice adresă vrea. Gossip-ul nu trebuie să amplifice o
        // adresă pe care nu a verificat-o, altfel orice nod devine un vector
        // de a direcționa restul rețelei către o țintă arbitrară.
        const node = Object.assign(
            fakeNode('203.0.113.9:53621'),
            {
                connectionType: CONNECTION_TYPE.CONNECTION_SERVER_SOCKET,
                socket: {
                    node: {
                        sckAddress: { address: '203.0.113.9' }, // IP observat real
                        protocol: { nodeDomain: 'http://victim.example.org:22' }, // pretenție falsă
                    },
                },
            }
        );

        NodesList.emitter.emit('nodes-list/connected', node);

        assert.strictEqual(broadcastStub.callCount, 0);
    });

});

// Extensie aprobată după testarea manuală (vezi spec §3.2bis): la o conexiune
// nouă validată, nodul trimite peer-ului nou, o singură dată, lista peers-ilor
// pe care EL ÎNSUȘI i-a validat (cei din NodesList) — un "snapshot la
// alăturare". Fără asta, un nod care se alătură mai târziu afla doar despre
// peers apăruți DUPĂ el, niciodată despre cei deja conectați.
describe('NodePropagationProtocol gossip — snapshot of known peers sent to a newly connected peer', () => {

    let broadcastStub;
    let originalNodes;

    const outboundPeer = (address) => ({
        nodeType: NODE_TYPE.NODE_TERMINAL,
        connectionType: CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET,
        socket: { node: {} },
        toJSON: () => ({ a: address, t: NODE_TYPE.NODE_TERMINAL, c: true }),
    });

    const newPeer = (address) => {
        const sendRequest = sinon.spy();
        return {
            nodeType: NODE_TYPE.NODE_TERMINAL,
            connectionType: CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET,
            socket: { node: { sendRequest } },
            toJSON: () => ({ a: address, t: NODE_TYPE.NODE_TERMINAL, c: true }),
            sendRequest,
        };
    };

    const snapshotCalls = (peer) => peer.sendRequest.getCalls().filter((call) => call.args[0] === 'propagation/nodes');

    beforeEach(() => {
        broadcastStub = sinon.stub(NodeProtocol, 'broadcastRequest');
        originalNodes = NodesList.nodes;
        NodesList.nodes = [];
        NodePropagationProtocol.initializePropagationProtocol();
    });

    afterEach(() => {
        broadcastStub.restore();
        NodesList.nodes = originalNodes;
    });

    it('sends the new peer the reconnectable addresses of the other validated peers, once', () => {
        NodesList.nodes = [outboundPeer('http://10.0.0.1:8080'), outboundPeer('http://10.0.0.2:8080')];
        const peer = newPeer('http://10.0.0.9:8080');

        NodesList.emitter.emit('nodes-list/connected', peer);

        const calls = snapshotCalls(peer);
        assert.strictEqual(calls.length, 1);
        assert.strictEqual(calls[0].args[1].op, 'new-full-nodes');
        assert.deepStrictEqual(calls[0].args[1].addresses.map((entry) => entry.a).sort(), ['http://10.0.0.1:8080', 'http://10.0.0.2:8080']);
    });

    it('does not include the new peer itself in its own snapshot', () => {
        const peer = newPeer('http://10.0.0.9:8080');
        NodesList.nodes = [outboundPeer('http://10.0.0.1:8080'), peer];

        NodesList.emitter.emit('nodes-list/connected', peer);

        const addresses = snapshotCalls(peer)[0].args[1].addresses.map((entry) => entry.a);
        assert.deepStrictEqual(addresses, ['http://10.0.0.1:8080']);
    });

    it('omits peers with no reconnectable address (inbound without a validated domain) and does not send an empty snapshot', () => {
        NodesList.nodes = [{
            nodeType: NODE_TYPE.NODE_TERMINAL,
            connectionType: CONNECTION_TYPE.CONNECTION_SERVER_SOCKET,
            socket: { node: { sckAddress: { address: '10.0.0.5' }, protocol: { nodeDomain: '' } } },
            toJSON: () => ({ a: '10.0.0.5:53621', t: NODE_TYPE.NODE_TERMINAL, c: true }),
        }];
        const peer = newPeer('http://10.0.0.9:8080');

        NodesList.emitter.emit('nodes-list/connected', peer);

        assert.strictEqual(snapshotCalls(peer).length, 0);
    });

    it('caps the snapshot at 50 addresses (the existing receiver-side limit)', () => {
        NodesList.nodes = [];
        for (let i = 0; i < 70; i++) NodesList.nodes.push(outboundPeer(`http://10.1.0.${i}:8080`));
        const peer = newPeer('http://10.0.0.9:8080');

        NodesList.emitter.emit('nodes-list/connected', peer);

        assert.strictEqual(snapshotCalls(peer)[0].args[1].addresses.length, 50);
    });

    it('still sends the snapshot even when announcing this peer is throttled (anti-flapping applies to the broadcast only)', () => {
        NodesList.nodes = [outboundPeer('http://10.0.0.1:8080')];
        const first = newPeer('http://10.0.0.9:8080');
        const second = newPeer('http://10.0.0.9:8080');

        NodesList.emitter.emit('nodes-list/connected', first);
        NodesList.emitter.emit('nodes-list/connected', second);

        assert.strictEqual(snapshotCalls(second).length, 1);
    });

});
