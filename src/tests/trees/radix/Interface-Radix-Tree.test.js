var assert = require('assert')

import TestsHelper from 'tests/Tests.helper'
import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'


import InterfaceTreeTestHelperClass from '../helpers/Interface-Tree.test.helper';
import InterfaceRadixTreeTestTester from './helpers/Interface-Radix-Tree-tester';

describe("Interface Radix Tree", () => {

    let InterfaceTreeTestHelper = new InterfaceTreeTestHelperClass(InterfaceRadixTree);
    InterfaceRadixTreeTestTester(InterfaceTreeTestHelper);


});