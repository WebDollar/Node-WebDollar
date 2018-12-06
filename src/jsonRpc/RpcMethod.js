/**
 * Base class for all the JSON RPC API Methods
 */
class RpcMethod
{
    constructor(name) {
        this._name    = name;
        this._options = new Map();
    }

    getName() {
        return this._name;
    }

    getOptions() {
        return this._options;
    }

    getOption(name) {
        if (this.hasOption(name) === false)
        {
            return null;
        }

        return this._options.get(name);
    }

    hasOption(name) {
        return this._options.has(name);
    }

    setOption(name, value) {
        this._options.set(name, value);
    }

    getHandler(args) {
        throw new Error('Handler is not defined');
    }

    getParamType() {
        return this.getOption('paramType') || Array;
    }

    isPrivate() {
        return this.getOption('isPrivate') || false;
    }
}

export default RpcMethod;
