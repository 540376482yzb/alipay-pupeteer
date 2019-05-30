const dotenv = require("dotenv");
dotenv.config();
const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const chalk = require("chalk");
const DBServer = require("./db/db.conn");
const OdTwilio = require("@odinternational/od-sms");

class BOC {
  constructor() {
    this.page = null;
    this.browser = null;
    this.timer = null;
    this.errorCounter = null;
    this.dataBase = null;
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

  async _redirect() {
    let random = Math.floor(Math.random(2) * 1000);
    try {
      await this._clickEvent("#btn_49_740974");
      await this.page.waitFor("#debitCardTransDetail_table");
      const data = await this._getBrowserData();
      await this._saveDataToDataBase(data);
      this.timer = setTimeout(() => {
        this._redirect();
      }, 15000 + random);
    } catch (err) {
      console.log(chalk.red(err));
    }
  }

  async _init() {
    this.browser = await puppeteer.launch({
      headless: false
    });
    this.page = await this.browser.newPage();
    this.timer = null;
    this.errorCounter = 0;
    this.dataBase = new DBServer();
    //await this.page.emulate(devices["iPad"]);
  }

  stop() {
    if (this.page && this.browser) {
      this.page = null;
      this.errorCounter = 0;
      clearTimeout(this.timer);
      this.browser.close();
    }
    return;
  }

  async start() {
    console.log("start");
    if (!this.page) {
      await this._init();
    }
    try {
      await this.page.goto("https://ebsnew.boc.cn/boc15/login.html", { timeout: 0 });
      await this._checkElementExisted("#btn_login_79676");
      await this._clickEvent('[lan="l0176"]');
      await this._redirect();
    } catch (error) {
      this.errorCounter++;
      if (this.errorCounter >= 10) {
        let sms = new OdTwilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
        sms.sendMessage("有问题了 快来看看！", process.env.TWILIO_NUMBER, "+16262974820");
        this.stop();
        return new Error("BOC 程序有问题 " + error);
      }
      if (this.errorCounter < 10) {
        this.start();
      }
    }
  }
}

function run() {
  let newApp = new BOC();
  newApp.start();
}

run();
