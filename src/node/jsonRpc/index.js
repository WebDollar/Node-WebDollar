import * as express         from 'express'
import * as cors            from 'cors';
import * as basicAuth       from 'express-basic-auth'
import {json as jsonParser} from 'body-parser';

import {MethodManager, fRpcServerMiddleware} from '../../jsonRpc'
import * as oMethods from './Methods'

const oMethodManager = new MethodManager;
oMethodManager.addMethods(Object.values(oMethods));

const JsonRpcServer = (oConfig) => {
    const app = express();

    if (typeof oConfig['basicAuth'] !== 'undefined')
    {
        app.use(basicAuth({
            users: oConfig.basicAuth.users
        }));
    }

    app.use(cors({methods: ['POST']}));
    app.use(jsonParser());
    app.use(fRpcServerMiddleware(oMethodManager));

    app.listen({
        host: oConfig.host || '127.0.0.1', // By default listen only on localhost
        port: oConfig.port
    });
};

export {
    JsonRpcServer,
    oMethodManager
}
