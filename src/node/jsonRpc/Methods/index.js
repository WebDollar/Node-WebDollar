import {oAddressBalanceProvider, oBlockFinder, oBlockTransformer, oTransactionTransformer} from "../Utils";
import Blockchain from "../../../main-blockchain/Blockchain";

/**
 * METHODS
 */
import BlockNumber                         from './BlockNumber'
import GetBlockByNumber                    from './GetBlockByNumber'
import GetBlockByHash                      from './GetBlockByHash'
import Accounts                            from './Accounts'
import GetBalance                          from './GetBalance'
import GetTransactionCount                 from './GetTransactionCount'
import GetTransactionCountByHash           from './GetBlockTransactionCountByHash'
import GetTransactionCountByNumber         from './GetBlockTransactionCountByNumber'
import GetTransactionByBlockHashAndIndex   from './GetTransactionByBlockHashAndIndex'
import GetTransactionByBlockNumberAndIndex from './GetTransactionByBlockNumberAndIndex'


const oBlockNumber                         = new BlockNumber('blockNumber');
const oGetBlockByNumber                    = new GetBlockByNumber('getBlockByNumber',                       {}, oBlockFinder, oBlockTransformer);
const oGetBlockByHash                      = new GetBlockByHash('getBlockByHash',                           {}, oBlockFinder, oBlockTransformer);
const oAccounts                            = new Accounts('accounts',                                       {}, Blockchain.Wallet, oAddressBalanceProvider);
const oGetBalance                          = new GetBalance('getBalance',                                   {}, Blockchain.Wallet, oAddressBalanceProvider);
const oGetTransactionCount                 = new GetTransactionCount('getTransactionCount',                 {});
const oGetTransactionCountByHash           = new GetTransactionCountByHash('getTransactionCountByHash',     {}, oBlockFinder);
const oGetTransactionCountByNumber         = new GetTransactionCountByNumber('getTransactionCountByNumber', {}, oBlockFinder);
const oGetTransactionByBlockHashAndIndex   = new GetTransactionByBlockHashAndIndex('getTransactionByBlockHashAndIndex', {});
const oGetTransactionByBlockNumberAndIndex = new GetTransactionByBlockNumberAndIndex('getTransactionByBlockNumberAndIndex', {}, oBlockFinder, oTransactionTransformer);

export {
    oBlockNumber,
    oGetBlockByNumber,
    oGetBlockByHash,
    oAccounts,
    oGetBalance,
    oGetTransactionCount,
    oGetTransactionCountByHash,
    oGetTransactionCountByNumber,
    oGetTransactionByBlockHashAndIndex,
    oGetTransactionByBlockNumberAndIndex,
}
