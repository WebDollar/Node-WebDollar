# Transactions and Pending Transactions

Transaction:

from => to

Transaction (from, to)

**from** is an an Object:

```
{
    addresses: [Addr1, Addr2, Addr3], - Array of Addresses 
    currency: WEBD or Token   
}
```

Where Addr1, Addr2, Addr3 are objects
```       
{
    publicAddress
    publicKey, 
    digital signed          
}
```        

**to** is an Object

```
{
    addresses: Array of Addresses & Amounts
        [ { 
            publicAddress: Addr1, 
            amount: amount
          }, etc... 
        ]
        
    fee: { 
        amount: amount
        }    
        
        
}

```