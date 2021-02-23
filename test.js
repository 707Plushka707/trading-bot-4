
const { sleep } = require('./utils/sleep')
const { consoleLogger, fileLogger } = require('./utils/logger');
const BinanceService = require('./service/binance')
const { KlineModel } = require('./model/klines')
const PercentTradeStrategy = require('./strategy/percentstrategy');
// const Twopercentanalyze = require('./analyse/twopercentanalyze');
// const MacdEma200Strategy = require('./strategy/macdema200strategy');

const simulationConfig = {
    symbol: 'LITUSDT',
    interval: '1m',
    startTime: new Date(2019,9,25),
    maxHistory: 2,
    Strategy: PercentTradeStrategy
};

const testKlines = {

    simpleTest : [
        {
            open: 100,
            opentime: new Date('2021-01-01 13:15:00'),
            close: 102,
            closetime: new Date('2021-01-01 13:15:59'),
        }, 
        {
            open: 102,
            opentime: new Date('2021-01-01 13:16:00'),
            close: 100,
            closetime: new Date('2021-01-01 13:16:59'),
        }, 
        {
            open: 100,
            opentime: new Date('2021-01-01 13:17:00'),
            close: 101,
            closetime: new Date('2021-01-01 13:17:59'),
        }, 
        {
            open: 101,
            opentime: new Date('2021-01-01 13:18:00'),
            close: 102,
            closetime: new Date('2021-01-01 13:18:59'),
        }, 
        {
            open: 102,
            opentime: new Date('2021-01-01 13:19:00'),
            close: 103,
            closetime: new Date('2021-01-01 13:19:59'),
        }, 
        {
            open: 103,
            opentime: new Date('2021-01-01 13:20:00'),
            close: 104,
            closetime: new Date('2021-01-01 13:20:59'),
        }, 
        {
            open: 104,
            opentime: new Date('2021-01-01 13:21:00'),
            close: 105,
            closetime: new Date('2021-01-01 13:21:59'),
        }, 
    ]
};

const test = async() => {

    consoleLogger.info("START simulation");

    const percentTradeStrategy = new simulationConfig.Strategy(simulationConfig.maxHistory);

    do {
        const klines = 
            await KlineModel.find(query)
                .sort({ closetime: 1 })
    
        if(klines.length == 0) {
            break;
        }

        for(let i=0; i < klines.length; i++) {
            percentTradeStrategy.addKline(klines[i].toObject());
        }
        
        consoleLogger.info(`Simulation completed until ${higherCloseTime}`);

        lowerClosetime = new Date(klines[klines.length - 1].closetime);
        higherCloseTime = new Date(klines[klines.length - 1].closetime);
        higherCloseTime.setDate(higherCloseTime.getDate() + 30);

    } while(true);

    consoleLogger.info(`END simulation`);
}

module.exports = { test }