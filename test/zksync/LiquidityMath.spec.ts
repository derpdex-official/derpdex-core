import { expect } from '../shared/expect'
import { LiquidityMathTest } from '../../typechain/LiquidityMathTest'
// import { ethers, waffle } from 'hardhat'
import * as hre from 'hardhat'
import snapshotGasCost from '../shared/snapshotGasCost'
import { utils, Wallet, Provider } from "zksync-web3";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import { Decimal } from 'decimal.js'

const { ethers, waffle } = hre
const { BigNumber, constants: { MaxUint256 }, } = ethers
const Q128 = BigNumber.from(2).pow(128)

Decimal.config({ toExpNeg: -500, toExpPos: 500 })

describe('BitMath', () => {
    let liquidityMath: any
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
        const artifact = await deployer.loadArtifact("LiquidityMathTest");
        return (await deployer.deploy(artifact, [])) as LiquidityMathTest;
        // const factory = await ethers.getContractFactory('BitMathTest')

        // return (await factory.deploy()) as BitMathTest
    }
    beforeEach('deploy LiquidityMathTest', async () => {
        // bitMath = await waffle.loadFixture(fixture)
        liquidityMath = await fixture()
        console.log("LiquidityMathTest.address", liquidityMath.address)
    })

    describe('#addDelta', () => {
        it('1 + 0', async () => {
          expect(await liquidityMath.addDelta(1, 0)).to.eq(1)
        })
        it('1 + -1', async () => {
          expect(await liquidityMath.addDelta(1, -1)).to.eq(0)
        })
        it('1 + 1', async () => {
          expect(await liquidityMath.addDelta(1, 1)).to.eq(2)
        })
        it('2**128-15 + 15 overflows', async () => {
          await expect(liquidityMath.addDelta(BigNumber.from(2).pow(128).sub(15), 15)).to.be.revertedWith('LA')
        })
        it('0 + -1 underflows', async () => {
          await expect(liquidityMath.addDelta(0, -1)).to.be.revertedWith('LS')
        })
        it('3 + -4 underflows', async () => {
          await expect(liquidityMath.addDelta(3, -4)).to.be.revertedWith('LS')
        })
        it('gas add', async () => {
          await snapshotGasCost(liquidityMath.getGasCostOfAddDelta(15, 4))
        })
        it('gas sub', async () => {
          await snapshotGasCost(liquidityMath.getGasCostOfAddDelta(15, -4))
        })
      })
    })
    