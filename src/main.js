import Blockchain from 'main-blockchain/Blockchain';
import Node from 'node/Node';
import Applications from 'applications/Applications'

let TestingMocha;

if (process.env.MOCHA_TESTS === 'enabled')
    TestingMocha = require('tests/main.test');

export default {
    Node: Node,
    Blockchain: Blockchain,
    Applications: Applications,
    TestingMocha: TestingMocha,
};

