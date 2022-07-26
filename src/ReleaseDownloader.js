const axios = require('axios');
const fs = require('fs');
const path = require('path');
const events = require('events');
const sha1File = require('sha1-file');
const pLimit = require('p-limit');

class ReleaseDownloader extends events.EventEmitter {
  constructor(game, platform, releaseName, version, dest, {
    ignoredFragments = ['win32'],
    maxConcurrentDl = 10,
  } = {}) {
    super();
    this.game = game;
    this.platform = platform;
    this.releaseName = releaseName;
    this.version = version;
    this.dest = dest;

    this.ignoredFragments = ignoredFragments;

    this.hashes = {};
    this.lastHashes = {};

    this.addQueue = pLimit(maxConcurrentDl);
  }

  getSavedHashes() {
    try {
      return JSON.parse(fs.readFileSync(path.join(this.dest, '.hashes.json')).toString());
    } catch (e) {
      return {};
    }
  }

  saveHashes() {
    fs.writeFileSync(path.join(this.dest, '.hashes.json'), JSON.stringify(this.hashes));
  }

  async getRemoteHashes() {
    return (await axios({
      method: 'GET',
      url: `https://launcher.cdn.ankama.com/${this.game}/releases/${this.releaseName}/${this.platform}/${this.version}.json`,
    })).data;
  }

  getHash(fragments, filepath) {
    for (const [_, fragment] of fragments) {
      if (fragment.files[filepath]) {
        return fragment.files[filepath].hash;
      }
    }
    return '';
  }

  checkChecksum(filename, hash) {
    try {
      const path = `${this.dest}/${filename}`;
      const actualhash = sha1File.sync(path);
      return actualhash !== hash;
    } catch (e) {
      return true;
    }
  }

  checkSize(filename, size) {
    const path = `${this.dest}/${filename}`;
    try {
      const stat = fs.statSync(path);
      return size !== stat.size;
    } catch(e) {
      return true;
    }
  }

  getFilesToUpdate() {
    const fragments = Object.entries(this.hashes).filter(([name]) => !this.ignoredFragments.includes(name));
    const lastFragments = Object.entries(this.lastHashes).filter(([name]) => !this.ignoredFragments.includes(name));

    const filesToUpdate = [];
    fragments.forEach(([_, fragment]) => {
      Object.entries(fragment.files).forEach(([filename, data]) => {
        const lastHash = this.getHash(lastFragments, filename);

        if ((!lastHash && (this.checkChecksum(filename, data.hash) || this.checkSize(filename, data.size)))
          || (lastHash && data.hash !== lastHash)) {
          filesToUpdate.push({
            filename,
            hash: data.hash,
            size: data.size,
          });
        }
      });
    });

    return filesToUpdate;
  }

  async dlFile(filename, hash) {
    this.filesInDl.push(filename);
    this.emit('progress', {
      nbFilesDownloaded: this.nbFilesDownloaded,
      filesDownloading: this.filesInDl,
    });

    const filepath = path.join(this.dest, filename);

    const response = await axios({
      method: 'GET',
      url: `https://launcher.cdn.ankama.com/${this.game}/hashes/${hash.slice(0, 2)}/${hash}`,
      responseType: 'stream',
    });
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.
    const writer = fs.createWriteStream(filepath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
        this.filesInDl.splice(this.filesInDl.indexOf(filename), 1);
        this.nbFilesDownloaded += 1;
        this.emit('progress', {
          nbFilesDownloaded: this.nbFilesDownloaded,
          filesDownloading: this.filesInDl,
        });
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  }

  async run() {
    this.lastHashes = this.getSavedHashes();
    this.hashes = await this.getRemoteHashes();

    this.filesToUpdate = this.getFilesToUpdate();

    fs.mkdirSync(path.resolve(this.dest), { recursive: true });

    const filesDL = [];
    const promises = [];
    this.nbFilesToDownload = this.filesToUpdate.length;
    this.filesInDl = [];
    this.nbFilesDownloaded = 0;

    this.emit('start', { total: this.nbFilesToDownload });

    for (const file of this.filesToUpdate) {
      promises.push(this.addQueue(() => this.dlFile(file.filename, file.hash)));
      filesDL.push(path.join(this.dest, file.filename));
    }

    await Promise.all(promises);
    this.saveHashes();
    return filesDL;
  }
}

module.exports = ReleaseDownloader;
