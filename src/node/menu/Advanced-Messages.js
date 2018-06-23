import CLI from "./CLI-Menu";

class AdvancedMessages{

    alert(param){

        if (process.env.BROWSER)
            alert(param);
        else
            console.warn(param);
    }


    input(message){

        if (process.env.BROWSER)
            return confirm(message);
        else
            return CLI.question(message);
    }

    async confirm(message){

        if (process.env.BROWSER)
            return await confirm(message);
        else {

            while (1===1) {
                let answer = (await CLI.question(message + "  y/n")).toLowerCase();

                if (answer === 'y') return true;
                else if (answer === 'n') return false;

            }

        }

    }


    async readNumber(message, isFloat = false) {

        let answer = await this.input(message);

        let num = isFloat ? parseFloat(answer) : parseInt(answer);
        if (isNaN(num))
            return NaN;

        return num;
    }



    log(cliMsg, browserMsg) {

        if (process.env.BROWSER)
            console.info(browserMsg || cliMsg);
        else
            console.info(cliMsg);
    }

}

export default new AdvancedMessages();