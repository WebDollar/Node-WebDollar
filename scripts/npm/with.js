const Parser = require('./with/parser.js');
const Storage = require('./with/storage.js');

// avoid running the code again if this one gets required
if (require.main !== module) {
    // easy access to read & save
    module.exports = {
        read: (data, source) => {
            return (new Storage(source)).read(data);
        },
        save: (data, source) => {
            return (new Storage(source)).save(data);
        }
    };

    return false;
}

const parser = new Parser();
const storage = new Storage();

// Add custom expressions here. Order matters!
parser.addOptions({
    dev: false,
});

// default expressions
parser.addNamespace(); // finds: namespace:key=value
parser.addKeyValue(); // finds: key=value
parser.addOption('overwrite', false); // finds: key

// parse
parser.parse();

// save
storage.save(parser.all());
