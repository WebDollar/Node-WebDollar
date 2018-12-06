import {oAddressBalanceProvider, oBlockFinder, oBlockTransformer, oTransactionTransformer} from "../Utils";
import Blockchain from "../../../main-blockchain/Blockchain";
import NodesList  from '../../../node/lists/Nodes-List';

/**
 * METHODS
 */
import Accounts                            from './Accounts';
import BlockNumber                         from './BlockNumber';
import GetBalance                          from './GetBalance';
import GetBlockByHash                      from './GetBlockByHash';
import GetBlockByNumber                    from './GetBlockByNumber';
import GetBlockTransactionCountByHash      from './GetBlockTransactionCountByHash';
import GetBlockTransactionCountByNumber    from './GetBlockTransactionCountByNumber';
import GetTransactionByBlockHashAndIndex   from './GetTransactionByBlockHashAndIndex';
import GetTransactionByBlockNumberAndIndex from './GetTransactionByBlockNumberAndIndex';
import GetTransactionByHash                from './GetTransactionByHash';
import GetTransactionCount                 from './GetTransactionCount';
import NetworkHashRate                     from './NetworkHashRate';
import PeerCount                           from './PeerCount';
import ProtocolVersion                     from './ProtocolVersion';
import SendRawTransaction                  from './SendRawTransaction';
import SendTransaction                     from './SendTransaction';
import Syncing                             from './Syncing';

const oAccounts                            = new Accounts('accounts', Blockchain.Wallet, oAddressBalanceProvider);
const oBlockNumber                         = new BlockNumber('blockNumber', Blockchain.blockchain);
const oGetBalance                          = new GetBalance('getBalance', oAddressBalanceProvider);
const oGetBlockByHash                      = new GetBlockByHash('getBlockByHash', oBlockFinder, oBlockTransformer);
const oGetBlockByNumber                    = new GetBlockByNumber('getBlockByNumber', oBlockFinder, oBlockTransformer);
const oGetBlockTransactionCountByHash      = new GetBlockTransactionCountByHash('getBlockTransactionCountByHash');
const oGetBlockTransactionCountByNumber    = new GetBlockTransactionCountByNumber('getBlockTransactionCountByNumber', oBlockFinder, Blockchain.Transactions.pendingQueue);
const oGetTransactionByBlockHashAndIndex   = new GetTransactionByBlockHashAndIndex('getTransactionByBlockHashAndIndex');
const oGetTransactionByBlockNumberAndIndex = new GetTransactionByBlockNumberAndIndex('getTransactionByBlockNumberAndIndex', oBlockFinder, oTransactionTransformer, Blockchain.Transactions.pendingQueue);
const oGetTransactionByHash                = new GetTransactionByHash('getTransactionByHash');
const oGetTransactionCount                 = new GetTransactionCount('getTransactionCount');
const oNetworkHashRate                     = new NetworkHashRate('networkHashRate', Blockchain.blockchain);
const oPeerCount                           = new PeerCount('peerCount', NodesList);
const oProtocolVersion                     = new ProtocolVersion('protocolVersion');
const oSendRawTransaction                  = new SendRawTransaction('sendRawTransaction');
const oSendTransaction                     = new SendTransaction('sendTransaction', Blockchain.Transactions);
const oSyncing                             = new Syncing('syncing', Blockchain.blockchain);

export {
    oAccounts,
    oGetBalance,
    oBlockNumber,
    oGetBlockByHash,
    oGetBlockByNumber,
    oGetBlockTransactionCountByHash,
    oGetBlockTransactionCountByNumber,
    oGetTransactionByBlockHashAndIndex,
    oGetTransactionByBlockNumberAndIndex,
    oGetTransactionByHash,
    oGetTransactionCount,
    oNetworkHashRate,
    oPeerCount,
    oProtocolVersion,
    oSendRawTransaction,
    oSendTransaction,
    oSyncing,
}
