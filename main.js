 const MAX_URQUHART_DISTANCE = 0.15; // geo radians

    // Controls
    const gui = new dat.GUI();
    const controls = {
      'Volcanoes': true,
      'Graticule Grid': true,
      'Tectonic Plates': true,
      'Voronoi Layer': false,
      'Urquhart Layer': true
    };
    gui.add(controls, 'Volcanoes').onChange(enabled => d3.selectAll('.volcano').style('display', enabled ? null : 'none'));
    gui.add(controls, 'Graticule Grid').onChange(enabled => d3.selectAll('.graticule').style('display', enabled ? null : 'none'));
    gui.add(controls, 'Tectonic Plates').onChange(enabled => d3.selectAll('.plate').style('display', enabled ? null : 'none'));
    gui.add(controls, 'Voronoi Layer').onChange(enabled => d3.selectAll('.voronoi').style('display', enabled ? null : 'none'));
    gui.add(controls, 'Urquhart Layer').onChange(enabled => d3.selectAll('.urquhart').style('display', enabled ? null : 'none'));

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('#world').append('svg')
      .attr('width', width)
      .attr('height', height);

    const tip = d3.tip()
      .attr('class', 'tooltip')
      .direction('s')
      .offset([30, 10])
      .html(d => d);

    svg.call(tip);
    const followCursor = svg.append('circle').style('pointer-events', 'none'); // helper to make tip follow cursor
    svg.on('mousemove', () => followCursor.attr('cx', d3.event.pageX).attr('cy', d3.event.pageY));

    const getVolcanoDesc = d => `
      <div><b>${d.name}</b>, ${d.country}</div>
      <div>(${d.type})</div>
      <div>Elevation: <em>${d.elevation}</em>m</div>
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
      fetch('//unpkg.com/world-atlas@1/world/110m.json').then(r => r.json()),
      fetch('plates.stitched.geo.json').then(r => r.json()),
      fetch('world_volcanoes.json').then(r => r.json())
    ]).then(([world, tectonicPlates, volcanoes]) => {
      // water
      svg.append('path').attr('class', 'geo sphere')
        .datum({ type: 'Sphere' });

      // land
      svg.append('path').attr('class', 'geo land')
        .datum(topojson.feature(world, world.objects.land).features[0]);

      // graticules
      svg.append('path').attr('class', 'geo graticule')
        .datum(d3.geoGraticule10());

      // tectonic plates
      svg.append('g').selectAll('.plate')
        .data(tectonicPlates.features)
        .enter().append('path')
          .attr('class', 'geo plate')
          .on('mousemove', ({properties: p}) => tip.show(`Plate: ${p.PlateName} (${p.Code})`, followCursor.node()))
          .on('mouseout', tip.hide);

        const voronoi = d3.geoVoronoi()
        .x(d => d.lon)
        .y(d => d.lat)
        (volcanoes);

      // voronoi polygons
      svg.append('g').selectAll('.voronoi')
        .data(voronoi.polygons().features)
        .enter().append('path')
          .attr('class', 'geo voronoi')
          .style('display', 'none') // hidden by default
          .on('mousemove', ({properties: { site: d }}) => tip.show(getVolcanoDesc(d), followCursor.node()))
          .on('mouseout', tip.hide);

      const urquhart = voronoi.links();
      urquhart.features = urquhart.features.filter(f => f.properties.urquhart && f.properties.length < MAX_URQUHART_DISTANCE);

      // urquhart links
      svg.append('path')
        .attr('class', 'geo urquhart')
        .datum(urquhart);

      // volcano points
      svg.append('g').selectAll('.volcano')
        .data(volcanoes)
        .enter().append('path')
          .attr('class', 'geo volcano')
          .datum(d => ({
            type: 'Point',
            coordinates: [d.lon, d.lat],
            properties: d
          }))
          .on('mousemove', ({properties: d}) => tip.show(getVolcanoDesc(d), followCursor.node()))
          .on('mouseout', tip.hide);

      render();
    });

    //

    function render() {
      svg.selectAll('path.geo').attr('d', path);
    }
