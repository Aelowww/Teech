# US GDP Bar Chart — freeCodeCamp "Visualize Data with a Bar Chart"

A standalone D3 v7 project (plain HTML/CSS/JS, independent of the Next.js app).

- `index.html` — markup, loads D3 and the freeCodeCamp test bundle
- `style.css` — styling (dark card, warm/cool gradient bars, floating tooltip)
- `script.js` — fetches the GDP dataset and draws the chart

## Run locally

Open `index.html` through any static server, e.g. `npx http-server freecodecamp/bar-chart`.
Choose "D3: Bar Chart" in the test panel (top-left) and run the tests.

## Submit via CodePen

1. Create a new pen.
2. Paste the `<main>` + `#tooltip` markup from `index.html` into the HTML panel.
3. Paste `style.css` into CSS and `script.js` into JS.
4. JS settings → add `https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js`.
5. Add `<script src="https://cdn.freecodecamp.org/testable-projects-fcc/v1/bundle.js"></script>` at the end of the HTML panel.
6. Save and submit the "full page" URL.
