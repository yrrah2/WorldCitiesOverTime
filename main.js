var map_date = new Date("1818/05/05");

var date_locale = "en-US"; //default locale

Date.prototype.addTime = function(amount, units) {
    var date = new Date(this.valueOf());
    if (units == "Years") {date.setFullYear(date.getFullYear() + amount)}
    else if (units == "Months") {date.setMonth(date.getMonth() + amount)}
    else {date.setDate(date.getDate() + amount)};
    return date;
}

// Convert year to decimal
const convert_date = (date) => {
    let converted_date = new Date(0);
    
    // Check for BCE vs CE    
    let modifier = 1;
    if (date.charAt(0) === '-'){
        modifier = -1;
        date = date.substring(1);
    }
    
    // Get year
    let year = date.slice(0, 4);
    date = date.substring(5);
    converted_date.setFullYear(parseInt(year)*modifier);
    
    // Get month if exists
    if (date.length >= 2){
        let month = date.slice(0, 2);
        date = date.substring(3);
        converted_date.setMonth(parseInt(month)-1);
    }
    
    // Get day if exists
    if (date.length == 2){
        converted_date.setDate(parseInt(date));
    }
    return converted_date;
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
gui.domElement.id = 'gui_css';
const controls = {
  'Cities': false,
  'Year': 1800,
    'Beginning': 1900,
    'End': 1950,
    'Step': 1,
    'Unit': "Years"
};
    
gui.add(controls, 'Cities').onChange(enabled => d3.selectAll('.voronoi').style('stroke', enabled ? null : 'black'));
gui.add(controls, "Year").min(-2000).max(2030).step(1).onChange(function(){
    map_date.setFullYear(controls.Year);
    d3.select('p#value-time').text(
        map_date.toLocaleDateString(date_locale, { year: 'numeric', month: 'long', day: 'numeric' })
    );
    voronoi_refresh();
});
gui.add(controls, "Beginning").min(-1000).max(2030).step(1);
gui.add(controls, "End").min(1000).max(2030).step(1);
gui.add(controls, "Step").min(1).max(100).step(1);
gui.add(controls, 'Unit', ['Years', 'Months', 'Days'] );

d3.select('p#value-time').text(
    map_date.toLocaleDateString(date_locale, { year: 'numeric', month: 'long', day: 'numeric' })
);

// Start changing year every second
function start_history(svg) {
    let end_date = new Date(0);
    end_date.setFullYear(controls.End);
    map_date.setFullYear(controls.Beginning);
    var time_interval = setInterval(function(){
        if(map_date <= end_date) {
            map_date = map_date.addTime(controls.Step, controls.Unit);
            d3.select('p#value-time').text(
    map_date.toLocaleDateString(date_locale, { year: 'numeric', month: 'long', day: 'numeric' })
);
            voronoi_refresh();
     } else {
         clearInterval(time_interval);
     }
    },100);
}
    
// Button to start history
controls.start_history = () => start_history(svg);
gui.add(controls, "start_history").name("Start");

    const getCityDesc = d => `
    <div>Regime: <b>${d}</b></div>
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
    
    // Find recent event date
    
    const recentEvent = (events) => {
        const eventsBefore = events.filter(event => convert_date(event.date) < map_date);
        let event = eventsBefore[eventsBefore.length-1];
        if ( event == undefined ){
            return "No one";
        } else if (event.type == 0) {
                let superior = cities.find(city => city.name == event.regime);
                return recentEvent(superior.history);
        } else {
                return event.regime.toString()
        }
    }
    
    function voronoi_render(){
        let cities_now = cities.filter(city => {
            let event = recentEvent(city.history);
            return !(event == "No one" || event == "Unknown" || event == "Abandoned");
            });
        
        // Voronoi graph
        let voronoi = d3.geoVoronoi()
            .x(d => d.longitude)
            .y(d => d.latitude)
            (cities_now);
        
        //let coord_test = [];
        
        const coll = [];
        
        var indexes = {};
        
        regimes.forEach(regime => {
            coll.push({
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: []
                    },
                    properties: {"regime": regime}
                });
            indexes[regime] = coll.length-1;
        });
        
        voronoi.polygons().features.forEach(item => {
            let regime_index = indexes[recentEvent(item.properties.site.history)];
            item.geometry.coordinates.forEach(coord => {
                if (coll[regime_index].geometry.coordinates.indexOf(coord) === -1){
                    coll[regime_index].geometry.coordinates.push(coord);
                }
            });
        });
        
        // Geometry coords
        svg.append('g').selectAll('.voronoi')
            .data(coll)
            .enter().append('path')
            .attr('class', 'geo voronoi')
            .on('mouseover', function(d) {
                document.getElementById("tooltip").style.display = "block";
                document.getElementById("tooltip").innerHTML = getCityDesc(d.properties.regime);
        })
            .on('mouseout', () => document.getElementById("tooltip").style.display = "none");;
        
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
            let regime = area.properties.regime;
            this.style.fill = regime_colors[regime.toString()];
        });
    }

    
    function voronoi_refresh() {
        // Remove voronois and rerender them
        remove_voronois();
        voronoi_render();
        render();
    }

    voronoi_refresh();
});
