const { Command } = require('commander');
const cliProgress = require('cli-progress');

const ReleaseDownloader = require('./ReleaseDownloader');
const AssetsDownloader = require('./AssetsDownloader');
const Cytrus = require('./Cytrus');

const program = new Command();

program.name('cytrus')
  .description('Cytrus cli')
  .version('1.0.0');

async function dlUpdate(game, platform, release, version, dest) {
  const update = new ReleaseDownloader(game, platform, release, version, dest);

  console.log(`downloading ${release} version ${version} of ${game} for ${platform}`);
  const progressBar = new cliProgress.Bar({
    format: `{bar} {percentage}% | {value}/{total} files | {nbDl} files downloading ({filenames})`,
    fps: 30,
  }, cliProgress.Presets.shades_classic);

  update.on('start', ({ total }) => {
    progressBar.start(total, 0, { nbDl: 0, filenames: '' });
  });
  update.on('progress', ({ nbFilesDownloaded, filesDownloading }) => {
    progressBar.update(nbFilesDownloaded, {
      filenames: filesDownloading.join(', '),
      nbDl: filesDownloading.length,
    });
  });
  await update.run();
  progressBar.stop();
}

program.command('download-assets')
  .description('Download assets of the game (hash or release)')
  .requiredOption('-g, --game <string>', 'game of assets')
  .option('-h, --hash <string>', 'hash of assets')
  .option('-r, --release <string>', 'release name of assets (main, beta, ...)')
  .option('-d, --dest <string>', 'destination directory (not specified = actual directory)', '')
  .action(async (options) => {
    let hash = options.hash;

    if (!hash && !options.release) {
      throw new Error('Missing release tag if no hash specified');
    }

    if (!hash) {
      const cytrus = new Cytrus();
      hash = (await cytrus.getData()).games[options.game].assets.meta[options.release];
    }

    const dl = new AssetsDownloader(options.game, hash, options.dest);
    await dl.run();
    console.log('download completed');
  });

program.command('download')
  .description('Download the release of the game (can specify version)')
  .requiredOption('-g, --game <string>', 'game to dl')
  .requiredOption('-r, --release <string>', 'release to dl (main, beta, ...)')
  .requiredOption('-p, --platform <string>', 'platform of the game (windows, linux, darwin, ...)')
  .option('-v, --version <string>', 'version of the game to dl (not specified = last version)')
  .option('-d, --dest <string>', 'destination directory (not specified = actual directory)', '')
  .action(async (options) => {
    let version = options.version;

    if (!version) {
      const cytrus = new Cytrus();
      version = (await cytrus.getData()).games[options.game].platforms[options.platform][options.release];
    }

    await dlUpdate(options.game, options.platform, options.release, version, options.dest);
  });

program.command('watch')
  .description('Watch update of a game')
  .requiredOption('-g, --game <string>', 'game to dl')
  .requiredOption('-r, --release <string>', 'release to dl (main, beta, ...)')
  .requiredOption('-p, --platform <string>', 'platform of the game (windows, linux, darwin, ...)')
  .option('-d, --dest <string>', 'destination directory (not specified = actual directory)', '')
  .option('-t, --time <number>', 'watch interval (in s)', 60)
  .action(async (options) => {
    const cytrus = new Cytrus();

    cytrus.on('release:update', async ({ game, releaseName, platform, version }) => {
      if (game === options.game && releaseName === options.release && platform === options.platform) {
        await dlUpdate(options.game, options.platform, options.release, version, options.dest);
        console.log('\nDownload finished, waiting next update');
      }
    });
    cytrus.watch(options.time * 1000);
    console.log(`Watching ${options.release} update of ${options.game} on ${options.platform}`);
  });

program.parse(process.argv);
