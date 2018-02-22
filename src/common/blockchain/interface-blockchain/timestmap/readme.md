https://en.bitcoin.it/wiki/Block_timestamp

"Whenever a node connects to another node, it gets a UTC timestamp from it, and stores its offset from node-local UTC." To me this is saying whenever node A connects to another node,lets call it Node B, Node A gets Node B's timestamp, and stores the offest (I believe from Node B) on their own Node A local time (their UTC timestamp).
 more in a moment
 
"The network-adjusted time is then the node-local UTC plus the median offset from all connected nodes."  So, the NAT is calculated as Node A's local UTC Timestamp plus the median offest from all the other nodes that are connected to them.