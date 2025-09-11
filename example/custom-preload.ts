import { registerPreloadRendererHook } from '../src/preload-renderer';
import { AboutWindowInfo } from '../src';

registerPreloadRendererHook((_info: AboutWindowInfo, _app_name: string, _version: string) => {
    console.log('Custom Preload Renderer Hook');
    // Modify the DOM or perform other actions here
    const title_elem = document.querySelector('.title') as HTMLHeadingElement;
    title_elem.style.color = 'red';
});
