const Binance = require('node-binance-api');
const EventEmmiter = require('events');

const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET,
    hedgeMode: true
});

class BinanceService extends EventEmmiter {

    listen(params) {

        let { symbol, interval } = params;

        if(!symbol) {
            throw new Error("You must specify symbol to use");
        }

        if(!interval) {
            throw new Error("You must specify interval to use");
        }

        let websocketname = this.symbol.toLowerCase() + "@kline_" + this.interval;
        const websocket = binance.futuresSubscribe(websocketname, (e) => {
            if(e.k.x) {
                const klinePretty = {
                    symbol,
                    interval,
                    opentime:e.k.t,
                    open:e.k.o,
                    high:e.k.h,
                    low:e.k.l,
                    close:e.k.c,
                    volume:e.k.v,
                    closetime:e.k.T,
                    quotevolume:e.k.q,
                    numberoftrades:e.k.n,
                    takerbasevolume:e.k.V,
                    takerquotevolume:e.k.Q,
                    ignore:e.k.B,
                };

                this.emit("newKline", klinePretty);
            }
        });

        return websocket;
    }

    async getHistoricalKlines(params) {

        let { startTime, limit, symbol, interval } = params;

        if(!symbol) {
            throw new Error("You must specify symbol to use");
        }

        if(!interval) {
            throw new Error("You must specify interval to use");
        }

        if(!limit) {
            limit = 400;
        }

        const baseDateTime = new Date();

        const klines = 
          await binance.futuresCandles(
            symbol,
            interval,
            {
                limit,
                startTime
            }
        );

        const klinesPretty = [];

        for(let i = 0; i < klines.length; i++) {
            const k = klines[i];
            klinesPretty.push({
                symbol,
                interval,
                opentime:k[0],
                open:k[1],
                high:k[2],
                low:k[3],
                close:k[4],
                volume:k[5],
                closetime:k[6],
                quotevolume:k[7],
                numberoftrades:k[8],
                takerbasevolume:k[9],
                takerquotevolume:k[10],
                ignore:k[11],
            });
        }

        // Remove kline if it is not closed
        let isLast = false;
        if(baseDateTime.getTime() > klinesPretty[klinesPretty.length - 1].opentime &&
            baseDateTime.getTime() < klinesPretty[klinesPretty.length - 1].closetime) {
                isLast = true;
        }

        return { klines: klinesPretty, isLast };
    }

    async checkOrders() {
        //const res = await binance.futuresTrades("SRMUSDT");
        //const res = await binance.futuresUserTrades("SRMUSDT" );
        //const res = await binance.futuresMarketBuy('SRMUSDT', 1)
        //const res = await binance.futuresOpenOrders("SRMUSDT");
        //const res = await binance.futuresOrderStatus('SRMUSDT', {origClientOrderId:4750394025})
        //const res = await binance.futuresMarketBuy('SRMUSDT', 1)


        // const res = await binance.futuresPositionRisk( { symbol: "LITUSDT" } );
        // res.filter(r => r.symbol == "LITUSDT")[0]

        // const res = await binance.futuresOpenOrders("LITUSDT");
        // res.filter(r => r.symbol == "LITUSDT")[0]

        // const res = await binance.futuresAllOrders("TOMOUSDT");
        // res.forEach(o => {
        //     const a = new Date(o.time);
        //     console.log(o.time);
        //     console.log(a);
        // });

        // let buy = await binance.futuresMarketBuy("TOMOUSDT", 7);
        // console.log(buy);
        // console.log("--------------------");
        // let o = await binance.futuresOrderStatus("TOMOUSDT", { orderId: buy.orderId } )
        // // console.log(o.filter(x => x.orderId == buy.orderId));
        // console.log(o);

        
        let sell = await binance.futuresMarketSell("TOMOUSDT", 1, { positionSide: "LONG" });
        console.log(sell);

        
        // let o = await binance.futuresAllOrders()

        // console.log(o)

    }
}

module.exports = BinanceService