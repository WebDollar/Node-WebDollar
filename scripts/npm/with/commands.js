const Storage = require('./storage.js');
const Command = require('./command.js');

class Commands {
    constructor() {
        this._list = {};

        // builtins are ignored in json()
        this.add({ name: 'help', help: 'Displays this help message', builtin: true });
        this.add({ name: 'save', help: 'Saves commands for later', default: false, builtin: true });

        // development
        this.add({ name: 'dev', help: 'Use development & show debug messages', default: false });
    }

    add(data) {
        const command = Command.factory(data);

        this._list[command.name()] = command;

        return this;
    }

    find(name) {
        name = name.toLowerCase();

        return this._list[name];
    }

    process() {
        const expression = new RegExp(/(.*)=(.*)$/);

        process.argv.slice(2).forEach((arg) => {
            let name = arg;
            let value = undefined;

            const match = arg.match(expression);
            if (match) {
                name = match[1];
                value = match[2];
            }

            let command = this.find(name);
            if (command) {
                command.setValue(value);
            }
        });


        const help = this.find('help');
        if (process.argv.length == 2 || (help && help.value())) {
            this.help();

            process.exit(0);
        }
    }

    json() {
        const json = {};
        Object.keys(this._list).forEach((name) => {
            const command = this._list[name];

            if (!command.isBuiltin()) {
                const temp = command.json();

                Object.keys(temp).forEach((key) => {
                    if (!json[key]) {
                        json[key] = {};
                    }

                    if (typeof temp[key] === 'object') {
                        json[key] = Object.assign(json[key], temp[key]);

                        return false;
                    }

                    json[key] = temp[key];
                });
            }
        });

        return json;
    }

    help() {
        const color = {
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            reset: '\x1b[0m',
            dim: '\x1b[2m',
        };

        const padding = 20; // command/new line padding
        const no_tab = ['Example:', 'Notes:'];

        // temporary solution
        const sections = {};

        Object.keys(this._list).forEach((name) => {
            const command = this._list[name];

            let section = '';
            const ns = command.namespace();
            if (ns && !sections[ns]) {
                section = `${color.yellow}${ns}${color.reset}\n`;

                sections[ns] = true;
            }

            let lines = command.help().split('\n');

            let help = false;
            lines.forEach((line, index) => {
                // first line
                if (!help) {
                    // Note the space after section. Lower we use padding+1 because of it.
                    help = `${section} ${color.green}${command.name().padEnd(padding)} ${color.reset}${line.trim()}`;

                    if (command.defaultValue() !== undefined) {
                        help = `${help} ${color.yellow}[default: ${command.defaultValue()}]${color.reset}`;
                    }

                    if (command.options()) {
                        help = `${help} ${color.yellow}[options: ${command.optionsList()}]${color.reset}`;
                    }

                    return false;
                }

                // to tab or not to tab
                let tabbed = '\t';
                no_tab.forEach((str) => {
                    if (line.indexOf(str) !== -1) {
                        tabbed = '';
                    }
                });

                help += `\n${"".padEnd(padding+1)} ${color.dim}${tabbed}${line.trim()}${color.reset}`;
            });

            console.log(help);
        });
    }

    static exit() {
        console.log.apply(undefined, arguments);

        process.exit(1);
    }

    static save(commands) {
        (new Storage()).save(commands.json(), commands.find('save').value());
    }

    static read(wrap_strings = true) {
        const data = (new Storage()).read(wrap_strings);
        if (!data) {
            Commands.exit('No commands were found.\nYou need to run "npm run with"!');
        }

        return data;
    }
}

module.exports = Commands;
