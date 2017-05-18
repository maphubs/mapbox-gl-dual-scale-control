(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DualScaleControl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Ported from Webkit
 * http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/platform/graphics/UnitBezier.h
 */

module.exports = UnitBezier;

function UnitBezier(p1x, p1y, p2x, p2y) {
    // Calculate the polynomial coefficients, implicit first and last control points are (0,0) and (1,1).
    this.cx = 3.0 * p1x;
    this.bx = 3.0 * (p2x - p1x) - this.cx;
    this.ax = 1.0 - this.cx - this.bx;

    this.cy = 3.0 * p1y;
    this.by = 3.0 * (p2y - p1y) - this.cy;
    this.ay = 1.0 - this.cy - this.by;

    this.p1x = p1x;
    this.p1y = p2y;
    this.p2x = p2x;
    this.p2y = p2y;
}

UnitBezier.prototype.sampleCurveX = function(t) {
    // `ax t^3 + bx t^2 + cx t' expanded using Horner's rule.
    return ((this.ax * t + this.bx) * t + this.cx) * t;
};

UnitBezier.prototype.sampleCurveY = function(t) {
    return ((this.ay * t + this.by) * t + this.cy) * t;
};

UnitBezier.prototype.sampleCurveDerivativeX = function(t) {
    return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
};

UnitBezier.prototype.solveCurveX = function(x, epsilon) {
    if (typeof epsilon === 'undefined') epsilon = 1e-6;

    var t0, t1, t2, x2, i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; i++) {

        x2 = this.sampleCurveX(t2) - x;
        if (Math.abs(x2) < epsilon) return t2;

        var d2 = this.sampleCurveDerivativeX(t2);
        if (Math.abs(d2) < 1e-6) break;

        t2 = t2 - x2 / d2;
    }

    // Fall back to the bisection method for reliability.
    t0 = 0.0;
    t1 = 1.0;
    t2 = x;

    if (t2 < t0) return t0;
    if (t2 > t1) return t1;

    while (t0 < t1) {

        x2 = this.sampleCurveX(t2);
        if (Math.abs(x2 - x) < epsilon) return t2;

        if (x > x2) {
            t0 = t2;
        } else {
            t1 = t2;
        }

        t2 = (t1 - t0) * 0.5 + t0;
    }

    // Failure.
    return t2;
};

UnitBezier.prototype.solve = function(x, epsilon) {
    return this.sampleCurveY(this.solveCurveX(x, epsilon));
};

},{}],2:[function(require,module,exports){
'use strict';
//      

/**
 * A coordinate is a column, row, zoom combination, often used
 * as the data component of a tile.
 *
 * @param {number} column
 * @param {number} row
 * @param {number} zoom
 * @private
 */
var Coordinate = function Coordinate(column    , row    , zoom    ) {
    this.column = column;
    this.row = row;
    this.zoom = zoom;
};

/**
 * Create a clone of this coordinate that can be mutated without
 * changing the original coordinate
 *
 * @returns {Coordinate} clone
 * @private
 * var coord = new Coordinate(0, 0, 0);
 * var c2 = coord.clone();
 * // since coord is cloned, modifying a property of c2 does
 * // not modify it.
 * c2.zoom = 2;
 */
Coordinate.prototype.clone = function clone () {
    return new Coordinate(this.column, this.row, this.zoom);
};

/**
 * Zoom this coordinate to a given zoom level. This returns a new
 * coordinate object, not mutating the old one.
 *
 * @param {number} zoom
 * @returns {Coordinate} zoomed coordinate
 * @private
 * @example
 * var coord = new Coordinate(0, 0, 0);
 * var c2 = coord.zoomTo(1);
 * c2 // equals new Coordinate(0, 0, 1);
 */
Coordinate.prototype.zoomTo = function zoomTo (zoom    ) { return this.clone()._zoomTo(zoom); };

/**
 * Subtract the column and row values of this coordinate from those
 * of another coordinate. The other coordinat will be zoomed to the
 * same level as `this` before the subtraction occurs
 *
 * @param {Coordinate} c other coordinate
 * @returns {Coordinate} result
 * @private
 */
Coordinate.prototype.sub = function sub (c        ) { return this.clone()._sub(c); };

Coordinate.prototype._zoomTo = function _zoomTo (zoom    ) {
    var scale = Math.pow(2, zoom - this.zoom);
    this.column *= scale;
    this.row *= scale;
    this.zoom = zoom;
    return this;
};

Coordinate.prototype._sub = function _sub (c        ) {
    c = c.zoomTo(this.zoom);
    this.column -= c.column;
    this.row -= c.row;
    return this;
};

module.exports = Coordinate;

},{}],3:[function(require,module,exports){
'use strict';

/* eslint-env browser */
module.exports = self;

},{}],4:[function(require,module,exports){
'use strict';

var Point = require('point-geometry');
var window = require('./window');

exports.create = function (tagName, className, container) {
    var el = window.document.createElement(tagName);
    if (className) { el.className = className; }
    if (container) { container.appendChild(el); }
    return el;
};

var docStyle = window.document.documentElement.style;

function testProp(props) {
    for (var i = 0; i < props.length; i++) {
        if (props[i] in docStyle) {
            return props[i];
        }
    }
    return props[0];
}

var selectProp = testProp(['userSelect', 'MozUserSelect', 'WebkitUserSelect', 'msUserSelect']);
var userSelect;
exports.disableDrag = function () {
    if (selectProp) {
        userSelect = docStyle[selectProp];
        docStyle[selectProp] = 'none';
    }
};
exports.enableDrag = function () {
    if (selectProp) {
        docStyle[selectProp] = userSelect;
    }
};

var transformProp = testProp(['transform', 'WebkitTransform']);
exports.setTransform = function(el, value) {
    el.style[transformProp] = value;
};

// Suppress the next click, but only if it's immediate.
function suppressClick(e) {
    e.preventDefault();
    e.stopPropagation();
    window.removeEventListener('click', suppressClick, true);
}
exports.suppressClick = function() {
    window.addEventListener('click', suppressClick, true);
    window.setTimeout(function () {
        window.removeEventListener('click', suppressClick, true);
    }, 0);
};

exports.mousePos = function (el, e) {
    var rect = el.getBoundingClientRect();
    e = e.touches ? e.touches[0] : e;
    return new Point(
        e.clientX - rect.left - el.clientLeft,
        e.clientY - rect.top - el.clientTop
    );
};

exports.touchPos = function (el, e) {
    var rect = el.getBoundingClientRect(),
        points = [];
    var touches = (e.type === 'touchend') ? e.changedTouches : e.touches;
    for (var i = 0; i < touches.length; i++) {
        points.push(new Point(
            touches[i].clientX - rect.left - el.clientLeft,
            touches[i].clientY - rect.top - el.clientTop
        ));
    }
    return points;
};

exports.remove = function(node) {
    if (node.parentNode) {
        node.parentNode.removeChild(node);
    }
};

},{"./window":3,"point-geometry":6}],5:[function(require,module,exports){
'use strict';
//      

var UnitBezier = require('@mapbox/unitbezier');
var Coordinate = require('../geo/coordinate');
var Point = require('point-geometry');

/**
 * Given a value `t` that varies between 0 and 1, return
 * an interpolation function that eases between 0 and 1 in a pleasing
 * cubic in-out fashion.
 *
 * @private
 */
exports.easeCubicInOut = function(t        )         {
    if (t <= 0) { return 0; }
    if (t >= 1) { return 1; }
    var t2 = t * t,
        t3 = t2 * t;
    return 4 * (t < 0.5 ? t3 : 3 * (t - t2) + t3 - 0.75);
};

/**
 * Given given (x, y), (x1, y1) control points for a bezier curve,
 * return a function that interpolates along that curve.
 *
 * @param p1x control point 1 x coordinate
 * @param p1y control point 1 y coordinate
 * @param p2x control point 2 x coordinate
 * @param p2y control point 2 y coordinate
 * @private
 */
exports.bezier = function(p1x        , p1y        , p2x        , p2y        )                        {
    var bezier = new UnitBezier(p1x, p1y, p2x, p2y);
    return function(t        ) {
        return bezier.solve(t);
    };
};

/**
 * A default bezier-curve powered easing function with
 * control points (0.25, 0.1) and (0.25, 1)
 *
 * @private
 */
exports.ease = exports.bezier(0.25, 0.1, 0.25, 1);

/**
 * constrain n to the given range via min + max
 *
 * @param n value
 * @param min the minimum value to be returned
 * @param max the maximum value to be returned
 * @returns the clamped value
 * @private
 */
exports.clamp = function (n        , min        , max        )         {
    return Math.min(max, Math.max(min, n));
};

/**
 * constrain n to the given range, excluding the minimum, via modular arithmetic
 *
 * @param n value
 * @param min the minimum value to be returned, exclusive
 * @param max the maximum value to be returned, inclusive
 * @returns constrained number
 * @private
 */
exports.wrap = function (n        , min        , max        )         {
    var d = max - min;
    var w = ((n - min) % d + d) % d + min;
    return (w === min) ? max : w;
};

/*
 * Call an asynchronous function on an array of arguments,
 * calling `callback` with the completed results of all calls.
 *
 * @param array input to each call of the async function.
 * @param fn an async function with signature (data, callback)
 * @param callback a callback run after all async work is done.
 * called with an array, containing the results of each async call.
 * @private
 */
exports.asyncAll = function (array            , fn          , callback          ) {
    if (!array.length) { return callback(null, []); }
    var remaining = array.length;
    var results = new Array(array.length);
    var error = null;
    array.forEach(function (item, i) {
        fn(item, function (err, result) {
            if (err) { error = err; }
            results[i] = result;
            if (--remaining === 0) { callback(error, results); }
        });
    });
};

/*
 * Polyfill for Object.values. Not fully spec compliant, but we don't
 * need it to be.
 *
 * @private
 */
exports.values = function (obj        )                {
    var result = [];
    for (var k in obj) {
        result.push(obj[k]);
    }
    return result;
};

/*
 * Compute the difference between the keys in one object and the keys
 * in another object.
 *
 * @returns keys difference
 * @private
 */
exports.keysDifference = function (obj        , other        )                {
    var difference = [];
    for (var i in obj) {
        if (!(i in other)) {
            difference.push(i);
        }
    }
    return difference;
};

/**
 * Given a destination object and optionally many source objects,
 * copy all properties from the source objects into the destination.
 * The last source object given overrides properties from previous
 * source objects.
 *
 * @param dest destination object
 * @param {...Object} sources sources from which properties are pulled
 * @private
 */
// eslint-disable-next-line no-unused-vars
exports.extend = function (dest        , source0        , source1         , source2         )         {
    var arguments$1 = arguments;

    for (var i = 1; i < arguments.length; i++) {
        var src = arguments$1[i];
        for (var k in src) {
            dest[k] = src[k];
        }
    }
    return dest;
};

/**
 * Given an object and a number of properties as strings, return version
 * of that object with only those properties.
 *
 * @param src the object
 * @param properties an array of property names chosen
 * to appear on the resulting object.
 * @returns object with limited properties.
 * @example
 * var foo = { name: 'Charlie', age: 10 };
 * var justName = pick(foo, ['name']);
 * // justName = { name: 'Charlie' }
 * @private
 */
exports.pick = function (src        , properties               )         {
    var result = {};
    for (var i = 0; i < properties.length; i++) {
        var k = properties[i];
        if (k in src) {
            result[k] = src[k];
        }
    }
    return result;
};

var id = 1;

/**
 * Return a unique numeric id, starting at 1 and incrementing with
 * each call.
 *
 * @returns unique numeric id.
 * @private
 */
exports.uniqueId = function ()         {
    return id++;
};

/**
 * Given an array of member function names as strings, replace all of them
 * with bound versions that will always refer to `context` as `this`. This
 * is useful for classes where otherwise event bindings would reassign
 * `this` to the evented object or some other value: this lets you ensure
 * the `this` value always.
 *
 * @param fns list of member function names
 * @param context the context value
 * @example
 * function MyClass() {
 *   bindAll(['ontimer'], this);
 *   this.name = 'Tom';
 * }
 * MyClass.prototype.ontimer = function() {
 *   alert(this.name);
 * };
 * var myClass = new MyClass();
 * setTimeout(myClass.ontimer, 100);
 * @private
 */
exports.bindAll = function(fns               , context        )       {
    fns.forEach(function (fn) {
        if (!context[fn]) { return; }
        context[fn] = context[fn].bind(context);
    });
};

/**
 * Given a list of coordinates, get their center as a coordinate.
 *
 * @returns centerpoint
 * @private
 */
exports.getCoordinatesCenter = function(coords                   )             {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;

    for (var i = 0; i < coords.length; i++) {
        minX = Math.min(minX, coords[i].column);
        minY = Math.min(minY, coords[i].row);
        maxX = Math.max(maxX, coords[i].column);
        maxY = Math.max(maxY, coords[i].row);
    }

    var dx = maxX - minX;
    var dy = maxY - minY;
    var dMax = Math.max(dx, dy);
    var zoom = Math.max(0, Math.floor(-Math.log(dMax) / Math.LN2));
    return new Coordinate((minX + maxX) / 2, (minY + maxY) / 2, 0)
        .zoomTo(zoom);
};

/**
 * Determine if a string ends with a particular substring
 *
 * @private
 */
exports.endsWith = function(string        , suffix        )          {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
};

/**
 * Create an object by mapping all the values of an existing object while
 * preserving their keys.
 *
 * @private
 */
exports.mapObject = function(input        , iterator          , context         )         {
    var this$1 = this;

    var output = {};
    for (var key in input) {
        output[key] = iterator.call(context || this$1, input[key], key, input);
    }
    return output;
};

/**
 * Create an object by filtering out values of an existing object.
 *
 * @private
 */
exports.filterObject = function(input        , iterator          , context         )         {
    var this$1 = this;

    var output = {};
    for (var key in input) {
        if (iterator.call(context || this$1, input[key], key, input)) {
            output[key] = input[key];
        }
    }
    return output;
};

/**
 * Deeply compares two object literals.
 *
 * @private
 */
exports.deepEqual = function(a        , b        )          {
    if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) { return false; }
        for (var i = 0; i < a.length; i++) {
            if (!exports.deepEqual(a[i], b[i])) { return false; }
        }
        return true;
    }
    if (typeof a === 'object' && a !== null && b !== null) {
        if (!(typeof b === 'object')) { return false; }
        var keys = Object.keys(a);
        if (keys.length !== Object.keys(b).length) { return false; }
        for (var key in a) {
            if (!exports.deepEqual(a[key], b[key])) { return false; }
        }
        return true;
    }
    return a === b;
};

