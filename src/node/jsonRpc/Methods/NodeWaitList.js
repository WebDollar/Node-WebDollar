import { RpcMethod } from './../../../jsonRpc'
import NodeType from './../../lists/types/Node-Type'

/**
 * The current webdollar node waitlist.
 */
class NodeWaitList extends RpcMethod {
  constructor (name, oNodeWaitList) {
    super(name)

    this._oNodeWaitList = oNodeWaitList
  }

  getHandler () {
    return this._oNodeWaitList.getJSONList(NodeType.NODE_TERMINAL, true).map((oNode) => {
      return oNode.a
    })
  }
}

export default NodeWaitList
