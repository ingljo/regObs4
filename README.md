# RegObs app v4 (Ionic 4)
This is the regObs app versoin 4. It is based on code from app v3, but rewritten to Ionic 4.
Ionic 4 uses Angular 6 and TypeScript, so all pages and components have been rewritten.

## Installation

## Debugging

## Build and release

## Plugins and other custom features

# How to update all npm packages

Install npm-check-updates globally and check packages.json:

npm i -g npm-check-updates
ncu -u
npm install


# How to update regions and polygons

## Update Avalanche Warning Regions
Download new regions from [https://nedlasting.nve.no/gis/#].
- Select "Varslingsområder" -> "Snøskred"
- Format: GeoJson
- Coordinates: Geographic WGS84 (lat, lng)
- Area: "Landsdekkende"

Overwrite /assets/json/varslingsomraader.json