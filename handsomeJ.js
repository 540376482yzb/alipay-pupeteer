const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const chalk = require("chalk");
const DBServer = require("./db/db.conn");

class App {
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
    let random = Math.floor(Math.random(5) * 1000);
    try {
      console.log(chalk.blue("========== 进入跳转 ========"));
      await this.page.goto("https://my.alipay.com/portal/i.htm");
      this.timer = setTimeout(() => {
        this.start();
      }, 10000 + random);
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

  /**  Start of Start Function **/
  async start() {
    if (!this.page) {
      await this.init();
    }
    try {
      await this.page.goto("https://consumeprod.alipay.com/record/standard.htm");
      console.log("========= 等待抓取数据 ==================");
      // await this.page.waitForNavigation();
      await this.page.waitFor("#tradeRecordsIndex");
      console.log(chalk.blue("========== 寻找数据成功 ========"));
      const data = await this._getBrowserData();
      if (data) {
        this._saveDataToDataBase(data);
        this.redirect();
      }
    } catch (error) {
      if (
        error.message === "Navigation Timeout Exceeded: 30000ms exceeded" ||
        error.message.includes(`waiting for selector`)
      ) {
        console.log("restarting");
        this.start();
      }
      console.log(chalk.red(error.message));
    }
  }
  /**  End of Start Function **/
}

/**  Start of Run Function **/
function run() {
  let newApp = new App();
  newApp.start();
}
/**  End of Run Function **/

run();
