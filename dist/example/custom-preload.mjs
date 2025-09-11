import { registerPreloadRendererHook } from '../src/preload-renderer';
registerPreloadRendererHook((_info, _app_name, _version) => {
    console.log('Custom Preload Renderer Hook');
    const title_elem = document.querySelector('.title');
    title_elem.style.color = 'red';
});
//# sourceMappingURL=custom-preload.js.map