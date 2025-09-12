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
export declare const IPC_ABOUT_WINDOW_INFO = "about-window:info";
export declare const IPC_ABOUT_WINDOW_ADJUST = "about-window:adjust-window-size";
export declare const IPC_ABOUT_WINDOW_CLOSE = "about-window:close-window";
export default function openAboutWindow(info_or_img_path: AboutWindowInfo | string): Promise<Electron.BrowserWindow>;
