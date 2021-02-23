const TradeStrategy = require("./tradestrategy");
const { datediff, formatDate } = require("../utils/date");

const SPREAD = 0.03;
const MAX_DIFF = 0;

class PercentTradeStrategy extends TradeStrategy {

    AMOUNT_FOR_TRADES = 100;
    SPREAD = 0.02;

    totalAsset = 1000;

    longs = new Array();
    shorts = new Array();

    basePrice = -1;
    range = -1;

    evaluate() {

        // get last kline
        const lastKline = this.klines[this.klines.length - 1];
        const beforeLastKline = this.klines[this.klines.length - 2];

        if(this.longs.length == 0 && this.shorts.length == 0) {
            this.addLong(lastKline.close, this.totalAsset * 0.1, lastKline.closetime);
            this.initBasePriceRange();
            return;
        }

        const nextLongPrice = this.getNextLongPrice();
        const nextShortPrice = this.getNextShortPrice();

        if(lastKline.close > nextLongPrice) {
            let currentPrice = nextLongPrice;

            while(currentPrice < lastKline.close) {

                let closeTrade = false;
                if(this.longs.length >= 1 && this.shorts.length == 0){
                    closeTrade = true;
                }
                if(this.longs.length >= this.shorts.length + 1){
                    closeTrade = true;
                }

                if(closeTrade) {

                    this.closeAllTrades(currentPrice);
                    this.log("long", lastKline);

                    this.longs = new Array();
                    this.shorts = new Array();
                }

                this.addLong(currentPrice, this.totalAsset * 0.1, lastKline.closetime);
                this.initBasePriceRange();

                currentPrice = this.getNextLongPrice();
            }
            return;
        }

        if(lastKline.close < nextShortPrice) {
            let currentPrice = nextShortPrice;

            while(currentPrice > lastKline.close) {

                let closeTrade = false;
                if(this.shorts.length >= 1 && this.longs.length == 0){
                    closeTrade = true;
                }
                if(this.shorts.length >= this.longs.length + 1){
                    closeTrade = true;
                }

                if(closeTrade) {

                    this.closeAllTrades(currentPrice);
                    this.log("short", lastKline);

                    this.longs = new Array();
                    this.shorts = new Array();
                }

                this.addShort(currentPrice, this.totalAsset * 0.1, lastKline.closetime);
                this.initBasePriceRange();

                currentPrice = this.getNextShortPrice();
            }
            return;
        }

    }

    log(type, lastKline) {

        const bounces = (this.longs.length > this.shorts.length ? this.longs.length : this.shorts.length) - 1;
        const startTime = new Date(
            Math.min(
                ...this.longs.map(l => l.startTime.getTime()), 
                ...this.shorts.map(s => s.startTime.getTime())
            )
        );
        const endTime = lastKline.closetime;

        const logMessage = 
            `close ${type}, ` + 
            `total : ${this.totalAsset}, ` + 
            `bounces : ${bounces}, ` + 
            `hours : ${Math.round(datediff(endTime, startTime)/60)}, ` + 
            `time : ${formatDate(lastKline.closetime)}`;
        console.log(logMessage);
    }

    closeAllTrades(currentPrice) {
        for(let i = 0; i< this.longs.length; i++) {
            this.totalAsset += this.longs[i].qty * currentPrice;
        }

        for(let i = 0; i< this.shorts.length; i++) {
            this.totalAsset += this.shorts[i].amount - (this.shorts[i].qty * currentPrice) + this.shorts[i].amount;
        }
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
    }

    addShort(price, amount, startTime) {
        this.totalAsset -= amount;
        this.shorts.push({
            amount,
            price,
            qty:amount/price,
            startTime 
        });
    }
    
}

module.exports = PercentTradeStrategy