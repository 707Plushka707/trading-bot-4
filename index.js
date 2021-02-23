require('dotenv').config()
const { simulation } = require('./simulation');
const BinanceService = require('./service/binance')

//simulation();

const start = async() =>  {

    // //const binanceService = new BinanceService2();
    // const binanceService = new BinanceService();
    // binanceService.checkOrders();
    if(process.env.MODE == 1) {
        await simulation();
        return;
    }
}

start();