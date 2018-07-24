class Command {
    constructor() {
        this._namespace = undefined;
        this._name = undefined;
        this._help = undefined;
        this._value = undefined;
        this._default = undefined;
        this._options = undefined;
        this._builtin = undefined;
    }

    namespace() {
        return this._namespace;
    }

    setName(name) {
        this._name = name.toLowerCase();

        const parts = this._name.split(':');
        if (parts.length > 1) {
            this._namespace = parts[0];
        }

        return this;
    }

    name() {
        return this._name;
    }

    setHelp(help) {
        this._help = help;

        return this;
    }

    help() {
        return this._help;
    }

    setValue(value, is_default = false) {
        if (typeof value === 'string') {
            if (value.toLowerCase() === 'true') {
                value = true;
            } else if (value.toLowerCase() === 'false') {
                value = false;
            } else {
                let temp = parseFloat(value);
                if (temp !== NaN) {
                    // add leading 0 if passed without it
                    if (temp.toString().startsWith('0.')) {
                        temp += 0;
                    }

                    if (temp.toString() === value) {
                        value = temp;
                    }
                }
            }
        }

        if (this.options()) {
            let found = false;
            this._options.forEach((option) => {
                if (option === value) {
                    found = true;
                }
            });

            if (!found) {
                console.log(`Command "${this.name()}" has options ${this.optionsList()} [given: "${value}"]`);

                process.exit(1);
            }
        }

        if (is_default) {
            this._default = value;

            return this;
        }

        this._value = value;

        return this;
    }

    value() {
        if (this._value === undefined) {
            return this._default;
        }

        return this._value;
    }

    defaultValue() {
        return this._default;
    }

    setOptions(options) {
        if (options instanceof Array) {
            options.forEach((option, index) => {
                options[index] = option.toLowerCase();
            });

            this._options = options;
        }

        return this;
    }

    options() {
        return this._options;
    }

    optionsList() {
        return this._options.join('/');
    }

    setBuiltin(builtin) {
        this._builtin = builtin || false;

        return this;
    }

    isBuiltin() {
        return this._builtin;
    }

    json() {
        const json = {};
        if (!this._namespace) {
            json[this.name()] = this.value();

            return json;
        }

        json[this._namespace] = {};
        json[this._namespace][this._name.split(':')[1]] = this.value();

        return json;
    }

    static factory(data) {
        const command = new Command();

        command.setName(data.name);
        command.setHelp(data.help);
        command.setValue(data.value);
        command.setValue(data.default, true); // default
        command.setOptions(data.options);

        command.setBuiltin(data.builtin);

        return command;
    }
}

module.exports = Command;
