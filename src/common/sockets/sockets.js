import { Observable, Subscribable } from 'rxjs/Observable';

/*
       FUNCTIONS
   */

exports.sendRequest = function (socket, request, requestData) {
    return socket.emit( request, requestData);
}


/*
    Sending the Request and return the Promise to Wait Async
*/
exports.sendRequestWaitOnce = function  (request, requestData) {

    return new Promise((resolve) => {

        this.sendRequest(request, requestData);

        socket.once(request, function (resData) {

            resolve(resData);

        });

    });
}

/*
 Sending Request and Obtain the Observable Object
 */
exports.sendRequestSubscribe = function (socket, request, requestData) {

    let result = this.sendRequest(socket, request, requestData);

    return this.subscribeSocketObservable(socket, request);
}

/*
    Subscribe and Return the observable
 */
exports.subscribeSocketObservable = function (socket, request) {

    //let observable = new Observable < Object > (observer => {
    let observable = Observable.create(observer => {
        socket.on(request, (data) => {
            observer.next(data);
        });
    });

    return observable;
}
