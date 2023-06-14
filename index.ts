import fetch from 'node-fetch-commonjs';
import { EventEmitter } from 'node:events';
import path  from 'path';
import fs    from 'fs';

class AssetsDownloader {
    private emitter = new EventEmitter();

    /**
     * @description Downloads Minecraft assets
     * @param {string} version - Minecraft version
     * @param {string} directoy - Path to the assets directory
     * @param {string} [baseUrl] - Base URL to download assets from
     * @example
     * const assets = new AssetsDownloader('1.16.5', './assets');
    */
    constructor(version: string, directoy: string, baseUrl?: string) {
        this.download(version, directoy, baseUrl);
    }

    public on(event: 'progress' | 'done' | 'error', listener: (data: any) => void) {
        this.emitter.on(event, listener);
    }

    private async download(version: string, directoy: string, baseUrl?: string) {
        if (!fs.existsSync(directoy)) {
            fs.mkdirSync(directoy, { recursive: true });
        }

        if (!fs.existsSync(path.join(directoy, 'indexes'))) {
            fs.mkdirSync(path.join(directoy, 'indexes'), { recursive: true });
        }

        if (!fs.existsSync(path.join(directoy, 'objects'))) {
            fs.mkdirSync(path.join(directoy, 'objects'), { recursive: true });
        }

        const manifestJson = JSON.parse(await this.getFileContent('https://launchermeta.mojang.com/mc/game/version_manifest.json'));
        const ver = manifestJson.versions.find((v: any) => v.id === version);
        if (!ver || !ver.url) {
            this.emitter.emit('error', 'Version not found');
        }

        const pistonJson = JSON.parse(await this.getFileContent(ver.url));
        if (!pistonJson.assetIndex || !pistonJson.assetIndex.url) {
            this.emitter.emit('error', 'Asset index not found');
        }

        const assetsJson = JSON.parse(await this.downloadFile(pistonJson.assetIndex.url, path.join(directoy, 'indexes', `${ver.id}.json`)));
        const objects = assetsJson.objects;
        const objectsKeys = Object.keys(objects);
        const objectsLength = objectsKeys.length;

        let i = 0;
        for (const key of objectsKeys) {
            const object = objects[key];
            const objectUrl = `${baseUrl || 'https://resources.download.minecraft.net'}/${object.hash.substr(0, 2)}/${object.hash}`;
            const objectPath = path.join(directoy, 'objects', object.hash.substr(0, 2), object.hash);

            if (!fs.existsSync(path.join(directoy, 'objects', object.hash.substr(0, 2)))) {
                fs.mkdirSync(path.join(directoy, 'objects', object.hash.substr(0, 2)), { recursive: true });
            }

            await this.downloadFile(objectUrl, objectPath);
            i++;
            
            this.emitter.emit('progress', {
                total: objectsLength,
                current: i,
                percent: Math.round((i / objectsLength) * 100)
            });

            if (i === objectsLength) {
                this.emitter.emit('done');
            }
        }
    }

    private async getFileContent(url: string): Promise<string> {
        const response = await fetch(url);
        return await response.text();
    }

    private async downloadFile(url: string, directoy: string) {
        const file = fs.createWriteStream(directoy);
        return new Promise<string>((resolve, reject) => {
            fetch(url).then((response) => {
                response.body!.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(fs.readFileSync(directoy, 'utf-8'));
                });
            }).catch((error) => {
                reject(error);
            });
        });
    }
}

export { AssetsDownloader };
