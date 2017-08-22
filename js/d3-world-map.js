(function() {
    'use strict';

    angular.module('d3WorldMapApp')
        .directive('d3WorldMap', d3WorldMap);

    d3WorldMap.$inject = ['$interval'];

    function d3WorldMap($interval) {
        return {
            restrict: 'E',
            replace: true,
            scope: {},
            templateUrl: 'html/d3-world-map.html',
            link: function(scope, elem, attrs) {
                var width = 818,
                    height = 600,
                    colors = [
                        '#a50026',
                        '#d73027',
                        '#f46d43',
                        '#fdae61',
                        '#fee08b',
                        '#d9ef8b',
                        '#a6d96a',
                        '#66bd63',
                        '#1a9850',
                        '#006837'
                    ],
                    defColor = 'white',
                    colorsScale = [100, 0],
                    currentYear = "1993",
                    playing = false,
                    years = [];

                var lw = 200,
                    lh = 10,
                    /* legend width, height */
                    lpad = 10,
                    /* legend padding */
                    lcw = lw / colors.length,
                    lch = lh; /* legend category width */

                var svg,
                    path,
                    getColor,
                    slider;

                function activate() {
                    setMap();
                    loadData(processData);
                }

                function setMap() {
                    svg = d3.select('#d3-world-map')
                        .append('svg') /* create svg */
                        .attr('width', width) /* set svg width */
                        .attr('height', height); /* set svg height */

                    /* constructs a quantize scale */
                    getColor = d3.scale.quantize()
                        .domain(colorsScale)
                        .range(colors);

                    /* create a map projection */
                    var miller = d3.geo.miller()
                        .scale(130) /* scale factor */
                        .translate([width / 2, height / 2]) /* pixel coordinates of the projection’s center */
                        .precision(0.1); /* accuracy of projected lines and polygons */

                    /* create an object that will turn the geodata into a set of consecutive lines */
                    path = d3.geo.path() /* creates a new geographic path generator with the default settings */
                        .projection(miller); /* convert spherical coordinates (in degrees) to Cartesian coordinates (in pixels) */
                }

                function loadData(callback) {
                    queue()
                        .defer(d3.json, "data/topoworld.json") /* load world data */
                        .defer(d3.csv, "data/freedom.csv") /* load freedom data */
                        .await(callback); /* callback on data loaded */
                }

                /**
                 * @param  {Object} error              erors while loading data
                 * @param  {Object} worldMapData       loaded world.json
                 * @param  {Array}  countryFreedomData loaded freedom.csv
                 */
                function processData(error, worldMapData, countryFreedomData) {
                    /* convert TopoJson to GeoJson */
                    var world = topojson.feature(worldMapData, worldMapData.objects.world);

                    /* To draw data about freedom of speech, we need to associate them with each country, and now our task is to add to the GeoJSON (world object) data on freedom of speech (the countryFreedomData object). */

                    for (var i in world.features) {
                        for (var j in countryFreedomData) {
                            if (world.features[i].id == countryFreedomData[j].ISO3166) {
                                for (var k in countryFreedomData[j]) {
                                    if (k !== 'Country' && k !== 'ISO3166') {
                                        if (years.indexOf(k) === -1) {
                                            years.push(k);
                                        }
                                        world.features[i].properties[k] = Number(countryFreedomData[j][k]);
                                    }
                                }
                                break;
                            }
                        }
                    }

                    /* Also, next to the variables width, height, svg, path, declare the variable years = [], in which the years from 1993 to 2014 will be recorded. Now each country has values in the properties attribute that are laid out over the years. The data lies in such a way that to each value of the year there corresponds one conditional value from 0 to 100 (where 0 is the absolute freedom of the press, 100 is absolute censorship). */

                    drawMap(world);
                }

                function drawMap(world) {
                    svg.append("g")
                        .selectAll(".country")
                        .data(world.features)
                        .enter()
                        .append("path")
                        .attr("class", "country")
                        .attr("d", path);

                    sequenceMap();
                    addLegend();
                    addSlider();
                }

                function sequenceMap() {
                    d3.selectAll('.country')
                        .style('fill', function(d) {
                            var color = getColor(d.properties[currentYear]);
                            return color ? color : defColor;
                        });
                }

                function addLegend() {
                    var legend = svg.append("g")
                        .attr("width", lw)
                        .attr("height", lh)
                        .attr(
                            "transform",
                            "translate(" + (width + (lpad - width)) + "," + (height - (lh + lpad)) + ")");

                    for (var i = 0; i < colors.length; i++) {
                        legend.append("rect")
                            .attr("width", lcw)
                            .attr("height", lch)
                            .attr("x", i * lcw)
                            .style("fill", colors[i]);
                    }
                }

                function addSlider() {
                    /* Add year indicator */
                    svg.append("text")
                        .attr("id", "year")
                        .attr("transform", "translate(409,550)")
                        .text(currentYear);

                    /* Add slider button */
                    var btn = svg.append("g")
                        .attr("class", "button")
                        .attr("id", "play")
                        .attr("transform", "translate(270,568)")
                        .attr("onmouseup", animateMap);

                    var playBtn = btn.append("g")
                        .attr("class", "play")
                        .attr("display", "inline");
                    playBtn.append("path")
                        .attr("d", "M0 0 L0 16 L12 8 Z")
                        .style("fill", "#234c75");

                    var stopBtn = btn.append("g")
                        .attr("class", "stop")
                        .attr("display", "none");
                    stopBtn.append("path")
                        .attr("d", "m 0,0 0,16")
                        .attr("stroke", "#234c75")
                        .attr("stroke-width", 6);
                    stopBtn.append("path")
                        .attr("d", "m 8,0 0,16")
                        .attr("stroke", "#234c75")
                        .attr("stroke-width", 6);

                    /* Initialize slider */
                    slider = d3.slider()
                        .min(d3.min(years))
                        .max(d3.max(years))
                        .tickValues(d3.range(d3.min(years), d3.max(years), 5))
                        .stepValues(d3.range(d3.min(years), d3.max(years)))
                        .tickFormat(function(d) {
                            return d3.format("04d")(d);
                        });

                    svg.append("g")
                        .attr("width", 300)
                        .attr("id", "slider")
                        .attr("transform", "translate(273,545)");

                    /* Render the slider in the div */
                    d3.select('#slider').call(slider);
                    var dragBehaviour = d3.behavior.drag();

                    dragBehaviour.on("drag", function(d) {
                        var pos = d3.event.x;
                        slider.move(pos + 25);
                        currentYear = slider.value();
                        sequenceMap();
                        d3.select("#year").text(currentYear);
                    });

                    svg.selectAll(".dragger").call(dragBehaviour);
                }

                function animateMap() {
                    var timer;
                    d3.select('#play').on('click', function() {
                        if (playing === false) {
                            timer = $interval(function() {
                                if (currentYear < years[years.length - 1]) {
                                    currentYear = (parseInt(currentYear) + 1).toString();
                                } else {
                                    currentYear = years[0];
                                }
                                sequenceMap();
                                slider.setValue(currentYear);
                                d3.select("#year").text(currentYear);
                            }, 1000);

                            d3.select(this).select('.play').attr('display', 'none');
                            d3.select(this).select('.stop').attr('display', 'inline');
                            playing = true;
                        } else {
                            $interval.cancel(timer);
                            d3.select(this).select('.play').attr('display', 'inline');
                            d3.select(this).select('.stop').attr('display', 'none');
                            playing = false;
                        }
                    });
                }

                activate();
            }
        };
    }
})();
