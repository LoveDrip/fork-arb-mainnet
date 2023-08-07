const { ethers, network } = require("hardhat");
const {BigNumber} = require("bignumber.js");
const helpers = require("@nomicfoundation/hardhat-toolbox/network-helpers")





require('dotenv').config()

const gainsTrading = require('./abi/GNSTradingContract.json')
const gainsAddress = '0xcDCB434D576c5B1CF387cB272756199B7E72C44d'

const DaiABI = require('./abi/DAIcontract.json')
const DaiAddress = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'

const pairABI = require('./abi/GNSPrice.json');
const { Signature } = require("ethers");
const pairAddress = '0x6ce185860a4963106506C203335A2910413708e9'

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

    const gns = new ethers.Contract(gainsAddress, gainsTrading, provider)
    const dai = new ethers.Contract(DaiAddress, DaiABI, provider)

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
    

    const daiTransaction = await dai.connect(impersonate).approve(
        gainsAddress,
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

main()
