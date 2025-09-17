import path from 'path';
import { statSync, readFileSync } from 'fs';
async function detectPackageJson(specified_dir, app) {
    let pkg_path;
    if (specified_dir) {
        pkg_path = path.join(specified_dir, 'package.json');
        try {
            return JSON.parse(readFileSync(pkg_path, 'utf-8'));
        }
        catch {
            console.warn('about-window: package.json is not found in specified directory path: ' + specified_dir);
        }
    }
    const asar_app_path = path.join(app.getAppPath(), 'package.json');
    try {
        return JSON.parse(readFileSync(asar_app_path, 'utf-8'));
    }
    catch {
        let app_path = app.getAppPath();
        if (app_path.endsWith('.asar')) {
            app_path = path.dirname(app_path);
        }
        for (let i = 0; i < 5; i++) {
            const p = path.join(app_path, 'package.json');
            try {
                const stats = statSync(p);
                if (stats.isFile()) {
                    return JSON.parse(readFileSync(p, 'utf-8'));
                }
            }
            catch { }
            app_path = path.join(app_path, '..');
        }
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