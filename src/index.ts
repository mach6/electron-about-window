import * as electron from 'electron';
import type { IpcMainEvent } from 'electron';
const { app: appMain, shell, ipcMain, BrowserWindow: BrowserWindowMain } = electron;

import path from 'path';
import { fileURLToPath } from 'url';
import { injectInfoFromPackageJson } from './package.js';

export interface AboutWindowInfo {
    icon_path: string;
    product_name?: string;
    copyright?: string;
    homepage?: string;
    description?: string;
    package_json_dir?: string;
    about_page_dir?: string;
    license?: string;
    bug_report_url?: string;
    css_path?: string | string[];
    adjust_window_size?: boolean;
    win_options?: Electron.BrowserWindowConstructorOptions;
    open_devtools?: boolean;
    use_inner_html?: boolean;
    bug_link_text?: string;
    use_version_info?: boolean | [string, string][];
    show_close_button?: string;
    app?: Electron.App;
    BrowserWindow?: typeof Electron.BrowserWindow;
    ipcMain?: Electron.IpcMain;
}

export interface AboutWindowInfoReturnValue {
    info: AboutWindowInfo;
    app_name: string;
    version: string;
}

export const IPC_ABOUT_WINDOW_INFO = 'about-window:info';
export const IPC_ABOUT_WINDOW_ADJUST = 'about-window:adjust-window-size';
export const IPC_ABOUT_WINDOW_CLOSE = 'about-window:close-window';

function normalizeParam(info_or_img_path: AboutWindowInfo | string | undefined | null): AboutWindowInfo {
    if (!info_or_img_path) {
        throw new Error('First parameter of openAboutWindow() must not be empty.');
    }

    if (typeof info_or_img_path === 'string') {
        return { icon_path: info_or_img_path };
    } else {
        const info = info_or_img_path;
        if (!info.icon_path) {
            throw new Error("First parameter of openAboutWindow() must have key 'icon_path'.");
        }
        return { ...info };
    }
}

export default async function openAboutWindow(
    info_or_img_path: AboutWindowInfo | string,
): Promise<Electron.BrowserWindow> {
    let window: Electron.BrowserWindow = null;
    let info = normalizeParam(info_or_img_path);

    const ipc = ipcMain ?? info.ipcMain;
    const app = appMain ?? info.app;
    const BrowserWindow = BrowserWindowMain ?? info.BrowserWindow;
    if (!app || !BrowserWindow || !ipc) {
        throw new Error(
            "openAboutWindow() is called on non-main process. Set 'app', " +
                "'BrowserWindow' and 'ipcMain' properties in the 'info' argument of the function call",
        );
    }

    if (window !== null) {
        window.focus();
        return window;
    }

    let base_path = info.about_page_dir;

    if (base_path === undefined || base_path === null || !base_path.length) {
        base_path = path.join(path.dirname(fileURLToPath(import.meta.url)), '.');
    }

    const options = Object.assign(
        {
            width: 400,
            height: 400,
            useContentSize: true,
            titleBarStyle: 'hidden-inset',
            show: !info.adjust_window_size,
            icon: info.icon_path,
            webPreferences: {
                // nodeIntegration can be safely enabled as long as the window source is not remote
                nodeIntegration: true,
                preload: path.join(base_path, 'preload-renderer.mjs'),
            },
        },
        info.win_options || {},
    );

    window = new BrowserWindow(options);

    window.setMenu(null);

    info = await injectInfoFromPackageJson(info, app);

    const on_win_adjust_req = (_: unknown, width: number, height: number, show_close_button: boolean) => {
        if (height > 0 && width > 0) {
            // Note:
            // Add 30px(= about 2em) to add padding in window, if there is a close button, bit more
            if (show_close_button) {
                window.setContentSize(width, height + 40);
            } else {
                window.setContentSize(width, height + 52);
            }
        }
    };
    const on_win_close_req = () => {
        if (window) {
            window.close();
        }
    };

    const index_html = 'file://' + path.join(base_path, 'about.html');
    window.loadURL(index_html);

    window.once('closed', () => {
        window = null;
        // ipc.removeListener(IPC_ABOUT_WINDOW_ADJUST, on_win_adjust_req);
        // ipc.removeListener(IPC_ABOUT_WINDOW_CLOSE, on_win_close_req);
        ipc.removeAllListeners(IPC_ABOUT_WINDOW_INFO);
    });

    const load = () => {
        if (info.open_devtools) {
            if (process.versions.electron >= '1.4') {
                window.webContents.openDevTools({ mode: 'detach' });
            } else {
                window.webContents.openDevTools();
            }
        }
    };

    ipc.on(IPC_ABOUT_WINDOW_INFO, (event: IpcMainEvent) => {
        const win_title = info.win_options ? info.win_options.title : null;
        delete info.win_options;
        info.win_options = { title: win_title };
        const app_name = info.product_name || app.name || app.getName();
        const version = app.getVersion();
        event.sender.send(IPC_ABOUT_WINDOW_INFO, { info, app_name, version } as AboutWindowInfoReturnValue);
    });

    window.webContents.once('did-finish-load', () => {
        ipc.once(IPC_ABOUT_WINDOW_ADJUST, on_win_adjust_req);
        ipc.once(IPC_ABOUT_WINDOW_CLOSE, on_win_close_req);

        load();
    });

    window.webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        shell.openExternal(url);
    });

    window.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    window.once('ready-to-show', () => {
        window.show();
    });

    return window;
}
