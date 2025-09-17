import { AboutWindowInfo } from 'mach6-electron-about-window';
import { registerPreloadRendererHook } from 'mach6-electron-about-window/preload-renderer';

// Example: A custom hook that modifies the DOM `title` element color to red.
registerPreloadRendererHook((_info: AboutWindowInfo, _app_name: string, _version: string) => {
    console.log('Custom Preload Renderer Hook');
    // Modify the DOM or perform other actions here
    const title_elem = document.querySelector('.title') as HTMLHeadingElement;
    title_elem.style.color = 'red';
});
