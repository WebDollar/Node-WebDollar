import consts from 'consts/const_global';

let config;
let logging;

if (!process.env.BROWSER){
    config = require("./config.json");
    logging = require("node-logger-winston");
    logging.init(config);
}

/*
 * Logging class which provides a logging helper to work with multiple 
 * winston logger instances using different configuration settings for 
 * each logger. This is useful in larger applications where you may want 
 * group logging output into topics or categories for different parts of 
 * the code.
 */
class Log{

    constructor(){

        /*
         * Create 4 different loggers with specific settings which can be
         * set in the config.json file.
         * The default logger uses "info" as default level.
         * The pools logger uses "debug" as default level
         * You can create new "settings" in the config.json file and 
         * instantiate another logger below
         */
        this.defaultLogger = logging.getLogger("default");
        this.poolsLogger = logging.getLogger("pools");
        this.blockchainLogger = logging.getLogger("blockchain");
        this.menuLogger = logging.getLogger("cli_menu");

    }
    
    /*
     * Logs an info message
     */
    info(msg, config = consts.LOG_INSTANCE.DEFAULT){

        if(process.env.BROWSER)
            return;

        switch (config) {
            case consts.LOG_INSTANCE.POOLS:
                this.poolsLogger.info(msg);
                break;
            case consts.LOG_INSTANCE.BLOCKCHAIN:
                this.blockchainLogger.info(msg);
                break;
            case consts.LOG_INSTANCE.CLI_MENU:
                this.menuLogger.info(msg);
                break;
            default:
                this.defaultLogger.info(msg);
        }

    }

    /*
     * Logs an debug message
     */
    debug(msg, config = consts.LOG_INSTANCE.DEFAULT){

        if(process.env.BROWSER)
            return;

        switch (config) {
            case consts.LOG_INSTANCE.POOLS:
                this.poolsLogger.debug(msg);
                break;
            case consts.LOG_INSTANCE.BLOCKCHAIN:
                this.blockchainLogger.debug(msg);
                break;
            case consts.LOG_INSTANCE.CLI_MENU:
                this.menuLogger.debug(msg);
                break;
            default:
                this.defaultLogger.debug(msg);
        }

    }

    /*
     * Logs an error message
     */
    error(msg, config = consts.LOG_INSTANCE.DEFAULT){

        if(process.env.BROWSER)
            return;

        switch (config) {
            case consts.LOG_INSTANCE.POOLS:
                this.poolsLogger.error(msg);
                break;
            case consts.LOG_INSTANCE.BLOCKCHAIN:
                this.blockchainLogger.error(msg);
                break;
            case consts.LOG_INSTANCE.CLI_MENU:
                this.menuLogger.error(msg);
                break;
            default:
                this.defaultLogger.error(msg);
        }

    }

}

export default new Log();
