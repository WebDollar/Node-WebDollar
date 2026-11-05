// importLegacyBlocks.js
// Rulează acest script din D:/Webdollar_2026/Node-WebDollar/
// Va salva blocurile extrase în src/legacy_blocks.json

import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

import InterfaceSatoshminDB from './common/satoshmindb/Interface-SatoshminDB.js';
import InterfaceBlockchainBlock from './common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LEGACY_DB_PATH = path.resolve(__dirname, '../../blockchainDB3');
const OUTPUT_PATH = path.resolve(__dirname, './legacy_blocks.json');

async function extractBlocks() {
  const db = new InterfaceSatoshminDB(LEGACY_DB_PATH);
  const blocks = [];
  let height = 0;
  while (true) {
    const key = 'block' + height;
    try {
      const buffer = await db.get(key);
      if (!buffer) break;
      const block = new InterfaceBlockchainBlock();
      block.deserializeBlock(buffer, height);
      blocks.push(block.toJSON ? block.toJSON() : block);
      if (height % 100 === 0) console.log(`[DEBUG] Extras block${height}`);
      height++;
    } catch (e) {
      console.log(`[DEBUG] Stop la height=${height}, eroare sau sfârșit:`, e.message);
      break;
    }
  }
  try {
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(blocks, null, 2));
    console.log(`[INFO] Exportat ${blocks.length} blocuri în ${OUTPUT_PATH}`);
  } catch (err) {
    console.error('[EROARE SCRIERE]', err.message, 'PATH:', OUTPUT_PATH);
  }
}

extractBlocks();
