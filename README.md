# Mapbox GL Dual Scale Control

Shows both metric and imperial at the same time as well as lat/lon mouse position

This is an unofficial plugin, and is not affliated with Mapbox. 😇

## Installation

```sh
npm install mapbox-gl-dual-scale-control
``` 
or 
```sh
yarn add mapbox-gl-dual-scale-control
```

## Usage

```
var DualScaleControl = require('mapbox-gl-dual-scale-control');
map.addControl(new DualScaleControl({
    maxWidth: 80
}));
```

Include `dist/mapbox-gl-dual-scale-control.css` on your page, or use it as starting point to apply your own style


## Development

Build: `npm run build-dev`

## License

MIT

## Attributions

Adapted from the default mapbox-gl ScaleControl
