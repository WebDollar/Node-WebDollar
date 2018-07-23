const FS = require('fs');

class Storage {
    constructor(source = '.with.json') {
        this.source = source;
    }

    save(data = {}) {
        const current = this._current();
        if (data.OVERWRITE && current) {
            Object.keys(current).forEach((key) => {
                if (typeof current[key] == 'object') {
                    if (!current[key]) {
                        current[key] = {};
                    }

                    // add new data
                    current[key] = Object.assign(current[key], data[key]);

                    return false;
                }

                current[key] = data[key];
            });

            // flip
            data = current;
        }

        // remove it
        if (data.OVERWRITE) {
            delete data.OVERWRITE;
        }

        FS.writeFileSync(this.source, JSON.stringify(data, null, 4), () => {});

        return this;
    }

    read(data = {}) {
        // env fix
        const wrap_string_value = (target) => {
            if (typeof target == 'string') {
                return `"${target}"`;
            }

            if (typeof target == 'object') {
                Object.keys(target).forEach((key) => {
                    const value = target[key];

                    target[key] = (typeof value == 'string') ? `"${value}"` : value;
                });
            }

            return target;
        };

        const current = this._current();
        if (current) {
            Object.keys(current).forEach((key) => {
                if (typeof current[key] == 'object') {
                    if (!data[key]) {
                        data[key] = {};
                    }

                    data[key] = Object.assign(data[key], wrap_string_value(current[key]));

                    return false;
                }

                data[key] = wrap_string_value(current[key]);
            });

            return data;
        }

        return data;
    }

    _current() {
        if (FS.existsSync(this.source)) {
            const content = FS.readFileSync(this.source, 'utf8');

            return JSON.parse(content.trim());
        }

        return false;
    }
}

module.exports = Storage;
