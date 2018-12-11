import {isString, isBoolean} from 'lodash';

/**
 * Base class for all the JSON RPC API Methods
 */
class RpcMethod
{
    constructor(name) {

        if (isString(name) === false || name === '')
        {
            throw new Error('Name must be defined as a non empty string');
        }

        this._name    = name;
        this._options = new Map();
    }

    /**
     * @return {string}
     */
    getName() {
        return this._name;
    }

    /**
     * @return MapConstructor
     */
    getOptions() {
        return this._options;
    }

    /**
     * @param {string} name
     * @return {string|int|bool|Object|Array}
     */
    getOption(name) {
        if (this.hasOption(name) === false)
        {
            return null;
        }

        return this._options.get(name);
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    hasOption(name) {
        return this._options.has(name);
    }

    /**
     * @param {string} name
     * @param {string|int|bool|Object|Array} value
     */
    setOption(name, value) {
        this._options.set(name, value);
    }

    getHandler(args) {
        throw new Error('Handler is not defined');
    }

    getParamType() {
        return this.getOption('paramType') || Array;
    }

    /**
     * @return {boolean}
     */
    isPrivate() {x
        const bIsPrivate = this.getOption('isPrivate');

        if (bIsPrivate !== null && isBoolean(bIsPrivate))
        {
            return bIsPrivate;
        }

        return false;
    }
}

export default RpcMethod;
