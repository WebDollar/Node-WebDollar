import consts from 'consts/const_global';


/*
 * Logging class which provides a logging helper to work with multiple 
 * winston logger instances using different configuration settings for 
 * each logger. This is useful in larger applications where you may want 
 * group logging output into topics or categories for different parts of 
 * the code.
 */
class Log{

    constructor(){


    }
    
    /*
     * Logs an info message
     */
    info(msg, config = consts.LOG_INSTANCE.DEFAULT){



    }

    /*
     * Logs an debug message
     */
    debug(msg, config = consts.LOG_INSTANCE.DEFAULT){

    }

    /*
     * Logs an error message
     */
    error(msg, config = consts.LOG_INSTANCE.DEFAULT){


    }

}

export default new Log();
