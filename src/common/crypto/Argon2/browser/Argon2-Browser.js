const argon2 = require('argon2-browser');

class Argon2Browser{

    async hash(data, salt){

        try{

            return await argon2.argon2Hash({ pass: data, salt: salt});

        } catch (Exception){
            console.log("Argon2 exception", Exception.message, Exception.code)

            throw Exception
        }

    }

    async verify(){

    }

}

export default Argon2Browser