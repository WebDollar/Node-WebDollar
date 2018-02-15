import {setCookie, getCookie} from "../cookies/Cookies"
import DetectMultipleWindows from "./Detect-Multiple-Windows"
import InterfaceSatoshminDB from 'common/satoshmindb/Interface-SatoshminDB'

class ValidationsUtils{

    constructor(emitter){

        this._emitter = emitter;

    }

    async validate(){
        this._validateIndexedDB();
        await this._validatePouchDB();
        this._detectIncognito();
    }

    _validateIndexedDB(){

        if (typeof window === 'undefined') return true;

        let indexedDB = window.indexedDB ||
            window.mozIndexedDB ||
            window.webkitIndexedDB ||
            window.msIndexedDB;

        if (indexedDB) {
            this._emitter.emit("validation/status", {result: true, message: "IndexedDB is available"})
            return true;
        }
        else {
            this._emitter.emit("validation/status", {result: false, message: "IndexedDB is not supported"})
            return false;
        }

    }


    async _validatePouchDB(){

        if (await this.testPounchDB("validateDB"))
            await this.testPounchDB("defaultDB");

    }

    async testPounchDB(dbName){

        try{
            let db = new InterfaceSatoshminDB(dbName);

            let number = Math.floor(Math.random()*10000000).toString();

            await db.save("validate_test", number, 5000);
            let number2 = await db.get("validate_test", 5000);

            if (number != number2 || number === null || number2 === null){
                throw (number === null ? 'null' : number.toString())+" !== "+ (number2 === null ? 'null' : number2.toString());
            } else {
                this._emitter.emit("validation/status", {result: true, message: "IndexedDB - PouchDB works", dbName: dbName});
                return true;
            }

        } catch (exception){
            this._emitter.emit("validation/status", {result: true, message: "IndexedDB - PouchDB doesn't work", dbName: dbName + exception.toString() });
            return false;
        }

    }

    _detectIncognito(){

        if (typeof window === "undefined") return true;

        let fs = window.RequestFileSystem || window.webkitRequestFileSystem;

        if (!fs) {
            console.error("_detectIncognito didn't work .. check failed?");
        } else {
            fs(window.TEMPORARY, 100,
                ()=>{
                    this._emitter.emit("validation/status", {result: true, message: "Not incognito mode"})
                },
                ()=>{
                    this._emitter.emit("validation/status", {result: false, message: "Incognito mode"})
                });
        }
    }

    waitSingleTab(waitCallback){

        if (typeof window === "undefined") return true;

        return DetectMultipleWindows.waitForSingleTabNow(waitCallback);
    }

}

export default ValidationsUtils;