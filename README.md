# Core Contracts

## Addresses

| Contract | Testnet | Mainnet |
| --- | --- | --- |
| `Factory` | [`0x9C260E394a96BB3E6836dAE8B9f2075D0b128e83`](https://goerli.explorer.zksync.io/address/0x9C260E394a96BB3E6836dAE8B9f2075D0b128e83) | - |
| `USDC` | [`0x46caA59e33FEb040442CC9722922260cBdDb3F6F`](https://goerli.explorer.zksync.io/address/0x46caA59e33FEb040442CC9722922260cBdDb3F6F) | - |
| `WBTC` | [`0xE6E3854A3dF24043890BB5376DEbFA178C56a011`](https://goerli.explorer.zksync.io/address/0xE6E3854A3dF24043890BB5376DEbFA178C56a011) | - |

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