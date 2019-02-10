import RpcServerMiddleware from './RpcServerMiddleware';
import RpcMethod           from './RpcMethod';
import RpcMethodManager    from './RpcMethodManager';
import authenticatedMethod from './authenticatedMethod';

const fRpcServerMiddleware = (oRpcMethodManager, bServerIsSecured) => {
    return (new RpcServerMiddleware(oRpcMethodManager)).getMiddleware(bServerIsSecured);
};

export {
    fRpcServerMiddleware,
    authenticatedMethod,
    RpcServerMiddleware,
    RpcMethod,
    RpcMethodManager
};
