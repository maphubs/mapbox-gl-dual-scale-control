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

module.exports = DualScaleControl;


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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQG1hcGJveC91bml0YmV6aWVyL2luZGV4LmpzIiwiL1VzZXJzL2tyaXMvZGV2L21hcGh1YnMvbWFwYm94LWdsLWR1YWwtc2NhbGUtY29udHJvbC9ub2RlX21vZHVsZXMvbWFwYm94LWdsL3NyYy9nZW8vY29vcmRpbmF0ZS5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9icm93c2VyL3dpbmRvdy5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvbm9kZV9tb2R1bGVzL21hcGJveC1nbC9zcmMvdXRpbC9kb20uanMiLCIvVXNlcnMva3Jpcy9kZXYvbWFwaHVicy9tYXBib3gtZ2wtZHVhbC1zY2FsZS1jb250cm9sL25vZGVfbW9kdWxlcy9tYXBib3gtZ2wvc3JjL3V0aWwvdXRpbC5qcyIsIm5vZGVfbW9kdWxlcy9wb2ludC1nZW9tZXRyeS9pbmRleC5qcyIsIi9Vc2Vycy9rcmlzL2Rldi9tYXBodWJzL21hcGJveC1nbC1kdWFsLXNjYWxlLWNvbnRyb2wvc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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OztJQUVILElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ25CLEdBQUssQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMvQyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFBLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUE7YUFDdkMsRUFBQSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLEVBQUE7S0FDbkM7O0lBRUQsT0FBTyxNQUFNLENBQUM7Q0FDakIsQ0FBQzs7O0FDcGNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFJLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7O0lBRXBGLEdBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRCxPQUFPLFNBQVMsQ0FBQzs7Q0FFcEI7O0FBRUQsU0FBUyxXQUFXLENBQUMsR0FBRyxFQUFFO0lBQ3RCLEdBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFBLEVBQUMsSUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBLENBQUUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM5RCxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUM7O0lBRXBCLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7UUFDWixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDVixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDVixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7O0lBRW5CLE9BQU8sS0FBSyxHQUFHLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKlxuICogQ29weXJpZ2h0IChDKSAyMDA4IEFwcGxlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBSZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXRcbiAqIG1vZGlmaWNhdGlvbiwgYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uc1xuICogYXJlIG1ldDpcbiAqIDEuIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0XG4gKiAgICBub3RpY2UsIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gKiAyLiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodFxuICogICAgbm90aWNlLCB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZVxuICogICAgZG9jdW1lbnRhdGlvbiBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cbiAqXG4gKiBUSElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIEFQUExFIElOQy4gYGBBUyBJUycnIEFORCBBTllcbiAqIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFXG4gKiBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVJcbiAqIFBVUlBPU0UgQVJFIERJU0NMQUlNRUQuICBJTiBOTyBFVkVOVCBTSEFMTCBBUFBMRSBJTkMuIE9SXG4gKiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUiBBTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCxcbiAqIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTIChJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTyxcbiAqIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7IExPU1MgT0YgVVNFLCBEQVRBLCBPUlxuICogUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT04gQU5ZIFRIRU9SWVxuICogT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4gKiAoSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0VcbiAqIE9GIFRISVMgU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuXG4gKlxuICogUG9ydGVkIGZyb20gV2Via2l0XG4gKiBodHRwOi8vc3ZuLndlYmtpdC5vcmcvcmVwb3NpdG9yeS93ZWJraXQvdHJ1bmsvU291cmNlL1dlYkNvcmUvcGxhdGZvcm0vZ3JhcGhpY3MvVW5pdEJlemllci5oXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBVbml0QmV6aWVyO1xuXG5mdW5jdGlvbiBVbml0QmV6aWVyKHAxeCwgcDF5LCBwMngsIHAyeSkge1xuICAgIC8vIENhbGN1bGF0ZSB0aGUgcG9seW5vbWlhbCBjb2VmZmljaWVudHMsIGltcGxpY2l0IGZpcnN0IGFuZCBsYXN0IGNvbnRyb2wgcG9pbnRzIGFyZSAoMCwwKSBhbmQgKDEsMSkuXG4gICAgdGhpcy5jeCA9IDMuMCAqIHAxeDtcbiAgICB0aGlzLmJ4ID0gMy4wICogKHAyeCAtIHAxeCkgLSB0aGlzLmN4O1xuICAgIHRoaXMuYXggPSAxLjAgLSB0aGlzLmN4IC0gdGhpcy5ieDtcblxuICAgIHRoaXMuY3kgPSAzLjAgKiBwMXk7XG4gICAgdGhpcy5ieSA9IDMuMCAqIChwMnkgLSBwMXkpIC0gdGhpcy5jeTtcbiAgICB0aGlzLmF5ID0gMS4wIC0gdGhpcy5jeSAtIHRoaXMuYnk7XG5cbiAgICB0aGlzLnAxeCA9IHAxeDtcbiAgICB0aGlzLnAxeSA9IHAyeTtcbiAgICB0aGlzLnAyeCA9IHAyeDtcbiAgICB0aGlzLnAyeSA9IHAyeTtcbn1cblxuVW5pdEJlemllci5wcm90b3R5cGUuc2FtcGxlQ3VydmVYID0gZnVuY3Rpb24odCkge1xuICAgIC8vIGBheCB0XjMgKyBieCB0XjIgKyBjeCB0JyBleHBhbmRlZCB1c2luZyBIb3JuZXIncyBydWxlLlxuICAgIHJldHVybiAoKHRoaXMuYXggKiB0ICsgdGhpcy5ieCkgKiB0ICsgdGhpcy5jeCkgKiB0O1xufTtcblxuVW5pdEJlemllci5wcm90b3R5cGUuc2FtcGxlQ3VydmVZID0gZnVuY3Rpb24odCkge1xuICAgIHJldHVybiAoKHRoaXMuYXkgKiB0ICsgdGhpcy5ieSkgKiB0ICsgdGhpcy5jeSkgKiB0O1xufTtcblxuVW5pdEJlemllci5wcm90b3R5cGUuc2FtcGxlQ3VydmVEZXJpdmF0aXZlWCA9IGZ1bmN0aW9uKHQpIHtcbiAgICByZXR1cm4gKDMuMCAqIHRoaXMuYXggKiB0ICsgMi4wICogdGhpcy5ieCkgKiB0ICsgdGhpcy5jeDtcbn07XG5cblVuaXRCZXppZXIucHJvdG90eXBlLnNvbHZlQ3VydmVYID0gZnVuY3Rpb24oeCwgZXBzaWxvbikge1xuICAgIGlmICh0eXBlb2YgZXBzaWxvbiA9PT0gJ3VuZGVmaW5lZCcpIGVwc2lsb24gPSAxZS02O1xuXG4gICAgdmFyIHQwLCB0MSwgdDIsIHgyLCBpO1xuXG4gICAgLy8gRmlyc3QgdHJ5IGEgZmV3IGl0ZXJhdGlvbnMgb2YgTmV3dG9uJ3MgbWV0aG9kIC0tIG5vcm1hbGx5IHZlcnkgZmFzdC5cbiAgICBmb3IgKHQyID0geCwgaSA9IDA7IGkgPCA4OyBpKyspIHtcblxuICAgICAgICB4MiA9IHRoaXMuc2FtcGxlQ3VydmVYKHQyKSAtIHg7XG4gICAgICAgIGlmIChNYXRoLmFicyh4MikgPCBlcHNpbG9uKSByZXR1cm4gdDI7XG5cbiAgICAgICAgdmFyIGQyID0gdGhpcy5zYW1wbGVDdXJ2ZURlcml2YXRpdmVYKHQyKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKGQyKSA8IDFlLTYpIGJyZWFrO1xuXG4gICAgICAgIHQyID0gdDIgLSB4MiAvIGQyO1xuICAgIH1cblxuICAgIC8vIEZhbGwgYmFjayB0byB0aGUgYmlzZWN0aW9uIG1ldGhvZCBmb3IgcmVsaWFiaWxpdHkuXG4gICAgdDAgPSAwLjA7XG4gICAgdDEgPSAxLjA7XG4gICAgdDIgPSB4O1xuXG4gICAgaWYgKHQyIDwgdDApIHJldHVybiB0MDtcbiAgICBpZiAodDIgPiB0MSkgcmV0dXJuIHQxO1xuXG4gICAgd2hpbGUgKHQwIDwgdDEpIHtcblxuICAgICAgICB4MiA9IHRoaXMuc2FtcGxlQ3VydmVYKHQyKTtcbiAgICAgICAgaWYgKE1hdGguYWJzKHgyIC0geCkgPCBlcHNpbG9uKSByZXR1cm4gdDI7XG5cbiAgICAgICAgaWYgKHggPiB4Mikge1xuICAgICAgICAgICAgdDAgPSB0MjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHQxID0gdDI7XG4gICAgICAgIH1cblxuICAgICAgICB0MiA9ICh0MSAtIHQwKSAqIDAuNSArIHQwO1xuICAgIH1cblxuICAgIC8vIEZhaWx1cmUuXG4gICAgcmV0dXJuIHQyO1xufTtcblxuVW5pdEJlemllci5wcm90b3R5cGUuc29sdmUgPSBmdW5jdGlvbih4LCBlcHNpbG9uKSB7XG4gICAgcmV0dXJuIHRoaXMuc2FtcGxlQ3VydmVZKHRoaXMuc29sdmVDdXJ2ZVgoeCwgZXBzaWxvbikpO1xufTtcbiIsIid1c2Ugc3RyaWN0Jztcbi8vICAgICAgXG5cbi8qKlxuICogQSBjb29yZGluYXRlIGlzIGEgY29sdW1uLCByb3csIHpvb20gY29tYmluYXRpb24sIG9mdGVuIHVzZWRcbiAqIGFzIHRoZSBkYXRhIGNvbXBvbmVudCBvZiBhIHRpbGUuXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IGNvbHVtblxuICogQHBhcmFtIHtudW1iZXJ9IHJvd1xuICogQHBhcmFtIHtudW1iZXJ9IHpvb21cbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIENvb3JkaW5hdGUge1xuICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICBcbiAgICBjb25zdHJ1Y3Rvcihjb2x1bW4gICAgICAgICwgcm93ICAgICAgICAsIHpvb20gICAgICAgICkge1xuICAgICAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICAgICAgdGhpcy5yb3cgPSByb3c7XG4gICAgICAgIHRoaXMuem9vbSA9IHpvb207XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGEgY2xvbmUgb2YgdGhpcyBjb29yZGluYXRlIHRoYXQgY2FuIGJlIG11dGF0ZWQgd2l0aG91dFxuICAgICAqIGNoYW5naW5nIHRoZSBvcmlnaW5hbCBjb29yZGluYXRlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7Q29vcmRpbmF0ZX0gY2xvbmVcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqIHZhciBjb29yZCA9IG5ldyBDb29yZGluYXRlKDAsIDAsIDApO1xuICAgICAqIHZhciBjMiA9IGNvb3JkLmNsb25lKCk7XG4gICAgICogLy8gc2luY2UgY29vcmQgaXMgY2xvbmVkLCBtb2RpZnlpbmcgYSBwcm9wZXJ0eSBvZiBjMiBkb2VzXG4gICAgICogLy8gbm90IG1vZGlmeSBpdC5cbiAgICAgKiBjMi56b29tID0gMjtcbiAgICAgKi9cbiAgICBjbG9uZSgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBDb29yZGluYXRlKHRoaXMuY29sdW1uLCB0aGlzLnJvdywgdGhpcy56b29tKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBab29tIHRoaXMgY29vcmRpbmF0ZSB0byBhIGdpdmVuIHpvb20gbGV2ZWwuIFRoaXMgcmV0dXJucyBhIG5ld1xuICAgICAqIGNvb3JkaW5hdGUgb2JqZWN0LCBub3QgbXV0YXRpbmcgdGhlIG9sZCBvbmUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gem9vbVxuICAgICAqIEByZXR1cm5zIHtDb29yZGluYXRlfSB6b29tZWQgY29vcmRpbmF0ZVxuICAgICAqIEBwcml2YXRlXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiB2YXIgY29vcmQgPSBuZXcgQ29vcmRpbmF0ZSgwLCAwLCAwKTtcbiAgICAgKiB2YXIgYzIgPSBjb29yZC56b29tVG8oMSk7XG4gICAgICogYzIgLy8gZXF1YWxzIG5ldyBDb29yZGluYXRlKDAsIDAsIDEpO1xuICAgICAqL1xuICAgIHpvb21Ubyh6b29tICAgICAgICApIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fem9vbVRvKHpvb20pOyB9XG5cbiAgICAvKipcbiAgICAgKiBTdWJ0cmFjdCB0aGUgY29sdW1uIGFuZCByb3cgdmFsdWVzIG9mIHRoaXMgY29vcmRpbmF0ZSBmcm9tIHRob3NlXG4gICAgICogb2YgYW5vdGhlciBjb29yZGluYXRlLiBUaGUgb3RoZXIgY29vcmRpbmF0IHdpbGwgYmUgem9vbWVkIHRvIHRoZVxuICAgICAqIHNhbWUgbGV2ZWwgYXMgYHRoaXNgIGJlZm9yZSB0aGUgc3VidHJhY3Rpb24gb2NjdXJzXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Nvb3JkaW5hdGV9IGMgb3RoZXIgY29vcmRpbmF0ZVxuICAgICAqIEByZXR1cm5zIHtDb29yZGluYXRlfSByZXN1bHRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHN1YihjICAgICAgICAgICAgKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3N1YihjKTsgfVxuXG4gICAgX3pvb21Ubyh6b29tICAgICAgICApIHtcbiAgICAgICAgY29uc3Qgc2NhbGUgPSBNYXRoLnBvdygyLCB6b29tIC0gdGhpcy56b29tKTtcbiAgICAgICAgdGhpcy5jb2x1bW4gKj0gc2NhbGU7XG4gICAgICAgIHRoaXMucm93ICo9IHNjYWxlO1xuICAgICAgICB0aGlzLnpvb20gPSB6b29tO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfc3ViKGMgICAgICAgICAgICApIHtcbiAgICAgICAgYyA9IGMuem9vbVRvKHRoaXMuem9vbSk7XG4gICAgICAgIHRoaXMuY29sdW1uIC09IGMuY29sdW1uO1xuICAgICAgICB0aGlzLnJvdyAtPSBjLnJvdztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvb3JkaW5hdGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludC1lbnYgYnJvd3NlciAqL1xubW9kdWxlLmV4cG9ydHMgPSBzZWxmO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBQb2ludCA9IHJlcXVpcmUoJ3BvaW50LWdlb21ldHJ5Jyk7XG5jb25zdCB3aW5kb3cgPSByZXF1aXJlKCcuL3dpbmRvdycpO1xuXG5leHBvcnRzLmNyZWF0ZSA9IGZ1bmN0aW9uICh0YWdOYW1lLCBjbGFzc05hbWUsIGNvbnRhaW5lcikge1xuICAgIGNvbnN0IGVsID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG4gICAgaWYgKGNsYXNzTmFtZSkgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmIChjb250YWluZXIpIGNvbnRhaW5lci5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufTtcblxuY29uc3QgZG9jU3R5bGUgPSB3aW5kb3cuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlO1xuXG5mdW5jdGlvbiB0ZXN0UHJvcChwcm9wcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKHByb3BzW2ldIGluIGRvY1N0eWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvcHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHByb3BzWzBdO1xufVxuXG5jb25zdCBzZWxlY3RQcm9wID0gdGVzdFByb3AoWyd1c2VyU2VsZWN0JywgJ01velVzZXJTZWxlY3QnLCAnV2Via2l0VXNlclNlbGVjdCcsICdtc1VzZXJTZWxlY3QnXSk7XG5sZXQgdXNlclNlbGVjdDtcbmV4cG9ydHMuZGlzYWJsZURyYWcgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHNlbGVjdFByb3ApIHtcbiAgICAgICAgdXNlclNlbGVjdCA9IGRvY1N0eWxlW3NlbGVjdFByb3BdO1xuICAgICAgICBkb2NTdHlsZVtzZWxlY3RQcm9wXSA9ICdub25lJztcbiAgICB9XG59O1xuZXhwb3J0cy5lbmFibGVEcmFnID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChzZWxlY3RQcm9wKSB7XG4gICAgICAgIGRvY1N0eWxlW3NlbGVjdFByb3BdID0gdXNlclNlbGVjdDtcbiAgICB9XG59O1xuXG5jb25zdCB0cmFuc2Zvcm1Qcm9wID0gdGVzdFByb3AoWyd0cmFuc2Zvcm0nLCAnV2Via2l0VHJhbnNmb3JtJ10pO1xuZXhwb3J0cy5zZXRUcmFuc2Zvcm0gPSBmdW5jdGlvbihlbCwgdmFsdWUpIHtcbiAgICBlbC5zdHlsZVt0cmFuc2Zvcm1Qcm9wXSA9IHZhbHVlO1xufTtcblxuLy8gU3VwcHJlc3MgdGhlIG5leHQgY2xpY2ssIGJ1dCBvbmx5IGlmIGl0J3MgaW1tZWRpYXRlLlxuZnVuY3Rpb24gc3VwcHJlc3NDbGljayhlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc3VwcHJlc3NDbGljaywgdHJ1ZSk7XG59XG5leHBvcnRzLnN1cHByZXNzQ2xpY2sgPSBmdW5jdGlvbigpIHtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzdXBwcmVzc0NsaWNrLCB0cnVlKTtcbiAgICB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHN1cHByZXNzQ2xpY2ssIHRydWUpO1xuICAgIH0sIDApO1xufTtcblxuZXhwb3J0cy5tb3VzZVBvcyA9IGZ1bmN0aW9uIChlbCwgZSkge1xuICAgIGNvbnN0IHJlY3QgPSBlbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBlID0gZS50b3VjaGVzID8gZS50b3VjaGVzWzBdIDogZTtcbiAgICByZXR1cm4gbmV3IFBvaW50KFxuICAgICAgICBlLmNsaWVudFggLSByZWN0LmxlZnQgLSBlbC5jbGllbnRMZWZ0LFxuICAgICAgICBlLmNsaWVudFkgLSByZWN0LnRvcCAtIGVsLmNsaWVudFRvcFxuICAgICk7XG59O1xuXG5leHBvcnRzLnRvdWNoUG9zID0gZnVuY3Rpb24gKGVsLCBlKSB7XG4gICAgY29uc3QgcmVjdCA9IGVsLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxuICAgICAgICBwb2ludHMgPSBbXTtcbiAgICBjb25zdCB0b3VjaGVzID0gKGUudHlwZSA9PT0gJ3RvdWNoZW5kJykgPyBlLmNoYW5nZWRUb3VjaGVzIDogZS50b3VjaGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdG91Y2hlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBwb2ludHMucHVzaChuZXcgUG9pbnQoXG4gICAgICAgICAgICB0b3VjaGVzW2ldLmNsaWVudFggLSByZWN0LmxlZnQgLSBlbC5jbGllbnRMZWZ0LFxuICAgICAgICAgICAgdG91Y2hlc1tpXS5jbGllbnRZIC0gcmVjdC50b3AgLSBlbC5jbGllbnRUb3BcbiAgICAgICAgKSk7XG4gICAgfVxuICAgIHJldHVybiBwb2ludHM7XG59O1xuXG5leHBvcnRzLnJlbW92ZSA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobm9kZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuLy8gICAgICBcblxuY29uc3QgVW5pdEJlemllciA9IHJlcXVpcmUoJ0BtYXBib3gvdW5pdGJlemllcicpO1xuY29uc3QgQ29vcmRpbmF0ZSA9IHJlcXVpcmUoJy4uL2dlby9jb29yZGluYXRlJyk7XG5jb25zdCBQb2ludCA9IHJlcXVpcmUoJ3BvaW50LWdlb21ldHJ5Jyk7XG5cbi8qKlxuICogR2l2ZW4gYSB2YWx1ZSBgdGAgdGhhdCB2YXJpZXMgYmV0d2VlbiAwIGFuZCAxLCByZXR1cm5cbiAqIGFuIGludGVycG9sYXRpb24gZnVuY3Rpb24gdGhhdCBlYXNlcyBiZXR3ZWVuIDAgYW5kIDEgaW4gYSBwbGVhc2luZ1xuICogY3ViaWMgaW4tb3V0IGZhc2hpb24uXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5lYXNlQ3ViaWNJbk91dCA9IGZ1bmN0aW9uKHQgICAgICAgICkgICAgICAgICB7XG4gICAgaWYgKHQgPD0gMCkgcmV0dXJuIDA7XG4gICAgaWYgKHQgPj0gMSkgcmV0dXJuIDE7XG4gICAgY29uc3QgdDIgPSB0ICogdCxcbiAgICAgICAgdDMgPSB0MiAqIHQ7XG4gICAgcmV0dXJuIDQgKiAodCA8IDAuNSA/IHQzIDogMyAqICh0IC0gdDIpICsgdDMgLSAwLjc1KTtcbn07XG5cbi8qKlxuICogR2l2ZW4gZ2l2ZW4gKHgsIHkpLCAoeDEsIHkxKSBjb250cm9sIHBvaW50cyBmb3IgYSBiZXppZXIgY3VydmUsXG4gKiByZXR1cm4gYSBmdW5jdGlvbiB0aGF0IGludGVycG9sYXRlcyBhbG9uZyB0aGF0IGN1cnZlLlxuICpcbiAqIEBwYXJhbSBwMXggY29udHJvbCBwb2ludCAxIHggY29vcmRpbmF0ZVxuICogQHBhcmFtIHAxeSBjb250cm9sIHBvaW50IDEgeSBjb29yZGluYXRlXG4gKiBAcGFyYW0gcDJ4IGNvbnRyb2wgcG9pbnQgMiB4IGNvb3JkaW5hdGVcbiAqIEBwYXJhbSBwMnkgY29udHJvbCBwb2ludCAyIHkgY29vcmRpbmF0ZVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5iZXppZXIgPSBmdW5jdGlvbihwMXggICAgICAgICwgcDF5ICAgICAgICAsIHAyeCAgICAgICAgLCBwMnkgICAgICAgICkgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgY29uc3QgYmV6aWVyID0gbmV3IFVuaXRCZXppZXIocDF4LCBwMXksIHAyeCwgcDJ5KTtcbiAgICByZXR1cm4gZnVuY3Rpb24odCAgICAgICAgKSB7XG4gICAgICAgIHJldHVybiBiZXppZXIuc29sdmUodCk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogQSBkZWZhdWx0IGJlemllci1jdXJ2ZSBwb3dlcmVkIGVhc2luZyBmdW5jdGlvbiB3aXRoXG4gKiBjb250cm9sIHBvaW50cyAoMC4yNSwgMC4xKSBhbmQgKDAuMjUsIDEpXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5lYXNlID0gZXhwb3J0cy5iZXppZXIoMC4yNSwgMC4xLCAwLjI1LCAxKTtcblxuLyoqXG4gKiBjb25zdHJhaW4gbiB0byB0aGUgZ2l2ZW4gcmFuZ2UgdmlhIG1pbiArIG1heFxuICpcbiAqIEBwYXJhbSBuIHZhbHVlXG4gKiBAcGFyYW0gbWluIHRoZSBtaW5pbXVtIHZhbHVlIHRvIGJlIHJldHVybmVkXG4gKiBAcGFyYW0gbWF4IHRoZSBtYXhpbXVtIHZhbHVlIHRvIGJlIHJldHVybmVkXG4gKiBAcmV0dXJucyB0aGUgY2xhbXBlZCB2YWx1ZVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5jbGFtcCA9IGZ1bmN0aW9uIChuICAgICAgICAsIG1pbiAgICAgICAgLCBtYXggICAgICAgICkgICAgICAgICB7XG4gICAgcmV0dXJuIE1hdGgubWluKG1heCwgTWF0aC5tYXgobWluLCBuKSk7XG59O1xuXG4vKipcbiAqIGNvbnN0cmFpbiBuIHRvIHRoZSBnaXZlbiByYW5nZSwgZXhjbHVkaW5nIHRoZSBtaW5pbXVtLCB2aWEgbW9kdWxhciBhcml0aG1ldGljXG4gKlxuICogQHBhcmFtIG4gdmFsdWVcbiAqIEBwYXJhbSBtaW4gdGhlIG1pbmltdW0gdmFsdWUgdG8gYmUgcmV0dXJuZWQsIGV4Y2x1c2l2ZVxuICogQHBhcmFtIG1heCB0aGUgbWF4aW11bSB2YWx1ZSB0byBiZSByZXR1cm5lZCwgaW5jbHVzaXZlXG4gKiBAcmV0dXJucyBjb25zdHJhaW5lZCBudW1iZXJcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMud3JhcCA9IGZ1bmN0aW9uIChuICAgICAgICAsIG1pbiAgICAgICAgLCBtYXggICAgICAgICkgICAgICAgICB7XG4gICAgY29uc3QgZCA9IG1heCAtIG1pbjtcbiAgICBjb25zdCB3ID0gKChuIC0gbWluKSAlIGQgKyBkKSAlIGQgKyBtaW47XG4gICAgcmV0dXJuICh3ID09PSBtaW4pID8gbWF4IDogdztcbn07XG5cbi8qXG4gKiBDYWxsIGFuIGFzeW5jaHJvbm91cyBmdW5jdGlvbiBvbiBhbiBhcnJheSBvZiBhcmd1bWVudHMsXG4gKiBjYWxsaW5nIGBjYWxsYmFja2Agd2l0aCB0aGUgY29tcGxldGVkIHJlc3VsdHMgb2YgYWxsIGNhbGxzLlxuICpcbiAqIEBwYXJhbSBhcnJheSBpbnB1dCB0byBlYWNoIGNhbGwgb2YgdGhlIGFzeW5jIGZ1bmN0aW9uLlxuICogQHBhcmFtIGZuIGFuIGFzeW5jIGZ1bmN0aW9uIHdpdGggc2lnbmF0dXJlIChkYXRhLCBjYWxsYmFjaylcbiAqIEBwYXJhbSBjYWxsYmFjayBhIGNhbGxiYWNrIHJ1biBhZnRlciBhbGwgYXN5bmMgd29yayBpcyBkb25lLlxuICogY2FsbGVkIHdpdGggYW4gYXJyYXksIGNvbnRhaW5pbmcgdGhlIHJlc3VsdHMgb2YgZWFjaCBhc3luYyBjYWxsLlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5hc3luY0FsbCA9IGZ1bmN0aW9uIChhcnJheSAgICAgICAgICAgICwgZm4gICAgICAgICAgLCBjYWxsYmFjayAgICAgICAgICApIHtcbiAgICBpZiAoIWFycmF5Lmxlbmd0aCkgeyByZXR1cm4gY2FsbGJhY2sobnVsbCwgW10pOyB9XG4gICAgbGV0IHJlbWFpbmluZyA9IGFycmF5Lmxlbmd0aDtcbiAgICBjb25zdCByZXN1bHRzID0gbmV3IEFycmF5KGFycmF5Lmxlbmd0aCk7XG4gICAgbGV0IGVycm9yID0gbnVsbDtcbiAgICBhcnJheS5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICAgIGZuKGl0ZW0sIChlcnIsIHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgaWYgKGVycikgZXJyb3IgPSBlcnI7XG4gICAgICAgICAgICByZXN1bHRzW2ldID0gcmVzdWx0O1xuICAgICAgICAgICAgaWYgKC0tcmVtYWluaW5nID09PSAwKSBjYWxsYmFjayhlcnJvciwgcmVzdWx0cyk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLypcbiAqIFBvbHlmaWxsIGZvciBPYmplY3QudmFsdWVzLiBOb3QgZnVsbHkgc3BlYyBjb21wbGlhbnQsIGJ1dCB3ZSBkb24ndFxuICogbmVlZCBpdCB0byBiZS5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLnZhbHVlcyA9IGZ1bmN0aW9uIChvYmogICAgICAgICkgICAgICAgICAgICAgICAge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGZvciAoY29uc3QgayBpbiBvYmopIHtcbiAgICAgICAgcmVzdWx0LnB1c2gob2JqW2tdKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qXG4gKiBDb21wdXRlIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGtleXMgaW4gb25lIG9iamVjdCBhbmQgdGhlIGtleXNcbiAqIGluIGFub3RoZXIgb2JqZWN0LlxuICpcbiAqIEByZXR1cm5zIGtleXMgZGlmZmVyZW5jZVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5rZXlzRGlmZmVyZW5jZSA9IGZ1bmN0aW9uIChvYmogICAgICAgICwgb3RoZXIgICAgICAgICkgICAgICAgICAgICAgICAge1xuICAgIGNvbnN0IGRpZmZlcmVuY2UgPSBbXTtcbiAgICBmb3IgKGNvbnN0IGkgaW4gb2JqKSB7XG4gICAgICAgIGlmICghKGkgaW4gb3RoZXIpKSB7XG4gICAgICAgICAgICBkaWZmZXJlbmNlLnB1c2goaSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpZmZlcmVuY2U7XG59O1xuXG4vKipcbiAqIEdpdmVuIGEgZGVzdGluYXRpb24gb2JqZWN0IGFuZCBvcHRpb25hbGx5IG1hbnkgc291cmNlIG9iamVjdHMsXG4gKiBjb3B5IGFsbCBwcm9wZXJ0aWVzIGZyb20gdGhlIHNvdXJjZSBvYmplY3RzIGludG8gdGhlIGRlc3RpbmF0aW9uLlxuICogVGhlIGxhc3Qgc291cmNlIG9iamVjdCBnaXZlbiBvdmVycmlkZXMgcHJvcGVydGllcyBmcm9tIHByZXZpb3VzXG4gKiBzb3VyY2Ugb2JqZWN0cy5cbiAqXG4gKiBAcGFyYW0gZGVzdCBkZXN0aW5hdGlvbiBvYmplY3RcbiAqIEBwYXJhbSB7Li4uT2JqZWN0fSBzb3VyY2VzIHNvdXJjZXMgZnJvbSB3aGljaCBwcm9wZXJ0aWVzIGFyZSBwdWxsZWRcbiAqIEBwcml2YXRlXG4gKi9cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bnVzZWQtdmFyc1xuZXhwb3J0cy5leHRlbmQgPSBmdW5jdGlvbiAoZGVzdCAgICAgICAgLCBzb3VyY2UwICAgICAgICAsIHNvdXJjZTEgICAgICAgICAsIHNvdXJjZTIgICAgICAgICApICAgICAgICAge1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHNyYyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yIChjb25zdCBrIGluIHNyYykge1xuICAgICAgICAgICAgZGVzdFtrXSA9IHNyY1trXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbi8qKlxuICogR2l2ZW4gYW4gb2JqZWN0IGFuZCBhIG51bWJlciBvZiBwcm9wZXJ0aWVzIGFzIHN0cmluZ3MsIHJldHVybiB2ZXJzaW9uXG4gKiBvZiB0aGF0IG9iamVjdCB3aXRoIG9ubHkgdGhvc2UgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0gc3JjIHRoZSBvYmplY3RcbiAqIEBwYXJhbSBwcm9wZXJ0aWVzIGFuIGFycmF5IG9mIHByb3BlcnR5IG5hbWVzIGNob3NlblxuICogdG8gYXBwZWFyIG9uIHRoZSByZXN1bHRpbmcgb2JqZWN0LlxuICogQHJldHVybnMgb2JqZWN0IHdpdGggbGltaXRlZCBwcm9wZXJ0aWVzLlxuICogQGV4YW1wbGVcbiAqIHZhciBmb28gPSB7IG5hbWU6ICdDaGFybGllJywgYWdlOiAxMCB9O1xuICogdmFyIGp1c3ROYW1lID0gcGljayhmb28sIFsnbmFtZSddKTtcbiAqIC8vIGp1c3ROYW1lID0geyBuYW1lOiAnQ2hhcmxpZScgfVxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5waWNrID0gZnVuY3Rpb24gKHNyYyAgICAgICAgLCBwcm9wZXJ0aWVzICAgICAgICAgICAgICAgKSAgICAgICAgIHtcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BlcnRpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgayA9IHByb3BlcnRpZXNbaV07XG4gICAgICAgIGlmIChrIGluIHNyYykge1xuICAgICAgICAgICAgcmVzdWx0W2tdID0gc3JjW2tdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuXG5sZXQgaWQgPSAxO1xuXG4vKipcbiAqIFJldHVybiBhIHVuaXF1ZSBudW1lcmljIGlkLCBzdGFydGluZyBhdCAxIGFuZCBpbmNyZW1lbnRpbmcgd2l0aFxuICogZWFjaCBjYWxsLlxuICpcbiAqIEByZXR1cm5zIHVuaXF1ZSBudW1lcmljIGlkLlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy51bmlxdWVJZCA9IGZ1bmN0aW9uICgpICAgICAgICAge1xuICAgIHJldHVybiBpZCsrO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhbiBhcnJheSBvZiBtZW1iZXIgZnVuY3Rpb24gbmFtZXMgYXMgc3RyaW5ncywgcmVwbGFjZSBhbGwgb2YgdGhlbVxuICogd2l0aCBib3VuZCB2ZXJzaW9ucyB0aGF0IHdpbGwgYWx3YXlzIHJlZmVyIHRvIGBjb250ZXh0YCBhcyBgdGhpc2AuIFRoaXNcbiAqIGlzIHVzZWZ1bCBmb3IgY2xhc3NlcyB3aGVyZSBvdGhlcndpc2UgZXZlbnQgYmluZGluZ3Mgd291bGQgcmVhc3NpZ25cbiAqIGB0aGlzYCB0byB0aGUgZXZlbnRlZCBvYmplY3Qgb3Igc29tZSBvdGhlciB2YWx1ZTogdGhpcyBsZXRzIHlvdSBlbnN1cmVcbiAqIHRoZSBgdGhpc2AgdmFsdWUgYWx3YXlzLlxuICpcbiAqIEBwYXJhbSBmbnMgbGlzdCBvZiBtZW1iZXIgZnVuY3Rpb24gbmFtZXNcbiAqIEBwYXJhbSBjb250ZXh0IHRoZSBjb250ZXh0IHZhbHVlXG4gKiBAZXhhbXBsZVxuICogZnVuY3Rpb24gTXlDbGFzcygpIHtcbiAqICAgYmluZEFsbChbJ29udGltZXInXSwgdGhpcyk7XG4gKiAgIHRoaXMubmFtZSA9ICdUb20nO1xuICogfVxuICogTXlDbGFzcy5wcm90b3R5cGUub250aW1lciA9IGZ1bmN0aW9uKCkge1xuICogICBhbGVydCh0aGlzLm5hbWUpO1xuICogfTtcbiAqIHZhciBteUNsYXNzID0gbmV3IE15Q2xhc3MoKTtcbiAqIHNldFRpbWVvdXQobXlDbGFzcy5vbnRpbWVyLCAxMDApO1xuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5iaW5kQWxsID0gZnVuY3Rpb24oZm5zICAgICAgICAgICAgICAgLCBjb250ZXh0ICAgICAgICApICAgICAgIHtcbiAgICBmbnMuZm9yRWFjaCgoZm4pID0+IHtcbiAgICAgICAgaWYgKCFjb250ZXh0W2ZuXSkgeyByZXR1cm47IH1cbiAgICAgICAgY29udGV4dFtmbl0gPSBjb250ZXh0W2ZuXS5iaW5kKGNvbnRleHQpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgY29vcmRpbmF0ZXMsIGdldCB0aGVpciBjZW50ZXIgYXMgYSBjb29yZGluYXRlLlxuICpcbiAqIEByZXR1cm5zIGNlbnRlcnBvaW50XG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmdldENvb3JkaW5hdGVzQ2VudGVyID0gZnVuY3Rpb24oY29vcmRzICAgICAgICAgICAgICAgICAgICkgICAgICAgICAgICAge1xuICAgIGxldCBtaW5YID0gSW5maW5pdHk7XG4gICAgbGV0IG1pblkgPSBJbmZpbml0eTtcbiAgICBsZXQgbWF4WCA9IC1JbmZpbml0eTtcbiAgICBsZXQgbWF4WSA9IC1JbmZpbml0eTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29vcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1pblggPSBNYXRoLm1pbihtaW5YLCBjb29yZHNbaV0uY29sdW1uKTtcbiAgICAgICAgbWluWSA9IE1hdGgubWluKG1pblksIGNvb3Jkc1tpXS5yb3cpO1xuICAgICAgICBtYXhYID0gTWF0aC5tYXgobWF4WCwgY29vcmRzW2ldLmNvbHVtbik7XG4gICAgICAgIG1heFkgPSBNYXRoLm1heChtYXhZLCBjb29yZHNbaV0ucm93KTtcbiAgICB9XG5cbiAgICBjb25zdCBkeCA9IG1heFggLSBtaW5YO1xuICAgIGNvbnN0IGR5ID0gbWF4WSAtIG1pblk7XG4gICAgY29uc3QgZE1heCA9IE1hdGgubWF4KGR4LCBkeSk7XG4gICAgY29uc3Qgem9vbSA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoLU1hdGgubG9nKGRNYXgpIC8gTWF0aC5MTjIpKTtcbiAgICByZXR1cm4gbmV3IENvb3JkaW5hdGUoKG1pblggKyBtYXhYKSAvIDIsIChtaW5ZICsgbWF4WSkgLyAyLCAwKVxuICAgICAgICAuem9vbVRvKHpvb20pO1xufTtcblxuLyoqXG4gKiBEZXRlcm1pbmUgaWYgYSBzdHJpbmcgZW5kcyB3aXRoIGEgcGFydGljdWxhciBzdWJzdHJpbmdcbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmVuZHNXaXRoID0gZnVuY3Rpb24oc3RyaW5nICAgICAgICAsIHN1ZmZpeCAgICAgICAgKSAgICAgICAgICB7XG4gICAgcmV0dXJuIHN0cmluZy5pbmRleE9mKHN1ZmZpeCwgc3RyaW5nLmxlbmd0aCAtIHN1ZmZpeC5sZW5ndGgpICE9PSAtMTtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGFuIG9iamVjdCBieSBtYXBwaW5nIGFsbCB0aGUgdmFsdWVzIG9mIGFuIGV4aXN0aW5nIG9iamVjdCB3aGlsZVxuICogcHJlc2VydmluZyB0aGVpciBrZXlzLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMubWFwT2JqZWN0ID0gZnVuY3Rpb24oaW5wdXQgICAgICAgICwgaXRlcmF0b3IgICAgICAgICAgLCBjb250ZXh0ICAgICAgICAgKSAgICAgICAgIHtcbiAgICBjb25zdCBvdXRwdXQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBpbnB1dCkge1xuICAgICAgICBvdXRwdXRba2V5XSA9IGl0ZXJhdG9yLmNhbGwoY29udGV4dCB8fCB0aGlzLCBpbnB1dFtrZXldLCBrZXksIGlucHV0KTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbn07XG5cbi8qKlxuICogQ3JlYXRlIGFuIG9iamVjdCBieSBmaWx0ZXJpbmcgb3V0IHZhbHVlcyBvZiBhbiBleGlzdGluZyBvYmplY3QuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5maWx0ZXJPYmplY3QgPSBmdW5jdGlvbihpbnB1dCAgICAgICAgLCBpdGVyYXRvciAgICAgICAgICAsIGNvbnRleHQgICAgICAgICApICAgICAgICAge1xuICAgIGNvbnN0IG91dHB1dCA9IHt9O1xuICAgIGZvciAoY29uc3Qga2V5IGluIGlucHV0KSB7XG4gICAgICAgIGlmIChpdGVyYXRvci5jYWxsKGNvbnRleHQgfHwgdGhpcywgaW5wdXRba2V5XSwga2V5LCBpbnB1dCkpIHtcbiAgICAgICAgICAgIG91dHB1dFtrZXldID0gaW5wdXRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBEZWVwbHkgY29tcGFyZXMgdHdvIG9iamVjdCBsaXRlcmFscy5cbiAqXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnRzLmRlZXBFcXVhbCA9IGZ1bmN0aW9uKGEgICAgICAgICwgYiAgICAgICAgKSAgICAgICAgICB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoYSkpIHtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KGIpIHx8IGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghZXhwb3J0cy5kZWVwRXF1YWwoYVtpXSwgYltpXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBhID09PSAnb2JqZWN0JyAmJiBhICE9PSBudWxsICYmIGIgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKCEodHlwZW9mIGIgPT09ICdvYmplY3QnKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMoYSk7XG4gICAgICAgIGlmIChrZXlzLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYikubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGEpIHtcbiAgICAgICAgICAgIGlmICghZXhwb3J0cy5kZWVwRXF1YWwoYVtrZXldLCBiW2tleV0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBhID09PSBiO1xufTtcblxuLyoqXG4gKiBEZWVwbHkgY2xvbmVzIHR3byBvYmplY3RzLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydHMuY2xvbmUgPSBmdW5jdGlvbiAgIChpbnB1dCAgICkgICAge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGlucHV0KSkge1xuICAgICAgICByZXR1cm4gaW5wdXQubWFwKGV4cG9ydHMuY2xvbmUpO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGlucHV0ID09PSAnb2JqZWN0JyAmJiBpbnB1dCkge1xuICAgICAgICByZXR1cm4gKChleHBvcnRzLm1hcE9iamVjdChpbnB1dCwgZXhwb3J0cy5jbG9uZSkgICAgICkgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9XG59O1xuXG4vKipcbiAqIENoZWNrIGlmIHR3byBhcnJheXMgaGF2ZSBhdCBsZWFzdCBvbmUgY29tbW9uIGVsZW1lbnQuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0cy5hcnJheXNJbnRlcnNlY3QgPSBmdW5jdGlvbihhICAgICAgICAgICAgLCBiICAgICAgICAgICAgKSAgICAgICAgICB7XG4gICAgZm9yIChsZXQgbCA9IDA7IGwgPCBhLmxlbmd0aDsgbCsrKSB7XG4gICAgICAgIGlmIChiLmluZGV4T2YoYVtsXSkgPj0gMCkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogUHJpbnQgYSB3YXJuaW5nIG1lc3NhZ2UgdG8gdGhlIGNvbnNvbGUgYW5kIGVuc3VyZSBkdXBsaWNhdGUgd2FybmluZyBtZXNzYWdlc1xuICogYXJlIG5vdCBwcmludGVkLlxuICpcbiAqIEBwcml2YXRlXG4gKi9cbmNvbnN0IHdhcm5PbmNlSGlzdG9yeSA9IHt9O1xuZXhwb3J0cy53YXJuT25jZSA9IGZ1bmN0aW9uKG1lc3NhZ2UgICAgICAgICkgICAgICAge1xuICAgIGlmICghd2Fybk9uY2VIaXN0b3J5W21lc3NhZ2VdKSB7XG4gICAgICAgIC8vIGNvbnNvbGUgaXNuJ3QgZGVmaW5lZCBpbiBzb21lIFdlYldvcmtlcnMsIHNlZSAjMjU1OFxuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIpIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICAgICAgd2Fybk9uY2VIaXN0b3J5W21lc3NhZ2VdID0gdHJ1ZTtcbiAgICB9XG59O1xuXG4vKipcbiAqIEluZGljYXRlcyBpZiB0aGUgcHJvdmlkZWQgUG9pbnRzIGFyZSBpbiBhIGNvdW50ZXIgY2xvY2t3aXNlICh0cnVlKSBvciBjbG9ja3dpc2UgKGZhbHNlKSBvcmRlclxuICpcbiAqIEByZXR1cm5zIHRydWUgZm9yIGEgY291bnRlciBjbG9ja3dpc2Ugc2V0IG9mIHBvaW50c1xuICovXG4vLyBodHRwOi8vYnJ5Y2Vib2UuY29tLzIwMDYvMTAvMjMvbGluZS1zZWdtZW50LWludGVyc2VjdGlvbi1hbGdvcml0aG0vXG5leHBvcnRzLmlzQ291bnRlckNsb2Nrd2lzZSA9IGZ1bmN0aW9uKGEgICAgICAgLCBiICAgICAgICwgYyAgICAgICApICAgICAgICAgIHtcbiAgICByZXR1cm4gKGMueSAtIGEueSkgKiAoYi54IC0gYS54KSA+IChiLnkgLSBhLnkpICogKGMueCAtIGEueCk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHNpZ25lZCBhcmVhIGZvciB0aGUgcG9seWdvbiByaW5nLiAgUG9zdGl2ZSBhcmVhcyBhcmUgZXh0ZXJpb3IgcmluZ3MgYW5kXG4gKiBoYXZlIGEgY2xvY2t3aXNlIHdpbmRpbmcuICBOZWdhdGl2ZSBhcmVhcyBhcmUgaW50ZXJpb3IgcmluZ3MgYW5kIGhhdmUgYSBjb3VudGVyIGNsb2Nrd2lzZVxuICogb3JkZXJpbmcuXG4gKlxuICogQHBhcmFtIHJpbmcgRXh0ZXJpb3Igb3IgaW50ZXJpb3IgcmluZ1xuICovXG5leHBvcnRzLmNhbGN1bGF0ZVNpZ25lZEFyZWEgPSBmdW5jdGlvbihyaW5nICAgICAgICAgICAgICApICAgICAgICAge1xuICAgIGxldCBzdW0gPSAwO1xuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSByaW5nLmxlbmd0aCwgaiA9IGxlbiAtIDEsIHAxLCBwMjsgaSA8IGxlbjsgaiA9IGkrKykge1xuICAgICAgICBwMSA9IHJpbmdbaV07XG4gICAgICAgIHAyID0gcmluZ1tqXTtcbiAgICAgICAgc3VtICs9IChwMi54IC0gcDEueCkgKiAocDEueSArIHAyLnkpO1xuICAgIH1cbiAgICByZXR1cm4gc3VtO1xufTtcblxuLyoqXG4gKiBEZXRlY3RzIGNsb3NlZCBwb2x5Z29ucywgZmlyc3QgKyBsYXN0IHBvaW50IGFyZSBlcXVhbFxuICpcbiAqIEBwYXJhbSBwb2ludHMgYXJyYXkgb2YgcG9pbnRzXG4gKiBAcmV0dXJuIHRydWUgaWYgdGhlIHBvaW50cyBhcmUgYSBjbG9zZWQgcG9seWdvblxuICovXG5leHBvcnRzLmlzQ2xvc2VkUG9seWdvbiA9IGZ1bmN0aW9uKHBvaW50cyAgICAgICAgICAgICAgKSAgICAgICAgICB7XG4gICAgLy8gSWYgaXQgaXMgMiBwb2ludHMgdGhhdCBhcmUgdGhlIHNhbWUgdGhlbiBpdCBpcyBhIHBvaW50XG4gICAgLy8gSWYgaXQgaXMgMyBwb2ludHMgd2l0aCBzdGFydCBhbmQgZW5kIHRoZSBzYW1lIHRoZW4gaXQgaXMgYSBsaW5lXG4gICAgaWYgKHBvaW50cy5sZW5ndGggPCA0KVxuICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICBjb25zdCBwMSA9IHBvaW50c1swXTtcbiAgICBjb25zdCBwMiA9IHBvaW50c1twb2ludHMubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAoTWF0aC5hYnMocDEueCAtIHAyLngpID4gMCB8fFxuICAgICAgICBNYXRoLmFicyhwMS55IC0gcDIueSkgPiAwKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBwb2x5Z29uIHNpbXBsaWZpY2F0aW9uIGNhbiBwcm9kdWNlIHBvbHlnb25zIHdpdGggemVybyBhcmVhIGFuZCBtb3JlIHRoYW4gMyBwb2ludHNcbiAgICByZXR1cm4gKE1hdGguYWJzKGV4cG9ydHMuY2FsY3VsYXRlU2lnbmVkQXJlYShwb2ludHMpKSA+IDAuMDEpO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyBzcGhlcmljYWwgY29vcmRpbmF0ZXMgdG8gY2FydGVzaWFuIGNvb3JkaW5hdGVzLlxuICpcbiAqIEBwYXJhbSBzcGhlcmljYWwgU3BoZXJpY2FsIGNvb3JkaW5hdGVzLCBpbiBbcmFkaWFsLCBhemltdXRoYWwsIHBvbGFyXVxuICogQHJldHVybiBjYXJ0ZXNpYW4gY29vcmRpbmF0ZXMgaW4gW3gsIHksIHpdXG4gKi9cblxuZXhwb3J0cy5zcGhlcmljYWxUb0NhcnRlc2lhbiA9IGZ1bmN0aW9uKHNwaGVyaWNhbCAgICAgICAgICAgICAgICkgICAgICAgICAgICAgICAge1xuICAgIGNvbnN0IHIgPSBzcGhlcmljYWxbMF07XG4gICAgbGV0IGF6aW11dGhhbCA9IHNwaGVyaWNhbFsxXSxcbiAgICAgICAgcG9sYXIgPSBzcGhlcmljYWxbMl07XG4gICAgLy8gV2UgYWJzdHJhY3QgXCJub3J0aFwiL1widXBcIiAoY29tcGFzcy13aXNlKSB0byBiZSAwwrAgd2hlbiByZWFsbHkgdGhpcyBpcyA5MMKwICjPgC8yKTpcbiAgICAvLyBjb3JyZWN0IGZvciB0aGF0IGhlcmVcbiAgICBhemltdXRoYWwgKz0gOTA7XG5cbiAgICAvLyBDb252ZXJ0IGF6aW11dGhhbCBhbmQgcG9sYXIgYW5nbGVzIHRvIHJhZGlhbnNcbiAgICBhemltdXRoYWwgKj0gTWF0aC5QSSAvIDE4MDtcbiAgICBwb2xhciAqPSBNYXRoLlBJIC8gMTgwO1xuXG4gICAgLy8gc3BoZXJpY2FsIHRvIGNhcnRlc2lhbiAoeCwgeSwgeilcbiAgICByZXR1cm4gW1xuICAgICAgICByICogTWF0aC5jb3MoYXppbXV0aGFsKSAqIE1hdGguc2luKHBvbGFyKSxcbiAgICAgICAgciAqIE1hdGguc2luKGF6aW11dGhhbCkgKiBNYXRoLnNpbihwb2xhciksXG4gICAgICAgIHIgKiBNYXRoLmNvcyhwb2xhcilcbiAgICBdO1xufTtcblxuLyoqXG4gKiBQYXJzZXMgZGF0YSBmcm9tICdDYWNoZS1Db250cm9sJyBoZWFkZXJzLlxuICpcbiAqIEBwYXJhbSBjYWNoZUNvbnRyb2wgVmFsdWUgb2YgJ0NhY2hlLUNvbnRyb2wnIGhlYWRlclxuICogQHJldHVybiBvYmplY3QgY29udGFpbmluZyBwYXJzZWQgaGVhZGVyIGluZm8uXG4gKi9cblxuZXhwb3J0cy5wYXJzZUNhY2hlQ29udHJvbCA9IGZ1bmN0aW9uKGNhY2hlQ29udHJvbCAgICAgICAgKSAgICAgICAgIHtcbiAgICAvLyBUYWtlbiBmcm9tIFtXcmVja10oaHR0cHM6Ly9naXRodWIuY29tL2hhcGlqcy93cmVjaylcbiAgICBjb25zdCByZSA9IC8oPzpefCg/OlxccypcXCxcXHMqKSkoW15cXHgwMC1cXHgyMFxcKFxcKTw+QFxcLDtcXDpcXFxcXCJcXC9cXFtcXF1cXD9cXD1cXHtcXH1cXHg3Rl0rKSg/OlxcPSg/OihbXlxceDAwLVxceDIwXFwoXFwpPD5AXFwsO1xcOlxcXFxcIlxcL1xcW1xcXVxcP1xcPVxce1xcfVxceDdGXSspfCg/OlxcXCIoKD86W15cIlxcXFxdfFxcXFwuKSopXFxcIikpKT8vZztcblxuICAgIGNvbnN0IGhlYWRlciA9IHt9O1xuICAgIGNhY2hlQ29udHJvbC5yZXBsYWNlKHJlLCAoJDAsICQxLCAkMiwgJDMpID0+IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSAkMiB8fCAkMztcbiAgICAgICAgaGVhZGVyWyQxXSA9IHZhbHVlID8gdmFsdWUudG9Mb3dlckNhc2UoKSA6IHRydWU7XG4gICAgICAgIHJldHVybiAnJztcbiAgICB9KTtcblxuICAgIGlmIChoZWFkZXJbJ21heC1hZ2UnXSkge1xuICAgICAgICBjb25zdCBtYXhBZ2UgPSBwYXJzZUludChoZWFkZXJbJ21heC1hZ2UnXSwgMTApO1xuICAgICAgICBpZiAoaXNOYU4obWF4QWdlKSkgZGVsZXRlIGhlYWRlclsnbWF4LWFnZSddO1xuICAgICAgICBlbHNlIGhlYWRlclsnbWF4LWFnZSddID0gbWF4QWdlO1xuICAgIH1cblxuICAgIHJldHVybiBoZWFkZXI7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFBvaW50O1xuXG5mdW5jdGlvbiBQb2ludCh4LCB5KSB7XG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLnkgPSB5O1xufVxuXG5Qb2ludC5wcm90b3R5cGUgPSB7XG4gICAgY2xvbmU6IGZ1bmN0aW9uKCkgeyByZXR1cm4gbmV3IFBvaW50KHRoaXMueCwgdGhpcy55KTsgfSxcblxuICAgIGFkZDogICAgIGZ1bmN0aW9uKHApIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fYWRkKHApOyAgICAgfSxcbiAgICBzdWI6ICAgICBmdW5jdGlvbihwKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3N1YihwKTsgICAgIH0sXG4gICAgbXVsdDogICAgZnVuY3Rpb24oaykgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9tdWx0KGspOyAgICB9LFxuICAgIGRpdjogICAgIGZ1bmN0aW9uKGspIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fZGl2KGspOyAgICAgfSxcbiAgICByb3RhdGU6ICBmdW5jdGlvbihhKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3JvdGF0ZShhKTsgIH0sXG4gICAgbWF0TXVsdDogZnVuY3Rpb24obSkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl9tYXRNdWx0KG0pOyB9LFxuICAgIHVuaXQ6ICAgIGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpcy5jbG9uZSgpLl91bml0KCk7IH0sXG4gICAgcGVycDogICAgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzLmNsb25lKCkuX3BlcnAoKTsgfSxcbiAgICByb3VuZDogICBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMuY2xvbmUoKS5fcm91bmQoKTsgfSxcblxuICAgIG1hZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBNYXRoLnNxcnQodGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55KTtcbiAgICB9LFxuXG4gICAgZXF1YWxzOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnggPT09IHAueCAmJlxuICAgICAgICAgICAgICAgdGhpcy55ID09PSBwLnk7XG4gICAgfSxcblxuICAgIGRpc3Q6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLmRpc3RTcXIocCkpO1xuICAgIH0sXG5cbiAgICBkaXN0U3FyOiBmdW5jdGlvbihwKSB7XG4gICAgICAgIHZhciBkeCA9IHAueCAtIHRoaXMueCxcbiAgICAgICAgICAgIGR5ID0gcC55IC0gdGhpcy55O1xuICAgICAgICByZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG4gICAgfSxcblxuICAgIGFuZ2xlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIodGhpcy55LCB0aGlzLngpO1xuICAgIH0sXG5cbiAgICBhbmdsZVRvOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiBNYXRoLmF0YW4yKHRoaXMueSAtIGIueSwgdGhpcy54IC0gYi54KTtcbiAgICB9LFxuXG4gICAgYW5nbGVXaXRoOiBmdW5jdGlvbihiKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFuZ2xlV2l0aFNlcChiLngsIGIueSk7XG4gICAgfSxcblxuICAgIC8vIEZpbmQgdGhlIGFuZ2xlIG9mIHRoZSB0d28gdmVjdG9ycywgc29sdmluZyB0aGUgZm9ybXVsYSBmb3IgdGhlIGNyb3NzIHByb2R1Y3QgYSB4IGIgPSB8YXx8YnxzaW4ozrgpIGZvciDOuC5cbiAgICBhbmdsZVdpdGhTZXA6IGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguYXRhbjIoXG4gICAgICAgICAgICB0aGlzLnggKiB5IC0gdGhpcy55ICogeCxcbiAgICAgICAgICAgIHRoaXMueCAqIHggKyB0aGlzLnkgKiB5KTtcbiAgICB9LFxuXG4gICAgX21hdE11bHQ6IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgdmFyIHggPSBtWzBdICogdGhpcy54ICsgbVsxXSAqIHRoaXMueSxcbiAgICAgICAgICAgIHkgPSBtWzJdICogdGhpcy54ICsgbVszXSAqIHRoaXMueTtcbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9hZGQ6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdGhpcy54ICs9IHAueDtcbiAgICAgICAgdGhpcy55ICs9IHAueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9zdWI6IGZ1bmN0aW9uKHApIHtcbiAgICAgICAgdGhpcy54IC09IHAueDtcbiAgICAgICAgdGhpcy55IC09IHAueTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9tdWx0OiBmdW5jdGlvbihrKSB7XG4gICAgICAgIHRoaXMueCAqPSBrO1xuICAgICAgICB0aGlzLnkgKj0gaztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIF9kaXY6IGZ1bmN0aW9uKGspIHtcbiAgICAgICAgdGhpcy54IC89IGs7XG4gICAgICAgIHRoaXMueSAvPSBrO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3VuaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLl9kaXYodGhpcy5tYWcoKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBfcGVycDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB5ID0gdGhpcy55O1xuICAgICAgICB0aGlzLnkgPSB0aGlzLng7XG4gICAgICAgIHRoaXMueCA9IC15O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3JvdGF0ZTogZnVuY3Rpb24oYW5nbGUpIHtcbiAgICAgICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguc2luKGFuZ2xlKSxcbiAgICAgICAgICAgIHggPSBjb3MgKiB0aGlzLnggLSBzaW4gKiB0aGlzLnksXG4gICAgICAgICAgICB5ID0gc2luICogdGhpcy54ICsgY29zICogdGhpcy55O1xuICAgICAgICB0aGlzLnggPSB4O1xuICAgICAgICB0aGlzLnkgPSB5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgX3JvdW5kOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy54ID0gTWF0aC5yb3VuZCh0aGlzLngpO1xuICAgICAgICB0aGlzLnkgPSBNYXRoLnJvdW5kKHRoaXMueSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cbi8vIGNvbnN0cnVjdHMgUG9pbnQgZnJvbSBhbiBhcnJheSBpZiBuZWNlc3NhcnlcblBvaW50LmNvbnZlcnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIGlmIChhIGluc3RhbmNlb2YgUG9pbnQpIHtcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfVxuICAgIGlmIChBcnJheS5pc0FycmF5KGEpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9pbnQoYVswXSwgYVsxXSk7XG4gICAgfVxuICAgIHJldHVybiBhO1xufTtcbiIsIi8vYWRhcHRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9tYXBib3gvbWFwYm94LWdsLWpzL2Jsb2IvMDYxZmRiNTE0YTMzY2Y5YjJiNTQyYTFjN2JkNDMzYzE2NmRhOTE3ZS9zcmMvdWkvY29udHJvbC9zY2FsZV9jb250cm9sLmpzI0wxOS1MNTJcblxuJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBET00gPSByZXF1aXJlKCdtYXBib3gtZ2wvc3JjL3V0aWwvZG9tJyk7XG5jb25zdCB1dGlsID0gcmVxdWlyZSgnbWFwYm94LWdsL3NyYy91dGlsL3V0aWwnKTtcblxuLyoqXG4gKiBBIGBTY2FsZUNvbnRyb2xgIGNvbnRyb2wgZGlzcGxheXMgdGhlIHJhdGlvIG9mIGEgZGlzdGFuY2Ugb24gdGhlIG1hcCB0byB0aGUgY29ycmVzcG9uZGluZyBkaXN0YW5jZSBvbiB0aGUgZ3JvdW5kLlxuICpcbiAqIEBpbXBsZW1lbnRzIHtJQ29udHJvbH1cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7bnVtYmVyfSBbb3B0aW9ucy5tYXhXaWR0aD0nMTUwJ10gVGhlIG1heGltdW0gbGVuZ3RoIG9mIHRoZSBzY2FsZSBjb250cm9sIGluIHBpeGVscy5cbiAqIEBleGFtcGxlXG4gKiBtYXAuYWRkQ29udHJvbChuZXcgU2NhbGVDb250cm9sKHtcbiAqICAgICBtYXhXaWR0aDogODBcbiAqIH0pKTtcbiAqL1xuIGNsYXNzIER1YWxTY2FsZUNvbnRyb2wge1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgICAgIHV0aWwuYmluZEFsbChbXG4gICAgICAgICAgICAnX29uTW92ZScsICdfb25Nb3VzZU1vdmUnXG4gICAgICAgIF0sIHRoaXMpO1xuICAgIH1cblxuICAgIGdldERlZmF1bHRQb3NpdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdib3R0b20tbGVmdCc7XG4gICAgfVxuXG4gICAgX29uTW92ZSgpIHtcbiAgICAgICAgdXBkYXRlU2NhbGUodGhpcy5fbWFwLCB0aGlzLl9tZXRyaWNDb250YWluZXIsIHRoaXMuX2ltcGVyaWFsQ29udGFpbmVyLCB0aGlzLm9wdGlvbnMpO1xuICAgIH1cblxuICAgIF9vbk1vdXNlTW92ZShlKSB7XG4gICAgICAgIHVwZGF0ZVBvc2l0aW9uKHRoaXMuX21hcCwgdGhpcy5fcG9zaXRpb25Db250YWluZXIsIGUubG5nTGF0KTtcbiAgICB9XG5cbiAgICBvbkFkZChtYXApIHtcbiAgICAgICAgdGhpcy5fbWFwID0gbWFwO1xuICAgICAgICB0aGlzLl9jb250YWluZXIgPSBET00uY3JlYXRlKCdkaXYnLCAnbWFwYm94Z2wtY3RybCBtYXBib3hnbC1jdHJsLXNjYWxlIG1hcGh1YnMtY3RybC1zY2FsZScsIG1hcC5nZXRDb250YWluZXIoKSk7XG4gICAgICAgIHRoaXMuX3Bvc2l0aW9uQ29udGFpbmVyID0gRE9NLmNyZWF0ZSgnZGl2JywgJ21hcC1wb3NpdGlvbicsIHRoaXMuX2NvbnRhaW5lcik7XG4gICAgICAgIHRoaXMuX21ldHJpY0NvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdtZXRyaWMtc2NhbGUnLCB0aGlzLl9jb250YWluZXIpO1xuICAgICAgICB0aGlzLl9pbXBlcmlhbENvbnRhaW5lciA9IERPTS5jcmVhdGUoJ2RpdicsICdpbXBlcmlhbC1zY2FsZScsIHRoaXMuX2NvbnRhaW5lcik7XG5cbiAgICAgICAgdGhpcy5fbWFwLm9uKCdtb3ZlJywgdGhpcy5fb25Nb3ZlKTtcbiAgICAgICAgdGhpcy5fb25Nb3ZlKCk7XG5cbiAgICAgICAgdGhpcy5fbWFwLm9uKCdtb3VzZW1vdmUnLCB0aGlzLl9vbk1vdXNlTW92ZSk7XG4gICAgICAgIC8vdGhpcy5fb25Nb3VzZU1vdmUodGhpcy5fbWFwLmdldENlbnRlcigpKTsgLy9zdGFydCBhdCBjZW50ZXJcblxuICAgICAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyO1xuICAgIH1cblxuICAgIG9uUmVtb3ZlKCkge1xuICAgICAgICB0aGlzLl9jb250YWluZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLl9jb250YWluZXIpO1xuICAgICAgICB0aGlzLl9tYXAub2ZmKCdtb3ZlJywgdGhpcy5fb25Nb3ZlKTtcbiAgICAgICAgdGhpcy5fbWFwLm9mZignbW91c2Vtb3ZlJywgdGhpcy5fb25Nb3VzZU1vdmUpO1xuICAgICAgICB0aGlzLl9tYXAgPSB1bmRlZmluZWQ7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IER1YWxTY2FsZUNvbnRyb2w7XG5cblxuZnVuY3Rpb24gdXBkYXRlUG9zaXRpb24obWFwLCBjb250YWluZXIsIGxuZ0xhdCkge1xuICBjb25zdCBsYXQgPSBsbmdMYXQubGF0LnRvUHJlY2lzaW9uKDQpO1xuICBjb25zdCBsbmcgPSBsbmdMYXQubG5nLnRvUHJlY2lzaW9uKDQpO1xuICBjb250YWluZXIuaW5uZXJIVE1MID0gYCR7bGF0fSwgJHtsbmd9YDtcbn1cblxuZnVuY3Rpb24gdXBkYXRlU2NhbGUobWFwLCBtZXRyaWNDb250YWluZXIsIGltcGVyaWFsQ29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgLy8gQSBob3Jpem9udGFsIHNjYWxlIGlzIGltYWdpbmVkIHRvIGJlIHByZXNlbnQgYXQgY2VudGVyIG9mIHRoZSBtYXBcbiAgICAvLyBjb250YWluZXIgd2l0aCBtYXhpbXVtIGxlbmd0aCAoRGVmYXVsdCkgYXMgMTAwcHguXG4gICAgLy8gVXNpbmcgc3BoZXJpY2FsIGxhdyBvZiBjb3NpbmVzIGFwcHJveGltYXRpb24sIHRoZSByZWFsIGRpc3RhbmNlIGlzXG4gICAgLy8gZm91bmQgYmV0d2VlbiB0aGUgdHdvIGNvb3JkaW5hdGVzLlxuICAgIGNvbnN0IG1heFdpZHRoID0gb3B0aW9ucyAmJiBvcHRpb25zLm1heFdpZHRoIHx8IDEwMDtcblxuICAgIGNvbnN0IHkgPSBtYXAuX2NvbnRhaW5lci5jbGllbnRIZWlnaHQgLyAyO1xuICAgIGNvbnN0IG1heE1ldGVycyA9IGdldERpc3RhbmNlKG1hcC51bnByb2plY3QoWzAsIHldKSwgbWFwLnVucHJvamVjdChbbWF4V2lkdGgsIHldKSk7XG4gICAgLy8gVGhlIHJlYWwgZGlzdGFuY2UgY29ycmVzcG9uZGluZyB0byAxMDBweCBzY2FsZSBsZW5ndGggaXMgcm91bmRlZCBvZmYgdG9cbiAgICAvLyBuZWFyIHByZXR0eSBudW1iZXIgYW5kIHRoZSBzY2FsZSBsZW5ndGggZm9yIHRoZSBzYW1lIGlzIGZvdW5kIG91dC5cbiAgICAvLyBEZWZhdWx0IHVuaXQgb2YgdGhlIHNjYWxlIGlzIGJhc2VkIG9uIFVzZXIncyBsb2NhbGUuXG4gICAgIGNvbnN0IG1heEZlZXQgPSAzLjI4MDggKiBtYXhNZXRlcnM7XG4gICAgaWYgKG1heEZlZXQgPiA1MjgwKSB7XG4gICAgICBjb25zdCBtYXhNaWxlcyA9IG1heEZlZXQgLyA1MjgwO1xuICAgICAgc2V0U2NhbGUoaW1wZXJpYWxDb250YWluZXIsIG1heFdpZHRoLCBtYXhNaWxlcywgJ21pJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFNjYWxlKGltcGVyaWFsQ29udGFpbmVyLCBtYXhXaWR0aCwgbWF4RmVldCwgJ2Z0Jyk7XG4gICAgfVxuICAgIHNldFNjYWxlKG1ldHJpY0NvbnRhaW5lciwgbWF4V2lkdGgsIG1heE1ldGVycywgJ20nKTtcblxufVxuXG5mdW5jdGlvbiBzZXRTY2FsZShjb250YWluZXIsIG1heFdpZHRoLCBtYXhEaXN0YW5jZSwgdW5pdCkge1xuICAgIGxldCBkaXN0YW5jZSA9IGdldFJvdW5kTnVtKG1heERpc3RhbmNlKTtcbiAgICBjb25zdCByYXRpbyA9IGRpc3RhbmNlIC8gbWF4RGlzdGFuY2U7XG5cbiAgICBpZiAodW5pdCA9PT0gJ20nICYmIGRpc3RhbmNlID49IDEwMDApIHtcbiAgICAgICAgZGlzdGFuY2UgPSBkaXN0YW5jZSAvIDEwMDA7XG4gICAgICAgIHVuaXQgPSAna20nO1xuICAgIH1cblxuICAgIGNvbnRhaW5lci5zdHlsZS53aWR0aCA9IGAke21heFdpZHRoICogcmF0aW99cHhgO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSBkaXN0YW5jZSArIHVuaXQ7XG59XG5cbmZ1bmN0aW9uIGdldERpc3RhbmNlKGxhdGxuZzEsIGxhdGxuZzIpIHtcbiAgICAvLyBVc2VzIHNwaGVyaWNhbCBsYXcgb2YgY29zaW5lcyBhcHByb3hpbWF0aW9uLlxuICAgIGNvbnN0IFIgPSA2MzcxMDAwO1xuXG4gICAgY29uc3QgcmFkID0gTWF0aC5QSSAvIDE4MCxcbiAgICAgICAgbGF0MSA9IGxhdGxuZzEubGF0ICogcmFkLFxuICAgICAgICBsYXQyID0gbGF0bG5nMi5sYXQgKiByYWQsXG4gICAgICAgIGEgPSBNYXRoLnNpbihsYXQxKSAqIE1hdGguc2luKGxhdDIpICtcbiAgICAgICAgICBNYXRoLmNvcyhsYXQxKSAqIE1hdGguY29zKGxhdDIpICogTWF0aC5jb3MoKGxhdGxuZzIubG5nIC0gbGF0bG5nMS5sbmcpICogcmFkKTtcblxuICAgIGNvbnN0IG1heE1ldGVycyA9IFIgKiBNYXRoLmFjb3MoTWF0aC5taW4oYSwgMSkpO1xuICAgIHJldHVybiBtYXhNZXRlcnM7XG5cbn1cblxuZnVuY3Rpb24gZ2V0Um91bmROdW0obnVtKSB7XG4gICAgY29uc3QgcG93MTAgPSBNYXRoLnBvdygxMCwgKGAke01hdGguZmxvb3IobnVtKX1gKS5sZW5ndGggLSAxKTtcbiAgICBsZXQgZCA9IG51bSAvIHBvdzEwO1xuXG4gICAgZCA9IGQgPj0gMTAgPyAxMCA6XG4gICAgICAgIGQgPj0gNSA/IDUgOlxuICAgICAgICBkID49IDMgPyAzIDpcbiAgICAgICAgZCA+PSAyID8gMiA6IDE7XG5cbiAgICByZXR1cm4gcG93MTAgKiBkO1xufSJdfQ==
