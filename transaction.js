const { ethers, network } = require("hardhat");
const {BigNumber} = require("bignumber.js");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers")

const fetchGMXPrice = require('./fetchGMX')





require('dotenv').config()

const gainsTrading = require('./abi/GNSTradingContract.json')
const gainsAddress = '0x5E5BfDA2345218c9Ee92B6d60794Dab5A4706342'

const DaiABI = require('./abi/DAIcontract.json')
const DaiAddress = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'

const pairABI = require('./abi/GNSPrice.json');
const { Signature } = require("ethers");
const pairAddress = '0x6ce185860a4963106506C203335A2910413708e9'

const gmxRouter = require('./abi/GMXRouter.json')
const gmxRouterAddress = '0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064'

const gmxPosition = require('./abi/GMSPositionRouter.json')
const gmxPositionAddress = '0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868'

const provider = new ethers.getDefaultProvider('http://127.0.0.1:8545')


//wallet
const mimic = '0x7B7B957c284C2C227C980d6E2F804311947b84d0'


async function getGainsPrice() {

    const pair = new ethers.Contract(pairAddress, pairABI, provider)
    const price = await pair.latestAnswer() // 8 decimal -> 10 decimal
    
    const num = new BigNumber(price)
    return num;

}



async function main() {

    await helpers.impersonateAccount(mimic);
    const impersonate = await ethers.getSigner(mimic);


    console.log(
        "Vitalik account before transaction",
        ethers.formatEther(await ethers.provider.getBalance(impersonate))
      );

    const gns = new ethers.Contract(gainsAddress, gainsTrading, impersonate)
    const dai = new ethers.Contract(DaiAddress, DaiABI, impersonate)

    const price = await getGainsPrice();

    // const convPrice = parseInt(ethers.parseUnits(price.toString(), 8));


    const convPrice = price / (10 ** 8);
    const tp = convPrice + (0.01 * convPrice * (15 / 5));
    console.log(`tp: ${tp}`)
    const tpCov = tp * (10 ** 10)

    const contractPrice =  convPrice * (10 ** 10);
    // const floor = Math.floor(contractPrice);


    console.log(`contract price: ${contractPrice}`);
    console.log(`tp conversion: ${tpCov}`)
    

    const tradeTuple = {
        'trader': mimic,
        'pairIndex': 0,
        'index': 0,  //tradeIndex
        'initialPosToken': 0,
        'positionSizeDai': ethers.parseUnits('2000', 18).toString(),  // collateral in 1e18
        'openPrice': BigInt(contractPrice),
        'buy': true,
        'leverage': 5,  //leverage adjustable by slider on frontend
        'tp': BigInt(tpCov),
        'sl': 0
    }

    console.log(contractPrice)

    // const daiTransfer = await dai.connect(impersonate).transferFrom(
    //     impersonate,
    //     gainsAddress,
    //     ethers.parseUnits('2000', 18).toString()
    // )
    
    // const gg  = await daiTransfer.wait()
    // console.log(gg.blockNumber)

    const daiTransaction = await dai.connect(impersonate).approve(
        '0xcFa6ebD475d89dB04cAd5A756fff1cb2BC5bE33c',
        ethers.parseUnits('2000', 18).toString()
    )
    const daiReceipt = await daiTransaction.wait()
    console.log(daiReceipt.blockNumber)

    const trade = await gns.connect(impersonate).openTrade(
        tradeTuple, 0, 0, '12492725505', '0x0000000000000000000000000000000000000000'
    )
    const tradeReceipt = await trade.wait()
    console.log(tradeReceipt.blockNumber)

   


}

async function testGMX(pairContract, isLong, leverage) {
    await helpers.impersonateAccount(mimic);
    const impersonate = await ethers.getSigner(mimic);


    console.log(
        "Vitalik account before transaction",
        ethers.formatEther(await ethers.provider.getBalance(impersonate))
      );

    const gmxRouterContract = new ethers.Contract(gmxRouterAddress, gmxRouter, impersonate)
    const gmxPositionContract = new ethers.Contract(gmxPositionAddress, gmxPosition, impersonate)
    const dai = new ethers.Contract(DaiAddress, DaiABI, impersonate)

    const price =  await fetchGMXPrice(pairContract)

        const convPrice = price / 10 ** 30;
        const slippage = convPrice * 1.5 / 100;
        let acceptablePrice = 0;
          if (isLong == true) {
              acceptablePrice = convPrice + slippage;
          } else {
              acceptablePrice = convPrice - slippage;
           } 

           const contractPrice = acceptablePrice * 10 ** 30;

           console.log('acceptable price', contractPrice)
           console.log('price', price)
           const collateral = 0;
           const sizeDelta = (2000 * leverage) * (10 ** 30);
       
           const daiTransaction = await dai.connect(impersonate).approve(
               gmxPositionAddress,
               ethers.parseUnits('2000', 18).toString()
           )
           const daiReceipt = await daiTransaction.wait()
           console.log(daiReceipt.blockNumber)
       
           const approvePlugin = await gmxRouterContract.connect(impersonate).approvePlugin(
               gmxPositionAddress
           )
       
           const pluginReceipt = await approvePlugin.wait()
           console.log(pluginReceipt.blockNumber)
       
           try {
       
               const gmxTrade =  await gmxPositionContract.connect(impersonate).createIncreasePosition(
                   [DaiAddress],
                   pairContract,
                   BigInt(2000000000000000000000),
                   0,
                   BigInt(sizeDelta),
                   isLong, // isLong
                   BigInt(contractPrice),
                   BigInt(180000000000000), //minExecutionFees
                   '0x0000000000000000000000000000000000000000000000000000000000000000',
                   '0x0'
               ).then((p) => console.log(p))
       
       
           } catch (error) {
               console.log(error)
           }

   
    

    







}




testGMX('0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', true, 5)

// main()


