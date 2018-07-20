const FS = require('fs');

class Storage {
    constructor(source = '.with.json') {
        this.source = source;
    }

    save(data = {}) {
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

        if (FS.existsSync(this.source)) {
            const content = FS.readFileSync(this.source, 'utf8');

            const json = JSON.parse(content.trim());

            Object.keys(json).forEach((key) => {
                if (typeof json[key] == 'object') {
                    if (!data[key]) {
                        data[key] = {};
                    }

                    data[key] = Object.assign(data[key], wrap_string_value(json[key]));

                    return false;
                }

                data[key] = wrap_string_value(json[key]);
            });

            return data;
        }

        return data;
    }
}

module.exports = Storage;
