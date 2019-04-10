import sinon from 'sinon'
import { expect, assert } from 'chai'

import RpcMethod from '../../../../jsonRpc/RpcMethod'
import Accounts from '../../Methods/Account/Accounts'

describe('AccountsTest', () => {
  it('should inherit from JsonRpc\\RpcMethod', () => {
    const oMethod = new Accounts('name')
    assert.instanceOf(oMethod, RpcMethod)
  })

  // !!!Important Keep this
  afterEach(() => {
    // Restore the default sandbox here
    sinon.restore()
  })
})
