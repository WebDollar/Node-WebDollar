// Use CommonJS syntax (module.exports). Works in browser, too!
// Only limitation: You won't have require() when run in the browser.
module.exports = function(input, done) {
    console.log(input);
    done("Task had been finished");
};