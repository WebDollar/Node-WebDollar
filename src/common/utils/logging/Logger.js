class Logger{

    constructor(name){
        this.name = name;
    }

    error(msg, msg2, msg3){
        console.log('\x1b[31m%s\x1b[0m', this.name, "\x1b[0m", msg, msg2, msg3);
    }

    info(msg, msg2, msg3){
        console.log('\x1b[34m%s\x1b[0m', this.name, "\x1b[0m", msg, msg2, msg3);
    }

    debug(msg, msg2, msg3){
        console.log('\x1b[32m%s\x1b[0m', this.name, "\x1b[0m", msg, msg2, msg3);
    }

    warn(msg, msg2, msg3){
        console.log('\x1b[33m%s\x1b[0m', this.name, "\x1b[0m", msg, msg2, msg3);
    }

}

export default Logger;