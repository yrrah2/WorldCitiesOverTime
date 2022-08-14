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

function colorize(svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) { 
            this.style.fill = getRandomColor();
        }
    );
}

function colorize_regimes(regime_colors, svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) {
            let regime = recentEvent(d.dates, sliderTime.value())
            this.style.fill = regime_colors[regime];
        }
    );
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

// Year slider
const dataTime = d3.range(-1, 11).map( d => 200 * d );

const sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(25)
    .width(300)
    .tickValues(dataTime)
    .default(1500)
    .on('onchange', val => {
      d3.select('p#value-time').text(Math.ceil(val));
    });

const gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', 500)
    .attr('height', 100)
    .append('g')
    .attr('transform', 'translate(30,30)');

gTime.call(sliderTime);
d3.select('p#value-time').text( sliderTime.value() );

// Get screen size
const width = window.innerWidth;
const height = window.innerHeight;

// Add the world SVG
const svg = d3.select('#world').append('svg')
  .attr('width', width)
  .attr('height', height);

controls.colorize = function() {
    colorize(svg)
};
gui.add(controls, "colorize").name("Randomize colours");

// At the tool tip
const tip = d3.tip()
  .attr('class', 'tooltip')
  .direction('s')
  .offset([60, 10])
  .html(d => d);

svg.call(tip);

const getCityDesc = d => `
  <div>City: <b>${d.city}</b></div>
  <div>Regime: <b>${recentEvent(d.dates, sliderTime.value() )}</b></div>
`;

// Set the world projection
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
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/cities.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/regimes.json').then(r => r.json())
]).then(([world, cities, regimes]) => {
    
  // Sphere (Land)
  svg.append('path').attr('class', 'geo sphere')
    .datum({ type: 'Sphere' });

  // Graticule lines
  svg.append('path').attr('class', 'geo graticule')
    .datum(d3.geoGraticule10())
    .style('display', 'none')
    .style('z-index', 1000);

  // Voronoi graph
  const voronoi = d3.geoVoronoi()
    .x(d => d.longitude)
    .y(d => d.latitude)
    (cities);

  // Voronoi polygons
  svg.append('g').selectAll('.voronoi')
    .data(voronoi.polygons().features)
    .enter().append('path')
      .attr('class', 'geo voronoi')
      .attr("id", d => d)
      .on('mousemove', ({properties: { site: d }}) => tip.show(getCityDesc(d)))
      .on('mouseout', tip.hide);

  // Ocean overlay
  svg.append('path').attr('class', 'geo ocean')
    .datum(topojson.feature(world, world.objects.ocean));
    
  // City points
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
    
  var regime_colors = {};
  regimes.forEach(regime => regime_colors[regime] = getRandomColor())
    
  colorize(svg); //In case regime coloring doesn't work
  colorize_regimes(regimes, svg);
  
  render();
});

//

function render() {
  svg.selectAll('path.geo').attr('d', path);
}
