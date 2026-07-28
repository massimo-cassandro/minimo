/*!
 * minimo-demo - Massimo Cassandro 2026
 */

"use strict";
(globalThis["webpackChunkminimo_demo"] ||= []).push([["charts_src_node-helpers_svg-text-to-path_js"],{

/***/ "../charts/src/node-helpers/svg-text-to-path.js"
/*!******************************************************!*\
  !*** ../charts/src/node-helpers/svg-text-to-path.js ***!
  \******************************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   textToSvgPath: () => (/* binding */ textToSvgPath)
/* harmony export */ });
// https://stackblitz.com/edit/vitejs-vite-acphht?file=main.js

/*
// Example usage:
const fontUrl = './Rubik Moonrocks.ttf';
const text = 'Hello, World!';
const fontSize = 16; // in points
textToSvgPath(fontUrl, text, fontSize)
  .then(({ svgPathData, svg }) => {
    //console.log(svgPathData); // SVG path data string
    console.log(svg); // SVG element as a string
  })
  .catch((err) => console.error(err));
 */

// Function to load the font and convert text to SVG path
// vedi ada-frontend/ada-charts/test/textToPath-test.mjs

async function textToSvgPath(fontUrl, text, fontSize) {
  try {
    const opentype = (await import(/* webpackIgnore: true */'opentype.js')).default;
    const font = await opentype.load(fontUrl);

    // Define the x and y coordinates where the text should start
    const x = 0;
    const y = 50;

    // Get a path representing the text
    const path = font.getPath(String(text), x, y, fontSize);

    // Convert the path to an SVG path data string
    const pathData = path.toPathData();

    // Alternatively, convert the path to an SVG
    const pathElementString = path.toSVG();
    return {
      pathData,
      pathElementString
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('textToSvgPath - font loading error:', err);
    throw err;
  }
}

/***/ }

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnRzX3NyY19ub2RlLWhlbHBlcnNfc3ZnLXRleHQtdG8tcGF0aF9qcy5mZWY2OWMyM2MxZTJmNzc4ODgxOC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVPLGVBQWUsYUFBYSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0VBQzNELElBQUk7SUFDRixNQUFNLFFBQVEsR0FBRyxDQUFDLE1BQU0sT0FBTyx5QkFBMEIsYUFBYSxDQUFDLEVBQUUsT0FBTztJQUNoRixNQUFNLElBQUksR0FBRyxNQUFNLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDOztJQUV6QztJQUNBLE1BQU0sQ0FBQyxHQUFHLENBQUM7SUFDWCxNQUFNLENBQUMsR0FBRyxFQUFFOztJQUVaO0lBQ0EsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUM7O0lBRXZEO0lBQ0EsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOztJQUVsQztJQUNBLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXRDLE9BQU87TUFBRSxRQUFRO01BQUU7SUFBa0IsQ0FBQztFQUV4QyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUU7SUFDWjtJQUNBLE9BQU8sQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUUsR0FBRyxDQUFDO0lBQ3pELE1BQU0sR0FBRztFQUNYO0FBQ0YsQyIsInNvdXJjZXMiOlsid2VicGFjazovL21pbmltby1kZW1vLy4uL2NoYXJ0cy9zcmMvbm9kZS1oZWxwZXJzL3N2Zy10ZXh0LXRvLXBhdGguanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gaHR0cHM6Ly9zdGFja2JsaXR6LmNvbS9lZGl0L3ZpdGVqcy12aXRlLWFjcGhodD9maWxlPW1haW4uanNcblxuLypcbi8vIEV4YW1wbGUgdXNhZ2U6XG5jb25zdCBmb250VXJsID0gJy4vUnViaWsgTW9vbnJvY2tzLnR0Zic7XG5jb25zdCB0ZXh0ID0gJ0hlbGxvLCBXb3JsZCEnO1xuY29uc3QgZm9udFNpemUgPSAxNjsgLy8gaW4gcG9pbnRzXG50ZXh0VG9TdmdQYXRoKGZvbnRVcmwsIHRleHQsIGZvbnRTaXplKVxuICAudGhlbigoeyBzdmdQYXRoRGF0YSwgc3ZnIH0pID0+IHtcbiAgICAvL2NvbnNvbGUubG9nKHN2Z1BhdGhEYXRhKTsgLy8gU1ZHIHBhdGggZGF0YSBzdHJpbmdcbiAgICBjb25zb2xlLmxvZyhzdmcpOyAvLyBTVkcgZWxlbWVudCBhcyBhIHN0cmluZ1xuICB9KVxuICAuY2F0Y2goKGVycikgPT4gY29uc29sZS5lcnJvcihlcnIpKTtcbiAqL1xuXG4vLyBGdW5jdGlvbiB0byBsb2FkIHRoZSBmb250IGFuZCBjb252ZXJ0IHRleHQgdG8gU1ZHIHBhdGhcbi8vIHZlZGkgYWRhLWZyb250ZW5kL2FkYS1jaGFydHMvdGVzdC90ZXh0VG9QYXRoLXRlc3QubWpzXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXh0VG9TdmdQYXRoKGZvbnRVcmwsIHRleHQsIGZvbnRTaXplKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb3BlbnR5cGUgPSAoYXdhaXQgaW1wb3J0KC8qIHdlYnBhY2tJZ25vcmU6IHRydWUgKi8gJ29wZW50eXBlLmpzJykpLmRlZmF1bHQ7XG4gICAgY29uc3QgZm9udCA9IGF3YWl0IG9wZW50eXBlLmxvYWQoZm9udFVybCk7XG5cbiAgICAvLyBEZWZpbmUgdGhlIHggYW5kIHkgY29vcmRpbmF0ZXMgd2hlcmUgdGhlIHRleHQgc2hvdWxkIHN0YXJ0XG4gICAgY29uc3QgeCA9IDA7XG4gICAgY29uc3QgeSA9IDUwO1xuXG4gICAgLy8gR2V0IGEgcGF0aCByZXByZXNlbnRpbmcgdGhlIHRleHRcbiAgICBjb25zdCBwYXRoID0gZm9udC5nZXRQYXRoKFN0cmluZyh0ZXh0KSwgeCwgeSwgZm9udFNpemUpO1xuXG4gICAgLy8gQ29udmVydCB0aGUgcGF0aCB0byBhbiBTVkcgcGF0aCBkYXRhIHN0cmluZ1xuICAgIGNvbnN0IHBhdGhEYXRhID0gcGF0aC50b1BhdGhEYXRhKCk7XG5cbiAgICAvLyBBbHRlcm5hdGl2ZWx5LCBjb252ZXJ0IHRoZSBwYXRoIHRvIGFuIFNWR1xuICAgIGNvbnN0IHBhdGhFbGVtZW50U3RyaW5nID0gcGF0aC50b1NWRygpO1xuXG4gICAgcmV0dXJuIHsgcGF0aERhdGEsIHBhdGhFbGVtZW50U3RyaW5nIH07XG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKCd0ZXh0VG9TdmdQYXRoIC0gZm9udCBsb2FkaW5nIGVycm9yOicsIGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=