class Logger {

    constructor(name){
        this.name = name;

        if (process.env.BROWSER){
            this.error = this.error_browser;
            this.info = this.info_browser;
            this.debug = this.debug_browser;
            this.warn = this.warn_browser;
            this.log = this.log_browser;
        }

    }

    error_browser(){
        console.error(this.name, " : ", this.convertArguments.apply(this, arguments) );
    }

    info_browser(){
        console.info(this.name, " : ", this.convertArguments.apply(this, arguments) );
    }

    debug_browser(){
        console.log(this.name, " : ", this.convertArguments.apply(this, arguments) );
    }

    warn_browser(){
        console.warn(this.name, " : ", this.convertArguments.apply(this, arguments) );
    }

    log_browser(){
        console.debug(this.name, " : ", this.convertArguments.apply(this, arguments) );
    }

    error(){
        console.log('\x1b[31m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    info(){
        console.log('\x1b[34m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    debug(){
        console.log('\x1b[32m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    warn(){
        console.log('\x1b[33m%s\x1b[0m', this.name, "\x1b[0m", this.convertArguments.apply(this, arguments) );
    }

    log(){
        console.log(this.name, this.convertArguments.apply(this, arguments) );
    }

    convertArguments(){

        let s=  '';
        for (let i=0; i<arguments.length; i++) {

            if (i === 1 ) continue;

            if (arguments[i] === undefined) continue;

            if (typeof arguments[i] === "string") s += arguments[i];
            else console.log(arguments[i]);

            s += "   ";
        }

        return s;

    }

}

export default Logger;
