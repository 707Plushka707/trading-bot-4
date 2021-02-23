class Bucket {

    data = new Array();

    add(category) {
        let target = this.data.filter(b => b.category == category);
        if(target.length == 0) {
            this.data.push({
                category,
                value:1
            })
        } else {
            target[0].value++;
        }
    }

}

module.exports = Bucket;