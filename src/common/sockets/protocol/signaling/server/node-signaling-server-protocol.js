import consts from 'consts/const_global'

import NodesList from 'node/lists/nodes-list'

import SignalingServerRoomConnectionObject from './signaling-server-room/signaling-server-room-connection-object'

import SignalingServerRoom2 from "./signaling-server-room-2/Signaling-Server-Room-2"

class NodeSignalingServerProtocol {


    constructor(){

        this.started = false;

        console.log("NodeSignalingServerProtocol constructor");
    }

    /*
        Signaling Server Service
     */

    initializeSignalingServerService(socket){

        socket.node.on("signals/server/register/accept-web-peer-connections", (data) =>{

            try {

                let connections  = data.connections;
                if (typeof connections  !== "number") throw {message: "connections is not a number"};
                if (connections  <= 0) throw {message: "connections is less than 0"};

                let room = SignalingServerRoom2.addSocketToRoom(socket, data.connectionUUID, data.timeLeft||0 );

                let answer = this.connect(room);

                socket.node.sendRequest("signals/server/register/accept-web-peer-connections"+"/answer", {
                    result: true,
                });

            } catch (exception){

            }

        });

        socket.node.on("signals/server/connections/established-connection-was-dropped", (data)=>{

            let roomElement = SignalingServerRoom2.searchSocketRoom(socket);
            let connectionId = data.connectionId;

            for (let i=0; i<roomElement.listConnected.length; i++){
                if (roomElement.listConnected[i].id === connectionId){
                    roomElement.splice(i,1);
                }
            }

            let connections  = data.connections;
            if (typeof connections  !== "number") throw {message: "connections is not a number"};
            if (connections  <= 0) throw {message: "connections is less than 0"};

            roomElement.connections = connections;

            this.connect(roomElement);

        });

    }

    connect(socket){

        let roomElement = SignalingServerRoom2.searchSocketRoom(socket);
        if (roomElement === null) return false;

        if (roomElement.connections > 0)
            for (let i=0; i<SignalingServerRoom2.room.length; i++){

                let room2 = SignalingServerRoom2.room;

                if (SignalingServerRoom2.canSocketsConnect( roomElement, room2 )){

                    this.connectTwoPeers(roomElement.socket, room2[i].socket);
                    return true;

                }

            }

        return false;

    }


    async connectTwoPeers(client1, client2){

        let connection = SignalingServerRoom2.createConnection(client1, client2);


        // Step1, send the request to generate the INITIATOR SIGNAL
        client1.node.sendRequestWaitOnce("signals/client/initiator/generate-initiator-signal", {

            id: connection.id,

            remoteAddress: client2.node.sckAddress.getAddress(false),
            remoteUUID: client2.node.sckAddress.uuid,

        }, connection.id ).then ( (initiatorAnswer) =>{

            if ( initiatorAnswer === null || initiatorAnswer.initiatorSignal === undefined )
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
            else
            if ( initiatorAnswer.accepted === false && initiatorAnswer.message  === "Already connected")
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
            else
            if ( initiatorAnswer.accepted === false && initiatorAnswer.message === "Full Room")
                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionFullRoom;
            else

            if ( initiatorAnswer.accepted === true) {

                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.answerSignalGenerating;

                // Step 2, send the Initiator Signal to the 2nd Peer to get ANSWER SIGNAL

                client2.node.sendRequestWaitOnce("signals/client/answer/receive-initiator-signal", {
                    id: connection.id,
                    initiatorSignal: initiatorAnswer.initiatorSignal,

                    remoteAddress: client1.node.sckAddress.getAddress(false),
                    remoteUUID: client1.node.sckAddress.uuid,
                }, connection.id).then((answer)=>{

                    if ( answer === null || answer === undefined || answer.answerSignal === undefined )
                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                    else
                    if ( answer.accepted === false && answer.message === "Already connected")
                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                    else
                    if ( answer.accepted === false && answer.message === "Full Room")
                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionFullRoom;
                    else
                    if ( answer.accepted === true) {

                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 2_0 - Answer Signal received  ", connection.id, answer );

                        connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionEstablishing;

                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')  console.log("Step 2 - Answer Signal received  ", connection.id, answer );

                        // Step 3, send the Answer Signal to the 1st Peer (initiator) to establish connection
                        client1.node.sendRequestWaitOnce("signals/client/initiator/join-answer-signal",{
                            id: connection.id,
                            initiatorSignal: initiatorAnswer.initiatorSignal,
                            answerSignal: answer.answerSignal,

                            remoteAddress: client2.node.sckAddress.getAddress(false),
                            remoteUUID: client2.node.sckAddress.uuid,
                        }, connection.id).then( (result)=>{

                            if (process.env.DEBUG_SIGNALING_SERVER === 'true')
                                console.log("Step 4 - join-answer-signal  ", connection.id, result );

                            if ( result === null || result === undefined )
                                connection.status = SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionError;
                            else
                            if ( answer.established === false && answer.message === "Already connected")
                                connection.status =  SignalingServerRoomConnectionObject.ConnectionStatus.peerConnectionAlreadyConnected;
                            else {

                                if (result.established  === true) {

                                    //connected
                                    connection.refreshLastTimeConnected();

                                } else {
                                    //not connected
                                    connection.refreshLastTimeErrorChecked();
                                }
                            }

                        });
                    }

                    client2.node.on("signals/server/new-answer-ice-candidate/" + connection.id, (iceCandidate) => {

                        if (process.env.DEBUG_SIGNALING_SERVER === 'true')
                            console.log("Answer iceCandidate  ", connection.id, iceCandidate );

                        client1.node.sendRequest("signals/client/initiator/receive-ice-candidate",{
                            id: connection.id,

                            initiatorSignal: initiatorAnswer.initiatorSignal,
                            iceCandidate: iceCandidate,

                            remoteAddress: client2.node.sckAddress.getAddress(false),
                            remoteUUID: client2.node.sckAddress.uuid,
                        });

                    });



                });

                client1.node.on("signals/server/new-initiator-ice-candidate/" + connection.id, (iceCandidate) => {

                    if (process.env.DEBUG_SIGNALING_SERVER === 'true')
                        console.log("Initiator iceCandidate  ", connection.id, iceCandidate );

                    client2.node.sendRequest("signals/client/answer/receive-ice-candidate",{
                        id: connection.id,

                        initiatorSignal: initiatorAnswer.initiatorSignal,
                        iceCandidate: iceCandidate,

                        remoteAddress: client1.node.sckAddress.getAddress(false),
                        remoteUUID: client1.node.sckAddress.uuid,
                    });

                });


            }

        });

    }



}

export default new NodeSignalingServerProtocol();