/**
 * Deeply clones two objects.
 *
 * @private
 */
exports.clone = function   (input   )    {
    if (Array.isArray(input)) {
        return input.map(exports.clone);
    } else if (typeof input === 'object' && input) {
        return ((exports.mapObject(input, exports.clone)     )   );
    } else {
        return input;
    }
};

/**
 * Check if two arrays have at least one common element.
 *
 * @private
 */
exports.arraysIntersect = function(a            , b            )          {
    for (var l = 0; l < a.length; l++) {
        if (b.indexOf(a[l]) >= 0) { return true; }
    }
    return false;
};

/**
 * Print a warning message to the console and ensure duplicate warning messages
 * are not printed.
 *
 * @private
 */
var warnOnceHistory = {};
exports.warnOnce = function(message        )       {
    if (!warnOnceHistory[message]) {
        // console isn't defined in some WebWorkers, see #2558
        if (typeof console !== "undefined") { console.warn(message); }
        warnOnceHistory[message] = true;
    }
};

/**
 * Indicates if the provided Points are in a counter clockwise (true) or clockwise (false) order
 *
 * @returns true for a counter clockwise set of points
 */
// http://bryceboe.com/2006/10/23/line-segment-intersection-algorithm/
exports.isCounterClockwise = function(a       , b       , c       )          {
    return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
};

/**
 * Returns the signed area for the polygon ring.  Postive areas are exterior rings and
 * have a clockwise winding.  Negative areas are interior rings and have a counter clockwise
 * ordering.
 *
 * @param ring Exterior or interior ring
 */
exports.calculateSignedArea = function(ring              )         {
    var sum = 0;
    for (var i = 0, len = ring.length, j = len - 1, p1 = (void 0), p2 = (void 0); i < len; j = i++) {
        p1 = ring[i];
        p2 = ring[j];
        sum += (p2.x - p1.x) * (p1.y + p2.y);
    }
    return sum;
};

/**
 * Detects closed polygons, first + last point are equal
 *
 * @param points array of points
 * @return true if the points are a closed polygon
 */
exports.isClosedPolygon = function(points              )          {
    // If it is 2 points that are the same then it is a point
    // If it is 3 points with start and end the same then it is a line
    if (points.length < 4)
        { return false; }

    var p1 = points[0];
    var p2 = points[points.length - 1];

    if (Math.abs(p1.x - p2.x) > 0 ||
        Math.abs(p1.y - p2.y) > 0) {
        return false;
    }

    // polygon simplification can produce polygons with zero area and more than 3 points
    return (Math.abs(exports.calculateSignedArea(points)) > 0.01);
};

/**
 * Converts spherical coordinates to cartesian coordinates.
 *
 * @param spherical Spherical coordinates, in [radial, azimuthal, polar]
 * @return cartesian coordinates in [x, y, z]
 */

exports.sphericalToCartesian = function(spherical               )                {
    var r = spherical[0];
    var azimuthal = spherical[1],
        polar = spherical[2];
    // We abstract "north"/"up" (compass-wise) to be 0° when really this is 90° (π/2):
    // correct for that here
    azimuthal += 90;

    // Convert azimuthal and polar angles to radians
    azimuthal *= Math.PI / 180;
    polar *= Math.PI / 180;

    // spherical to cartesian (x, y, z)
    return [
        r * Math.cos(azimuthal) * Math.sin(polar),
        r * Math.sin(azimuthal) * Math.sin(polar),
        r * Math.cos(polar)
    ];
};

/**
 * Parses data from 'Cache-Control' headers.
 *
 * @param cacheControl Value of 'Cache-Control' header
 * @return object containing parsed header info.
 */

