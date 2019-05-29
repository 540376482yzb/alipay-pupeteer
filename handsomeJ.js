const puppeteer = require("puppeteer");
const devices = require("puppeteer/DeviceDescriptors");
const chalk = require("chalk");

// TODO: Set up username and password

class App {
  constructor() {
    this.page = null;
  }
  async init() {
    const browser = await puppeteer.launch({
      headless: false
    });
    this.page = await browser.newPage();
    await this.page.emulate(devices["iPad"]);
  }

  async redirect() {
    try {
      console.log(chalk.blue("========== 进入跳转 ========"));
      await this.page.goto("https://my.alipay.com/portal/i.htm");
      setTimeout(() => {
        this.start();
      }, 5000);
    } catch (err) {
      console.log(chalk.red("error when redirect"));
    }
  }

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
      const data = await this.page.evaluate(() => {
        const tds = Array.from(document.querySelectorAll("table tr td"));
        return tds.map(td => td.innerHTML);
      });
      if (data) {
        console.log("I got it");
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
}

function run() {
  var newApp = new App();
  newApp.start();
}

run();
