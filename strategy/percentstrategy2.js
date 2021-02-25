const Bucket = require("../utils/bucket");
const { datediff, formatDate } = require("../utils/date");

class PercentTradeStrategy2 {

    SPREAD = 0.02;
    MAX_DIFF = 0;
    BID_PERCENTAGE = 0.1

    totalAsset = 2000;

    longs = new Array();
    shorts = new Array();

    baseBidAmount = -1;
    baseBidQty = -1;
    basePrice = -1;
    range = -1;
    isInit = false;

    nextLongPrice = -1;
    nextShortPrice = -1;

    bucketHours = new Bucket();
    bucketTradeCount = new Bucket();

    evaluate(price, time) {

        if(this.longs.length == 0 && this.shorts.length == 0) {

            this.initBaseValues(price);
            this.addLong(price, this.baseBidQty, time);
            this.isInit = true;

            this.nextLongPrice = this.getNextLongPrice();
            this.nextShortPrice = this.getNextShortPrice();

            return;
        }

        if(price >= this.nextLongPrice) {

            if(this.willClose(price)) {
                this.closeAllTrades(price, time);
                this.initBaseValues(price);
            }

            this.addLong(price, this.baseBidQty, time);

            this.nextLongPrice = this.getNextLongPrice();
            this.nextShortPrice = this.getNextShortPrice();
            return;
        }

        if(price <= this.nextShortPrice) {

            if(this.willClose(price)) {
                this.closeAllTrades(price, time);
                this.initBaseValues(price);
            }

            this.addShort(price, this.baseBidQty, time);

            this.nextLongPrice = this.getNextLongPrice();
            this.nextShortPrice = this.getNextShortPrice();
            return;
        }

        return;

        if(price > nextLongPrice) {
            let currentPrice = nextLongPrice;

            while(currentPrice < price) {

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

        if(price < nextShortPrice) {
            let currentPrice = nextShortPrice;

            while(currentPrice > price) {

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

    willClose(price) {
        
        // Close on long
        if(price >= this.nextLongPrice) {
            // Only 1 trade open
            if(this.longs.length == 1 && this.shorts.length == 0) {
                return true;
            }

            // Multiple trades open
            if(this.longs.length >= this.shorts.length + 2) {
                return true;
            }
        }
        
        // Close on short
        if(price <= this.nextShortPrice) {
            // Only 1 trade open
            if(this.shorts.length == 1 && this.longs.length == 0) {
                return true;
            }

            // Multiple trades open
            if(this.shorts.length >= this.longs.length + 2) {
                return true;
            }
        }

        return false;


    }

    initBaseValues(price) {
        this.basePrice = price;
        this.baseBidQty = (this.totalAsset * this.BID_PERCENTAGE)/price;
        this.baseBidAmount = this.baseBidQty/this.basePrice;
        this.range = this.SPREAD * this.basePrice;
    }

    getTradeValue(price) {
        let tradeValue = 0;
        for(let i = 0; i< this.longs.length; i++) {
            tradeValue += (this.longs[i].qty * price);
        }

        for(let i = 0; i< this.shorts.length; i++) {
            tradeValue += (this.shorts[i].amount - (this.shorts[i].qty * price) + this.shorts[i].amount);
        }

        return tradeValue;
    }

    getPNL(price) {
        let tradeValue = this.getTradeValue(price);
        let originalValue = 0;

        for(let i = 0; i< this.longs.length; i++) {
            originalValue += (this.longs[i].amount);
        }

        for(let i = 0; i< this.shorts.length; i++) {
            originalValue += (this.shorts[i].amount);
        }

        return tradeValue - originalValue;
    }

    closeAllTrades(price, time) {
        
        let pnl = this.getPNL(price);
        let type = price >= this.nextLongPrice ? "long" : "short";
        let tradeValue = this.getTradeValue(price);

        this.totalAsset += tradeValue;
        this.logClose(type, time, pnl);

        this.longs = new Array();
        this.shorts = new Array();
        
    }

    addLong(price, qty, time) {
        const amount = qty/price;
        this.totalAsset -= amount;
        this.longs.push({
            amount,
            price,
            qty,
            time 
        });
        this.logAsset(price)
        if(this.totalAsset < 0) {
            throw new Error("No asset left!!!")
        }
    }

    addShort(price, qty, time) {
        const amount = qty/price;
        this.totalAsset -= amount;
        this.shorts.push({
            amount,
            price,
            qty,
            time 
        });
        this.logAsset(price)
        if(this.totalAsset < 0) {
            throw new Error("No asset left!!!")
        }
    }

    logAsset(price) {
        
        let tradeValue = this.getTradeValue(price);
        const logMessage = 
            `longs ${this.longs.length}, ` + 
            `shorts ${this.shorts.length}, ` + 
            `asset ${this.totalAsset}, ` + 
            `pnl ${this.getPNL(price)}, ` + 
            `range ${this.range}, ` + 
            `price ${price}, ` + 
            `trade value : ${tradeValue}`;

        console.log(logMessage);
    }

    logClose(type, time, PNL) {

        const tradescnt = (this.longs.length + this.shorts.length);
        const startTime = new Date(
            Math.min(
                ...this.longs.map(l => l.time.getTime()), 
                ...this.shorts.map(s => s.time.getTime())
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
        console.log("trades", this.bucketTradeCount.sort())

        // console.log(this.bucketBounces.data)
        // console.log(this.bucketHours.data)
    }

    //----------------------
    //----------------------
    //----------------------



    getTargetPNL() {
        let targetPNL = this.baseBid * this.SPREAD;
        targetPNL = targetPNL - (targetPNL * 0.01);
        return targetPNL;
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

    // addLong(price, amount, startTime) {
    //     this.totalAsset -= amount;
    //     this.longs.push({
    //         amount,
    //         price,
    //         qty:amount/price,
    //         startTime 
    //     });
    //     this.logAsset(price)
    //     if(this.totalAsset < 0) {
    //         throw new Error("No asset left!!!")
    //     }
    // }

    // addShort(price, amount, startTime) {
    //     this.totalAsset -= amount;
    //     this.shorts.push({
    //         amount,
    //         price,
    //         qty:amount/price,
    //         startTime 
    //     });
    //     this.logAsset(price)
    //     if(this.totalAsset < 0) {
    //         throw new Error("No asset left!!!")
    //     }
    // }
    
}

module.exports = PercentTradeStrategy2