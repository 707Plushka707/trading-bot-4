const EventEmmiter = require('events');
const Wallet = require('./wallet');
const { MACD, EMA, RSI } = require("talib-binding");

class TradeStrategy extends EventEmmiter {

    #klines = new Array();
    maxHistory;
    wallet = null;

    constructor(maxHistory) {
        super();
        if (this.constructor === TradeStrategy) {
            throw new TypeError('Abstract class "TradeStrategy" cannot be instantiated directly');
        }
        this.klines = new Array();
        this.wallet = new Wallet();
        this.maxHistory = maxHistory;

        // -- Events Start
      
        if(this.wallet.openLong) {
            this.on("openLong", this.wallet.openLong);
        }
        if(this.wallet.closeLong) {
            this.on("closeLong", this.wallet.closeLong);
        }
        if(this.wallet.closeLong) {
            this.on("openShort", this.wallet.openShort);
        }
        if(this.wallet.closeLong) {
            this.on("closeShort", this.wallet.closeShort);
        }
    
    
  
        // -- Events End
    }

    init(klines) {
        this.klines = klines;
    }

    addKline(kline) {
        this.klines.push(kline);

        if(this.klines.length > this.maxHistory) {
            this.klines.shift();
            this.evaluate(kline.close, kline.closetime);
        }
    }

    isDownOrUpTrend() {
        // get last kline
        const lastKline = this.klines[this.klines.length - 1];
        
        // get close values
        const close = new Array();
        for(let i = 0; i < this.klines.length; i++) {
            close.push(this.klines[i].close);
        }

        // get indicators
        const ema200 = EMA(close, 200);
        const lastEma2000 = ema200[ema200.length -1];

        if(lastKline.close > lastEma2000 && lastKline.open > lastEma2000) {
            //uptrend
            return 1;
        }
            
        if(lastKline.close < lastEma2000 && lastKline.open < lastEma2000) {
            // downtrend
            return -1;
        }

        return 0;
    }
}

module.exports = TradeStrategy;