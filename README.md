# Core Contracts
This repository contains the core smart contracts for the DerpDEX Protocol. For higher level contracts, see the [derpdex-periphery](https://github.com/derpdex-official/derpdex-periphery) repository.

## Bug bounty
This repository is subject to the DerpDEX bug bounty program, per the terms defined [here](bug-bounty.md).

## Addresses

| Contract | Testnet | Mainnet |
| --- | --- | --- |
| `Factory` | [`0x9C260E394a96BB3E6836dAE8B9f2075D0b128e83`](https://goerli.explorer.zksync.io/address/0x9C260E394a96BB3E6836dAE8B9f2075D0b128e83) | [`0x52A1865eb6903BC777A02Ae93159105015CA1517`](https://explorer.zksync.io/address/0x52A1865eb6903BC777A02Ae93159105015CA1517) |

## Deploy

The `NODE_ENV` env variable is used to select between the 3 zksync networks(local, testnet, mainnet).

### Deploy to mainnet
``` sh
$ export NODE_ENV=mainnet
$ yarn hardhat compile && yarn hardhat deploy-zksync --script deploy/deploy.ts
```

### Deploy to testnet
``` sh
$ NODE_ENV=testnet yarn hardhat compile && NODE_ENV=testnet yarn hardhat deploy-zksync --script deploy/deploy.ts 
```

## Manual Verification
``` sh
$ yarn hardhat verify --network zkSyncNetwork CONTRACT_ADDRESS CONSTRUCTOR_PARAMS 
```

### To check verification Status
``` sh
$ yarn hardhat verify-status --verification-id VERIFICATION_ID
```
