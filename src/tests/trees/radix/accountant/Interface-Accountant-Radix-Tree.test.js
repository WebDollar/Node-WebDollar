var assert = require('assert')

import InterfaceAccountantRadixTreeHelperClass from './helpers/Interface-Accountant-Radix-Tree.test.helper'

import InterfaceAccountantRadixTree from 'common/trees/radix-tree/accountant-tree/Interface-Accountant-Radix-Tree'
import InterfaceAccountantRadixTreeTester from 'tests/trees/radix/accountant/helpers/Interface-Accountant-Radix-Tree-tester'

import TestsHelper from 'tests/Tests.helper'




describe('Interface Accountant Radix Tree', () => {

    let InterfaceAccountantRadixTreeHelper = new InterfaceAccountantRadixTreeHelperClass(InterfaceAccountantRadixTree);
    InterfaceAccountantRadixTreeTester(InterfaceAccountantRadixTreeHelper)

});