---
wip: 2
title: New RESTful endpoints for `Node-Express`
author: Razvan Ceana <webdollar@ceana.ro>
status: Draft
type: Standards Track
category: Interface
created: 2018-06-22
---

### Abstract

This WIP defines new API endpoints for interacting with a WebDollar node.

### Specification

Example of JSON RPC for WebDollar
https://github.com/ethereum/wiki/wiki/JSON-RPC

It will require:

1. Get a block formatted info by specifying a height. ( Ex: /blockHeight/1 )
2. Get multiple block heights formatted info, limited at maximum 50 entries. ( Ex: /blockHeights/1,2,3 )
3. Get multiple blocks formatted info starting with a specified height, limited at maximum 50 entries. ( Ex: /blocksStartingWithHeight/1 )


### Motivation

Ability to get a block`s information JSON formatted and human readable

### Rationale

TBA.

### Backwards Compatibility

The endpoint should all be new, so there are no backwards compatibility issues.

### Implementation

TBA.
