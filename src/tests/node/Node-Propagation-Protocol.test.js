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
                socket: { node: { protocol: { nodeDomain: 'http://127.0.0.1:30801' } } },
            }
        );

        NodesList.emitter.emit('nodes-list/connected', node);

        const broadcastedAddresses = broadcastStub.firstCall.args[1].addresses;
        assert.strictEqual(broadcastedAddresses[0].a, 'http://127.0.0.1:30801');
    });

});
