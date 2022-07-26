const axios = require('axios');
const fs = require('fs');
const path = require('path');
const events = require('events');
const tar = require('tar-fs')

class AssetsDownloader extends events.EventEmitter {
  constructor(game, hash, dest) {
    super();
    this.game = game;
    this.hash = hash;
    this.dest = dest;
  }

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

if (require.main === module) {
  async function main() {
    const Update = new AssetsDownloader('dofus', '8d6a163ef9c96bac3978b875f89c23a07c6d0c75', 'assets');

    const files = await Update.run();
    console.log(files);
    console.log('Update ended');
  }
  main();
}
