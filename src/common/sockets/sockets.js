import { Observable, Subscribable } from 'rxjs/Observable';

/*
       FUNCTIONS
   */

let sendRequest = function (socket, request, requestData) {
    return socket.emit( request, requestData);
};

/*
    Sending the Request and return the Promise to Wait Async
*/

let sendRequestWaitOnce = function  (socket, request, requestData) {

    return new Promise((resolve) => {

        sendRequest(request, requestData);

        socket.once(request, function (resData) {

            resolve(resData);

        });

    });
};
/*
 Sending Request and Obtain the Observable Object
 */
let sendRequestSubscribe = function (socket, request, requestData) {

    let result = sendRequest(socket, request, requestData);

    return subscribeSocketObservable(socket, request);
};

/*
    Subscribe and Return the observable
 */
let subscribeSocketObservable = function (socket, request) {

    //let observable = new Observable < Object > (observer => {
    let observable = Observable.create(observer => {
        socket.on(request, (data) => {
            observer.next(data);
        });
    });

    return observable;
};



exports.sendRequest = sendRequest;
exports.sendRequestWaitOnce = sendRequestWaitOnce;
exports.sendRequestSubscribe = sendRequestSubscribe;
exports.subscribeSocketObservable = subscribeSocketObservable;




