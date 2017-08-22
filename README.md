# angular-d3-maps #
Getting started with the Google Maps JavaScript API. Based on tutorial from [FrontenderMagazine](https://github.com/FrontenderMagazine/d3js-map-visualization/blob/master/rus.md).


### Dependencies
```
$ sudo apt-get install nodejs
$ ln -s /usr/bin/nodejs /usr/bin/node
$ sudo apt-get install npm
$ sudo apt-get install gdal-bin
```


### Data Conversion

First we need to get the final TopoJSON file from the shapefiles. To do this, we need to generate an intermediate GeoJSON file. At the stage of generating the GeoJSON file, we are able to filter out data from shapefiles that we do not need, and reduce the number of decimal places in the values, which is important for increasing the rendering speed, and simply reduces the file size by approximately 85%. In the end, the process of converting data schematically looks like this:
```
Shapefiles ⟶ GeoJSON ⟶ TopoJSON
```

So, let's start the conversion. We need to get TopoJSON with the countries of the world:
1. Downloading and unpacking the archive. On the [Natural Earth site](http://www.naturalearthdata.com/) in the `Downloads` section, select `1:110m Cultural Vectors`, select `Admin 0 - Countries` from the list and click `Download` countries. I strongly advise you to go and see what is offered and what formats are presented.

2. Convert `shapefiles` to `GeoJSON`:
```
$ ogr2ogr -f GeoJSON world.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp
```
`world.json` - the name of the file that will be created by the result of generation.

3. Convert `GeoJSON` to `TopoJSON`:
```
$ topojson -o topoworld.json --id-property SU_A3 world.json
```
`topoworld.json` - the resulting `TopoJSON` file.

As for me, the theme of working with utilities `ogr2ogr` and `topojson` is worth a separate article. Play with different filters. For example, separately `Ukraine` with the borders of the regions can be obtained as follows:
```
$ ogr2ogr -f GeoJSON -where "ADM0_A3 IN ('UKR')" ukraine.json ne_10m_admin_0_map_subunits/ne_10m_admin_0_map_subunits.shp
$ ogr2ogr -f GeoJSON -where "ISO_A2 = 'UA' AND SCALERANK < 8" ukr_obls.json ne_10m_populated_places/ne_10m_populated_places.shp
$ topojson -o ukr.json --id-property SU_A3 --properties name=NAME ukraine.json ukr_obls.json
```

We will also need data on freedom of the press in recent years. The necessary information in an acceptable format can be found at [Freedom House](https://freedomhouse.org/report-types/freedom-press). Data is a conditional press freedom index from 0 to 100, where 0 is the most free country, and 100 is the least free. Next, we'll bring the data to the `CSV` format (convenient for working in `D3.js`) with the title: `Country`, `ISO3166`, `1993`, ..., `2014`, where:
* `Country` - the name of the country;
* `ISO3166` - state code in the international format ISO 3166;
* `1993 ... 2014` - press freedom indexes from 0 to 100.


### How do I get set up? ###
```bash
$ npm install
$ bower install
$ npm start
```
