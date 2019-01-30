import global from 'consts/global';
import isArrayBuffer from 'is-array-buffer';

/**
 * acknowledgment doesn't make much difference between event vs ackwnowledgment
 */

class SocketProtocol {

    sendRequestSocket (request, requestData ) {

        try {

            return this.emit(request, requestData,); //socket io and Simple-Peer WebRTC

        } catch (exception){
            console.error("Error sending request" + exception, exception);
            return null;
        }

    }


    sendRequestWebPeer (request, requestData, ) {

        try {

            return this.send(request, requestData); // Simple Peer WebRTC - socket

        } catch (exception){
            console.error("Error sending request" + exception, exception);
            return null;
        }

    }


    /*
        Sending the Request and return the Promise to Wait Async
    */

    sendRequestWaitOnce (request, requestData, answerSuffix, timeOutInterval=3000) {

        if ( answerSuffix !== undefined) answerSuffix = String(answerSuffix); //in case it is a number

        return new Promise((resolve) => {

            let requestAnswer = request;
            let timeoutId;

            if ( typeof answerSuffix === 'string' && answerSuffix.length > 0 ) {
                requestAnswer += (answerSuffix[1] !== '/' ? '/' : '') + answerSuffix;
                //console.log("sendRequestWaitOnce", request)
            }

            let requestFunction = (resData) => {

                if (global.TERMINATED) return;

                if (timeoutId !== undefined) clearTimeout(timeoutId);
                if (timeoutId === undefined ) return false;

                SocketProtocol._processBufferArray(resData);

                resolve(resData);
            };

            let clearReturnFunction = ()=>{

                if (this.removeListener !== undefined) //websocket io
                    this.removeListener(requestAnswer, requestFunction);
                else
                if (this.emitter !== undefined && this.emitter.removeListener !== undefined) //websocket io
                    this.emitter.removeListener(requestAnswer, requestFunction);

                resolve(null);
            };

            this.once(requestAnswer, requestFunction );

            if ( timeOutInterval )
                timeoutId = setTimeout( clearReturnFunction, timeOutInterval);

            let answer = this.node.sendRequest(request, requestData);

            if (answer === null)
                clearReturnFunction();

        });
    }

    _isIterable(obj) {
        // checks for null and undefined
        if (obj === null || obj === undefined) {
            return false;
        }
        return typeof obj[Symbol.iterator] === 'function';
    }

    /**
     * Browser sockets receives ArrayBuffer and it is not compatible with Buffer (UIntArray) in the Browser
     */
    static _processBufferArray(data){

        if (typeof data === "object" && data !== null)
            for (let prop in data){
                if (data.hasOwnProperty(prop)){

                    if (isArrayBuffer(data[prop]))
                        data[prop] = Buffer.from(data[prop]);
                    else
                    if (prop === "type" && data.type === "Buffer" && data.hasOwnProperty("data")) {
                        data = new Buffer(data);
                        return data;
                    }
                    else
                        data[prop] = SocketProtocol._processBufferArray(data[prop]);

                }
            }

        return data;
    }

}

export default SocketProtocol