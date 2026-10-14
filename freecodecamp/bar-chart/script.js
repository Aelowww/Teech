const DATA_URL =
  "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/GDP-data.json";

const width = 920;
const height = 480;
const margin = { top: 20, right: 20, bottom: 60, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const formatGdp = (value) =>
  `$${d3.format(",.1f")(value)} Billion`;
const formatQuarter = (date) =>
  `${date.getUTCFullYear()} Q${Math.floor(date.getUTCMonth() / 3) + 1}`;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet");

const plot = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const tooltip = d3.select("#tooltip");

fetch(DATA_URL)
  .then((response) => response.json())
  .then(({ data }) => render(data))
  .catch((error) => {
    d3.select("#chart")
      .append("p")
      .text(`Couldn't load the data: ${error.message}`);
  });

function render(data) {
  const parsed = data.map(([date, gdp]) => ({
    dateString: date,
    date: new Date(date),
    gdp,
  }));

  const lastDate = parsed[parsed.length - 1].date;
  const endDate = new Date(lastDate);
  endDate.setUTCMonth(endDate.getUTCMonth() + 3);

  const x = d3
    .scaleUtc()
    .domain([parsed[0].date, endDate])
    .range([0, innerWidth]);

  const maxGdp = d3.max(parsed, (d) => d.gdp);
  const y = d3.scaleLinear().domain([0, maxGdp]).nice().range([innerHeight, 0]);

  const color = d3
    .scaleLinear()
    .domain([0, maxGdp])
    .range([
      getComputedStyle(document.documentElement).getPropertyValue("--bar-low").trim(),
      getComputedStyle(document.documentElement).getPropertyValue("--bar-high").trim(),
    ])
    .interpolate(d3.interpolateHcl);

  // Horizontal gridlines behind the bars
  plot
    .append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(""));

  const barWidth = innerWidth / parsed.length;

  plot
    .selectAll(".bar")
    .data(parsed)
    .join("rect")
    .attr("class", "bar")
    .attr("data-date", (d) => d.dateString)
    .attr("data-gdp", (d) => d.gdp)
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.gdp))
    .attr("width", Math.max(barWidth - 0.6, 1))
    .attr("height", (d) => innerHeight - y(d.gdp))
    .attr("rx", 0.8)
    .attr("fill", (d) => color(d.gdp))
    .on("mouseover", (event, d) => {
      d3.select(event.currentTarget).classed("active", true);
      tooltip
        .attr("data-date", d.dateString)
        .html(
          `<div class="tt-date">${formatQuarter(d.date)}</div>` +
            `<div class="tt-gdp">${formatGdp(d.gdp)}</div>`
        )
        .classed("visible", true);
    })
    .on("mousemove", (event) => {
      const node = tooltip.node();
      const offset = 16;
      let left = event.pageX + offset;
      if (left + node.offsetWidth > window.scrollX + window.innerWidth) {
        left = event.pageX - node.offsetWidth - offset;
      }
      tooltip
        .style("left", `${left}px`)
        .style("top", `${event.pageY - node.offsetHeight - offset}px`);
    })
    .on("mouseout", (event) => {
      d3.select(event.currentTarget).classed("active", false);
      tooltip.classed("visible", false);
    });

  plot
    .append("g")
    .attr("id", "x-axis")
    .attr("class", "axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x).ticks(d3.utcYear.every(5)).tickFormat(d3.utcFormat("%Y")));

  plot
    .append("g")
    .attr("id", "y-axis")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format(",")));

  plot
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 16)
    .attr("text-anchor", "middle")
    .text("Gross Domestic Product (US$ billions)");

  plot
    .append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 44)
    .attr("text-anchor", "middle")
    .text("Year");
}
