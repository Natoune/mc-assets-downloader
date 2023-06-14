"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetsDownloader = void 0;
const node_fetch_commonjs_1 = __importDefault(require("node-fetch-commonjs"));
const node_events_1 = require("node:events");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class AssetsDownloader {
    /**
     * @description Downloads Minecraft assets
     * @param {string} version - Minecraft version
     * @param {string} directoy - Path to the assets directory
     * @param {string} [baseUrl] - Base URL to download assets from
     * @example
     * const assets = new AssetsDownloader('1.16.5', './assets');
    */
    constructor(version, directoy, baseUrl) {
        this.emitter = new node_events_1.EventEmitter();
        this.download(version, directoy, baseUrl);
    }
    on(event, listener) {
        this.emitter.on(event, listener);
    }
    download(version, directoy, baseUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs_1.default.existsSync(directoy)) {
                fs_1.default.mkdirSync(directoy, { recursive: true });
            }
            if (!fs_1.default.existsSync(path_1.default.join(directoy, 'indexes'))) {
                fs_1.default.mkdirSync(path_1.default.join(directoy, 'indexes'), { recursive: true });
            }
            if (!fs_1.default.existsSync(path_1.default.join(directoy, 'objects'))) {
                fs_1.default.mkdirSync(path_1.default.join(directoy, 'objects'), { recursive: true });
            }
            const manifestJson = JSON.parse(yield this.getFileContent('https://launchermeta.mojang.com/mc/game/version_manifest.json'));
            const ver = manifestJson.versions.find((v) => v.id === version);
            if (!ver || !ver.url) {
                this.emitter.emit('error', 'Version not found');
            }
            const pistonJson = JSON.parse(yield this.getFileContent(ver.url));
            if (!pistonJson.assetIndex || !pistonJson.assetIndex.url) {
                this.emitter.emit('error', 'Asset index not found');
            }
            const assetsJson = JSON.parse(yield this.downloadFile(pistonJson.assetIndex.url, path_1.default.join(directoy, 'indexes', `${ver.id}.json`)));
            const objects = assetsJson.objects;
            const objectsKeys = Object.keys(objects);
            const objectsLength = objectsKeys.length;
            let i = 0;
            for (const key of objectsKeys) {
                const object = objects[key];
                const objectUrl = `${baseUrl || 'https://resources.download.minecraft.net'}/${object.hash.substr(0, 2)}/${object.hash}`;
                const objectPath = path_1.default.join(directoy, 'objects', object.hash.substr(0, 2), object.hash);
                if (!fs_1.default.existsSync(path_1.default.join(directoy, 'objects', object.hash.substr(0, 2)))) {
                    fs_1.default.mkdirSync(path_1.default.join(directoy, 'objects', object.hash.substr(0, 2)), { recursive: true });
                }
                yield this.downloadFile(objectUrl, objectPath);
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
        });
    }
    getFileContent(url) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield (0, node_fetch_commonjs_1.default)(url);
            return yield response.text();
        });
    }
    downloadFile(url, directoy) {
        return __awaiter(this, void 0, void 0, function* () {
            const file = fs_1.default.createWriteStream(directoy);
            return new Promise((resolve, reject) => {
                (0, node_fetch_commonjs_1.default)(url).then((response) => {
                    response.body.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(fs_1.default.readFileSync(directoy, 'utf-8'));
                    });
                }).catch((error) => {
                    reject(error);
                });
            });
        });
    }
}
exports.AssetsDownloader = AssetsDownloader;
