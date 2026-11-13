// Shim for running the Node-targeted bundle under plain Node (mocha-webpack --require,
// or `node --require` for a spawned instance). Not a change to any WebDollar source file —
// test-environment setup only.

// pouchdb-browser (an unconditional dependency of Interface-SatoshminDB.js, used only in
// the browser branch at runtime) references the browser global `self` at module load time.
if (typeof global.self === 'undefined') {
    global.self = global;
}

// argon2-browser (the browser/WASM build, loaded unconditionally even in the Node bundle)
// registers its own `process.on('unhandledRejection', abort)` at module load time, which
// throws synchronously and crashes the whole process on ANY unrelated unhandled rejection
// elsewhere in the app (e.g. a transient network fetch failure while syncing with a real
// peer) — confirmed by reproducing it with the 3-instance integration test. Swallow any
// further 'unhandledRejection' registration so argon2-browser's handler never attaches;
// keep one safe logging handler of our own.
const realProcessOn = process.on.bind(process);
process.on = function (event, listener) {
    if (event === 'unhandledRejection') return process;
    return realProcessOn(event, listener);
};
realProcessOn('unhandledRejection', (reason) => {
    console.error('[test-env-setup] unhandled rejection (ignored):', reason && reason.message ? reason.message : reason);
});
