# Cytrus 

Cytrus allows you to watch available games and assets updates on the Ankama Launcher.
It also allows to download them.

Cytrus is available through a CLI and Class usable in your own code 


# Table of contents
* [Installation](#Installation)
* [CLI](#CLI)
* [Cytrus](#Cytrus)
* [ReleaseDownloader](#ReleaseDownloader)
* [AssetsDownloader](#AssetsDownloader)

<a name="Installation"></a>

## Installation

You can install the cytrus package with npm
```bash
npm i --save cytrus
```

If you want to use the cli everywhere you can add the **-g** option

<a name="CLI"></a>

## CLI
You can follow the instruction of the help command of the cli

```bash
cytrus --help
cytrus [command] --help
```

<a name="Cytrus"></a>

## Cytrus
Watch a cytrus.json file

**Kind**: global class  
**Emits**: [<code>assets:update</code>](#Cytrus+assets_update), [<code>release:update</code>](#Cytrus+release_update)  

* [Cytrus](#Cytrus)
    * [new Cytrus(saveFolder)](#new_Cytrus_new)
    * [.watch(interval)](#Cytrus+watch)
    * [.unwatch()](#Cytrus+unwatch)
    * ["assets:update"](#Cytrus+assets_update)
    * ["release:update"](#Cytrus+release_update)
    * [Exemple](#Cytrus+exemple)

<a name="new_Cytrus_new"></a>

### new Cytrus(saveFolder)
Constructor of the Cytrus class


| Param | Type | Description |
| --- | --- | --- |
| saveFolder | <code>String</code> | folder of where to save the last data of the remote cytrus.json file to not trigger at each cycle |

<a name="Cytrus+watch"></a>

### cytrus.watch(interval)
Watch remote cytrus.json file

**Kind**: instance method of [<code>Cytrus</code>](#Cytrus)  

| Param | Type | Description |
| --- | --- | --- |
| interval | <code>Number</code> | interval in ms |

<a name="Cytrus+unwatch"></a>

### cytrus.unwatch()
Remove the watcher of the remote cytrus.json file

**Kind**: instance method of [<code>Cytrus</code>](#Cytrus)  
<a name="Cytrus+assets_update"></a>

### "assets:update"
Assets update event

**Kind**: event emitted by [<code>Cytrus</code>](#Cytrus)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| game | <code>String</code> | Game name |
| releaseName | <code>String</code> | Release name of the asset updated (ex: main/beta ...) |
| hash | <code>String</code> \| <code>undefined</code> | New hash of the asset (undefined if deleted) |

<a name="Cytrus+release_update"></a>

### "release:update"
Release update event

**Kind**: event emitted by [<code>Cytrus</code>](#Cytrus)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| game | <code>String</code> | Game name |
| platform | <code>String</code> | Platform of the release (ex: windows, darwin, linux ...) |
| releaseName | <code>String</code> | Release name of the release updated (ex: main/beta ...) |
| version | <code>String</code> \| <code>undefined</code> | New hash of the release (undefined if deleted) |

<a name="Cytrus+exemple"></a>

### Exemple
```js
const { Cytrus } = require('cytrus');
const cytrus = new Cytrus();

cytrus.on('assets:update', ({ game, releaseName, hash }) => {
  // an update of assets is available
});
cytrus.on('release:update', ({ game, releaseName, platform, version }) => {
  // an update of game is available
});

cytrus.watch(60000); // 60 000 = 60 sec
```

<a name="ReleaseDownloader"></a>

## ReleaseDownloader
Download a release

**Kind**: global class  
**Emits**: [<code>start</code>](#ReleaseDownloader+event_start), [<code>progress</code>](#ReleaseDownloader+event_progress)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| nbFilesDownloaded | <code>Number</code> | Number of files already downloaded |
| nbFilesToDownload | <code>Number</code> | Number of files to update |
| filesToUpdate | <code>Array.&lt;File&gt;</code> | List of file needed to be updated |
| filesInDl | <code>Array.&lt;String&gt;</code> | List of filenames downloading |


* [ReleaseDownloader](#ReleaseDownloader)
    * [new ReleaseDownloader(game, platform, releaseName, version, dest, options)](#new_ReleaseDownloader_new)
    * [.run()](#ReleaseDownloader+run) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
    * ["start"](#ReleaseDownloader+event_start)
    * ["progress"](#ReleaseDownloader+event_progress)
    * [Exemple](#ReleaseDownloader+exemple)

<a name="new_ReleaseDownloader_new"></a>

### new ReleaseDownloader(game, platform, releaseName, version, dest, options)

| Param | Type | Description |
| --- | --- | --- |
| game | <code>String</code> | Name of the game (ex: dofus) |
| platform | <code>String</code> | Platform of the game (ex: windows/linux/darwin) |
| releaseName | <code>String</code> | Release of the game (ex: main/beta/...) |
| version | <code>String</code> | Version number (ex: 5.0_2.64.9.16) |
| dest | <code>String</code> | Destination folder |
| options | <code>Object</code> | Options of the Downloader (see each fields default) |
| options.ignoredFragments | <code>Array.&lt;String&gt;</code> | Fragments ignored (ex: ['win32'] for dofus) |
| options.maxConcurrentDl | <code>Number</code> | Maximum concurrent download (default: 10) |

<a name="ReleaseDownloader+run"></a>

### releaseDownloader.run() ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Run the update (download files...)
The update is finished after it resolve

**Kind**: instance method of [<code>ReleaseDownloader</code>](#ReleaseDownloader)  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - List of filenames being download  
<a name="ReleaseDownloader+event_start"></a>

### "start"
Starting download event

**Kind**: event emitted by [<code>ReleaseDownloader</code>](#ReleaseDownloader)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| total | <code>Number</code> | Total number of files to dl |

<a name="ReleaseDownloader+event_progress"></a>

### "progress"
Progress download event

**Kind**: event emitted by [<code>ReleaseDownloader</code>](#ReleaseDownloader)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| nbFilesDownloaded | <code>Number</code> | How many files are already downloaded |
| filesDownloading | <code>Array.&lt;String&gt;</code> | List of filenames downloading |

<a name="ReleaseDownloader+exemple"></a>

### Exemple

```js
const { ReleaseDownloader } = require('cytrus');
const update = new ReleaseDownloader(game, platform, release, version, dest);

update.on('start', ({ total }) => {
  // total {Number} = total number of files needed to be dl
});

update.on('progress', ({ nbFilesDownloaded, filesDownloading }) => {
  // nbFilesDownloaded {Number} = number of files being downloaded
  // filesDownloading {Array<string>} = filenames of file being downloaded 
});

await update.run();
// update is finished here
```

<a name="AssetsDownloader"></a>

## AssetsDownloader
Download Launcher Assets of a game

**Kind**: global class  

* [AssetsDownloader](#AssetsDownloader)
    * [new AssetsDownloader(game, hash, dest)](#new_AssetsDownloader_new)
    * [.run()](#AssetsDownloader+run) ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
    * [Exemple](#AssetsDownloader+exemple)

<a name="new_AssetsDownloader_new"></a>

### new AssetsDownloader(game, hash, dest)
Constructor of AssetsDownloader


| Param | Type | Description |
| --- | --- | --- |
| game | <code>String</code> | Name of the game |
| hash | <code>String</code> | Hash id of the Launcher Assets (sha1) |
| dest | <code>String</code> | Destination folder |

<a name="AssetsDownloader+run"></a>

### assetsDownloader.run() ⇒ <code>Promise.&lt;Array.&lt;String&gt;&gt;</code>
Run the download of the Launcher Assets
The download is finished after it resolve

**Kind**: instance method of [<code>AssetsDownloader</code>](#AssetsDownloader)  
**Returns**: <code>Promise.&lt;Array.&lt;String&gt;&gt;</code> - List of filenames being download  

<a name="AssetsDownloader+exemple"></a>

### Exemple

```js
const { AssetsDownloader } = require('cytrus');
const downloader = new AssetsDownloader(game, hash, dest);

await downloader.run();
// download is finished here
```
