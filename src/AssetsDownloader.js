const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tar = require('tar-fs')

/**
 * Download Launcher Assets of a game
 */
class AssetsDownloader {
  /**
   *  Constructor of AssetsDownloader
   * @param {String} game - Name of the game
   * @param {String} hash - Hash id of the Launcher Assets (sha1)
   * @param {String} dest - Destination folder
   */
  constructor(game, hash, dest) {
    this.game = game;
    this.hash = hash;
    this.dest = dest;
  }

  /**
   * Run the download of the Launcher Assets
   * The download is finished after it resolve
   * @returns {Promise<Array<String>>} List of filenames being download
   */
  async run() {
    fs.mkdirSync(path.resolve(this.dest), { recursive: true });
    const files = [];

    const tarWriteStream = tar.extract(this.dest, { ignore: (name) => {
      files.push(name);
      return false; // ignore nothing
    }});

    const response = await axios({
      method: 'GET',
      url: `https://launcher.cdn.ankama.com/${this.game}/hashes/${this.hash.slice(0, 2)}/${this.hash}`,
      responseType: 'stream',
    });

    response.data.pipe(tarWriteStream);

    await new Promise((resolve) => {
      response.data.on('end', resolve);
    });

    return files;
  }
}

module.exports = AssetsDownloader;
