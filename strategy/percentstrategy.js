const TradeStrategy = require("./tradestrategy");
const Bucket = require("../utils/bucket");
const { datediff, formatDate } = require("../utils/date");
const { MACD, EMA, RSI } = require("talib-binding");


class PercentTradeStrategy extends TradeStrategy {

    AMOUNT_FOR_TRADES = 100;
    SPREAD = 0.02;
    MAX_DIFF = 0;
    BID_PERCENTAGE = 0.05

    totalAsset = 2000;

    longs = new Array();
    shorts = new Array();

    baseBid = 100;
    basePrice = -1;
    range = -1;

    bucketHours = new Bucket();
    bucketTradeCount = new Bucket();

    evaluate() {

        // get last kline
        const lastKline = this.klines[this.klines.length - 1];

        if(this.longs.length == 0 && this.shorts.length == 0) {
            this.baseBid = this.getBidPrice();

            const trend = this.isDownOrUpTrend()
            if(trend == 1) {
                this.addLong(lastKline.close, this.baseBid, lastKline.closetime);
            } else {
                this.addShort(lastKline.close, this.baseBid, lastKline.closetime);
            }
            this.initBasePriceRange();
            return;
        }

        const nextLongPrice = this.getNextLongPrice();
        const nextShortPrice = this.getNextShortPrice();

        let usedPrice = lastKline.close;

        if(usedPrice > nextLongPrice) {
            let currentPrice = nextLongPrice;

            while(currentPrice < usedPrice) {

                let trend = 1;
                let PNL = this.getPNL(currentPrice);

                let closeTrade = PNL > this.getTargetPNL();

                if(closeTrade) {

                    this.closeAllTrades(currentPrice);
                    this.logClose("long", lastKline.closetime, PNL);

                    this.longs = new Array();
                    this.shorts = new Array();

                    this.baseBid = this.getBidPrice();
                    trend = this.isDownOrUpTrend();
                }

                if(trend == 1) {
                    this.addLong(currentPrice, this.baseBid, lastKline.closetime);
                } else {
                    this.addShort(currentPrice, this.baseBid, lastKline.closetime);
                }
                this.initBasePriceRange();

                currentPrice = this.getNextLongPrice();
            }
            return;
        }

        if(usedPrice < nextShortPrice) {
            let currentPrice = nextShortPrice;

            while(currentPrice > usedPrice) {

                let trend = -1;
                let PNL = this.getPNL(currentPrice);

                let closeTrade = PNL > this.getTargetPNL();

                if(closeTrade) {

                    this.closeAllTrades(currentPrice);
                    this.logClose("short", lastKline.closetime, PNL);

                    this.longs = new Array();
                    this.shorts = new Array();
                    
                    this.baseBid = this.getBidPrice();
                    trend = this.isDownOrUpTrend();
                }

                if(trend == 1) {
                    this.addLong(currentPrice, this.baseBid, lastKline.closetime);
                } else {
                    this.addShort(currentPrice, this.baseBid, lastKline.closetime);
                }
                this.initBasePriceRange();

                currentPrice = this.getNextShortPrice();
            }
            return;
        }

    }

    getTargetPNL() {
        let targetPNL = this.baseBid * this.SPREAD;
        targetPNL = targetPNL - (targetPNL * 0.01);
        return targetPNL;
    }

    getBidPrice() {
        return this.totalAsset * this.BID_PERCENTAGE;
    }

    logAsset(currentPrice) {
        
        let tradeValue = this.getTradeValue(currentPrice);
        const logMessage = 
            `longs ${this.longs.length}, ` + 
            `shorts ${this.shorts.length}, ` + 
            `pnl ${this.getPNL(currentPrice)}, ` + 
            `range ${this.range}, ` + 
            `price ${currentPrice}, ` + 
            `asset ${this.totalAsset}, ` + 
            `trade value : ${tradeValue}`;

        console.log(logMessage);
    }

