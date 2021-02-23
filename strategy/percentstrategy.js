const TradeStrategy = require("./tradestrategy");
const { datediff, formatDate } = require("../utils/date");

const SPREAD = 0.03;
const MAX_DIFF = 0;

class PercentTradeStrategy extends TradeStrategy {

    evaluate() {

        // get last kline
        const lastKline = this.klines[this.klines.length - 1];
        const beforeLastKline = this.klines[this.klines.length - 2];

        if(lastKline.close > beforeLastKline.close) {
            this.emit("openLong", 1, 2);
        }

    }
    
}

module.exports = PercentTradeStrategy