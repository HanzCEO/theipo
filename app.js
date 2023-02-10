const db = require('./db');

class Company {
    constructor() {
        this.name = '';
        this.ticker = '';
        this.price = 0.00;
    }
}

function initializeMarket() {
    let _market = {};

    for (const company of db.getCompaniesIt()) {
        let c = new Company();
        c.ticker = company.ticker;
        c.name = company.name;
        c.price = company.ipoPrice;
        
        _market[company.ticker] = c;
    }

    return _market;
}

// Initializations
db.initDb();
const market = initializeMarket();
db.stepADay(market);