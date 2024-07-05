import { buildTime, version, sourceUrl } from './version';

export const environment = {
    production: true,
    // base href is /static/LANG/
    assets: 'assets',
    workers: true,
    buildTime,
    version,
    sourceUrl
};
