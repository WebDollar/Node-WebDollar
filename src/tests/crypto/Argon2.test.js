import Argon2 from 'common/crypto/Argon2/Argon2'
import TestsHelper from 'tests/Tests.helper'
var assert = require('assert')

describe('Argon2', () => {
  it('Argon2.Hash Buffer ', async () => {
    const message1 = new Buffer(TestsHelper.makeId(), 'ascii')
    const message1_copy = new Buffer(message1) // it will make a copy

    const message2 = new Buffer(TestsHelper.makeId(), 'ascii')

    let hash1 = await Argon2.hash(message1)
    let hash1_copy = await Argon2.hash(message1_copy)
    let hash2 = await Argon2.hash(message2)

    // console.log("argon2 hash1", hash1);
    // console.log("argon2 hash1_copy", hash1_copy);
    // console.log("argon2 hash2", hash2);

    assert(typeof hash1 === 'object' && Buffer.isBuffer(hash1), 'Hash1 is not Buffer')
    assert(typeof hash1_copy === 'object' && Buffer.isBuffer(hash1_copy), 'Hash1_copy is not Buffer')
    assert(typeof hash2 === 'object' && Buffer.isBuffer(hash2), 'Hash2 is not Buffer')

    assert(await Argon2.verify(hash1, message1), 'Hash1 is not good')
    assert(await Argon2.verify(hash1_copy, message1_copy), 'Hash1_copy is not good')
    assert(await Argon2.verify(hash2, message2), 'Hash2 is not good')

    assert(!(await Argon2.verify(hash1, message2)), 'Hash1 is not good because message2 ' + message2)
    assert(!(await Argon2.verify(hash1_copy, message2)), 'Hash1_copy is not good because message2 ' + message2)
    assert(!(await Argon2.verify(hash2, message1)), 'Hash2 is not good because message1 ' + message1)
  })

  it('Argon2.Hash String ', async () => {
    const message1 = TestsHelper.makeId()
    const message1_copy = message1

    const message2 = TestsHelper.makeId()

    let hash1 = await Argon2.hash(message1)
    let hash1_copy = await Argon2.hash(message1_copy)
    let hash2 = await Argon2.hash(message2)

    // console.log("argon2 string hash1", hash1);
    // console.log("argon2 string hash1_copy", hash1_copy);
    // console.log("argon2 string hash2", hash2);

    assert(typeof hash1 === 'object' && Buffer.isBuffer(hash1), 'Hash1 is not Buffer')
    assert(typeof hash1_copy === 'object' && Buffer.isBuffer(hash1_copy), 'Hash1_copy is not Buffer')
    assert(typeof hash2 === 'object' && Buffer.isBuffer(hash2), 'Hash2 is not Buffer')

    assert(await Argon2.verify(hash1, message1), 'Hash1 is not good')
    assert(await Argon2.verify(hash1_copy, message1_copy), 'Hash1_copy is not good')
    assert(await Argon2.verify(hash2, message2), 'Hash2 is not good')

    assert(!(await Argon2.verify(hash1, message2)), 'Hash1 is not good because message2 ' + message2)
    assert(!(await Argon2.verify(hash1_copy, message2)), 'Hash1_copy is not good because message2 ' + message2)
    assert(!(await Argon2.verify(hash2, message1)), 'Hash2 is not good because message1 ' + message1)
  })
})
