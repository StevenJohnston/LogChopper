if(!self.define){let e,s={};const a=(a,n)=>(a=new URL(a+".js",n).href,s[a]||new Promise((s=>{if("document"in self){const e=document.createElement("script");e.src=a,e.onload=s,document.head.appendChild(e)}else e=a,importScripts(a),s()})).then((()=>{let e=s[a];if(!e)throw new Error(`Module ${a} didn’t register its module`);return e})));self.define=(n,t)=>{const i=e||("document"in self?document.currentScript.src:"")||location.href;if(s[i])return;let c={};const o=e=>a(e,i),r={module:{uri:i},exports:c,require:o};s[i]=Promise.all(n.map((e=>r[e]||o(e)))).then((e=>(t(...e),c)))}}define(["./workbox-07a7b4f2"],(function(e){"use strict";importScripts(),self.skipWaiting(),e.clientsClaim(),e.precacheAndRoute([{url:"/LogChopper/_next/app-build-manifest.json",revision:"161d5587bf6f7a035ddb30fafa3ff940"},{url:"/LogChopper/_next/static/Y2Gd31apzs4BDU9u9T4XQ/_buildManifest.js",revision:"a1b7599199e2e8c82f2c6bcf8d8aca61"},{url:"/LogChopper/_next/static/Y2Gd31apzs4BDU9u9T4XQ/_ssgManifest.js",revision:"b6652df95db52feb4daf4eca35380933"},{url:"/LogChopper/_next/static/chunks/10.00f632661e07180d.js",revision:"00f632661e07180d"},{url:"/LogChopper/_next/static/chunks/166.2853a6ac26b8e134.js",revision:"2853a6ac26b8e134"},{url:"/LogChopper/_next/static/chunks/263-68e3d5a4bbc6fd1c.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/30.ed776a16ddcf2bda.js",revision:"ed776a16ddcf2bda"},{url:"/LogChopper/_next/static/chunks/390.85da324a065cf7a5.js",revision:"85da324a065cf7a5"},{url:"/LogChopper/_next/static/chunks/519.b85ad8b86fb66e06.js",revision:"b85ad8b86fb66e06"},{url:"/LogChopper/_next/static/chunks/569.3d0bfd69ed2445e5.js",revision:"3d0bfd69ed2445e5"},{url:"/LogChopper/_next/static/chunks/590.425b3aab62d66a4f.js",revision:"425b3aab62d66a4f"},{url:"/LogChopper/_next/static/chunks/634-ffc4272087ed9b52.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/677-1a4cbb3d5862f0a9.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/788c9b59.ebc4aa1416d823ce.js",revision:"ebc4aa1416d823ce"},{url:"/LogChopper/_next/static/chunks/795.e55dcdaa37b32203.js",revision:"e55dcdaa37b32203"},{url:"/LogChopper/_next/static/chunks/831-fa83adbc870871fd.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/862.2dd49aed6c80cb2a.js",revision:"2dd49aed6c80cb2a"},{url:"/LogChopper/_next/static/chunks/90.0e46ec8e7c6c2a72.js",revision:"0e46ec8e7c6c2a72"},{url:"/LogChopper/_next/static/chunks/902.bd40ef6d21c8a215.js",revision:"bd40ef6d21c8a215"},{url:"/LogChopper/_next/static/chunks/907.ae7b9539b1dd149e.js",revision:"ae7b9539b1dd149e"},{url:"/LogChopper/_next/static/chunks/938-4c612571f96bb702.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/95-49bb279f902d9971.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/app/_not-found-afd14af40d15740f.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/app/example/DirectoryPicker/page-6a8d30967c62e3a4.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/app/layout-ef0b2df02eb0d491.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/app/page-a98b1941b929707f.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/c37d3baf-283165aa54795b59.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/fd9d1056-e73e4fb565451dc3.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/framework-8883d1e9be70c3da.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/main-a959f21c6245907f.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/main-app-e2259e480ffc26ff.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/pages/_app-98cb51ec6f9f135f.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/pages/_error-e87e5963ec1b8011.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/chunks/polyfills-c67a75d1b6f99dc8.js",revision:"837c0df77fd5009c9e46d446188ecfd0"},{url:"/LogChopper/_next/static/chunks/webpack-055d0c4d240a0ea1.js",revision:"Y2Gd31apzs4BDU9u9T4XQ"},{url:"/LogChopper/_next/static/css/a97d502e40178f08.css",revision:"a97d502e40178f08"},{url:"/LogChopper/_next/static/css/cf747e1afc6f95d7.css",revision:"cf747e1afc6f95d7"},{url:"/LogChopper/icon.png",revision:"2ee318585daee648af34ebddede41d9b"},{url:"/LogChopper/manifest.json",revision:"d5cbe1a9cbed1aea91614e7dc7b1eba1"}],{ignoreURLParametersMatching:[]}),e.cleanupOutdatedCaches(),e.registerRoute("/LogChopper",new e.NetworkFirst({cacheName:"start-url",plugins:[{cacheWillUpdate:async({request:e,response:s,event:a,state:n})=>s&&"opaqueredirect"===s.type?new Response(s.body,{status:200,statusText:"OK",headers:s.headers}):s}]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,new e.CacheFirst({cacheName:"google-fonts-webfonts",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3})]}),"GET"),e.registerRoute(/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,new e.StaleWhileRevalidate({cacheName:"google-fonts-stylesheets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new e.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new e.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800})]}),"GET"),e.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new e.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/image\?url=.+$/i,new e.StaleWhileRevalidate({cacheName:"next-image",plugins:[new e.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp3|wav|ogg)$/i,new e.CacheFirst({cacheName:"static-audio-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:mp4)$/i,new e.CacheFirst({cacheName:"static-video-assets",plugins:[new e.RangeRequestsPlugin,new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:js)$/i,new e.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:css|less)$/i,new e.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\/_next\/data\/.+\/.+\.json$/i,new e.StaleWhileRevalidate({cacheName:"next-data",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute(/\.(?:json|xml|csv)$/i,new e.NetworkFirst({cacheName:"static-data-assets",plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;const s=e.pathname;return!s.startsWith("/api/auth/")&&!!s.startsWith("/api/")}),new e.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>{if(!(self.origin===e.origin))return!1;return!e.pathname.startsWith("/api/")}),new e.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400})]}),"GET"),e.registerRoute((({url:e})=>!(self.origin===e.origin)),new e.NetworkFirst({cacheName:"cross-origin",networkTimeoutSeconds:10,plugins:[new e.ExpirationPlugin({maxEntries:32,maxAgeSeconds:3600})]}),"GET")}));
