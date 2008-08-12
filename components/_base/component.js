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

// #ifdef __WITH_APP

/**
 * This function tries to simplify the development of new components for 3rd party
 * developers. Creating a new component for JPF may now be as easy as:
 * Example:
 * <pre>
 * jpf.newComponent = jpf.component(GUI_NODE, {}).implement(jpf.Something);
 * </pre>
 * 
 * @classDescription         This class serves as a baseclass for new components
 * @param  {Number} nodeType A number constant, defining the type of component
 * @param  {mixed}  oBase    May be a function (will be instantiated) or object to populate the components' prototype
 * @return {Component}       Returns a Function that will serve as the components' constructor
 * @type   {Component}
 * @constructor
 * 
 * Note: we REALLY don't care about execution speed for this one! It will be
 * optimized by reformatting it using Jaw (compile-time), like C-style macros.
 * 
 * @author      Mike de Boer
 * @version     %I%, %G%
 * @since       0.99
 */
jpf.component = function(nodeType, oBase) {
    // the actual constructor for the new comp (see '__init()' below).
    var fC = function() {
        this.__init.apply(this, arguments);
    };
    
    // if oBase is provided, apply it as a prototype of the new comp.
    if (oBase) {
        // a function will be deferred to instantiation of the comp. to be inherited 
        if (typeof oBase == "function")
            fC.prototype.base = oBase;
        else
            fC.prototype = oBase;
    }

    fC.prototype.nodeType      = nodeType || NOGUI_NODE;
    fC.prototype.ownerDocument = jpf.document;

    //#ifdef __DESKRUN
    if(nodeType == MF_NODE)
        DeskRun.register(fC.prototype);
    //#endif

    fC.prototype.inherit = jpf.inherit;

    if (typeof fC.prototype['__init'] != "function") {
        var aImpl = [];
        /**
         * The developer may supply interfaces that will inherited upon component
         * instantiation with implement() below. Calls to 'implement()' may be
         * chained.
         * 
         * @private
         */
        fC.implement = function() {
            aImpl = aImpl.concat(Array.prototype.slice.call(arguments));
            return fC;
        }
        
        /**
         * Even though '__init()' COULD be overridden, it is still the engine
         * for every new component. It takes care of the basic inheritance
         * difficulties and created the necessary hooks with the Javeline Platform.
         * Note: a developer can still use 'init()' as the function to execute
         *       upon instantiation, while '__init()' is used by JPF.
         * 
         * @param {Object} pHtmlNode
         * @param {Object} sName
         * @type void
         */
        fC.prototype.__init = function(pHtmlNode, sName){
            if (typeof sName != "string") 
                throw new Error(0, jpf.formErrorString(0, this, "Dependencies not met, please provide a component name"));

            this.tagName    = sName;
            this.pHtmlNode  = pHtmlNode || document.body;
            this.pHtmlDoc   = this.pHtmlNode.ownerDocument;
            
            this.uniqueId   = jpf.all.push(this) - 1;
            
            this.focussable = true; // Each object can get the focus by default
            
            /** 
             * @inherits jpf.Class
             * @inherits jpf.JmlNode
             */
            this.inherit(jpf.Class);
            this.inherit.apply(this, aImpl);
            this.inherit(jpf.JmlNode, this.base || jpf.K);
            
            if (this['init'] && typeof this.init == "function")
                this.init();
        }
    }
    
    return fC;
};

// #endif
