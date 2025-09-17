import { ipcRenderer, shell, IpcRendererEvent } from 'electron';
import {
    AboutWindowInfo,
    AboutWindowInfoReturnValue,
    IPC_ABOUT_WINDOW_ADJUST,
    IPC_ABOUT_WINDOW_CLOSE,
    IPC_ABOUT_WINDOW_INFO,
} from './index.js';

// Define types for the hook functions
export type PreloadRendererHook = (info: AboutWindowInfo, app_name: string, version: string) => void;

// Create an array to store the hook functions
const preloadRendererHooks: PreloadRendererHook[] = [];

// Function to register hook functions
export function registerPreloadRendererHook(hook: PreloadRendererHook) {
    preloadRendererHooks.push(hook);
}

let resized: boolean = false;
init();

function init() {
    // Register the default implementation as the first hook
    registerPreloadRendererHook(defaultPreloadRenderer);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }
}

function ready() {
    ipcRenderer.send(IPC_ABOUT_WINDOW_INFO);
    ipcRenderer.once(IPC_ABOUT_WINDOW_INFO, (_event: IpcRendererEvent, result: AboutWindowInfoReturnValue) => {
        for (const hook of preloadRendererHooks) {
            console.log('executing preload renderer hook', hook);
            hook(result.info, result.app_name, result.version);
        }
    });
}

// Default implementation
function defaultPreloadRenderer(info: AboutWindowInfo, app_name: string, version: string) {
    console.log('default preload renderer implementation');

    const content = info.use_inner_html ? 'innerHTML' : 'innerText';
    document.title = info.win_options.title || `About ${app_name}`;

    const open_home = (e: Event) => {
        e.preventDefault();
        console.log(`opening ${info.homepage}`);
        shell.openExternal(info.homepage);
    };

    document.title = info.win_options.title || `About ${app_name}`;
    console.log(`setting title to ${document.title}`);
    const title_elem = document.querySelector('.title') as HTMLHeadingElement;
    title_elem.innerText = `${app_name} ${version}`;

    if (info.homepage) {
        title_elem.removeEventListener('click', open_home);
        title_elem.addEventListener('click', open_home);
        title_elem.classList.add('clickable');

        const logo_elem = document.querySelector('.logo');
        logo_elem.removeEventListener('click', open_home);
        logo_elem.addEventListener('click', open_home);
        logo_elem.classList.add('clickable');
    }

    const copyright_elem = document.querySelector('.copyright') as any;
    if (info.copyright) {
        copyright_elem[content] = info.copyright;
    } else if (info.license) {
        copyright_elem[content] = `Distributed under ${info.license} license.`;
    }

    const icon_elem = document.getElementById('app-icon') as HTMLImageElement;
    icon_elem.src = info.icon_path;

    if (info.description) {
        const desc_elem = document.querySelector('.description') as any;
        desc_elem[content] = info.description;
    }

    if (info.bug_report_url) {
        const bug_report = document.querySelector('.bug-report-link') as HTMLDivElement;
        bug_report.innerText = info.bug_link_text || 'Report an issue';

        const open_bugs = (e: Event) => {
            e.preventDefault();
            console.log(`opening ${info.bug_report_url}`);
            shell.openExternal(info.bug_report_url).then(() => {
                // nothing to do
            });
        };

        bug_report.removeEventListener('click', open_bugs);
        bug_report.addEventListener('click', open_bugs);
    }

    if (info.css_path) {
        const css_paths = !Array.isArray(info.css_path) ? [info.css_path] : info.css_path;
        for (const css_path of css_paths) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = css_path;
            document.head.appendChild(link);
        }
    }

    if (info.adjust_window_size && !resized) {
        const height = document.body.scrollHeight;
        const width = document.body.scrollWidth;
        ipcRenderer.send(IPC_ABOUT_WINDOW_ADJUST, height, width, !!info.show_close_button);
        resized = true;
    }

    if (!!info.use_version_info) {
        const versions = document.querySelector('.versions');
        const version_info: [string, string][] = Array.isArray(info.use_version_info)
            ? info.use_version_info
            : ['electron', 'chrome', 'node', 'v8'].map(e => [e, process.versions[e]]);
        for (const [name, value] of version_info) {
            const tr = document.createElement('tr');
            const name_td = document.createElement('td');
            name_td.innerText = name;
            tr.appendChild(name_td);
            const version_td = document.createElement('td');
            version_td.innerText = ' : ' + value;
            tr.appendChild(version_td);
            versions.appendChild(tr);
        }
    }

    if (info.show_close_button) {
        const buttons = document.querySelector('.buttons');
        const close_button = document.createElement('button');
        close_button.innerText = info.show_close_button;

        const close_window = (e: Event) => {
            e.preventDefault();
            console.log('closing...');
            ipcRenderer.send(IPC_ABOUT_WINDOW_CLOSE);
        };

        close_button.removeEventListener('click', close_window);
        close_button.addEventListener('click', close_window);
        buttons.appendChild(close_button);
        close_button.focus();
    }
}
