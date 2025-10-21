(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/admob-banner.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AdmobBanner": (()=>AdmobBanner)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$position$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$size$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
;
function AdmobBanner() {
    _s();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdmobBanner.useEffect": ()=>{
            let cancelled = false;
            ({
                "AdmobBanner.useEffect": async ()=>{
                    try {
                        const info = await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AdMob"].trackingAuthorizationStatus();
                        if (info.status === "notDetermined") {
                            await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AdMob"].requestTrackingAuthorization();
                        }
                        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AdMob"].initialize({
                            initializeForTesting: false
                        });
                        if (cancelled) return;
                        // Show banner
                        await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AdMob"].showBanner({
                            adId: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ADMOB_BANNER_ID || "ca-app-pub-3940256099942544/6300978111",
                            adSize: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$size$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BannerAdSize"].ADAPTIVE_BANNER,
                            position: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$position$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BannerAdPosition"].BOTTOM_CENTER,
                            margin: 0,
                            isTesting: !__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_ADMOB_BANNER_ID
                        });
                        // Heuristic: set a CSS var for bottom inset to avoid UI overlap with the banner.
                        // Adaptive banner heights typically ~50-80px depending on device density.
                        if (!cancelled && typeof document !== 'undefined') {
                            const approx = 64; // px, safe default
                            document.documentElement.style.setProperty('--admob-bottom-inset', `${approx}px`);
                            document.documentElement.classList.add('admob-banner-visible');
                        }
                    } catch (e) {
                    // ignore on web or if plugin not available
                    }
                }
            })["AdmobBanner.useEffect"]();
            return ({
                "AdmobBanner.useEffect": ()=>{
                    cancelled = true;
                    try {
                        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["AdMob"].removeBanner();
                    } catch  {}
                    if (typeof document !== 'undefined') {
                        document.documentElement.style.removeProperty('--admob-bottom-inset');
                        document.documentElement.classList.remove('admob-banner-visible');
                    }
                }
            })["AdmobBanner.useEffect"];
        }
    }["AdmobBanner.useEffect"], []);
    return null;
}
_s(AdmobBanner, "OD7bBpZva5O2jO+Puf00hKivP7c=");
_c = AdmobBanner;
var _c;
__turbopack_context__.k.register(_c, "AdmobBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/admob-banner.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/admob-banner.tsx [app-client] (ecmascript)"));
}}),
"[project]/node_modules/@capacitor-community/admob/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/*! Capacitor: https://capacitorjs.com/ - MIT License */ __turbopack_context__.s({
    "Capacitor": (()=>Capacitor),
    "CapacitorCookies": (()=>CapacitorCookies),
    "CapacitorException": (()=>CapacitorException),
    "CapacitorHttp": (()=>CapacitorHttp),
    "ExceptionCode": (()=>ExceptionCode),
    "WebPlugin": (()=>WebPlugin),
    "WebView": (()=>WebView),
    "buildRequestInit": (()=>buildRequestInit),
    "registerPlugin": (()=>registerPlugin)
});
var ExceptionCode;
(function(ExceptionCode) {
    /**
     * API is not implemented.
     *
     * This usually means the API can't be used because it is not implemented for
     * the current platform.
     */ ExceptionCode["Unimplemented"] = "UNIMPLEMENTED";
    /**
     * API is not available.
     *
     * This means the API can't be used right now because:
     *   - it is currently missing a prerequisite, such as network connectivity
     *   - it requires a particular platform or browser version
     */ ExceptionCode["Unavailable"] = "UNAVAILABLE";
})(ExceptionCode || (ExceptionCode = {}));
class CapacitorException extends Error {
    constructor(message, code, data){
        super(message);
        this.message = message;
        this.code = code;
        this.data = data;
    }
}
const getPlatformId = (win)=>{
    var _a, _b;
    if (win === null || win === void 0 ? void 0 : win.androidBridge) {
        return 'android';
    } else if ((_b = (_a = win === null || win === void 0 ? void 0 : win.webkit) === null || _a === void 0 ? void 0 : _a.messageHandlers) === null || _b === void 0 ? void 0 : _b.bridge) {
        return 'ios';
    } else {
        return 'web';
    }
};
const createCapacitor = (win)=>{
    const capCustomPlatform = win.CapacitorCustomPlatform || null;
    const cap = win.Capacitor || {};
    const Plugins = cap.Plugins = cap.Plugins || {};
    const getPlatform = ()=>{
        return capCustomPlatform !== null ? capCustomPlatform.name : getPlatformId(win);
    };
    const isNativePlatform = ()=>getPlatform() !== 'web';
    const isPluginAvailable = (pluginName)=>{
        const plugin = registeredPlugins.get(pluginName);
        if (plugin === null || plugin === void 0 ? void 0 : plugin.platforms.has(getPlatform())) {
            // JS implementation available for the current platform.
            return true;
        }
        if (getPluginHeader(pluginName)) {
            // Native implementation available.
            return true;
        }
        return false;
    };
    const getPluginHeader = (pluginName)=>{
        var _a;
        return (_a = cap.PluginHeaders) === null || _a === void 0 ? void 0 : _a.find((h)=>h.name === pluginName);
    };
    const handleError = (err)=>win.console.error(err);
    const registeredPlugins = new Map();
    const registerPlugin = (pluginName, jsImplementations = {})=>{
        const registeredPlugin = registeredPlugins.get(pluginName);
        if (registeredPlugin) {
            console.warn(`Capacitor plugin "${pluginName}" already registered. Cannot register plugins twice.`);
            return registeredPlugin.proxy;
        }
        const platform = getPlatform();
        const pluginHeader = getPluginHeader(pluginName);
        let jsImplementation;
        const loadPluginImplementation = async ()=>{
            if (!jsImplementation && platform in jsImplementations) {
                jsImplementation = typeof jsImplementations[platform] === 'function' ? jsImplementation = await jsImplementations[platform]() : jsImplementation = jsImplementations[platform];
            } else if (capCustomPlatform !== null && !jsImplementation && 'web' in jsImplementations) {
                jsImplementation = typeof jsImplementations['web'] === 'function' ? jsImplementation = await jsImplementations['web']() : jsImplementation = jsImplementations['web'];
            }
            return jsImplementation;
        };
        const createPluginMethod = (impl, prop)=>{
            var _a, _b;
            if (pluginHeader) {
                const methodHeader = pluginHeader === null || pluginHeader === void 0 ? void 0 : pluginHeader.methods.find((m)=>prop === m.name);
                if (methodHeader) {
                    if (methodHeader.rtype === 'promise') {
                        return (options)=>cap.nativePromise(pluginName, prop.toString(), options);
                    } else {
                        return (options, callback)=>cap.nativeCallback(pluginName, prop.toString(), options, callback);
                    }
                } else if (impl) {
                    return (_a = impl[prop]) === null || _a === void 0 ? void 0 : _a.bind(impl);
                }
            } else if (impl) {
                return (_b = impl[prop]) === null || _b === void 0 ? void 0 : _b.bind(impl);
            } else {
                throw new CapacitorException(`"${pluginName}" plugin is not implemented on ${platform}`, ExceptionCode.Unimplemented);
            }
        };
        const createPluginMethodWrapper = (prop)=>{
            let remove;
            const wrapper = (...args)=>{
                const p = loadPluginImplementation().then((impl)=>{
                    const fn = createPluginMethod(impl, prop);
                    if (fn) {
                        const p = fn(...args);
                        remove = p === null || p === void 0 ? void 0 : p.remove;
                        return p;
                    } else {
                        throw new CapacitorException(`"${pluginName}.${prop}()" is not implemented on ${platform}`, ExceptionCode.Unimplemented);
                    }
                });
                if (prop === 'addListener') {
                    p.remove = async ()=>remove();
                }
                return p;
            };
            // Some flair ✨
            wrapper.toString = ()=>`${prop.toString()}() { [capacitor code] }`;
            Object.defineProperty(wrapper, 'name', {
                value: prop,
                writable: false,
                configurable: false
            });
            return wrapper;
        };
        const addListener = createPluginMethodWrapper('addListener');
        const removeListener = createPluginMethodWrapper('removeListener');
        const addListenerNative = (eventName, callback)=>{
            const call = addListener({
                eventName
            }, callback);
            const remove = async ()=>{
                const callbackId = await call;
                removeListener({
                    eventName,
                    callbackId
                }, callback);
            };
            const p = new Promise((resolve)=>call.then(()=>resolve({
                        remove
                    })));
            p.remove = async ()=>{
                console.warn(`Using addListener() without 'await' is deprecated.`);
                await remove();
            };
            return p;
        };
        const proxy = new Proxy({}, {
            get (_, prop) {
                switch(prop){
                    // https://github.com/facebook/react/issues/20030
                    case '$$typeof':
                        return undefined;
                    case 'toJSON':
                        return ()=>({});
                    case 'addListener':
                        return pluginHeader ? addListenerNative : addListener;
                    case 'removeListener':
                        return removeListener;
                    default:
                        return createPluginMethodWrapper(prop);
                }
            }
        });
        Plugins[pluginName] = proxy;
        registeredPlugins.set(pluginName, {
            name: pluginName,
            proxy,
            platforms: new Set([
                ...Object.keys(jsImplementations),
                ...pluginHeader ? [
                    platform
                ] : []
            ])
        });
        return proxy;
    };
    // Add in convertFileSrc for web, it will already be available in native context
    if (!cap.convertFileSrc) {
        cap.convertFileSrc = (filePath)=>filePath;
    }
    cap.getPlatform = getPlatform;
    cap.handleError = handleError;
    cap.isNativePlatform = isNativePlatform;
    cap.isPluginAvailable = isPluginAvailable;
    cap.registerPlugin = registerPlugin;
    cap.Exception = CapacitorException;
    cap.DEBUG = !!cap.DEBUG;
    cap.isLoggingEnabled = !!cap.isLoggingEnabled;
    return cap;
};
const initCapacitorGlobal = (win)=>win.Capacitor = createCapacitor(win);
const Capacitor = /*#__PURE__*/ initCapacitorGlobal(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : {});
const registerPlugin = Capacitor.registerPlugin;
/**
 * Base class web plugins should extend.
 */ class WebPlugin {
    constructor(){
        this.listeners = {};
        this.retainedEventArguments = {};
        this.windowListeners = {};
    }
    addListener(eventName, listenerFunc) {
        let firstListener = false;
        const listeners = this.listeners[eventName];
        if (!listeners) {
            this.listeners[eventName] = [];
            firstListener = true;
        }
        this.listeners[eventName].push(listenerFunc);
        // If we haven't added a window listener for this event and it requires one,
        // go ahead and add it
        const windowListener = this.windowListeners[eventName];
        if (windowListener && !windowListener.registered) {
            this.addWindowListener(windowListener);
        }
        if (firstListener) {
            this.sendRetainedArgumentsForEvent(eventName);
        }
        const remove = async ()=>this.removeListener(eventName, listenerFunc);
        const p = Promise.resolve({
            remove
        });
        return p;
    }
    async removeAllListeners() {
        this.listeners = {};
        for(const listener in this.windowListeners){
            this.removeWindowListener(this.windowListeners[listener]);
        }
        this.windowListeners = {};
    }
    notifyListeners(eventName, data, retainUntilConsumed) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            if (retainUntilConsumed) {
                let args = this.retainedEventArguments[eventName];
                if (!args) {
                    args = [];
                }
                args.push(data);
                this.retainedEventArguments[eventName] = args;
            }
            return;
        }
        listeners.forEach((listener)=>listener(data));
    }
    hasListeners(eventName) {
        var _a;
        return !!((_a = this.listeners[eventName]) === null || _a === void 0 ? void 0 : _a.length);
    }
    registerWindowListener(windowEventName, pluginEventName) {
        this.windowListeners[pluginEventName] = {
            registered: false,
            windowEventName,
            pluginEventName,
            handler: (event)=>{
                this.notifyListeners(pluginEventName, event);
            }
        };
    }
    unimplemented(msg = 'not implemented') {
        return new Capacitor.Exception(msg, ExceptionCode.Unimplemented);
    }
    unavailable(msg = 'not available') {
        return new Capacitor.Exception(msg, ExceptionCode.Unavailable);
    }
    async removeListener(eventName, listenerFunc) {
        const listeners = this.listeners[eventName];
        if (!listeners) {
            return;
        }
        const index = listeners.indexOf(listenerFunc);
        this.listeners[eventName].splice(index, 1);
        // If there are no more listeners for this type of event,
        // remove the window listener
        if (!this.listeners[eventName].length) {
            this.removeWindowListener(this.windowListeners[eventName]);
        }
    }
    addWindowListener(handle) {
        window.addEventListener(handle.windowEventName, handle.handler);
        handle.registered = true;
    }
    removeWindowListener(handle) {
        if (!handle) {
            return;
        }
        window.removeEventListener(handle.windowEventName, handle.handler);
        handle.registered = false;
    }
    sendRetainedArgumentsForEvent(eventName) {
        const args = this.retainedEventArguments[eventName];
        if (!args) {
            return;
        }
        delete this.retainedEventArguments[eventName];
        args.forEach((arg)=>{
            this.notifyListeners(eventName, arg);
        });
    }
}
const WebView = /*#__PURE__*/ registerPlugin('WebView');
/******** END WEB VIEW PLUGIN ********/ /******** COOKIES PLUGIN ********/ /**
 * Safely web encode a string value (inspired by js-cookie)
 * @param str The string value to encode
 */ const encode = (str)=>encodeURIComponent(str).replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent).replace(/[()]/g, escape);
