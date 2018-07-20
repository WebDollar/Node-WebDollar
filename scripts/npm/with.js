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
// ...

// default expressions
parser.addNamespaceExpression();
parser.addKeyValueExpression();
parser.addOptionExpression();

// parse
parser.parse();

// save
storage.save(parser.all());
