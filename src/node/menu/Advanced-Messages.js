import CLI from "./CLI-Menu";

class AdvancedMessages{

    alert(){

        if (process.env.BROWSER)
            alert(arguments);
        else
            console.warn(arguments);
    }

    async confirm(message){

        if (process.env.BROWSER) {
            return confirm(message);
        } else {
            let answer = await CLI.question(message + " (yes/no) ? ");

            return answer === "yes";
        }

    }

    log(cliMsg, browserMsg) {

       if (process.env.BROWSER)
           console.info(browserMsg || cliMsg);
       else
           console.info(cliMsg);
    }

}

export default new AdvancedMessages();