/**
 * Safely web decode a string value (inspired by js-cookie)
 * @param str The string value to decode
 */ const decode = (str)=>str.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
class CapacitorCookiesPluginWeb extends WebPlugin {
    async getCookies() {
        const cookies = document.cookie;
        const cookieMap = {};
        cookies.split(';').forEach((cookie)=>{
            if (cookie.length <= 0) return;
            // Replace first "=" with CAP_COOKIE to prevent splitting on additional "="
            let [key, value] = cookie.replace(/=/, 'CAP_COOKIE').split('CAP_COOKIE');
            key = decode(key).trim();
            value = decode(value).trim();
            cookieMap[key] = value;
        });
        return cookieMap;
    }
    async setCookie(options) {
        try {
            // Safely Encoded Key/Value
            const encodedKey = encode(options.key);
            const encodedValue = encode(options.value);
            // Clean & sanitize options
            const expires = `; expires=${(options.expires || '').replace('expires=', '')}`; // Default is "; expires="
            const path = (options.path || '/').replace('path=', ''); // Default is "path=/"
            const domain = options.url != null && options.url.length > 0 ? `domain=${options.url}` : '';
            document.cookie = `${encodedKey}=${encodedValue || ''}${expires}; path=${path}; ${domain};`;
        } catch (error) {
            return Promise.reject(error);
        }
    }
    async deleteCookie(options) {
        try {
            document.cookie = `${options.key}=; Max-Age=0`;
        } catch (error) {
            return Promise.reject(error);
        }
    }
    async clearCookies() {
        try {
            const cookies = document.cookie.split(';') || [];
            for (const cookie of cookies){
                document.cookie = cookie.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            }
        } catch (error) {
            return Promise.reject(error);
        }
    }
    async clearAllCookies() {
        try {
            await this.clearCookies();
        } catch (error) {
            return Promise.reject(error);
        }
    }
}
const CapacitorCookies = registerPlugin('CapacitorCookies', {
    web: ()=>new CapacitorCookiesPluginWeb()
});
// UTILITY FUNCTIONS
/**
 * Read in a Blob value and return it as a base64 string
 * @param blob The blob value to convert to a base64 string
 */ const readBlobAsBase64 = async (blob)=>new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>{
            const base64String = reader.result;
            // remove prefix "data:application/pdf;base64,"
            resolve(base64String.indexOf(',') >= 0 ? base64String.split(',')[1] : base64String);
        };
        reader.onerror = (error)=>reject(error);
        reader.readAsDataURL(blob);
    });