    logClose(type, time, PNL) {

        const tradescnt = (this.longs.length + this.shorts.length);
        const startTime = new Date(
            Math.min(
                ...this.longs.map(l => l.startTime.getTime()), 
                ...this.shorts.map(s => s.startTime.getTime())
            )
        );
        const endTime = time;
        const hours = Math.round(datediff(endTime, startTime)/60);

        const logMessage = 
            `close ${type}, ` + 
            `total : ${this.totalAsset}, ` + 
            `PNL : ${PNL}, ` + 
            `trades : ${tradescnt}, ` + 
            `hours : ${hours}, ` + 
            `time : ${formatDate(time)}`;

        console.log(logMessage);

        // Add to buckets;
        this.bucketTradeCount.add(tradescnt);
        this.bucketHours.add(hours);
        console.log("hours", this.bucketHours.sort())
        console.log("trades", this.bucketHours.sort())

        // console.log(this.bucketBounces.data)
        // console.log(this.bucketHours.data)
    }

    getTradeValue(currentPrice) {
        let tradeValue = 0;
        for(let i = 0; i< this.longs.length; i++) {
            tradeValue += (this.longs[i].qty * currentPrice);
        }

        for(let i = 0; i< this.shorts.length; i++) {
            tradeValue += (this.shorts[i].amount - (this.shorts[i].qty * currentPrice) + this.shorts[i].amount);
        }

        return tradeValue;
    }

    getPNL(currentPrice) {
        let tradeValue = this.getTradeValue(currentPrice);
        let originalValue = 0;

        for(let i = 0; i< this.longs.length; i++) {
            originalValue += (this.longs[i].amount);
        }

        for(let i = 0; i< this.shorts.length; i++) {
            originalValue += (this.shorts[i].amount);
        }

        return tradeValue - originalValue;
    }

    closeAllTrades(currentPrice) {

        let tradeValue = this.getTradeValue(currentPrice);
        this.totalAsset += tradeValue;

        // for(let i = 0; i< this.longs.length; i++) {
        //     this.totalAsset += this.longs[i].qty * currentPrice;
        // }

        // for(let i = 0; i< this.shorts.length; i++) {
        //     this.totalAsset += this.shorts[i].amount - (this.shorts[i].qty * currentPrice) + this.shorts[i].amount;
        // }
    }

    initBasePriceRange() {
        if (this.longs.length == 1 && this.shorts.length == 0) {
            this.basePrice = this.longs[0].price;
            this.range = this.SPREAD * this.basePrice;
        }
        if (this.shorts.length == 1 && this.longs.length == 0) {
            this.basePrice = this.shorts[0].price;
            this.range = this.SPREAD * this.basePrice;
        }
    }

    getNextLongPrice() {
        let nextLongPrice = this.basePrice;

        const maxLong = this.longs.length == 0 ? -1 : Math.max(...this.longs.map(l => l.price));
        const maxShort = this.shorts.length == 0 ? -1 : Math.max(...this.shorts.map(s => s.price));

        const refPrice = maxLong == -1 ? maxShort : maxLong;

        while(nextLongPrice <= refPrice) {
            nextLongPrice += this.range;
        }

        return nextLongPrice;
    }

    getNextShortPrice() {
        let nextShortPrice = this.basePrice;

        const minLong = this.longs.length == 0 ? -1 : Math.min(...this.longs.map(l => l.price));
        const minShort = this.shorts.length == 0 ? -1 : Math.min(...this.shorts.map(s => s.price));

        const refPrice = minShort == -1 ? minLong : minShort;

        while(nextShortPrice >= refPrice) {
            nextShortPrice -= this.range;
        }

        return nextShortPrice;
    }

    addLong(price, amount, startTime) {
        this.totalAsset -= amount;
        this.longs.push({
            amount,
            price,
            qty:amount/price,
            startTime 
        });
        this.logAsset(price)
        if(this.totalAsset < 0) {
            throw new Error("No asset left!!!")
        }
    }

    addShort(price, amount, startTime) {
        this.totalAsset -= amount;
        this.shorts.push({
            amount,
            price,
            qty:amount/price,
            startTime 
        });
        this.logAsset(price)
        if(this.totalAsset < 0) {
            throw new Error("No asset left!!!")
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

module.exports = PercentTradeStrategy