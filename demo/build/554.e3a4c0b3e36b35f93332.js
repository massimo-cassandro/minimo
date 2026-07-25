/*!
 * minimo-demo - Massimo Cassandro 2026
 */
"use strict";(globalThis.webpackChunkminimo_demo||=[]).push([[554],{554(t,a,o){async function e(t,a,o){try{const e=(await import("opentype.js")).default,n=await e.load(t),r=0,h=50,i=n.getPath(String(a),r,h,o),c=i.toPathData();return{pathData:c,pathElementString:i.toSVG()}}catch(t){throw console.error("textToSvgPath - font loading error:",t),t}}o.d(a,{textToSvgPath:()=>e})}}]);