/**
 * Normalize an HttpHeaders map by lowercasing all of the values
 * @param headers The HttpHeaders object to normalize
 */ const normalizeHttpHeaders = (headers = {})=>{
    const originalKeys = Object.keys(headers);
    const loweredKeys = Object.keys(headers).map((k)=>k.toLocaleLowerCase());
    const normalized = loweredKeys.reduce((acc, key, index)=>{
        acc[key] = headers[originalKeys[index]];
        return acc;
    }, {});
    return normalized;
};
/**
 * Builds a string of url parameters that
 * @param params A map of url parameters
 * @param shouldEncode true if you should encodeURIComponent() the values (true by default)
 */ const buildUrlParams = (params, shouldEncode = true)=>{
    if (!params) return null;
    const output = Object.entries(params).reduce((accumulator, entry)=>{
        const [key, value] = entry;
        let encodedValue;
        let item;
        if (Array.isArray(value)) {
            item = '';
            value.forEach((str)=>{
                encodedValue = shouldEncode ? encodeURIComponent(str) : str;
                item += `${key}=${encodedValue}&`;
            });
            // last character will always be "&" so slice it off
            item.slice(0, -1);
        } else {
            encodedValue = shouldEncode ? encodeURIComponent(value) : value;
            item = `${key}=${encodedValue}`;
        }
        return `${accumulator}&${item}`;
    }, '');
    // Remove initial "&" from the reduce
    return output.substr(1);
};
/**
 * Build the RequestInit object based on the options passed into the initial request
 * @param options The Http plugin options
 * @param extra Any extra RequestInit values
 */ const buildRequestInit = (options, extra = {})=>{
    const output = Object.assign({
        method: options.method || 'GET',
        headers: options.headers
    }, extra);
    // Get the content-type
    const headers = normalizeHttpHeaders(options.headers);
    const type = headers['content-type'] || '';
    // If body is already a string, then pass it through as-is.
    if (typeof options.data === 'string') {
        output.body = options.data;
    } else if (type.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(options.data || {})){
            params.set(key, value);
        }
        output.body = params.toString();
    } else if (type.includes('multipart/form-data') || options.data instanceof FormData) {
        const form = new FormData();
        if (options.data instanceof FormData) {
            options.data.forEach((value, key)=>{
                form.append(key, value);
            });
        } else {
            for (const key of Object.keys(options.data)){
                form.append(key, options.data[key]);
            }
        }
        output.body = form;
        const headers = new Headers(output.headers);
        headers.delete('content-type'); // content-type will be set by `window.fetch` to includy boundary
        output.headers = headers;
    } else if (type.includes('application/json') || typeof options.data === 'object') {
        output.body = JSON.stringify(options.data);
    }
    return output;
};
// WEB IMPLEMENTATION
class CapacitorHttpPluginWeb extends WebPlugin {
    /**
     * Perform an Http request given a set of options
     * @param options Options to build the HTTP request
     */ async request(options) {
        const requestInit = buildRequestInit(options, options.webFetchExtra);
        const urlParams = buildUrlParams(options.params, options.shouldEncodeUrlParams);
        const url = urlParams ? `${options.url}?${urlParams}` : options.url;
        const response = await fetch(url, requestInit);
        const contentType = response.headers.get('content-type') || '';
        // Default to 'text' responseType so no parsing happens
        let { responseType = 'text' } = response.ok ? options : {};
        // If the response content-type is json, force the response to be json
        if (contentType.includes('application/json')) {
            responseType = 'json';
        }
        let data;
        let blob;
        switch(responseType){
            case 'arraybuffer':
            case 'blob':
                blob = await response.blob();
                data = await readBlobAsBase64(blob);
                break;
            case 'json':
                data = await response.json();
                break;
            case 'document':
            case 'text':
            default:
                data = await response.text();
        }
        // Convert fetch headers to Capacitor HttpHeaders
        const headers = {};
        response.headers.forEach((value, key)=>{
            headers[key] = value;
        });
        return {
            data,
            headers,
            status: response.status,
            url: response.url
        };
    }
    /**
     * Perform an Http GET request given a set of options
     * @param options Options to build the HTTP request
     */ async get(options) {
        return this.request(Object.assign(Object.assign({}, options), {
            method: 'GET'
        }));
    }
    /**
     * Perform an Http POST request given a set of options
     * @param options Options to build the HTTP request
     */ async post(options) {
        return this.request(Object.assign(Object.assign({}, options), {
            method: 'POST'
        }));
    }
    /**
     * Perform an Http PUT request given a set of options
     * @param options Options to build the HTTP request
     */ async put(options) {
        return this.request(Object.assign(Object.assign({}, options), {
            method: 'PUT'
        }));
    }
    /**
     * Perform an Http PATCH request given a set of options
     * @param options Options to build the HTTP request
     */ async patch(options) {
        return this.request(Object.assign(Object.assign({}, options), {
            method: 'PATCH'
        }));
    }
    /**
     * Perform an Http DELETE request given a set of options
     * @param options Options to build the HTTP request
     */ async delete(options) {
        return this.request(Object.assign(Object.assign({}, options), {
            method: 'DELETE'
        }));
    }
}
const CapacitorHttp = registerPlugin('CapacitorHttp', {
    web: ()=>new CapacitorHttpPluginWeb()
});
;
 //# sourceMappingURL=index.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/definitions.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "MaxAdContentRating": (()=>MaxAdContentRating)
});
var MaxAdContentRating;
(function(MaxAdContentRating) {
    /**
     * Content suitable for general audiences, including families.
     */ MaxAdContentRating["General"] = "General";
    /**
     * Content suitable for most audiences with parental guidance.
     */ MaxAdContentRating["ParentalGuidance"] = "ParentalGuidance";
    /**
     * Content suitable for teen and older audiences.
     */ MaxAdContentRating["Teen"] = "Teen";
    /**
     * Content suitable only for mature audiences.
     */ MaxAdContentRating["MatureAudience"] = "MatureAudience";
})(MaxAdContentRating || (MaxAdContentRating = {})); //# sourceMappingURL=definitions.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-options.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=banner-ad-options.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// This enum should be keep in sync with their native equivalents with the same name
__turbopack_context__.s({
    "BannerAdPluginEvents": (()=>BannerAdPluginEvents)
});
var BannerAdPluginEvents;
(function(BannerAdPluginEvents) {
    BannerAdPluginEvents["SizeChanged"] = "bannerAdSizeChanged";
    BannerAdPluginEvents["Loaded"] = "bannerAdLoaded";
    BannerAdPluginEvents["FailedToLoad"] = "bannerAdFailedToLoad";
    /**
     * Open "Adsense" Event after user click banner
     */ BannerAdPluginEvents["Opened"] = "bannerAdOpened";
    /**
     * Close "Adsense" Event after user click banner
     */ BannerAdPluginEvents["Closed"] = "bannerAdClosed";
    /**
     * Similarly, this method should be called when an impression is recorded for the ad by the mediated SDK.
     */ BannerAdPluginEvents["AdImpression"] = "bannerAdImpression";
})(BannerAdPluginEvents || (BannerAdPluginEvents = {})); //# sourceMappingURL=banner-ad-plugin-events.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 * @see https://developer.android.com/reference/android/widget/LinearLayout#attr_android:gravity
 */ __turbopack_context__.s({
    "BannerAdPosition": (()=>BannerAdPosition)
});
var BannerAdPosition;
(function(BannerAdPosition) {
    /**
     * Banner position be top-center
     */ BannerAdPosition["TOP_CENTER"] = "TOP_CENTER";
    /**
     * Banner position be center
     */ BannerAdPosition["CENTER"] = "CENTER";
    /**
     * Banner position be bottom-center(default)
     */ BannerAdPosition["BOTTOM_CENTER"] = "BOTTOM_CENTER";
})(BannerAdPosition || (BannerAdPosition = {})); //# sourceMappingURL=banner-ad-position.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 *  For more information:
 *  https://developers.google.com/admob/ios/banner#banner_sizes
 *  https://developers.google.com/android/reference/com/google/android/gms/ads/AdSize
 *
 * */ __turbopack_context__.s({
    "BannerAdSize": (()=>BannerAdSize)
});
var BannerAdSize;
(function(BannerAdSize) {
    /**
     * Mobile Marketing Association (MMA)
     * banner ad size (320x50 density-independent pixels).
     */ BannerAdSize["BANNER"] = "BANNER";
    /**
     * Interactive Advertising Bureau (IAB)
     * full banner ad size (468x60 density-independent pixels).
     */ BannerAdSize["FULL_BANNER"] = "FULL_BANNER";
    /**
     * Large banner ad size (320x100 density-independent pixels).
     */ BannerAdSize["LARGE_BANNER"] = "LARGE_BANNER";
    /**
     * Interactive Advertising Bureau (IAB)
     * medium rectangle ad size (300x250 density-independent pixels).
     */ BannerAdSize["MEDIUM_RECTANGLE"] = "MEDIUM_RECTANGLE";
    /**
     * Interactive Advertising Bureau (IAB)
     * leaderboard ad size (728x90 density-independent pixels).
     */ BannerAdSize["LEADERBOARD"] = "LEADERBOARD";
    /**
     * A dynamically sized banner that is full-width and auto-height.
     */ BannerAdSize["ADAPTIVE_BANNER"] = "ADAPTIVE_BANNER";
    /**
     * @deprecated
     * Will be removed in next AdMob versions use `ADAPTIVE_BANNER`
     * Screen width x 32|50|90
     */ BannerAdSize["SMART_BANNER"] = "SMART_BANNER";
})(BannerAdSize || (BannerAdSize = {})); //# sourceMappingURL=banner-ad-size.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-definitions.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=banner-definitions.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-size.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=banner-size.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$position$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$size$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$size$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-size.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/banner/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$position$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-position.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$ad$2d$size$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-ad-size.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$banner$2d$size$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/banner-size.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// This enum should be keep in sync with their native equivalents with the same name
__turbopack_context__.s({
    "InterstitialAdPluginEvents": (()=>InterstitialAdPluginEvents)
});
var InterstitialAdPluginEvents;
(function(InterstitialAdPluginEvents) {
    /**
     * Emits after trying to prepare and Interstitial, when it is loaded and ready to be show
     */ InterstitialAdPluginEvents["Loaded"] = "interstitialAdLoaded";
    /**
     * Emits after trying to prepare and Interstitial, when it could not be loaded
     */ InterstitialAdPluginEvents["FailedToLoad"] = "interstitialAdFailedToLoad";
    /**
     * Emits when the Interstitial ad is visible to the user
     */ InterstitialAdPluginEvents["Showed"] = "interstitialAdShowed";
    /**
     * Emits when the Interstitial ad is failed to show
     */ InterstitialAdPluginEvents["FailedToShow"] = "interstitialAdFailedToShow";
    /**
     * Emits when the Interstitial ad is not visible to the user anymore.
     */ InterstitialAdPluginEvents["Dismissed"] = "interstitialAdDismissed";
})(InterstitialAdPluginEvents || (InterstitialAdPluginEvents = {})); //# sourceMappingURL=interstitial-ad-plugin-events.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-definitions.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=interstitial-definitions.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$interstitial$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$interstitial$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-definitions.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$interstitial$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$interstitial$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/interstitial-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// This enum should be keep in sync with their native equivalents with the same name
__turbopack_context__.s({
    "RewardInterstitialAdPluginEvents": (()=>RewardInterstitialAdPluginEvents)
});
var RewardInterstitialAdPluginEvents;
(function(RewardInterstitialAdPluginEvents) {
    /**
     * Emits after trying to prepare a RewardAd and the Video is loaded and ready to be show
     */ RewardInterstitialAdPluginEvents["Loaded"] = "onRewardedInterstitialAdLoaded";
    /**
     * Emits after trying to prepare a RewardAd when it could not be loaded
     */ RewardInterstitialAdPluginEvents["FailedToLoad"] = "onRewardedInterstitialAdFailedToLoad";
    /**
     * Emits when the AdReward video is visible to the user
     */ RewardInterstitialAdPluginEvents["Showed"] = "onRewardedInterstitialAdShowed";
    /**
     * Emits when the AdReward video is failed to show
     */ RewardInterstitialAdPluginEvents["FailedToShow"] = "onRewardedInterstitialAdFailedToShow";
    /**
     * Emits when the AdReward video is not visible to the user anymore.
     *
     * **Important**: This has nothing to do with the reward it self. This event
     * will emits in this two cases:
     * 1. The user starts the video ad but close it before the reward emit.
     * 2. The user start the video and see it until end, then gets the reward
     * and after that the ad is closed.
     */ RewardInterstitialAdPluginEvents["Dismissed"] = "onRewardedInterstitialAdDismissed";
    /**
     * Emits when user get rewarded from AdReward
     */ RewardInterstitialAdPluginEvents["Rewarded"] = "onRewardedInterstitialAdReward";
})(RewardInterstitialAdPluginEvents || (RewardInterstitialAdPluginEvents = {})); //# sourceMappingURL=reward-interstitial-ad-plugin-events.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-definitions.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-interstitial-definitions.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-item.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-interstitial-item.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-options.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-interstitial-ad-options.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$item$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-item.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-options.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$item$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-item.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$reward$2d$interstitial$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/reward-interstitial-ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// This enum should be keep in sync with their native equivalents with the same name
__turbopack_context__.s({
    "RewardAdPluginEvents": (()=>RewardAdPluginEvents)
});
var RewardAdPluginEvents;
(function(RewardAdPluginEvents) {
    /**
     * Emits after trying to prepare a RewardAd and the Video is loaded and ready to be show
     */ RewardAdPluginEvents["Loaded"] = "onRewardedVideoAdLoaded";
    /**
     * Emits after trying to prepare a RewardAd when it could not be loaded
     */ RewardAdPluginEvents["FailedToLoad"] = "onRewardedVideoAdFailedToLoad";
    /**
     * Emits when the AdReward video is visible to the user
     */ RewardAdPluginEvents["Showed"] = "onRewardedVideoAdShowed";
    /**
     * Emits when the AdReward video is failed to show
     */ RewardAdPluginEvents["FailedToShow"] = "onRewardedVideoAdFailedToShow";
    /**
     * Emits when the AdReward video is not visible to the user anymore.
     *
     * **Important**: This has nothing to do with the reward it self. This event
     * will emits in this two cases:
     * 1. The user starts the video ad but close it before the reward emit.
     * 2. The user start the video and see it until end, then gets the reward
     * and after that the ad is closed.
     */ RewardAdPluginEvents["Dismissed"] = "onRewardedVideoAdDismissed";
    /**
     * Emits when user get rewarded from AdReward
     */ RewardAdPluginEvents["Rewarded"] = "onRewardedVideoAdReward";
})(RewardAdPluginEvents || (RewardAdPluginEvents = {})); //# sourceMappingURL=reward-ad-plugin-events.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-definitions.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-definitions.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-item.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-item.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-options.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=reward-ad-options.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$item$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-item.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-options.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/reward/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$ad$2d$plugin$2d$events$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-plugin-events.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$definitions$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-definitions.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$item$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-item.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$reward$2d$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/reward-ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 *  For more information:
 *  https://developers.google.com/admob/unity/reference/namespace/google-mobile-ads/ump/api#consentstatus
 *
 * */ __turbopack_context__.s({
    "AdmobConsentStatus": (()=>AdmobConsentStatus)
});
var AdmobConsentStatus;
(function(AdmobConsentStatus) {
    /**
     * User consent not required.
     */ AdmobConsentStatus["NOT_REQUIRED"] = "NOT_REQUIRED";
    /**
     * User consent already obtained.
     */ AdmobConsentStatus["OBTAINED"] = "OBTAINED";
    /**
     * User consent required but not yet obtained.
     */ AdmobConsentStatus["REQUIRED"] = "REQUIRED";
    /**
     * Unknown consent status, AdsConsent.requestInfoUpdate needs to be called to update it.
     */ AdmobConsentStatus["UNKNOWN"] = "UNKNOWN";
})(AdmobConsentStatus || (AdmobConsentStatus = {})); //# sourceMappingURL=consent-status.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/**
 *  For more information:
 *  https://developers.google.com/admob/unity/reference/namespace/google-mobile-ads/ump/api#debuggeography
 *
 * */ __turbopack_context__.s({
    "AdmobConsentDebugGeography": (()=>AdmobConsentDebugGeography)
});
var AdmobConsentDebugGeography;
(function(AdmobConsentDebugGeography) {
    /**
     * Debug geography disabled.
     */ AdmobConsentDebugGeography[AdmobConsentDebugGeography["DISABLED"] = 0] = "DISABLED";
    /**
     * Geography appears as in EEA for debug devices.
     */ AdmobConsentDebugGeography[AdmobConsentDebugGeography["EEA"] = 1] = "EEA";
    /**
     * Geography appears as not in EEA for debug devices.
     */ AdmobConsentDebugGeography[AdmobConsentDebugGeography["NOT_EEA"] = 2] = "NOT_EEA";
})(AdmobConsentDebugGeography || (AdmobConsentDebugGeography = {})); //# sourceMappingURL=consent-debug-geography.enum.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-request-options.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=consent-request-options.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-info.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=consent-info.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-definition.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=consent-definition.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$status$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$debug$2d$geography$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$request$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-request-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$info$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-info.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$definition$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-definition.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/consent/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$status$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-status.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$debug$2d$geography$2e$enum$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$request$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-request-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$info$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-info.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$consent$2d$definition$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/consent-definition.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-load-info.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=ad-load-info.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-options.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=ad-options.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/shared/admob-error.interface.js [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
;
 //# sourceMappingURL=admob-error.interface.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/shared/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$ad$2d$load$2d$info$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-load-info.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$admob$2d$error$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/admob-error.interface.js [app-client] (ecmascript)"); //# sourceMappingURL=index.js.map
