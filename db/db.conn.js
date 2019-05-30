const redis = require("od-utility-redis");

class CrawlerDBService {
  constructor(hand_token) {
    this.hand_token = hand_token;
  }

  async saveLogs(logs = []) {
    if (!this.hand_token) {
      throw new Error("HAND TOKEN IS NOT INITIALIZED IN CRAWLER");
    }

    const oldLogs = await this.findLogs();
    const newLogs = [...oldLogs, ...logs];
    console.log("========  saving ...... =============");
    console.log(newLogs);
    console.log("========   =============");
    redis.setAsync("DB-LOG", this.hand_token, newLogs, 2592000);
  }

  async findLogs(hand_token) {
    if (!hand_token && !this.hand_token) {
      throw new Error("HAND TOKEN IS NOT INITIALIZED IN CRAWLER");
    }

    const logCache = await redis.getAsync("DB-LOG", hand_token || this.hand_token);
    console.log("========  finding logs ...... =============");
    console.log(logCache);
    console.log("========   =============");
    return logCache || [];
  }

  async compareLogs(logs = []) {
    if (!this.hand_token) {
      throw new Error("HAND TOKEN IS NOT INITIALIZED IN CRAWLER");
    }

    const newLogs = [];
    const cachedLogs = await this.findLogs();
    for (let log of logs) {
      const newLog = CrawlerDBService._diffLogInCache(log, cachedLogs);
      if (newLog) newLogs.push(newLog);
    }
    return newLogs;
  }

  static _diffLogInCache(log, cachedLogs) {
    let isSame = false;
    for (let cache of cachedLogs) {
      const hashLog = JSON.stringify(log);
      const cacheLog = JSON.stringify(cache);
      if (hashLog === cacheLog) {
        isSame = true;
      }
    }
    return isSame ? undefined : log;
  }
}

module.exports = CrawlerDBService;
