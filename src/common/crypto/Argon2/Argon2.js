let Argon2 = null;

if (typeof window !== 'undefined') {

    //tutorial based on https://github.com/ranisalt/node-argon2
    Argon2 = require('argon2-browser').default
}
else {

    //tutorial based on https://www.npmjs.com/package/argon2
    Argon2 = require('argon2').default
}

export default Argon2