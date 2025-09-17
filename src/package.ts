import path from 'path';
import { statSync, readFileSync } from 'fs';
import { AboutWindowInfo } from './index';

interface LicenseEntry {
    type: string;
    url: string;
}

interface PackageJson {
    name?: string;
    productName?: string;
    description?: string;
    homepage?: string;
    license?: string | LicenseEntry;
    bugs?: {
        url: string;
    };
}

async function loadPackageJson(pkg_path: string): Promise<PackageJson> {
    try {
        const data = readFileSync(pkg_path, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
}

async function detectPackageJson(specified_dir: string, app: Electron.App) {
    if (specified_dir) {
        const pkg = await loadPackageJson(path.join(specified_dir, 'package.json'));
        if (pkg !== null) {
            return pkg;
        } else {
            console.warn('about-window: package.json is not found in specified directory path: ' + specified_dir);
        }
    }

    const app_name = app.name || app.getName();

    let app_path = app.getAppPath();
    if (app_path.endsWith('.asar')) {
        app_path = path.dirname(app_path);
    }

    for (let i = 0; i < 5; i++) {
        const p = path.join(app_path, 'package.json');
        try {
            const stats = statSync(p);
            if (stats.isFile()) {
                const pkg = await loadPackageJson(p);
                if (pkg !== null) {
                    // In case of monorepo, check app name
                    if (pkg.productName === app_name || pkg.name === app_name) {
                        return pkg;
                    }
                }
            }
        } catch (e) {
            // File not found. Ignored.
        }
        app_path = path.join(app_path, '..');
    }

    // Note: Not found.
    return null;
}

export async function injectInfoFromPackageJson(info: AboutWindowInfo, app: Electron.App) {
    const pkg = await detectPackageJson(info.package_json_dir, app);
    if (pkg === null) {
        // Note: Give up.
        return info;
    }

    if (!info.product_name) {
        info.product_name = pkg.productName;
    }
    if (!info.description) {
        info.description = pkg.description;
    }
    if (!info.license && pkg.license) {
        const l = pkg.license;
        info.license = typeof l === 'string' ? l : l.type;
    }
    if (!info.homepage) {
        info.homepage = pkg.homepage;
    }
    if (!info.bug_report_url && typeof pkg.bugs === 'object') {
        info.bug_report_url = pkg.bugs.url;
    }
    if (info.use_inner_html === undefined) {
        info.use_inner_html = false;
    }
    if (info.use_version_info === undefined) {
        info.use_version_info = true;
    }

    return info;
}
