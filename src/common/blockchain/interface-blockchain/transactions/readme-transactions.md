# Transactions and Pending Transactions

Transaction:

[from] => [to]

Transaction (from, to)

**from** is an an Object:

```
{
    addresses: [                                                             - Array of Addresses
            {
                unencodedAddress: Addr1,
                publicKey, 
                schnorrSignature
                amount
            }, 
            {   
                unencodedAddress: Addr2,
                schnorrSignature 
                amount
            }
            {
                unencodedAddress: Addr3,
                schnorrSignature
                amount
            }
        ], 
    currency: WEBD or Token   
}
```


**to** is an Object

```
{
    addresses: Array of Addresses & Amounts
        [ 
            { 
                unencodedAddress: Addr1, 
                amount: amount
            },
            { 
                unencodedAddress: Addr2, 
                amount: amount
            },    
        ]
}

```

The difference between **Sum(output) - Sum(input)** is the **fee** for the miner