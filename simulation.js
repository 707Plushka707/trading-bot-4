
const { sleep } = require('./utils/sleep')
const { consoleLogger, fileLogger } = require('./utils/logger');
const BinanceService = require('./service/binance')
const { KlineModel } = require('./model/klines')
const PercentTradeStrategy = require('./strategy/percentstrategy');
const SimpleStrategy = require('./strategy/simplestrategy');
// const Twopercentanalyze = require('./analyse/twopercentanalyze');
// const MacdEma200Strategy = require('./strategy/macdema200strategy');

const simulationConfig = {
    symbol: 'BNBUSDT',
    interval: '1m',
    startTime: new Date(2019,9,25),
    maxHistory: 400,
    Strategy: PercentTradeStrategy
};

const importHistoricalData = async() => {

    //const { historicalParams } = require('./utils/historicalParams');

    const binanceService = new BinanceService();

    const historicalParams = [{
        symbol: simulationConfig.symbol,
        interval: simulationConfig.interval,
        startTime: simulationConfig.startTime.getTime()
    }];

    for(let i = 0; i < historicalParams.length; i++) {

        const { symbol, interval, startTime } = historicalParams[i];
        let klines;
        let isLast;
        let lastOpenTime;
        lastOpenTime = startTime;
    
        do {
            let lastKline;

            await sleep(350);
            const result = await binanceService.getHistoricalKlines({
                symbol,
                interval,
                limit: 1500,
                startTime: lastOpenTime,
            });
            klines = result.klines;
            isLast = result.isLast;
    
            const klinesModel = new Array();
            klines.forEach((k) => {
                klinesModel.push(new KlineModel({...k}));
            })
            await KlineModel.collection.insertMany(klinesModel);
            lastKline = klines[klines.length - 1];
    
            lastOpenTime = lastKline.opentime;
            consoleLogger.info(`${symbol} : ${interval} : ${new Date(lastOpenTime)}`);
    
        } while(!isLast)
    }
    consoleLogger.info(`IMPORT END`);
}

const simulation = async() => {
    require('./startup/database').init();

    consoleLogger.info("START simulation");
    
    const searhQuery = {
        symbol: simulationConfig.symbol,
        interval: simulationConfig.interval,
        closetime: { $gt: simulationConfig.startTime }
    }

    let firstKline;
    do {
        firstKline = await 
            KlineModel.findOne(searhQuery)
                .sort({ closetime: 1 })
                .limit(1);

        if(!firstKline) {
            consoleLogger.info("Import data");
            await importHistoricalData();
        }
    } while(!firstKline)

    let lowerClosetime = new Date(firstKline.closetime);
    let higherCloseTime = new Date(firstKline.closetime);
    higherCloseTime.setDate(higherCloseTime.getDate() + 1);

    const percentTradeStrategy = new simulationConfig.Strategy(simulationConfig.maxHistory);

    do {
        const query = { ...searhQuery, closetime: { $gt: lowerClosetime,  $lt: higherCloseTime } }
        const klines = 
            await KlineModel.find(query)
                .sort({ closetime: 1 })
    
        if(klines.length == 0) {
            break;
        }

        for(let i=0; i < klines.length; i++) {
            percentTradeStrategy.addKline(klines[i].toObject());
        }
        console.log("hours", percentTradeStrategy.bucketHours.sort())
        console.log("trades", percentTradeStrategy.bucketHours.sort())
        
        // consoleLogger.info(`Simulation completed until ${higherCloseTime}`);

        lowerClosetime = new Date(klines[klines.length - 1].closetime);
        higherCloseTime = new Date(klines[klines.length - 1].closetime);
        higherCloseTime.setDate(higherCloseTime.getDate() + 30);

    } while(true);

    consoleLogger.info(`END simulation`);
}

module.exports = { simulation }