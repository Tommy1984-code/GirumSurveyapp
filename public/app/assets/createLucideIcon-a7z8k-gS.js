import{h as i,a as u}from"./index-m4CdtllE.js";var h={},p={};Object.defineProperty(p,"__esModule",{value:!0});p.parseLengthAndUnit=y;p.cssValue=j;var C={cm:!0,mm:!0,in:!0,px:!0,pt:!0,pc:!0,em:!0,ex:!0,ch:!0,rem:!0,vw:!0,vh:!0,vmin:!0,vmax:!0,"%":!0};function y(t){if(typeof t=="number")return{value:t,unit:"px"};var e,n=(t.match(/^[0-9.]*/)||"").toString();n.includes(".")?e=parseFloat(n):e=parseInt(n,10);var r=(t.match(/[^0-9]*$/)||"").toString();return C[r]?{value:e,unit:r}:(console.warn("React Spinners: ".concat(t," is not a valid css value. Defaulting to ").concat(e,"px.")),{value:e,unit:"px"})}function j(t){var e=y(t);return"".concat(e.value).concat(e.unit)}var v={};Object.defineProperty(v,"__esModule",{value:!0});v.createAnimation=void 0;var x=function(t,e,n){var r="react-spinners-".concat(t,"-").concat(n);if(typeof window>"u"||!window.document)return r;var a=document.createElement("style");document.head.appendChild(a);var o=a.sheet,c=`
    @keyframes `.concat(r,` {
      `).concat(e,`
    }
  `);return o&&o.insertRule(c,0),r};v.createAnimation=x;var f=i&&i.__assign||function(){return f=Object.assign||function(t){for(var e,n=1,r=arguments.length;n<r;n++){e=arguments[n];for(var a in e)Object.prototype.hasOwnProperty.call(e,a)&&(t[a]=e[a])}return t},f.apply(this,arguments)},P=i&&i.__createBinding||(Object.create?function(t,e,n,r){r===void 0&&(r=n);var a=Object.getOwnPropertyDescriptor(e,n);(!a||("get"in a?!e.__esModule:a.writable||a.configurable))&&(a={enumerable:!0,get:function(){return e[n]}}),Object.defineProperty(t,r,a)}:function(t,e,n,r){r===void 0&&(r=n),t[r]=e[n]}),A=i&&i.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),L=i&&i.__importStar||function(){var t=function(e){return t=Object.getOwnPropertyNames||function(n){var r=[];for(var a in n)Object.prototype.hasOwnProperty.call(n,a)&&(r[r.length]=a);return r},t(e)};return function(e){if(e&&e.__esModule)return e;var n={};if(e!=null)for(var r=t(e),a=0;a<r.length;a++)r[a]!=="default"&&P(n,e,r[a]);return A(n,e),n}}(),M=i&&i.__rest||function(t,e){var n={};for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.indexOf(r)<0&&(n[r]=t[r]);if(t!=null&&typeof Object.getOwnPropertySymbols=="function")for(var a=0,r=Object.getOwnPropertySymbols(t);a<r.length;a++)e.indexOf(r[a])<0&&Object.prototype.propertyIsEnumerable.call(t,r[a])&&(n[r[a]]=t[r[a]]);return n};Object.defineProperty(h,"__esModule",{value:!0});var S=L(u),g=p,E=v,R=(0,E.createAnimation)("ClipLoader","0% {transform: rotate(0deg) scale(1)} 50% {transform: rotate(180deg) scale(0.8)} 100% {transform: rotate(360deg) scale(1)}","clip");function $(t){var e=t.loading,n=e===void 0?!0:e,r=t.color,a=r===void 0?"#000000":r,o=t.speedMultiplier,c=o===void 0?1:o,l=t.cssOverride,m=l===void 0?{}:l,s=t.size,d=s===void 0?35:s,O=M(t,["loading","color","speedMultiplier","cssOverride","size"]),w=f({background:"transparent !important",width:(0,g.cssValue)(d),height:(0,g.cssValue)(d),borderRadius:"100%",border:"2px solid",borderTopColor:a,borderBottomColor:"transparent",borderLeftColor:a,borderRightColor:a,display:"inline-block",animation:"".concat(R," ").concat(.75/c,"s 0s infinite linear"),animationFillMode:"both"},m);return n?S.createElement("span",f({style:w},O)):null}var N=h.default=$;/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _=(...t)=>t.filter((e,n,r)=>!!e&&e.trim()!==""&&r.indexOf(e)===n).join(" ").trim();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=t=>t.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,n,r)=>r?r.toUpperCase():n.toLowerCase());/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b=t=>{const e=U(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var D={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1};/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=u.forwardRef(({color:t="currentColor",size:e=24,strokeWidth:n=2,absoluteStrokeWidth:r,className:a="",children:o,iconNode:c,...l},m)=>u.createElement("svg",{ref:m,...D,width:e,height:e,stroke:t,strokeWidth:r?Number(n)*24/Number(e):n,className:_("lucide",a),...!o&&!I(l)&&{"aria-hidden":"true"},...l},[...c.map(([s,d])=>u.createElement(s,d)),...Array.isArray(o)?o:[o]]));/**
 * @license lucide-react v0.577.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W=(t,e)=>{const n=u.forwardRef(({className:r,...a},o)=>u.createElement(V,{ref:o,iconNode:e,className:_(`lucide-${B(b(t))}`,`lucide-${t}`,r),...a}));return n.displayName=b(t),n};export{N as _,W as c};
