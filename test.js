
const { sleep } = require('./utils/sleep')
const PercentTradeStrategy2 = require('./strategy/percentstrategy2');

const testData = {

    simpleTest : [
        {
            price: 100,
            time: new Date('2021-01-01 13:15:00'),
        }, 
        {
            price: 98,
            time: new Date('2021-01-01 13:16:00'),
        }, 
    ]
};

const test = async() => {

    console.log("START simulation");

    const percentTradeStrategy = new PercentTradeStrategy2();

    for(let i = 0; i<testData.simpleTest.length; i++) {
        
        let { price, time } = { ...testData.simpleTest[i] };

        if(!percentTradeStrategy.isInit) {
            percentTradeStrategy.evaluate(price, time);
            continue;
        }

        if(price >= percentTradeStrategy.nextLongPrice) {
            let currentPrice = percentTradeStrategy.nextLongPrice;
            while(currentPrice <= price) {
                percentTradeStrategy.evaluate(currentPrice, time);
                currentPrice = percentTradeStrategy.nextLongPrice;
            }
            continue;
        }

        if(price <= percentTradeStrategy.nextShortPrice) {
            let currentPrice = percentTradeStrategy.nextShortPrice;
            while(currentPrice >= price) {
                percentTradeStrategy.evaluate(currentPrice, time);
                currentPrice = percentTradeStrategy.nextShortPrice;
            }
            continue;
        }

        percentTradeStrategy.evaluate(price, time);

    }

    console.log(`END test`);
}

module.exports = { test }