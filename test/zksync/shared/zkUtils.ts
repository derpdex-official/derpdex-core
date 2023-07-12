import { Provider, Wallet, Contract, ContractFactory } from "zksync-web3"
import { Deployer } from "@matterlabs/hardhat-zksync-deploy"
import { PRIVATE_KEY } from "./constants"
import * as hre from "hardhat"
import { utils } from "ethers"

const provider = Provider.getDefaultProvider()
const wallet = new Wallet(PRIVATE_KEY, provider)
const deployer = new Deployer(hre, wallet)

const getSigners = async (): Promise<Wallet[]> => {
  const wallets = [wallet]
  for (let i = 0; i < 3; i++) {
    const _wallet = Wallet.createRandom().connect(provider)
    const tx = await wallet.transfer({ to: _wallet.address, amount: utils.parseEther("1") })
    await tx.wait()
    wallets.push(_wallet)
  }
  return wallets
}

const getContractInstance = async (contractName: string, args?: any[]): Promise<Contract> => {
  const artifact = await deployer.loadArtifact(contractName)
  return await deployer.deploy(artifact, args)
}

const getContractFactory = async (contractName: string): Promise<ContractFactory> => {
  const artifact = await deployer.loadArtifact(contractName)
  return new ContractFactory(artifact.abi, artifact.bytecode, wallet)
}

const getContractAt = async (contractName: string, contractAddress: string): Promise<Contract> => {
  const factory = await getContractFactory(contractName)
  return factory.attach(contractAddress)
}

export {
  getSigners,
  getContractInstance,
  getContractFactory,
  getContractAt,
}
