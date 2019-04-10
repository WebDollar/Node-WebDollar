import InterfaceRadixTree from 'common/trees/radix-tree/Interface-Radix-Tree'
import IntefaceMerkleRadixTree from 'common/trees/radix-tree/merkle-tree/Interface-Merkle-Radix-Tree'

let assert = require('assert')

class InterfaceTreeTestHelper {
  constructor (className) {
    if (className === undefined) className = IntefaceMerkleRadixTree

    this.className = className
  }

  testAdd (radixData, radixTree, createValue) {
    if (radixTree === undefined || radixTree === null) radixTree = new this.className()
    if (createValue === undefined) createValue = true

    radixData.forEach((str) => {
      radixTree.add(new Buffer(str, 'ascii'), createValue ? { address: str } : undefined)

      assert(radixTree.validateRoot() === true, 'Radix Tree after ' + str + ' is not Valid')
      assert(radixTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match")
    })

    // radixTree.printLevelSearch();

    radixData.forEach((str) => {
      let result = radixTree.search(new Buffer(str, 'ascii'))
      assert(result.result === true, 'result ' + str + ' was not found')
    })

    let result = radixTree.levelSearch()
    return { tree: radixTree, levels: result }
  };

  testSearch (radixData, radixTree, needToBeFound) {
    radixData.forEach((str) => {
      let result = radixTree.search(new Buffer(str, 'ascii'))
      assert(result.result === needToBeFound, 'result ' + str + ' was not found')
    })
  };

  testDelete (radixTree, radixData) {
    radixData.forEach((str, index) => {
      let deleteResult = radixTree.delete(new Buffer(str, 'ascii'))
      assert(deleteResult === true, 'delete ' + str + " didn't work")

      assert(radixTree.validateRoot() === true, 'Radix Tree deleted after ' + str + ' is not Valid')
      assert(radixTree.validateParentsAndChildrenEdges() === true, "Radix Parents and Children Edges don't match")

      let searchResult = radixTree.search(new Buffer(str, 'ascii'))
      assert(!searchResult.result, 'result ' + str + ' was actually found...')

      // the radix sort still, should detect all remaining strings
      for (let j = index + 1; j < radixData.length; j++) {
        let searchResult = radixTree.search(new Buffer(radixData[j], 'ascii'))
        assert(searchResult.result === true, 'result ' + str + ' was not found after ' + str + ' was deleted...')
      }
    })

    let result = radixTree.levelSearch()

    assert(result.length === 1, 'result is not 1 level')
    assert(result[0].length === 1, 'root is not empty')
  };
}

export default InterfaceTreeTestHelper
