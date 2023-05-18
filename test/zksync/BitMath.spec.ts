import { expect } from '../shared/expect'
import { BitMathTest } from '../../typechain/BitMathTest'
// import { ethers, waffle } from 'hardhat'
import * as hre from 'hardhat'
import snapshotGasCost from '../shared/snapshotGasCost'
import { utils, Wallet, Provider } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";


const { ethers, waffle } = hre
const { BigNumber } = ethers

describe('BitMath', () => {
    let bitMath: any
    const fixture = async () => {
        let pk = process.env.pk || ""
        // const provider = Provider.getDefaultProvider();
        const wallet = new Wallet(pk);
        const deployer = new Deployer(hre, wallet);
        const depositAmount = ethers.utils.parseEther("0.001");
        // console.log("deployer.zkWallet", deployer.zkWallet)
        const depositHandle = await deployer.zkWallet.deposit({
            to: deployer.zkWallet.address,
            token: utils.ETH_ADDRESS,
            amount: depositAmount,
        });

        await depositHandle.wait();
        const artifact = await deployer.loadArtifact("BitMathTest");
        return (await deployer.deploy(artifact, [])) as BitMathTest;
        // const factory = await ethers.getContractFactory('BitMathTest')

        // return (await factory.deploy()) as BitMathTest
    }
    beforeEach('deploy BitMathTest', async () => {
        // bitMath = await waffle.loadFixture(fixture)
        bitMath = await fixture()
        console.log("bitMath.address", bitMath.address, bitMath)
    })

    describe('#mostSignificantBit', () => {
        it('0', async () => {
            await expect(bitMath.mostSignificantBit(0)).to.be.reverted
        })
        it('1', async () => {
            expect(await bitMath.mostSignificantBit(1)).to.eq(0)
        })
        it('2', async () => {
            expect(await bitMath.mostSignificantBit(2)).to.eq(1)
        })
        it('all powers of 2', async () => {
            const results = await Promise.all(
                [...Array(255)].map((_, i) => bitMath.mostSignificantBit(BigNumber.from(2).pow(i)))
            )
            expect(results).to.deep.eq([...Array(255)].map((_, i) => i))
        })
        it('uint256(-1)', async () => {
            expect(await bitMath.mostSignificantBit(BigNumber.from(2).pow(256).sub(1))).to.eq(255)
        })

        it('gas cost of smaller number', async () => {
            await snapshotGasCost(bitMath.getGasCostOfMostSignificantBit(BigNumber.from(3568)))
        })
        it('gas cost of max uint128', async () => {
            await snapshotGasCost(bitMath.getGasCostOfMostSignificantBit(BigNumber.from(2).pow(128).sub(1)))
        })
        it('gas cost of max uint256', async () => {
            await snapshotGasCost(bitMath.getGasCostOfMostSignificantBit(BigNumber.from(2).pow(256).sub(1)))
        })
    })

    describe('#leastSignificantBit', () => {
        it('0', async () => {
            await expect(bitMath.leastSignificantBit(0)).to.be.reverted
        })
        it('1', async () => {
            expect(await bitMath.leastSignificantBit(1)).to.eq(0)
        })
        it('2', async () => {
            expect(await bitMath.leastSignificantBit(2)).to.eq(1)
        })
        it('all powers of 2', async () => {
            const results = await Promise.all(
                [...Array(255)].map((_, i) => bitMath.leastSignificantBit(BigNumber.from(2).pow(i)))
            )
            expect(results).to.deep.eq([...Array(255)].map((_, i) => i))
        })
        it('uint256(-1)', async () => {
            expect(await bitMath.leastSignificantBit(BigNumber.from(2).pow(256).sub(1))).to.eq(0)
        })

        it('gas cost of smaller number', async () => {
            await snapshotGasCost(bitMath.getGasCostOfLeastSignificantBit(BigNumber.from(3568)))
        })
        it('gas cost of max uint128', async () => {
            await snapshotGasCost(bitMath.getGasCostOfLeastSignificantBit(BigNumber.from(2).pow(128).sub(1)))
        })
        it('gas cost of max uint256', async () => {
            await snapshotGasCost(bitMath.getGasCostOfLeastSignificantBit(BigNumber.from(2).pow(256).sub(1)))
        })
    })
})
