import RpcServerMiddleware from './RpcServerMiddleware'
import Method   from './Method'
import MethodManager from './MethodManager'

const fRpcServerMiddleware = (oMethodManager) => {
    return (new RpcServerMiddleware(oMethodManager)).getMiddleware();
};

export {fRpcServerMiddleware, Method, MethodManager};
