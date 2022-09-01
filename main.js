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

function colorize_after() {console.log("test")}

function colorize(svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) { 
            this.style.fill = getRandomColor();
        }
    );
}

function start_history(svg) {
    let time = sliderTime.value();
    setInterval(function(){
    time += 1;
    },1000);
}

function color_gray(svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) { 
            this.style.fill = "#353535";
        }
    );
}

function colorize_regimes(regime_colors, svg) {
    console.log(regime_colors);
    svg.selectAll('path.voronoi').each(
        function (d, i) {
            if ( d.properties.site.dates.length > 0 ){
                let regime = recentEvent(d.properties.site.dates, sliderTime.value());
                this.style.fill = regime_colors[regime.toString()];
            }
        }
    );
}

// Find recent event date
const recentEvent = (dates, year) => {
    const datesBefore = dates.filter(date => date.year.slice(0, 4) < year);
    let regime = datesBefore[datesBefore.length-1];
    if ( regime == undefined ){
        return "No one";
    } else {
        return regime.event.toString();
    };
}

// Get screen size
const width = window.innerWidth;
const height = window.innerHeight;

// Add the world SVG
const svg = d3.select('#world').append('svg')
  .attr('width', width)
  .attr('height', height);

Promise.all([
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/ocean.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/cities.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/regimes.json').then(r => r.json())
]).then(([world, cities, regimes]) => {
var regime_colors = {"No one": "#353535"};
regimes.forEach(regime => regime_colors[regime] = getRandomColor());

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
      colorize_regimes(regime_colors, svg);
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

controls.start_history = function() {
    //colorize(svg)
    start_history(svg);
};
gui.add(controls, "start_history").name("Start");

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
    
  controls.colorize_regimes = function() {
      colorize_regimes(regime_colors, svg)
  };
  gui.add(controls, "colorize_regimes").name("Color according to regimes");
  
  colorize_after = colorize_regimes(regime_colors, svg);
  // colorize(svg);
  color_gray(svg); //In case regime coloring doesn't work
  colorize_regimes(regime_colors, svg);
  
  render();
});

//

function render() {
  svg.selectAll('path.geo').attr('d', path);
}
