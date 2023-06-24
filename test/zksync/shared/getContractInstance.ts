import { Provider, Wallet } from "zksync-web3"
import { Deployer } from "@matterlabs/hardhat-zksync-deploy"
import { PRIVATE_KEY } from "./constants"
import * as hre from "hardhat"

const getContractInstance = async (contractName: string, args?: any[]) => {
  const provider = Provider.getDefaultProvider()
  const wallet = new Wallet(PRIVATE_KEY, provider)
  const deployer = new Deployer(hre, wallet)
  const artifact = await deployer.loadArtifact(contractName)
  return await deployer.deploy(artifact, args)
}
export default getContractInstance