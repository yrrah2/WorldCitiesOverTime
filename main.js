const MAX_URQUHART_DISTANCE = 0.15; // geo radians

// Random Colour Generator
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let colour = '#';
    for (var i = 0; i < 6; i++ ) {
        colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
}

// Find recent event date
const recentEvent = (dates, year) => {
    const datesBefore = dates.filter(date => date.year.slice(0, 4) < year);
    return datesBefore[datesBefore.length-1].event;
}

// Controls
const gui = new dat.GUI();
const controls = {
  'Cities': true,
  'Graticule Grid': false,
  'Voronoi Layer': true,
  'Year': 1800
};
gui.add(controls, 'Cities').onChange(enabled => d3.selectAll('.city').style('display', enabled ? null : 'none'));
gui.add(controls, 'Graticule Grid').onChange(enabled => d3.selectAll('.graticule').style('display', enabled ? null : 'none'));
gui.add(controls, 'Voronoi Layer').onChange( enabled => {
    d3.selectAll('.voronoi').style('display', enabled ? null : 'none');
});
gui.add(controls, "Year").min(1500).max(2020).step(10);

var dataTime = d3.range(0, 10).map(function(d) {
    return new Date(1995 + d, 10, 3);
});

var sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1000 * 60 * 60 * 24 * 365)
    .width(300)
    .tickFormat(d3.timeFormat('%Y'))
    .tickValues(dataTime)
    .default(new Date(1998, 10, 3))
    .on('onchange', val => {
      d3.select('p#value-time').text(d3.timeFormat('%Y')(val));
    });

var gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime.call(sliderTime);
d3.select('p#value-time').text(d3.timeFormat('%Y')(sliderTime.value()));

const width = window.innerWidth;
const height = window.innerHeight;

const svg = d3.select('#world').append('svg')
  .attr('width', width)
  .attr('height', height);

const tip = d3.tip()
  .attr('class', 'tooltip')
  .direction('s')
  .offset([60, 10])
  .html(d => d);

svg.call(tip);

const getCityDesc = d => `
  <div><b>${d.city}</b></div>
  <div>Longitude: ${d.longitude}</div>
  <div>Latitude: ${d.latitude}</div>
  <div><b>${recentEvent(d.dates, controls.Year)}</b></div>
`;

const projection = d3.geoOrthographic()
  .scale((height - 10) / 2)
  .translate([width / 2, height / 2])
  .rotate([0, -35, 0])
  .precision(0.1);

const path = d3.geoPath()
  .projection(projection)
  .pointRadius(1.7);

d3.geoZoom()
  .projection(projection)
  .onMove(render)
  (svg.node());

Promise.all([
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/ocean.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/cities.json').then(r => r.json())
]).then(([world, cities]) => {
  // sphere (land)
  svg.append('path').attr('class', 'geo sphere')
    .datum({ type: 'Sphere' });

  

  // graticules
  svg.append('path').attr('class', 'geo graticule')
    .datum(d3.geoGraticule10())
    .style('display', 'none');

    const voronoi = d3.geoVoronoi()
    .x(d => d.longitude)
    .y(d => d.latitude)
    (cities);

  // voronoi polygons
  svg.append('g').selectAll('.voronoi')
    .data(voronoi.polygons().features)
    .enter().append('path')
      .attr('class', 'geo voronoi')
      .on('mousemove', ({properties: { site: d }}) => tip.show(getCityDesc(d)))
      .on('mouseout', tip.hide);

    // ocean
  svg.append('path').attr('class', 'geo ocean')
    .datum(topojson.feature(world, world.objects.ocean));
    
  // city points
  svg.append('g').selectAll('.city')
    .data(cities)
    .enter().append('path')
      .attr('class', 'geo city')
      .datum(d => ({
        type: 'Point',
        coordinates: [d.longitude, d.latitude],
        properties: d
      }))
      .on('mousemove', ({properties: d}) => tip.show(getCityDesc(d)))
      .on('mouseout', tip.hide);
 
  svg.selectAll('path.voronoi').each(
      function (d, i) { this.style.fill = getRandomColor(); }
  );
 
  render();
});

//

function render() {
  svg.selectAll('path.geo').attr('d', path);
}
