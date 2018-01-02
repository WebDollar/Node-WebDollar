import InterfaceBlockchainMining from "./Interface-Blockchain-Mining";

class InterfaceBlockchainBrowserMining extends InterfaceBlockchainMining{

    mine(block, difficulty){

        return new Promise((resolve)=>{

            setInterval(()=>{



            }, 10)

        });

    }

}

export default InterfaceBlockchainBrowserMining