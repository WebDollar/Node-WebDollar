var assert = require('assert')

import InterfaceAccountantRadixTreeHelperClass from '../helpers/Interface-Accountant-Radix-Tree.test.helper'
import InterfaceMerkleAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/merkle-tree/Interface-Merkle-Accountant-Radix-Tree'
import TestsHelper from 'tests/Tests.helper'

import InterfaceAccountantRadixTreeTester from 'tests/trees/radix/accountant/helpers/Interface-Accountant-Radix-Tree-tester'


describe('Interface Merkle + Accountant + Radix Tree', () => {

    let InterfaceAccountantRadixTreeHelper = new InterfaceAccountantRadixTreeHelperClass(InterfaceMerkleAccountantRadixTree);
    InterfaceAccountantRadixTreeTester(InterfaceAccountantRadixTreeHelper, true)

});