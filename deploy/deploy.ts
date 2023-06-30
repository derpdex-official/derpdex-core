import { utils, Wallet, Provider } from "zksync-web3";
import * as ethers from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";

export default async function (hre: HardhatRuntimeEnvironment) {
    // let pk = process.env.pk || ""
    // let pk = process.env.pk || "" //hardhat
    let pk_testnet = process.env.pk || "" 

    const provider = Provider.getDefaultProvider();

    // const wallet = new Wallet(pk, provider );
    const wallet = new Wallet(pk_testnet/* , provider */);
    const deployer = new Deployer(hre, wallet);
    // console.log(deployer)
    // const depositAmount = ethers.utils.parseEther("0.001");
    // const depositHandle = await deployer.zkWallet.deposit({
    //   to: deployer.zkWallet.address,
    //   token: utils.ETH_ADDRESS,
    //   amount: depositAmount,
    // });

    // await depositHandle.wait();

    const artifact = await deployer.loadArtifact("UniswapV3Factory");

    console.log("Deploying contract...");
    let factoryContract = await deployer.deploy(artifact, []);
    
    console.log('Waiting for 15 confirmations')
    await factoryContract.deployTransaction.wait(15)

    //@ts-ignore
    const contractAddress = factoryContract.address;
    console.log(`${artifact.contractName} was deployed to ${contractAddress}`);

    // const MockERC20Artifact = await deployer.loadArtifact("MockERC20")
    // const USDC = await deployer.deploy(MockERC20Artifact, ["USDC", "USDC", 6])
    // console.log("USDC address", USDC.address)

    // const WBTC = await deployer.deploy(MockERC20Artifact, ["WBTC", "WBTC", 8])
    // console.log("WBTC Address", WBTC.address)
    // //@ts-ignore
    // await factoryContract.createPool(USDC.address, WBTC.address, 3000)
    // console.log("Contract deployed");

    console.log("staring verification")
    console.log("verifying Factory")
    await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
    })
}