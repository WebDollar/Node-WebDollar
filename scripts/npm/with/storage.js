const FS = require('fs');

class Storage {
    constructor(source = '.with') {
        this.source = `${source}.json`;
        this.temp_source = `${source}.temp.json`;
    }

    save(data, has_save) {
        let source = this.source;
        if (!has_save) {
            source = this.temp_source;
        }

        FS.writeFileSync(source, JSON.stringify(data, null, 4), () => {});

        return this;
    }

    read(wrap_strings) {
        // env fix
        const wrap_string_value = (target) => {
            if (!wrap_strings) {
                return target;
            }

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

        // determine source
        let source = this.temp_source;
        let is_temp = true;
        if (!FS.existsSync(source)) {
            is_temp = false;
            source = this.source;

            if (!FS.existsSync(source)) {
                return false;
            }
        }

        // prepare data
        const data = {};
        const content = FS.readFileSync(source, 'utf8');
        const current = JSON.parse(content.trim());
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

        // remove temp file
        if (is_temp) {
            FS.unlinkSync(source);
        }

        return data;
    }
}

module.exports = Storage;
