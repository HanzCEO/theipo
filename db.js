const db = require('better-sqlite3')('main.db');
db.pragma('journal_mode = WAL');

const { makeNoise2D } = require('open-simplex-noise');
let noise = undefined;

function createGameTable() {
    db.prepare(`
    CREATE TABLE game IF NOT EXISTS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE ON CONFLICT IGNORE,
        value TEXT
    )
    `).run();
    
    db.prepare(`
    INSERT INTO game (name, value) VALUES
        ('timestamp', ?),
        ('seed', ?),
        ('balance', ?)
    `).run(Date.now(), crypto.randomUUID(), '1000');
    
    db.commit();

    let { seed } = db.prepare("SELECT value FROM game WHERE name='seed'").get();
    noise = makeNoise2D(seed);
}

function createCompanyTable() {
    db.prepare(`
    CREATE TABLE company IF NOT EXISTS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        ticker TEXT(3,4),
        ipoPrice INTEGER,
        timestamp INTEGER,
        stockAmount INTEGER,
        companyStockHold INTEGER,
        otherStockHold INTEGER,
        myStockHold INTEGER
    )
    `).run();

    db.prepare(`
    INSERT INTO company (name, ticker, timestamp, stockAmount, ipoPrice) VALUES
        ('FlyBy', 'FLY', ${Date.now()}, ${Math.round(Math.random() * 100) * 10**8}, ${Math.round(Math.random() * 1000)}),
        ('HeatJet', 'HJT', ${Date.now()}, ${Math.round(Math.random() * 100) * 10**8}, ${Math.round(Math.random() * 10000)}),
        ('Halloond Bakery', 'HLND', ${Date.now()}, ${Math.round(Math.random() * 100) * 10**9}, ${Math.round(Math.random() * 100)})
    `).run();

    db.commit();
}

function initDb() {
    createGameTable();
    createCompanyTable();
}

function stepADay(market, stepDelay=10) {
    let { timestamp: gameNonce } = db.prepare("SELECT value FROM game WHERE name='timestamp'").get();
    let companies = db.prepare("SELECT * FROM company").iterate();
    let nonce = (Date.now() - gameNonce) / 1000 / stepDelay;

    for (const company of companies) {
        let marketMove = noise(nonce, Number(company.id));
        market[company.ticker].price *= (market[company.ticker].lastNoise - marketMove) * (-1);
        market[company.ticker].lastNoise = marketMove;
    }
}

function getGameSetting(name) {
    return db.prepare("SELECT value FROM game WHERE name=?").get(name).value;
}

function getCompaniesIt() {
    return db.prepare("SELECT * FROM company").iterate();
}

module.exports = {
    initDb,
    stepADay,
    getGameSetting,
    getCompaniesIt
};