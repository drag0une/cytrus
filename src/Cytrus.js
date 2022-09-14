const axios = require('axios');
const fs = require('fs');
const path = require('path');
const events = require('events');
const pRetry = require('p-retry');

const CYTRUS_VERSION = 5;

/**
 * Assets update event
 *
 * @event Cytrus#assets:update
 * @type {object}
 * @property {String} game - Game name
 * @property {String} releaseName - Release name of the asset updated (ex: main/beta ...)
 * @property {String|undefined} hash - New hash of the asset (undefined if deleted)
 */

/**
 * Release update event
 *
 * @event Cytrus#release:update
 * @type {object}
 * @property {String} game - Game name
 * @property {String} platform - Platform of the release (ex: windows, darwin, linux ...)
 * @property {String} releaseName - Release name of the release updated (ex: main/beta ...)
 * @property {String|undefined} version - New hash of the release (undefined if deleted)
 */

/**
 * Watch a cytrus.json file
 * @fires Cytrus#assets:update
 * @fires Cytrus#release:update
 */
class Cytrus extends events.EventEmitter{
  /**
   * Constructor of the Cytrus class
   * @param {String} saveFolder - folder of where to save the last data of the remote cytrus.json file to not trigger at each cycle
   */
  constructor(saveFolder = path.resolve('.')) {
    super();
    this.saveFolder = saveFolder;
    this.lastModifiedHeader = null;
    this.lastData = this.getLastData();

    this.watchInterval = null;
  }

  getLastData() {
    try {
      return JSON.parse(fs.readFileSync(`${this.saveFolder}/cytrus.json`).toString().trim());
    } catch(e) {
      return {};
    }
  }

  getData() {
    return this.lastData;
  }

  saveData(data) {
    this.lastData = data;
    fs.writeFileSync(`${this.saveFolder}/cytrus.json`, JSON.stringify(data, null, 2));
  }

  /**
   * Watch remote cytrus.json file
   * @param {Number} interval - interval in ms
   */
  watch(interval) {
    if (this.watchInterval) {
      throw new Error('Cannot watch multiple times (memory leaks)');
    }

    this.watchInterval = setInterval(this.watcher.bind(this), interval);
    this.watcher();
  }

  /**
   * Remove the watcher of the remote cytrus.json file
   */
  unwatch() {
    clearInterval(this.watchInterval);
    this.watchInterval = null;
  }

  getReleaseMeta(game) {
    return (game && game.assets && game.assets.meta && Object.keys(game.assets.meta)) || [];
  }

  async watcher() {
    const response = await pRetry(() => axios({
      method: 'GET',
      url: 'https://launcher.cdn.ankama.com/cytrus.json',
    }), { retries: 3 });

    if (this.lastModifiedHeader !== response.headers['last-modified']) {
      const data = response.data || {};

      if (data.version !== CYTRUS_VERSION) {
        this.emit('error', new Error(`Cytrus version not supported: ${data.version}`));
        return;
      }

      // updated Games and deleted Games
      Object.entries(this.lastData.games || {}).forEach(([gameName, lastGame]) => {
        const lastMetaReleases = this.getReleaseMeta(lastGame);

        // Comparing meta
        lastMetaReleases.forEach((releaseName) => {
          const hash = data.games && data.games[gameName] && data.games[gameName].assets && data.games[gameName].assets.meta && data.games[gameName].assets.meta[releaseName];
          if (lastGame.assets.meta[releaseName] !== hash) {
            this.emit('assets:update', {
              game: gameName,
              releaseName,
              hash,
            });
          }
        });

        // Comparing games
        Object.entries(lastGame.platforms || {}).forEach(([platformName, platform]) => {
          Object.entries(platform).forEach(([releaseName, lastVersion]) => {
            const version = data.games && data.games[gameName] && data.games[gameName].platforms && data.games[gameName].platforms[platformName] && data.games[gameName].platforms[platformName][releaseName];
            if (lastVersion !== version) {
              this.emit('release:update', {
                game: gameName,
                platform: platformName,
                releaseName,
                version,
              });
            }
          });
        });
      });

      // new Games
      Object.entries(data.games || {}).forEach(([gameName, game]) => {
        const metaReleases = this.getReleaseMeta(game);

        // Comparing assets
        metaReleases.forEach((releaseName) => {
          const lastHash = this.lastData.games && this.lastData.games[gameName] && this.lastData.games[gameName].assets && this.lastData.games[gameName].assets.meta && this.lastData.games[gameName].assets.meta[releaseName];
          if (!lastHash) {
            this.emit('assets:update', {
              game: gameName,
              releaseName,
              hash: game.assets.meta[releaseName],
            });
          }
        });

        // Comparing games
        Object.entries(game.platforms || {}).forEach(([platformName, platform]) => {
          Object.entries(platform).forEach(([releaseName, version]) => {
            const lastVersion = this.lastData.games && this.lastData.games[gameName] && this.lastData.games[gameName].platforms && this.lastData.games[gameName].platforms[platformName] && this.lastData.games[gameName].platforms[platformName][releaseName];
            if (!lastVersion) {
              this.emit('release:update', {
                game: gameName,
                platform: platformName,
                releaseName,
                version,
              });
            }
          });
        });
      });

      this.lastModifiedHeader = response.headers['last-modified'];
      this.saveData(data);
    }
  }
}

module.exports = Cytrus;
