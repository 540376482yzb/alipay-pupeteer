const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const chalk = require('chalk');

// TODO: Set up username and password
const USERNAME = '';
const PASSWORD = '';

getData = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false
    });

    const page = await browser.newPage();

    await page.emulate(devices['iPad']);

    //await page.goto('https://auth.alipay.com/login/index.htm?goto=https%3A%2F%2Fwww.alipay.com%2F&fbclid=IwAR2gunoIayic4A9YVdVXVUrlkJYOCPC5MjbufeToiQGfQurLc-7L3hdit9g');
    //await page.goto('https://auth.alipay.com/login/index.htm?goto=https%3A%2F%2Fcustweb.alipay.com%2Faccount%2Findex.htm')
    //await page.goto('https://consumeprod.alipay.com/record/standard.htm')
    console.log(chalk.blue('========== 登入网页 ======='));
    await page.goto('https://auth.alipay.com/login/index.htm?goto=https%3A%2F%2Fconsumeprod.alipay.com%2Frecord%2Fstandard.htm')

    console.log(chalk.blue('========== 等待点击账号输入 ======='));
    await page.waitFor('#J-loginMethod-tabs > li:nth-child(2)');
    await page.click('#J-loginMethod-tabs > li:nth-child(2)');
    console.log(chalk.green('========== 点击成功 ======='));

    let example = await page.$('#J-checkcode-img');

    while (await example.isIntersectingViewport()) {
      // The element IS visible within the current viewport.
      console.log(chalk.blue('========== 有验证码 ========'));

      await page.reload();
      example = await page.$('#J-checkcode-img');
      await page.waitFor('#J-loginMethod-tabs > li:nth-child(2)');
      await page.click('#J-loginMethod-tabs > li:nth-child(2)');

      console.log(chalk.green('========== 点击成功 ======='));
    }

    console.log(chalk.green('========== 无验证码 ========'));

    console.log(chalk.blue('========== 输入账户开始 ========'));

    await page.waitFor('#J-input-user');
    await page.type('#J-input-user', USERNAME, { delay: 90 });

    console.log(chalk.green('========== 输入账户结束 ========'));

    console.log(chalk.blue('========== 输入密码开始 ========'));

    await page.waitFor('#password_rsainput');
    await page.type('#password_rsainput', PASSWORD, { delay: 100 });

    console.log(chalk.green('========== 输入密码结束 ========'));

    console.log(chalk.blue('========== 点击登入 ========'));

    await page.waitFor('#J-login-btn');
    await page.click('#J-login-btn');

    console.log(chalk.green('========== 登入成功 ========'));

    console.log(chalk.blue('========== 等待寻找数据 ========'));
    await page.waitForNavigation();

    await page.waitFor('#J_home-record-container');

    console.log(chalk.blue('========== 寻找数据成功 ========'));

    const data = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('table tr td'))
      return tds.map(td => td.innerHTML);
    });

    console.log(data);
  } catch (e) {
    console.log(chalk.red(e));
  }
};

getData();