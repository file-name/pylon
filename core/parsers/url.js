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
 
//#ifdef __WITH_UTIL_URL

/**
 * Object that represents a URI, broken down to its parts, according to RFC3986.
 * All parts are publicly accessible after parsing like 'url.port' or 'url.host'.
 * Example:
 * <pre class="code">
 *   var url = new jpf.url('http://usr:pwd@www.test.com:81/dir/dir.2/index.htm?q1=0&&test1&test2=value#top');
 *   alert(url.port); //will show '81'
 *   alert(url.host); //will show 'www.test.com'
 *   alert(url.isSameLocation()) // will show 'true' when the browser is surfing on the www.test.com domain
 * </pre>
 *
 * @link http://tools.ietf.org/html/rfc3986
 * @classDescription This class creates a new URL object, divided into chunks
 * @return {jpf.url} Returns a new jpf.uri instance
 * @type {jpf.url}
 * @constructor
 *
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       1.0
 */
jpf.url = function(str) {
    if (str.indexOf(":") == -1) {
        var base = new jpf.url(window.location.toString());
        str = jpf.getAbsolutePath("http://" + base.host + "/"
            + (base.directory.charAt(base.directory.length - 1) == "/"
                 ? base.directory
                 : base.directory + '/'), str);
    }
    var	o    = jpf.url.options,
    m        = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    i        = 14;
    this.uri = str.toString(); //copy string
    
    while (i--)
        this[o.key[i]] = m[i] || "";
    
    this[o.q.name] = {};
    var _self = this;
    this[o.key[12]].replace(o.q.parser, function($0, $1, $2){
        if ($1)
            _self[o.q.name][$1] = $2;
    });
};

jpf.url.prototype = {
    /**
     * Checks if the same origin policy is in effect for this URI.
     * @link http://developer.mozilla.org/index.php?title=En/Same_origin_policy_for_JavaScript
     * 
     * @type {Boolean}
     */
    isSameLocation: function(){
        // filter out anchors
        if (this.uri.length && this.uri.charAt(0) == "#") 
            return false;
        // totally relative -- ../../someFile.html
        if (!this.protocol && !this.port && !this.host) 
            return true;
        
        // scheme relative with port specified -- foo.com:8080
        if (!this.protocol && this.host && this.port 
          && window.location.hostname == this.host 
          && window.location.port     == this.port) {
            return true;
        }
        // scheme relative with no-port specified -- foo.com
        if (!this.protocol && this.host && !this.port
          && window.location.hostname == this.host
          && window.location.port     == 80) {
            return true;
        }
        return window.location.protocol == (this.protocol + ":") 
            && window.location.hostname == this.host 
            && (window.location.port    == this.port || !window.location.port && !this.port);
    }
};

jpf.url.options = {
    strictMode: false,
    key: ["source", "protocol", "authority", "userInfo", "user", "password",
          "host", "port", "relative", "path", "directory", "file", "query", 
          "anchor"],
    q  : {
        name  : "queryKey",
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose : /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
};

//#endif
