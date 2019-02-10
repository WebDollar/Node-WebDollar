import * as express         from 'express';
import * as cors            from 'cors';
import * as basicAuth       from 'express-basic-auth';
import * as rateLimit       from 'express-rate-limit';
import {json as jsonParser} from 'body-parser';
import {defaults, omit, omitBy, isUndefined, isNil}   from 'lodash';
import Logger               from './../../common/utils/logging/Logger';

import {RpcMethodManager, fRpcServerMiddleware} from './../../jsonRpc';
import * as oMethods from './Methods';

const oLogger           = new Logger('JSON RPC Server');
const oRpcMethodManager = new RpcMethodManager;
oRpcMethodManager.addMethods(Object.values(oMethods));

const JsonRpcServer = (oConfig) => {

    // If the "serverConfig" property or the port is not defined, don`t start the JSON RPC Server
    if (isNil(oConfig['serverConfig']) || isNil(oConfig['serverConfig'].port))
    {
        return;
    }

    const app = express();
    app.use(cors({methods: ['POST']}));

    if (isNil(oConfig['basicAuth']) === false && oConfig.basicAuth.isEnabled)
    {
        app.use(basicAuth(omit(oConfig.basicAuth, ['isEnabled'])));
    }

    if (isNil(oConfig['rateLimit']) === false && oConfig.rateLimit.isEnabled)
    {
        app.use(rateLimit(omit(oConfig.rateLimit, ['isEnabled'])));
    }

    app.use(jsonParser());
    app.use(fRpcServerMiddleware(oRpcMethodManager, oConfig.basicAuth.isEnabled));

    const oServerConfig = defaults(omitBy(oConfig['serverConfig'], isUndefined), {
        host: '127.0.0.1' // By default listen only on localhost
    });

    oLogger.info('Starting JSON RPC server on ' + oServerConfig.host + ':' + oServerConfig.port);
    app.listen(oServerConfig);
};

export {
    JsonRpcServer,
    oRpcMethodManager
};
