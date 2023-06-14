declare class AssetsDownloader {
    private emitter;
    /**
     * @description Downloads Minecraft assets
     * @param {string} version - Minecraft version
     * @param {string} directoy - Path to the assets directory
     * @param {string} [baseUrl] - Base URL to download assets from
     * @example
     * const assets = new AssetsDownloader('1.16.5', './assets');
    */
    constructor(version: string, directoy: string, baseUrl?: string);
    on(event: 'progress' | 'done' | 'error', listener: (data: any) => void): void;
    private download;
    private getFileContent;
    private downloadFile;
}
export { AssetsDownloader };
//# sourceMappingURL=index.d.ts.map