import { ipcRenderer, shell } from 'electron';
import { IPC_ABOUT_WINDOW_ADJUST, IPC_ABOUT_WINDOW_CLOSE, IPC_ABOUT_WINDOW_INFO, } from './index.js';
const preloadRendererHooks = [];
export function registerPreloadRendererHook(hook) {
    preloadRendererHooks.push(hook);
}
let resized = false;
init();
function init() {
    registerPreloadRendererHook(defaultPreloadRenderer);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    }
    else {
        ready();
    }
}
function ready() {
    ipcRenderer.send(IPC_ABOUT_WINDOW_INFO);
    ipcRenderer.once(IPC_ABOUT_WINDOW_INFO, (_event, result) => {
        for (const hook of preloadRendererHooks) {
            console.log('executing preload renderer hook', hook);
            hook(result.info, result.app_name, result.version);
        }
    });
}
function defaultPreloadRenderer(info, app_name, version) {
    console.log('default preload renderer implementation');
    const content = info.use_inner_html ? 'innerHTML' : 'innerText';
    document.title = info.win_options.title || `About ${app_name}`;
    const open_home = (e) => {
        console.log(`opening ${info.homepage}`);
        e.preventDefault();
        shell.openExternal(info.homepage);
    };
    document.title = info.win_options.title || `About ${app_name}`;
    console.log(`setting title to ${document.title}`);
    const title_elem = document.querySelector('.title');
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
    const copyright_elem = document.querySelector('.copyright');
    if (info.copyright) {
        copyright_elem[content] = info.copyright;
    }
    else if (info.license) {
        copyright_elem[content] = `Distributed under ${info.license} license.`;
    }
    const icon_elem = document.getElementById('app-icon');
    icon_elem.src = info.icon_path;
    if (info.description) {
        const desc_elem = document.querySelector('.description');
        desc_elem[content] = info.description;
    }
    if (info.bug_report_url) {
        const bug_report = document.querySelector('.bug-report-link');
        bug_report.innerText = info.bug_link_text || 'Report an issue';
        const open_bugs = (e) => {
            console.log(`opening ${info.bug_report_url}`);
            shell.openExternal(info.bug_report_url).then(() => {
            });
            e.preventDefault();
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
        const version_info = Array.isArray(info.use_version_info)
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
        const close_window = (e) => {
            console.log('closing...');
            ipcRenderer.send(IPC_ABOUT_WINDOW_CLOSE);
            e.preventDefault();
        };
        close_button.removeEventListener('click', close_window);
        close_button.addEventListener('click', close_window);
        buttons.appendChild(close_button);
        close_button.focus();
    }
}
//# sourceMappingURL=preload-renderer.js.map