var map_date = {"year": 1818, "month": 5, "day": 5};

var play_width = 50;
var padding = 50;
var w = window.innerWidth - padding;

var margin = {
    top: 0,
    right: padding * 2,
    bottom: 300,
    left: padding * 2
  },
  height_slider = 100;

// Convert year to decimal
const convert_date = (date) => {
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
  'Year': 1800,
    'Beginning': 1900,
    'End': 1950,
    'Step': 1
};

gui.add(controls, 'Cities').onChange(enabled => d3.selectAll('.city').style('display', enabled ? null : 'none'));
gui.add(controls, 'Voronoi Layer').onChange( enabled => {
    d3.selectAll('.voronoi').style('display', enabled ? null : 'none');
});
gui.add(controls, "Year").min(1500).max(2030).step(1);
gui.add(controls, "Beginning").min(-1000).max(2030).step(1);
gui.add(controls, "End").min(1000).max(2030).step(1);
gui.add(controls, "Step").min(1).max(100).step(1);

// Year slider
const dataTime = d3.range(-1, 7).map( d => 338 * d );

function brushed() {
  var value = brush.extent()[0];

  if (d3.event.sourceEvent) {
    value = slider_x.invert(d3.mouse(this)[0]);
    document.getElementById("test").innerHTML = "<p>"+value.toString()+"</p>";
    brush.extent([value, value]);
  }

  handle.attr("cx", slider_x(value));
}

var brush, slider_x, handle;

function updateSlider() {
    slider_x = d3.time.scale()
        .domain([date_values[0], date_values[date_values.length - 1]])
        .range([0, w - 4 * padding])
        .clamp(true);

    brush = d3.svg.brush()
        .x(slider_x)
        .on("brush", brushed);
};
    
updateSlider();
    
const sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1)
    .width(556)
    .tickValues(dataTime)
    .default(1500)
    .on('onchange', val => {
      d3.select('p#value-time').text(Math.ceil(val));
        map_date.year = val;
        voronoi_refresh();
    });

const gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', w - play_width)
    .attr('height', height_slider);
    
const gTime_slider = gTime
    .append('g')
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


gTime_slider.call(sliderTime);
d3.select('p#value-time').text( sliderTime.value() );

// Start changing year every second
function start_history(svg) {
    let time = controls.Beginning;
    var time_interval = setInterval(function(){
        if(time <= controls.End) {
            time += controls.Step;
            sliderTime.value(time);
     } else {
         clearInterval(time_interval);
     }
    },1000);
}
    
// Button to start history
controls.start_history = () => start_history(svg);
gui.add(controls, "start_history").name("Start");

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

    function remove_voronois(){
        svg.selectAll("g").remove();
        svg.selectAll(".ocean").remove();
    }
    
    function voronoi_render(){
        let cities_now = cities.filter(city => {
            let event = recentEvent(city.dates, sliderTime.value());
            return !(event == "No one" || event == "Unknown" || event == "Abandoned");
            });
        
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
            .attr("id", d => d.city)
            .on('mouseover', function({properties: { site: d }}) {
                document.getElementById("tooltip").style.display = "block";
                document.getElementById("tooltip").innerHTML = getCityDesc(d);
        })
            .on('mouseout', () => document.getElementById("tooltip").style.display = "none");
        
        // Ocean overlay
        svg.append('path').attr('class', 'geo ocean')
            .datum(topojson.feature(world, world.objects.ocean));
        
        // City points
        //svg.append('g').selectAll('.city')
        //    .data(cities_now)
        //    .enter().append('path')
        //    .attr('class', 'geo city')
        //    .datum(d => ({
        //    type: 'Point',
        //    coordinates: [d.longitude, d.latitude],
        //    properties: d
        //}));
        
        // Give colors according to regime
        svg.selectAll('path.voronoi').each(function(area) {
                if ( area.properties.site.dates.length > 0 ) {
                    let regime = recentEvent(area.properties.site.dates, sliderTime.value());
                    this.style.fill = regime_colors[regime.toString()];
                }
            }
        );
    }
    
    function voronoi_refresh() {
        // Remove voronois and rerender them
        remove_voronois();
        voronoi_render();
        render();
    }

    voronoi_refresh();
});



// TESTING CODE::

var date_values = [];
date_values[0] = new Date(-2000, 9, 31);
date_values[1] = new Date(-1500, 10, 30);
date_values[2] = new Date(-1000, 11, 30);
date_values[3] = new Date(1000, 0, 31);
var current_nr_date_values = date_values.length - 1;

var play_width = 50;
var padding = 50;
var w = window.innerWidth - padding;


var margin = {
    top: 0,
    right: padding * 2,
    bottom: 300,
    left: padding * 2
  },
  height_slider = 100;

var slider_plays = false;
var slider_play_newstart = false;


updateSlider()



function brushed() {
  var value = brush.extent()[0];

  if (d3.event.sourceEvent) {
    value = slider_x.invert(d3.mouse(this)[0]);
    document.getElementById("test").innerHTML = "<p>"+value.toString()+"</p>";
    brush.extent([value, value]);
  }

  handle.attr("cx", slider_x(value));
}

var brush, slider_x, handle;

function updateSlider() {
  slider_x = d3.scaleTime()
    .domain([date_values[0], date_values[date_values.length - 1]])
    .range([0, w - 4 * padding])
    .clamp(true);

  brush = d3.svg.brush()
    .x(slider_x)
    .on("brush", brushed);

  d3.select("#scatterchart_slider").html("")
  var svg = d3.select("#scatterchart_slider").append("svg")
    .attr("width", w - play_width)
    .attr("height", height_slider)
  var svg_slider = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");



  svg_slider.append("g")
    .attr("class", "x axis_slider")
    .attr("transform", "translate(0," + height_slider / 2 + ")")
    .call(d3.svg.axis()
      .scale(slider_x)
      .tickValues(date_values)
      .orient("bottom")
      .tickFormat(d3.timeFormat("%Y"))
      .tickPadding(12))
    .select(".domain")
    .select(function() {
      return this.parentNode.appendChild(this.cloneNode(true));
    })
    .attr("class", "halo");

  var slider = svg_slider.append("g")
    .attr("class", "slider")
    .call(brush);

  slider.selectAll(".extent,.resize")
    .remove();

  slider.select(".background")
    .attr("height", height_slider);

  handle = slider.append("circle")
    .attr("class", "handle")
    .attr("transform", "translate(0," + height_slider / 2 + ")")
    .attr("r", 9);

  slider
    .call(brush.extent([date_values[current_nr_date_values], date_values[current_nr_date_values]]))
    .call(brush.event);
}

function resize_slider() {
  w = window.innerWidth - padding;
  updateSlider()
}

d3.select(window).on('resize', resize_slider);



