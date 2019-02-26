class InterfaceBlockchainForkTests {

    //testing revert
    static test1(fork){

        if (fork.forkBlocks.length <= 5 ) return;

        console.info("TEST1 ENABLED");
        fork.forkBlocks[ 5 ].hash[10] = 22;
        fork.forkBlocks[ 5 ].hash[12] = 24;

    }

    //testing revert on account tree
    static test2(fork){

        for (let forkBlock of fork.forkBlocks ){

            if (forkBlock.height === fork.forkStartingHeight) continue;

            if (forkBlock.data.transactions.transactions.length >= 2){
                console.info("TEST2 ENABLED");
                forkBlock.data.transactions.transactions[1].to.addresses[0].amount += 5;
            }

        }

    }

    //testing revert on account tree
    static  test3(fork){

        for (let forkBlock of fork.forkBlocks ){

            if (forkBlock.height === fork.forkStartingHeight) continue;

            if (forkBlock.data.transactions.transactions.length >= 2){
                console.info("TEST2 ENABLED");
                forkBlock.data.transactions.transactions.push( forkBlock.data.transactions.transactions[forkBlock.data.transactions.transactions.length-1] );
            }

        }

    }


}

export default InterfaceBlockchainForkTests;