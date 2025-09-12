import path from 'path';
import { statSync } from 'fs';
async function loadPackageJson(pkg_path) {
    try {
        return (await import(pkg_path, { with: { type: 'json' } })).default;
    }
    catch (e) {
        try {
            return (await import(pkg_path)).default;
        }
        catch (e2) {
            return null;
        }
    }
}
async function detectPackageJson(specified_dir, app) {
    if (specified_dir) {
        const pkg = await loadPackageJson(path.join(specified_dir, 'package.json'));
        if (pkg !== null) {
            return pkg;
        }
        else {
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
                    if (pkg.productName === app_name || pkg.name === app_name) {
                        return pkg;
                    }
                }
            }
        }
        catch (e) {
        }
        app_path = path.join(app_path, '..');
    }
    return null;
}
export async function injectInfoFromPackageJson(info, app) {
    const pkg = await detectPackageJson(info.package_json_dir, app);
    if (pkg === null) {
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
//# sourceMappingURL=package.js.map