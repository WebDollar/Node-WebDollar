import {setCookie, getCookie} from "../cookies/Cookies"
import DetectMultipleTabs from "./Detect-Multiple-Tabs"

class ValidationsUtils{

    constructor(blockchain){


        this._blockchain = blockchain;


        this._validateIndexedDB();

    }

    _validateIndexedDB(){

        if (typeof window === 'undefined') return;

        let indexedDB = window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB;

        if (indexedDB)
            this._blockchain.emitter.emit("validation/status", {result:true, message: "IndexedDB is available"})
        else
            this._blockchain.emitter.emit("validation/status", {result:false, message: "IndexedDB is not supported"})

    }

    waitSingleTab(waitCallback){

        if (typeof window === "undefined") return true;

        return DetectMultipleTabs.waitForSingleTabNow(waitCallback);
    }

    // _validateBrowser(){
    //     // Do not allow multiple call center tabs
    //     //if (~window.location.hash.indexOf('#admin/callcenter')) {
    //     if (1===1) {
    //         $(window).on('beforeunload onbeforeunload', function(){
    //             document.cookie = 'ic_window_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    //         });
    //
    //         function validateCallCenterTab() {
    //             var win_id_cookie_duration = 10; // in seconds
    //
    //             if (!window.name) {
    //                 window.name = Math.random().toString();
    //             }
    //
    //             if (!getCookie('ic_window_id') || window.name === getCookie('ic_window_id')) {
    //                 // This means they are using just one tab. Set/clobber the cookie to prolong the tab's validity.
    //                 setCookie('ic_window_id', window.name, win_id_cookie_duration);
    //             } else if (getCookie('ic_window_id') !== window.name) {
    //                 // this means another browser tab is open, alert them to close the tabs until there is only one remaining
    //                 var message = 'You cannot have this website open in multiple tabs. ' +
    //                     'Please close them until there is only one remaining. Thanks!';
    //                 $('html').html(message);
    //                 clearInterval(callCenterInterval);
    //                 throw 'Multiple call center tabs error. Program terminating.';
    //             }
    //         }
    //
    //         callCenterInterval = setInterval(validateCallCenterTab, 3000);
    //     }
    // }

}

export default ValidationsUtils;