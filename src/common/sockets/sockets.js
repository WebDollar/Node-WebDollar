import { Observable, Subscribable } from 'rxjs/Observable';

/*
       FUNCTIONS
*/

let sendRequest = function (socket, request, requestData) {
    //console.log("sendRequest",request, requestData);

    if (typeof socket.emit === 'function')
        return socket.emit( request, requestData);
    else
        return socket.send( request, requestData);
};


/*
    Sending the Request and return the Promise to Wait Async
*/

let sendRequestWaitOnce = function  (socket, request, requestData) {

    return new Promise((resolve) => {

        sendRequest(socket, request, requestData);

        socket.once(request, function (resData) {

            resolve(resData);

        });

    });
};

exports.sendRequestWaitOnce = sendRequestWaitOnce;


