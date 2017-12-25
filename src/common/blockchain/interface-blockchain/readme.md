# Interface-Blockchain

Interface Blockchain code executes a similar Blockchain code based on **Bitcoin Blockchain** without the SPV and Merkle Trees for Transactions.

The differences:

1. Transactions are stored in a hashed list SHA256 ( concatenation of transactions) and not in a Merkle Tree
2. Will not allow SPV for transactions