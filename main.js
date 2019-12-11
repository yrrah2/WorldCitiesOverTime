 const MAX_URQUHART_DISTANCE = 0.15; // geo radians

// Random Colour Generator
function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Controls
const gui = new dat.GUI();
const controls = {
  'Cities': true,
  'Graticule Grid': false,
  'Voronoi Layer': true,
};
gui.add(controls, 'Cities').onChange(enabled => d3.selectAll('.city').style('display', enabled ? null : 'none'));
gui.add(controls, 'Graticule Grid').onChange(enabled => d3.selectAll('.graticule').style('display', enabled ? null : 'none'));
gui.add(controls, 'Voronoi Layer').onChange(enabled => d3.selectAll('.voronoi').style('display', enabled ? null : 'none'));

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
//const followCursor = svg.append('circle').style('pointer-events', 'none'); // helper to make tip follow cursor
//svg.on('mousemove', () => followCursor.attr('cx', d3.event.pageX).attr('cy', d3.event.pageY));

const getCityDesc = d => `
  <div><b>${d.city}</b></div>
  <div>Longitude: ${d.longitude}</div>
  <div>Latitude: ${d.latitude}</div>
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
  fetch('https://unpkg.com/world-atlas@1/world/110m.json').then(r => r.json()),
  fetch('https://yrrah2.github.io/WorldCitiesOverTime/cities.json').then(r => r.json())
]).then(([world, cities]) => {
  // water
  svg.append('path').attr('class', 'geo sphere')
    .datum({ type: 'Sphere' });

  // land
  svg.append('path').attr('class', 'geo land')
    .datum(topojson.feature(world, world.objects.land).features[0]);

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

  render();
});

//

function render() {
  svg.selectAll('path.geo').attr('d', path);
  svg.selectAll('path.voronoi').attr("fill", getRandomColor() );
}