;
;
;
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/shared/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$ad$2d$load$2d$info$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-load-info.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$ad$2d$options$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/ad-options.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$admob$2d$error$2e$interface$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/admob-error.interface.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/index.js [app-client] (ecmascript) <locals>");
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/index.js [app-client] (ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "AdMob": (()=>AdMob)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/index.js [app-client] (ecmascript) <module evaluation>");
;
const AdMob = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["registerPlugin"])('AdMob', {
    web: ()=>__turbopack_context__.r("[project]/node_modules/@capacitor-community/admob/dist/esm/web.js [app-client] (ecmascript, async loader)")(__turbopack_context__.i).then((m)=>new m.AdMobWeb())
});
;
;
;
;
;
;
;
;
 //# sourceMappingURL=index.js.map
}}),
"[project]/node_modules/@capacitor-community/admob/dist/esm/index.js [app-client] (ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$node_modules$2f40$capacitor$2f$core$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$definitions$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/definitions.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$banner$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/banner/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/interstitial/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2d$interstitial$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward-interstitial/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$reward$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/reward/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$consent$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/consent/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$shared$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/shared/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$capacitor$2d$community$2f$admob$2f$dist$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@capacitor-community/admob/dist/esm/index.js [app-client] (ecmascript) <locals>");
}}),
}]);

//# sourceMappingURL=_28874a5e._.js.map