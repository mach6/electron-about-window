import { registerPreloadRendererHook } from 'mach6-electron-about-window/preload-renderer';
// Example: A custom hook that modifies the DOM `title` element color to red.
registerPreloadRendererHook((_info, _app_name, _version) => {
    console.log('Custom Preload Renderer Hook');
    // Modify the DOM or perform other actions here
    const title_elem = document.querySelector('.title');
    title_elem.style.color = 'red';
});
//# sourceMappingURL=custom-preload.js.map