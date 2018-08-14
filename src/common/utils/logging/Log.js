import consts from 'consts/const_global';
import Logger from "./Logger"

const LOG_TYPE = {
    DEFAULT: 0,
    POOLS: 1,
    BLOCKCHAIN: 2,
    BLOCKCHAIN_FORKS: 3,
    CLI_MENU: 4,
    SAVING_MANAGER: 5,
};


/*
 * Logging class which provides a logging helper to work with multiple 
 * winston logger instances using different configuration settings for 
 * each logger. This is useful in larger applications where you may want 
 * group logging output into topics or categories for different parts of 
 * the code.
 */

class Log{

    constructor(){
        
        this.LOG_TYPE = LOG_TYPE;
        
        /*
         * Create 4 different loggers with specific settings which can be
         * set in the config.json file.
         * The default logger uses "info" as default level.
         * The pools logger uses "debug" as default level
         * You can create new "settings" in the config.json file and 
         * instantiate another logger below
         */
        this.defaultLogger = new Logger("default", LOG_TYPE.DEFAULT);
        this.poolsLogger = new Logger("pools", LOG_TYPE.POOLS);
        this.blockchainLogger = new Logger("blockchain", LOG_TYPE.BLOCKCHAIN);
        this.blockchainForksLogger = new Logger("blockchainForks", LOG_TYPE.BLOCKCHAIN_FORKS);
        this.menuLogger = new Logger("cli_menu", LOG_TYPE.CLI_MENU);

        this.loggers = {};
        this.loggers[LOG_TYPE.DEFAULT] = this.defaultLogger;
        this.loggers[LOG_TYPE.POOLS] = this.poolsLogger;
        this.loggers[LOG_TYPE.BLOCKCHAIN] = this.blockchainLogger;
        this.loggers[LOG_TYPE.BLOCKCHAIN_FORKS] = this.blockchainForksLogger;
        this.loggers[LOG_TYPE.CLI_MENU] = this.menuLogger;

    }
    
    /*
     * Logs an info message
     */
    info(msg, config = LOG_TYPE.DEFAULT, msg2, msg3){

        if (this.loggers[ config ] !== undefined)
            this.loggers[ config ].info.apply(this.loggers[ config ], arguments);

    }

    /*
     * Logs an info message
    */
    log(msg, config = LOG_TYPE.DEFAULT, msg2, msg3){


        if (this.loggers[ config ] !== undefined)
            this.loggers[ config ].log.apply(this.loggers[ config ], arguments);

    }


    /*
     * Logs an debug message
     */
    debug(msg, config = LOG_TYPE.DEFAULT, msg2, msg3){

        if (this.loggers[ config ] !== undefined)
            this.loggers[ config ].debug.apply(this.loggers[ config ], arguments);

    }

    /*
     * Logs an error message
     */
    error(msg, config = LOG_TYPE.DEFAULT, msg2, msg3){

        if (this.loggers[ arguments[1] ] !== undefined)
            this.loggers[ arguments[1] ].error.apply(this.loggers[ arguments[1] ], arguments);


    }

    /*
        * Logs an error message
    */
    warn(msg, config = LOG_TYPE.DEFAULT, msg2, msg3){

        if (this.loggers[ arguments[1] ] !== undefined)
            this.loggers[ arguments[1] ].warn.apply(this.loggers[ arguments[1] ], arguments);

    }


}

export default new Log();
