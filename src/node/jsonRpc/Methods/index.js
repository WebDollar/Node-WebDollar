import {oAddressBalanceProvider, oBlockRepository, oTransactionRepository, oBlockTransformer, oTransactionTransformer} from './../Utils';
import Blockchain from './../../../main-blockchain/Blockchain';
import NodesList  from './../../../node/lists/Nodes-List';

/**
 * METHODS
 */
import Accounts                            from './Accounts';
import BlockNumber                         from './BlockNumber';
import GetBalance                          from './GetBalance';
import GetBlockByHash                      from './GetBlockByHash';
import GetBlockByNumber                    from './GetBlockByNumber';
import GetBlockCount                       from './GetBlockCount';
import GetBlocksByNumbers                  from './GetBlocksByNumbers';
import GetBlocksByRange                    from './GetBlocksByRange';
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
const oGetBlockByHash                      = new GetBlockByHash('getBlockByHash', oBlockRepository, oBlockTransformer);
const oGetBlockByNumber                    = new GetBlockByNumber('getBlockByNumber', oBlockRepository, oBlockTransformer);
const oGetBlockCount                       = new GetBlockCount('getBlockCount', oBlockRepository);
const oGetBlocksByNumbers                  = new GetBlocksByNumbers('getBlocksByNumbers', oBlockRepository, oBlockTransformer);
const oGetBlocksByRange                    = new GetBlocksByRange('getBlocksByRange', oBlockRepository, oBlockTransformer);
const oGetBlockTransactionCountByHash      = new GetBlockTransactionCountByHash('getBlockTransactionCountByHash', oTransactionRepository);
const oGetBlockTransactionCountByNumber    = new GetBlockTransactionCountByNumber('getBlockTransactionCountByNumber', oTransactionRepository);
const oGetTransactionByBlockHashAndIndex   = new GetTransactionByBlockHashAndIndex('getTransactionByBlockHashAndIndex', oBlockRepository, oTransactionRepository, oTransactionTransformer);
const oGetTransactionByBlockNumberAndIndex = new GetTransactionByBlockNumberAndIndex('getTransactionByBlockNumberAndIndex', oBlockRepository, oTransactionRepository, oTransactionTransformer);
const oGetTransactionByHash                = new GetTransactionByHash('getTransactionByHash');
const oGetTransactionCount                 = new GetTransactionCount('getTransactionCount');
const oNetworkHashRate                     = new NetworkHashRate('networkHashRate', Blockchain.blockchain);
const oPeerCount                           = new PeerCount('peerCount', NodesList);
const oProtocolVersion                     = new ProtocolVersion('protocolVersion');
const oSyncing                             = new Syncing('syncing', Blockchain.blockchain);
const oSendRawTransaction                  = new SendRawTransaction('sendRawTransaction', Blockchain.Transactions, oSyncing);
const oSendTransaction                     = new SendTransaction('sendTransaction', Blockchain.Transactions, Blockchain.Wallet, oSyncing);

export {
    oAccounts,
    oGetBalance,
    oBlockNumber,
    oGetBlockByHash,
    oGetBlockByNumber,
    oGetBlockCount,
    oGetBlocksByNumbers,
    oGetBlocksByRange,
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
};
