let Argon2 = null;

if (typeof window !== 'undefined') {

    //tutorial based on https://github.com/ranisalt/node-argon2
    Argon2 = require('./browser/Argon2-Browser').default
}
else {

    //tutorial based on https://www.npmjs.com/package/argon2
    Argon2 = require('./node/Argon2-Node').default
}

export default Argon2