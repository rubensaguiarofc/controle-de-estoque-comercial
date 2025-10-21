(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/ui/alert.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Alert": (()=>Alert),
    "AlertDescription": (()=>AlertDescription),
    "AlertTitle": (()=>AlertTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const alertVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cva"])("relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", {
    variants: {
        variant: {
            default: "bg-background text-foreground",
            destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Alert = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, variant, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        role: "alert",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(alertVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 26,
        columnNumber: 3
    }, this));
_c1 = Alert;
Alert.displayName = "Alert";
const AlertTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h5", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mb-1 font-medium leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, this));
_c3 = AlertTitle;
AlertTitle.displayName = "AlertTitle";
const AlertDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm [&_p]:leading-relaxed", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/alert.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, this));
_c5 = AlertDescription;
AlertDescription.displayName = "AlertDescription";
;
var _c, _c1, _c2, _c3, _c4, _c5;
__turbopack_context__.k.register(_c, "Alert$React.forwardRef");
__turbopack_context__.k.register(_c1, "Alert");
__turbopack_context__.k.register(_c2, "AlertTitle$React.forwardRef");
__turbopack_context__.k.register(_c3, "AlertTitle");
__turbopack_context__.k.register(_c4, "AlertDescription$React.forwardRef");
__turbopack_context__.k.register(_c5, "AlertDescription");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/search-scanner-dialog.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "SearchScannerDialog": (()=>SearchScannerDialog)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/node_modules/@zxing/library/esm/index.js [app-client] (ecmascript) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$browser$2f$BrowserMultiFormatReader$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@zxing/library/esm/browser/BrowserMultiFormatReader.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$NotFoundException$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NotFoundException$3e$__ = __turbopack_context__.i("[project]/node_modules/@zxing/library/esm/core/NotFoundException.js [app-client] (ecmascript) <export default as NotFoundException>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__ = __turbopack_context__.i("[project]/node_modules/@zxing/library/esm/core/BarcodeFormat.js [app-client] (ecmascript) <export default as BarcodeFormat>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$DecodeHintType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DecodeHintType$3e$__ = __turbopack_context__.i("[project]/node_modules/@zxing/library/esm/core/DecodeHintType.js [app-client] (ecmascript) <export default as DecodeHintType>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/dialog.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/alert.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function SearchScannerDialog({ isOpen, onOpenChange, stockItems, onSuccess, onNotFound }) {
    _s();
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const [hasCameraPermission, setHasCameraPermission] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [featureSupported, setFeatureSupported] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [manualCode, setManualCode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const videoRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const codeReaderRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$browser$2f$BrowserMultiFormatReader$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["BrowserMultiFormatReader"]());
    const streamRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const stopCamera = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SearchScannerDialog.useCallback[stopCamera]": ()=>{
            if (streamRef.current) {
                streamRef.current.getTracks().forEach({
                    "SearchScannerDialog.useCallback[stopCamera]": (track)=>track.stop()
                }["SearchScannerDialog.useCallback[stopCamera]"]);
                streamRef.current = null;
            }
            codeReaderRef.current.reset();
        }
    }["SearchScannerDialog.useCallback[stopCamera]"], []);
    // debug logs collector to help capture runtime info for devices
    const debugLogsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])([]);
    const pushDebug = (event, detail)=>{
        try {
            debugLogsRef.current.push({
                t: new Date().toISOString(),
                event,
                detail
            });
            // keep last 200 entries max
            if (debugLogsRef.current.length > 200) debugLogsRef.current.shift();
        } catch (e) {
        // no-op
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchScannerDialog.useEffect": ()=>{
            if (!isOpen) {
                stopCamera();
                return;
            }
            // feature detection (guard against WebView/older browsers)
            if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setFeatureSupported(false);
                setHasCameraPermission(false);
                pushDebug('feature-detection', {
                    supported: false,
                    navigatorDefined: typeof navigator !== 'undefined'
                });
                return;
            }
            setFeatureSupported(true);
            pushDebug('feature-detection', {
                supported: true
            });
            let isMounted = true;
            const codeReader = codeReaderRef.current;
            const startScanner = {
                "SearchScannerDialog.useEffect.startScanner": async ()=>{
                    if (!isMounted) return;
                    try {
                        pushDebug('start-scanner-attempt');
                        // If running inside Capacitor native container, request native camera permission first
                        try {
                            const win = ("TURBOPACK compile-time truthy", 1) ? window : ("TURBOPACK unreachable", undefined);
                            if (win && win.Capacitor && win.Capacitor.isNativePlatform && win.Capacitor.isNativePlatform()) {
                                try {
                                    // dynamic import to avoid bundling on web
                                    const capModule = await __turbopack_context__.r("[project]/node_modules/@capacitor/core/dist/index.js [app-client] (ecmascript, async loader)")(__turbopack_context__.i).catch({
                                        "SearchScannerDialog.useEffect.startScanner": ()=>null
                                    }["SearchScannerDialog.useEffect.startScanner"]);
                                    const Capacitor = capModule?.Capacitor || window.Capacitor;
                                    const Plugins = capModule?.Plugins || window.Capacitor?.Plugins || window.Plugins;
                                    const Permissions = Plugins?.Permissions;
                                    if (Permissions) {
                                        // Query current permission first
                                        try {
                                            const query = await Permissions.query ? await Permissions.query({
                                                name: 'camera'
                                            }) : null;
                                            if (query && query.state === 'granted') {
                                                pushDebug('camera-permission', {
                                                    state: 'granted'
                                                });
                                            } else if (Permissions.request) {
                                                const permRes = await Permissions.request({
                                                    name: 'camera'
                                                });
                                                // Some Capacitor versions return { state: 'granted' } or { granted: true }
                                                const granted = permRes && (permRes.state === 'granted' || permRes.granted === true);
                                                if (!granted) {
                                                    pushDebug('camera-permission-denied', {
                                                        permRes
                                                    });
                                                    throw new Error('Native camera permission not granted');
                                                }
                                            }
                                        } catch (permErr) {
                                            pushDebug('capacitor-permission-error', {
                                                error: String(permErr)
                                            });
                                        // allow fallback to getUserMedia which might still work
                                        }
                                    }
                                } catch (capErr) {
                                    console.warn('Capacitor permission request failed:', capErr);
                                }
                            }
                        } catch (e) {
                        // ignore
                        }
                        pushDebug('requesting-getUserMedia');
                        let stream = null;
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({
                                video: {
                                    facingMode: 'environment'
                                }
                            });
                        } catch (gmErr) {
                            // map common errors for better UX
                            pushDebug('getUserMedia-error', {
                                error: String(gmErr)
                            });
                            // rethrow to be handled by outer catch
                            throw gmErr;
                        }
                        if (!isMounted) {
                            stream.getTracks().forEach({
                                "SearchScannerDialog.useEffect.startScanner": (track)=>track.stop()
                            }["SearchScannerDialog.useEffect.startScanner"]);
                            return;
                        }
                        setHasCameraPermission(true);
                        streamRef.current = stream;
                        pushDebug('stream-started', {
                            tracks: stream.getTracks().map({
                                "SearchScannerDialog.useEffect.startScanner": (t)=>({
                                        kind: t.kind,
                                        id: t.id
                                    })
                            }["SearchScannerDialog.useEffect.startScanner"])
                        });
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.setAttribute('playsinline', 'true');
                            await videoRef.current.play();
                        }
                        const hints = new Map();
                        const formats = [
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].EAN_13,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].EAN_8,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].UPC_A,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].UPC_E,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].CODE_128,
                            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$BarcodeFormat$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__BarcodeFormat$3e$__["BarcodeFormat"].QR_CODE
                        ];
                        hints.set(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$DecodeHintType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DecodeHintType$3e$__["DecodeHintType"].POSSIBLE_FORMATS, formats);
                        hints.set(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$DecodeHintType$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__DecodeHintType$3e$__["DecodeHintType"].TRY_HARDER, true);
                        await codeReader.decodeFromStream(stream, videoRef.current, {
                            "SearchScannerDialog.useEffect.startScanner": (result, err)=>{
                                if (result && isMounted) {
                                    pushDebug('decode-result', {
                                        text: result.getText()
                                    });
                                    const foundItem = stockItems.find({
                                        "SearchScannerDialog.useEffect.startScanner.foundItem": (item)=>item.barcode === result.getText()
                                    }["SearchScannerDialog.useEffect.startScanner.foundItem"]);
                                    if (foundItem) {
                                        onSuccess(foundItem);
                                    } else {
                                        onNotFound();
                                    }
                                }
                                if (err && !(err instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$zxing$2f$library$2f$esm$2f$core$2f$NotFoundException$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__NotFoundException$3e$__["NotFoundException"]) && isMounted) {
                                    pushDebug('decode-error', {
                                        error: String(err)
                                    });
                                    console.error('Search barcode scan error:', err);
                                }
                            }
                        }["SearchScannerDialog.useEffect.startScanner"]);
                    } catch (error) {
                        console.error('Error starting search camera stream:', error);
                        pushDebug('start-scanner-error', {
                            error: String(error)
                        });
                        if (isMounted) {
                            setHasCameraPermission(false);
                            // classify error and show clearer messages
                            const msg = error && error.name ? error.name : String(error);
                            if (msg === 'NotAllowedError' || msg === 'SecurityError' || msg === 'PermissionDeniedError') {
                                toast({
                                    variant: 'destructive',
                                    title: 'Permissão da Câmera Negada',
                                    description: 'Permita o uso da câmera nas configurações do dispositivo ou aplicativo. Use a entrada manual enquanto isso.'
                                });
                            } else if (msg === 'NotFoundError') {
                                toast({
                                    variant: 'destructive',
                                    title: 'Câmera Não Encontrada',
                                    description: 'Nenhuma câmera foi encontrada neste dispositivo.'
                                });
                            } else {
                                toast({
                                    variant: 'destructive',
                                    title: 'Erro ao acessar câmera',
                                    description: 'Não foi possível acessar a câmera. Use a entrada manual ou verifique permissões.'
                                });
                            }
                        }
                    }
                }
            }["SearchScannerDialog.useEffect.startScanner"];
            startScanner();
            return ({
                "SearchScannerDialog.useEffect": ()=>{
                    isMounted = false;
                    stopCamera();
                }
            })["SearchScannerDialog.useEffect"];
        }
    }["SearchScannerDialog.useEffect"], [
        isOpen,
        stockItems,
        onSuccess,
        onNotFound,
        stopCamera,
        onOpenChange,
        toast
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Dialog"], {
        open: isOpen,
        onOpenChange: onOpenChange,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogContent"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col items-center gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogHeader"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogTitle"], {
                                className: "text-center",
                                children: "Buscar Item por Código de Barras"
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 200,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$dialog$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DialogDescription"], {
                                className: "text-center",
                                children: "Aponte a câmera para o código de barras do item."
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 201,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative w-full aspect-video bg-card rounded-md overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("video", {
                                ref: videoRef,
                                className: "w-full h-full object-cover",
                                playsInline: true
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 204,
                                columnNumber: 13
                            }, this),
                            hasCameraPermission === null && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 flex items-center justify-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-foreground",
                                    children: "Solicitando acesso à câmera..."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                    lineNumber: 207,
                                    columnNumber: 11
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 206,
                                columnNumber: 9
                            }, this),
                            !featureSupported && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 flex items-center justify-center p-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-foreground text-center",
                                    children: "Seu navegador/WebView não suporta acesso à câmera (getUserMedia)."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                    lineNumber: 212,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 211,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute inset-0 flex items-center justify-center p-8",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-full max-w-xs h-24 border-4 border-dashed border-primary rounded-lg opacity-75 dark:border-primary"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                    lineNumber: 216,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 215,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute top-0 left-0 right-0 h-[2px] bg-destructive shadow-[0_0_10px_2px_#ef4444] animate-scan dark:bg-destructive"
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 218,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                        lineNumber: 203,
                        columnNumber: 11
                    }, this),
                    hasCameraPermission === false && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Alert"], {
                                variant: "destructive",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertTitle"], {
                                        children: "Acesso à Câmera Necessário"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                        lineNumber: 223,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$alert$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AlertDescription"], {
                                        children: "Permita acesso à câmera nas configurações ou use a entrada manual abaixo."
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                        lineNumber: 224,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 222,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-full max-w-md mt-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "block text-sm font-medium text-muted-foreground mb-2",
                                        children: "Código (entrada manual)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                value: manualCode,
                                                onChange: (e)=>setManualCode(e.target.value),
                                                className: "flex-1 input input-bordered",
                                                placeholder: "Cole ou digite o código de barras"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                                lineNumber: 230,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                type: "button",
                                                onClick: ()=>{
                                                    const found = stockItems.find((item)=>item.barcode === manualCode.trim());
                                                    stopCamera();
                                                    if (found) onSuccess(found);
                                                    else onNotFound();
                                                },
                                                children: "Buscar"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                                lineNumber: 236,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                        lineNumber: 229,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 mt-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                type: "button",
                                                variant: "ghost",
                                                onClick: ()=>{
                                                    // try to restart scanner
                                                    setHasCameraPermission(null);
                                                    // re-open to trigger useEffect start
                                                    onOpenChange(false);
                                                    setTimeout(()=>onOpenChange(true), 100);
                                                },
                                                children: "Tentar novamente"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                                lineNumber: 249,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                type: "button",
                                                variant: "ghost",
                                                onClick: ()=>onOpenChange(false),
                                                children: "Fechar"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                                lineNumber: 256,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                        lineNumber: 248,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 227,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "w-full flex justify-center mt-2",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                            type: "button",
                            variant: "outline",
                            size: "sm",
                            onClick: async ()=>{
                                try {
                                    const state = {
                                        navigator: {
                                            mediaDevices: typeof navigator !== 'undefined' ? !!navigator.mediaDevices : false,
                                            permissions: typeof navigator.permissions !== 'undefined'
                                        },
                                        capacitor: ("TURBOPACK compile-time truthy", 1) ? window.Capacitor || null : ("TURBOPACK unreachable", undefined),
                                        lastLogs: debugLogsRef.current.slice(-100)
                                    };
                                    await navigator.clipboard.writeText(JSON.stringify(state, null, 2));
                                    toast({
                                        title: 'Debug copiado',
                                        description: 'Informações de debug copiadas para a área de transferência.'
                                    });
                                } catch (e) {
                                    toast({
                                        variant: 'destructive',
                                        title: 'Erro',
                                        description: 'Não foi possível copiar o debug.'
                                    });
                                }
                            },
                            children: "Copiar debug"
                        }, void 0, false, {
                            fileName: "[project]/src/components/search-scanner-dialog.tsx",
                            lineNumber: 262,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                        lineNumber: 261,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        type: "button",
                        variant: "ghost",
                        onClick: ()=>onOpenChange(false),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                className: "mr-2"
                            }, void 0, false, {
                                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                                lineNumber: 280,
                                columnNumber: 13
                            }, this),
                            "Cancelar"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/search-scanner-dialog.tsx",
                        lineNumber: 279,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/search-scanner-dialog.tsx",
                lineNumber: 198,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/search-scanner-dialog.tsx",
            lineNumber: 197,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/search-scanner-dialog.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
_s(SearchScannerDialog, "OefpJmpxKU5SEEEseo3Oa3nwhiQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = SearchScannerDialog;
var _c;
__turbopack_context__.k.register(_c, "SearchScannerDialog");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/components/search-scanner-dialog.tsx [app-client] (ecmascript, next/dynamic entry)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/search-scanner-dialog.tsx [app-client] (ecmascript)"));
}}),
}]);

//# sourceMappingURL=src_components_8e0ad323._.js.map