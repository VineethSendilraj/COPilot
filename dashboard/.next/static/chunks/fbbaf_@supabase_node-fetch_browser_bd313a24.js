(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/node_modules/@supabase/realtime-js/node_modules/@supabase/node-fetch/browser.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// ref: https://github.com/tc39/proposal-global
var getGlobal = function() {
    // the only reliable means to get the global object is
    // `Function('return this')()`
    // However, this causes CSP violations in Chrome apps.
    if (typeof self !== 'undefined') {
        return self;
    }
    if (typeof window !== 'undefined') {
        return window;
    }
    if ("TURBOPACK compile-time truthy", 1) {
        return /*TURBOPACK member replacement*/ __turbopack_context__.g;
    }
    //TURBOPACK unreachable
    ;
};
var globalObject = getGlobal();
module.exports = exports = globalObject.fetch;
// Needed for TypeScript and Webpack.
if (globalObject.fetch) {
    exports.default = globalObject.fetch.bind(globalObject);
}
exports.Headers = globalObject.Headers;
exports.Request = globalObject.Request;
exports.Response = globalObject.Response;
}),
]);

//# sourceMappingURL=fbbaf_%40supabase_node-fetch_browser_bd313a24.js.map