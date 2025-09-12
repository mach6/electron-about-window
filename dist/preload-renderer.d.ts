import { AboutWindowInfo } from './index.js';
export type PreloadRendererHook = (info: AboutWindowInfo, app_name: string, version: string) => void;
export declare function registerPreloadRendererHook(hook: PreloadRendererHook): void;
