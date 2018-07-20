class Expression {
    constructor(name, regExp, validation) {
        this._name = name;
        this._regExp = regExp;
        this._validation = validation;
    }

    name() {
        return this._name;
    }

    match(arg) {
        const match = arg.match(this._regExp);

        return this._validation(match, arg, this);
    }
}

class Parser {
    constructor() {
        this._expressions = {};
        this._arguments = {};

        this._sanitise_expression = {
            number: new RegExp(/[\d]{1,}/),
        };
    }

    addExpression(name, regExp, validation = (arg) => {}) {
        const expr = new Expression(name, regExp, validation);

        this._expressions[expr.name()] = expr;

        return this;
    }

    addKeyValueExpression() {
        this.addExpression('default_key_value', new RegExp(/^(.*?)=(.*?)$/), (match, arg, self) => {
            if (!match) {
                return false;
            }

            for (let i = 1; i <= 2; i++) {
                if (!match[i].length) {
                    parser.exit(`Invalid argument: "${arg}"`);
                }
            }

            return {
                key: `${match[1].toUpperCase()}`,
                value: match[2],
            };
        });

        return this;
    }

    addNamespaceExpression() {
        this.addExpression('default_namespace', new RegExp(/^(.*?):(.*?)=(.*?)$/), (match, arg, self) => {
            if (!match) {
                return false;
            }

            for (let i = 1; i <= 3; i++) {
                if (!match[i].length) {
                    parser.exit(`Invalid argument: "${arg}"`);
                }
            }

            return {
                namespace: match[1].toUpperCase(),
                key: match[2].toUpperCase(),
                value: match[3],
            };
        });

        return this;
    }

    addOptionExpression() {
        this.addExpression('default_option', new RegExp(/^is-(.*)$/i), (match) => {
            if (match) {
                return { key: match[1].toUpperCase(), value: true };
            }
        });

        return this;
    }

    parse() {
        // keep track of what we find
        const found = {};

        // ignore first two and loop through the rest
        process.argv.slice(2).forEach((arg) => {
            Object.keys(this._expressions).forEach((key) => {
                // we already had a match
                if (found[arg]) {
                    return false;
                }

                const result = this._expressions[key].match(arg);
                if (!result) {
                    return false;
                }

                // combine namespace + key for simple tracking
                if (result.namespace) {
                    arg = `${result.namespace}_${result.key}`;
                }

                // mark it as found
                found[arg] = true;

                // cleanup value
                result.value = this._sanitiseValue(result.value);

                // save
                if (result.namespace) {
                    if (!this._arguments[result.namespace]) {
                        this._arguments[result.namespace] = {};
                    }

                    this._arguments[result.namespace][result.key] = result.value;

                    return false;
                }

                this._arguments[result.key] = result.value;
            });
        });

        return this._arguments;
    }

    all() {
        return this._arguments;
    }

    exit() {
        console.log.apply(undefined, arguments);

        process.exit(1);
    }

    _sanitiseValue(value) {
        if (typeof value == 'boolean') {
            return value;
        }

        if (value.toLowerCase() == 'false') {
            return false;
        } else if (value.toLowerCase() == 'true') {
            return true;
        }

        value = value.trim();

        const match = value.match(this._sanitise_expression.number);

        // matched numbers && only numbers
        if (match && match[0].length == value.length) {
            value = parseInt(value);
        }

        return value;
    }
}

module.exports = Parser;
