const axios = require('axios');

const assetPrice = [
    {
        '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f': '28884576620000000000000000000000000',  // BTC/USD
        '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': '1905473534000000000000000000000000',   // ETH/USD
        '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4': '6932146100000000000000000000000',      // LINK/USD 
        '0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0': '5315079500000000000000000000000'      //  UNI/USD
      }
]

async function fetchGMXPrice(pairContract) {
    try {
        const response = await axios.get('https://api.gmx.io/prices');
        return response.data[pairContract]
        console.log(response.data[pairContract]);  // need to get individual price
    } catch (error) {
        console.log('Error')
    }
}

fetchGMXPrice('0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f')



module.exports = fetchGMXPrice;