exports.parseCacheControl = function(cacheControl        )         {
    // Taken from [Wreck](https://github.com/hapijs/wreck)
    var re = /(?:^|(?:\s*\,\s*))([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)(?:\=(?:([^\x00-\x20\(\)<>@\,;\:\\"\/\[\]\?\=\{\}\x7F]+)|(?:\"((?:[^"\\]|\\.)*)\")))?/g;

    var header = {};
    cacheControl.replace(re, function ($0, $1, $2, $3) {
        var value = $2 || $3;
        header[$1] = value ? value.toLowerCase() : true;
        return '';
    });

    if (header['max-age']) {
        var maxAge = parseInt(header['max-age'], 10);
        if (isNaN(maxAge)) { delete header['max-age']; }
        else { header['max-age'] = maxAge; }
    }

    return header;
};

},{"../geo/coordinate":2,"@mapbox/unitbezier":1,"point-geometry":6}],6:[function(require,module,exports){
'use strict';

module.exports = Point;

function Point(x, y) {
    this.x = x;
    this.y = y;
}

Point.prototype = {
    clone: function() { return new Point(this.x, this.y); },

    add:     function(p) { return this.clone()._add(p);     },
    sub:     function(p) { return this.clone()._sub(p);     },
    mult:    function(k) { return this.clone()._mult(k);    },
    div:     function(k) { return this.clone()._div(k);     },
    rotate:  function(a) { return this.clone()._rotate(a);  },
    matMult: function(m) { return this.clone()._matMult(m); },
    unit:    function() { return this.clone()._unit(); },
    perp:    function() { return this.clone()._perp(); },
    round:   function() { return this.clone()._round(); },

    mag: function() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    },

    equals: function(p) {
        return this.x === p.x &&
               this.y === p.y;
    },

    dist: function(p) {
        return Math.sqrt(this.distSqr(p));
    },

    distSqr: function(p) {
        var dx = p.x - this.x,
            dy = p.y - this.y;
        return dx * dx + dy * dy;
    },

    angle: function() {
        return Math.atan2(this.y, this.x);
    },

    angleTo: function(b) {
        return Math.atan2(this.y - b.y, this.x - b.x);
    },

    angleWith: function(b) {
        return this.angleWithSep(b.x, b.y);
    },

    // Find the angle of the two vectors, solving the formula for the cross product a x b = |a||b|sin(θ) for θ.
    angleWithSep: function(x, y) {
        return Math.atan2(
            this.x * y - this.y * x,
            this.x * x + this.y * y);
    },

    _matMult: function(m) {
        var x = m[0] * this.x + m[1] * this.y,
            y = m[2] * this.x + m[3] * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _add: function(p) {
        this.x += p.x;
        this.y += p.y;
        return this;
    },

    _sub: function(p) {
        this.x -= p.x;
        this.y -= p.y;
        return this;
    },

    _mult: function(k) {
        this.x *= k;
        this.y *= k;
        return this;
    },

    _div: function(k) {
        this.x /= k;
        this.y /= k;
        return this;
    },

    _unit: function() {
        this._div(this.mag());
        return this;
    },

    _perp: function() {
        var y = this.y;
        this.y = this.x;
        this.x = -y;
        return this;
    },

    _rotate: function(angle) {
        var cos = Math.cos(angle),
            sin = Math.sin(angle),
            x = cos * this.x - sin * this.y,
            y = sin * this.x + cos * this.y;
        this.x = x;
        this.y = y;
        return this;
    },

    _round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        return this;
    }
};

// constructs Point from an array if necessary
Point.convert = function (a) {
    if (a instanceof Point) {
        return a;
    }
    if (Array.isArray(a)) {
        return new Point(a[0], a[1]);
    }
    return a;
};

},{}],7:[function(require,module,exports){
//adapted from https://github.com/mapbox/mapbox-gl-js/blob/061fdb514a33cf9b2b542a1c7bd433c166da917e/src/ui/control/scale_control.js#L19-L52

'use strict';

var DOM = require('mapbox-gl/src/util/dom');
var util = require('mapbox-gl/src/util/util');

/**
 * A `ScaleControl` control displays the ratio of a distance on the map to the corresponding distance on the ground.
 *
 * @implements {IControl}
 * @param {Object} [options]
 * @param {number} [options.maxWidth='150'] The maximum length of the scale control in pixels.
 * @example
 * map.addControl(new ScaleControl({
 *     maxWidth: 80
 * }));
 */
 var DualScaleControl = function DualScaleControl(options) {
      this.options = options;

      util.bindAll([
          '_onMove', '_onMouseMove'
      ], this);
  };

  DualScaleControl.prototype.getDefaultPosition = function getDefaultPosition () {
      return 'bottom-left';
  };

  DualScaleControl.prototype._onMove = function _onMove () {
      updateScale(this._map, this._metricContainer, this._imperialContainer, this.options);
  };

  DualScaleControl.prototype._onMouseMove = function _onMouseMove (e) {
      updatePosition(this._map, this._positionContainer, e.lngLat);
  };

  DualScaleControl.prototype.onAdd = function onAdd (map) {
      this._map = map;
      this._container = DOM.create('div', 'mapboxgl-ctrl mapboxgl-ctrl-scale maphubs-ctrl-scale', map.getContainer());
      this._positionContainer = DOM.create('div', 'map-position', this._container);
      this._metricContainer = DOM.create('div', 'metric-scale', this._container);
      this._imperialContainer = DOM.create('div', 'imperial-scale', this._container);

      this._map.on('move', this._onMove);
      this._onMove();

      this._map.on('mousemove', this._onMouseMove);
      //this._onMouseMove(this._map.getCenter()); //start at center

      return this._container;
  };

  DualScaleControl.prototype.onRemove = function onRemove () {
      this._container.parentNode.removeChild(this._container);
      this._map.off('move', this._onMove);
      this._map.off('mousemove', this._onMouseMove);
      this._map = undefined;
  };

module.exports = ScaleControl;


function updatePosition(map, container, lngLat) {
  var lat = lngLat.lat.toPrecision(4);
  var lng = lngLat.lng.toPrecision(4);
  container.innerHTML = lat + ", " + lng;
}

function updateScale(map, metricContainer, imperialContainer, options) {
    // A horizontal scale is imagined to be present at center of the map
    // container with maximum length (Default) as 100px.
    // Using spherical law of cosines approximation, the real distance is
    // found between the two coordinates.
    var maxWidth = options && options.maxWidth || 100;

    var y = map._container.clientHeight / 2;
    var maxMeters = getDistance(map.unproject([0, y]), map.unproject([maxWidth, y]));
    // The real distance corresponding to 100px scale length is rounded off to
    // near pretty number and the scale length for the same is found out.
    // Default unit of the scale is based on User's locale.
     var maxFeet = 3.2808 * maxMeters;
    if (maxFeet > 5280) {
      var maxMiles = maxFeet / 5280;
      setScale(imperialContainer, maxWidth, maxMiles, 'mi');
    } else {
      setScale(imperialContainer, maxWidth, maxFeet, 'ft');
    }
    setScale(metricContainer, maxWidth, maxMeters, 'm');

}

function setScale(container, maxWidth, maxDistance, unit) {
    var distance = getRoundNum(maxDistance);
    var ratio = distance / maxDistance;

    if (unit === 'm' && distance >= 1000) {
        distance = distance / 1000;
        unit = 'km';
    }

    container.style.width = (maxWidth * ratio) + "px";
    container.innerHTML = distance + unit;
}

function getDistance(latlng1, latlng2) {
    // Uses spherical law of cosines approximation.
    var R = 6371000;

    var rad = Math.PI / 180,
        lat1 = latlng1.lat * rad,
        lat2 = latlng2.lat * rad,
        a = Math.sin(lat1) * Math.sin(lat2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.cos((latlng2.lng - latlng1.lng) * rad);

    var maxMeters = R * Math.acos(Math.min(a, 1));
    return maxMeters;

}

function getRoundNum(num) {
    var pow10 = Math.pow(10, (("" + (Math.floor(num)))).length - 1);
    var d = num / pow10;

    d = d >= 10 ? 10 :
        d >= 5 ? 5 :
        d >= 3 ? 3 :
        d >= 2 ? 2 : 1;

    return pow10 * d;
}

},{"mapbox-gl/src/util/dom":4,"mapbox-gl/src/util/util":5}]},{},[7])(7)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQG1hcGJveC91bml0YmV6aWVyL2luZGV4LmpzIiwiL1VzZXJzL2tyaXMvZGV2L21hcGh1YnMvbWFwYm94LWdsLWR1YWwtc2NhbGUtY29udHJvbC9ub2RlX21vZHVsZXMvbWFwYm94LWdsL3NyYy9nZW8vY29vcmRpbmF0ZS5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9icm93c2VyL3dpbmRvdy5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9kb20uanMiLCIvVXNlcnMva3Jpcy9kZXYvbWFwaHVicy9tYXBib3gtZ2wtZHVhbC1zY2FsZS1jb250cm9sL25vZGVfbW9kdWxlcy9tYXBib3gtZ2wvc3JjL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9wb2ludC1nZW9tZXRyeS9pbmRleC5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekdBLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBWWIsSUFBTSxVQUFVLEdBQUMsQUFJakIsQUFBSSxtQkFBVyxDQUFDLE1BQU0sSUFBSSxBQUFJLEVBQUUsR0FBRyxJQUFJLEFBQUksRUFBRSxJQUFJLElBQUksQUFBSSxFQUFFO0lBQ3ZELEFBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7SUFDekIsQUFBSSxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztJQUNuQixBQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLEFBQUksQ0FBQyxDQUFBOztBQUVMLEFBQUk7Q0FDSCxBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtBQUNMLEFBQUkscUJBQUEsS0FBSyxrQkFBQSxHQUFHO0lBQ1IsQUFBSSxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDaEUsQUFBSSxDQUFDLENBQUE7O0FBRUwsQUFBSTtDQUNILEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0FBQ0wsQUFBSSxxQkFBQSxNQUFNLG1CQUFBLENBQUMsSUFBSSxJQUFJLEFBQUksRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUE7O0FBRS9ELEFBQUk7Q0FDSCxBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtDQUNKLEFBQUk7Q0FDSixBQUFJO0NBQ0osQUFBSTtBQUNMLEFBQUkscUJBQUEsR0FBRyxnQkFBQSxDQUFDLENBQUMsUUFBUSxBQUFJLEVBQUUsRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFBOztBQUV2RCxBQUFJLHFCQUFBLE9BQU8sb0JBQUEsQ0FBQyxJQUFJLElBQUksQUFBSSxFQUFFO0lBQ3RCLEFBQUksR0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELEFBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUM7SUFDekIsQUFBSSxJQUFJLENBQUMsR0FBRyxJQUFJLEtBQUssQ0FBQztJQUN0QixBQUFJLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ3JCLEFBQUksT0FBTyxJQUFJLENBQUM7QUFDcEIsQUFBSSxDQUFDLENBQUE7O0FBRUwsQUFBSSxxQkFBQSxJQUFJLGlCQUFBLENBQUMsQ0FBQyxRQUFRLEFBQUksRUFBRTtJQUNwQixBQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixBQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUM1QixBQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQztJQUN0QixBQUFJLE9BQU8sSUFBSSxDQUFDO0FBQ3BCLEFBQUksQ0FBQyxDQUFBLEFBQ0o7O0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7OztBQy9FNUIsWUFBWSxDQUFDOzs7QUFHYixNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzs7O0FDSHRCLFlBQVksQ0FBQzs7QUFFYixHQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3hDLEdBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUVuQyxPQUFPLENBQUMsTUFBTSxHQUFHLFVBQVUsT0FBTyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUU7SUFDdEQsR0FBSyxDQUFDLEVBQUUsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNsRCxJQUFJLFNBQVMsRUFBRSxFQUFBLEVBQUUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLEVBQUE7SUFDeEMsSUFBSSxTQUFTLEVBQUUsRUFBQSxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUE7SUFDekMsT0FBTyxFQUFFLENBQUM7Q0FDYixDQUFDOztBQUVGLEdBQUssQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDOztBQUV2RCxTQUFTLFFBQVEsQ0FBQyxLQUFLLEVBQUU7SUFDckIsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNuQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxRQUFRLEVBQUU7WUFDdEIsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7S0FDSjtJQUNELE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ25COztBQUVELEdBQUssQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLENBQUMsWUFBWSxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDO0FBQ2pHLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDZixPQUFPLENBQUMsV0FBVyxHQUFHLFlBQVk7SUFDOUIsSUFBSSxVQUFVLEVBQUU7UUFDWixVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xDLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLENBQUM7S0FDakM7Q0FDSixDQUFDO0FBQ0YsT0FBTyxDQUFDLFVBQVUsR0FBRyxZQUFZO0lBQzdCLElBQUksVUFBVSxFQUFFO1FBQ1osUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQztLQUNyQztDQUNKLENBQUM7O0FBRUYsR0FBSyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsQ0FBQyxXQUFXLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0FBQ2pFLE9BQU8sQ0FBQyxZQUFZLEdBQUcsU0FBUyxFQUFFLEVBQUUsS0FBSyxFQUFFO0lBQ3ZDLEVBQUUsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ25DLENBQUM7OztBQUdGLFNBQVMsYUFBYSxDQUFDLENBQUMsRUFBRTtJQUN0QixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzVEO0FBQ0QsT0FBTyxDQUFDLGFBQWEsR0FBRyxXQUFXO0lBQy9CLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RELE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBQSxHQUFHLEFBQUc7UUFDcEIsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDNUQsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUNULENBQUM7O0FBRUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDaEMsR0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUN4QyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNqQyxPQUFPLElBQUksS0FBSztRQUNaLENBQUMsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsVUFBVTtRQUNyQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLFNBQVM7S0FDdEMsQ0FBQztDQUNMLENBQUM7O0FBRUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7SUFDaEMsR0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMscUJBQXFCLEVBQUU7UUFDbkMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNoQixHQUFLLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksS0FBSyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDdkUsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSztZQUNqQixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLFVBQVU7WUFDOUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxTQUFTO1NBQy9DLENBQUMsQ0FBQztLQUNOO0lBQ0QsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7QUFFRixPQUFPLENBQUMsTUFBTSxHQUFHLFNBQVMsSUFBSSxFQUFFO0lBQzVCLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNqQixJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyQztDQUNKLENBQUM7OztBQ2pGRixZQUFZLENBQUM7OztBQUdiLEdBQUssQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDakQsR0FBSyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNoRCxHQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTeEMsT0FBTyxDQUFDLGNBQWMsR0FBRyxTQUFTLENBQUMsa0JBQWtCO0lBQ2pELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFBLE9BQU8sQ0FBQyxDQUFDLEVBQUE7SUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUEsT0FBTyxDQUFDLENBQUMsRUFBQTtJQUNyQixHQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ1osRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0NBQ3hELENBQUM7Ozs7Ozs7Ozs7OztBQVlGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsU0FBUyxHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsVUFBVSxHQUFHLGlDQUFpQztJQUNqRyxHQUFLLENBQUMsTUFBTSxHQUFHLElBQUksVUFBVSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELE9BQU8sU0FBUyxDQUFDLFVBQVU7UUFDdkIsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFCLENBQUM7Q0FDTCxDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7QUFXbEQsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxrQkFBa0I7SUFDbkUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzFDLENBQUM7Ozs7Ozs7Ozs7O0FBV0YsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxrQkFBa0I7SUFDbEUsR0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ3BCLEdBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUN4QyxPQUFPLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7Q0FDaEMsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWUYsT0FBTyxDQUFDLFFBQVEsR0FBRyxVQUFVLEtBQUssY0FBYyxFQUFFLFlBQVksUUFBUSxZQUFZO0lBQzlFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUU7SUFDakQsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzdCLEdBQUssQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ2pCLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBQSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQUFBRztRQUN2QixFQUFFLENBQUMsSUFBSSxFQUFFLFNBQUEsQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEFBQUc7WUFDdEIsSUFBSSxHQUFHLEVBQUUsRUFBQSxLQUFLLEdBQUcsR0FBRyxDQUFDLEVBQUE7WUFDckIsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztZQUNwQixJQUFJLEVBQUUsU0FBUyxLQUFLLENBQUMsRUFBRSxFQUFBLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBQTtTQUNuRCxDQUFDLENBQUM7S0FDTixDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVSxHQUFHLHlCQUF5QjtJQUNuRCxHQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLEdBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFO1FBQ2pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLE1BQU0sQ0FBQztDQUNqQixDQUFDOzs7Ozs7Ozs7QUFTRixPQUFPLENBQUMsY0FBYyxHQUFHLFVBQVUsR0FBRyxVQUFVLEtBQUsseUJBQXlCO0lBQzFFLEdBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLEtBQUssR0FBSyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQUU7UUFDakIsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2YsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN0QjtLQUNKO0lBQ0QsT0FBTyxVQUFVLENBQUM7Q0FDckIsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWFGLE9BQU8sQ0FBQyxNQUFNLEdBQUcsVUFBVSxJQUFJLFVBQVUsT0FBTyxVQUFVLE9BQU8sV0FBVyxPQUFPLG1CQUFtQixDQUFDOztBQUFBO0lBQ25HLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDdkMsR0FBSyxDQUFDLEdBQUcsR0FBRyxXQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsS0FBSyxHQUFLLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUNqQixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BCO0tBQ0o7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNmLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkYsT0FBTyxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUcsVUFBVSxVQUFVLHlCQUF5QjtJQUNyRSxHQUFLLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNsQixLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLEdBQUssQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRTtZQUNWLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEI7S0FDSjtJQUNELE9BQU8sTUFBTSxDQUFDO0NBQ2pCLENBQUM7O0FBRUYsR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Ozs7Ozs7OztBQVNYLE9BQU8sQ0FBQyxRQUFRLEdBQUcsb0JBQW9CO0lBQ25DLE9BQU8sRUFBRSxFQUFFLENBQUM7Q0FDZixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCRixPQUFPLENBQUMsT0FBTyxHQUFHLFNBQVMsR0FBRyxpQkFBaUIsT0FBTyxnQkFBZ0I7SUFDbEUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxTQUFBLENBQUMsRUFBRSxFQUFFLEFBQUc7UUFDaEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRTtRQUM3QixPQUFPLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUMzQyxDQUFDLENBQUM7Q0FDTixDQUFDOzs7Ozs7OztBQVFGLE9BQU8sQ0FBQyxvQkFBb0IsR0FBRyxTQUFTLE1BQU0saUNBQWlDO0lBQzNFLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDckIsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQzs7SUFFckIsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNwQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ3hDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDckMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN4QyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3hDOztJQUVELEdBQUssQ0FBQyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztJQUN2QixHQUFLLENBQUMsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLENBQUM7SUFDdkIsR0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM5QixHQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sSUFBSSxVQUFVLENBQUMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDekQsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3JCLENBQUM7Ozs7Ozs7QUFPRixPQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsTUFBTSxVQUFVLE1BQU0sbUJBQW1CO0lBQ2pFLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDdkUsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsS0FBSyxVQUFVLFFBQVEsWUFBWSxPQUFPLG1CQUFtQixDQUFDOztBQUFBO0lBQ3ZGLEdBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLEtBQUssR0FBSyxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUU7UUFDckIsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3hFO0lBQ0QsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7Ozs7OztBQU9GLE9BQU8sQ0FBQyxZQUFZLEdBQUcsU0FBUyxLQUFLLFVBQVUsUUFBUSxZQUFZLE9BQU8sbUJBQW1CLENBQUM7O0FBQUE7SUFDMUYsR0FBSyxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbEIsS0FBSyxHQUFLLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRTtRQUNyQixJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLE1BQUksRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFO1lBQ3hELE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7S0FDSjtJQUNELE9BQU8sTUFBTSxDQUFDO0NBQ2pCLENBQUM7Ozs7Ozs7QUFPRixPQUFPLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO0lBQ3hELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtRQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQzdELEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUEsT0FBTyxLQUFLLENBQUMsRUFBQTtTQUNwRDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFDRCxJQUFJLE9BQU8sQ0FBQyxLQUFLLFFBQVEsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDbkQsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQzNDLEdBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1QixJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBQSxPQUFPLEtBQUssQ0FBQyxFQUFBO1FBQ3hELEtBQUssR0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUU7WUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUEsT0FBTyxLQUFLLENBQUMsRUFBQTtTQUN4RDtRQUNELE9BQU8sSUFBSSxDQUFDO0tBQ2Y7SUFDRCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDbEIsQ0FBQzs7Ozs7OztBQU9GLE9BQU8sQ0FBQyxLQUFLLEdBQUcsWUFBWSxLQUFLLFFBQVE7SUFDckMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbkMsTUFBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEVBQUU7UUFDM0MsT0FBTyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztLQUM5RCxNQUFNO1FBQ0gsT0FBTyxLQUFLLENBQUM7S0FDaEI7Q0FDSixDQUFDOzs7Ozs7O0FBT0YsT0FBTyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFDLHVCQUF1QjtJQUN0RSxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQy9CLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBQSxPQUFPLElBQUksQ0FBQyxFQUFBO0tBQ3pDO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDaEIsQ0FBQzs7Ozs7Ozs7QUFRRixHQUFLLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMzQixPQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsT0FBTyxnQkFBZ0I7SUFDL0MsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsRUFBRTs7UUFFM0IsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLEVBQUUsRUFBQSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUE7UUFDMUQsZUFBZSxDQUFDLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQztLQUNuQztDQUNKLENBQUM7Ozs7Ozs7O0FBUUYsT0FBTyxDQUFDLGtCQUFrQixHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLGtCQUFrQjtJQUN6RSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDaEUsQ0FBQzs7Ozs7Ozs7O0FBU0YsT0FBTyxDQUFDLG1CQUFtQixHQUFHLFNBQVMsSUFBSSx3QkFBd0I7SUFDL0QsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxFQUFFLEVBQUUsV0FBQSxFQUFFLEVBQUUsV0FBQSxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFO1FBQ3RFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDYixFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2IsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN4QztJQUNELE9BQU8sR0FBRyxDQUFDO0NBQ2QsQ0FBQzs7Ozs7Ozs7QUFRRixPQUFPLENBQUMsZUFBZSxHQUFHLFNBQVMsTUFBTSx5QkFBeUI7OztJQUc5RCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQztRQUNqQixFQUFBLE9BQU8sS0FBSyxDQUFDLEVBQUE7O0lBRWpCLEdBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JCLEdBQUssQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7O0lBRXJDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0tBQ2hCOzs7SUFHRCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztDQUNqRSxDQUFDOzs7Ozs7Ozs7QUFTRixPQUFPLENBQUMsb0JBQW9CLEdBQUcsU0FBUyxTQUFTLGdDQUFnQztJQUM3RSxHQUFLLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QixHQUFHLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O0lBR3pCLFNBQVMsSUFBSSxFQUFFLENBQUM7OztJQUdoQixTQUFTLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUM7SUFDM0IsS0FBSyxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDOzs7SUFHdkIsT0FBTztRQUNILENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3pDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO1FBQ3pDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQztLQUN0QixDQUFDO0NBQ0wsQ0FBQzs7Ozs7Ozs7O0FBU0YsT0FBTyxDQUFDLGlCQUFpQixHQUFHLFNBQVMsWUFBWSxrQkFBa0I7O0lBRS9ELEdBQUssQ0FBQyxFQUFFLEdBQUcsMEpBQTBKLENBQUM7O0lBRXRLLEdBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLFlBQVksQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLFNBQUEsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQUFBRztRQUN6QyxHQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7UUFDdkIsTUFBTSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsV0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2hELE9BQU8sRUFBRSxDQUFDO0tBQ2IsQ0FBQyxDQUFDOztJQUVILElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ25CLEdBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFBLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUE7YUFDdkMsRUFBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUE7S0FDbkM7O0lBRUQsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7O0FDcGNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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SSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDOztJQUVwRixHQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDaEQsT0FBTyxTQUFTLENBQUM7O0NBRXBCOztBQUVELFNBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtJQUN0QixHQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQSxFQUFDLElBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQSxDQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDOUQsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDOztJQUVwQixDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO1FBQ1osQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ1YsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ1YsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztJQUVuQixPQUFPLEtBQUssR0FBRyxDQUFDLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLypcbiAqIENvcHlyaWdodCAoQykgMjAwOCBBcHBsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0XG4gKiBtb2RpZmljYXRpb24sIGFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnNcbiAqIGFyZSBtZXQ6XG4gKiAxLiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICogMi4gUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHRcbiAqICAgIG5vdGljZSwgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGVcbiAqICAgIGRvY3VtZW50YXRpb24gYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG4gKlxuICogVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBBUFBMRSBJTkMuIGBgQVMgSVMnJyBBTkQgQU5ZXG4gKiBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRVxuICogSU1QTElFRCBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSXG4gKiBQVVJQT1NFIEFSRSBESVNDTEFJTUVELiAgSU4gTk8gRVZFTlQgU0hBTEwgQVBQTEUgSU5DLiBPUlxuICogQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1IgQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsXG4gKiBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFUyAoSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sXG4gKiBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTOyBMT1NTIE9GIFVTRSwgREFUQSwgT1JcbiAqIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OIEFOWSBUSEVPUllcbiAqIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuICogKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFXG4gKiBPRiBUSElTIFNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLlxuICpcbiAqIFBvcnRlZCBmcm9tIFdlYmtpdFxuICogaHR0cDovL3N2bi53ZWJraXQub3JnL3JlcG9zaXRvcnkvd2Via2l0L3RydW5rL1NvdXJjZS9XZWJDb3JlL3BsYXRmb3JtL2dyYXBoaWNzL1VuaXRCZXppZXIuaFxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gVW5pdEJlemllcjtcblxuZnVuY3Rpb24gVW5pdEJlemllcihwMXgsIHAxeSwgcDJ4LCBwMnkpIHtcbiAgICAvLyBDYWxjdWxhdGUgdGhlIHBvbHlub21pYWwgY29lZmZpY2llbnRzLCBpbXBsaWNpdCBmaXJzdCBhbmQgbGFzdCBjb250cm9sIHBvaW50cyBhcmUgKDAsMCkgYW5kICgxLDEpLlxuICAgIHRoaXMuY3ggPSAzLjAgKiBwMXg7XG4gICAgdGhpcy5ieCA9IDMuMCAqIChwMnggLSBwMXgpIC0gdGhpcy5jeDtcbiAgICB0aGlzLmF4ID0gMS4wIC0gdGhpcy5jeCAtIHRoaXMuYng7XG5cbiAgICB0aGlzLmN5ID0gMy4wICogcDF5O1xuICAgIHRoaXMuYnkgPSAzLjAgKiAocDJ5IC0gcDF5KSAtIHRoaXMuY3k7XG4gICAgdGhpcy5heSA9IDEuMCAtIHRoaXMuY3kgLSB0aGlzLmJ5O1xuXG4gICAgdGhpcy5wMXggPSBwMXg7XG4gICAgdGhpcy5wMXkgPSBwMnk7XG4gICAgdGhpcy5wMnggPSBwMng7XG4gICAgdGhpcy5wMnkgPSBwMnk7XG59XG5cblVuaXRCZXppZXIucHJvdG90eXBlLnNhbXBsZUN1cnZlWCA9IGZ1bmN0aW9uKHQpIHtcbiAgICAvLyBgYXggdF4zICsgYnggdF4yICsgY3ggdCcgZXhwYW5kZWQgdXNpbmcgSG9ybmVyJ3MgcnVsZS5cbiAgICByZXR1cm4gKCh0aGlzLmF4ICogdCArIHRoaXMuYngpICogdCArIHRoaXMuY3gpICogdDtcbn07XG5cblVuaXRCZXppZXIucHJvdG90eXBlLnNhbXBsZUN1cnZlWSA9IGZ1bmN0aW9uKHQpIHtcbiAgICByZXR1cm4gKCh0aGlzLmF5ICogdCArIHRoaXMuYnkpICogdCArIHRoaXMuY3kpICogdDtcbn07XG5cblVuaXRCZXppZXIucHJvdG90eXBlLnNhbXBsZUN1cnZlRGVyaXZhdGl2ZVggPSBmdW5jdGlvbih0KSB7XG4gICAgcmV0dXJuICgzLjAgKiB0aGlzLmF4ICogdCArIDIuMCAqIHRoaXMuYngpICogdCArIHRoaXMuY3g7XG59O1xuXG5Vbml0QmV6aWVyLnByb3RvdHlwZS5zb2x2ZUN1cnZlWCA9IGZ1bmN0aW9uKHgsIGVwc2lsb24pIHtcbiAgICBpZiAodHlwZW9mIGVwc2lsb24gPT09ICd1bmRlZmluZWQnKSBlcHNpbG9uID0gMWUtNjtcblxuICAgIHZhciB0MCwgdDEsIHQyLCB4MiwgaTtcblxuICAgIC8vIEZpcnN0IHRyeSBhIGZldyBpdGVyYXRpb25zIG9mIE5ld3RvbidzIG1ldGhvZCAtLSBub3JtYWxseSB2ZXJ5IGZhc3QuXG4gICAgZm9yICh0MiA9IHgsIGkgPSAwOyBpIDwgODsgaSsrKSB7XG5cbiAgICAgICAgeDIgPSB0aGlzLnNhbXBsZUN1cnZlWCh0MikgLSB4O1xuICAgICAgICBpZiAoTWF0aC5hYnMoeDIpIDwgZXBzaWxvbikgcmV0dXJuIHQyO1xuXG4gICAgICAgIHZhciBkMiA9IHRoaXMuc2FtcGxlQ3VydmVEZXJpdmF0aXZlWCh0Mik7XG4gICAgICAgIGlmIChNYXRoLmFicyhkMikgPCAxZS02KSBicmVhaztcblxuICAgICAgICB0MiA9IHQyIC0geDIgLyBkMjtcbiAgICB9XG5cbiAgICAvLyBGYWxsIGJhY2sgdG8gdGhlIGJpc2VjdGlvbiBtZXRob2QgZm9yIHJlbGlhYmlsaXR5LlxuICAgIHQwID0gMC4wO1xuICAgIHQxID0gMS4wO1xuICAgIHQyID0geDtcblxuICAgIGlmICh0MiA8IHQwKSByZXR1cm4gdDA7XG4gICAgaWYgKHQyID4gdDEpIHJldHVybiB0MTtcblxuICAgIHdoaWxlICh0MCA8IHQxKSB7XG5cbiAgICAgICAgeDIgPSB0aGlzLnNhbXBsZUN1cnZlWCh0Mik7XG4gICAgICAgIGlmIChNYXRoLmFicyh4MiAtIHgpIDwgZXBzaWxvbikgcmV0dXJuIHQyO1xuXG4gICAgICAgIGlmICh4ID4geDIpIHtcbiAgICAgICAgICAgIHQwID0gdDI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0MSA9IHQyO1xuICAgICAgICB9XG5cbiAgICAgICAgdDIgPSAodDEgLSB0MCkgKiAwLjUgKyB0MDtcbiAgICB9XG5cbiAgICAvLyBGYWlsdXJlLlxuICAgIHJldHVybiB0Mjtcbn07XG5cblVuaXRCZXppZXIucHJvdG90eXBlLnNvbHZlID0gZnVuY3Rpb24oeCwgZXBzaWxvbikge1xuICAgIHJldHVybiB0aGlzLnNhbXBsZUN1cnZlWSh0aGlzLnNvbHZlQ3VydmVYKHgsIGVwc2lsb24pKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG4vLyAgICAgIFxuXG4vKipcbiAqIEEgY29vcmRpbmF0ZSBpcyBhIGNvbHVtbiwgcm93LCB6b29tIGNvbWJpbmF0aW9uLCBvZnRlbiB1c2VkXG4gKiBhcyB0aGUgZGF0YSBjb21wb25lbnQgb2YgYSB0aWxlLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBjb2x1bW5cbiAqIEBwYXJhbSB7bnVtYmVyfSByb3dcbiAqIEBwYXJhbSB7bnVtYmVyfSB6b29tXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBDb29yZGluYXRlIHtcbiAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgXG4gICAgY29uc3RydWN0b3IoY29sdW1uICAgICAgICAsIHJvdyAgICAgICAgLCB6b29tICAgICAgICApIHtcbiAgICAgICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG4gICAgICAgIHRoaXMucm93ID0gcm93O1xuICAgICAgICB0aGlzLnpvb20gPSB6b29tO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIGNsb25lIG9mIHRoaXMgY29vcmRpbmF0ZSB0aGF0IGNhbiBiZSBtdXRhdGVkIHdpdGhvdXRcbiAgICAgKiBjaGFuZ2luZyB0aGUgb3JpZ2luYWwgY29vcmRpbmF0ZVxuICAgICAqXG4gICAgICogQHJldHVybnMge0Nvb3JkaW5hdGV9IGNsb25lXG4gICAgICogQHByaXZhdGVcbiAgICAgKiB2YXIgY29vcmQgPSBuZXcgQ29vcmRpbmF0ZSgwLCAwLCAwKTtcbiAgICAgKiB2YXIgYzIgPSBjb29yZC5jbG9uZSgpO1xuICAgICAqIC8vIHNpbmNlIGNvb3JkIGlzIGNsb25lZCwgbW9kaWZ5aW5nIGEgcHJvcGVydHkgb2YgYzIgZG9lc1xuICAgICAqIC8vIG5vdCBtb2RpZnkgaXQuXG4gICAgICogYzIuem9vbSA9IDI7XG4gICAgICovXG4gICAgY2xvbmUoKSB7XG4gICAgICAgIHJldHVybiBuZXcgQ29vcmRpbmF0ZSh0aGlzLmNvbHVtbiwgdGhpcy5yb3csIHRoaXMuem9vbSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogWm9vbSB0aGlzIGNvb3JkaW5hdGUgdG8gYSBnaXZlbiB6b29tIGxldmVsLiBUaGlzIHJldHVybnMgYSBuZXdcbiAgICAgKiBjb29yZGluYXRlIG9iamVjdCwgbm90IG11dGF0aW5nIHRoZSBvbGQgb25lLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHpvb21cbiAgICAgKiBAcmV0dXJucyB7Q29vcmRpbmF0ZX0gem9vbWVkIGNvb3JkaW5hdGVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIEBleGFtcGxlXG4gICAgICogdmFyIGNvb3JkID0gbmV3IENvb3JkaW5hdGUoMCwgMCwgMCk7XG4gICAgICogdmFyIGMyID0gY29vcmQuem9vbVRvKDEpO1xuICAgICAqIGMyIC8vIGVxdWFscyBuZXcgQ29vcmRpbmF0ZSgwLCAwLCAxKTtcbiAgICAgKi9cbiAgICB6b29tVG8oem9vbSAgICAgICAgKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3pvb21Ubyh6b29tKTsgfVxuXG4gICAgLyoqXG4gICAgICogU3VidHJhY3QgdGhlIGNvbHVtbiBhbmQgcm93IHZhbHVlcyBvZiB0aGlzIGNvb3JkaW5hdGUgZnJvbSB0aG9zZVxuICAgICAqIG9mIGFub3RoZXIgY29vcmRpbmF0ZS4gVGhlIG90aGVyIGNvb3JkaW5hdCB3aWxsIGJlIHpvb21lZCB0byB0aGVcbiAgICAgKiBzYW1lIGxldmVsIGFzIGB0aGlzYCBiZWZvcmUgdGhlIHN1YnRyYWN0aW9uIG9jY3Vyc1xuICAgICAqXG4gICAgICogQHBhcmFtIHtDb29yZGluYXRlfSBjIG90aGVyIGNvb3JkaW5hdGVcbiAgICAgKiBAcmV0dXJucyB7Q29vcmRpbmF0ZX0gcmVzdWx0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBzdWIoYyAgICAgICAgICAgICkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9zdWIoYyk7IH1cblxuICAgIF96b29tVG8oem9vbSAgICAgICAgKSB7XG4gICAgICAgIGNvbnN0IHNjYWxlID0gTWF0aC5wb3coMiwgem9vbSAtIHRoaXMuem9vbSk7XG4gICAgICAgIHRoaXMuY29sdW1uICo9IHNjYWxlO1xuICAgICAgICB0aGlzLnJvdyAqPSBzY2FsZTtcbiAgICAgICAgdGhpcy56b29tID0gem9vbTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgX3N1YihjICAgICAgICAgICAgKSB7XG4gICAgICAgIGMgPSBjLnpvb21Ubyh0aGlzLnpvb20pO1xuICAgICAgICB0aGlzLmNvbHVtbiAtPSBjLmNvbHVtbjtcbiAgICAgICAgdGhpcy5yb3cgLT0gYy5yb3c7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb29yZGluYXRlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQtZW52IGJyb3dzZXIgKi9cbm1vZHVsZS5leHBvcnRzID0gc2VsZjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUG9pbnQgPSByZXF1aXJlKCdwb2ludC1nZW9tZXRyeScpO1xuY29uc3Qgd2luZG93ID0gcmVxdWlyZSgnLi93aW5kb3cnKTtcblxuZXhwb3J0cy5jcmVhdGUgPSBmdW5jdGlvbiAodGFnTmFtZSwgY2xhc3NOYW1lLCBjb250YWluZXIpIHtcbiAgICBjb25zdCBlbCA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIGlmIChjbGFzc05hbWUpIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICBpZiAoY29udGFpbmVyKSBjb250YWluZXIuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHJldHVybiBlbDtcbn07XG5cbmNvbnN0IGRvY1N0eWxlID0gd2luZG93LmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZTtcblxuZnVuY3Rpb24gdGVzdFByb3AocHJvcHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChwcm9wc1tpXSBpbiBkb2NTdHlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHByb3BzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcm9wc1swXTtcbn1cblxuY29uc3Qgc2VsZWN0UHJvcCA9IHRlc3RQcm9wKFsndXNlclNlbGVjdCcsICdNb3pVc2VyU2VsZWN0JywgJ1dlYmtpdFVzZXJTZWxlY3QnLCAnbXNVc2VyU2VsZWN0J10pO1xubGV0IHVzZXJTZWxlY3Q7XG5leHBvcnRzLmRpc2FibGVEcmFnID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgICAgIHVzZXJTZWxlY3QgPSBkb2NTdHlsZVtzZWxlY3RQcm9wXTtcbiAgICAgICAgZG9jU3R5bGVbc2VsZWN0UHJvcF0gPSAnbm9uZSc7XG4gICAgfVxufTtcbmV4cG9ydHMuZW5hYmxlRHJhZyA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc2VsZWN0UHJvcCkge1xuICAgICAgICBkb2NTdHlsZVtzZWxlY3RQcm9wXSA9IHVzZXJTZWxlY3Q7XG4gICAgfVxufTtcblxuY29uc3QgdHJhbnNmb3JtUHJvcCA9IHRlc3RQcm9wKFsndHJhbnNmb3JtJywgJ1dlYmtpdFRyYW5zZm9ybSddKTtcbmV4cG9ydHMuc2V0VHJhbnNmb3JtID0gZnVuY3Rpb24oZWwsIHZhbHVlKSB7XG4gICAgZWwuc3R5bGVbdHJhbnNmb3JtUHJvcF0gPSB2YWx1ZTtcbn07XG5cbi8vIFN1cHByZXNzIHRoZSBuZXh0IGNsaWNrLCBidXQgb25seSBpZiBpdCdzIGltbWVkaWF0ZS5cbmZ1bmN0aW9uIHN1cHByZXNzQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHN1cHByZXNzQ2xpY2ssIHRydWUpO1xufVxuZXhwb3J0cy5zdXBwcmVzc0NsaWNrID0gZnVuY3Rpb24oKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VwcHJlc3NDbGljaywgdHJ1ZSk7XG4gICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdXBwcmVzc0NsaWNrLCB0cnVlKTtcbiAgICB9LCAwKTtcbn07XG5cbmV4cG9ydHMubW91c2VQb3MgPSBmdW5jdGlvbiAoZWwsIGUpIHtcbiAgICBjb25zdCByZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgZSA9IGUudG91Y2hlcyA/IGUudG91Y2hlc1swXSA6IGU7XG4gICAgcmV0dXJuIG5ldyBQb2ludChcbiAgICAgICAgZS5jbGllbnRYIC0gcmVjdC5sZWZ0IC0gZWwuY2xpZW50TGVmdCxcbiAgICAgICAgZS5jbGllbnRZIC0gcmVjdC50b3AgLSBlbC5jbGllbnRUb3BcbiAgICApO1xufTtcblxuZXhwb3J0cy50b3VjaFBvcyA9IGZ1bmN0aW9uIChlbCwgZSkge1xuICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcbiAgICAgICAgcG9pbnRzID0gW107XG4gICAgY29uc3QgdG91Y2hlcyA9IChlLnR5cGUgPT09ICd0b3VjaGVuZCcpID8gZS5jaGFuZ2VkVG91Y2hlcyA6IGUudG91Y2hlcztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdWNoZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcG9pbnRzLnB1c2gobmV3IFBvaW50KFxuICAgICAgICAgICAgdG91Y2hlc1tpXS5jbGllbnRYIC0gcmVjdC5sZWZ0IC0gZWwuY2xpZW50TGVmdCxcbiAgICAgICAgICAgIHRvdWNoZXNbaV0uY2xpZW50WSAtIHJlY3QudG9wIC0gZWwuY2xpZW50VG9wXG4gICAgICAgICkpO1xuICAgIH1cbiAgICByZXR1cm4gcG9pbnRzO1xufTtcblxuZXhwb3J0cy5yZW1vdmUgPSBmdW5jdGlvbihub2RlKSB7XG4gICAgaWYgKG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICBub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG4gICAgfVxufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8vICAgICAgXG5cbmNvbnN0IFVuaXRCZXppZXIgPSByZXF1aXJlKCdAbWFwYm94L3VuaXRiZXppZXInKTtcbmNvbnN0IENvb3JkaW5hdGUgPSByZXF1aXJlKCcuLi9nZW8vY29vcmRpbmF0ZScpO1xuY29uc3QgUG9pbnQgPSByZXF1aXJlKCdwb2ludC1nZW9tZXRyeScpO1xuXG4vKipcbiAqIEdpdmVuIGEgdmFsdWUgYHRgIHRoYXQgdmFyaWVzIGJldHdlZW4gMCBhbmQgMSwgcmV0dXJuXG4gKiBhbiBpbnRlcnBvbGF0aW9uIGZ1bmN0aW9uIHRoYXQgZWFzZXMgYmV0d2VlbiAwIGFuZCAxIGluIGEgcGxlYXNpbmdcbiAqIGN1YmljIGluLW91dCBmYXNoaW9uLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZWFzZUN1YmljSW5PdXQgPSBmdW5jdGlvbih0ICAgICAgICApICAgICAgICAge1xuICAgIGlmICh0IDw9IDApIHJldHVybiAwO1xuICAgIGlmICh0ID49IDEpIHJldHVybiAxO1xuICAgIGNvbnN0IHQyID0gdCAqIHQsXG4gICAgICAgIHQzID0gdDIgKiB0O1xuICAgIHJldHVybiA0ICogKHQgPCAwLjUgPyB0MyA6IDMgKiAodCAtIHQyKSArIHQzIC0gMC43NSk7XG59O1xuXG4vKipcbiAqIEdpdmVuIGdpdmVuICh4LCB5KSwgKHgxLCB5MSkgY29udHJvbCBwb2ludHMgZm9yIGEgYmV6aWVyIGN1cnZlLFxuICogcmV0dXJuIGEgZnVuY3Rpb24gdGhhdCBpbnRlcnBvbGF0ZXMgYWxvbmcgdGhhdCBjdXJ2ZS5cbiAqXG4gKiBAcGFyYW0gcDF4IGNvbnRyb2wgcG9pbnQgMSB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSBwMXkgY29udHJvbCBwb2ludCAxIHkgY29vcmRpbmF0ZVxuICogQHBhcmFtIHAyeCBjb250cm9sIHBvaW50IDIgeCBjb29yZGluYXRlXG4gKiBAcGFyYW0gcDJ5IGNvbnRyb2wgcG9pbnQgMiB5IGNvb3JkaW5hdGVcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuYmV6aWVyID0gZnVuY3Rpb24ocDF4ICAgICAgICAsIHAxeSAgICAgICAgLCBwMnggICAgICAgICwgcDJ5ICAgICAgICApICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgIGNvbnN0IGJlemllciA9IG5ldyBVbml0QmV6aWVyKHAxeCwgcDF5LCBwMngsIHAyeSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHQgICAgICAgICkge1xuICAgICAgICByZXR1cm4gYmV6aWVyLnNvbHZlKHQpO1xuICAgIH07XG59O1xuXG4vKipcbiAqIEEgZGVmYXVsdCBiZXppZXItY3VydmUgcG93ZXJlZCBlYXNpbmcgZnVuY3Rpb24gd2l0aFxuICogY29udHJvbCBwb2ludHMgKDAuMjUsIDAuMSkgYW5kICgwLjI1LCAxKVxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZWFzZSA9IGV4cG9ydHMuYmV6aWVyKDAuMjUsIDAuMSwgMC4yNSwgMSk7XG5cbi8qKlxuICogY29uc3RyYWluIG4gdG8gdGhlIGdpdmVuIHJhbmdlIHZpYSBtaW4gKyBtYXhcbiAqXG4gKiBAcGFyYW0gbiB2YWx1ZVxuICogQHBhcmFtIG1pbiB0aGUgbWluaW11bSB2YWx1ZSB0byBiZSByZXR1cm5lZFxuICogQHBhcmFtIG1heCB0aGUgbWF4aW11bSB2YWx1ZSB0byBiZSByZXR1cm5lZFxuICogQHJldHVybnMgdGhlIGNsYW1wZWQgdmFsdWVcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuY2xhbXAgPSBmdW5jdGlvbiAobiAgICAgICAgLCBtaW4gICAgICAgICwgbWF4ICAgICAgICApICAgICAgICAge1xuICAgIHJldHVybiBNYXRoLm1pbihtYXgsIE1hdGgubWF4KG1pbiwgbikpO1xufTtcblxuLyoqXG4gKiBjb25zdHJhaW4gbiB0byB0aGUgZ2l2ZW4gcmFuZ2UsIGV4Y2x1ZGluZyB0aGUgbWluaW11bSwgdmlhIG1vZHVsYXIgYXJpdGhtZXRpY1xuICpcbiAqIEBwYXJhbSBuIHZhbHVlXG4gKiBAcGFyYW0gbWluIHRoZSBtaW5pbXVtIHZhbHVlIHRvIGJlIHJldHVybmVkLCBleGNsdXNpdmVcbiAqIEBwYXJhbSBtYXggdGhlIG1heGltdW0gdmFsdWUgdG8gYmUgcmV0dXJuZWQsIGluY2x1c2l2ZVxuICogQHJldHVybnMgY29uc3RyYWluZWQgbnVtYmVyXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLndyYXAgPSBmdW5jdGlvbiAobiAgICAgICAgLCBtaW4gICAgICAgICwgbWF4ICAgICAgICApICAgICAgICAge1xuICAgIGNvbnN0IGQgPSBtYXggLSBtaW47XG4gICAgY29uc3QgdyA9ICgobiAtIG1pbikgJSBkICsgZCkgJSBkICsgbWluO1xuICAgIHJldHVybiAodyA9PT0gbWluKSA/IG1heCA6IHc7XG59O1xuXG4vKlxuICogQ2FsbCBhbiBhc3luY2hyb25vdXMgZnVuY3Rpb24gb24gYW4gYXJyYXkgb2YgYXJndW1lbnRzLFxuICogY2FsbGluZyBgY2FsbGJhY2tgIHdpdGggdGhlIGNvbXBsZXRlZCByZXN1bHRzIG9mIGFsbCBjYWxscy5cbiAqXG4gKiBAcGFyYW0gYXJyYXkgaW5wdXQgdG8gZWFjaCBjYWxsIG9mIHRoZSBhc3luYyBmdW5jdGlvbi5cbiAqIEBwYXJhbSBmbiBhbiBhc3luYyBmdW5jdGlvbiB3aXRoIHNpZ25hdHVyZSAoZGF0YSwgY2FsbGJhY2spXG4gKiBAcGFyYW0gY2FsbGJhY2sgYSBjYWxsYmFjayBydW4gYWZ0ZXIgYWxsIGFzeW5jIHdvcmsgaXMgZG9uZS5cbiAqIGNhbGxlZCB3aXRoIGFuIGFycmF5LCBjb250YWluaW5nIHRoZSByZXN1bHRzIG9mIGVhY2ggYXN5bmMgY2FsbC5cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuYXN5bmNBbGwgPSBmdW5jdGlvbiAoYXJyYXkgICAgICAgICAgICAsIGZuICAgICAgICAgICwgY2FsbGJhY2sgICAgICAgICAgKSB7XG4gICAgaWYgKCFhcnJheS5sZW5ndGgpIHsgcmV0dXJuIGNhbGxiYWNrKG51bGwsIFtdKTsgfVxuICAgIGxldCByZW1haW5pbmcgPSBhcnJheS5sZW5ndGg7XG4gICAgY29uc3QgcmVzdWx0cyA9IG5ldyBBcnJheShhcnJheS5sZW5ndGgpO1xuICAgIGxldCBlcnJvciA9IG51bGw7XG4gICAgYXJyYXkuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICBmbihpdGVtLCAoZXJyLCByZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmIChlcnIpIGVycm9yID0gZXJyO1xuICAgICAgICAgICAgcmVzdWx0c1tpXSA9IHJlc3VsdDtcbiAgICAgICAgICAgIGlmICgtLXJlbWFpbmluZyA9PT0gMCkgY2FsbGJhY2soZXJyb3IsIHJlc3VsdHMpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qXG4gKiBQb2x5ZmlsbCBmb3IgT2JqZWN0LnZhbHVlcy4gTm90IGZ1bGx5IHNwZWMgY29tcGxpYW50LCBidXQgd2UgZG9uJ3RcbiAqIG5lZWQgaXQgdG8gYmUuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy52YWx1ZXMgPSBmdW5jdGlvbiAob2JqICAgICAgICApICAgICAgICAgICAgICAgIHtcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGsgaW4gb2JqKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKG9ialtrXSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKlxuICogQ29tcHV0ZSB0aGUgZGlmZmVyZW5jZSBiZXR3ZWVuIHRoZSBrZXlzIGluIG9uZSBvYmplY3QgYW5kIHRoZSBrZXlzXG4gKiBpbiBhbm90aGVyIG9iamVjdC5cbiAqXG4gKiBAcmV0dXJucyBrZXlzIGRpZmZlcmVuY2VcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMua2V5c0RpZmZlcmVuY2UgPSBmdW5jdGlvbiAob2JqICAgICAgICAsIG90aGVyICAgICAgICApICAgICAgICAgICAgICAgIHtcbiAgICBjb25zdCBkaWZmZXJlbmNlID0gW107XG4gICAgZm9yIChjb25zdCBpIGluIG9iaikge1xuICAgICAgICBpZiAoIShpIGluIG90aGVyKSkge1xuICAgICAgICAgICAgZGlmZmVyZW5jZS5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkaWZmZXJlbmNlO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIGRlc3RpbmF0aW9uIG9iamVjdCBhbmQgb3B0aW9uYWxseSBtYW55IHNvdXJjZSBvYmplY3RzLFxuICogY29weSBhbGwgcHJvcGVydGllcyBmcm9tIHRoZSBzb3VyY2Ugb2JqZWN0cyBpbnRvIHRoZSBkZXN0aW5hdGlvbi5cbiAqIFRoZSBsYXN0IHNvdXJjZSBvYmplY3QgZ2l2ZW4gb3ZlcnJpZGVzIHByb3BlcnRpZXMgZnJvbSBwcmV2aW91c1xuICogc291cmNlIG9iamVjdHMuXG4gKlxuICogQHBhcmFtIGRlc3QgZGVzdGluYXRpb24gb2JqZWN0XG4gKiBAcGFyYW0gey4uLk9iamVjdH0gc291cmNlcyBzb3VyY2VzIGZyb20gd2hpY2ggcHJvcGVydGllcyBhcmUgcHVsbGVkXG4gKiBAcHJpdmF0ZVxuICovXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmV4cG9ydHMuZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgICAgICAgICwgc291cmNlMCAgICAgICAgLCBzb3VyY2UxICAgICAgICAgLCBzb3VyY2UyICAgICAgICAgKSAgICAgICAgIHtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzcmMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAoY29uc3QgayBpbiBzcmMpIHtcbiAgICAgICAgICAgIGRlc3Rba10gPSBzcmNba107XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuXG4vKipcbiAqIEdpdmVuIGFuIG9iamVjdCBhbmQgYSBudW1iZXIgb2YgcHJvcGVydGllcyBhcyBzdHJpbmdzLCByZXR1cm4gdmVyc2lvblxuICogb2YgdGhhdCBvYmplY3Qgd2l0aCBvbmx5IHRob3NlIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHNyYyB0aGUgb2JqZWN0XG4gKiBAcGFyYW0gcHJvcGVydGllcyBhbiBhcnJheSBvZiBwcm9wZXJ0eSBuYW1lcyBjaG9zZW5cbiAqIHRvIGFwcGVhciBvbiB0aGUgcmVzdWx0aW5nIG9iamVjdC5cbiAqIEByZXR1cm5zIG9iamVjdCB3aXRoIGxpbWl0ZWQgcHJvcGVydGllcy5cbiAqIEBleGFtcGxlXG4gKiB2YXIgZm9vID0geyBuYW1lOiAnQ2hhcmxpZScsIGFnZTogMTAgfTtcbiAqIHZhciBqdXN0TmFtZSA9IHBpY2soZm9vLCBbJ25hbWUnXSk7XG4gKiAvLyBqdXN0TmFtZSA9IHsgbmFtZTogJ0NoYXJsaWUnIH1cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMucGljayA9IGZ1bmN0aW9uIChzcmMgICAgICAgICwgcHJvcGVydGllcyAgICAgICAgICAgICAgICkgICAgICAgICB7XG4gICAgY29uc3QgcmVzdWx0ID0ge307XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wZXJ0aWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGsgPSBwcm9wZXJ0aWVzW2ldO1xuICAgICAgICBpZiAoayBpbiBzcmMpIHtcbiAgICAgICAgICAgIHJlc3VsdFtrXSA9IHNyY1trXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblxubGV0IGlkID0gMTtcblxuLyoqXG4gKiBSZXR1cm4gYSB1bmlxdWUgbnVtZXJpYyBpZCwgc3RhcnRpbmcgYXQgMSBhbmQgaW5jcmVtZW50aW5nIHdpdGhcbiAqIGVhY2ggY2FsbC5cbiAqXG4gKiBAcmV0dXJucyB1bmlxdWUgbnVtZXJpYyBpZC5cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMudW5pcXVlSWQgPSBmdW5jdGlvbiAoKSAgICAgICAgIHtcbiAgICByZXR1cm4gaWQrKztcbn07XG5cbi8qKlxuICogR2l2ZW4gYW4gYXJyYXkgb2YgbWVtYmVyIGZ1bmN0aW9uIG5hbWVzIGFzIHN0cmluZ3MsIHJlcGxhY2UgYWxsIG9mIHRoZW1cbiAqIHdpdGggYm91bmQgdmVyc2lvbnMgdGhhdCB3aWxsIGFsd2F5cyByZWZlciB0byBgY29udGV4dGAgYXMgYHRoaXNgLiBUaGlzXG4gKiBpcyB1c2VmdWwgZm9yIGNsYXNzZXMgd2hlcmUgb3RoZXJ3aXNlIGV2ZW50IGJpbmRpbmdzIHdvdWxkIHJlYXNzaWduXG4gKiBgdGhpc2AgdG8gdGhlIGV2ZW50ZWQgb2JqZWN0IG9yIHNvbWUgb3RoZXIgdmFsdWU6IHRoaXMgbGV0cyB5b3UgZW5zdXJlXG4gKiB0aGUgYHRoaXNgIHZhbHVlIGFsd2F5cy5cbiAqXG4gKiBAcGFyYW0gZm5zIGxpc3Qgb2YgbWVtYmVyIGZ1bmN0aW9uIG5hbWVzXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgY29udGV4dCB2YWx1ZVxuICogQGV4YW1wbGVcbiAqIGZ1bmN0aW9uIE15Q2xhc3MoKSB7XG4gKiAgIGJpbmRBbGwoWydvbnRpbWVyJ10sIHRoaXMpO1xuICogICB0aGlzLm5hbWUgPSAnVG9tJztcbiAqIH1cbiAqIE15Q2xhc3MucHJvdG90eXBlLm9udGltZXIgPSBmdW5jdGlvbigpIHtcbiAqICAgYWxlcnQodGhpcy5uYW1lKTtcbiAqIH07XG4gKiB2YXIgbXlDbGFzcyA9IG5ldyBNeUNsYXNzKCk7XG4gKiBzZXRUaW1lb3V0KG15Q2xhc3Mub250aW1lciwgMTAwKTtcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuYmluZEFsbCA9IGZ1bmN0aW9uKGZucyAgICAgICAgICAgICAgICwgY29udGV4dCAgICAgICAgKSAgICAgICB7XG4gICAgZm5zLmZvckVhY2goKGZuKSA9PiB7XG4gICAgICAgIGlmICghY29udGV4dFtmbl0pIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnRleHRbZm5dID0gY29udGV4dFtmbl0uYmluZChjb250ZXh0KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGNvb3JkaW5hdGVzLCBnZXQgdGhlaXIgY2VudGVyIGFzIGEgY29vcmRpbmF0ZS5cbiAqXG4gKiBAcmV0dXJucyBjZW50ZXJwb2ludFxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5nZXRDb29yZGluYXRlc0NlbnRlciA9IGZ1bmN0aW9uKGNvb3JkcyAgICAgICAgICAgICAgICAgICApICAgICAgICAgICAgIHtcbiAgICBsZXQgbWluWCA9IEluZmluaXR5O1xuICAgIGxldCBtaW5ZID0gSW5maW5pdHk7XG4gICAgbGV0IG1heFggPSAtSW5maW5pdHk7XG4gICAgbGV0IG1heFkgPSAtSW5maW5pdHk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvb3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBtaW5YID0gTWF0aC5taW4obWluWCwgY29vcmRzW2ldLmNvbHVtbik7XG4gICAgICAgIG1pblkgPSBNYXRoLm1pbihtaW5ZLCBjb29yZHNbaV0ucm93KTtcbiAgICAgICAgbWF4WCA9IE1hdGgubWF4KG1heFgsIGNvb3Jkc1tpXS5jb2x1bW4pO1xuICAgICAgICBtYXhZID0gTWF0aC5tYXgobWF4WSwgY29vcmRzW2ldLnJvdyk7XG4gICAgfVxuXG4gICAgY29uc3QgZHggPSBtYXhYIC0gbWluWDtcbiAgICBjb25zdCBkeSA9IG1heFkgLSBtaW5ZO1xuICAgIGNvbnN0IGRNYXggPSBNYXRoLm1heChkeCwgZHkpO1xuICAgIGNvbnN0IHpvb20gPSBNYXRoLm1heCgwLCBNYXRoLmZsb29yKC1NYXRoLmxvZyhkTWF4KSAvIE1hdGguTE4yKSk7XG4gICAgcmV0dXJuIG5ldyBDb29yZGluYXRlKChtaW5YICsgbWF4WCkgLyAyLCAobWluWSArIG1heFkpIC8gMiwgMClcbiAgICAgICAgLnpvb21Ubyh6b29tKTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgc3RyaW5nIGVuZHMgd2l0aCBhIHBhcnRpY3VsYXIgc3Vic3RyaW5nXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5lbmRzV2l0aCA9IGZ1bmN0aW9uKHN0cmluZyAgICAgICAgLCBzdWZmaXggICAgICAgICkgICAgICAgICAge1xuICAgIHJldHVybiBzdHJpbmcuaW5kZXhPZihzdWZmaXgsIHN0cmluZy5sZW5ndGggLSBzdWZmaXgubGVuZ3RoKSAhPT0gLTE7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbiBvYmplY3QgYnkgbWFwcGluZyBhbGwgdGhlIHZhbHVlcyBvZiBhbiBleGlzdGluZyBvYmplY3Qgd2hpbGVcbiAqIHByZXNlcnZpbmcgdGhlaXIga2V5cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLm1hcE9iamVjdCA9IGZ1bmN0aW9uKGlucHV0ICAgICAgICAsIGl0ZXJhdG9yICAgICAgICAgICwgY29udGV4dCAgICAgICAgICkgICAgICAgICB7XG4gICAgY29uc3Qgb3V0cHV0ID0ge307XG4gICAgZm9yIChjb25zdCBrZXkgaW4gaW5wdXQpIHtcbiAgICAgICAgb3V0cHV0W2tleV0gPSBpdGVyYXRvci5jYWxsKGNvbnRleHQgfHwgdGhpcywgaW5wdXRba2V5XSwga2V5LCBpbnB1dCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbiBvYmplY3QgYnkgZmlsdGVyaW5nIG91dCB2YWx1ZXMgb2YgYW4gZXhpc3Rpbmcgb2JqZWN0LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuZmlsdGVyT2JqZWN0ID0gZnVuY3Rpb24oaW5wdXQgICAgICAgICwgaXRlcmF0b3IgICAgICAgICAgLCBjb250ZXh0ICAgICAgICAgKSAgICAgICAgIHtcbiAgICBjb25zdCBvdXRwdXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBpbnB1dCkge1xuICAgICAgICBpZiAoaXRlcmF0b3IuY2FsbChjb250ZXh0IHx8IHRoaXMsIGlucHV0W2tleV0sIGtleSwgaW5wdXQpKSB7XG4gICAgICAgICAgICBvdXRwdXRba2V5XSA9IGlucHV0W2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogRGVlcGx5IGNvbXBhcmVzIHR3byBvYmplY3QgbGl0ZXJhbHMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5kZWVwRXF1YWwgPSBmdW5jdGlvbihhICAgICAgICAsIGIgICAgICAgICkgICAgICAgICAge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIGlmICghQXJyYXkuaXNBcnJheShiKSB8fCBhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWV4cG9ydHMuZGVlcEVxdWFsKGFbaV0sIGJbaV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgYSA9PT0gJ29iamVjdCcgJiYgYSAhPT0gbnVsbCAmJiBiICE9PSBudWxsKSB7XG4gICAgICAgIGlmICghKHR5cGVvZiBiID09PSAnb2JqZWN0JykpIHJldHVybiBmYWxzZTtcbiAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGEpO1xuICAgICAgICBpZiAoa2V5cy5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIpLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBhKSB7XG4gICAgICAgICAgICBpZiAoIWV4cG9ydHMuZGVlcEVxdWFsKGFba2V5XSwgYltrZXldKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gYSA9PT0gYjtcbn07XG5cbi8qKlxuICogRGVlcGx5IGNsb25lcyB0d28gb2JqZWN0cy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmNsb25lID0gZnVuY3Rpb24gICAoaW5wdXQgICApICAgIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgcmV0dXJuIGlucHV0Lm1hcChleHBvcnRzLmNsb25lKTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiYgaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuICgoZXhwb3J0cy5tYXBPYmplY3QoaW5wdXQsIGV4cG9ydHMuY2xvbmUpICAgICApICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfVxufTtcblxuLyoqXG4gKiBDaGVjayBpZiB0d28gYXJyYXlzIGhhdmUgYXQgbGVhc3Qgb25lIGNvbW1vbiBlbGVtZW50LlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuYXJyYXlzSW50ZXJzZWN0ID0gZnVuY3Rpb24oYSAgICAgICAgICAgICwgYiAgICAgICAgICAgICkgICAgICAgICAge1xuICAgIGZvciAobGV0IGwgPSAwOyBsIDwgYS5sZW5ndGg7IGwrKykge1xuICAgICAgICBpZiAoYi5pbmRleE9mKGFbbF0pID49IDApIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59O1xuXG4vKipcbiAqIFByaW50IGEgd2FybmluZyBtZXNzYWdlIHRvIHRoZSBjb25zb2xlIGFuZCBlbnN1cmUgZHVwbGljYXRlIHdhcm5pbmcgbWVzc2FnZXNcbiAqIGFyZSBub3QgcHJpbnRlZC5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5jb25zdCB3YXJuT25jZUhpc3RvcnkgPSB7fTtcbmV4cG9ydHMud2Fybk9uY2UgPSBmdW5jdGlvbihtZXNzYWdlICAgICAgICApICAgICAgIHtcbiAgICBpZiAoIXdhcm5PbmNlSGlzdG9yeVttZXNzYWdlXSkge1xuICAgICAgICAvLyBjb25zb2xlIGlzbid0IGRlZmluZWQgaW4gc29tZSBXZWJXb3JrZXJzLCBzZWUgIzI1NThcbiAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSBcInVuZGVmaW5lZFwiKSBjb25zb2xlLndhcm4obWVzc2FnZSk7XG4gICAgICAgIHdhcm5PbmNlSGlzdG9yeVttZXNzYWdlXSA9IHRydWU7XG4gICAgfVxufTtcblxuLyoqXG4gKiBJbmRpY2F0ZXMgaWYgdGhlIHByb3ZpZGVkIFBvaW50cyBhcmUgaW4gYSBjb3VudGVyIGNsb2Nrd2lzZSAodHJ1ZSkgb3IgY2xvY2t3aXNlIChmYWxzZSkgb3JkZXJcbiAqXG4gKiBAcmV0dXJucyB0cnVlIGZvciBhIGNvdW50ZXIgY2xvY2t3aXNlIHNldCBvZiBwb2ludHNcbiAqL1xuLy8gaHR0cDovL2JyeWNlYm9lLmNvbS8yMDA2LzEwLzIzL2xpbmUtc2VnbWVudC1pbnRlcnNlY3Rpb24tYWxnb3JpdGhtL1xuZXhwb3J0cy5pc0NvdW50ZXJDbG9ja3dpc2UgPSBmdW5jdGlvbihhICAgICAgICwgYiAgICAgICAsIGMgICAgICAgKSAgICAgICAgICB7XG4gICAgcmV0dXJuIChjLnkgLSBhLnkpICogKGIueCAtIGEueCkgPiAoYi55IC0gYS55KSAqIChjLnggLSBhLngpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBzaWduZWQgYXJlYSBmb3IgdGhlIHBvbHlnb24gcmluZy4gIFBvc3RpdmUgYXJlYXMgYXJlIGV4dGVyaW9yIHJpbmdzIGFuZFxuICogaGF2ZSBhIGNsb2Nrd2lzZSB3aW5kaW5nLiAgTmVnYXRpdmUgYXJlYXMgYXJlIGludGVyaW9yIHJpbmdzIGFuZCBoYXZlIGEgY291bnRlciBjbG9ja3dpc2VcbiAqIG9yZGVyaW5nLlxuICpcbiAqIEBwYXJhbSByaW5nIEV4dGVyaW9yIG9yIGludGVyaW9yIHJpbmdcbiAqL1xuZXhwb3J0cy5jYWxjdWxhdGVTaWduZWRBcmVhID0gZnVuY3Rpb24ocmluZyAgICAgICAgICAgICAgKSAgICAgICAgIHtcbiAgICBsZXQgc3VtID0gMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcmluZy5sZW5ndGgsIGogPSBsZW4gLSAxLCBwMSwgcDI7IGkgPCBsZW47IGogPSBpKyspIHtcbiAgICAgICAgcDEgPSByaW5nW2ldO1xuICAgICAgICBwMiA9IHJpbmdbal07XG4gICAgICAgIHN1bSArPSAocDIueCAtIHAxLngpICogKHAxLnkgKyBwMi55KTtcbiAgICB9XG4gICAgcmV0dXJuIHN1bTtcbn07XG5cbi8qKlxuICogRGV0ZWN0cyBjbG9zZWQgcG9seWdvbnMsIGZpcnN0ICsgbGFzdCBwb2ludCBhcmUgZXF1YWxcbiAqXG4gKiBAcGFyYW0gcG9pbnRzIGFycmF5IG9mIHBvaW50c1xuICogQHJldHVybiB0cnVlIGlmIHRoZSBwb2ludHMgYXJlIGEgY2xvc2VkIHBvbHlnb25cbiAqL1xuZXhwb3J0cy5pc0Nsb3NlZFBvbHlnb24gPSBmdW5jdGlvbihwb2ludHMgICAgICAgICAgICAgICkgICAgICAgICAge1xuICAgIC8vIElmIGl0IGlzIDIgcG9pbnRzIHRoYXQgYXJlIHRoZSBzYW1lIHRoZW4gaXQgaXMgYSBwb2ludFxuICAgIC8vIElmIGl0IGlzIDMgcG9pbnRzIHdpdGggc3RhcnQgYW5kIGVuZCB0aGUgc2FtZSB0aGVuIGl0IGlzIGEgbGluZVxuICAgIGlmIChwb2ludHMubGVuZ3RoIDwgNClcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3QgcDEgPSBwb2ludHNbMF07XG4gICAgY29uc3QgcDIgPSBwb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdO1xuXG4gICAgaWYgKE1hdGguYWJzKHAxLnggLSBwMi54KSA+IDAgfHxcbiAgICAgICAgTWF0aC5hYnMocDEueSAtIHAyLnkpID4gMCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gcG9seWdvbiBzaW1wbGlmaWNhdGlvbiBjYW4gcHJvZHVjZSBwb2x5Z29ucyB3aXRoIHplcm8gYXJlYSBhbmQgbW9yZSB0aGFuIDMgcG9pbnRzXG4gICAgcmV0dXJuIChNYXRoLmFicyhleHBvcnRzLmNhbGN1bGF0ZVNpZ25lZEFyZWEocG9pbnRzKSkgPiAwLjAxKTtcbn07XG5cbi8qKlxuICogQ29udmVydHMgc3BoZXJpY2FsIGNvb3JkaW5hdGVzIHRvIGNhcnRlc2lhbiBjb29yZGluYXRlcy5cbiAqXG4gKiBAcGFyYW0gc3BoZXJpY2FsIFNwaGVyaWNhbCBjb29yZGluYXRlcywgaW4gW3JhZGlhbCwgYXppbXV0aGFsLCBwb2xhcl1cbiAqIEByZXR1cm4gY2FydGVzaWFuIGNvb3JkaW5hdGVzIGluIFt4LCB5LCB6XVxuICovXG5cbmV4cG9ydHMuc3BoZXJpY2FsVG9DYXJ0ZXNpYW4gPSBmdW5jdGlvbihzcGhlcmljYWwgICAgICAgICAgICAgICApICAgICAgICAgICAgICAgIHtcbiAgICBjb25zdCByID0gc3BoZXJpY2FsWzBdO1xuICAgIGxldCBhemltdXRoYWwgPSBzcGhlcmljYWxbMV0sXG4gICAgICAgIHBvbGFyID0gc3BoZXJpY2FsWzJdO1xuICAgIC8vIFdlIGFic3RyYWN0IFwibm9ydGhcIi9cInVwXCIgKGNvbXBhc3Mtd2lzZSkgdG8gYmUgMMKwIHdoZW4gcmVhbGx5IHRoaXMgaXMgOTDCsCAoz4AvMik6XG4gICAgLy8gY29ycmVjdCBmb3IgdGhhdCBoZXJlXG4gICAgYXppbXV0aGFsICs9IDkwO1xuXG4gICAgLy8gQ29udmVydCBhemltdXRoYWwgYW5kIHBvbGFyIGFuZ2xlcyB0byByYWRpYW5zXG4gICAgYXppbXV0aGFsICo9IE1hdGguUEkgLyAxODA7XG4gICAgcG9sYXIgKj0gTWF0aC5QSSAvIDE4MDtcblxuICAgIC8vIHNwaGVyaWNhbCB0byBjYXJ0ZXNpYW4gKHgsIHksIHopXG4gICAgcmV0dXJuIFtcbiAgICAgICAgciAqIE1hdGguY29zKGF6aW11dGhhbCkgKiBNYXRoLnNpbihwb2xhciksXG4gICAgICAgIHIgKiBNYXRoLnNpbihhemltdXRoYWwpICogTWF0aC5zaW4ocG9sYXIpLFxuICAgICAgICByICogTWF0aC5jb3MocG9sYXIpXG4gICAgXTtcbn07XG5cbi8qKlxuICogUGFyc2VzIGRhdGEgZnJvbSAnQ2FjaGUtQ29udHJvbCcgaGVhZGVycy5cbiAqXG4gKiBAcGFyYW0gY2FjaGVDb250cm9sIFZhbHVlIG9mICdDYWNoZS1Db250cm9sJyBoZWFkZXJcbiAqIEByZXR1cm4gb2JqZWN0IGNvbnRhaW5pbmcgcGFyc2VkIGhlYWRlciBpbmZvLlxuICovXG5cbmV4cG9ydHMucGFyc2VDYWNoZUNvbnRyb2wgPSBmdW5jdGlvbihjYWNoZUNvbnRyb2wgICAgICAgICkgICAgICAgICB7XG4gICAgLy8gVGFrZW4gZnJvbSBbV3JlY2tdKGh0dHBzOi8vZ2l0aHViLmNvbS9oYXBpanMvd3JlY2spXG4gICAgY29uc3QgcmUgPSAvKD86XnwoPzpcXHMqXFwsXFxzKikpKFteXFx4MDAtXFx4MjBcXChcXCk8PkBcXCw7XFw6XFxcXFwiXFwvXFxbXFxdXFw/XFw9XFx7XFx9XFx4N0ZdKykoPzpcXD0oPzooW15cXHgwMC1cXHgyMFxcKFxcKTw+QFxcLDtcXDpcXFxcXCJcXC9cXFtcXF1cXD9cXD1cXHtcXH1cXHg3Rl0rKXwoPzpcXFwiKCg/OlteXCJcXFxcXXxcXFxcLikqKVxcXCIpKSk/L2c7XG5cbiAgICBjb25zdCBoZWFkZXIgPSB7fTtcbiAgICBjYWNoZUNvbnRyb2wucmVwbGFjZShyZSwgKCQwLCAkMSwgJDIsICQzKSA9PiB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gJDIgfHwgJDM7XG4gICAgICAgIGhlYWRlclskMV0gPSB2YWx1ZSA/IHZhbHVlLnRvTG93ZXJDYXNlKCkgOiB0cnVlO1xuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG5cbiAgICBpZiAoaGVhZGVyWydtYXgtYWdlJ10pIHtcbiAgICAgICAgY29uc3QgbWF4QWdlID0gcGFyc2VJbnQoaGVhZGVyWydtYXgtYWdlJ10sIDEwKTtcbiAgICAgICAgaWYgKGlzTmFOKG1heEFnZSkpIGRlbGV0ZSBoZWFkZXJbJ21heC1hZ2UnXTtcbiAgICAgICAgZWxzZSBoZWFkZXJbJ21heC1hZ2UnXSA9IG1heEFnZTtcbiAgICB9XG5cbiAgICByZXR1cm4gaGVhZGVyO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSBQb2ludDtcblxuZnVuY3Rpb24gUG9pbnQoeCwgeSkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbn1cblxuUG9pbnQucHJvdG90eXBlID0ge1xuICAgIGNsb25lOiBmdW5jdGlvbigpIHsgcmV0dXJuIG5ldyBQb2ludCh0aGlzLngsIHRoaXMueSk7IH0sXG5cbiAgICBhZGQ6ICAgICBmdW5jdGlvbihwKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX2FkZChwKTsgICAgIH0sXG4gICAgc3ViOiAgICAgZnVuY3Rpb24ocCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9zdWIocCk7ICAgICB9LFxuICAgIG11bHQ6ICAgIGZ1bmN0aW9uKGspIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fbXVsdChrKTsgICAgfSxcbiAgICBkaXY6ICAgICBmdW5jdGlvbihrKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX2RpdihrKTsgICAgIH0sXG4gICAgcm90YXRlOiAgZnVuY3Rpb24oYSkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9yb3RhdGUoYSk7ICB9LFxuICAgIG1hdE11bHQ6IGZ1bmN0aW9uKG0pIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fbWF0TXVsdChtKTsgfSxcbiAgICB1bml0OiAgICBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fdW5pdCgpOyB9LFxuICAgIHBlcnA6ICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9wZXJwKCk7IH0sXG4gICAgcm91bmQ6ICAgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3JvdW5kKCk7IH0sXG5cbiAgICBtYWc6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSk7XG4gICAgfSxcblxuICAgIGVxdWFsczogZnVuY3Rpb24ocCkge1xuICAgICAgICByZXR1cm4gdGhpcy54ID09PSBwLnggJiZcbiAgICAgICAgICAgICAgIHRoaXMueSA9PT0gcC55O1xuICAgIH0sXG5cbiAgICBkaXN0OiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy5kaXN0U3FyKHApKTtcbiAgICB9LFxuXG4gICAgZGlzdFNxcjogZnVuY3Rpb24ocCkge1xuICAgICAgICB2YXIgZHggPSBwLnggLSB0aGlzLngsXG4gICAgICAgICAgICBkeSA9IHAueSAtIHRoaXMueTtcbiAgICAgICAgcmV0dXJuIGR4ICogZHggKyBkeSAqIGR5O1xuICAgIH0sXG5cbiAgICBhbmdsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMueSwgdGhpcy54KTtcbiAgICB9LFxuXG4gICAgYW5nbGVUbzogZnVuY3Rpb24oYikge1xuICAgICAgICByZXR1cm4gTWF0aC5hdGFuMih0aGlzLnkgLSBiLnksIHRoaXMueCAtIGIueCk7XG4gICAgfSxcblxuICAgIGFuZ2xlV2l0aDogZnVuY3Rpb24oYikge1xuICAgICAgICByZXR1cm4gdGhpcy5hbmdsZVdpdGhTZXAoYi54LCBiLnkpO1xuICAgIH0sXG5cbiAgICAvLyBGaW5kIHRoZSBhbmdsZSBvZiB0aGUgdHdvIHZlY3RvcnMsIHNvbHZpbmcgdGhlIGZvcm11bGEgZm9yIHRoZSBjcm9zcyBwcm9kdWN0IGEgeCBiID0gfGF8fGJ8c2luKM64KSBmb3IgzrguXG4gICAgYW5nbGVXaXRoU2VwOiBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKFxuICAgICAgICAgICAgdGhpcy54ICogeSAtIHRoaXMueSAqIHgsXG4gICAgICAgICAgICB0aGlzLnggKiB4ICsgdGhpcy55ICogeSk7XG4gICAgfSxcblxuICAgIF9tYXRNdWx0OiBmdW5jdGlvbihtKSB7XG4gICAgICAgIHZhciB4ID0gbVswXSAqIHRoaXMueCArIG1bMV0gKiB0aGlzLnksXG4gICAgICAgICAgICB5ID0gbVsyXSAqIHRoaXMueCArIG1bM10gKiB0aGlzLnk7XG4gICAgICAgIHRoaXMueCA9IHg7XG4gICAgICAgIHRoaXMueSA9IHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfYWRkOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHRoaXMueCArPSBwLng7XG4gICAgICAgIHRoaXMueSArPSBwLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfc3ViOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHRoaXMueCAtPSBwLng7XG4gICAgICAgIHRoaXMueSAtPSBwLnk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfbXVsdDogZnVuY3Rpb24oaykge1xuICAgICAgICB0aGlzLnggKj0gaztcbiAgICAgICAgdGhpcy55ICo9IGs7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfZGl2OiBmdW5jdGlvbihrKSB7XG4gICAgICAgIHRoaXMueCAvPSBrO1xuICAgICAgICB0aGlzLnkgLz0gaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF91bml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5fZGl2KHRoaXMubWFnKCkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3BlcnA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgeSA9IHRoaXMueTtcbiAgICAgICAgdGhpcy55ID0gdGhpcy54O1xuICAgICAgICB0aGlzLnggPSAteTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9yb3RhdGU6IGZ1bmN0aW9uKGFuZ2xlKSB7XG4gICAgICAgIHZhciBjb3MgPSBNYXRoLmNvcyhhbmdsZSksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLnNpbihhbmdsZSksXG4gICAgICAgICAgICB4ID0gY29zICogdGhpcy54IC0gc2luICogdGhpcy55LFxuICAgICAgICAgICAgeSA9IHNpbiAqIHRoaXMueCArIGNvcyAqIHRoaXMueTtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9yb3VuZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMueCA9IE1hdGgucm91bmQodGhpcy54KTtcbiAgICAgICAgdGhpcy55ID0gTWF0aC5yb3VuZCh0aGlzLnkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59O1xuXG4vLyBjb25zdHJ1Y3RzIFBvaW50IGZyb20gYW4gYXJyYXkgaWYgbmVjZXNzYXJ5XG5Qb2ludC5jb252ZXJ0ID0gZnVuY3Rpb24gKGEpIHtcbiAgICBpZiAoYSBpbnN0YW5jZW9mIFBvaW50KSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgIH1cbiAgICBpZiAoQXJyYXkuaXNBcnJheShhKSkge1xuICAgICAgICByZXR1cm4gbmV3IFBvaW50KGFbMF0sIGFbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn07XG4iLCIvL2FkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbWFwYm94L21hcGJveC1nbC1qcy9ibG9iLzA2MWZkYjUxNGEzM2NmOWIyYjU0MmExYzdiZDQzM2MxNjZkYTkxN2Uvc3JjL3VpL2NvbnRyb2wvc2NhbGVfY29udHJvbC5qcyNMMTktTDUyXG5cbid1c2Ugc3RyaWN0JztcblxuY29uc3QgRE9NID0gcmVxdWlyZSgnbWFwYm94LWdsL3NyYy91dGlsL2RvbScpO1xuY29uc3QgdXRpbCA9IHJlcXVpcmUoJ21hcGJveC1nbC9zcmMvdXRpbC91dGlsJyk7XG5cbi8qKlxuICogQSBgU2NhbGVDb250cm9sYCBjb250cm9sIGRpc3BsYXlzIHRoZSByYXRpbyBvZiBhIGRpc3RhbmNlIG9uIHRoZSBtYXAgdG8gdGhlIGNvcnJlc3BvbmRpbmcgZGlzdGFuY2Ugb24gdGhlIGdyb3VuZC5cbiAqXG4gKiBAaW1wbGVtZW50cyB7SUNvbnRyb2x9XG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge251bWJlcn0gW29wdGlvbnMubWF4V2lkdGg9JzE1MCddIFRoZSBtYXhpbXVtIGxlbmd0aCBvZiB0aGUgc2NhbGUgY29udHJvbCBpbiBwaXhlbHMuXG4gKiBAZXhhbXBsZVxuICogbWFwLmFkZENvbnRyb2wobmV3IFNjYWxlQ29udHJvbCh7XG4gKiAgICAgbWF4V2lkdGg6IDgwXG4gKiB9KSk7XG4gKi9cbiBjbGFzcyBEdWFsU2NhbGVDb250cm9sIHtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcblxuICAgICAgICB1dGlsLmJpbmRBbGwoW1xuICAgICAgICAgICAgJ19vbk1vdmUnLCAnX29uTW91c2VNb3ZlJ1xuICAgICAgICBdLCB0aGlzKTtcbiAgICB9XG5cbiAgICBnZXREZWZhdWx0UG9zaXRpb24oKSB7XG4gICAgICAgIHJldHVybiAnYm90dG9tLWxlZnQnO1xuICAgIH1cblxuICAgIF9vbk1vdmUoKSB7XG4gICAgICAgIHVwZGF0ZVNjYWxlKHRoaXMuX21hcCwgdGhpcy5fbWV0cmljQ29udGFpbmVyLCB0aGlzLl9pbXBlcmlhbENvbnRhaW5lciwgdGhpcy5vcHRpb25zKTtcbiAgICB9XG5cbiAgICBfb25Nb3VzZU1vdmUoZSkge1xuICAgICAgICB1cGRhdGVQb3NpdGlvbih0aGlzLl9tYXAsIHRoaXMuX3Bvc2l0aW9uQ29udGFpbmVyLCBlLmxuZ0xhdCk7XG4gICAgfVxuXG4gICAgb25BZGQobWFwKSB7XG4gICAgICAgIHRoaXMuX21hcCA9IG1hcDtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcGJveGdsLWN0cmwgbWFwYm94Z2wtY3RybC1zY2FsZSBtYXBodWJzLWN0cmwtc2NhbGUnLCBtYXAuZ2V0Q29udGFpbmVyKCkpO1xuICAgICAgICB0aGlzLl9wb3NpdGlvbkNvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtYXAtcG9zaXRpb24nLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICB0aGlzLl9tZXRyaWNDb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWV0cmljLXNjYWxlJywgdGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5faW1wZXJpYWxDb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnaW1wZXJpYWwtc2NhbGUnLCB0aGlzLl9jb250YWluZXIpO1xuXG4gICAgICAgIHRoaXMuX21hcC5vbignbW92ZScsIHRoaXMuX29uTW92ZSk7XG4gICAgICAgIHRoaXMuX29uTW92ZSgpO1xuXG4gICAgICAgIHRoaXMuX21hcC5vbignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgICAgICAvL3RoaXMuX29uTW91c2VNb3ZlKHRoaXMuX21hcC5nZXRDZW50ZXIoKSk7IC8vc3RhcnQgYXQgY2VudGVyXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lcjtcbiAgICB9XG5cbiAgICBvblJlbW92ZSgpIHtcbiAgICAgICAgdGhpcy5fY29udGFpbmVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fY29udGFpbmVyKTtcbiAgICAgICAgdGhpcy5fbWFwLm9mZignbW92ZScsIHRoaXMuX29uTW92ZSk7XG4gICAgICAgIHRoaXMuX21hcC5vZmYoJ21vdXNlbW92ZScsIHRoaXMuX29uTW91c2VNb3ZlKTtcbiAgICAgICAgdGhpcy5fbWFwID0gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY2FsZUNvbnRyb2w7XG5cblxuZnVuY3Rpb24gdXBkYXRlUG9zaXRpb24obWFwLCBjb250YWluZXIsIGxuZ0xhdCkge1xuICBjb25zdCBsYXQgPSBsbmdMYXQubGF0LnRvUHJlY2lzaW9uKDQpO1xuICBjb25zdCBsbmcgPSBsbmdMYXQubG5nLnRvUHJlY2lzaW9uKDQpO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gYCR7bGF0fSwgJHtsbmd9YDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2NhbGUobWFwLCBtZXRyaWNDb250YWluZXIsIGltcGVyaWFsQ29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgLy8gQSBob3Jpem9udGFsIHNjYWxlIGlzIGltYWdpbmVkIHRvIGJlIHByZXNlbnQgYXQgY2VudGVyIG9mIHRoZSBtYXBcbiAgICAvLyBjb250YWluZXIgd2l0aCBtYXhpbXVtIGxlbmd0aCAoRGVmYXVsdCkgYXMgMTAwcHguXG4gICAgLy8gVXNpbmcgc3BoZXJpY2FsIGxhdyBvZiBjb3NpbmVzIGFwcHJveGltYXRpb24sIHRoZSByZWFsIGRpc3RhbmNlIGlzXG4gICAgLy8gZm91bmQgYmV0d2VlbiB0aGUgdHdvIGNvb3JkaW5hdGVzLlxuICAgIGNvbnN0IG1heFdpZHRoID0gb3B0aW9ucyAmJiBvcHRpb25zLm1heFdpZHRoIHx8IDEwMDtcblxuICAgIGNvbnN0IHkgPSBtYXAuX2NvbnRhaW5lci5jbGllbnRIZWlnaHQgLyAyO1xuICAgIGNvbnN0IG1heE1ldGVycyA9IGdldERpc3RhbmNlKG1hcC51bnByb2plY3QoWzAsIHldKSwgbWFwLnVucHJvamVjdChbbWF4V2lkdGgsIHldKSk7XG4gICAgLy8gVGhlIHJlYWwgZGlzdGFuY2UgY29ycmVzcG9uZGluZyB0byAxMDBweCBzY2FsZSBsZW5ndGggaXMgcm91bmRlZCBvZmYgdG9cbiAgICAvLyBuZWFyIHByZXR0eSBudW1iZXIgYW5kIHRoZSBzY2FsZSBsZW5ndGggZm9yIHRoZSBzYW1lIGlzIGZvdW5kIG91dC5cbiAgICAvLyBEZWZhdWx0IHVuaXQgb2YgdGhlIHNjYWxlIGlzIGJhc2VkIG9uIFVzZXIncyBsb2NhbGUuXG4gICAgIGNvbnN0IG1heEZlZXQgPSAzLjI4MDggKiBtYXhNZXRlcnM7XG4gICAgaWYgKG1heEZlZXQgPiA1MjgwKSB7XG4gICAgICBjb25zdCBtYXhNaWxlcyA9IG1heEZlZXQgLyA1MjgwO1xuICAgICAgc2V0U2NhbGUoaW1wZXJpYWxDb250YWluZXIsIG1heFdpZHRoLCBtYXhNaWxlcywgJ21pJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFNjYWxlKGltcGVyaWFsQ29udGFpbmVyLCBtYXhXaWR0aCwgbWF4RmVldCwgJ2Z0Jyk7XG4gICAgfVxuICAgIHNldFNjYWxlKG1ldHJpY0NvbnRhaW5lciwgbWF4V2lkdGgsIG1heE1ldGVycywgJ20nKTtcblxufVxuXG5mdW5jdGlvbiBzZXRTY2FsZShjb250YWluZXIsIG1heFdpZHRoLCBtYXhEaXN0YW5jZSwgdW5pdCkge1xuICAgIGxldCBkaXN0YW5jZSA9IGdldFJvdW5kTnVtKG1heERpc3RhbmNlKTtcbiAgICBjb25zdCByYXRpbyA9IGRpc3RhbmNlIC8gbWF4RGlzdGFuY2U7XG5cbiAgICBpZiAodW5pdCA9PT0gJ20nICYmIGRpc3RhbmNlID49IDEwMDApIHtcbiAgICAgICAgZGlzdGFuY2UgPSBkaXN0YW5jZSAvIDEwMDA7XG4gICAgICAgIHVuaXQgPSAna20nO1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGAke21heFdpZHRoICogcmF0aW99cHhgO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBkaXN0YW5jZSArIHVuaXQ7XG59XG5cbmZ1bmN0aW9uIGdldERpc3RhbmNlKGxhdGxuZzEsIGxhdGxuZzIpIHtcbiAgICAvLyBVc2VzIHNwaGVyaWNhbCBsYXcgb2YgY29zaW5lcyBhcHByb3hpbWF0aW9uLlxuICAgIGNvbnN0IFIgPSA2MzcxMDAwO1xuXG4gICAgY29uc3QgcmFkID0gTWF0aC5QSSAvIDE4MCxcbiAgICAgICAgbGF0MSA9IGxhdGxuZzEubGF0ICogcmFkLFxuICAgICAgICBsYXQyID0gbGF0bG5nMi5sYXQgKiByYWQsXG4gICAgICAgIGEgPSBNYXRoLnNpbihsYXQxKSAqIE1hdGguc2luKGxhdDIpICtcbiAgICAgICAgICBNYXRoLmNvcyhsYXQxKSAqIE1hdGguY29zKGxhdDIpICogTWF0aC5jb3MoKGxhdGxuZzIubG5nIC0gbGF0bG5nMS5sbmcpICogcmFkKTtcblxuICAgIGNvbnN0IG1heE1ldGVycyA9IFIgKiBNYXRoLmFjb3MoTWF0aC5taW4oYSwgMSkpO1xuICAgIHJldHVybiBtYXhNZXRlcnM7XG5cbn1cblxuZnVuY3Rpb24gZ2V0Um91bmROdW0obnVtKSB7XG4gICAgY29uc3QgcG93MTAgPSBNYXRoLnBvdygxMCwgKGAke01hdGguZmxvb3IobnVtKX1gKS5sZW5ndGggLSAxKTtcbiAgICBsZXQgZCA9IG51bSAvIHBvdzEwO1xuXG4gICAgZCA9IGQgPj0gMTAgPyAxMCA6XG4gICAgICAgIGQgPj0gNSA/IDUgOlxuICAgICAgICBkID49IDMgPyAzIDpcbiAgICAgICAgZCA+PSAyID8gMiA6IDE7XG5cbiAgICByZXR1cm4gcG93MTAgKiBkO1xufSJdfQ==
