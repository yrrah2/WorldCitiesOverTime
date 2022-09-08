var map_date = {year: 1818, month: 5, day: 5};

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
gui.add(controls, "Year").min(-2000).max(2030).step(1).onChange(function(){
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
    .attr('width', 600)
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
  <div>Regime: <b>${d}</b></div>
`;

// ---   Earth projection   ---
d3.geoZoom()
  .projection(projection)
  .onMove(voronoi_refresh)
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
            let regime_index = indexes[recentEvent(item.properties.site.dates)];
            if(regime_index==1){console.log(item.geometry.coordinates)};
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
        
        
        var REcoords = [];
        coll[indexes["Roman Empire"]].geometry.coordinates.forEach(coord_array => coord_array.forEach(coord => REcoords.push(coord)));
        console.log(REcoords);
        
        var hull = d3.geoVoronoi().hull(coll[indexes["Roman Empire"]].geometry.coordinates);
        
        var poly = svg.append('g').selectAll('.polygons')
        .enter().append('path')
        .attr('class', 'geo voronoi')
        .datum(hull);
        
        poly.attr('d', path);
        
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
