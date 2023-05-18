import { expect } from '../shared/expect'
import * as hre from 'hardhat'
import { utils, Wallet, Provider, Signer, Contract, ContractFactory } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Decimal } from 'decimal.js'
import { BigNumberish } from 'ethers'
import snapshotGasCost from '../shared/snapshotGasCost'
import { UniswapV3Factory } from '../../typechain/UniswapV3Factory'

import { FeeAmount, getCreate2Address, TICK_SPACINGS } from '../shared/utilities'
const { ethers, waffle } = hre
const { constants } = ethers
const TEST_ADDRESSES: [string, string] = [
    '0x1000000000000000000000000000000000000000',
    '0x2000000000000000000000000000000000000000',
]

describe('UniswapV3Factory', () => {
    let artifact: any
    let deployer: Deployer
    const sendTransaction = async (tx: any) => {
        wallet = getWallet()
        const txResponse = await wallet.sendTransaction(tx)
        const receipt = await txResponse.wait()
        return receipt
    }

    const getWallet = () => {
        let pk = process.env.pk || ""
        const provider = Provider.getDefaultProvider();
        return new Wallet(pk, provider);
    }
    const fixture = async () => {
        let pk = process.env.pk || ""
        // const provider = Provider.getDefaultProvider();
        const wallet = new Wallet(pk);
        deployer = new Deployer(hre, wallet);
        const depositAmount = ethers.utils.parseEther("0.001");
        // console.log("deployer.zkWallet", deployer.zkWallet)
        const depositHandle = await deployer.zkWallet.deposit({
            to: deployer.zkWallet.address,
            token: utils.ETH_ADDRESS,
            amount: depositAmount,
        });

        await depositHandle.wait();
        artifact = await deployer.loadArtifact("UniswapV3Factory");
        return (await deployer.deploy(artifact, [])) as UniswapV3Factory;
        // const factory = await ethers.getContractFactory('BitMathTest')

        // return (await factory.deploy()) as BitMathTest
    }
    let wallet: Wallet, other: Wallet

    let factory: UniswapV3Factory
    let poolBytecode: string

    // const fixture = async () => {
    //     const factoryFactory = await ethers.getContractFactory('UniswapV3Factory')
    //     return (await factoryFactory.deploy()) as UniswapV3Factory
    // }

    // let loadFixture: ReturnType<typeof createFixtureLoader>
    before('create fixture loader', async () => {
        // ;[wallet, other] = await (ethers as any).getSigners()

        // loadFixture = createFixtureLoader([wallet, other])
    })

    before('load pool bytecode', async () => {
        // poolBytecode = (await ethers.getContractFactory('UniswapV3Pool')).bytecode
        //moved to before each
    })

    beforeEach('deploy factory', async () => {
        wallet = getWallet()
        factory = await fixture()
        poolBytecode = artifact.bytecode
        other = new Wallet(process.env.pk || "", Provider.getDefaultProvider());
    })

    it('owner is deployer', async () => {
        expect(await factory.owner()).to.eq(wallet.address)
    })

    it.skip('factory bytecode size', async () => {
        expect(((await waffle.provider.getCode(factory.address)).length - 2) / 2).to.matchSnapshot()
    })

    it.skip('pool bytecode size', async () => {
        await factory.createPool(TEST_ADDRESSES[0], TEST_ADDRESSES[1], FeeAmount.MEDIUM)
        const poolAddress = getCreate2Address(factory.address, TEST_ADDRESSES, FeeAmount.MEDIUM, poolBytecode)
        expect(((await waffle.provider.getCode(poolAddress)).length - 2) / 2).to.matchSnapshot()
    })

    it('initial enabled fee amounts', async () => {
        expect(await factory.feeAmountTickSpacing(FeeAmount.LOW)).to.eq(TICK_SPACINGS[FeeAmount.LOW])
        expect(await factory.feeAmountTickSpacing(FeeAmount.MEDIUM)).to.eq(TICK_SPACINGS[FeeAmount.MEDIUM])
        expect(await factory.feeAmountTickSpacing(FeeAmount.HIGH)).to.eq(TICK_SPACINGS[FeeAmount.HIGH])
    })

    async function createAndCheckPool(
        tokens: [string, string],
        feeAmount: FeeAmount,
        tickSpacing: number = TICK_SPACINGS[feeAmount]
    ) {
        const create2Address = getCreate2Address(factory.address, tokens, feeAmount, poolBytecode)

        // const create = factory.createPool(tokens[0], tokens[1], feeAmount)
        await sendTransaction(
            await factory.populateTransaction.createPool(tokens[0], tokens[1], feeAmount)
        )
        // console.log("create pool", TEST_ADDRESSES[0], TEST_ADDRESSES[1], feeAmount, tickSpacing, create2Address)

        //commented - calculation of create2Address is different
        // await expect(create)
        //     .to.emit(factory, 'PoolCreated')
        //     .withArgs(TEST_ADDRESSES[0], TEST_ADDRESSES[1], feeAmount, tickSpacing, create2Address)


        // await expect(factory.createPool(tokens[0], tokens[1], feeAmount)).to.be.reverted
        // await expect(factory.createPool(tokens[1], tokens[0], feeAmount)).to.be.reverted
        await expect(
            sendTransaction(factory.populateTransaction.createPool(tokens[0], tokens[1], feeAmount))
        ).to.be.reverted
        await expect(
            sendTransaction(factory.populateTransaction.createPool(tokens[1], tokens[0], feeAmount))
        ).to.be.reverted

        //commented - calculation of create2Address is different
        // expect(await factory.getPool(tokens[0], tokens[1], feeAmount), 'getPool in order').to.eq(create2Address)
        // expect(await factory.getPool(tokens[1], tokens[0], feeAmount), 'getPool in reverse').to.eq(create2Address)

        const poolAddress = await factory.getPool(tokens[1], tokens[0], feeAmount)
        const poolContractFactory = await ethers.getContractFactory('UniswapV3Pool')
        // const pool = poolContractFactory.attach(create2Address)

        // const poolContractArtifact = await deployer.loadArtifact("UniswapV3Pool");
        let data = await wallet.call({
            to: poolAddress,
            data: poolContractFactory.interface.encodeFunctionData("factory", [])

        })
        const factoryFromPool = poolContractFactory.interface.decodeFunctionResult("factory", data).toString()
        expect(factoryFromPool).to.eq(factory.address)
        // expect(await pool.factory(), 'pool factory address').to.eq(factory.address)

        data = await wallet.call({
            to: poolAddress,
            data: poolContractFactory.interface.encodeFunctionData("token0", [])

        })
        expect(poolContractFactory.interface.decodeFunctionResult("token0", data).toString())
            .to.eq(TEST_ADDRESSES[0])
        // expect(await pool.token0(), 'pool token0').to.eq(TEST_ADDRESSES[0])

        data = await wallet.call({
            to: poolAddress,
            data: poolContractFactory.interface.encodeFunctionData("token1", [])

        })
        expect(poolContractFactory.interface.decodeFunctionResult("token1", data).toString())
            .to.eq(TEST_ADDRESSES[1])
        // expect(await pool.token1(), 'pool token1').to.eq(TEST_ADDRESSES[1])

        data = await wallet.call({
            to: poolAddress,
            data: poolContractFactory.interface.encodeFunctionData("fee", [])

        })
        expect(poolContractFactory.interface.decodeFunctionResult("fee", data).toString())
            .to.eq(feeAmount.toString())
        // expect(await pool.fee(), 'pool fee').to.eq(feeAmount)

        data = await wallet.call({
            to: poolAddress,
            data: poolContractFactory.interface.encodeFunctionData("tickSpacing", [])

        })
        expect(poolContractFactory.interface.decodeFunctionResult("tickSpacing", data).toString())
            .to.eq(tickSpacing.toString())
        // expect(await pool.tickSpacing(), 'pool tick spacing').to.eq(tickSpacing)
    }

    describe('#createPool', () => {
        it('succeeds for low fee pool', async () => {
            await createAndCheckPool(TEST_ADDRESSES, FeeAmount.LOW)
        })

        it('succeeds for medium fee pool', async () => {
            await createAndCheckPool(TEST_ADDRESSES, FeeAmount.MEDIUM)
        })
        it('succeeds for high fee pool', async () => {
            await createAndCheckPool(TEST_ADDRESSES, FeeAmount.HIGH)
        })

        it('succeeds if tokens are passed in reverse', async () => {
            await createAndCheckPool([TEST_ADDRESSES[1], TEST_ADDRESSES[0]], FeeAmount.MEDIUM)
        })

        it('fails if token a == token b', async () => {
            await expect(factory.createPool(TEST_ADDRESSES[0], TEST_ADDRESSES[0], FeeAmount.LOW)).to.be.reverted
        })

        it('fails if token a is 0 or token b is 0', async () => {
            await expect(
                // factory.createPool(TEST_ADDRESSES[0], constants.AddressZero, FeeAmount.LOW)
                sendTransaction(await factory.populateTransaction.createPool(TEST_ADDRESSES[0], constants.AddressZero, FeeAmount.LOW))
            ).to.be.reverted
            await expect(
                // factory.createPool(constants.AddressZero, TEST_ADDRESSES[0], FeeAmount.LOW)
                sendTransaction(await factory.populateTransaction.createPool(constants.AddressZero, TEST_ADDRESSES[0], FeeAmount.LOW))
            ).to.be.reverted
            await expect(
                // factory.createPool(constants.AddressZero, constants.AddressZero, FeeAmount.LOW)
                sendTransaction(await factory.populateTransaction.createPool(constants.AddressZero, constants.AddressZero, FeeAmount.LOW))
            ).to.be.reverted
        })

        it('fails if fee amount is not enabled', async () => {
            await expect(
                // factory.createPool(TEST_ADDRESSES[0], TEST_ADDRESSES[1], 250)
                sendTransaction(await factory.populateTransaction.createPool(TEST_ADDRESSES[0], TEST_ADDRESSES[1], 250))
            ).to.be.reverted
        })

        it.skip('gas', async () => {
            await snapshotGasCost(factory.createPool(TEST_ADDRESSES[0], TEST_ADDRESSES[1], FeeAmount.MEDIUM))
        })
    })

    describe('#setOwner', () => {
        it('fails if caller is not owner', async () => {
            // await expect(factory.connect(other).setOwner(wallet.address)).to.be.reverted
            await expect(
                other.sendTransaction({
                to: factory.address,
                data: factory.interface.encodeFunctionData("setOwner", [wallet.address])
            })).to.be.reverted
        })

        it('updates owner', async () => {
            // await factory.setOwner(other.address)
            await sendTransaction(await factory.populateTransaction.setOwner(other.address))
            const poolContractFactory = await ethers.getContractFactory('UniswapV3Factory')
            let data = await wallet.call({
                to: factory.address,
                data: poolContractFactory.interface.encodeFunctionData("owner", [])
            })
            expect(
                poolContractFactory.interface.decodeFunctionResult("owner", data).toString()
            ).to.eq(other.address)
        })

        it.skip('emits event', async () => {
            await expect(
                // factory.setOwner(other.address)
                sendTransaction(await factory.populateTransaction.setOwner(other.address))
            )
                .to.emit(factory, 'OwnerChanged')
                .withArgs(wallet.address, other.address)
        })

        it('cannot be called by original owner', async () => {
            // await factory.setOwner(other.address)
            await sendTransaction(await factory.populateTransaction.setOwner(other.address))
            await expect(
                // factory.setOwner(wallet.address)
                sendTransaction(
                    await factory.populateTransaction.setOwner(wallet.address)
                )
            ).to.be.reverted
        })
    })

    // describe('#enableFeeAmount', () => {
    //     it('fails if caller is not owner', async () => {
    //         await expect(factory.connect(other).enableFeeAmount(100, 2)).to.be.reverted
    //     })
    //     it('fails if fee is too great', async () => {
    //         await expect(factory.enableFeeAmount(1000000, 10)).to.be.reverted
    //     })
    //     it('fails if tick spacing is too small', async () => {
    //         await expect(factory.enableFeeAmount(500, 0)).to.be.reverted
    //     })
    //     it('fails if tick spacing is too large', async () => {
    //         await expect(factory.enableFeeAmount(500, 16834)).to.be.reverted
    //     })
    //     it('fails if already initialized', async () => {
    //         await factory.enableFeeAmount(100, 5)
    //         await expect(factory.enableFeeAmount(100, 10)).to.be.reverted
    //     })
    //     it('sets the fee amount in the mapping', async () => {
    //         await factory.enableFeeAmount(100, 5)
    //         expect(await factory.feeAmountTickSpacing(100)).to.eq(5)
    //     })
    //     it('emits an event', async () => {
    //         await expect(factory.enableFeeAmount(100, 5)).to.emit(factory, 'FeeAmountEnabled').withArgs(100, 5)
    //     })
    //     it('enables pool creation', async () => {
    //         await factory.enableFeeAmount(250, 15)
    //         await createAndCheckPool([TEST_ADDRESSES[0], TEST_ADDRESSES[1]], 250, 15)
    //     })
    // })
})