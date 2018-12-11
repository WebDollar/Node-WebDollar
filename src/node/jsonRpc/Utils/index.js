import BlockFinder from './BlockFinder';
import BlockTransformer from './BlockTransformer'
import TransactionTransformer from './TransactionTransformer';
import Blockchain from './../../../main-blockchain/Blockchain';
import BlockDataHardForksProcessor from './BlockDataHardForksProcessor';
import AddressBalanceProvider from './AddressBalanceProvider';

const oBlockFinder            = new BlockFinder(Blockchain.blockchain);
const oTransactionTransformer = new TransactionTransformer();
const oBlockTransformer       = new BlockTransformer(BlockDataHardForksProcessor, oTransactionTransformer);
const oAddressBalanceProvider = new AddressBalanceProvider(Blockchain.blockchain.accountantTree);

export {oBlockFinder, oBlockTransformer, oAddressBalanceProvider, oTransactionTransformer};
