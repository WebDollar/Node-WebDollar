import consts from 'consts/const_global'
import GeoHelper from 'node/lists/geolocation-lists/geo-helpers/geo-helper'
import Utils from 'common/utils/helpers/Utils'
const ipaddr = require('ipaddr.js')

class SocketAddress {
  static checkIsSocketAddress (sckAddress) {
    if (!sckAddress || typeof sckAddress !== 'object') return false

    if (!(sckAddress.constructor.name === 'SocketAddress')) return false

    return true
  }

  /*
        Create a Socket Address in case the address is just a simple "address"
     */
  static createSocketAddress (address, port, uuid) {
    // in case address is actually a Socket
    if (address && typeof address === 'object' && address.node && address.node.sckAddress) address = address.node.sckAddress
    if (address && typeof address === 'object' && address.sckAddress) address = address.sckAddress

    if (SocketAddress.checkIsSocketAddress(address)) { return address }

    return new SocketAddress(address, port, uuid)
  }

  constructor (address, port, uuid) {
    if (!address) address = ''
    if (!port) port = consts.SETTINGS.NODE.PORT

    try {
      if (address.indexOf('https://') >= 0) {
        address = address.replace('https://', '')
        this.SSL = true
      } else {
        address = address.replace('http://', '')
      }
    } catch (exception) {

    }

    let errorIPv6 = false
    try {
      if (ipaddr.IPv6.isIPv6(address)) { address = this._extractIPv6(address) }
    } catch (exception) {
      console.error('invalid ipv6', address)
      errorIPv6 = true
    }

    if (address.lastIndexOf(':') > 0) { // port
      port = address.substr(address.lastIndexOf(':') + 1)
      address = address.substr(0, address.lastIndexOf(':'))
    }

    if (errorIPv6 && ipaddr.IPv6.isIPv6(address)) { address = this._extractIPv6(address) }

    if (ipaddr.IPv4.isIPv4(address)) {
      let ip = ipaddr.IPv4.parse(address)
      address = ip.toNormalizedString() // IPv4
    } else {
    }// it is a domain

    this.address = address // always ipv6

    this.port = port
    this._geoLocation = Utils.makeQuerablePromise(new Promise(async (resolve) => {
      this._geoLocationResolver = resolve
    }))

    this.uuid = uuid
  }

  _extractIPv6 (address) {
    let ip = ipaddr.IPv6.parse(address)

    if (ip.isIPv4MappedAddress()) // ip.toIPv4Address().toString() is IPv4
    { address = ip.toIPv4Address().toNormalizedString() } else // ipString is IPv6
    { address = ip.toNormalizedString() }

    return address
  }

  matchAddress (address, validationDoubleConnectionsTypes = { 'ip': true, 'uuid': true }) {
    // maybe it is a socket
    let sckAddress = SocketAddress.createSocketAddress(address)

    // uuid validation

    if (validationDoubleConnectionsTypes.uuid) {
      if (this.uuid && sckAddress.uuid && this.uuid === sckAddress.uuid) { return true }
    }

    if (validationDoubleConnectionsTypes.ip) {
      if (validationDoubleConnectionsTypes.port) { return (this.address + ':' + this.port === sckAddress.address + ':' + sckAddress.port) } else { return this.address === sckAddress.address }
    }

    return false
  }

  /*
        return nice looking ip addresses
     */
  toString () {
    return this.getAddress(false)
  }

  /*
        returns ipv6 ip standard
     */
  getAddress (includePort = true, includeHTTP = false) {
    return (includeHTTP ? 'http' + (this.SSL ? 's' : '') + '://' : '') + this.address + (includePort ? ':' + this.port : '')
  }

  get geoLocation () {
    return this._geoLocation
  }

  async getLocationNow () {
    if (this._geoLocation.isFulfilled()) { return this._geoLocation }

    let answer = await GeoHelper.getLocationFromAddress(this)

    if (!answer) this._geoLocationResolver(null)
    else this._geoLocationResolver(answer)

    return this._geoLocation
  }

  isLocalHost () {
    return false

    try {
      let address = this.getAddress(false)

      if (address.indexOf('127.0.0.1') >= 0 || address.indexOf('localhost') >= 0) { return true }

      if (address.indexOf('::1') >= 0) { return true }

      if (address.indexOf('::') >= 0) { return true }

      return false
    } catch (Exception) {
      throw { message: 'EXCEPTION isLocalHost', address: this.address }
    }
  }
}

export default SocketAddress
