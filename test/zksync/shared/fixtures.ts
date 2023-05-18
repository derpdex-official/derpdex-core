import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import { MockTimeUniswapV3Pool } from '../../../typechain/MockTimeUniswapV3Pool'
import { TestERC20 } from '../../../typechain/TestERC20'
import { UniswapV3Factory } from '../../../typechain/UniswapV3Factory'
import { TestUniswapV3Callee } from '../../../typechain/TestUniswapV3Callee'
import { TestUniswapV3Router } from '../../../typechain/TestUniswapV3Router'
import { MockTimeUniswapV3PoolDeployer } from '../../../typechain/MockTimeUniswapV3PoolDeployer'
import { utils, Wallet, Provider, Contract, Web3Provider } from "zksync-web3";
import * as zk from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Fixture } from 'ethereum-waffle'
import * as hre from 'hardhat'

interface FactoryFixture {
    factory: UniswapV3Factory
}

function getWallet() {
    let pk = process.env.pk || ""
    // const provider = Provider.getDefaultProvider();
    return new Wallet(pk);
}

async function getDeployer() {
    const wallet = getWallet()
    const deployer = new Deployer(hre, wallet);
    const depositAmount = ethers.utils.parseEther("0.001");
    // console.log("deployer.zkWallet", deployer.zkWallet)
    const depositHandle = await deployer.zkWallet.deposit({
        to: deployer.zkWallet.address,
        token: utils.ETH_ADDRESS,
        amount: depositAmount,
    });
    await depositHandle.wait()

    return deployer
}

async function factoryFixture(): Promise<FactoryFixture> {
    //   const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
    //   const factory = (await factoryFactory.deploy()) as UniswapV3Factory
    //   return { factory }
    const deployer = await getDeployer()
    const factoryFactory = await deployer.loadArtifact("UniswapV3Factory")
    const factory = (await deployer.deploy(factoryFactory, [])) as UniswapV3Factory;
    return { factory }
}

interface TokensFixture {
    token0: TestERC20
    token1: TestERC20
    token2: TestERC20
}

async function tokensFixture(): Promise<TokensFixture> {
    const deployer = await getDeployer()
    const tokenFactory = await deployer.loadArtifact("TestERC20")
    const tokenA = (await deployer.deploy(tokenFactory, [BigNumber.from(2).pow(255)])) as TestERC20
    const tokenB = (await deployer.deploy(tokenFactory, [BigNumber.from(2).pow(255)])) as TestERC20
    const tokenC = (await deployer.deploy(tokenFactory, [BigNumber.from(2).pow(255)])) as TestERC20

    const [token0, token1, token2] = [tokenA, tokenB, tokenC].sort((tokenA, tokenB) =>
        tokenA.address.toLowerCase() < tokenB.address.toLowerCase() ? -1 : 1
    )

    return { token0, token1, token2 }
}

type TokensAndFactoryFixture = FactoryFixture & TokensFixture

interface PoolFixture extends TokensAndFactoryFixture {
    swapTargetCallee: TestUniswapV3Callee
    swapTargetRouter: TestUniswapV3Router
    createPool(
        fee: number,
        tickSpacing: number,
        firstToken?: TestERC20,
        secondToken?: TestERC20
    ): Promise<MockTimeUniswapV3Pool>
}

// Monday, October 5, 2020 9:00:00 AM GMT-05:00
export const TEST_POOL_START_TIME = 1601906400

export const poolFixture: Fixture<PoolFixture> = async function (): Promise<PoolFixture> {
    const { factory } = await factoryFixture()
    const { token0, token1, token2 } = await tokensFixture()

    const deployer = await getDeployer()
    const MockTimeUniswapV3PoolDeployerFactory = await deployer.loadArtifact("MockTimeUniswapV3PoolDeployer")
    const MockTimeUniswapV3PoolFactory = await deployer.loadArtifact("MockTimeUniswapV3Pool")

    // const MockTimeUniswapV3PoolDeployerFactory = await ethers.getContractFactory('MockTimeUniswapV3PoolDeployer')
    // const MockTimeUniswapV3PoolFactory = await ethers.getContractFactory('MockTimeUniswapV3Pool')

    // const calleeContractFactory = await ethers.getContractFactory('TestUniswapV3Callee')
    // const routerContractFactory = await ethers.getContractFactory('TestUniswapV3Router')
    const calleeContractFactory = await deployer.loadArtifact("TestUniswapV3Callee")
    const routerContractFactory = await deployer.loadArtifact("TestUniswapV3Router")


    // const swapTargetCallee = (await calleeContractFactory.deploy()) as TestUniswapV3Callee
    // const swapTargetRouter = (await routerContractFactory.deploy()) as TestUniswapV3Router

    const swapTargetCallee = (await deployer.deploy(calleeContractFactory, [])) as TestUniswapV3Callee;
    const swapTargetRouter = (await deployer.deploy(routerContractFactory, [])) as TestUniswapV3Router;

    return {
        token0,
        token1,
        token2,
        factory,
        swapTargetCallee,
        swapTargetRouter,
        createPool: async (fee, tickSpacing, firstToken = token0, secondToken = token1) => {
            // const mockTimePoolDeployer = (await MockTimeUniswapV3PoolDeployerFactory.deploy()) as MockTimeUniswapV3PoolDeployer
            const mockTimePoolDeployer = (await deployer.deploy(MockTimeUniswapV3PoolDeployerFactory, [])) as MockTimeUniswapV3PoolDeployer;
            const tx = await mockTimePoolDeployer.deploy(
                factory.address,
                firstToken.address,
                secondToken.address,
                fee,
                tickSpacing
            )

            const receipt = await tx.wait()
            // console.log(receipt)
            const poolAddress = receipt.events?.[2].args?.pool as string
            return new zk.Contract(poolAddress, MockTimeUniswapV3PoolFactory.abi) as MockTimeUniswapV3Pool
            // return MockTimeUniswapV3PoolFactory.attach(poolAddress) as MockTimeUniswapV3Pool
        },
    }
}
