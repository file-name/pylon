/*
 * See the NOTICE file distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation; either version 2.1 of
 * the License, or (at your option) any later version.
 *
 * This software is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public
 * License along with this software; if not, write to the Free
 * Software Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA
 * 02110-1301 USA, or see the FSF site: http://www.fsf.org.
 *
 */

// #ifdef __AMLMAP || __INC_ALL

/**
 * Element displaying a Google Map with all option customizable through attributes
 *
 * @constructor
 * @define map
 * @addnode elements
 *
 * @author      Mike de Boer (mike AT ajax DOT org)
 * @version     %I%, %G%
 * @since       3.0
 *
 * @inherits apf.StandardBinding
 * @inherits apf.DataAction
 * @inherits apf.XForms
 */
apf.map = function(struct, tagName){
    this.$init(tagName || "map", apf.NODE_VISIBLE, struct);
};

(function(){
    this.implement(
        // #ifdef __WITH_DATABINDING
        apf.StandardBinding
        // #endif
        //#ifdef __WITH_DATAACTION
        ,apf.DataAction
        //#endif
        //#ifdef __WITH_XFORMS
       // ,apf.XForms
        //#endif
    );
    //Options
    this.$focussable           = true; // This object can get the focus
    this.$hasMaptypeControl    = true;
    this.$hasNavigationControl = true;
    this.$hasScaleControl      = true;
    this.$mapTypeControl       = {};
    this.$navigationControl    = {};
    this.$scaleControl         = {};
    this.$map                  = null;

    // for property specs, see: http://code.google.com/apis/maps/documentation/javascript/reference.html#MapOptions
    this.$booleanProperties["draggable"]         = true;
    this.$supportedProperties.push("latitude", "longitude", "bgcolor", "draggable",
        "maptypecontrol", "navigationcontrol", "scalecontrol", "type", "zoom", "marker");
    // default values:
    this.latitude              = 0;
    this.longitude             = 0;
    this.bgcolor               = null;
    this.draggable             = true;
    this.maptypecontrol        = true;
    this.navigationcontrol     = true;
    this.scalecontrol          = true;
    this.type                  = null;
    this.zoom                  = 15;

    var timer, deltimer, lastpos,
        delegates = [],
        _slice    = Array.prototype.slice,
        loaddone  = false;
    /**
     * @attribute {Number} latitude   geographical coordinate
     * @attribute {Number} longitude  geographical coordinate
     */
    this.$propHandlers["latitude"]  =
    this.$propHandlers["longitude"] = function(value, prop) {
        clearTimeout(timer);
        this[prop] = parseFloat(value);
        var _self = this;
        timer = setTimeout(function() {
            _self.setValue(this.latitude, this.longitude);
        });
    };

    function delegate(func, args) {
        clearTimeout(deltimer);
        func.$__args = _slice.call(args);
        delegates.pushUnique(func);
        callDelegates.call(this);
    }

    function callDelegates() {
        clearTimeout(deltimer);
        if (!loaddone) {
            var _self = this;
            deltimer = setTimeout(function() {callDelegates.call(_self)}, 1000);
            return;
        }
        var i = 0,
            l = delegates.length;
        if (!l) return;
        for (; i < l; ++i) {
            if (typeof delegates[i] != "function") continue;
            delegates[i].apply(this, delegates[i].$__args);
        }
        delegates = [];
    }

    function parseOptions(sOpts) {
        var t,
            aOpts = sOpts.splitSafe(",|;"),
            oOpts = {},
            i     = 0,
            l     = aOpts.length;
        for (; i < l; ++i) {
            if (!aOpts[i]) continue;
            t = aOpts[i].splitSafe(":|=");
            if (t.length != 2) continue;
            oOpts[t[0]] = typeof t[1] == "string" ? t[1].toLowerCase() : t[1];
        }
        return oOpts
    }

    /**
     * @attribute {mixed} maptypecontrol defines the if a MapType control should be visible and what its position and style should be.
     *                                   The value may be either 'false' (no control) or of the following form:
     *                                   'position:bottom-left,style:dropdown'
     *                                   Style options: 'dropdown', 'bar'
     */
    this.$propHandlers["maptypecontrol"] = function(value) {
        this.maptypecontrol  = !apf.isFalse(value);
        this.$mapTypeControl = {};
        if (!this.maptypecontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.MapTypeControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "TOP_RIGHT";
            this.$mapTypeControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                case "dropdown":
                    this.$mapTypeControl.style = oStyle.DROPDOWN_MENU;
                    break;
                case "bar":
                    this.$mapTypeControl.style = oStyle.HORIZONTAL_BAR;
                    break;
                default:
                case "default":
                    this.$mapTypeControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            mapTypeControl       : this.maptypecontrol,
            mapTypeControlOptions: this.$mapTypeControl
        });
    };

    /**
     * @attribute {mixed} navigationcontrol defines the if a Navigation control should be visible and what its position and style should be.
     *                                      The value may be either 'false' (no control) or of the following form:
     *                                      'position:bottom-left,style:zoompan'
     *                                      Style options: 'android', 'small' or 'zoompan'
     */
    this.$propHandlers["navigationcontrol"] = function(value) {
        this.navigationcontrol  = !apf.isFalse(value);
        this.$navigationControl = {};
        if (!this.navigationcontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.NavigationControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "TOP_LEFT";
            this.$navigationControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                case "android":
                    this.$navigationControl.style = oStyle.ANDROID;
                    break;
                case "small":
                    this.$navigationControl.style = oStyle.SMALL;
                    break;
                case "zoompan":
                    this.$navigationControl.style = oStyle.ZOOM_PAN;
                    break;
                default:
                case "default":
                    this.$navigationControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            navigationControl       : this.navigationcontrol,
            navigationControlOptions: this.$navigationControl
        });
    };

    /**
     * @attribute {mixed} scalecontrol defines the if a Navigation control should be visible and what its position and style should be.
     *                                 The value may be either 'false' (no control) or of the following form:
     *                                 'position:bottom-left,style:default'
     *                                 Style options: 'default' only.
     */
    this.$propHandlers["scalecontrol"] = function(value) {
        this.scalecontrol  = !apf.isFalse(value);
        this.$scaleControl = {};
        if (!this.scalecontrol) return;
        if (loaddone) {
            var o      = parseOptions(value),
                oPos   = google.maps.ControlPosition,
                oStyle = google.maps.ScaleControlStyle;
            o.position = typeof o.position != "undefined" ? o.position.replace(/\-/g, "_").toUpperCase() : "BOTTOM_LEFT";
            this.$scaleControl.position = oPos[o.position] || oPos.TOP_LEFT;
            switch (o.style) {
                default:
                case "default":
                    this.$scaleControl.style = oStyle.DEFAULT;
            }
        }
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setOptions({
            scaleControl       : this.scalecontrol,
            scaleControlOptions: this.$scaleControl
        });
    };

    /**
     * @attribute {String} type the type of map that should be rendered.
     *                          Possible values: 'hybrid', 'roadmap', 'satellite', 'terrain'
     */
    this.$propHandlers["type"] = function(value) {
        if (loaddone)
            this.type = google.maps.MapTypeId[value.toUpperCase()];
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setMapTypeId(this.type);
    };

    /**
     * @attribute {Number} zoom The zoomlevel of the map.
     *                          Value may vary between 1..100
     */
    this.$propHandlers["zoom"] = function(value) {
        this.zoom = parseInt(value);
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        this.$map.setZoom(this.zoom);
    };

    /**
     * @attribute {String} marker The zoomlevel of the map.
     *                            Value may vary between 1..100
     */
    this.$propHandlers["marker"] = function(value) {
        this.addMarker(value);
    };

    // PUBLIC METHODS
    /**
     * Sets the geographical coordinates and centers the map on it.
     * If no coordinates are passed as arguments, the current values of the
     * latitude and longitude attributes are used.
     *
     * @param {Number} lat geographical coordinate latitude
     * @param {Number} lon geographical coordinate longitude
     * @type  {void}
     */
    this.setValue = function(lat, lon){
        if (!loaddone || !this.$map)
            return delegate.call(this, arguments.callee, arguments);
        if (lat)
            this.latitude  = parseFloat(lat);
        if (lon)
            this.longitude = parseFloat(lon);
        lastpos = new google.maps.LatLng(this.latitude, this.longitude);
        this.$map.setCenter(lastpos);
        callDelegates.call(this);
    };

    /**
     * Retrieves the current geographical coordinates as displayed by the map.
     * The returned object has the following structure: 
     * <code>
     * {
     *     latitude:  [number between -90 and 90 degrees],
     *     longitude: [number between -180 and 180 degrees]
     * }
     * </code>
     * 
     * @type {Object}
     */
    this.getValue = function(){
        return {
            latitude : this.latitude,
            longitude: this.longitude
        };
    };

    /**
     * Adds a marker on a specific geographical location, optionally with an 
     * information window attached to it with arbitrary HTML as its content.
     * 
     * @param {String} [title]   title of the marker. Defaults to 'Marker'
     * @param {String} [content] content of the information window. If not set, 
     *                           no information window is created and attached to 
     *                           the marker.
     * @param {Object} [coords]  geographical coordinates to drop the marker at.
     *                           Format: {latitude: x, longitude: y}
     */
    this.addMarker = function(title, content, coords) {
        if (!this.$map)
            return delegate.call(this, arguments.callee, arguments);
        var pos = lastpos;
        if (coords && coords.latitude && coords.longitude)
            pos = new google.maps.LatLng(coords.latitude, coords.longitude);
        if (!pos)
            return delegate.call(this, arguments.callee, arguments);

        var marker = new google.maps.Marker({
            position: pos,
            map     : this.$map,
            title   : title || "Marker"
        });

        if (!content) return;
        var _self      = this,
            infowindow = new google.maps.InfoWindow({
                content: content
            });
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(_self.$map, marker);
        });
    };

    this.$draw = function(){
        if (!this.$ext)
            this.$ext = this.$getExternal();

        if (!loaddone)
            return delegate.call(this, arguments.callee, arguments);

        this.$map = new google.maps.Map(this.$ext, {
            zoom                    : this.zoom,
            mapTypeControl          : this.maptypecontrol,
            mapTypeControlOptions   : this.$mapTypeControl,
            navigationControl       : this.navigationcontrol,
            navigationControlOptions: this.$navigationControl,
            scaleControl            : this.scalecontrol,
            scaleControlOptions     : this.$scaleControl,
            mapTypeId               : this.type || google.maps.MapTypeId.HYBRID
        });

        var _self = this;
        $setTimeout(function() {
            callDelegates.call(_self);
        });
    };

    this.$destroy = function(){
        if (this.$map) {
            var div = this.$map.getDiv();
            div.parentNode.removeChild(div);
            delete this.$map;
        }
    };

    this.addEventListener("DOMNodeInsertedIntoDocument", function() {
        // include Map scripts:
        //<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=true"></script>
        //<script src="http://code.google.com/apis/gears/gears_init.js" type="text/javascript" charset="utf-8"></script>
        var loadcnt = 0,
            _self   = this;
        function loaded() {
            if (++loadcnt !== 2) return;
            loaddone = true;
            callDelegates.call(_self);
        }
        if (typeof google == "undefined" && typeof google.maps == "undefined") {
            apf.include("http://maps.google.com/maps/api/js?sensor=true",  false, null, null, loaded);
            apf.include("http://code.google.com/apis/gears/gears_init.js", false, null, null, loaded);
        }
        else {
            loadcnt = 1;
            loaded();
        }
    });
}).call(apf.map.prototype = new apf.Presentation());

apf.aml.setElement("map", apf.map);

// #endif
