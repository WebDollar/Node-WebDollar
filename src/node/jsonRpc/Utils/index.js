import AddressBalanceProvider      from './AddressBalanceProvider';
import Blockchain                  from './../../../main-blockchain/Blockchain';
import BlockRepository             from './BlockRepository';
import BlockTransformer            from './BlockTransformer';
import BlockDataHardForksProcessor from './BlockDataHardForksProcessor';
import TransactionRepository       from './TransactionRepository';
import TransactionTransformer      from './TransactionTransformer';

const oBlockRepository        = new BlockRepository(Blockchain.blockchain);
const oTransactionRepository  = new TransactionRepository(oBlockRepository, Blockchain.Transactions.pendingQueue);
const oTransactionTransformer = new TransactionTransformer();
const oBlockTransformer       = new BlockTransformer(BlockDataHardForksProcessor, oTransactionTransformer);
const oAddressBalanceProvider = new AddressBalanceProvider(Blockchain.blockchain.accountantTree);

export {
    oBlockRepository,
    oTransactionRepository,
    oBlockTransformer,
    oAddressBalanceProvider,
    oTransactionTransformer,
};
