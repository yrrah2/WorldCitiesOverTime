const MAX_URQUHART_DISTANCE = 0.15; // geo radians

// Convert year to decimal
function convert_date(date){
    if (date.charAt(0) === '-'){
        date = date.substring(1);
        var year = -date.slice(0, 4);
    } else {
        var year = date.slice(0, 4);
    }
    let month = date.slice(5, 7);
    let day = date.slice(8, 10);
    return {"year": year, "month": month, "day": day};
}

// Random Colour Generator
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let colour = '#';
    for (var i = 0; i < 6; i++ ) {
        colour += letters[Math.floor(Math.random() * 16)];
    }
    return colour;
}

// Start changing year every second
function start_history(svg) {
    let time = sliderTime.value();
    setInterval(function(){
    time += 1;
    },1000);
}

// Color every area gray
function color_gray(svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) { 
            this.style.fill = "#353535";
        }
    );
}

// Find recent event date
const recentEvent = (dates, year) => {
    const datesBefore = dates.filter(date => convert_date(date.year).year < year);
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

// Set the world projection
const projection = d3.geoOrthographic()
  .scale((height - 10) / 2)
  .translate([width / 2, height / 2])
  .rotate([0, -35, 0])
  .precision(0.1);

const path = d3.geoPath()
  .projection(projection)
  .pointRadius(1.7);

// Render everything
function render() {
  svg.selectAll('path.geo').attr('d', path);
}

// --------     Load all the json files     --------
Promise.all([
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/ocean.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/cities.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/regimes.json').then(r => r.json())
]).then(([world, cities, regimes]) => {

// Set colors for each area
var regime_colors = {"No one": "#353535"};
regimes.forEach(regime => regime_colors[regime] = getRandomColor());

// Controls
const gui = new dat.GUI();
const controls = {
  'Cities': true,
  'Voronoi Layer': true,
  'Year': 1800
};

gui.add(controls, 'Cities').onChange(enabled => d3.selectAll('.city').style('display', enabled ? null : 'none'));
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
      //colorize_regimes(regime_colors, svg);
        voronoi_rerender()
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

// Button to start history
controls.start_history = function() {
    start_history(svg);
};
gui.add(controls, "start_history").name("Start");

// Tool tips for each area
const tip = d3.tip()
  .attr('class', 'tooltip')
  .direction('s')
  .offset([60, 10])
  .html(d => d);

svg.call(tip);

const getCityDesc = d => `
  <div>City: <b>${d.city}</b></div>
  <div>Regime: <b>${recentEvent(d.dates, sliderTime.value())}</b></div>
`;

// ---   Earth projection   ---
d3.geoZoom()
  .projection(projection)
  .onMove(render)
  (svg.node());

  // Sphere (Land)
  svg.append('path').attr('class', 'geo sphere')
    .datum({ type: 'Sphere' });
    
    function filter_cities(cities, year){
        let cities_now = []
        cities.forEach(function (d) {
            let regime = recentEvent(d.dates, sliderTime.value());
            if ( regime != "No one" ){
                cities_now.push(d);
            }
        })
        
        // Voronoi graph
        let voronoi = d3.geoVoronoi()
            .x(d => d.longitude)
            .y(d => d.latitude)
            (cities_now);

        // Voronoi polygons
        svg.append('g').selectAll('.voronoi')
            .data(voronoi.polygons().features)
            .enter().append('path')
            .attr('class', 'geo voronoi')
            .attr("id", d => d)
            .on('mousemove', ({properties: { site: d }}) => tip.show(getCityDesc(d)))
            .on('mouseout', tip.hide);
        
        
    }

  filter_cities(cities);
    
    
  function voronoi_rerender() {
  svg.selectAll("g").remove();
    svg.selectAll(".ocean").remove();
    
    filter_cities(cities, sliderTime.value());
    svg.append('path').attr('class', 'geo ocean')
        .datum(topojson.feature(world, world.objects.ocean));
    
    color_gray(svg); // Color every area gray by default
    colorize_regimes(regime_colors, svg);
    
    render();
  }
  // Remove voronois and rerender them
controls.rerender_voronois = function() {
    voronoi_rerender()
};
gui.add(controls, "rerender_voronois").name("Rerender voronois");

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
  
function colorize_regimes(regime_colors, svg) {
    svg.selectAll('path.voronoi').each(
        function (d, i) {
            if ( d.properties.site.dates.length > 0 ){
                let regime = recentEvent(d.properties.site.dates, sliderTime.value());
                this.style.fill = regime_colors[regime.toString()];
            }
        }
    );
}
  
  color_gray(svg); // Color every area gray by default
  colorize_regimes(regime_colors, svg);
  
  render();
});
