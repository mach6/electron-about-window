import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import openAboutWindow from '../dist/index.js';

// directory where this main.mjs (example) lives (ESM-safe)
const exampleDir = path.dirname(fileURLToPath(import.meta.url));

const { app, Menu, BrowserWindow, dialog } = electron;

app.once('window-all-closed', function () {
    app.quit();
});

app.once('ready', function () {
    let w = new BrowserWindow();
    w.once('closed', function () {
        w = null;
    });
    w.loadURL('file://' + path.join(exampleDir, 'index.html'));

    // Helper: ensure required example resources exist, otherwise show clear error
    async function ensureExampleResources(dir) {
        const { existsSync } = await import('fs').then(m => m);
        const iconPath = path.join(dir, 'icon.png');
        const pkgPath = path.join(dir, 'package.json');
        const missing = [];
        if (!existsSync(iconPath)) missing.push(`Icon file not found: ${iconPath}`);
        if (!existsSync(pkgPath)) missing.push(`package.json not found: ${pkgPath}`);
        if (missing.length) {
            const msg = 'Required files are missing in the example directory:\n' + missing.join('\n');
            console.error(msg);
            try {
                dialog.showErrorBox('Missing example files', msg);
            } catch (e) {
                // dialog may be unavailable in some contexts; ignore
            }
            return null;
        }
        return { iconPath, pkgDir: dir };
    }

    const menu = Menu.buildFromTemplate([
        {
            label: 'Example',
            submenu: [
                {
                    label: 'About This App',
                    click: async () => {
                        const paths = await ensureExampleResources(exampleDir);
                        if (!paths) return;
                        openAboutWindow({
                            icon_path: paths.iconPath,
                            copyright: 'Copyright (c) 2025 mach6',
                            package_json_dir: paths.pkgDir,
                            open_devtools: process.env.NODE_ENV !== 'production',
                        });
                    },
                },
                {
                    label: 'About This App (custom version entry)',
                    click: async () => {
                        const paths = await ensureExampleResources(exampleDir);
                        if (!paths) return;
                        openAboutWindow({
                            icon_path: paths.iconPath,
                            copyright: 'Copyright (c) 2025 mach6',
                            package_json_dir: paths.pkgDir,
                            use_version_info: [
                                ['my version entry 1', 'a.b.c'],
                                ['my version entry 2', 'x.y.z'],
                            ],
                        });
                    },
                },
                {
                    label: 'About This App (modal with close)',
                    click: async () => {
                        const paths = await ensureExampleResources(exampleDir);
                        if (!paths) return;
                        openAboutWindow({
                            icon_path: paths.iconPath,
                            copyright: 'Copyright (c) 2025 mach6',
                            package_json_dir: paths.pkgDir,
                            win_options: {
                                parent: w,
                                modal: true,
                            },
                            show_close_button: 'Close',
                        });
                    },
                },
                {
                    role: 'quit',
                },
            ],
        },
    ]);
    app.applicationMenu = menu;
});
