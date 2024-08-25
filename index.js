import eu from "./eu.json" with { type: 'json' };
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const width = window.innerWidth;
const height = window.innerHeight;

const { features } = topojson.feature(
    eu,
    eu.objects.europeUltra
)

const borders = topojson.mesh(
    eu,
    eu.objects.europeUltra,
    (a, b) => a !== b
)

function setZoom(width, height) {
    return d3.zoom()
        .scaleExtent([1, 20])
        .translateExtent([
            [0, 0],
            [width, height],
        ])
        .on("zoom", function ({ transform }) {
            d3.select("svg")
                .selectChild("g")
                .attr("transform", transform)
                .attr("stroke-width", 1 / transform.k);
        });
}

let zoom = setZoom(width, height);

function setPath(width, height) {
    const projection = d3
        .geoMercator()
        .center([7, 54])
        .translate([width / 2, height / 2])
        .scale(width * 0.65)

    const path = d3.geoPath(projection);
    return path;
}

let path = setPath(width, height);

const svg = d3.select("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("width", width)
    .attr("height", height)
    .attr("style", "max-width: 100%; height: auto;")
    .on("click", zoomOut);

const g = svg.append("g");

const countries = g.append("g")
    .attr("fill", "#444")
    .attr("cursor", "pointer")
    .selectAll("path")
    .data(features)
    .join("path")
    .on("click", function (event, d) {
        const [[x0, y0], [x1, y1]] = path.bounds(d);
        event.stopPropagation();

        countries.transition().style("fill", null);
        d3.select(this).transition().style("fill", "red");

        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
            d3.pointer(event, svg.node())
        );

        console.log(d.properties.name);
    })
    .attr("d", path)
    .attr("id", (d) => d.properties.id)
    .attr("title", (d) => d.properties.name);

g.append("path")
    .attr("id", "borders")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", path(borders));

svg.call(zoom);

function zoomOut() {
    countries.transition().style("fill", null);
    svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity,
        d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
}

window.addEventListener('DOMContentLoaded', function () {
    //
})

window.addEventListener('resize', function () {
    const width = this.innerWidth;
    const height = this.innerHeight;

    zoom = setZoom(width, height);
    path = setPath(width, height);

    const svg = d3
        .select("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    const g = svg.selectChild("g");

    g.selectAll("g")
        .selectAll("path")
        .data(features)
        .join("path")
        .attr("d", path);

    g.select("path[id='borders']").attr("d", path(borders));
});