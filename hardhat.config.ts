import * as dotenv from 'dotenv'
import 'hardhat-typechain'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import 'hardhat-deploy'
import "@matterlabs/hardhat-zksync-verify";
dotenv.config()

const zkSyncNetwork = (() => {
  if (process.env.NODE_ENV == "local") {
    return {
      url: "http://localhost:3050",
      ethNetwork: "http://localhost:8545",
      // ethNetwork: "http://localhost:8646",
      zksync: true,
    }
  } else if (process.env.NODE_ENV == "testnet") {
    return {
      url: "https://testnet.era.zksync.dev",
      // ethNetwork: "goerli",
      ethNetwork: process.env.goerli_rpc,
      zksync: true,
      verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification'
    }
  } else if(process.env.NODE_ENV == "mainnet") {
    return {
      url: process.env.ZKSYNC_MAINNET_RPC,
      ethNetwork: process.env.mainnet_rpc,
      zksync: true,
      verifyURL: process.env.ZKSYNC_MAINNET_VERIFY_URL
    }
  } else {
    throw new Error("Please use one of the following NODE_ENV (local, testnet, mainnet)")
  }
}) ()

export default {
  mocha: {
    timeout: "1000000000000"
  },
  zksolc: {
    version: "1.3.5",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncNetwork",

  networks: {
    // zkTestnet: {
    //   url: "https://testnet.era.zksync.dev", // URL of the zkSync network RPC
    //   ethNetwork: process.env.mainnet_rpc
    //   zksync: true,
    // },
    zkSyncNetwork,
    hardhat: {
      allowUnlimitedContractSize: false,
      zksync: true,
      // forking: {
      // url: process.env.mainnet_rpc
      // }
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    arbitrumRinkeby: {
      url: `https://arbitrum-rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    arbitrum: {
      url: `https://arbitrum-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    optimismKovan: {
      url: `https://optimism-kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    optimism: {
      url: `https://optimism-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    polygon: {
      url: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    },
    bnb: {
      url: `https://bsc-dataseed.binance.org/`,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    compilers: [
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 800,
          },
          metadata: {
            // do not include the metadata hash, since this is machine dependent
            // and we want all generated code to be deterministic
            // https://docs.soliditylang.org/en/v0.7.6/metadata.html
            bytecodeHash: 'none',
          },
        },
      },
    ],
    // overrides: {
    //   "contracts/test/MockERC20.sol": {
    //     version: "0.8.13",
    //   }
    // }
  },
}
