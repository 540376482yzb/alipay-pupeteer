const dotenv = require("dotenv");
dotenv.config();
const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const chalk = require("chalk");
const DBServer = require("./db/db.conn");
const odTwilio = require("@odinternational/od-sms");

class PSBC {
  constructor() {
    this.page = null;
    this.browser = null;
    this.timer = null;
  }

  /** Start of FormatingList Function **/
  static _formatingList(tradeNum, amount) {
    let tempArray = [];
    for (let i = 0; i < tradeNum.length; i++) {
      tempArray.push({
        tradeNo: tradeNum[i],
        amount: amount[i]
      });
    }
    return tempArray;
  }
  /**  End of FormatingList Function **/

  /** Start of _saveDataToDataBase Function **/
  async _saveDataToDataBase(data) {
    console.log(JSON.stringify(data));
    let foundLog = App._formatingList(data.tradeNum, data.amount);
    let dataBase = new DBServer("asdf");
    let tempArray = await dataBase.compareLogs(foundLog);
    if (tempArray.length > 0) {
      //TODO: send data to king
      console.log(chalk.red(JSON.stringify(tempArray)));
      dataBase.saveLogs(tempArray);
    }
  }
  /**  End of _saveDataToDataBase Function **/

  async _checkIfRequiredScan() {
    let example = await this.page.$("#risk_qrcode_cnt");
    if (example && example.isIntersectingViewport()) {
      const sms = new odTwilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
      sms.sendMessage("快来扫一下!", process.env.TWILIO_NUMBER, "+16266077322");
    }
  }

  /** Start of _getBrowserData Function **/
  async _getBrowserData() {
    let data = await this.page.evaluate(() => {
      let tradeNum = Array.from(document.querySelectorAll("p"))
        .map(trade => {
          return trade.textContent.includes("流水号") ? trade.textContent.split(":")[1] : null;
        })
        .filter(el => {
          return el != null;
        });
      const amount = Array.from(document.querySelectorAll("table tr td .amount-pay"));
      console.log(tradeNum, amount);

      return { tradeNum, amount: amount.map(am => am.textContent) };
    });
    return data;
  }
  /** End of _getBrowserData Function **/

  /**  Start of Init Function **/
  async init() {
    this.browser = await puppeteer.launch({
      headless: false
    });
    this.page = await this.browser.newPage();
    this.timer = null;
    //await this.page.emulate(devices["iPad"]);
  }
  /**  End of Init Function **/

  /** Start of Redirect Function **/
  async redirect() {
    let random = Math.floor(Math.random(2) * 1000);
    try {
      console.log(chalk.blue("========== 进入跳转 ========"));
      await this._clickEvent("#queryButton");
      this.timer = setTimeout(() => {
        this.redirect();
      }, 15000 + random);
    } catch (err) {
      console.log(chalk.red("error when redirect"));
    }
  }
  /**  End of Redirect Function **/

  /** Start of StopApp Function **/
  stop() {
    if (this.page && this.browser) {
      this.page = null;
      clearTimeout(this.timer);
      this.browser.close();
    }
    return;
  }
  /**  End of StopApp Function **/

  async _checkElementExisted() {
    try {
      await this.page.waitForSelector("#labName");
      console.log("as");
      await this._checkElementExisted();
    } catch (error) {
      console.log("hello");
      return;
    }
  }

  async _clickEvent(selector) {
    try {
      await this.page.waitForSelector(selector);
      let currEvent = await this.page.$(selector);
      if (currEvent) {
        if (selector === "#queryButton") {
          await this._checkIfWrongConExisted();
        }
        currEvent.click();
      }
    } catch (e) {
      console.log("clickEvent" + e);
    }
  }

  async _checkIfWrongConExisted() {
    try {
      let currEvent = await this.page.$(".dook");
      if (currEvent) {
        currEvent.click();
      }
    } catch (e) {
      return;
    }
  }

  /**  Start of Start Function **/
  async start() {
    console.log("start");
    if (!this.page) {
      await this.init();
    }
    try {
      await this.page.goto("https://pbank.psbc.com/perbank/index.html");
      await this._checkElementExisted();
      console.log("out");
      await this._clickEvent('[data-menuno="A00300000"]');
      await this._clickEvent('[data-menuno="C00312000"]');
      this.redirect();
      // console.log("========= 等待抓取数据 ==================");
      // await this._checkIfRequiredScan();
      // await this.page.waitFor("#tradeRecordsIndex");
      // console.log(chalk.blue("========== 寻找数据成功 ========"));
      // const data = await this._getBrowserData();
      // if (data) {
      //   this._saveDataToDataBase(data);
      //   this.redirect();
      // }
    } catch (error) {
      console.log(chalk.red(error));
      this.start();
    }
  }
  /**  End of Start Function **/
}

/**  Start of Run Function **/
function run() {
  let newApp = new PSBC();
  newApp.start();
}
/**  End of Run Function **/

run();
