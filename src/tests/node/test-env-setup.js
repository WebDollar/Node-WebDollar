// Shim for running the Node-targeted bundle under plain Node (mocha-webpack --require).
// pouchdb-browser (an unconditional dependency of Interface-SatoshminDB.js, used only in
// the browser branch at runtime) references the browser global `self` at module load time.
// Not a change to any WebDollar source file — test-environment setup only.
if (typeof global.self === 'undefined') {
    global.self = global;
}
