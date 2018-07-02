import Blockchain from "main-blockchain/Blockchain"

let CLI, readline;
let termination;


if (!process.env.BROWSER){
    readline = require('readline');
    termination = require('./../../termination').default;
}

class AdvancedMessages{

    constructor(){

        if (!process.env.BROWSER){
            this.WEBD_CLI = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                prompt: 'WEBD_CLI:> '
            });

            this.WEBD_CLI.on("SIGINT", function () {

                termination(Blockchain);

            });

        }

    }

    alert(param){

        if (process.env.BROWSER)
            alert(param);
        else
            console.warn(param);
    }


    input(message){

        if (process.env.BROWSER)
            return prompt(message);
        else
            return this._questionCLI(message);
    }

    async confirm(message){

        if (process.env.BROWSER)
            return await confirm(message);
        else {

            while (1===1) {
                let answer = (await this._questionCLI(message + "  y/n")).toLowerCase();

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


    _questionCLI(message){

        return new Promise ((resolve)=> {

            console.info(message);
            this.WEBD_CLI.question('', (answer)=>{
                resolve(answer);
            });

        });

    }



}

export default new AdvancedMessages();