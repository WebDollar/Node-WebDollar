import TestsHelper from 'tests/Tests.helper'

import InterfaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'
import InterfaceTreeTestHelperClass from '../../helpers/Interface-Tree.test.helper'

import InterfaceRadixTreeTestTester from './../helpers/Interface-Radix-Tree-tester'

let assert = require('assert')

describe('Interface Merkle + Radix Tree', () => {
  it('creating merkle tree simple test', () => {
    let radixTree = new InterfaceMerkleRadixTree()
    radixTree.add(new Buffer('aaa', 'ascii'), { address: 'aaa' })

    assert(radixTree.validateRoot() === true, 'Radix Tree after ' + 'aaa' + ' is not Valid')

    let result = InterfaceTreeTestHelper.testAdd(['romane'])

    radixTree = result.tree;

    ['romanus'].forEach((str) => {
      radixTree.add(new Buffer(str, 'ascii'), { address: str })
      // radixTree.printLevelSearch();

      assert(radixTree.validateRoot() === true, 'Merkle Tree is invalid!!!')

      radixTree.delete(new Buffer('romane', 'ascii'))

      // radixTree.printLevelSearch();
      assert(radixTree.validateRoot() === true, 'Merkle Tree is invalid after deletion!!!')
    })
  })

  let InterfaceTreeTestHelper = new InterfaceTreeTestHelperClass(InterfaceMerkleRadixTree)
  InterfaceRadixTreeTestTester(InterfaceTreeTestHelper, true)
})
