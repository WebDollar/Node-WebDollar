class Method
{
    constructor(name, options = {}) {
        this._name    = name;
        this._options = options;
    }

    getName() {
        return this._name
    }

    getOptions() {
        return this._options;
    }

    getHandler(args) {
        throw new {code: 500, message: 'Handler not found'};
    }

    getParamType() {
        return this._options['paramType'] || Array;
    }
}

export default Method;
