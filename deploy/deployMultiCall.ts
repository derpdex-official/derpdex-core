import { utils, Wallet, Provider } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
    // let pk = process.env.pk || ""
    // let pk = process.env.pk || "" //hardhat
    let pk_testnet = process.env.pk || "" 

    const provider = Provider.getDefaultProvider();

    const wallet = new Wallet(pk_testnet/* , provider */);
    const deployer = new Deployer(hre, wallet);

    const artifact = await deployer.loadArtifact("UniswapInterfaceMulticall");

    console.log("Deploying contract...");
    let factoryContract = await deployer.deploy(artifact, []);

    //@ts-ignore
    const contractAddress = factoryContract.address;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

}