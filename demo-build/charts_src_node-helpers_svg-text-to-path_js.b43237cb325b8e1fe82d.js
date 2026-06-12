"use strict";
(globalThis["webpackChunkminimo_demo"] = globalThis["webpackChunkminimo_demo"] || []).push([["charts_src_node-helpers_svg-text-to-path_js"],{

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnRzX3NyY19ub2RlLWhlbHBlcnNfc3ZnLXRleHQtdG8tcGF0aF9qcy5iNDMyMzdjYjMyNWI4ZTFmZTgyZC5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7O0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRU8sZUFBZUEsYUFBYUEsQ0FBQ0MsT0FBTyxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRTtFQUMzRCxJQUFJO0lBQ0YsTUFBTUMsUUFBUSxHQUFHLENBQUMsTUFBTSxNQUFNLENBQUMseUJBQTBCLGFBQWEsQ0FBQyxFQUFFQyxPQUFPO0lBQ2hGLE1BQU1DLElBQUksR0FBRyxNQUFNRixRQUFRLENBQUNHLElBQUksQ0FBQ04sT0FBTyxDQUFDOztJQUV6QztJQUNBLE1BQU1PLENBQUMsR0FBRyxDQUFDO0lBQ1gsTUFBTUMsQ0FBQyxHQUFHLEVBQUU7O0lBRVo7SUFDQSxNQUFNQyxJQUFJLEdBQUdKLElBQUksQ0FBQ0ssT0FBTyxDQUFDQyxNQUFNLENBQUNWLElBQUksQ0FBQyxFQUFFTSxDQUFDLEVBQUVDLENBQUMsRUFBRU4sUUFBUSxDQUFDOztJQUV2RDtJQUNBLE1BQU1VLFFBQVEsR0FBR0gsSUFBSSxDQUFDSSxVQUFVLENBQUMsQ0FBQzs7SUFFbEM7SUFDQSxNQUFNQyxpQkFBaUIsR0FBR0wsSUFBSSxDQUFDTSxLQUFLLENBQUMsQ0FBQztJQUV0QyxPQUFPO01BQUVILFFBQVE7TUFBRUU7SUFBa0IsQ0FBQztFQUV4QyxDQUFDLENBQUMsT0FBT0UsR0FBRyxFQUFFO0lBQ1o7SUFDQUMsT0FBTyxDQUFDQyxLQUFLLENBQUMscUNBQXFDLEVBQUVGLEdBQUcsQ0FBQztJQUN6RCxNQUFNQSxHQUFHO0VBQ1g7QUFDRixDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWluaW1vLWRlbW8vLi4vY2hhcnRzL3NyYy9ub2RlLWhlbHBlcnMvc3ZnLXRleHQtdG8tcGF0aC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBodHRwczovL3N0YWNrYmxpdHouY29tL2VkaXQvdml0ZWpzLXZpdGUtYWNwaGh0P2ZpbGU9bWFpbi5qc1xuXG4vKlxuLy8gRXhhbXBsZSB1c2FnZTpcbmNvbnN0IGZvbnRVcmwgPSAnLi9SdWJpayBNb29ucm9ja3MudHRmJztcbmNvbnN0IHRleHQgPSAnSGVsbG8sIFdvcmxkISc7XG5jb25zdCBmb250U2l6ZSA9IDE2OyAvLyBpbiBwb2ludHNcbnRleHRUb1N2Z1BhdGgoZm9udFVybCwgdGV4dCwgZm9udFNpemUpXG4gIC50aGVuKCh7IHN2Z1BhdGhEYXRhLCBzdmcgfSkgPT4ge1xuICAgIC8vY29uc29sZS5sb2coc3ZnUGF0aERhdGEpOyAvLyBTVkcgcGF0aCBkYXRhIHN0cmluZ1xuICAgIGNvbnNvbGUubG9nKHN2Zyk7IC8vIFNWRyBlbGVtZW50IGFzIGEgc3RyaW5nXG4gIH0pXG4gIC5jYXRjaCgoZXJyKSA9PiBjb25zb2xlLmVycm9yKGVycikpO1xuICovXG5cbi8vIEZ1bmN0aW9uIHRvIGxvYWQgdGhlIGZvbnQgYW5kIGNvbnZlcnQgdGV4dCB0byBTVkcgcGF0aFxuLy8gdmVkaSBhZGEtZnJvbnRlbmQvYWRhLWNoYXJ0cy90ZXN0L3RleHRUb1BhdGgtdGVzdC5tanNcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHRleHRUb1N2Z1BhdGgoZm9udFVybCwgdGV4dCwgZm9udFNpemUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBvcGVudHlwZSA9IChhd2FpdCBpbXBvcnQoLyogd2VicGFja0lnbm9yZTogdHJ1ZSAqLyAnb3BlbnR5cGUuanMnKSkuZGVmYXVsdDtcbiAgICBjb25zdCBmb250ID0gYXdhaXQgb3BlbnR5cGUubG9hZChmb250VXJsKTtcblxuICAgIC8vIERlZmluZSB0aGUgeCBhbmQgeSBjb29yZGluYXRlcyB3aGVyZSB0aGUgdGV4dCBzaG91bGQgc3RhcnRcbiAgICBjb25zdCB4ID0gMDtcbiAgICBjb25zdCB5ID0gNTA7XG5cbiAgICAvLyBHZXQgYSBwYXRoIHJlcHJlc2VudGluZyB0aGUgdGV4dFxuICAgIGNvbnN0IHBhdGggPSBmb250LmdldFBhdGgoU3RyaW5nKHRleHQpLCB4LCB5LCBmb250U2l6ZSk7XG5cbiAgICAvLyBDb252ZXJ0IHRoZSBwYXRoIHRvIGFuIFNWRyBwYXRoIGRhdGEgc3RyaW5nXG4gICAgY29uc3QgcGF0aERhdGEgPSBwYXRoLnRvUGF0aERhdGEoKTtcblxuICAgIC8vIEFsdGVybmF0aXZlbHksIGNvbnZlcnQgdGhlIHBhdGggdG8gYW4gU1ZHXG4gICAgY29uc3QgcGF0aEVsZW1lbnRTdHJpbmcgPSBwYXRoLnRvU1ZHKCk7XG5cbiAgICByZXR1cm4geyBwYXRoRGF0YSwgcGF0aEVsZW1lbnRTdHJpbmcgfTtcblxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IoJ3RleHRUb1N2Z1BhdGggLSBmb250IGxvYWRpbmcgZXJyb3I6JywgZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJ0ZXh0VG9TdmdQYXRoIiwiZm9udFVybCIsInRleHQiLCJmb250U2l6ZSIsIm9wZW50eXBlIiwiZGVmYXVsdCIsImZvbnQiLCJsb2FkIiwieCIsInkiLCJwYXRoIiwiZ2V0UGF0aCIsIlN0cmluZyIsInBhdGhEYXRhIiwidG9QYXRoRGF0YSIsInBhdGhFbGVtZW50U3RyaW5nIiwidG9TVkciLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiXSwic291cmNlUm9vdCI6IiJ9