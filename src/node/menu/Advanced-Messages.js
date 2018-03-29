import CLI from "./CLI-Menu";

class AdvancedMessages{

    alert(){

        if (process.env.BROWSER)
            alert(arguments);
        else
            console.warn(arguments);
    }

    //askForConfirmation
    confirm(message){

        return new Promise(resolve => {
            if (process.env.BROWSER) {
                resolve(confirm(message));
            } else {
                CLI.WEBD_CLI.question(message + " (yes/no) ? ", (answer) => {
                    resolve(answer === "yes");
                });
            }
        });

    }

    logInfo(cliMsg, browserMsg) {

       if (process.env.BROWSER)
           console.info(browserMsg || cliMsg);
       else
           console.info(cliMsg);
    }

}

export default new AdvancedMessages();