

const fetchGMXPrice = require('./fetchGMX')

async function testG() {
    const price = await fetchGMXPrice('0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f');
    console.log(price)
}


testG()