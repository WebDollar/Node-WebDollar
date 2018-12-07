import * as express         from 'express'
import * as cors            from 'cors';
import * as basicAuth       from 'express-basic-auth';
import * as rateLimit       from 'express-rate-limit';
import {json as jsonParser} from 'body-parser';
import {defaults, omit, omitBy, isUndefined}   from 'lodash';
import Logger               from './../../common/utils/logging/Logger';

import {RpcMethodManager, fRpcServerMiddleware} from './../../jsonRpc';
import * as oMethods from './Methods';

const oLogger           = new Logger('JSON RPC Server');
const oRpcMethodManager = new RpcMethodManager;
oRpcMethodManager.addMethods(Object.values(oMethods));

const JsonRpcServer = (oConfig) => {

    // If the "serverConfig" property or the port is not defined, don`t start the JSON RPC Server
    if (typeof oConfig['serverConfig'] === 'undefined' || oConfig['serverConfig'].port === null)
    {
        return;
    }

    const app = express();
    app.use(cors({methods: ['POST']}));

    if (typeof oConfig['basicAuth'] !== "undefined" && oConfig.basicAuth.isEnabled)
    {
        app.use(basicAuth(omit(oConfig.basicAuth, ['isEnabled'])))
    }

    if (typeof oConfig['rateLimit'] !== "undefined" && oConfig.rateLimit.isEnabled)
    {
        app.use(rateLimit(omit(oConfig.rateLimit, ['isEnabled'])));
    }

    app.use(jsonParser());
    app.use(fRpcServerMiddleware(oRpcMethodManager, oConfig.basicAuth.isEnabled));

    if (typeof oConfig['serverConfig'] === 'undefined')
    {
        return;
    }

    const oServerConfig = defaults(omitBy(oConfig['serverConfig'], isUndefined), {
        host: '127.0.0.1' // By default listen only on localhost
    });

    oLogger.info('Starting JSON RPC server on ' + oServerConfig.host + ':' + oServerConfig.port);
    app.listen(oServerConfig);
};

export {
    JsonRpcServer,
    oRpcMethodManager
}
