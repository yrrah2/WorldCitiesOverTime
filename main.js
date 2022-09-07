var map_date = {year: 1818, month: 5, day: 5};
var play_width = 50;
var padding = 50;
var w = window.innerWidth - padding;

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
const recentEvent = (dates) => {
    const datesBefore = dates.filter(date => convert_date(date.year).year < map_date.year);
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
    let paths = svg.selectAll('path.geo');
    paths.attr('d', path);
    
    let regime_obj = {};
    console.log(paths);
    paths._groups[0].forEach(path => {
        if(path.classList[1] == "voronoi"){
            let regime = path.classList[2].replace("_",/ /g);
            if (regime_obj[regime] == undefined){
                regime_obj[regime] = path;
            } else {
                regime_obj[regime].setAttribute('d', regime_obj[regime].getAttribute('d') + ' ' + path.getAttribute('d'));
                path.parentNode.removeChild(path);
            }
        }
    }
                            );
    paths.attr('d', path);
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
gui.add(controls, "Year").min(1500).max(2030).step(1).onChange(function(){
    map_date.year = controls.Year;
    sliderTime.value(controls.Year);
});
gui.add(controls, "Beginning").min(-1000).max(2030).step(1);
gui.add(controls, "End").min(1000).max(2030).step(1);
gui.add(controls, "Step").min(1).max(100).step(1);

// Year slider
const dataTime = d3.range(-1, 7).map( d => 338 * d );

const sliderTime = d3
    .sliderBottom()
    .min(d3.min(dataTime))
    .max(d3.max(dataTime))
    .step(1)
    .width(556)
    .tickValues(dataTime)
    .default(1500)
    .on('onchange', val => {
      d3.select('p#value-time').text(Math.ceil(map_date.year).toString());
        map_date.year = val;
        voronoi_refresh();
    });

const gTime = d3
    .select('div#slider-time')
    .append('svg')
    .attr('width', w - play_width)
    .attr('height', 100);
    
const gTime_slider = gTime
    .append('g');
    //.attr('transform', 'translate(30,30)');


gTime_slider.call(sliderTime);
d3.select('p#value-time').text( Math.ceil(map_date.year).toString());

// Start changing year every second
function start_history(svg) {
    let time = controls.Beginning;
    var time_interval = setInterval(function(){
        if(time <= controls.End) {
            time += controls.Step;
            map_date.year = time;
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
  <div>Regime: <b>${recentEvent(d.dates)}</b></div>
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
            let event = recentEvent(city.dates);
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
            .attr("id", d => d.properties.site.city)
            .on('mouseover', function(d) {
                document.getElementById("tooltip").style.display = "block";
                document.getElementById("tooltip").innerHTML = getCityDesc(d.properties.site);
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
                    let regime = recentEvent(area.properties.site.dates);
                    this.style.fill = regime_colors[regime.toString()];
                    this.setAttribute("class", this.className.baseVal + ' ' + regime.replace(/ /g,"_"));
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
