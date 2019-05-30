const dotenv = require("dotenv");
dotenv.config();
const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const chalk = require("chalk");
const DBServer = require("./db/db.conn");
const odTwilio = require("@odinternational/od-sms");

class BOC {
  constructor() {
    this.page = null;
    this.browser = null;
    this.timer = null;
  }

  /**
   * Start of Data Struct and Save Data to DB
   */
  static _formatingData(data) {
    const singleData = data
      .filter(info => info.includes("支付宝转账"))
      .map(info => {
        let curr = info.trim().split(/\s+/);
        console.log(curr);
        return {
          amount: curr[4],
          date: curr[0],
          desc: curr[8]
        };
      });
    return singleData;
  }

  async _saveDataToDataBase(data) {
    let foundLog = BOC._formatingData(data);
    console.log(chalk.cyanBright(JSON.stringify(foundLog)));
    let dataBase = new DBServer("asdf");
    let tempArray = await dataBase.compareLogs(foundLog);
    if (tempArray.length > 0) {
      //TODO: send data to king
      console.log(chalk.cyanBright(JSON.stringify(tempArray)));
      dataBase.saveLogs(tempArray);
    }
  }

  async _getBrowserData() {
    await this.page.waitForSelector("td");
    let data = await this.page.evaluate(() => {
      let table = Array.from(document.querySelectorAll("table tbody tr"));
      let tr = table.map(am => am.textContent);
      return { table: tr };
    });
    return data.table;
  }
  /**
   * End of Data Struct and Save Data to DB
   */

  async _checkElementExisted(selector) {
    try {
      await this.page.waitForSelector(selector);
      await this._checkElementExisted();
    } catch (error) {
      return;
    }
  }

  async _clickEvent(selector) {
    try {
      await this.page.waitForSelector(selector);
      let currEvent = await this.page.$(selector);
      if (currEvent) {
        currEvent.click();
      }
    } catch (error) {
      if (error.message.includes("#btn_49_740974")) {
        await this._clickEvent('[lan="l0176"]');
        await this._clickEvent("#btn_49_740974");
      }
    }
  }

  async redirect() {
    let random = Math.floor(Math.random(2) * 1000);
    try {
      await this._clickEvent("#btn_49_740974");
      await this.page.waitFor("#debitCardTransDetail_table");
      const data = await this._getBrowserData();
      await this._saveDataToDataBase(data);
      this.timer = setTimeout(() => {
        this.redirect();
      }, 15000 + random);
    } catch (err) {
      console.log(chalk.red(err));
    }
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: false
    });
    this.page = await this.browser.newPage();
    this.timer = null;
    //await this.page.emulate(devices["iPad"]);
  }

  stop() {
    if (this.page && this.browser) {
      this.page = null;
      clearTimeout(this.timer);
      this.browser.close();
    }
    return;
  }

  async start() {
    console.log("start");
    if (!this.page) {
      await this.init();
    }
    try {
      await this.page.goto("https://ebsnew.boc.cn/boc15/login.html", { timeout: 0 });
      await this._checkElementExisted("#btn_login_79676");
      await this._clickEvent('[lan="l0176"]');
      await this.redirect();
    } catch (error) {
      console.log(chalk.red(error));
      this.start();
    }
  }
}

function run() {
  let newApp = new BOC();
  newApp.start();
}

run();
