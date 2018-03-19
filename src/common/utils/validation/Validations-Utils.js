import consts from 'consts/const_global'
import {setCookie, getCookie} from "../cookies/Cookies"
import DetectMultipleWindows from "./Detect-Multiple-Windows"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'
import StatusEvents from "common/events/Status-Events";

let PounchDB;

if (process.env.BROWSER) PounchDB = require('pouchdb').default;
else PounchDB = require('pouchdb-node');

const DATABASES = ["validateDB", "defaultDB", consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE];
const TIME_OUT = 10000;
const TIME_OUT_DESTROY = 1000;

class ValidationsUtils{

    constructor(){

    }

    async validate(){
        this._validateIndexedDB();
        // await this._validatePouchDB();
        this._detectIncognito();
    }

    _pouchDestroy(dbName){

        return new Promise(async (resolve)=>{

            let poucbdb = new PounchDB(dbName);
            let result = false;

            let timeout = setTimeout(()=>{
                poucbdb.close();
                resolve(false);
            }, TIME_OUT_DESTROY);

            try {
                let answer = await poucbdb.destroy();
                result = true;
            } catch (exception){
                result = false;
            }

            clearTimeout(timeout);
            poucbdb.close();
            resolve(true);

        })
    }

    async clearIndexedDB(){

        if (typeof window !== "undefined")
            if (!confirm("Are you WANT TO DELETE YOUR WALLET?"))
                return false;
        let error = false;

        for (let i = 0; i < DATABASES.length; i++) {
            try {
                await this._pouchDestroy(DATABASES[i])
            } catch (exception){
                error = true;
            }
        }

        if (typeof window !== "undefined") {

            alert('1');
            for (let i=0; i<DATABASES.length; i++) {
                window.indexedDB.deleteDatabase('_pouch_' + DATABASES[i]);
                window.localStorage.removeItem("_pouch_" + DATABASES[i]);
            }

            window.localStorage.removeItem("_pouch_check_localstorage");
            window.localStorage.clear();
            alert("am sters tot");
        }

        return error;
    }

    _validateIndexedDB(){

        if (typeof window === 'undefined') return true;

        let indexedDB = window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB;

        if (indexedDB) {
            StatusEvents.emit("validation/status", {result: true, message: "IndexedDB is available"})
            return true;
        }
        else {
            StatusEvents.emit("validation/status", {result: false, message: "IndexedDB is not supported"})
            return false;
        }

    }


    async _validatePouchDB(initialTest=true){

        try {


            if (initialTest) {
                for (let i = 0; i < DATABASES.length; i++) {

                    if (!(await this.testPounchDB(DATABASES[i], TIME_OUT))) throw {message: "it didn't work"};
                    alert(DATABASES[i] + "   " + i + "  merge 1")
                    if (!(await this.testPounchDB2(DATABASES[i], TIME_OUT))) throw {message: "it didn't work"};
                    alert(DATABASES[i] + "   " + i + "  merge 2")
                    if (!(await this.testPounchDB3(DATABASES[i], TIME_OUT))) throw {message: "it didn't work"};
                    alert(DATABASES[i] + "   " + i + "  merge 3")
                }
            }
        } catch (exception){

            if (initialTest) {
                await this.clearIndexedDB();
                await this._validatePouchDB(false);
            }

        }

    }

    testPounchDB(dbName, timeoutTime=TIME_OUT){

        return new Promise(async (resolve)=>{

            let timeout;
            let db = new PounchDB(dbName);
            let result = false;

            try{

                let number = Math.floor(Math.random()*100000000).toString();

                timeout = setTimeout(()=>{
                    StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB doesn't work", dbName: dbName + " - PouchDB 1 directly TIMEOUT" });
                    resolve(false);
                }, timeoutTime);


                await db.put({
                    _id: "validate_test"+number,
                    number: number
                });

                let data = await db.get("validate_test"+number /*, {attachments: true}*/);
                let number2 = data.number;

                db.remove("validate_test"+number );

                // alert(number);
                // alert(JSON.stringify(data));
                if (number !== number2 || number === null || number2 === null)
                    throw (number === undefined ? 'undefined' : number.toString())+" !== "+ (number2 === undefined ? 'undefined' : number2.toString());

                StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB works", dbName: dbName});
                result = true;
            } catch (exception){
                console.error("PouchDB doesn't work well", exception, "data", data);
                StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB doesn't work", dbName: dbName + " - PouchDB 1 directly "+ JSON.stringify(data) });
            }

            clearTimeout(timeout);
            db.close();
            resolve(result);
        })


    }

    async testPounchDB2(dbName, timeoutTime=TIME_OUT){

        let db = new InterfaceSatoshminDB(dbName);
        let result = false;
        try{

            let number = Math.floor(Math.random()*10000000).toString();

            await db.save("validate_test", number, timeoutTime);
            let number2 = await db.get("validate_test", timeoutTime);

            if (number !== number2 || number === null || number2 === null)
                throw (number === null ? 'null' : number.toString())+" !== "+ (number2 === null ? 'null' : number2.toString());


            StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB works", dbName: dbName});
            result = true;
        } catch (exception){
            console.error("PouchDB doesn't work well 2", exception);
            StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB doesn't work", dbName: dbName  +" 2 " });
        }

        db.close();
        return result;
    }

    async testPounchDB3(dbName, timeoutTime){

        let db = new InterfaceSatoshminDB(dbName);
        let result = false;
        try{

            let number = Math.floor(Math.random()*10000000).toString();

            await db.save("validate_test"+number, number, timeoutTime);
            let number2 = await db.get("validate_test"+number, timeoutTime);

            if (number !== number2 || number === null || number2 === null)
                throw (number === null ? 'null' : number.toString())+" !== "+ (number2 === null ? 'null' : number2.toString());

            StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB 3 works", dbName: dbName});
            result = true;
        } catch (exception){
            console.error("PouchDB doesn't work well 3", exception);
            StatusEvents.emit("validation/status", {result: true, message: "IndexedDB - PouchDB doesn't work", dbName: dbName +" 3 "});
        }

        db.close();
        return result;
    }

    _detectIncognito(){

        if (typeof window === "undefined") return true;

        let fs = window.RequestFileSystem || window.webkitRequestFileSystem;

        if (!fs) {
            console.error("_detectIncognito didn't work .. check failed?");
        } else {
            fs(window.TEMPORARY, 100,
                ()=>{
                    StatusEvents.emit("validation/status", {result: true, message: "Not incognito mode"})
                },
                ()=>{
                    StatusEvents.emit("validation/status", {result: false, message: "Incognito mode"})
                });
        }
    }

    waitSingleTab(waitCallback){

        if (typeof window === "undefined") return true;

        return DetectMultipleWindows.waitForSingleTabNow(waitCallback);
    }

}

export default ValidationsUtils;