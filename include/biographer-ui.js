/*
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

(function(window) {

// Use the correct document accordingly with window argument (sandbox)
var document = window.document,
	navigator = window.navigator,
	location = window.location;
// can't make this variable private because of the JsDoc toolkit.
/**
 * @namespace The whole biographer-ui library can be accessed through this var.
 */
bui = {};

/**
 * @namespace SVG namespace definition
 */
bui.svgns = "http://www.w3.org/2000/svg";


/**
 * @namespace Settings are stored within this variable
 */
bui.settings = {
    /**
     * @field
     * Define the SBGN Language: PD, ER, AF
     * this makes minor differnces in e.g. how StateVariable will be drawn
     */
    SBGNlang : 'PD',

    /**
     * @field
     *  if this is true all handles on edges (not splines) will be distributed equally on a straight line from source to target as soon as the source or target are moved
     */
    straightenEdges : false,

    /**
     * @field
     * Whether or not the bui.Graph will be initialised in high or low
     * performance mode. True for high performance.
     */
    initialHighPerformance : true,

    /**
     * @field
     * Set to true to enable modification support. Please note though that this
     * can have a strong impact on the initial load time as described in the
     * following issue.
     * http://code.google.com/p/biographer/issues/detail?id=6
     */
    enableModificationSupport : true,

    /**
     * @field
     * set to disable certain dynamic SVG features (like suspendRedraw) which
     * are not needed or supported by static SVG generation in node.js
     */
    staticSVG : false,

    /**
     * @field
     * How many frames per second (FPS) should be used for animations.
     */
    animationFPS : 30,

    /**
     * @field
     * Prefixes for various ids
     */
    idPrefix : {
        graph : 'graph',
        node : 'node',
        edge : 'edge',
        connectingArc : 'connectingArc'
    },

    /**
     * @field
     * Id suffixes
     */
    idSuffix : {
        hover : 'hover'
    },

    /**
     * @field
     * The data exchange format
     */
    dataFormat : {
        nodes : 'nodes',
        edges : 'edges',
        drawable : {
            id : 'id',
            visible : 'visible',
            sbo : 'sbo',
            cssClasses : ['data', 'cssClasses']
        },
        node : {
            label : ['data', 'label'],
            x : ['data', 'x'],
            y : ['data', 'y'],
            width : ['data', 'width'],
            height : ['data', 'height'],
            subNodes : ['data', 'subnodes'],
            modification : ['data', 'modification'],
            statevariable : ['data', 'statevariable'],
            color : ['data', 'color']
        },
        edge : {
            source : 'source',
            target : 'target',
            style : ['data', 'style'],
            type : ['data', 'type'],
            handles : ['data', 'handles'],
            points : ['data', 'points'],
            pointtypes : ['data', 'pointtypes']
        }

    },

    /**
     * @field
     * The url from which the CSS file should be imported and CSS classes
     */
    css : {
        stylesheetUrl : 'resources/css/visualization-svg.css',
        classes : {
            invisible : 'hidden',
            selected : 'selected',
            rectangle : 'rect',
            complex : 'complex',
            compartment : 'compartment',
            process : 'process',
            perturbation : 'perturbation',
            annotation : 'annotation',
            statevariable : 'statevariable',
            smallText : 'small',
            textDimensionCalculation : {
                generic : 'textDimensionCalculation',
                standard : 'defaultText',
                small : 'smallText'
            },
            line : 'line',
            lineStyle : {
                solid : 'solid',
                dotted : 'dotted',
                dashed : 'dashed'
            },
            lineHover : 'lineHover',
            connectingArcs : {
                stimulation : 'stimulation',
                assignment : 'assignment',
                catalysis : 'catalysis',
                control : 'control',
                necessaryStimulation : 'necessaryStimulation',
                absoluteInhibition : 'absoluteInhibition'
            },
            splineEdgeHandle : 'splineEdgeHandle',
            splineAutoEdgeHandle : 'autoAlign',
            hideBorder : 'hideBorder'
        }
    },
    /**
     * @field
     * Various styles that can not be realized using CSS
     */
    style : {
        graphReduceCanvasPadding : 30,
        edgeHandleRadius : 8,
        nodeCornerRadius : 15,
        adaptToLabelNodePadding : {
            top : 5,
            right : 5,
            bottom : 5,
            left : 5
        },
        complexCornerRadius : 15,
        complexTableLayout : {
            padding : 10,
            restrictNumberOfColumns : false,
            showBorder : true
        },
        compartmentCornerRadius : {
            x : 25,
            y : 15
        },
        processNodeMinSize : {
            width : 26,
            height : 26
        },
        helperNodeMinSize : {
            width : 5,
            height : 5
        },
        edgeToNodePadding : {
            topBottom : 5,
            leftRight : 5
        },
        importer : {
            standardNodeSize : {
                width : 70,
                height : 70
            },
            sizeBasedOnLabelPassing : {
                horizontal : 20,
                vertical : 20
            },
            modificationLabel : 'longlabel' // either 'longlabel' or 'shortlabel'
        },
        // x/y coordinates as % of a node's size (1 = 100%)
        // T = top, L = left, R = right, B = bottom, CX = Center X,
        // CY = center y
        automaticAuxiliaryUnitPositioning : [[0, 0], // T-L
                [1, 1], // B-R
                [1, 0], // T-R
                [0, 1], // B-L
                [0.5, 0], // T-CX
                [1, 0.5], // CY-R
                [0.5, 1], // B-CX
                [0, 0.5] // CY-L
        ],
        markerWidthCorrection : 0.25 // (1 / .lineHover#stroke-width) (see CSS)
    }
};

(function(bui) {

    var readyFunctions = [];

    /**
     * @description
     * Use this function to add functions (callbacks) which are to be
     * executed when the whole document is done loading.
     *
     * @param {Function} callback Function to be executed when the document is
     *   ready
     */
    bui.ready = function(callback) {
        readyFunctions.push(callback);
    };

    // executing the ready functions
    $(function() {
        for(var i = 0; i < readyFunctions.length; i++) {
            readyFunctions[i]();
        }
    });

    /**
     * @class
     * Base class for all the biographer-ui classes
     */
    bui.Object = function() {
        this.__private = {};
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._getPrivateMembers = function(identifier) {
        var privates = this.__private[identifier];

        if (privates === undefined) {
            privates = {};
            this.__private[identifier] = privates;
        }

        return privates;
    };

    /**
     * Retrieve the private members for a given class
     *
     * @param {Object} identifier This identifies for which class the private
     *   members shall be retrieved.
     * @return {Object} An object from which the private members could be
     *   retrieved
     */
    bui.Object.prototype._privates = function(identifier) {
        return this._getPrivateMembers(identifier);
    };
})(bui);

/**
 * @private
 * @see bui.Node._calculationHook
 */
var _circularShapeLineEndCalculationHook =
        function(adjacent, hitAngle, padding) {
    var radius = this.size().width / 2;

    radius += Math.sqrt(Math.pow(padding.topBottom, 2) +
            Math.pow(padding.leftRight, 2));

    return {
        opposite : Math.sin(hitAngle) * radius,
        adjacent : Math.cos(hitAngle) * radius
    };
};

/**
 * @private
 * @see bui.Node._calculationHook
 */
var circularShapeLineEndCalculationHook = function(adjacent, hitAngle) {
    return _circularShapeLineEndCalculationHook.call(this, adjacent,
            hitAngle,
            bui.settings.style.edgeToNodePadding);
};

/**
 * @private
 * @see bui.Node._calculationHook
 */
var circularShapeLineEndCalculationHookWithoutPadding =
        function(adjacent, hitAngle) {
    return _circularShapeLineEndCalculationHook.call(this, adjacent,
            hitAngle,
            {
                topBottom : 0,
                leftRight : 0
            });
};
(function(bui) {

    /**
     * @namespace Namespace of utility functionality
     */
    bui.util = {};

    /**
     * @description
     * Utility function for the usage of Object.create as it requires some
     * meta data about the properties like configurable or writable.
     *
     * @param {Object} value The value to be included in a prototype value.
     * @return {Object} The property value
     */
    bui.util.createPrototypeValue = function(value) {
        return {
            value : value,
            enumerable : true,
            configurable : true,
            writable : true
        };
    };

    /**
     * @description
     * <p>We extend the prototype of all functions with the function
     * createDelegate. This method allows us to change the scope of a
     * function.</p>
     *
     * <p>This is useful when attaching listeners to jQuery events like click
     * or mousemove as jQuery normally uses this to reference the source
     * of the event. When using the createDelegate method, this will point to
     * the object that you want to reference with this.</p>
     *
     * <p>Source:
     * <a href="http://stackoverflow.com/questions/520019/controlling-the-value-of-this-in-a-jquery-event">
     *     Stackoverflow
     * </a></p>
     *
     * @param {Object} scope The scope which you want to apply.
     * @return {Function} function with maintained scope
     */
    Function.prototype.createDelegate = function(scope) {
        var fn = this;
        return function() {
            // Forward to the original function using 'scope' as 'this'.
            return fn.apply(scope, arguments);
        };
    };

    /**
     * @description
     * This function strips everything from a string that is not a number,
     *
     * @return {String} Only the numbers from the previous string.
     */
    String.prototype.removeNonNumbers = function() {
        return this.replace(/[^0-9]/g, '');
    };

    /**
     * Check whether a string has a specific suffix
     *
     * @param {String} suffix The suffix for which the string should be tested.
     * @return {Boolean} True when the string has the provided suffix,
     *   false otherwise.
     */
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

    /**
     * Calculate word dimensions for given text using HTML elements.
     * Optionally classes can be added to calculate with
     * a specific style / layout.
     *
     * @param {String} text The word for which you would like to know the
     *   dimensions.
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @param {Boolean} [escape] Whether or not the word should be escaped.
     *   Defaults to true.
     * @return {Object} An object with width and height properties.
     */
    bui.util.calculateWordDimensions = function(text, classes, escape, precalc) {
        if (classes === undefined) {
            classes = [];
        }
        if (escape === undefined) {
            escape = true;
        }
        //use fallback if it can't be calculated because we use node.js with jsdom that cannot calculate word sized automatically
        if (bui.settings.staticSVG || precalc !== undefined){
            var letter2width = bui.util.precalcLetterWidth();
            var text_length = 0;
            for(var i=0; i<text.length; i++){
                text_length += letter2width[text.charAt(i)];
            }
            if (text_length<=1) text_length=1;
            return { width : text_length, height : 16};
        }

        classes.push(
                bui.settings.css.classes.textDimensionCalculation.generic);

        var div = document.createElement('div');
        div.setAttribute('class', classes.join(' '));

        if (escape === true) {
            $(div).text(text);
        } else {
            div.innerHTML = text;
        }


        document.body.appendChild(div);

        var dimensions = {
            width : jQuery(div).outerWidth(),
            height : jQuery(div).outerHeight()
        };

        div.parentNode.removeChild(div);

        return dimensions;
    };

    /**
     * Use this function to calculate the text dimensions for a line of text.
     *
     * @param {String} text Line of text to be analysed
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @return {Object[]} An object with word, width and height properties. For
     *   each word in the given text (text splitted at every whitespace
     *   character) the previously mentioned properties are returned.
     */
    bui.util.calculateTextDimensions = function(text, classes) {
        var words = text.split(/\s/);

        for(var i = 0; i < words.length; i++) {
            var word = words[i];
            var dimensions = bui.util.calculateWordDimensions(word, classes);
            dimensions.word = word;
            words[i] = dimensions;
        }

        return words;
    };

    /**
     * Calculate all the required information for the positioning of a label.
     *
     * @param {Number} width Available width for the positioning of the label
     * @param {String} label The label for which the positioning should
     *   be calculated.
     * @param {String[]} [classes] An array of strings which represent
     *   css classes which should be applied to the DIV which is used for
     *   the calculation of word dimensions.
     * @return {Object[]} An array of objects. Each object in this array
     *   represents one line. Each line object has a words property which
     *   itself is an array of all words of the label ans the respective
     *   dimensions of this word. Also, each line object has a maxHeight,
     *   totalWidth and horizontalIndention property.
     */
    bui.util.calculateLabelPositioning = function(width, label, classes) {
        var analyzedWords = bui.util.calculateTextDimensions(label, classes);
        var spaceWidth = bui.util.calculateWordDimensions('&nbsp;', classes,
                false).width;
        var lines = [];
        var currentLine = null;
        var maxHeight = 0;

        var addLine = function() {
            if (currentLine !== null) {
                currentLine.maxHeight = maxHeight;
            }
            maxHeight = 0;

            lines.push({
                words : [],
                availableWidth : width
            });
            currentLine = lines[lines.length - 1];
        };
        addLine();
        var addWord = function(word) {
            currentLine.words.push(word);
            currentLine.availableWidth -= word.width + spaceWidth;
            maxHeight = Math.max(maxHeight, word.height);
        };

        for(var i = 0; i < analyzedWords.length; i++) {
            var word = analyzedWords[i];

            if (word.width <= currentLine.availableWidth) {
                addWord(word);
            } else {
                if (currentLine.words.length !== 0) {
                    addLine();
                }
                
                addWord(word);
            }
        }

        currentLine.maxHeight = maxHeight;

        for(i = 0; i < lines.length; i++) {
            var line = lines[i];
            // we subtracted one space too much
            line.availableWidth += spaceWidth;
            line.horizontalIndention = line.availableWidth / 2;
            line.totalWidth = width - line.availableWidth;
            line.spaceWidth = spaceWidth;
            delete line.availableWidth;
        }

        return lines;
    };

    /**
     * Calculate the width for each letter, if this is not possible, used a default output
     **/
    var precalcHash=undefined;
    bui.util.precalcLetterWidth = function(){
        if (precalcHash) return precalcHash;
        var letters = 'abcdefghijklmnopqrstuvwzxz';
        var numbers = '1234567890_-@.:';
        var out = {};
        var elem = document.createElement('span');
        $(elem).html('A');
        //test if we can get the length of a char
        if( $(elem).width() > 1 ){
            for(var i = 0; i<letters.length; i++){
                $(elem).html(letters.charAt(i));
                out[letters.charAt(i)]=$(elem).width();
            }
            letters = letters.toUpperCase();
            for(var i = 0; i<letters.length; i++){
                $(elem).html(letters.charAt(i));
                out[letters.charAt(i)]=$(elem).width();
            }
            for(var i = 0; i<numbers.length; i++){
                $(elem).html(numbers.charAt(i));
                out[numbers.charAt(i)]=$(elem).width();
            }
            precalcHash=out;
            return out;
        }else{
            precalcHash={"0":8,"1":8,"2":8,"3":8,"4":8,"5":8,"6":8,"7":8,"8":8,"9":8,"a":8,"b":8,"c":7,"d":8,"e":8,"f":4,"g":8,"h":8,"i":3,"j":3,"k":7,"l":3,"m":13,"n":8,"o":8,"p":8,"q":8,"r":5,"s":7,"t":5,"u":8,"v":7,"w":9,"z":7,"x":7,"A":9,"B":9,"C":9,"D":10,"E":8,"F":7,"G":10,"H":10,"I":3,"J":3,"K":8,"L":7,"M":11,"N":10,"O":10,"P":8,"Q":10,"R":8,"S":9,"T":7,"U":10,"V":9,"W":11,"Z":10,"X":8};
            return precalcHash;
        }
    };
    /**
     * Set the super class for a given class. The provided class (first
     * parameter will have a superClazz property which can be used to
     * directly call the super class, e.g. the constructor.
     *
     * @param {Object} clazz The class which should inherit from the superClazz
     * @param {Object} superClazz The super class
     */
    bui.util.setSuperClass = function(clazz, superClazz) {
        var prototype = clazz.prototype;

        for(var i in prototype) {
            if (prototype.hasOwnProperty(i)) {
                var member = prototype[i];
                prototype[i] = bui.util.createPrototypeValue(member);
            }
        }

        clazz.prototype = Object.create(superClazz.prototype, clazz.prototype);
        clazz.superClazz = superClazz;
    };

    var listenerTypeCounter = 0;
    /**
     * All listener types must have a unique identifier. In the previous
     * version strings were used as an identifier with the drawback of
     * bad performance due to a fair amount of lookups. This function
     * just generates an integer which should be much faster for lookups.
     */
    bui.util.createListenerTypeId = function() {
        return listenerTypeCounter++;
    };

    /**
     * Create a marker's marker-end attribute value. To do this the element
     * id is required.
     *
     * @param {String} elementId The element's id which should be referenced
     * @return {String} The complete attribute value as needed for marker-end.
     */
    bui.util.createMarkerAttributeValue = function(elementId) {
        return ['url(#', elementId, ')'].join('');
    };

    /**
     * Retrieve the hover id..
     *
     * @param {String} id An element's id.
     * @return {String} The element's hover id..
     */
    bui.util.getHoverId = function(id) {
        return id + bui.settings.idSuffix.hover;
    };

    /**
     * Retrieve an objects value if it is set. If it's not set undefined will
     * be returned.
     *
     * @param {Object} obj An object whose properties should be checked
     * @param {Object} property1 One or more (var args function) property names
     *   that should be accessed and checked.
     * @return {Object} The properties value or undefined in case the property
     *   does not exist.
     */
    bui.util.retrieveValueIfSet = function(obj, property1) {
        obj = arguments[0];

        for(var i = 1; i < arguments.length && obj !== undefined; i++) {
            obj = obj[arguments[i]];
        }

        return obj;
    };

     /**
     * Verify that an object has a property with the given name and that this
     * property is not null.
     *
     * @param {Object} obj The object which should be checked for the property.
     * @param {String} property Property names which should be checked. This is
     *   a var args method.
     * @return {Boolean} True in case the property exists and is not null.
     *   False otherwise.
     */
    bui.util.propertySetAndNotNull = function() {
        var obj = arguments[0];
        
        for(var i = 1; i < arguments.length; i++) {

            var property = arguments[i];

            if (typeof(property) === 'string') {
                if ((obj.hasOwnProperty(property) === false ||
                    obj[property] === null)) {
                    return false;
                }
            } else {
                property.splice(0, 0, obj);

                var result = bui.util.retrieveValueIfSet.apply(window,
                        property);

                if (result === undefined || result === null) {
                    return false;
                }
            }
        }

        return true;
    };

    /**
     * Ensure that a value is a number. If it is not an exception will be thrown.
     * @param {Number|String} val The value which should be converted to a number.
     *   If you pass a string it will be converted to a number if possible.
     * @return {Number} The converted number.
     */
    bui.util.toNumber = function(val) {
        var type = typeof(val);

        if (type === 'number') {
            return val;
        } else if (type === 'string' && isNaN(val) === false) {
            return parseFloat(val);
        } else {
            throw 'It can\'t be ensured that the value: "' + val +
                    '" is a number.';
        }
    };

    /**
     * Ensure that the given value is a boolean value.  If it is not an exception
     *   will be thrown.
     * @param {Boolean|Number|String} val The value which should be converted to
     *   a boolean value. If you pass a boolean value it will simply be returned.
     *   A numeric value will be result in true in case the parameter equals '1'.
     *   All other numbers will result in false. A string will evaluate to true
     *   when it equals (case insensitive) 'true' or '1'.
     * @return {Boolean} The converted boolean value.
     */
    bui.util.toBoolean = function(val) {
        var type = typeof(val);

        if (type === 'boolean') {
            return val;
        } else if (type === 'string') {
            return val.toLowerCase() === 'true' || val === '1';
        } else if (type === 'number') {
            return val === 1;
        } else {
            throw 'The value: "' + val + 'can\'t be converted to boolean.';
        }
    };

    /**
     * Align the viewport to a node.
     *
     * @param {bui.Graph} graph The graph in which the node is located to
     *   the viewpoint should be aligned to.
     * @param {String} nodeJSONId The JSON identifier which was used in the
     *   import JSON data.
     * @param {jQueryHTMLElement} [canvas] Use this parameter and the viewport
     *   parameter in combination to change the viewport. Mostly this is
     *   required when you place the visualization in an HTMLElement with
     *   overflow: (scroll|auto). In such cases, pass the aforementioned
     *   HTMLElement as third and fourth parameter.
     * @param {jQueryHTMLElement} [viewport] Please refer to the documentation
     *   of the canvas parameter.
     */
    bui.util.alignCanvas = function(graph, nodeJSONId, canvas, viewport) {
        var drawables = graph.drawables(),
                node;

        for (var key in drawables) {
            if (drawables.hasOwnProperty(key)) {
                var drawable = drawables[key];

                if (drawable.json() !== null &&
                        drawable.json().id === nodeJSONId) {
                    node = drawable;
                }
            }
        }

        if (node === undefined) {
            log('Node with id ' + nodeJSONId +
                    ' could not be found in the graph.');
            return;
        }

        var position = node.absolutePosition(),
                size = node.size(),
                scale = graph.scale(),
                graphOffset = graph.htmlTopLeft();

        if (canvas === undefined || viewport === undefined) {
            canvas = jQuery('body');
            viewport = jQuery(window);
        }

        var scrollLeft = position.x * scale - ((
                viewport.width() - size.width * scale) / 2) + graphOffset.x;
        var scrollTop = position.y * scale - ((
                viewport.height() - size.height * scale) / 2) + graphOffset.y;
        canvas.animate({
            scrollLeft : scrollLeft,
            scrollTop : scrollTop
        });
    };

    /**
     * Make all coordinates 0 thus removing negative positions.
     * @param {Object} json The JSON data object. The coordinates will be
     *   transformed in place.
     */
    bui.util.transformJSONCoordinates = function(json) {
        var nodes = json.nodes,
                minX = Number.MAX_VALUE,
                minY = Number.MAX_VALUE,
                node,
                i;

        for (i = 0; i < nodes.length; i++) {
            node = nodes[i];

            if (bui.util.propertySetAndNotNull(node,
                ['data', 'x'], ['data', 'y'])) {
                node.data.x = bui.util.toNumber(node.data.x);
                node.data.y = bui.util.toNumber(node.data.y);
                minX = Math.min(minX, node.data.x);
                minY = Math.min(minY, node.data.y);
            }
        }

        if (minX > 0) {
            minX = 0;
        } else {
            minX = Math.abs(minX);
        }
        if (minY > 0) {
            minY = 0;
        } else {
            minY = Math.abs(minY);
        }

        if (minX !== 0 && minY !== 0) {
            for (i = 0; i < nodes.length; i++) {
                node = nodes[i];

                if (bui.util.propertySetAndNotNull(node,
                    ['data', 'x'], ['data', 'y'])) {
                    node.data.x += minX;
                    node.data.y += minY;
                }
            }
        }
    };
    bui.util.clone = function(graph, degree, select_drawables){
            var suspendHandle = graph.suspendRedraw(20000);
            var all_drawables = graph.drawables();
            var select_drawables_ids = {};
            if(select_drawables !== undefined){
		for (var i=0;i<select_drawables.length;i++){
		    select_drawables_ids[select_drawables[i].id()] = 1;
		}
	    }
            var new_nodes = [];
            // create a counting dictionary for the nodes
            var degree_count = {};
            var drawable, edge, old_node_id, new_node;
            for (var key in all_drawables) {
                var drawable = all_drawables[key];
                if ((drawable.identifier()=='UnspecifiedEntity')||(drawable.identifier()=='SimpleChemical')||(drawable.identifier()=='RectangularNode')||(drawable.identifier()=='Phenotype')||(drawable.identifier()=='NucleicAcidFeature')||(drawable.identifier()=='Macromolecule')){
                    degree_count[drawable.id()] = 0;
                }
            }

            // count edges connecting the relevant nodes
            var all_drawables = graph.drawables();
            for (var key in all_drawables) {
                var drawable = all_drawables[key];
                if (drawable.identifier() in {'Edge':1,'Spline':1}){
                    if (drawable.source().id() in degree_count){
                        degree_count[drawable.source().id()] = degree_count[drawable.source().id()] + 1;
                    }
                    if (drawable.target().id() in degree_count){
                        degree_count[drawable.target().id()] = degree_count[drawable.target().id()] + 1;
                    }
                }
            }
            // go through all the nodes with a higher than appreciated degree
            var old_node_ids = {};
            var auto_indent = 1000;
            for (var key in degree_count) {
                if(select_drawables !== undefined && !(key in select_drawables_ids)) continue;
                var drawable = all_drawables[key];
                if (degree_count[drawable.id()] > degree){
                    var old_node_id = drawable.id();
		    old_node_ids[old_node_id] = 1;
                    // create a new node for every time the old node is referenced
                    for (var edge_key in all_drawables){
                        var edge = all_drawables[edge_key];
                        if ((edge.identifier() == 'Edge')&&((edge.source().id() == old_node_id)||(edge.target().id() == old_node_id))){
                            // create a new node
                            ++auto_indent;
                            var new_node = graph.add(bui[drawable.identifier()])
                                .visible(true)
                                .label(drawable.label())
                                .parent(drawable.parent())
                                .position(drawable.position().x, drawable.position().y)
                                .size(drawable.size().width, drawable.size().height)
                                .clonemarker(true);
                            // reroute the edge
                            new_nodes.push(new_node);
                            if (edge.source().id() == old_node_id){
                                all_drawables[edge_key].source(new_node);
                            } else {
                                all_drawables[edge_key].target(new_node);
                            }
                        }
                    }
                }
            }
            for (var key in all_drawables) {
                var drawable = all_drawables[key];
                if (drawable.id() in old_node_ids){
                    drawable.remove();
                }
            }
            graph.unsuspendRedraw(suspendHandle);
            return new_nodes;
    };


    bui.util.combine = function(graph, select_drawables){
        var suspendHandle = graph.suspendRedraw(20000);
        var all_drawables = graph.drawables();
        // create new node
        var drawable = select_drawables[0];
        var new_node = graph.add(bui[drawable.identifier()]) 
            .visible(true)
            .label(drawable.label())
            .parent(drawable.parent())
            .position(drawable.position().x, drawable.position().y)
            .size(drawable.size().width, drawable.size().height);
        // redraw edges
        for (var edge_key in all_drawables){
            var edge = all_drawables[edge_key];
            if (edge.identifier() in {'Edge':1,'Spline':1}){
		for (var node_key=0; node_key<select_drawables.length; ++node_key){
	 	    var node_id = select_drawables[node_key].id();
                    if (edge.source().id() == node_id){
                        all_drawables[edge_key].source(new_node);
                    }
                    if (edge.target().id() == node_id){
                        all_drawables[edge_key].target(new_node);
                    }
                 }
            }
        }
        // remove select_drawables
        for (var node_key=0; node_key<select_drawables.length;++node_key){
            select_drawables[node_key].remove();
        }
	select_drawables = [];
        // redraw ALL THE NODES
        graph.unsuspendRedraw(suspendHandle);
	return new_node;
    } 

})(bui);

/**
 * A secure function call to the console.log function which makes sure that a
 * console object and its log function exists before continuing. Use this
 * function the way console.log would be used.
 * @param {Object} object The object which you want to log.
 */
var log = function(object) {
    if (console !== undefined && console.log !== undefined) {
        console.log(object);
    }
};


/**
 * Update a JSON object.
 *
 * @param {Object} json The object which should be updated.
 * @param {String|String[]} path The property name which should be
 *   updated. Pass a string array to handle property chains.
 * @param {Object} value The property's value.
 */
var updateJson = function(json, path, value) {
    if (typeof(path) === 'string') {
        json[path] = value;
    } else if (path !== undefined){
        var lastProperty = json;
        for(var i = 0; i < path.length - 1; i++) {
            var propertyName = path[i];
            lastProperty[propertyName] =
                    lastProperty[propertyName] || {};
            lastProperty = lastProperty[propertyName];
        }
        lastProperty[path[path.length-1]] = value;
    }
};

/*
 * ###########################################################################
 * The following variables and functions are required for the SBO mappings
 * which are located in sboMappings.js.
 *
 */

/**
 * Add mappings to the mappings object.
 *
 * @param {Object} mapping The mappings object
 * @param {Number[]} keys The keys which should be mapped
 * @param {Function} klass A classes' constructor
 * @param {Function} [generator] Generator funtion which should be used
 *   instead of the constructor.
 */
var addMapping = function(mapping, keys, klass, generator) {
    var val = { klass : klass };

    if (generator !== undefined) {
        val.generator = generator;
    }

    for (var i = 0; i < keys.length; i++) {
        mapping[keys[i]] = val;
    }
};

/**
 * @private
 * Mapping between SBO terms and biographer-ui classes.
 */
var nodeMapping = {}, processNodeMapping = {}, edgeMarkerMapping = {},
        modificationMapping = {};

(function(bui){
   bui.nodeMapping = nodeMapping;
   bui.processNodeMapping = processNodeMapping;
   bui.modificationMapping = modificationMapping;
   bui.edgeMarkerMapping = edgeMarkerMapping;
})(bui);


/**
 * Add mappings to the mappings object.
 *
 * @param {Number[]} keys The keys which should be mapped
 * @param {String} long Long name of the SBO term
 * @param {String} short Short name (abbreviation of the SBO term
 */
var addModificationMapping = function(keys, longlabel, shortlabel) {
    var val = {
        longlabel : longlabel,
        shortlabel : shortlabel
    };

    for (var i = 0; i < keys.length; i++) {
        if (modificationMapping.hasOwnProperty(keys[i])) {
            log('Warning: The mapping of modification keys has' +
                    ' already a mapping for key: ' + keys[i]);
        } else {
            modificationMapping[keys[i]] = val;
        }
    }
};

/**
 * Retrieve the class and generator from a mapping object. When the mapping
 * object does not have an appropriate class or generator object an
 * exception will be thrown.
 *
 * @param {Object} mapping A mapping object, i.e. an object with SBO ids
 *   as keys. The values should be objects will at least a 'klass'
 *   property.
 * @param {Number} sbo The SBO id.
 * @return {Object} An object with a 'klass' and an optional 'generator'
 *   property.
 */
var retrieveFrom = function(mapping, sbo) {
    if (mapping.hasOwnProperty(sbo)) {
        return mapping[sbo];
    } else {
        throw('Warning: SBO id "' + sbo + '" could not be found.');
    }
};

/**
 * Retrieve the SBO key for an instance of class.
 *
 * @param {Object} mapping A mapping object for SBO mapping. Most commonly the
 *   nodeMapping object will be used for this.
 * @param {Object} instance An object which is an instance of one of the mapped
 *   classes.
 * @return {Number} The found SBO id or null in case no mapping could be found.
 */
var getSBOForInstance = function(mapping, instance) {
    for (var sbo in mapping) {
        if (mapping.hasOwnProperty(sbo)) {
            var klass = mapping[sbo].klass;

            if ((typeof(klass) === 'function') && (instance instanceof klass)) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};

/**
 * Determine the SBO ID for a modification label using the
 * modificationsMapping, both labels, i.e. shortlabel and longlabel, will be matched
 * against the first parameter.
 *
 * @param {String} label The label for which the SBO ID should be determined.
 * @return {Number} SBO id or null in case no SBO could be found.
 */
var getModificationSBOForLabel = function(label) {
    label = label.toLowerCase();

    for (var sbo in modificationMapping) {
        if (modificationMapping.hasOwnProperty(sbo)) {
            var mapping = modificationMapping[sbo];

            if (label === mapping.shortlabel.toLowerCase() ||
                    label === mapping.longlabel.toLowerCase()) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};

/**
 * Determine the SBO ID for an edge marker id using the
 * edgeMarkerMapping.
 *
 * @param {String} id The connecting arcs (marker) id.
 * @return {Number} SBO id or null in case no SBO could be found.
 */
var getSBOForMarkerId = function(id) {
    for (var sbo in edgeMarkerMapping) {
        if (edgeMarkerMapping.hasOwnProperty(sbo)) {
            var mapping = edgeMarkerMapping[sbo];

            if (mapping.klass === id) {
                return bui.util.toNumber(sbo);
            }
        }
    }

    return null;
};


/**
 * Export SBO helpers to bui.util namespace
 * 
 */
(function(bui){
  
  bui.util.getSBOForMarkerId = getSBOForMarkerId;
  bui.util.getModificationSBOForLabel = getModificationSBOForLabel;
  bui.util.getSBOForInstance = getSBOForInstance;
  bui.util.retrieveFrom = retrieveFrom;
})(bui);
(function(bui) {
    var identifier = 'bui.Observable';

    /**
     * @class
     * By inheriting from this class you can allow observers. Please note
     * that you have to add types using the {@link bui.Observable#addType}
     * function before listener can be added.
     *
     * @extends bui.Object
     */
    bui.Observable = function() {
        bui.Observable.superClazz.call(this);
        this._getPrivateMembers(identifier).listener = {};
    };

    var staticListeners = {};

    /**
     * @description
     * Get static listeners for the specific type
     *
     * @param {Object} type The type for which a collection of static listeners
     *   should be returned.
     *
     * @return {Object} Hash of static listeners.
     */
    var getStaticListeners = function(type) {
        return staticListeners[type] = staticListeners[type] || {};
    };

    /**
     * @description
     * Bind listeners to class-level events, i.e., receive the specific event
     * from all instances of the class.
     *
     * @param {String} type The type of event that should be observed
     * @param {Function} callback Method to be called
     * @param {Object} [identification] An identifier used to identify the
     *   listener in the list of all over listeners. Should be unique for
     *   the listener type. When ommited the callback will be used for
     *   identification purposes.
     */
    bui.Observable.bindStatic = function(type, callback, identification) {
        var listener = getStaticListeners(type);

        if (identification === undefined || identification === null) {
            identification = callback;
        }

        listener[identification] = callback;
    };

    /**
     * @description
     * Function which can be used to unbind ALL static listeners.
     * This method should seldomly be used and if used, it should only
     * be used with care.
     */
    bui.Observable._unbindAllStatic = function() {
        staticListeners = {};
    };

    bui.Observable.prototype = {
        /**
         * @description
         * Add a listener type to this observable object. An added listener
         * type allows to register listeners and fire events specific to
         * this type.
         *
         * @param {String|Object} type The new type - a string which describes
         *   it or an object (map) for which all values
         *   (please note it's values - not keys) are used and added as types.
         * @return {bui.Observable} Fluent interface
         */
        _addType : function(type) {
            var listener = this._getPrivateMembers(identifier).listener;

            if (typeof(type) === 'string') {
                listener[type] = {};
            } else {
                for (var i in type) {
                    if (type.hasOwnProperty(i)) {
                        listener[type[i]] = {};
                    }
                }
            }

            return this;
        },

        /**
         * @description
         * Bind listener to a specific type
         *
         * @param {String} type The type of event that should be observed
         * @param {Function} callback Method to be called
         * @param {Object} [identification] An identifier used to identify the
         *   listener in the list of all over listeners. Should be unique for
         *   the listener type. When ommited the callback will be used for
         *   identification purposes.
         * @return {bui.Observable} Fluent interface
         */
        bind : function(type, callback, identification) {
            var listener = this._getPrivateMembers(identifier).listener[type];

            // type not registered, fail silently
            if (listener === undefined) {
                return this;
            }

            if (identification === undefined || identification === null) {
                identification = callback;
            }

            listener[identification] = callback;

            return this;
        },

        /**
         * @description
         * Unbind a listener from a specific event.
         *
         * To unbind all listener, call this function without any parameter.
         * To unbind all listener just for a specific type call this method
         * with the type and omit the identification.
         *
         * @param {String} [type] listener type identification
         * @param {String} [identification] identifies the listener which
         *   should be unbound
         * @return {bui.Observable} Fluent interface
         */
        unbind : function(type, identification) {
            var listener = this._getPrivateMembers(identifier).listener;

            if (type === undefined) {
                for(var registeredType in listener) {
                    if (listener.hasOwnProperty(registeredType)) {
                        listener[registeredType] = {};
                    }
                }
            } else if (identification === undefined) {
                listener[type] = {};
            } else {
                delete listener[type][identification];
            }

            return this;
        },

        /**
         * Unbind all listeners with the provided identification.
         *
         * @param {String} identification Listener identification
         * @return {bui.Observable} Fluent interface
         */
        unbindAll : function(identification) {
            var listener = this._getPrivateMembers(identifier).listener;

            for(var type in listener) {
                if (listener.hasOwnProperty(type)) {
                    delete listener[type][identification];
                }
            }

            return this;
        },

        /**
         * @description
         * Fire an event
         *
         * @param {String} type listener type identification
         * @param {Object[]} [params] Parameters to be passed to the listener
         * @return {Boolean} True when every listener returned a value !==
         *   false, false otherwise.
         */
        fire : function(type, params) {
            var i, listener;

            if (params === undefined) {
                params = [];
            }

            listener = this._getPrivateMembers(identifier).listener[type];

            // fail silently when the listener type is not registered
            if (listener === undefined) {
                return true;
            }

            for (i in listener) {
                if (listener.hasOwnProperty(i)) {
                    var status = listener[i].apply(this, params);

                    if (status === false) {
                        return false;
                    }
                }
            }

            listener = getStaticListeners(type);

            if (params.length === 0) {
                params = [this];
            } else if (params[0] !== this) {
                params.unshift(this);
            }

            for (i in listener) {
                if (listener.hasOwnProperty(i)) {
                    var status = listener[i].apply(this, params);

                    if (status === false) {
                        return false;
                    }
                }
            }


            return true;
        }
    };

    bui.util.setSuperClass(bui.Observable, bui.Object);
})(bui);
(function(bui) {
    /**
     * @namespace Generator functions for connecting arcs can be found as
     * properties of this object.
     */
    bui.connectingArcs = {};

    var connectingArcIdCounter = 0;

    /**
     * @private
     * Helper function for the generation of SVGMarkerElement elements.
     *
     * @param {String} id The id for the element.
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @param {Number} [markerWidthCorrection] Correction of the markers width.
     *   This value will be multiplied to the width attribute for the
     *   markerWidth attribute. Defaults to 1, i.e. no changes.
     * @return {SVGMarkerElement} The generated marker element.
     */
    var createMarker = function(id, data, refX, refY, width, height, classes,
                                markerWidthCorrection) {
        if (markerWidthCorrection === undefined) {
            markerWidthCorrection = 1;
        }

        var marker = document.createElementNS(bui.svgns, 'marker');
        marker.setAttributeNS(null, 'id', id);
        marker.setAttributeNS(null, 'orient', 'auto');
        marker.setAttributeNS(null, 'refX', refX);
        marker.setAttributeNS(null, 'refY', refY);
        marker.setAttributeNS(null, 'markerWidth',
                width * markerWidthCorrection);
        marker.setAttributeNS(null, 'markerHeight', height);
        marker.setAttributeNS(null, 'viewBox',
                ['-2 -2', width+4, height+4].join(' '));

        if (classes !== undefined) {
            marker.setAttributeNS(null, 'class', classes);
        }

        if (typeof(data) == 'string') {
            var path = document.createElementNS(bui.svgns, 'path');
            path.setAttributeNS(null, 'd', data);
            if(classes == bui.settings.css.classes.connectingArcs.assignment || classes == bui.settings.css.classes.connectingArcs.production)
                path.setAttributeNS(null, 'fill', 'black');
            else
                path.setAttributeNS(null, 'fill', 'white');
            path.setAttributeNS(null, 'stroke', 'black');
            marker.appendChild(path);
        } else {
            marker.appendChild(jQuery(data).clone(false)[0]);
        }

        return marker;
    };

    /**
     * @private
     * Helper function for the generation of SVGPathElement elements.
     *
     * @param {String|Element} data If you pass a String, a SVGPathElement
     *   will be created and its data attribute filled with the value of this
     *   parameter. In every other case it will be assumed that it's a valid
     *   SVG object and it will be added as a child to the generated marker
     *   element.
     * @param {Number} refX Value for the refX attribute
     * @param {Number} refY Value for the refY attribute
     * @param {Number} width Value for the markerWidth and viewBox attribute
     * @param {Number} height Value for the markerHeight and viewBox attribute
     * @param {String} [classes] CSS classes which should be applied to the
     *   marker element.
     * @return {Object} An object with id, hoverId, element and hoverElement
     *   properties. The id property holds the marker's id and the element
     *   property the SVGMarkerElement.
     */
    var createPathWithData = function(data, refX, refY, width, height, classes)
    {
        var id = (bui.settings.idPrefix.connectingArc +
                connectingArcIdCounter++),
                hoverId = bui.util.getHoverId(id);

        var element = createMarker(id, data, refX, refY, width, height,
                classes),
                hoverElement = createMarker(hoverId, data, refX, refY,
                        width, height, classes,
                        bui.settings.style.markerWidthCorrection);

        return {
            id : id,
            hoverId : hoverId,
            element : element,
            hoverElement : hoverElement
        };
    };

    /**
     * Generator for a assignment connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.assignment = function() {
        return createPathWithData('M0,0 S10,10,0,20 L20,10 Z', 20, 10, 20, 20,
                bui.settings.css.classes.connectingArcs.assignment);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.assignment.id = 'assignment';
    

    /**
     * Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.absoluteStimulation = function() {
        return createPathWithData('M0,0 L0,20 L10,15 L10,5 L0,0 Z M10,0 L10,20 L25,10Z', 25, 10, 35, 20,
                bui.settings.css.classes.connectingArcs.stimulation);
    };
    bui.connectingArcs.absoluteStimulation.id = 'absoluteStimulation';

    /**
     * Generator for a stimulation connecting arc.
     *
     * This generates a simple triangle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.stimulation = function() {
        return createPathWithData('M0,0L20,10L0,20Z', 20, 10, 20, 20,
                bui.settings.css.classes.connectingArcs.stimulation);
    };
    bui.connectingArcs.stimulation.id = 'stimulation';


    /**
    * Generator for a production connecting arc.
    *
    * This generates a simple triangle.
    *
    * @return {Object} An object with id and element properties. The id
    *   property holds the id of the marker and the element property the
    *   generated element.
    */
    bui.connectingArcs.production = function() {
       return createPathWithData('M0,0L20,10L0,20Z', 20, 10, 20, 20,
                                 bui.settings.css.classes.connectingArcs.production);
    };
    
    /**
    * @field Identifier for this connecting arc type.
    */
    bui.connectingArcs.production.id = 'production';
    
    
    /**
    * Generator for a substrate connecting arc.
    *
    * This generates nothing.
    *
    * @return {Object} An object with id and element properties. The id
    *   property holds the id of the marker and the element property the
    *   generated element.
    */
    bui.connectingArcs.substrate = function() {
       return createPathWithData('', 20, 10, 20, 20,
                                 bui.settings.css.classes.connectingArcs.substrate);
    };
    
    /**
    * @field Identifier for this connecting arc type.
    */
    bui.connectingArcs.substrate.id = 'substrate';
    
    
    /**
     * Generator for an inhibition connecting arc.
     *
     * This generates a simple line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.inhibition = function() {
        return createPathWithData('M0,0 V20 H1 V0 H1 V20 Z', 0, 10, 6, 24);
    };
    
    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.inhibition.id = 'inhibition';

    /**
     * Generator for a absolute inhibition connecting arc.
     *
     * This generates an inhibition with an additional line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.absoluteInhibition = function() {
        return createPathWithData('M0,0 V25 M10,0 V25Z', 10, 12, 10, 26,
            bui.settings.css.classes.connectingArcs.necessaryStimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.absoluteInhibition.id = 'absoluteInhibition';
    
    /**
     * Generator for a catalysis connecting arc.
     *
     * This generates a circle.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.catalysis = function() {
        var circle = document.createElementNS(bui.svgns, 'circle');
        circle.setAttributeNS(null, 'cx', 10);
        circle.setAttributeNS(null, 'cy', 10);
        circle.setAttributeNS(null, 'r', 10);
        circle.setAttributeNS(null, 'fill', 'white');
        circle.setAttributeNS(null, 'stroke', 'black');

        return createPathWithData(circle, 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.catalysis);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.catalysis.id = 'catalysis';


    /**
     * Generator for a control connecting arc.
     *
     * This generates a diamond.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.control = function() {
        return createPathWithData('M10,0L20,10L10,20L0,10Z', 20, 10, 20, 20,
            bui.settings.css.classes.connectingArcs.control);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.control.id = 'control';

    /**
     * Generator for a necessary stimulation connecting arc.
     *
     * This generates an arrow with an additional line.
     *
     * @return {Object} An object with id and element properties. The id
     *   property holds the id of the marker and the element property the
     *   generated element.
     */
    bui.connectingArcs.necessaryStimulation = function() {
        return createPathWithData('M0,0 V20 M10,0 L25,10L10,20Z', 25, 10, 26, 26,
            bui.settings.css.classes.connectingArcs.necessaryStimulation);
    };

    /**
     * @field Identifier for this connecting arc type.
     */
    bui.connectingArcs.necessaryStimulation.id = 'necessaryStimulation';
})(bui);

(function(bui) {
    // used to identify and compare the graph instances
    var graphCounter = 0;

    var identifier = 'Graph';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Graph} graph
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(graph) {
        return identifier + graph.id();
    };

    /**
     * @private
     * Used to generate the transform attribute value of the _rootGroup
     * element. Extracted to a function as this may be required several
     * times.
     */
    var __setTransformString = function() {
        var privates = this._privates(identifier);
        var value = [
                ['scale(', privates.scale.toString(), ')'].join(''),
                ['translate(', privates.x, ', ', privates.y, ')'].join('')
            ].join(' ');

        privates.rootGroup.setAttribute('transform', value);
    };

    /**
     * @private
     * Extracted because this function is called from the constructor and from
     * rawSVG in order to replace it for the export process.
     */
    var __getStylesheetContents = function() {
        return '@import url("' + bui.settings.css.stylesheetUrl + '\");';
    };

    var gestureStart = function(event) {
        // Only fire if event isn't propagating from a child element
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.gestureStart, [this, event]);
        }
    };

    var gestureMove = function(event) {
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.gestureMove, [this, event]);
        }
    };

    var gestureEnd = function(event) {
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.gestureEnd, [this, event]);
        }
    };

    var dragStart = function(event) {
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.dragStart, [this, event]);
        }
    };

    var dragMove = function(event) {
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.dragMove, [this, event]);
        }
    };

    var dragEnd = function(event) {
        if (event.target === this._privates(identifier).root) {
            this.fire(bui.Graph.ListenerType.dragEnd, [this, event]);
        }
    };

    var mouseWheel = function(event) {
        this.fire(bui.Graph.ListenerType.wheel, [this, event]);
    };
    
    var gesturePanAndZoom = function(graph, event) {
        var privates = graph._privates(identifier),
            newScale = privates.scale * (1 + event.detail.ds),
            dx,
            dy;

        if (newScale > 0) {
            // Scaling the graph calls reduceCanvasSize(). This brings it back to place.
            dx = privates.x;
            dy = privates.y;
            
            if (privates.enablePanning) {
                // So that the graph follows the gesture
                dx += event.detail.dx / newScale;
                dy += event.detail.dy / newScale;
            }
        
            if (privates.enableZooming) {
                // So that the graph is scaled with the gesture cordinate as the center
                dx -= ((event.detail.pageX - privates.rootOffset.x) * event.detail.ds) / newScale;
                dy -= ((event.detail.pageY - privates.rootOffset.y) * event.detail.ds) / newScale;
                
                graph.scale(newScale);
            }
            graph.translate(dx, dy);
        }
     };
     
    // create eventListener delegate functions
    var panStart = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enablePanning) {
            return event;
        }
        privates.panPosition = graph.translate();
    };
    
    var panMove = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enablePanning) {
            return event;
        }
        
        if ((event.type === 'interactdragmove' && this.highPerformance()) ||
            (event.type === 'interactdragend' && !this.highPerformance())) {
            
            privates.panPosition.x += event.detail.dx / privates.scale;
            privates.panPosition.y += event.detail.dy / privates.scale;

            this.translate(privates.panPosition.x, privates.panPosition.y);
        }
    };
    
    var wheelZoom = function (graph, event) {
        var privates = graph._privates(identifier);
        
        if (!privates.enableZooming || !event.altKey) {
            return event;
        }
        
        event.preventDefault();
        
        var wheelDelta = event.wheelDelta || event.deltaY * -1 || event.detail,
            ds = 0.2 * (wheelDelta > 0? 1: -1),
            newScale = privates.scale * (1 + ds),
            dx,
            dy;

        if (newScale > 0 && wheelDelta !== 0) {
            // Scaling the graph calls reduceCanvasSize(). This brings it back to place.
            dx = privates.x;
            dy = privates.y;
        
            // So that the graph is scaled with the gesture cordinate as the center
            dx -= ((event.pageX - privates.rootOffset.x) * ds) / newScale;
            dy -= ((event.pageY - privates.rootOffset.y) * ds) / newScale;
            
            graph.scale(newScale);
            graph.translate(dx, dy);
        }
    };

    /**
     * @private
     * Extracted from the constructor to improve readability
     */
    var __initialPaintGraph = function() {
        var privates = this._privates(identifier);

        var div = document.createElement('div');
        privates.container.appendChild(div);

        privates.root = document.createElementNS(bui.svgns, 'svg');
        privates.root.setAttribute('xmlns', bui.svgns);
        privates.root.setAttribute('id', privates.id);
        div.appendChild(privates.root);

        var offset = jQuery(privates.root).offset();
        privates.rootOffset = {
            x : offset.left,
            y : offset.top
        };

        privates.rootDimensions = {
            width : jQuery(privates.root).width(),
            height : jQuery(privates.root).height()
        };

        privates.defsGroup = document.createElementNS(bui.svgns, 'defs');
        privates.root.appendChild(privates.defsGroup);

        privates.css = document.createElementNS(bui.svgns, 'style');
        privates.css.setAttribute('type', 'text/css');
        privates.css.textContent = __getStylesheetContents();
        privates.root.appendChild(privates.css);

        privates.rootGroup = document.createElementNS(bui.svgns, 'g');
        __setTransformString.call(this);
        privates.root.appendChild(privates.rootGroup);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.nodeGroup);

        privates.edgeGroup = document.createElementNS(bui.svgns, 'g');
        privates.rootGroup.appendChild(privates.edgeGroup);

        privates.connectingArcs = {};

        privates.stateVarLocation = document.createElementNS(bui.svgns, 'pattern');
        privates.stateVarLocation.setAttribute('id', 'stateVariableLocation');
        privates.stateVarLocation.setAttribute('patternUnits','objectBoundingBox');
        privates.stateVarLocation.setAttribute('x','0');
        privates.stateVarLocation.setAttribute('y', '0');
        privates.stateVarLocation.setAttribute('width', '14');
        privates.stateVarLocation.setAttribute('height', '14');
        privates.locationRect = document.createElementNS(bui.svgns, 'path');
        privates.locationRect.setAttribute('d' , 'M0,14 L14,0 M7,7 L14,14 Z');
        privates.locationRect.setAttribute('style', "stroke-width:2;stroke:rgb(0,0,0)")
        privates.stateVarLocation.appendChild(privates.locationRect);
        privates.defsGroup.appendChild(privates.stateVarLocation);

        for (var i in bui.connectingArcs) {
            if (bui.connectingArcs.hasOwnProperty(i)) {
                var ca = bui.connectingArcs[i]();
                var id = bui.connectingArcs[i].id;
                privates.connectingArcs[id] = ca;

                privates.defsGroup.appendChild(ca.element);
                privates.defsGroup.appendChild(ca.hoverElement);
            }
        }
        
        privates.root.addEventListener(
                ('onmousewheel' in document)
                ? 'mousewheel'
                : 'wheel',
                mouseWheel.createDelegate(this));
            
        // Add interact.js event listeners
        privates.root.addEventListener('interactgesturemove', gestureMove.createDelegate(this));
        privates.root.addEventListener('interactdragstart', dragStart.createDelegate(this));
        privates.root.addEventListener('interactdragmove', dragMove.createDelegate(this));
        privates.root.addEventListener('interactdragend', dragEnd.createDelegate(this));
        
        // Set as interactable
        interact.set(privates.root, {
                gesture: true,
                drag: true,
                autoScroll: false,
                actionCheck: function (event) {
                    return 'drag';
                },
				checkOnHover: false
            });
    };

    /**
     * @private
     * This function makes sure that each node fits onto the SVG canvas.
     * In order to do so it's a observer of the nodes' position and size
     * events.
     */
    var __assertCanvasSize = function(node) {
        var privates = this._privates(identifier);

        var bottomRight = node.absoluteBottomRight();

        if (bottomRight.x > privates.rootDimensions.width) {
            privates.rootDimensions.width = bottomRight.x + privates.x;
            privates.root.setAttribute('width', bottomRight.x + privates.x);
        }

        if (bottomRight.y > privates.rootDimensions.height) {
            privates.rootDimensions.height = bottomRight.y + privates.y;
            privates.root.setAttribute('height', bottomRight.y + privates.y);
        }
    };

    /**
     * @private
     * Generic drawable remove listener.
     */
    var __removed = function(drawable) {
        delete this._privates(identifier).drawables[drawable.id()];
    };

    /**
     * @class
     * This class controls the whole graph and is responsible for the
     * management of nodes and edges, i.e. drawables.
     *
     * @extends bui.Observable
     * @constructor
     *
     * @param {HTMLElement} container where the graph should go
     */
    bui.Graph = function(container) {
        bui.Graph.superClazz.call(this);

        this._addType(bui.Graph.ListenerType);

        var privates = this._privates(identifier);
        privates.id = bui.settings.idPrefix.graph + graphCounter++;
        privates.container = container;
        if ( container == null ) {    // don't break here, just throw a message
            console.error('Warning: Invalid container element specified. Using document.body instead.');
            privates.container = document.body;
        }
        privates.drawables = {};
        privates.idCounter = 0;
        privates.scale = 1;
        privates.x = 0;
        privates.y = 0;
        privates.enablePanning = true;
        privates.enableZooming = true;
        privates.highPerformance = bui.settings.initialHighPerformance;

        this.bind(bui.Graph.ListenerType.dragStart,
                panStart.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.dragMove,
                panMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.dragEnd,
                panMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.gestureMove,
                gesturePanAndZoom.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Graph.ListenerType.wheel,
                wheelZoom.createDelegate(this),
                listenerIdentifier(this));

        __initialPaintGraph.call(this);
    };

    bui.Graph.prototype = {
	identifier : function() {
	    return identifier;
	},
        /**
         * @description
         * Retrieve the graph's id.
         *
         * @return {String} graph id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * Retrieve the SVG element's offset relative to the document
         *
         * @return {Object} an object with x and y properties
         */
        htmlTopLeft : function() {
            return this._privates(identifier).rootOffset;
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        topLeft : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * A function which always returns position 0/0. This follows the
         * special case pattern.
         *
         * @return {Object} An object with x and y properties which are both
         *   zero.
         */
        absolutePosition : function() {
            return {
                x : 0,
                y : 0
            };
        },

        /**
         * @description
         * Retrieve the container which was provided to this object during
         * the creation.
         *
         * @return {HTMLElement} The container of this graph
         */
        container : function() {
            return this._privates(identifier).container;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all egdes are placed.
         *
         * @return {SVGGElement} Edge container
         */
        edgeGroup : function() {
            return this._privates(identifier).edgeGroup;
        },

        /**
         * @description
         * Retrieve the SVG group element in which all nodes are placed.
         *
         * @return {SVGGElement} Node container
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },
        /**
         * Return the defs group of the svg so node classes can draw clone markers, ...
         *
         * @return {} SVG defsGroup
         */
        defsGroup : function() {
            return  this._privates(identifier).defsGroup;
        },

        /**
         * @description
         * Use this method to deactivate (suspend) redrawing of the SVG. This
         * function is most useful when multiple changes are made to the SVG
         * to improve performance significantly.
         *
         * @param {Integer} duration how long you wish to suspend redrawing
         * @return {Object} A suspend handle which can be passed to
         *   {@link bui.Graph#unsuspendRedraw} to enable redrawing.
         */
        suspendRedraw : function(duration) {
            if (bui.settings.staticSVG) return 0; 
            return this._privates(identifier).root.suspendRedraw(duration);
        },

        /**
         * @description
         * Used to enable redrawing. You can either unsuspend a specific
         * suspension by passing the suspend handle to this function or
         * unsuspend all by passing no parameter.
         *
         * @param {Object} [handle] the suspend handle. Can be omitted to
         *   unsuspend all.
         * @return {bui.Graph} Fluent interface
         */
        unsuspendRedraw : function(handle) {
            if (bui.settings.staticSVG) return; 
            if (handle !== undefined) {
                this._privates(identifier).root.unsuspendRedraw(handle);
            } else {
                this._privates(identifier).root.unsuspendRedrawAll();
            }

            return this;
        },

        /**
         * @description
         * Used to enable/disable panning of a graph from gesture or dragging
         *
         * If you omit the parameter a value for whether panning is
         * enabled is returned.
         *
         * @param {Boolean} [pan] True to enable panning or
         *   false to disable.
         * @return {bui.Graph|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the graph will be returned.
         */
        enablePanning : function(pan) {
            var privates = this._privates(identifier);

            if (pan !== undefined) {
                if (privates.enablePanning !== pan) {
                    privates.enablePanning = pan;
                }
                return this;
            }

            return privates.enablePanning;
        },

        /**
         * @description
         * Used to enable/disable zooming of a graph from mouse Wheel
         * or pinch gesture
         *
         * If you omit the parameter a value for whether zooming is
         * enabled is returned.
         *
         * @param {Boolean} [zoom] True to enable zooming or
         *   false to disable.
         * @return {bui.Graph|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the graph will be returned.
         */
        enableZooming : function(zoom) {
            var privates = this._privates(identifier);

            if (zoom !== undefined) {
                if (privates.enableZooming !== zoom) {
                    privates.enableZooming = zoom;
                }
                return this;
            }

            return privates.enableZooming;
        },

        /**
         * @description
         * Scale the graph by passing a number to this function. To have the
         * standard scale level pass one (1) to this function. To double the
         * size pass two (2).
         *
         * You can also retrieve the current scale by calling this function
         * without parameters.
         *
         * @param {Number} [scale] The new scale, one (1) means 100%.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current scale is returned
         */
        scale : function(scale) {
            var privates = this._privates(identifier);

            if (scale !== undefined) {
                if (scale !== privates.scale) {
                    privates.scale = scale;

                    __setTransformString.call(this);
                    this.reduceCanvasSize();

                    this.fire(bui.Graph.ListenerType.scale, [this, scale]);
                }

                return this;
            }

            return privates.scale;
        },

        /**
         * @description
         * Transate the graph or retrieve the current translation
         *
         * @param {Number} [x] The new translation in x-axis.
         * @param {Number} [y] The new translation in y-axis.
         * @return {bui.Graph|Number} Fluent interface if you pass a parameter,
         *   otherwise the current translation is returned
         */
        translate : function(x, y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                if (x !== privates.x || y !== privates.y) {
                    privates.x = x;
                    privates.y = y;

                    __setTransformString.call(this);
                    this.reduceCanvasSize();

                    this.fire(bui.Graph.ListenerType.translate, [this, x, y]);
                }

                return this;
            }

            return {
                x: privates.x,
                y: privates.y
            };
        },

        /**
         * @description
         * Get the graph coordinates that correspond to a point on the page
         * This does not take into account the offset of the graph's SVG Element
         *
         * @param {Number} [x] The x value of the cordinates
         * @param {Number} [y] The y value of the cordinates
         * @return {Object} An object with properties x and y which are the transformed coordinates
         */
        toGraphCoords : function(x, y) {
            var privates = this._privates(identifier);

            return {
                x: x / privates.scale - privates.x,
                y: y / privates.scale - privates.y
            };
        },

        /**
         * @description
         * Get the page coordinates that correspond to a point on the graph
         * This does not take into account the offset of the graph's SVG Element
         *
         * @param {Number} [x] The x value of the cordinates
         * @param {Number} [y] The y value of the cordinates
         * @return {Object} An object with properties x and y which are the transformed coordinates
         */
        toPageCoords : function(x, y) {
            var privates = this._privates(identifier);

            return {
                x: (x + privates.x) * privates.scale,
                y: (y + privates.y) * privates.scale
            };
        },

        /**
        /**
         * Fit the Graph to the viewport, i.e. scale the graph down to show
         * the whole graph or (in the case  of a very small graph) scale it
         * up.
         *
         * @return {bui.Graph} Fluent interface
         */
        fitToPage : function() {
            var dimensions = this._privates(identifier).rootDimensions;
            
            this.translate(0,0);
            this.scale(1);

            var viewportWidth = $(window).width();
            var viewportHeight = $(window).height();

            var scale = Math.min(viewportWidth / dimensions.width,
                    viewportHeight / dimensions.height);
            this.scale(scale);

            return this;
        },

        /**
         * @description
         * Add a drawable to this graph by calling this function with the
         * constructor of a drawable type. The object will be completely
         * instantiated and associated to the graph, thus ready to be used.
         *
         * @param {Function} constructor The constructor function for the
         *   drawable.
         * @param {Object} [params] Parameters which should be supplied to the
         *   constructor.
         * @return {bui.Drawable} The constructed drawable object.
         */
        add : function(constructor, id, params) {
            var privates = this._privates(identifier);
            var drawable = null;
            var counter_id = privates.idCounter++;

            if (params === undefined) {
                params = {};
            }

            if (id == undefined)
                params.id = 'drawable'+counter_id
            else
                params.id = id;
            if (privates.drawables.hasOwnProperty(id)) console.log("graph: adding duplicate id " + id);
            
            params.graph = this;

            drawable = new constructor(params);

            privates.drawables[drawable.id()] = drawable;

            drawable.bind(bui.Drawable.ListenerType.remove,
                    __removed.createDelegate(this),
                    listenerIdentifier(this));

            // every node type has a bottomRight property. We use this to
            // identify them.
            if (drawable.bottomRight !== undefined) {
                drawable.bind(bui.Node.ListenerType.position,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                drawable.bind(bui.Node.ListenerType.size,
                        this.reduceCanvasSize.createDelegate(this),
                        listenerIdentifier(this));
                this.reduceCanvasSize.call(this, drawable);
            }

            this.fire(bui.Graph.ListenerType.add, [drawable]);

            return drawable;
        },

        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        
        clear : function() {
           var privates = this._privates(identifier);
           for (var i in privates.drawables){
              privates.drawables[i].remove();
           }
           //privates.idCounter=0;
        },
 
        /**
         * Reduce the Canvas size to the minimum requirement
         *
         * @return {bui.Graph} Fluent interface
         */
        reduceCanvasSize : function() {
            var privates = this._privates(identifier);

            var maxX = Number.MIN_VALUE,
                    maxY = Number.MIN_VALUE;

            for (var i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    var drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        var bottomRight = drawable.absoluteBottomRight();

                        maxX = Math.max(maxX, bottomRight.x + privates.x);
                        maxY = Math.max(maxY, bottomRight.y + privates.y);
                    }
                }
            }

            var padding = bui.settings.style.graphReduceCanvasPadding;
            maxX = Math.max((maxX + padding) * privates.scale, padding);
            maxY = Math.max((maxY + padding) * privates.scale, padding);

            privates.rootDimensions.width = maxX;
            privates.root.setAttribute('width', maxX);

            privates.rootDimensions.height = maxY * privates.scale;
            privates.root.setAttribute('height', maxY);
        },

        /**
         * Retrieve the connecting arcs.
         *
         * @return {Object} You will retrieve the connecting arcs
         * in the following form:
         * {
         *   stimulation : { // id of the connecting arc type
         *     id : 'foo', // the id with which the marker can be referenced
         *     element : {} // instance of SVGMarkerElement
         *   },
         *   // more types may be here
         * }
         */
        connectingArcs : function() {
            return this._privates(identifier).connectingArcs;
        },

        /**
         * Return the raw SVG.
         *
         * Please note that the execution of this method may take a while as an
         * additional HTTP request needs to be made in order to retrieve the
         * stylesheet. The result is the complete SVG with embedded CSS.
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
        rawSVG : function() {
            var inner = this._privates(identifier).root.parentNode.innerHTML;

            // minimal fallback style
            //var css = '.line { fill: none; stroke: black; }; .hidden { visibility: none; }; ';
            var css = '.hidden { visibility: hidden; } /* * Please copy all changes to the .defaultText css class in the * visualization-html.css file. */ text { font-family: "Times-Roman"; font-size: 19px; fill: black; } /* * Please copy all changes to the .smallText css class in the * visualization-html.css file. */ text.small { font-size: 13px; } ellipse, circle, g.rect > path, g.complex > path, g.compartment > rect, g.process > rect{ fill: white; stroke-width: 2px; stroke: black } g.hideBorder > path { stroke: white; } ellipse.selected, circle.selected { fill: #eee; } line { stroke: #000; } .stimulation, .catalysis, .modulation, .necessaryStimulation, .substrate { fill: white; stroke: black; } .line { fill: none; stroke: black; } .lineHover { stroke-width: 4; } .dotted { stroke-dasharray: 1, 3; } .dashed { stroke-dasharray: 4, 5; } .splineEdgeHandle circle { fill: #9ea5ff; stroke: blue; opacity: 0.5; } .splineEdgeHandle.autoAlign circle { opacity: 0.2; } .Outcome { fill: #000000; }';

            jQuery.ajax({
                        url : bui.settings.css.stylesheetUrl,
                        async : false,
                        dataType : 'text',
                        success : function(data) {
                            css = data;
                        }
                    });

            inner = inner.replace(__getStylesheetContents(), css);

            return inner;
        },
 
 
         /**
         * replace the css import directive in svg by an actual css code and return SVG.
         *
         *
         * @return {String} The raw SVG as it can be used to save / export it.
         */
         cssSVG : function(css) {
            var inner = this._privates(identifier).root.parentNode.innerHTML;
            
            inner = inner.replace(__getStylesheetContents(), css);
            
            return inner;
         },
 
        /**
         * A graph supports a high and low performance mode. This has
         * implications on the way dragging and resizing is realized. When in
         * high performance mode the SVG will be changed while dragging or
         * resizing the node. In low performance mode this will only be done
         * at the end of the dragging or resizing.
         *
         * @param {Boolean} [highPerformance] Set the performance for this
         *   graph to high (true) or low (false). Omit to retrieve current
         *   performance setting.
         * @return {Boolean|bui.Graph} If you pass a boolean to this function
         *   it will set the new value and return the instance of the object
         *   on which you called the function (fluent interface). If you don't
         *   pass a parameter the current setting will be removed.
         */
        highPerformance : function(highPerformance) {
            var privates = this._privates(identifier);

            if (highPerformance !== undefined) {
                privates.highPerformance = highPerformance;
                return this;
            }

            return privates.highPerformance;
        },

        /**
         * Retrieve an object which holds references to all the graph's
         * drawables.
         *
         * @return {Object} Key/value store of the graph's drawables. The keys
         *   are the drawable's IDs. The value is the drawable instance
         *   reference.
         */
        drawables : function() {
            return this._privates(identifier).drawables;
        },

        /**
         * Export the whole graph to JSON.
         *
         * @return {Object} The exported graph.
         */
        toJSON : function(useDataObject) {
            var json = {sbgnlang:bui.settings.SBGNlang}, edges = [], nodes = [];

            var dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.nodes, nodes);
            updateJson(json, dataFormat.edges, edges);

            var drawables = this._privates(identifier).drawables;

            for (var key in drawables) {
                if (drawables.hasOwnProperty(key) &&
                        drawables[key].includeInJSON !== false) {
                    var drawable = drawables[key];

                    if (drawable.drawableType() === 'node') {
                        nodes.push(drawable.toJSON());
                    } else {
                        edges.push(drawable.toJSON());
                    }
                }
            }

            return json;
        },

        /**
         * Reduce the whitespace on top and left hand side of the graph. This
         * isn't done automatically through the
         * {@link bui.Graph#reduceCanvasSize} method as this would probably
         * confuse the user.
         *
         * @param {Boolean} [duration] Pass a duration in milliseconds to
         *   animate the whitespace reduction. Defaults to no animation.
         * @return {bui.Graph} Fluent interface
         */
        reduceTopLeftWhitespace : function(duration) {
            duration = duration || 0;
            var padding = bui.settings.style.graphReduceCanvasPadding,
                    privates = this._privates(identifier),
                    minX = Number.MAX_VALUE,
                    minY = Number.MAX_VALUE,
                    i,
                    drawable,
                    topLeft;

            for (i in privates.drawables) {
                if (privates.drawables.hasOwnProperty(i)) {
                    drawable = privates.drawables[i];

                    if (drawable.bottomRight !== undefined) {
                        topLeft = drawable.absolutePosition();

                        minX = Math.min(minX, topLeft.x);
                        minY = Math.min(minY, topLeft.y);
                    }
                }
            }

            minX = Math.max(minX - padding, 0) * -1;
            minY = Math.max(minY - padding, 0) * -1;

            if (minX !== 0 || minY !== 0) {
                for (i in privates.drawables) {
                    if (privates.drawables.hasOwnProperty(i)) {
                        drawable = privates.drawables[i];

                        if ((drawable.bottomRight !== undefined) &&
                                (drawable.hasParent() === false) &&
                                (drawable.identifier() !== 'SplineEdgeHandle')) {
                            topLeft = drawable.position();

                            drawable.move(minX, minY, duration);
                        }
                    }
                }
            }

            return this;
        },
        /**
         * get or set the language
         * fluent interface
         *
         * @return string current SBGN language
         */
         language : function(lang){
            if(lang === undefined){
                return bui.settings.SBGNlang;
            }
            if(lang in {'ER':1,'PD':1,'AF':1}) bui.settings.SBGNlang = lang;
            return this;
         }
        

    };

    bui.util.setSuperClass(bui.Graph, bui.Observable);

    /**
     * @namespace
     * Observable properties of the Graph class
     */
    bui.Graph.ListenerType = {
        /** @field */
        add : bui.util.createListenerTypeId(),
        /** @field */
        scale : bui.util.createListenerTypeId(),
        /** @field */
        translate : bui.util.createListenerTypeId(),
        /** @field */
        dragStart : bui.util.createListenerTypeId(),
        /** @field */
        dragMove : bui.util.createListenerTypeId(),
        /** @field */
        dragEnd : bui.util.createListenerTypeId(),
        /** @field */
        gestureStart : bui.util.createListenerTypeId(),
        /** @field */
        gestureMove : bui.util.createListenerTypeId(),
        /** @field */
        gestureEnd : bui.util.createListenerTypeId(),
        /** @field */
        wheel : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'bui.Drawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Drawable} drawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(drawable) {
        return identifier + drawable.id();
    };

    /**
     * @class
     * The base class for every drawable item.
     *
     * As a general rule, the constructors of drawables should never be
     * called directly but through the {@link bui.Graph#add} function.
     *
     *
     * @extends bui.Observable
     * @constructor
     *
     * Please note that the arguments should be passed in the form of one
     * object literal.
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Drawable = function(args) {
        bui.Drawable.superClazz.call(this);
        this._addType(bui.Drawable.ListenerType);

        var privates = this._privates(identifier);
        privates.id = args.id;
        privates.graph = args.graph;
        privates.classes = [];
        privates.visible = false;
        privates.select = false;
        privates.json = null;
    };

    bui.Drawable.prototype = {
        /**
         * @description
         * Retrieve the drawable's id.
         *
         * @return {String} drawable id.
         */
        id : function() {
            return this._privates(identifier).id;
        },

        /**
         * @description
         * Retrieve the graph instance to which this drawable belongs.
         *
         * @return {bui.Graph} this node's graph
         */
        graph : function() {
            return this._privates(identifier).graph;
        },

        /**
         * @description
         * Remove this drawable from the graph.
         *
         * First all remove listeners will be informed about the event and then
         * all listeners will be unbound.
         */
        remove : function() {
            var privates = this._privates(identifier);
            if (privates.inremove) return; // avoid cyclic remove call when attached Drawables are removing this node again
            privates.inremove=true;
            this.fire(bui.Drawable.ListenerType.remove, [this]);
            this.unbind();
        },

        /**
         * @description
         * Use this function to select the drawable. Selection is normally done
         * by clicking on a drawable. Think of a file manager which provides
         * functionality to, for example, select multiple files and apply
         * actions to all selected files.
         *
         * If you omit the parameter the current selection status will be
         * returned.
         *
         * @param {Boolean} [select] True to select the drawable, false
         *   otherwise.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current selection state
         *   will be returned.
         */
        select : function(select) {
            var privates = this._privates(identifier);

            if (select !== undefined) {
                if (privates.select !== select) {
                    privates.select = select;

                    this.fire(bui.Drawable.ListenerType.select,
                            [this, select]);
                }

                return this;
            }

            return privates.select;
        },

        /**
         * @description
         * Drawables can be shown or hidden using this function.
         *
         * Retrieve the current visibility state by calling this function
         * without parameter.
         *
         * @param {Boolean} [visible] True to show the drawable, false to hide.
         *   Omit to retrieve current visibility setting.
         * @return {bui.Drawable|Boolean} Fluent interface when you pass a
         *   parameter to this function. If not, the current visibility state
         *   will be returned.
         */
        visible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                if (privates.visible !== visible) {
                    privates.visible = visible;

                    this.fire(bui.Drawable.ListenerType.visible,
                            [this, visible]);
                }

                return this;
            }

            return privates.visible;
        },

        /**
         * @description
         * Check whether two drawables belong to the same graph.
         *
         * @param {bui.Drawable} drawable Check if the drawable belongs to the
         *   same graph.
         * @return {Boolean} true when both belong to the same graph.
         */
        isSameGraph : function(drawable) {
            return this._privates(identifier).graph.id() ==
                    node._privates(identifier).graph.id();
        },

        /**
         * @description
         * Add a class to this drawable. This method accepts one or more
         * classes (var args).
         *
         * @param {String} klass the class which you want to add
         * @return {bui.Drawable} Fluent interface
         */
        addClass : function(klass) {
            var classes = this._privates(identifier).classes;

            var changed = false;

            for (var i = 0; i < arguments.length; i++) {
                klass = arguments[i];

                if (classes.indexOf(klass) == -1) {
                    classes.push(klass);
                    changed = true;
                }
            }

            if (changed === true) {
                this.fire(bui.Drawable.ListenerType.classes, [this,
                        this.classString()]);
            }

            return this;
        },
        hasClass : function(klass) {
            var classes = this._privates(identifier).classes;
             return (classes.indexOf(klass) != -1);
        },

        /**
         * @description
         * Remove a class from this drawable, if no parameter is passed remove all classes
         *
         * @param {String} klass the class which you want to remove
         * @return {bui.Drawable} Fluent interface
         */
        removeClass : function(klass) {
            if (klass === undefined) {
                this._privates(identifier).classes = [];
                this.fire(bui.Drawable.ListenerType.classes, [this, '']);
            } else {
                var classes = this._privates(identifier).classes;

                var index = classes.indexOf(klass);

                if (index != -1) {
                    classes.splice(index, 1);
                    this.fire(bui.Drawable.ListenerType.classes, [this,
                        this.classString()]);
                }
            }

            return this;
        },

        /**
         * @description
         * Generate a class string, i.e. a string which can be used for the
         * HTML / SVG class attribute.
         *
         * @return {String} the string for the class attribute
         */
        classString : function() {
            return this._privates(identifier).classes.join(' ');
        },

        /**
         * Set some JSON meta information for this drawable. Please note that
         * it won't be processed but only stored for later usage.
         *
         * @param {Object} [json] The data which you want to store within this
         *   object. Omit to retrieve the current data.
         * @return {Object|bui.Drawable} The stored data in case you call this
         *   function without parameter. If you pass a parameter the data
         *   will be stored and instance on which you called this function
         *   will be returned (fluent interface).
         */
        json : function(json) {
            var privates = this._privates(identifier);

            if (json !== undefined) {
                privates.json = json;

                return this;
            }

            return privates.json;
        },

        /**
         * Update the JSON object.
         *
         * @param {String|String[]} path The property name which should be
         *   updated. Pass a string array to handle property chains.
         * @param {Object} value The property's value.
         * @return {bui.Drawable} Fluent interface
         */
        updateJson : function(path, value) {
            var privates = this._privates(identifier);

            privates.json = privates.json || {};

            updateJson(privates.json, path, value);

            return this;
        },

        /**
         * Export this drawable instance to JSON
         *
         * @return {Object} The drawable instance exported to JSON.
         */
        toJSON : function() {
            var json = {},
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat.drawable;

            updateJson(json, dataFormat.id, privates.id);
            updateJson(json, dataFormat.visible, privates.visible);
            updateJson(json, dataFormat.cssClasses, privates.classes);

            return json;
        },

        /**
         * Retrieve the drawables type, i.e. either node or edge.
         *
         * @return {String} If the drawable is a node, 'node' will be returned.
         *   Otherwise 'edge' will be returned.
         */
        drawableType : function() {
            if (this.bottomRight !== undefined) {
                return 'node';
            } else {
                return 'edge';
            }
        },

        identifier : function() {
            return this.identifier;
        }
    };

    bui.util.setSuperClass(bui.Drawable, bui.Observable);

    /**
     * @namespace
     * Observable properties which all drawables share
     */
    bui.Drawable.ListenerType = {
        /** @field */
        visible :  bui.util.createListenerTypeId(),
        /** @field */
        remove :  bui.util.createListenerTypeId(),
        /** @field */
        select :  bui.util.createListenerTypeId(),
        /** @field */
        classes :  bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {

    var identifier = 'bui.Node';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Node} node
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(node) {
        return identifier + node.id();
    };

    /**
     * @private position changed listener
     */
    var positionChanged = function() {
        var privates = this._privates(identifier);

        var position = this.absolutePosition();

        var attrValue = ['translate(',
            position.x.toString(),
            ',',
            position.y.toString(),
            ')'].join('');
        privates.nodeGroup.setAttributeNS(null, 'transform', attrValue);

        this.fire(bui.Node.ListenerType.absolutePosition,
                [this, position.x, position.y]);
    };

    /**
     * @private visibility listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === true) {
            this.removeClass(bui.settings.css.classes.invisible);
        } else {
            this.addClass(bui.settings.css.classes.invisible);
            //this.placeholderVisible(false);
        }
    };

    /**
     * @private remove listener
     */
    var nodeRemoved = function() {
        var privates = this._privates(identifier),
            nodeGroup = privates.nodeGroup,
            interactable = interact(nodeGroup);
        
        // Unset interactable element and remove Event Listeners
        if (interactable) {
            interactable.unset();
        }
        nodeGroup.removeEventListener('interactdragstart', privates.interact.dragStart);
        nodeGroup.removeEventListener('interactdragmove', privates.interact.dragMove);
        nodeGroup.removeEventListener('interactdragend', privates.interact.dragEnd);
        nodeGroup.removeEventListener('interactresizestart', privates.interact.resizeStart);
        nodeGroup.removeEventListener('interactresizemove', privates.interact.resizeMove);
        nodeGroup.removeEventListener('interactresizeend', privates.interact.resizeMove);
        
        nodeGroup.parentNode.removeChild(nodeGroup);
    };

    /**
     * @private parent removed listener
     */
    var parentRemoved = function() {
        this.parent(this.graph());
        this.remove();
    };

    /**
     * @private parent listener
     */
    var parentChanged = function(node, newParent, oldParent) {
        if (oldParent !== this.graph()) {
            oldParent.unbindAll(listenerIdentifier(this));
        }

        newParent.bind(bui.Drawable.ListenerType.remove,
                parentRemoved.createDelegate(this),
                listenerIdentifier(this));
        newParent.bind(bui.Node.ListenerType.absolutePosition,
                positionChanged.createDelegate(this),
                listenerIdentifier(this));

        positionChanged.call(this);
    };

    /**
     * @private class changed listener
     */
    var classesChanged = function(node, classString) {
        var nodeGroup = this._privates(identifier).nodeGroup;
        nodeGroup.setAttributeNS(null, 'class', classString);
    };

    /**
     * @private select changed listener
     */
    var selectChanged = function(node, selected) {
        if (selected === true) {
            this.addClass(bui.settings.css.classes.selected);
        } else {
            this.removeClass(bui.settings.css.classes.selected);
        }
    };

    var mouseClick = function(event) {
        this.fire(bui.Node.ListenerType.click, [this, event]);
    };

    var dragStart = function(event) {
        this.fire(bui.Node.ListenerType.dragStart, [this, event]);
    };

    var dragMove = function(event) {
        this.fire(bui.Node.ListenerType.dragMove, [this, event]);
    };

    var dragEnd = function(event) {
        this.fire(bui.Node.ListenerType.dragEnd, [this, event]);
    };

    var resizeStart = function(event) {
        this.fire(bui.Node.ListenerType.resizeStart, [this, event]);
    };

    var resizeMove = function(event) {
        this.fire(bui.Node.ListenerType.resizeMove, [this, event]);
    };

    var resizeEnd = function(event) {
        this.fire(bui.Node.ListenerType.resizeEnd, [this, event]);
    };
    
    var interactActionCheck = function (event) {
        if (!bui.settings.enableModificationSupport) {
            return '';
        }
        var position = this.absolutePosition(),
            size = this.size(),
            scale = this.graph().scale(),
            graphPosition = this.graph().htmlTopLeft(),
            graphTranslate = this.graph().translate(),
            margin = interact.margin(),
            x = ((event.touches? event.touches[0]: event)
                    .pageX - graphPosition.x) / scale - graphTranslate.x,
            y = ((event.touches? event.touches[0]: event)
                    .pageY - graphPosition.y) / scale - graphTranslate.y,
            
            right = (x - position.x) > (size.width - margin),
            bottom = (y - position.y) > (size.height - margin),
            
            resizeAxes = (right?'x': '') + (bottom?'y': ''),
            action = (resizeAxes && this._enableResizing)?
                    'resize' + resizeAxes:
                    'drag';

        return action;
    };

    // create eventListener delegate functions
    var interactDragStart = function (node, event) {
        var privates = node._privates(identifier);
        privates.dragPosition = node.position();
    };
    
    var interactDragMove = function (node, event) {
        var privates = node._privates(identifier);
        var scale = node.graph().scale();
        
        if ((event.type === 'interactdragmove' && node.graph().highPerformance()) ||
            (event.type === 'interactdragend' && !node.graph().highPerformance())) {
            
        privates.dragPosition.x += event.detail.dx / scale;
        privates.dragPosition.y += event.detail.dy / scale;
        
            this.position(privates.dragPosition.x, privates.dragPosition.y);
        }
    };
    
    var interactResizeStart = function (node, event) {
        var privates = node._privates(identifier);
        privates.resizeSize = node.size();
    };

    var interactResizeMove = function (node, event) {
        var privates = this._privates(identifier);
        var scale = this.graph().scale();
        
        if ((event.type === 'interactresizemove' && this.graph().highPerformance()) ||
            (event.type === 'interactresizeend' && !this.graph().highPerformance())) {
            
            privates.resizeSize.width += event.detail.dx / scale;
            privates.resizeSize.height += event.detail.dy / scale;
        
            this.size(privates.resizeSize.width, privates.resizeSize.height);
        }
    };
    
    /**
     * @private
     * Initial paint of the node and group node
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.nodeGroup = document.createElementNS(bui.svgns, 'g');
        privates.nodeGroup.setAttributeNS(null, 'id', this.id());
        visibilityChanged.call(this, this, this.visible());

        this.graph().nodeGroup().appendChild(privates.nodeGroup);

        positionChanged.call(this);

        jQuery(privates.nodeGroup)
            .click(mouseClick.createDelegate(this));
        // interact.js event listeners
        privates.nodeGroup.addEventListener('interactdragstart', privates.interact.dragStart);
        privates.nodeGroup.addEventListener('interactdragmove', privates.interact.dragMove);
        privates.nodeGroup.addEventListener('interactdragend', privates.interact.dragEnd);
        privates.nodeGroup.addEventListener('interactresizestart', privates.interact.resizeStart);
        privates.nodeGroup.addEventListener('interactresizemove', privates.interact.resizeMove);
        privates.nodeGroup.addEventListener('interactresizeend', privates.interact.resizeMove);

        if (bui.settings.enableModificationSupport) {
            // set as interactable
            interact.set(privates.nodeGroup, {
                    drag: this._enableDragging,
                    resize: false,//this._enableResizing,
                    squareResize: false,//this._forceRectangular,
                    actionChecker: privates.interact.actionCheck
                });
        }
    };

    /**
     * @class
     * Base class for every drawable node. Please note that nodes shouldn't be
     * instantiated directly.
     *
     * @extends bui.Drawable
     * @constructor
     *
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.Node = function(args) {
        //args.id = bui.settings.idPrefix.node + args.id;
        bui.Node.superClazz.call(this, args);
        this._addType(bui.Node.ListenerType);

        var privates = this._privates(identifier);
        privates.x = 0;
        privates.y = 0;
        privates.dragPosition = this.position();
        privates.resizeSize = this.size();
        privates.width = this._minWidth;
        privates.height = this._minHeight;
        privates.parent = this.graph();
        privates.children = [];
        privates.color  = {
            background: '',
            border: ''
        };
        this.visible(true);
        
        // create interact listener function delegates
        // Done so that when a node is removed, the event listeners
        // Can be removed from the nodeGroup element
        privates.interact = {
            actionCheck: interactActionCheck.createDelegate(this),
            dragStart: dragStart.createDelegate(this),
            dragMove: dragMove.createDelegate(this),
            dragEnd: dragEnd.createDelegate(this),
            resizeStart: resizeStart.createDelegate(this),
            resizeMove: resizeMove.createDelegate(this),
            resizeEnd: resizeEnd.createDelegate(this)
        };
        
        this.bind(bui.Drawable.ListenerType.remove,
                nodeRemoved.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.parent,
                parentChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.position,
                positionChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.select,
                selectChanged.createDelegate(this),
                listenerIdentifier(this));

        this.bind(bui.Node.ListenerType.dragStart,
                interactDragStart.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.dragMove,
                interactDragMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.dragEnd,
                interactDragMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.resizeStart,
                interactResizeStart.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.resizeMove,
                interactResizeMove.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.resizeEnd,
                interactResizeMove.createDelegate(this),
                listenerIdentifier(this));
                
        initialPaint.call(this);
    };

    bui.Node.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 1,
        _minHeight : 1,
        _forceRectangular : false,
        _enableResizing : true,
        _enableDragging : true,

        /**
         * Use this function to retrieve this node's group. This function
         * is normally only required by sub classes.
         *
         * @return {SVGGElement} node group
         */
        nodeGroup : function() {
            return this._privates(identifier).nodeGroup;
        },

        /**
         * @description
         * Set or retrieve the node's position.
         *
         * You can set the position by passing both, the x- and y-axis value
         * to this function. If you pass only one parameter or none, the
         * current position is returned.
         *
         * @param {Number} [x] The new x-axis position.
         * @param {Number} [y] The new y-axis position.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   position will be returned as an object with x and y properties.
         */
        position : function(x, y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                var changed = privates.x !== x || privates.y !== y;
                privates.x = x;
                privates.y = y;

                if (changed) {
                    this.fire(bui.Node.ListenerType.position,
                            [this, privates.x, privates.y]);
                }

                return this;
            }

            return {
                x : privates.x,
                y : privates.y
            };
        },

        /**
         * Set or retrieve position of the node's center.
         *
         * The positioning is done relatively.
         *
         * @param {Number} x Position on x-coordinate.
         * @param {Number} y Position on y-coordinate.
         * @return {bui.Node} Fluent interface
         */
        positionCenter : function(x, y) {
            var size = this.size();

            if (x !== undefined && y !== undefined) {
                this.position(x - size.width / 2, y - size.height / 2);
                return this;
            }
            var pos = this.position();
            return {
                x : pos.x + size.width / 2,
                y : pos.y + size.height /2
            };
        },

        /**
         * Set or retrieve the absolute position of this node in the SVG.
         *
         * @param {Number} [x] The new x-axis position.
         * @param {Number} [y] The new y-axis position.
         * @return {Object} Object with x and y properties.
         */
        absolutePosition : function(x, y) {
            var privates = this._privates(identifier);
            var parentTopLeft = privates.parent.absolutePosition();

            if (x !== undefined && y !== undefined) {
                x -= parentTopLeft.x;
                y -= parentTopLeft.y;
                this.position(x, y);
                return this;
            }
            return {
                x : parentTopLeft.x + privates.x,
                y : parentTopLeft.y + privates.y
            };
        },

         /**
         * Set or retrieve the position of the node's center (SVG absolute).
         *
         * The positioning is done relatively.
         *
         * @param {Number} x Position on x-coordinate.
         * @param {Number} y Position on y-coordinate.
         * @return {bui.Node} Fluent interface
         */
        absolutePositionCenter : function(x, y) {
            var size = this.size();

            if (x !== undefined && y !== undefined) {
                //set x y
                this.absolutePosition(x - size.width / 2, y - size.height / 2);
                return this;
            }
            var pos = this.absolutePosition();
            return {
                x : pos.x + size.width / 2,
                y : pos.y + size.height / 2
            };
        },

        /**
         * Retrieve the absolute position of this node in the HTML document.
         *
         * @return {Object} Object with x and y properties.
         */
        htmlTopLeft : function() {
            var privates = this._privates(identifier);

            var parentTopLeft = privates.parent.htmlTopLeft();

            return {
                x : parentTopLeft.x + privates.x,
                y : parentTopLeft.y + privates.y
            };
        },

        /**
         * @description
         * Set or retrieve the node's size.
         *
         * You can set the size by passing both, the width and height value
         * to this function. If you pass only one parameter or none, the
         * current size is returned.
         *
         * @param {Number} [width] The new width.
         * @param {Number} [height] The new height.
         * @return {bui.Node|Object} Fluent interface in case both parameters
         *   are given. If only one or no parameter is provided the current
         *   size will be returned as an object with width and height
         *   properties.
         */
        size : function(width, height) {
            var privates = this._privates(identifier);

            if (width !== undefined && height !== undefined) {
                width = Math.max(this._minWidth, width);
                height = Math.max(this._minHeight, height);

                if (this._forceRectangular === true) {
                    height = width;
                }
                var changed = privates.width !== width ||
                        privates.height !== height;
                privates.width = width;
                privates.height = height;

                if (changed) {
                    this.fire(bui.Node.ListenerType.size,
                            [this, privates.width, privates.height]);
                }

                return this;
            }

            return {
                width : privates.width,
                height : privates.height
            };
        },

        /**
         * @description
         * Use this function to set or retrieve the top-left corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        topLeft : function(x ,y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                privates.x = x;
                privates.y = y;
                return this;
            }
            return {
                x : privates.x,
                y : privates.y
            };
        },

        /**
         * @description
         * Use this function to retrieve the bottom-right corner of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        bottomRight : function(x, y) {
            var privates = this._privates(identifier);

            if (x !== undefined && y !== undefined) {
                privates.x = x - privates.width;
                privates.y = y - privates.height;
                return this;
            }
            return {
                x : privates.x + privates.width,
                y : privates.y + privates.height
            };
        },

        /**
         * @description
         * Use this function to set or retrieve the absolute bottom right coordinates
         * of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        absoluteBottomRight : function(x, y) {
            var privates = this._privates(identifier);

            var position = this.absolutePosition();

            if (x !== undefined && y !== undefined) {
                //set x y
                this.absolutePosition(x - privates.width, y - privates.height);
            }
            return {
                x : position.x + privates.width,
                y : position.y + privates.height
            };
        },

        /**
         * @description
         * Use this function to retrieve the center of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        center : function() {
            var privates = this._privates(identifier);

            return {
                x : privates.x + (privates.width / 2),
                y : privates.y + (privates.height / 2)
            };
        },

        /**
         * @description
         * Use this function to retrieve the absolute center of the node.
         *
         * @return {Object} Object with x and y properties.
         */
        absoluteCenter : function() {
            var privates = this._privates(identifier);

            var position = this.absolutePosition();

            return {
                x : position.x + (privates.width / 2),
                y : position.y + (privates.height / 2)
            };
        },

        /**
         * @description
         * Use this function to move the node relative to its current position.
         *
         * @param {Number} x Relative change on the x-axis.
         * @param {Number} y Relative change on the y-axis.
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        move : function(x, y, duration, finishedListener) {
            var privates = this._privates(identifier);

            if (duration === undefined || duration <= 0) {
                this.position(privates.x + x, privates.y + y);
            } else {
                var node = this,
                        // 1000 milliseconds / x fps
                        timeOffset = 1000 / bui.settings.animationFPS,
                        remainingCalls = Math.floor(duration / timeOffset);


                (function() {
                    // to avoid rounding issues
                    var diffX = x / remainingCalls,
                            diffY = y / remainingCalls;

                    node.position(privates.x + diffX, privates.y + diffY);

                    remainingCalls--;

                    if (remainingCalls >= 1) {
                        x -= diffX;
                        y -= diffY;
                        setTimeout(arguments.callee, timeOffset);
                    } else {
              if (finishedListener) finishedListener();
            }
                })();
            }

            return this;
        },

        /**
         * @description
         * Use this function to move the node relative to its current position.
         *
         * @param {Number} w new width
         * @param {Number} h new height
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        resize : function(w, h, duration) {
            var privates = this._privates(identifier);

            if (duration === undefined || duration <= 0) {
                this.size(w, h);
            } else {
                var node = this,
                        // 1000 milliseconds / x fps
                        timeOffset = 1000 / bui.settings.animationFPS,
                        remainingCalls = Math.floor(duration / timeOffset),
                        diffw=(w-privates.width)/remainingCalls,
                        diffh=(h-privates.height)/remainingCalls;

                (function() {
                    node.size(w-remainingCalls*diffw, h-remainingCalls*diffh);

                    remainingCalls--;

                    if (remainingCalls >= 1) {
                        setTimeout(arguments.callee, timeOffset);
                    }
                })();
            }

            return this;
        },

        /**
         * @description
         * Use this function to move the node.
         *
         * @param {Number} x Absolute position on the x-axis.
         * @param {Number} y Absolute position on the y-axis.
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        moveAbsolute : function(x, y, duration) {
            var privates = this._privates(identifier);
            return this.move(x - privates.x, y - privates.y, duration);
        },

        /**
         * @description
         * Use this function to move the node.
         *
         * @param {Number} x Absolute center position on the x-axis.
         * @param {Number} y Absolute center position on the y-axis.
         * @param {Number} [duration] Whether this movement should be animated
         *   and how long this animation should run in milliseconds. When
         *   omitted or a value <= 0 is passed the movement will be executed
         *   immediately.
         * @return {bui.Node} Fluent interface.
         */
        moveAbsoluteCenter : function(x, y, duration) {
            var size = this.size();

            this.moveAbsolute(x - size.width / 2, y - size.height / 2);

        },

        /**
         * Set or retrieve the current color
         *
         * @param {Object} [options] object with propertied background and/or label
         * which are the new colors to be set. Omit to retrieve current colors.
         * @return {bui.Labelable|Object} Current colors are returned when you
         *   don't pass any parameter, fluent interface otherwise.
         */
        color : function(options) {
            var privates = this._privates(identifier),
            changed = false;
            
            if (typeof options !== 'object') {
                // Return object giving background and label text color
                return privates.color;
            }

            for (var prop in privates.color) {
                if (privates.color.hasOwnProperty(prop) && typeof options[prop] === 'string') {
                    options[prop] = options[prop].toLowerCase();
                    changed = changed || options[prop] !== privates.color[prop];
                    privates.color[prop] = options[prop];
                }
            }
            
           if(changed) {
                //Fire the colorchanged
                this.fire(bui.Node.ListenerType.color, [this, options]);
            }
            
            return this;
        },

        /**
         * Retrieve the current parent or set it
         *
         * @param {bui.Graph|bui.Node} [parent] The new parameter or
         *   omit to retrieve the current parent.
         * @return {bui.Graph|bui.Node} The current parent in case you didn't
         *   pass a parameter, fluent interface otherwise.
         */
        parent : function(parent) {
            var privates = this._privates(identifier);

            if (parent !== undefined) {
                if (parent !== privates.parent) {
                    var old = privates.parent;

                    privates.parent = parent;

                    if (old !== this.graph()) {
                        old._removeChild(this);
                    }

                    if (parent !== this.graph()) {
                        parent._addChild(this);
                    }

                    this.fire(bui.Node.ListenerType.parent,
                            [this, parent, old]);
                }

                return this;
            }

            return privates.parent;
        },

        /**
         * This function can be used to check whether this node has a parent
         * node.
         *
         * @return {Boolean} True when this node has a parent node.
         */
        hasParent : function() {
            return this.parent() !== this.graph();
        },

        /**
         * Add a child node to this node. This function call is synonymous with
         * a child.parent(this) function call.
         *
         * @param {bui.Node} child The new child node
         * @return {bui.Node} Fluent interface
         */
        addChild : function(child) {
            child.parent(this);

            return this;
        },

        /**
         * Remove a child node from this node. This function call is synonymous
         * with a child.parent(this.graph()) function call.
         *
         * @param {bui.Node} child The child node which should be removed
         * @return {bui.Node} Fluent interface
         */
        removeChild : function(child) {
            child.parent(this.graph());

            return this;
        },

        /**
         * @private
         * Internal method for the addition of a child node.
         *
         * @param {bui.Node} child The new child
         */
        _addChild : function(child) {
            this._privates(identifier).children.push(child);
        },

        /**
         * @private
         * Internal method for the removal of child nodes
         *
         * @param {bui.Node} child The child node which should be removed,
         */
        _removeChild : function(child) {
            var children = this._privates(identifier).children;

            var index = children.indexOf(child);

            if (index !== -1) {
                children.splice(index, 1);
            }
        },

        /**
         * Retrieve the node's child elements. The returned child nodes can
         * also be filtered using a callback which will be executed for every
         * child node.
         *
         * @param {Function} [checkFunction] Filter nodes using this filter
         *   function. The function will be called for every sub node. The
         *   function should return true in order to include the node in the
         *   return value.
         * @return {bui.Node[]} All the node's child elements. The returned
         *   array is actually a copy and can therefore be modified.
         */
        children : function(checkFunction) {
            var filteredChildren = [],
                    allChildren = this._privates(identifier).children;

            for (var i = 0; i < allChildren.length; i++) {
                var child = allChildren[i];

                if (checkFunction === undefined ||
                        checkFunction(child) === true) {
                    filteredChildren.push(child);
                }
            }

            return filteredChildren;
        },

        /**
         * Retrieve the node's auxiliary units.
         *
         * @return {bui.Node[]} All the node's auxiliary units. The returned
         *   array is actually a copy and can therefore be modified.
         */
        auxiliaryUnits : function() {
            return this.children(function(node) {
                return node.auxiliaryUnit === true;
            });
        },

        /**
         * Retrieve the node's auxiliary units.
         *
         * @return {bui.Node[]} All the node's sub nodes without auxiliary
         *   units. The returned array is actually a copy and can therefore be
         *   modified.
         */
        childrenWithoutAuxiliaryUnits : function() {
            return this.children(function(node) {
                return node.auxiliaryUnit !== true;
            });
        },

        /**
         * @private
         * Used to calculate line endpoints. Generally spoken this method
         * will only be used by the class {@link bui.StraightLine}.
         *
         * @param {bui.Node| Number, Number } otherNode or x,y position
         * @return {Object} an object with x and y properties
         */
        calculateLineEnd : function(otherNode,y) {
//             if (this.visible() === false) {
//                 return this.center();
//             }

            var position = this.absoluteCenter(),
                    size = this.size();
                    
            // get other position from otherNode or from x,y parameters
            var otherPosition = (Object.prototype.toString.call(otherNode).slice(8,-1) == "Number" ? {x:otherNode,y:y} : otherNode.absoluteCenter());

            var padding = bui.settings.style.edgeToNodePadding;
            var widthWithPadding = (this.visible() ? size.width : 0) + padding.leftRight * 2,
                    heightWithPadding = (this.visible() ? size.height : 0) + padding.topBottom * 2;

            var deltaX = otherPosition.x - position.x,
                    deltaY = otherPosition.y - position.y;

            if (deltaX==0 && deltaY==0){
               return this.center();
            }
            var hitAngle = Math.abs(Math.atan(deltaY / deltaX));
            var sideHitAngle = Math.atan(heightWithPadding / widthWithPadding);

            var adjacent = 0;
            var goesThroughLeftOrRightSide = hitAngle < sideHitAngle;

            if (goesThroughLeftOrRightSide) {
                adjacent = widthWithPadding / 2;
            } else {
                adjacent = heightWithPadding / 2;
                // subtracting 90 degrees
                hitAngle = Math.PI / 2 - hitAngle;
            }

            var hookResult = this._calculationHook(adjacent, hitAngle);
            var opposite = hookResult.opposite;
            adjacent = hookResult.adjacent;

            var xChange = 0, yChange = 0;
            if (goesThroughLeftOrRightSide) {
                xChange = adjacent;
                yChange = opposite;
            } else {
                xChange = opposite;
                yChange = adjacent;
            }

            var hitsTop = position.y > otherPosition.y,
                    hitsLeft = position.x > otherPosition.x;

            xChange *= (hitsLeft ? -1 : 1);
            yChange *= (hitsTop ? -1 : 1);

            return {
                x : position.x + xChange,
                y : position.y + yChange
            };
        },

        /**
         * @private
         * This hook can be used to alter the calculateLineEnd function result.
         *
         * @param {Number} adjacent The length of the adjacent line
         * @param {Number} hitAngle The angle with which the line will 'hit'
         *   the shape in radians.
         * @return {Object} An object with adjacent and opposite properties.
         *   (think of trigonometric functions).
         */
        _calculationHook : function(adjacent, hitAngle) {
            return {
                adjacent : adjacent,
                opposite : Math.tan(hitAngle) * adjacent
            };
        },

        /**
         * Start the dragging process on the placeholder element at the given
         * position.
         *
         * @param {Number} x X-coordinate on which to start the dragging
         * @param {Number} y Y-coordinate on which to start the dragging
         * @return {bui.Node} Fluent interface.
         */
        startDragging : function(x, y) {
            jQuery(this.nodeGroup()).simulate("mousedown", {
                        pageX : x,
                        pageY : y
                    });

            return this;
        },

        /**
         * Automatically position the node's auxiliary units.
         *
         * @return {bui.Node} Fluent interface
         */
        positionAuxiliaryUnits : function() {
            var auxUnits = this.auxiliaryUnits();
            var possiblePositions =
                    bui.settings.style.automaticAuxiliaryUnitPositioning;

            var nodeSize = this.size();

            for (var i = 0; i < auxUnits.length &&
                    i < possiblePositions.length; i++) {
                var auxUnit = auxUnits[i];
                var positionAt = possiblePositions[i];

                var auxUnitSize = auxUnit.size();

                auxUnit.positionCenter(nodeSize.width * positionAt[0],
                        nodeSize.height * positionAt[1]);
            }

            return this;
        },

        // overridden
        toJSON : function() {
            var json = bui.Node.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier),
                    position = this.position(),
                    i;

            updateJson(json, dataFormat.drawable.sbo,
                    getSBOForInstance(nodeMapping, this));
            updateJson(json, dataFormat.node.x, position.x);
            updateJson(json, dataFormat.node.y, position.y);
            updateJson(json, dataFormat.node.width, privates.width);
            updateJson(json, dataFormat.node.height, privates.height);

            var children = this.childrenWithoutAuxiliaryUnits();
            if (children.length > 0) {
                var subNodes = [];
                updateJson(json, dataFormat.node.subNodes, subNodes);

                for(i = 0; i < children.length; i++) {
                    subNodes.push(children[i].id());
                }
            }

            var auxUnits = this.auxiliaryUnits();
            if (auxUnits.length > 0) {
                var auxUnitsJson = [];

                for (i = 0; i < auxUnits.length; i++) {
                    var auxUnit = auxUnits[i];

                    if (auxUnit instanceof bui.StateVariable || auxUnit instanceof bui.StateVariableER) {

                        auxUnitsJson.push(auxUnit.toJSON());
                    } else {
                        log('Warning: Can\'t export units of information to ' +
                                'JSON.');
                    }
                }
                updateJson(json, dataFormat.node.statevariable, auxUnitsJson);
            }

            return json;
        },

        /**
         * Move the node to the front so that no other nodes may be positioned
         * in front of them.
         *
         * @return {bui.Node} Fluent interface.
         */
        toFront : function() {
            var nodeGroup = this._privates(identifier).nodeGroup;
            nodeGroup.parentNode.appendChild(nodeGroup);
            return this;
        },

        /**
         * Move the node to the back so that all nodes may be positioned in
         * front of this node.
         *
         * @return {bui.Node} Fluent interface.
         */
        toBack : function() {
            var nodeGroup = this._privates(identifier).nodeGroup,
                    parent = nodeGroup.parentNode;
            parent.insertBefore(nodeGroup, parent.firstChild);
            return this;
        }
    };

    bui.util.setSuperClass(bui.Node, bui.Drawable);

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.Node.ListenerType = {
        /** @field */
        parent : bui.util.createListenerTypeId(),
        /** @field */
        position : bui.util.createListenerTypeId(),
        /** @field */
        absolutePosition : bui.util.createListenerTypeId(),
        /** @field */
        size : bui.util.createListenerTypeId(),
        /** @field */
        click : bui.util.createListenerTypeId(),
        /** @field */
        dragStart : bui.util.createListenerTypeId(),
        /** @field */
        dragMove : bui.util.createListenerTypeId(),
        /** @field */
        dragEnd : bui.util.createListenerTypeId(),
        /** @field */
        resizeStart : bui.util.createListenerTypeId(),
        /** @field */
        resizeMove : bui.util.createListenerTypeId(),
        /** @field */
        resizeEnd : bui.util.createListenerTypeId(),
        /** @field */
        color : bui.util.createListenerTypeId()
    };
})(bui);


(function(bui) {
    var identifier = 'bui.Labelable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Labelable} labelable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(labelable) {
        return identifier + labelable.id();
    };

    /**
     * @private label painting on multiple lines etc.
     */
    var doPaintTextWithoutAdaptToSize = function(lines) {
        var privates = this._privates(identifier);

        var previousHeight = 0;
        var firstHeight = lines[0].maxHeight;
        var totalHeight = 0;
        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var aggregatedText = [];
            totalHeight += line.maxHeight;
            for(var j = 0; j < line.words.length; j++) {
                aggregatedText.push(line.words[j].word);
            }

            var tspan = document.createElementNS(bui.svgns, 'tspan');
            tspan.appendChild(document.createTextNode(
                    aggregatedText.join(' ')));
            tspan.setAttributeNS(null, 'x', line.horizontalIndention);
            tspan.setAttributeNS(null, 'dy', previousHeight);
            //***tspan.style.setProperty('fill', privates.color.label);
            tspan.style.setProperty('fill', this.color().label);
            privates.labelElement.appendChild(tspan);

            previousHeight = line.maxHeight;
        }

        privates.labelElement.setAttributeNS(null, 'y',
                this.size().height / 2 + firstHeight - totalHeight / 2);
    };

    /**
     * @private label painting on multiple lines etc.
     */
    var doPaintTextWithAdaptToSize = function(lines) {
        var privates = this._privates(identifier);

        var aggregatedText = [];
        var maxHeight = Number.MIN_VALUE;
        var totalWidth = 0;

        for(var i = 0; i < lines.length; i++) {
            var line = lines[i];

            for(var j = 0; j < line.words.length; j++) {
                aggregatedText.push(line.words[j].word);
            }

            totalWidth += line.totalWidth + line.spaceWidth;
            maxHeight = Math.max(maxHeight, line.maxHeight);
        }

        // we added one space too much
        totalWidth -= lines[0].spaceWidth;

        privates.labelElement.appendChild(document.createTextNode(
                    aggregatedText.join(' ')));

        var padding = bui.settings.style.adaptToLabelNodePadding;
        totalWidth += padding.left + padding.right;
        var nodeHeight = maxHeight + padding.top + padding.bottom;
        this.size(totalWidth, nodeHeight);
        privates.labelElement.setAttributeNS(null, 'x', padding.left);
        privates.labelElement.setAttributeNS(null, 'y', maxHeight);
        privates.labelElement.style.setProperty('fill', this.color().label);
    };

    /**
     * @private label change listener
     */
    var labelableLabelChanged = function() {
        var privates = this._privates(identifier);

        var label = this.label();
        if (privates.labelElement !== null &&
                privates.labelElement.parentNode !== null) {
            privates.labelElement.parentNode.removeChild(
                    privates.labelElement);
        }

        if (label.length === 0) {
            return;
        }

        privates.labelElement = document.createElementNS(bui.svgns, 'text');
        var lines = bui.util.calculateLabelPositioning(this.size().width,
             label, privates.calculationClasses);

        if (privates.adaptSizeToLabel === true) {
            doPaintTextWithAdaptToSize.call(this, lines);
        } else {
            doPaintTextWithoutAdaptToSize.call(this, lines);
        }

        privates.labelElement.setAttributeNS(null, 'class',
                privates.svgClasses);

        this.nodeGroup().appendChild(privates.labelElement);
    };

    /**
     * @class
     * A node which can contain a label.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Labelable = function() {
        bui.Labelable.superClazz.apply(this, arguments);
        this._addType(bui.Labelable.ListenerType);

        var privates = this._privates(identifier);
        privates.label = this._label;
        privates.adaptSizeToLabel = this._adaptSizeToLabel;
        privates.labelElement = null;
        privates.svgClasses = this._svgClasses;
        privates.calculationClasses = this._calculationClasses;
        this.color().label  = '';

        var listener = labelableLabelChanged.createDelegate(this);
        this.bind(bui.Labelable.ListenerType.label,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.adaptSizeToLabel,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Labelable.ListenerType.labelClass,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.size,
                listener,
                listenerIdentifier(this));
    };

    bui.Labelable.prototype = {
        identifier : function() {
            return identifier;
        },
        _label : '',
        _adaptSizeToLabel : false,
        _svgClasses : '',
        _ignLabelSize : false,
        _calculationClasses :
                [bui.settings.css.classes.textDimensionCalculation.standard],

        /**
         * Set or retrieve the current label
         *
         * @param {String} [label] Pass a new label to set it or omit the
         *   parameter to retrieve the current label
         * @return {bui.Labelable|String} Current label is returned when you
         *   don't pass any parameter, fluent interface otherwise.
         */
        label : function(label) {
            var privates = this._privates(identifier);

            if (label !== undefined) {
                label = label === null ? '' : label;
                if (label != privates.label) {
                    privates.label = label;
                    this.fire(bui.Labelable.ListenerType.label, [this, label]);
                }
                return this;
            }

            return privates.label;
        },
        
        /**
         * Set or retrieve whether the node adapts to the label size
         *
         * @param {Boolean} [adaptSizeToLabel] True to adapt to label size,
         *   false otherwise. Omit to retrieve current value.
         * @return {bui.Labelable|Boolean} Fluent interface or the current
         *   value in case no parameter is passed.
         */
        adaptSizeToLabel : function(adaptSizeToLabel) {
            var privates = this._privates(identifier);

            if (adaptSizeToLabel !== undefined) {
                if (adaptSizeToLabel !== privates.adaptSizeToLabel) {
                    privates.adaptSizeToLabel = adaptSizeToLabel;
                    this.fire(bui.Labelable.ListenerType.adaptSizeToLabel,
                            [this, adaptSizeToLabel]);
                }

                return this;
            }

            return privates.adaptSizeToLabel;
        },

        /**
         * Modify the text size etc.
         *
         * @param {String} svgClasses classes to be added to the SVG
         *   text element.
         * @param {String[]} calcClasses classes used for the calculation of
         *   the text dimensions.
         * @return {bui.Labelable} Fluent interface
         */
        labelClass : function(svgClasses, calcClasses) {
            var privates = this._privates(identifier);

            privates.svgClasses = svgClasses;
            privates.calculationClasses = calcClasses;

            this.fire(bui.Labelable.ListenerType.labelClass, [this]);

            return this;
        },

        /**
         * Retrieve the node's size based on its label. A node width of 300
         * pixels will be assumed.
         *
         * @return {Object} An object with width and height properties.
         */
        sizeBasedOnLabel : function() {
            var privates = this._privates(identifier);
            
            var lines = bui.util.calculateLabelPositioning(300,
                this.label(), privates.calculationClasses);

            var maxHeight = Number.MIN_VALUE;
            var maxWidth = Number.MIN_VALUE;

            for(var i = 0; i < lines.length; i++) {
                var line = lines[i];

                maxWidth = Math.max(maxWidth, line.totalWidth);
                maxHeight = Math.max(maxHeight, line.maxHeight);
            }

            var padding = bui.settings.style.adaptToLabelNodePadding;
            maxWidth += padding.left + padding.right;
            maxHeight += padding.top + padding.bottom;

            return {
                width : maxWidth,
                height : maxHeight
            };
        },

        // overridden
        toJSON : function() {
            var json = bui.Labelable.superClazz.prototype.toJSON.call(this),
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat;

            updateJson(json, dataFormat.node.label, privates.label);
            if (privates.color) updateJson(json, dataFormat.node.color, privates.color);

            return json;
        }
    };

    bui.util.setSuperClass(bui.Labelable, bui.Node);

    /**
     * @namespace
     * Observable properties which all labelable nodes share
     */
    bui.Labelable.ListenerType = {
        /** @field */
        label : bui.util.createListenerTypeId(),
        /** @field */
        adaptSizeToLabel : bui.util.createListenerTypeId(),
        /** @field */
        labelClass : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'EdgeHandle';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.EdgeHandle} EdgeHandle
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(EdgeHandle) {
        return identifier + EdgeHandle.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.EdgeHandle = function() {
        bui.EdgeHandle.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.EdgeHandle.prototype = {
        identifier : function() {
            return identifier;
        },
        edge : function(e){
          var privates = this._privates(identifier);
          if (e !==undefined){
            privates.edge=e;
            return this;
          } else {
            return privates.edge;
          }
        },
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
//        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.EdgeHandle, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'Association';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Association} Association
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Association) {
        return identifier + Association.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Association = function() {
        bui.Association.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
        this.addClass('Outcome');// the stylesheet mus fill the circle black
    };

    bui.Association.prototype = {
        identifier : function() {
            return 'Association';
        },
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _minWidth : 14,
        _minHeight : 14,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.Association, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'Dissociation';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Dissociation} Dissociation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Dissociation) {
        return identifier + Dissociation.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        privates.subcircle.setAttributeNS(null, 'cx', r);
        privates.subcircle.setAttributeNS(null, 'cy', r);
        privates.subcircle.setAttributeNS(null, 'r', width / 4);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        privates.subcircle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        this.nodeGroup().appendChild(privates.circle);
        this.nodeGroup().appendChild(privates.subcircle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Dissociation = function() {
        bui.Dissociation.superClazz.apply(this, arguments);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));

        initialPaint.call(this);

        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.Dissociation.prototype = {
        identifier : function() {
            return 'Dissociation';
        },
        includeInJSON : false,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _minWidth : 14,
        _minHeight : 14,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.Dissociation, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'LogicalOperator';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.LogicalOperator} LogicalOperator
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(LogicalOperator) {
        return identifier + LogicalOperator.id();
    };

    /**
     * @private size listener
     */
    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.circle.style.setProperty('fill', color.background);
        privates.circle.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);

        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
		colorChanged.call(this, this, this.color()),
        this.nodeGroup().appendChild(privates.circle);
    };
    
    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     *
     * @extends bui.Node
     * @constructor
     */
    bui.LogicalOperator = function(type) {
        bui.LogicalOperator.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);
        if (typeof(type) === 'string') {
            if(type == 'delay') this.label('τ');
            else this.label(type);
        }else if (typeof(type) === 'object') {
            if(type == 174) this.label('OR');
            else if (type == 173) this.label('AND');
            else if (type == 238) this.label('NOT');
            else if (type == 225) this.label('τ');
        }
        if(this.label() == 'τ'){
            this.addClass('delay');
        }
        this.addClass('LogicalOperator');


        var widthHeight = bui.settings.style.edgeHandleRadius * 2;
        this.size(widthHeight, widthHeight);
    };

    bui.LogicalOperator.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 14,
        _minHeight : 14,
        includeInJSON : true,
        _circle : null,
        _forceRectangular : true,
        _enableResizing : false,
        _calculationHook : circularShapeLineEndCalculationHookWithoutPadding
    };

    bui.util.setSuperClass(bui.LogicalOperator, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'SplineEdgeHandle';

    /**
     * @class
     * Drag handle node type which is useful for manipulation of edge shapes
     * of splines
     *
     * @extends bui.EdgeHandle
     * @constructor
     */
    bui.SplineEdgeHandle = function() {
        bui.SplineEdgeHandle.superClazz.apply(this, arguments);

        this.addClass(bui.settings.css.classes.splineEdgeHandle);
        this.position(10, 10);
    };

    bui.SplineEdgeHandle.prototype = {
        identifier : function() {
            return identifier;
        },
        includeInJSON : false
    };

    bui.util.setSuperClass(bui.SplineEdgeHandle, bui.EdgeHandle);
})(bui);
(function(bui) {
    var identifier = 'RectangularNode';

    // generate a path's arc data parameter
    // http://www.w3.org/TR/SVG/paths.html#PathDataEllipticalArcCommands
    var arcParameter = function(rx, ry, xAxisRotation, largeArcFlag, sweepFlag,
                              x, y) {
        return [rx,
                ',',
                ry,
                ' ',
                xAxisRotation,
                ' ',
                largeArcFlag,
                ',',
                sweepFlag,
                ' ',
                x,
                ',',
                y].join('');
    };

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the rectangular shape
     * @param {Number} height Height of the rectangular shape
     * @param {Number} tr Top border radius of the rectangular shape
     * @param {Number} br Bottom border radius of the rectangular shape
     * @return {String} a path's data attribute value
     */
    var generatePathData = function(width, height, tr, br, shift) {
        var data = [];

        var sx = 0, sy = 0
        if (shift != undefined){
            sx = shift.x;
            sy = shift.y
        }
        // start point in top-middle of the rectangle
        data.push('M' + (width / 2 + sx) +  ',' + sy);

        // next we go to the right
        data.push('H' + (width - tr + sx));

        if (tr > 0) {
            // now we draw the arc in the top-right corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, width+sx, tr+sy));
        }

        // next we go down
        data.push('V' + (height - br + sy));

        if (br > 0) {
            // now we draw the arc in the lower-right corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, width - br +sx,
                    height+sy));
        }

        // now we go to the left
        data.push('H' + (br+sx));

        if (br > 0) {
            // now we draw the arc in the lower-left corner
            data.push('A' + arcParameter(br, br, 0, 0, 1, sx, height - br+sy));
        }

        // next we go up
        data.push('V' + (tr+sy));

        if (tr > 0) {
            // now we draw the arc in the top-left corner
            data.push('A' + arcParameter(tr, tr, 0, 0, 1, tr+sx, sy));
        }

        // and we close the path
        data.push('Z');

        return data.join(' ');
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private position / size listener
     */
    var formChanged = function() {
        var privates = this._privates(identifier);
        var size = this.size();
        privates.rect.setAttributeNS(null, 'd', generatePathData(size.width,
                size.height, privates.topRadius, privates.bottomRadius));
        if (privates.is_multimer == true){
            privates.multimer_rect.setAttributeNS(null, 'd', generatePathData(size.width, 
                size.height, privates.topRadius, privates.bottomRadius, {x: 9, y:9}));
        }
        if (privates.is_cloned == true){
            privates.clone_rect.setAttributeNS(null, 'd', generatePathData(size.width, 
                size.height, privates.topRadius, privates.bottomRadius));
            privates.clippath_path.setAttributeNS(null, 'width', size.width);
            privates.clippath_path.setAttributeNS(null, 'height', size.height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(size.height/3));
        }

    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.rect.style.setProperty('fill', color.background);
        privates.rect.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.rect = document.createElementNS(bui.svgns, 'path');
        var size = this.size();
        formChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.rect);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.RectangularNode = function() {
        bui.RectangularNode.superClazz.apply(this, arguments);
        this._addType(bui.RectangularNode.ListenerType);

        var listener = formChanged.createDelegate(this);
        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.topRadius,
                listener,
                listenerIdentifier(this));
        this.bind(bui.RectangularNode.ListenerType.bottomRadius,
                listener,
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.topRadius = 0;
        privates.bottomRadius = 0;
        privates.is_multimer = false;
        privates.is_cloned = false;

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.rectangle);
    };

    bui.RectangularNode.prototype = {
        
        identifier : function() {
            return identifier;
        },
        /**
         * Set this node's radius for both upper corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        topRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.topRadius !== radius) {
                    privates.topRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.topRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.topRadius;
        },

        /**
         * Set this node's radius for both lower corners in pixel.
         *
         * @param {Number} [radius] Radius in pixel or omit to retrieve the
         *   current radius.
         * @return {bui.RectangularNode|Number} Fluent interface if you pass
         *   a parameter, the current radius otherwise.
         */
        bottomRadius : function(radius) {
            var privates = this._privates(identifier);

            if (radius !== undefined) {
                if (privates.bottomRadius !== radius) {
                    privates.bottomRadius = radius;
                    this.fire(bui.RectangularNode.ListenerType.bottomRadius,
                            [this, radius]);
                }

                return this;
            }

            return privates.bottomRadius;
        },
        /**
         * Set this node's multimer state.
         *
         * @param {Bool} [flag] optional flag to set multimer state
         * @return {bui.RectangularNode|Bool} Fluent interface if you pass
         *   a parameter, the current multimer status otherwise.
         */
        multimer : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined) {
                if (flag!=privates.is_multimer){
                    var container = this.nodeGroup();
                    privates.is_multimer = flag;
                    if (flag==true){
                        privates.multimer_rect = document.createElementNS(bui.svgns, 'path');
                        container.insertBefore(privates.multimer_rect, container.firstChild);
                        formChanged.call(this);
                    }else{
                        container.removeChild(privates.multimer_rect);
                    }
                }
                return this;
            }
            return privates.is_multimer;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag==true){
                        privates.clone_rect = document.createElementNS(bui.svgns, 'path');
                        privates.clone_rect.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_rect);
                        privates.clone_rect.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect')
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        formChanged.call(this);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_rect);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this
            }
            return privates.is_cloned;
        },
        toJSON : function() {
          var json = bui.RectangularNode.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;
          if (privates.is_cloned) {
            json.data.clonemarker=true;
          } else {
            delete json.data.clonemarker;
          }

          if (privates.is_multimer) {
            json.data.multimer=true;
          } else {
            delete json.data.multimer;
          }

          return json;
        }

    };

    bui.util.setSuperClass(bui.RectangularNode, bui.Labelable);

    /**
     * @namespace
     * Observable properties which all nodes share
     */
    bui.RectangularNode.ListenerType = {
        /** @field */
        topRadius : bui.util.createListenerTypeId(),
        /** @field */
        bottomRadius : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'UnitOfInformation';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnitOfInformation} UnitOfInformation
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnitOfInformation) {
        return identifier + UnitOfInformation.id();
    };

    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.UnitOfInformation = function() {
        bui.UnitOfInformation.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.UnitOfInformation.prototype = {
        identifier : function() {
            return identifier;
        },
        auxiliaryUnit : true,
        includeInJSON : false,
        _enableResizing : false
    };

    bui.util.setSuperClass(bui.UnitOfInformation, bui.RectangularNode);
})(bui);
(function(bui) {
    var identifier = 'Macromolecule';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Macromolecule = function() {
        bui.Macromolecule.superClazz.apply(this, arguments);
        this.topRadius(bui.settings.style.nodeCornerRadius);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };
    bui.Macromolecule.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Macromolecule, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'VariableValue';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
     
    var listenerIdentifier = function(Node) {
        return identifier + Node.id();
    };
    
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     **/
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier)
        if (privates.is_existence || privates.is_location) height = width;
        var pathData = [
            'M', height/2,height,         // topleft
            'L', width-height/2, height, //draw _ on top
            'C', width+height/4, height, width+height/4,0, width-height/2, 0,
            'L', height/2, 0,          //draw _ to left
            'C', -height/4, 0, -height/4, height, height/2, height, 
            'Z'].join(' '); //draw \ to middle left
        privates.path.setAttributeNS(null, 'd', pathData);
        if(privates.is_existence == true){
            privates.existence_path.setAttributeNS(null, 'd', pathData)
            privates.clippath_path.setAttributeNS(null, 'width', width/2+height/4);
            privates.clippath_path.setAttributeNS(null, 'height', height);
            privates.clippath_path.setAttributeNS(null, 'x', width/2);
        }
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };
    
    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.path);
    };
    
    bui.VariableValue = function() {
        bui.VariableValue.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        
        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass('VariableValue');
        var privates = this._privates(identifier);
        privates.is_existence = false;
        privates.is_location = false;
        //this.adaptSizeToLabel(true);
    };
    
    bui.VariableValue.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 10,
        _minHeight : 14,
        _enableResizing : true,
        _adaptSizeToLabel : false,
        /*label : function(label) {
            bui.VariableValue.superClazz.superClazz.prototype.label.apply(this,[label]);
        }*/
        existence: function(flag){
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_existence){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_existence = flag;
                    if (flag===true){
                        this.label("");
                        privates.existence_path = document.createElementNS(bui.svgns, 'path');
                        privates.existence_path.style.setProperty('fill', 'black');
                        container.appendChild(privates.existence_path);
                        privates.existence_path.setAttribute('clip-path','url(#existence_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'existence_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect');
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.existence_path);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this;
            }
            return privates.is_existence;
        },
        location: function(flag){
            //FIXME must implement location symbol here: a big T titled to the side
            //two lines and a clippath around it
        }
    };

    bui.util.setSuperClass(bui.VariableValue, bui.Labelable);
})(bui);


(function(bui) {
    var identifier = 'Complex';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Complex} Complex
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Complex) {
        return identifier + Complex.id();
    };
    var generatePathData = function(node, width, height, shift) {
        var cornerRadius = bui.settings.style.complexCornerRadius;

        var sx = 0, sy = 0;
        if (shift !== undefined){
            sx = shift.x;
            sy = shift.y;
        }
        return ['M', width / 2 +sx, sy,
                'H', width - cornerRadius +sx,
                'L', width +sx, cornerRadius +sx,
                'V', height - cornerRadius +sy,
                'L', width - cornerRadius +sx, height +sy,
                'H', cornerRadius +sy,
                'L', sx, height - cornerRadius +sy,
                'V', cornerRadius +sy,
                'L', cornerRadius +sx, sy,
                'H', width / 2 +sx].join(' ');
    };
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier);
        privates.path.setAttributeNS(null, 'd', generatePathData(node,width,height));
        if (privates.is_multimer === true){
            privates.multimer_path.setAttributeNS(null, 'd', generatePathData(node,width,height,{x:10,y:10}));
        }
        if (privates.is_cloned === true){
            privates.clone_path.setAttributeNS(null, 'd', generatePathData(node,width,height));
            privates.clippath_path.setAttributeNS(null, 'width', width);
            privates.clippath_path.setAttributeNS(null, 'height', height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(height/3));
        }
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
        container.appendChild(privates.path);
    };
    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @class
     * Class for SBGN complexes.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Complex = function() {
        bui.Labelable.apply(this, arguments);
        
        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
         this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.complex);
        var privates = this._privates(identifier);
        privates.is_multimer = false;
        privates.is_cloned = false;
    };

    bui.Complex.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 90,
        _minHeight : 90,
        /**
         * Set this node's multimer state.
         *
         * @param {Bool} [flag] optional flag to set multimer state
         * @return {bui.RectangularNode|Bool} Fluent interface if you pass
         *   a parameter, the current multimer status otherwise.
         */
        multimer : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined) {
                if (flag!=privates.is_multimer){
                    var container = this.nodeGroup();
                    privates.is_multimer = flag;
                    if (flag===true){
                        var size = this.size();
                        privates.multimer_path = document.createElementNS(bui.svgns, 'path');
                        container.insertBefore(privates.multimer_path, container.firstChild);
                        sizeChanged.call(this, this, size.width, size.height);
                    }else{
                        container.removeChild(privates.multimer_path);
                    }
                }
                return this;
            }
            return privates.is_multimer;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag===true){
                        privates.clone_path = document.createElementNS(bui.svgns, 'path');
                        privates.clone_path.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_path);
                        privates.clone_path.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect');
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_path);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this;
            }
            return privates.is_cloned;
        },
        /**
         * Automatically layout child elements using a simple table layout
         * strategy. You can change the strategy's settings through the first
         * parameter. The structure of this object should be like
         * bui.settings.style.complexTableLayout.
         * @param {Object} [settings] Settings for the layout process.
         *   Defaults to bui.settings.style.complexTableLayout when not
         *   provided.
         */
        tableLayout : function(settings) {
            if (settings === undefined) {
                settings = bui.settings.style.complexTableLayout;
            }

            if (settings.showBorder === true) {
                this.removeClass(bui.settings.css.classes.hideBorder);
            } else {
                this.addClass(bui.settings.css.classes.hideBorder);
            }

            // the items of the table array represent rows. Row items represent
            // columns
            var table = [[]];

            var children = this.childrenWithoutAuxiliaryUnits();

            var maxColumnsOrRow = Math.max(1,
                    Math.round(Math.sqrt(children.length)));

            var addToTable;

            if (settings.restrictNumberOfColumns === true) {
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var lastRow = table[table.length - 1];

                    if (lastRow.length === maxColumnsOrRow) {
                        lastRow = [];
                        table.push(lastRow);
                    }

                    lastRow.push(node);
                };
            } else {
                var lastRow = 0;
                /**
                 * @private
                 */
                addToTable = function(node) {
                    var row = table[lastRow];

                    if (row === undefined) {
                        row = [];
                        table[lastRow] = row;
                    }

                    row.push(node);

                    lastRow++;

                    if (lastRow >= maxColumnsOrRow) {
                        lastRow = 0;
                    }
                };
            }

            var subComplexSettings = {};
            // copy original settings
            for (var key in settings) {
                if (settings.hasOwnProperty(key)) {
                    subComplexSettings[key] = settings[key];
                }
            }
            subComplexSettings.padding *= 0.7;
            subComplexSettings.restrictNumberOfColumns =
                    !subComplexSettings.restrictNumberOfColumns;

            if (subComplexSettings.padding < 4) {
                subComplexSettings.showBorder = false;
                subComplexSettings.padding = 0;
            }

            for (var i = 0; i < children.length; i++) {
                var node = children[i];

                if (node instanceof bui.Complex) {
                    node.tableLayout(subComplexSettings);
                }

                addToTable(node);
            }

            var totalWidth = Number.MIN_VALUE,
                    totalHeight = settings.padding;

            for (var rowId = 0; rowId < table.length; rowId++) {
                var row = table[rowId];

                var totalColumnWidth = settings.padding,
                        highestColumn = Number.MIN_VALUE;

                for (var columnId = 0; columnId < row.length; columnId++) {
                    // each column holds a node, i.e. a bui.Node instance
                    var columnNode = row[columnId];

                    var size = columnNode.size();
                    highestColumn = Math.max(size.height, highestColumn);

                    columnNode.position(totalColumnWidth, totalHeight);

                    // this probably needs to go to the end of the loop
                    totalColumnWidth += size.width + settings.padding;
                }
                totalHeight += highestColumn + settings.padding;
                totalWidth = Math.max(totalWidth, totalColumnWidth);
            }
            this.size(totalWidth, totalHeight);
        },
        toJSON : function() {
          var json = bui.Complex.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;
          if (privates.is_cloned) {
            json.data.clonemarker=true;
          } else {
            delete json.data.clonemarker;
          }
          if (privates.is_multimer) {
            json.data.multimer=true;
          } else {
            delete json.data.multimer;
          }

          return json;
        }

    };

    bui.util.setSuperClass(bui.Complex, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'Perturbation';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', width/5, height/2,         // start point in middle left, go clockwise to draw
            'L', 0, height,     // draw / to top
            'L', width, height, //draw _ on top
            'L', (width/5)*4, height/2,     //draw \ to middle right
            'L', width, 0,      //draw / to bottm
            'L', 0, 0,          //draw _ to left
            'L', width/5, height/2, 
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color());
        container.appendChild(privates.path);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Perturbation = function() {
        bui.Perturbation.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        //var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.perturbation);
    };

    bui.Perturbation.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 80,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Perturbation, bui.Labelable);

})(bui);

(function(bui) {
    var identifier = 'Phenotype';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', 0, height/2,         // start point in middle left, go clockwise to draw
            'L', width/5, height,     // draw / to top
            'L', (width/5)*4, height, //draw _ on top
            'L', width, height/2,     //draw \ to middle right
            'L', (width/5)*4, 0,      //draw / to bottm
            'L', width/5, 0,          //draw _ to left
            'L', 0, height/2, 
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.path);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Phenotype = function() {
        bui.Phenotype.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.perturbation);
    };

    bui.Phenotype.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 80,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Phenotype, bui.Labelable);

})(bui);

(function(bui) {
    var identifier = 'Tag';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', 0, 0,         // start point in middle left, go clockwise to draw
            'L', 0, height,     // draw / to top
            'L', (width/5)*4, height, //draw _ on top
            'L', width, height/2,     //draw \ to middle right
            'L', (width/5)*4, 0,      //draw / to bottm
            'L', 0, 0,          //draw _ to left
            'Z'].join(' '); //draw \ to middle left

        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.path);

    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Tag = function() {
        bui.Tag.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.perturbation);
    };

    bui.Tag.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 40,
        _minHeight : 30,
        orientation : function(type){
            var centerpos = this.absolutePositionCenter();
            if(type=='down'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(90,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='up'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(270,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='left'){
                this._privates(identifier).path.setAttributeNS(null, 'transform', 'rotate(180,'+centerpos.x+','+centerpos.y+')');
            }else if(type=='right'){
                //this._privates(identifier).path.setAttributeNS(null, 'transform', 'roatet(0)');
            }
        }
    };

    bui.util.setSuperClass(bui.Tag, bui.Labelable);

})(bui);

(function(bui) {
    var identifier = 'Annotation';

    /*
     * Generate a path's data attribute
     *
     * @param {Number} width Width of the shape
     * @param {Number} height Height of the shape
     * @return {String} a path's data attribute value
     */
    var sizeChanged = function(node, width, height) {
        var pathData = [
            'M', 0,0,         // start
            'H', width-15, //draw _ on top to 7/8
            'L', width, 15,
            'V', height,
            'H', 0,0,
            'Z'].join(' '); //draw \ to middle left
        var edgeData = [
            'M', width-15, 0,
            'L', width, 15,
            'H', width-15,
            
            'Z'].join(' ');
        this._privates(identifier).path.setAttributeNS(null, 'd', pathData);
        this._privates(identifier).edgePath.setAttributeNS(null, 'd', edgeData);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.path.style.setProperty('fill', color.background);
        privates.path.style.setProperty('stroke', color.border);
    };

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.RectangularNode} RectangularNode
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(RectangularNode) {
        return identifier + RectangularNode.id();
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);
        privates.path = document.createElementNS(bui.svgns, 'path');
        privates.edgePath = document.createElementNS(bui.svgns, 'path');
        privates.edgePath.style.setProperty('fill', 'black');
        privates.edgePath.style.setProperty('stroke-width', '0')
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color());
        container.appendChild(privates.path);
        container.appendChild(privates.edgePath);
    };

    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.Annotation = function() {
        bui.Annotation.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        //var privates = this._privates(identifier);

        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.annotation);
    };

    bui.Annotation.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 80,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.Annotation, bui.Labelable);

})(bui);

(function(bui) {
    var identifier = 'Compartment';
    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Compartment} Compartment
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(Compartment) {
        return identifier + Compartment.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width, height) {
        var privates = this._privates(identifier);
        privates.rect.setAttributeNS(null, 'width', width);
        privates.rect.setAttributeNS(null, 'height', height);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.rect.style.setProperty('fill', color.background);
        privates.rect.style.setProperty('stroke', color.border);
    };

    
    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint= function() {
        var container = this.nodeGroup();
        var size = this.size();
        var privates = this._privates(identifier);

        privates.rect = document.createElementNS(bui.svgns, 'rect');

        var cornerRadius = bui.settings.style.compartmentCornerRadius;
        privates.rect.setAttributeNS(null, 'rx', cornerRadius.x);
        privates.rect.setAttributeNS(null, 'ry', cornerRadius.y);

        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.rect);
    };

    /**
     * @class
     * Class for SBGN compartmentes.
     *
     * @extends bui.Node
     * @constructor
     */
    bui.Compartment = function() {
        bui.Compartment.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));


        initialPaint.call(this);

        this.addClass(bui.settings.css.classes.compartment);

        var label = this.graph()
                .add(bui.Labelable)
                .parent(this)
                .visible(true)
                .adaptSizeToLabel(true);
        label.includeInJSON = false;
        this._privates(identifier).label = label;
    };

    bui.Compartment.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 90,
        _minHeight : 90,
        /**
         * Set or retrieve this node's label. The function call will be
         * delegated to {@link bui.Labelable#label}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Labelable#label
         */
        label : function() {
            var label = this._privates(identifier).label;
            return label.label.apply(label, arguments);
        },

        /**
         * Set or retrieve this node's label position. The function call will
         * be delegated to {@link bui.Node#position}. Therefore, please refer
         * to the documentation of this method.
         *
         * @see bui.Node#position
         */
        labelPosition : function() {
            var label = this._privates(identifier).label;
            return label.position.apply(label, arguments);
        },
        toJSON : function() {
            var json = bui.Compartment.superClazz.prototype.toJSON.call(this),
                    privates = this._privates(identifier),
                    dataFormat = bui.settings.dataFormat;
            updateJson(json, dataFormat.node.label, privates.label.label());

            return json;
        }
    };

    bui.util.setSuperClass(bui.Compartment, bui.Node);
})(bui);

(function(bui) {
    var identifier = 'NucleicAcidFeature';
    /**
     * @class
     * A node with the shape of an rectangle and a label inside.
     * This shape has be default rounded corners.
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.NucleicAcidFeature = function() {
        bui.NucleicAcidFeature.superClazz.apply(this, arguments);
        this.bottomRadius(bui.settings.style.nodeCornerRadius);
    };
    bui.NucleicAcidFeature.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 60,
        _minHeight : 60
    };

    bui.util.setSuperClass(bui.NucleicAcidFeature, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'StateVariable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StateVariable} StateVariable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(StateVariable) {
        return identifier + StateVariable.id();
    };

    /**
     * @private size changed listener
     */
    var sizeChanged = function(node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);

        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.ellipse.style.setProperty('fill', color.background);
        privates.ellipse.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()),
        this.nodeGroup().appendChild(privates.ellipse);
    };



    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.StateVariable = function() {
        bui.StateVariable.superClazz.apply(this, arguments);
		
        var colorChangedListener = colorChanged.createDelegate(this);
		
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.adaptSizeToLabel(true);
    };

    bui.StateVariable.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 20,
        _minHeight : 20,
        auxiliaryUnit : true,
        includeInJSON : false,
        _enableResizing : true,

        // override
        toJSON : function() {
            return this.label();

            /*
            // is actually an override but won't call the superclass because
            // units of information aren't considered as nodes in the JSON
            // data format. We are also assuming that only the state variable's
            // label can be edited and that therefore the JSON data needs to
            // be extracted from the label.
            
            var json = [null, ''];

            var labelParts = this.label().split('@');

            json[0] = getModificationSBOForLabel(labelParts[0]);

            if (labelParts.length > 1) {
                json[1] = labelParts[1];
            }

            return json;
            */
        }
    };
    bui.util.setSuperClass(bui.StateVariable, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'StateVariableER';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StateVariable} StateVariable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(StateVariableER) {
        return identifier + StateVariableER.id();
    };


    /**
     * @class
     * State variable class which can be used in combination with other nodes
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.StateVariableER = function() {
        bui.StateVariableER.superClazz.apply(this, arguments);
        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass(bui.settings.css.classes.statevariable);
    };

    bui.StateVariableER.prototype = {
        identifier : function() {
            return identifier;
        },
        _minWidth : 10,
        _minHeight : 14,
        auxiliaryUnit : true,
        includeInJSON : false,
        _enableResizing : true,
        // override
        toJSON : function() {
            if (this.hasClass('existence')) 
                return 'existence'
            else if (this.hasClass('location'))
                return 'location'
            else 
                return this.label();
        }
    };
    bui.util.setSuperClass(bui.StateVariableER, bui.VariableValue);
})(bui);

(function(bui) {
    var identifier = 'SimpleChemical';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.SimpleChemical} SimpleChemical
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(SimpleChemical) {
        return identifier + SimpleChemical.id();
    };

    var sizeChanged = function(node, width, height) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        if (privates.is_multimer === true){
            privates.multimer_circle.setAttributeNS(null, 'cx', r+5);
            privates.multimer_circle.setAttributeNS(null, 'cy', r+7);
            privates.multimer_circle.setAttributeNS(null, 'r', r);
        }
        if (privates.is_cloned === true){
            privates.clone_circle.setAttributeNS(null, 'cx', r);
            privates.clone_circle.setAttributeNS(null, 'cy', r);
            privates.clone_circle.setAttributeNS(null, 'r', r);
            privates.clippath_path.setAttributeNS(null, 'width', width);
            privates.clippath_path.setAttributeNS(null, 'height', height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(height/3));
        }
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.circle.style.setProperty('fill', color.background);
        privates.circle.style.setProperty('stroke', color.border);
        if (privates.is_multimer === true){
            privates.multimer_circle.style.setProperty('fill', color.background);
            privates.multimer_circle.style.setProperty('stroke', color.border);
        }
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        sizeChanged.call(this, this, this.size().width);
        colorChanged.call(this, this, this.color());
        container.appendChild(privates.circle);
    };

    /**
     * @class
     * Class for SBGN simple chemicals. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.SimpleChemical = function() {
        bui.SimpleChemical.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);
        privates.is_multimer = false;
        privates.is_cloned = false;
        initialPaint.call(this);
    };

    bui.SimpleChemical.prototype = {
        identifier : function() {
            return identifier;
        },
        /**
         * Set this node's multimer state.
         *
         * @param {Bool} [flag] optional flag to set multimer state
         * @return {bui.RectangularNode|Bool} Fluent interface if you pass
         *   a parameter, the current multimer status otherwise.
         */
        multimer : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_multimer){
                    var container = this.nodeGroup();
                    privates.is_multimer = flag;
                    if (flag===true){
                        privates.multimer_circle = document.createElementNS(bui.svgns, 'circle');
                        container.insertBefore(privates.multimer_circle, container.firstChild);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                    }else{
                        container.removeChild(privates.multimer_circle);
                    }
                }
                return this;
            }
            return privates.is_multimer;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag===true){
                        privates.clone_circle = document.createElementNS(bui.svgns, 'circle');
                        privates.clone_circle.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_circle);
                        privates.clone_circle.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect');
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_circle);
                        defsGroup.removeChild(privates.clippath);
                    }
                }
                return this;
            }
            return privates.is_cloned;
        },
        toJSON : function() {
          var json = bui.SimpleChemical.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;
          if (privates.is_cloned) {
            json.data.clonemarker=true;
          } else {
            delete json.data.clonemarker;
          }
          if (privates.is_multimer) {
            json.data.multimer=true;
          } else {
            delete json.data.multimer;
          }

          return json;
        },

        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.SimpleChemical, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'UnspecifiedEntity';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.UnspecifiedEntity} UnspecifiedEntity
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(UnspecifiedEntity) {
        return identifier + UnspecifiedEntity.id();
    };

    /**
     * @private position / size listener
     */
    var sizeChanged = function(
            node, width, height) {
        var x = width / 2, y = height / 2;
        var privates = this._privates(identifier);
        privates.ellipse.setAttributeNS(null, 'cx', x);
        privates.ellipse.setAttributeNS(null, 'cy', y);

        privates.ellipse.setAttributeNS(null, 'rx', x);
        privates.ellipse.setAttributeNS(null, 'ry', y);
        if (privates.is_cloned){
            privates.clone_ellipse.setAttributeNS(null, 'cx', x);
            privates.clone_ellipse.setAttributeNS(null, 'cy', y);
            privates.clone_ellipse.setAttributeNS(null, 'rx', x);
            privates.clone_ellipse.setAttributeNS(null, 'ry', y);
            privates.clippath_path.setAttributeNS(null, 'width', width);
            privates.clippath_path.setAttributeNS(null, 'height', height / 3);
            privates.clippath_path.setAttributeNS(null, 'y', 2*(height/3));
        }
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.ellipse.style.setProperty('fill', color.background);
        privates.ellipse.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.ellipse = document.createElementNS(bui.svgns, 'ellipse');
        var size = this.size();
        sizeChanged.call(this, this, size.width, size.height);
		colorChanged.call(this, this, this.color()), 
        container.appendChild(privates.ellipse);
    };

    /**
     * @class
     * A node with the shape of an ellipse and a label inside.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.UnspecifiedEntity = function() {
        bui.UnspecifiedEntity.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);

        this.bind(bui.Node.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));
        var privates = this._privates(identifier);
        privates.is_cloned = false;
        initialPaint.call(this);
    };

    bui.UnspecifiedEntity.prototype = {
        identifier : function() {
            return identifier;
        },
        clonemarker : function(flag) {
            var privates = this._privates(identifier);
            if (flag !== undefined){
                if (flag!=privates.is_cloned){
                    var container = this.nodeGroup();
                    var defsGroup = this.graph().defsGroup();
                    privates.is_cloned = flag;
                    if (flag==true){
                        privates.clone_ellipse = document.createElementNS(bui.svgns, 'ellipse');
                        privates.clone_ellipse.style.setProperty('fill', 'black');
                        container.appendChild(privates.clone_ellipse);
                        privates.clone_ellipse.setAttribute('clip-path','url(#clone_'+this.id()+')');
                        privates.clippath = document.createElementNS(bui.svgns, 'clipPath');
                        privates.clippath.setAttribute('id', 'clone_'+this.id());
                        privates.clippath_path = document.createElementNS(bui.svgns, 'rect')
                        privates.clippath_path.setAttributeNS(null, 'x', 0);
                        sizeChanged.call(this, this, this.size().width, this.size().height);
                        privates.clippath.appendChild(privates.clippath_path);
                        defsGroup.appendChild(privates.clippath);
                    }else{
                        container.removeChild(privates.clone_ellipse);
                        defsGroup.removeChild(clippath);
                    }
                }
                return this
            }
            return privates.is_cloned;
        },
        toJSON : function() {
          var json = bui.UnspecifiedEntity.superClazz.prototype.toJSON.call(this),
                  privates = this._privates(identifier),
                  dataFormat = bui.settings.dataFormat;
          if (privates.is_cloned) {
            json.data.clonemarker=true;
          } else {
            delete json.data.clonemarker;
          }

          return json;
        },
        _minWidth : 70,
        _minHeight : 50
    }
    bui.util.setSuperClass(bui.UnspecifiedEntity, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'EmptySet';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.EmptySet} EmptySet
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(EmptySet) {
        return identifier + EmptySet.id();
    };

    var sizeChanged = function(node, width) {
        var r = width / 2;
        var privates = this._privates(identifier);
        privates.circle.setAttributeNS(null, 'cx', r);
        privates.circle.setAttributeNS(null, 'cy', r);
        privates.circle.setAttributeNS(null, 'r', r);
        var pathData = [
            'M', 0, width,
            'L', width, 0,
            'Z'].join(' ');
        privates.dash.setAttributeNS(null, 'd', pathData);
        privates.dash.setAttributeNS(null, 'stroke', 'black');
        privates.dash.setAttributeNS(null, 'stroke-width', 2);
    };

    /**
     * @private background/text color listener
     */
    var colorChanged = function() {
        var privates = this._privates(identifier);
        var color = this.color();
        privates.circle.style.setProperty('fill', color.background);
        privates.circle.style.setProperty('stroke', color.border);
        privates.dash.style.setProperty('stroke', color.border);
    };

    /**
     * @private used from the constructor to improve readability
     */
    var initialPaint = function() {
        var container = this.nodeGroup();
        var privates = this._privates(identifier);
        privates.circle = document.createElementNS(bui.svgns, 'circle');
        privates.dash = document.createElementNS(bui.svgns, 'path');
        sizeChanged.call(this, this, this.size().width);
		colorChanged.call(this, this, this.color());
        container.appendChild(privates.circle);
        container.appendChild(privates.dash);
    };

    /**
     * @class
     * Class for SBGN empty set. Please note that the width and height
     * values must be equal.
     *
     * @extends bui.Labelable
     * @constructor
     */
    bui.EmptySet = function() {
        bui.EmptySet.superClazz.apply(this, arguments);

        var colorChangedListener = colorChanged.createDelegate(this);
        
        this.bind(bui.Labelable.ListenerType.size,
                sizeChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Node.ListenerType.color,
                colorChangedListener,
                listenerIdentifier(this));

        initialPaint.call(this);
    };

    bui.EmptySet.prototype = {
        identifier : function() {
            return 'EmptySet';
        },
        _minWidth : 60,
        _minHeight : 60,
        _forceRectangular : true,
        _calculationHook : circularShapeLineEndCalculationHook
    };

    bui.util.setSuperClass(bui.EmptySet, bui.Labelable);
})(bui);

(function(bui) {
    var identifier = 'Process';
    /**
     * @class
     * Process node "process"
     *
     * @extends bui.RectangularNode
     * @constructor
     */
    bui.Process = function(type) {
        bui.Process.superClazz.apply(this, arguments);

        this.labelClass(bui.settings.css.classes.smallText,
                [bui.settings.css.classes.textDimensionCalculation.small]);
        this.addClass(bui.settings.css.classes.process);
        if (typeof(type) === 'object') {
            if(type == 379) this.label('\\\\');
            else if(type == 396) this.label('?');
        }
                
    };

    bui.Process.prototype = {
        identifier : function() {
            return identifier;
        },
        clonemarker: undefined,
        multimer: undefined,
        _enableResizing : false,
        _adaptSizeToLabel : false,
        _minWidth : bui.settings.style.processNodeMinSize.width,
        _minHeight : bui.settings.style.processNodeMinSize.height,
        _ignLabelSize : true
    };

    bui.util.setSuperClass(bui.Process, bui.RectangularNode);
})(bui);

(function(bui) {
    var identifier = 'bui.AttachedDrawable';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AttachedDrawable} attachedDrawable
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(attachedDrawable) {
        return identifier + attachedDrawable.id();
    };

    /**
     * @private Source remove listener
     */
    var sourceRemoveListener = function() {
        this.source(null);
    };

    /**
     * @private Source remove listener
     */
    var targetRemoveListener = function() {
        this.target(null);
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the source node.
     */
    var sourceBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    sourceRemoveListener.createDelegate(this),
                    listenerIdentifier(this) + 'source');
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this) + 'source');
        }
    };

    /**
     * @private Generic listener which will unbind previous listener
     * for the target node.
     */
    var targetBindListener = function(attached, newX, oldX) {
        if (newX !== null) {
            newX.bind(bui.Drawable.ListenerType.remove,
                    targetRemoveListener.createDelegate(this),
                    listenerIdentifier(this) + 'target');
        }

        if (oldX !== null) {
            oldX.unbindAll(listenerIdentifier(this) + 'target');
        }
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        var privates = this._privates(identifier);

        if (privates.source !== null) {
            privates.source.unbindAll(listenerIdentifier(this) + 'source');
        }

        if (privates.target !== null) {
            privates.target.unbindAll(listenerIdentifier(this) + 'target');
        }
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.Drawable
     * @constructor
     */
    bui.AttachedDrawable = function(){
        bui.AttachedDrawable.superClazz.apply(this, arguments);
        this._addType(bui.AttachedDrawable.ListenerType);

        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetBindListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));

        var privates = this._privates(identifier);
        privates.source = null;
        privates.target = null;
    };

    bui.AttachedDrawable.prototype = {
        /**
         * Change the source of this attached drawable.
         *
         * @param {bui.Node} [source] The new source or omit if you would
         *   like to retrieve the current source.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current source is returned.
         */
        source : function(source) {
            var privates = this._privates(identifier);

            if (source !== undefined) {
                if (source !== privates.source) {
                    var oldSource = privates.source;
                    privates.source = source;
                    this.fire(bui.AttachedDrawable.ListenerType.source,
                            [this, privates.source, oldSource]);
                }

                return this;
            }

            return privates.source;
        },

        /**
         * Change the target of this attached drawable.
         *
         * @param {bui.Node} [target] The new target or omit if you would
         *   like to retrieve the current target.
         * @return {bui.AttachedDrawable|bui.Node} Fluent interface in case
         *   you pass a parameter, otherwise the current target is returned.
         */
        target : function(target) {
            var privates = this._privates(identifier);

            if (target !== undefined) {
                if (target !== privates.target) {
                    var oldTarget = privates.target;
                    privates.target = target;
                    this.fire(bui.AttachedDrawable.ListenerType.target,
                            [this, privates.target, oldTarget]);
                }

                return this;
            }

            return privates.target;
        },

        // overridden
        toJSON : function() {
            var json = bui.AttachedDrawable.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.source !== null) {
                if (privates.source instanceof bui.EdgeHandle){
                    updateJson(json, dataFormat.edge.source, privates.source.edge().id() + ":" + privates.source.edge().getPosition(privates.source));
                }else if (privates.source.identifier() == 'bui.StateVariableER'|| privates.source.identifier() == 'bui.StateVariable'){
                    updateJson(json, dataFormat.edge.source, privates.source.parent().id()+':'+privates.source.toJSON());
                }else{
                    updateJson(json, dataFormat.edge.source, privates.source.id());
                }
            }
            if (privates.target !== null) {
                if (privates.target instanceof bui.EdgeHandle){
                    updateJson(json, dataFormat.edge.target, privates.target.edge().id() + ":" + privates.target.edge().getPosition(privates.target));
                }else if (privates.target.identifier() == 'bui.StateVariableER'|| privates.target.identifier() == 'bui.StateVariable'){
                    updateJson(json, dataFormat.edge.target, privates.target.parent().id()+':'+privates.target.toJSON());
                }else{
                    updateJson(json, dataFormat.edge.target, privates.target.id());
                }
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AttachedDrawable, bui.Drawable);

    /**
     * @namespace
     * Observable properties which all attached drawable nodes share
     */
    bui.AttachedDrawable.ListenerType = {
        /** @field */
        source : bui.util.createListenerTypeId(),
        /** @field */
        target : bui.util.createListenerTypeId()
    };
})(bui);

(function(bui) {
    var identifier = 'bui.AbstractLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.AbstractLine} abstractLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(abstractLine) {
        return identifier + abstractLine.id();
    };

    /**
     * @private visibility listener
     */
    var visibilityChanged = function(drawable, visible) {
        if (visible === true) {
            this.removeClass(bui.settings.css.classes.invisible);
        } else {
            this.addClass(bui.settings.css.classes.invisible);
        }
    };

    /**
     * @private classes listener
     */
    var classesChanged = function(drawable, classString) {
        this._line.setAttributeNS(
                null, 'class', classString);
        marker = this._privates(identifier).marker;
        if (marker !== null) {
            if(classString.indexOf(bui.settings.css.classes.lineHover) !== -1  || classString.indexOf('selected') !== -1){
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(
                                bui.util.getHoverId(marker)
                        ));
            }else{
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        }
    };

    /**
     * @private remove listener
     */
    var removeListener = function() {
        this._line.parentNode.removeChild(this._line);
    };

    /**
     * @private Source and target visibility listener
     */
    var endpointVisibilityChanged = function() {
        var source = this.source(), target = this.target();

        this.visible(source !== null && target !== null &&
                    (source.visible() === true || source instanceof bui.EdgeHandle) && 
                    (target.visible() === true || target instanceof bui.EdgeHandle));
    };

    /**
     * @private source changed listener
     */
    var sourceChanged = function(drawable, newSource, oldSource) {
        if (oldSource !== null) {
            oldSource.unbindAll(listenerIdentifier(this) + 'source');
        }

        if (newSource !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newSource.bind(bui.Node.ListenerType.absolutePosition, listener,
                    listenerIdentifier(this) + 'source');
            newSource.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this) + 'source');

            newSource.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this) + 'source');
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private target changed listener
     */
    var targetChanged = function(drawable, newTarget, oldTarget) {
        if (oldTarget !== null) {
            oldTarget.unbindAll(listenerIdentifier(this) + 'target');
        }

        if (newTarget !== null) {
            var listener = this._sourceOrTargetDimensionChanged
                    .createDelegate(this);
            newTarget.bind(bui.Node.ListenerType.absolutePosition, listener,
                    listenerIdentifier(this) + 'target');
            newTarget.bind(bui.Node.ListenerType.size, listener,
                    listenerIdentifier(this) + 'target');

            newTarget.bind(bui.Drawable.ListenerType.visible,
                    endpointVisibilityChanged.createDelegate(this),
                    listenerIdentifier(this) + 'target');
        }

        this._sourceOrTargetDimensionChanged();
        endpointVisibilityChanged.call(this);
    };

    /**
     * @private mouse in listener
     */
    var lineMouseIn = function(event) {
        this.hoverEffectActive(true);
        this.fire(bui.AbstractLine.ListenerType.mouseEnter,
                                [this, event]);
    };

    /**
     * @private mouse out listener
     */
    var lineMouseOut = function(event) {
        this.hoverEffectActive(false);
        this.fire(bui.AbstractLine.ListenerType.mouseLeave,
                                [this, event]);
    };

    /**
     * @private hoverEffectActive listener
     */
    var hoverEffectActiveChanged = function(edge, active) {
        var marker;
        if (active === true && this.hoverEffect()) {
            this.addClass(bui.settings.css.classes.lineHover);
        } else {
            this.removeClass(bui.settings.css.classes.lineHover);
       }
    };

    /**
     * @private line click listener
     */
    var lineClick = function(event) {
        this.fire(bui.AbstractLine.ListenerType.click,
                                [this, event]);
    };

    /**
     * @private line click listener
     */
    var lineMouseDown = function(event) {
        this.fire(bui.AbstractLine.ListenerType.mousedown,
                                [this, event]);
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AttachedDrawable
     * @constructor
     * 
     * @param {String} id complete id
     * @param {bui.Graph} graph The graph which this drawable shall be
     *   part of.
     */
    bui.AbstractLine = function(args){
        //args.id = bui.settings.idPrefix.edge + args.id;
        bui.AbstractLine.superClazz.call(this, args);
        this._addType(bui.AbstractLine.ListenerType);

        var privates = this._privates(identifier);
        privates.hoverEffect = true;
        privates.marker = null;
        privates.markerId = null;
        privates.hoverEffectActive = false;
        privates.lineStyle = null;

        this.bind(bui.Drawable.ListenerType.visible,
                visibilityChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.classes,
                classesChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.Drawable.ListenerType.remove,
                removeListener.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.source,
                sourceChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AttachedDrawable.ListenerType.target,
                targetChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AbstractLine.ListenerType.marker,
                this._markerChanged.createDelegate(this),
                listenerIdentifier(this));
        this.bind(bui.AbstractLine.ListenerType.hoverEffectActive,
                hoverEffectActiveChanged.createDelegate(this),
                listenerIdentifier(this));

        this._initialPaint();

        this._line.setAttributeNS(null, 'id', this.id());
        jQuery(this._line).mouseenter(lineMouseIn.createDelegate(this));
        jQuery(this._line).mouseleave(lineMouseOut.createDelegate(this));
        jQuery(this._line).click(lineClick.createDelegate(this));
        jQuery(this._line).mousedown(lineMouseDown.createDelegate(this));

        this.addClass(bui.settings.css.classes.line);
    };

    bui.AbstractLine.prototype = {
        /**
         * @private
         * This property should hold the line element
         */
        _line : null,

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _initialPaint : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Method to be overridden by sub classes.
         */
        _sourceOrTargetDimensionChanged : function() {
            throw 'Not implemented!';
        },

        /**
         * @private
         * Marker changed listener. "Protected" in order to allow subclasses
         * to override the behavior.
         */
        _markerChanged : function(line, marker) {
            if (marker === null) {
                this._line.setAttributeNS(null, 'marker-end', '');
                this._line.removeAttributeNS(null, 'marker-end');
            } else {
                this._line.setAttributeNS(null, 'marker-end',
                        bui.util.createMarkerAttributeValue(marker));
            }
        },

        /**
         * Set the marker, i.e. a symbol at the end of the line.
         *
         * @param {Object} [markerId] Marker type identification.
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         * @return {bui.AbstractLine|String} The id of the current marker when
         *   you omit the parameter. In case you pass a parameter it will be
         *   set as a new marker and the current instance will be removed
         *   (fluent interface).
         */
        marker : function(markerId) {
            var privates = this._privates(identifier);

            if (markerId !== undefined) {
                if (markerId === null) {
                    privates.marker = null;
                    privates.markerId = null;
                    this.fire(bui.AbstractLine.ListenerType.marker,
                            [this, null]);
                } else {
                    var marker = this.graph().connectingArcs()[markerId];

                    if (marker !== undefined && marker.id !== privates.marker){
                        privates.marker = marker.id;
                        privates.markerId = markerId;
                        this.fire(bui.AbstractLine.ListenerType.marker,
                                [this, marker.id]);
                    }
                }
                classesChanged.call(this, this, this.classString());//make the marker look good whatever the classes are currently

                return this;
            }

            return privates.markerId;
        },

        /**
         * Get the marker ID, i.e. a symbol at the end of the line.
         *
         * @return {String} The ID of the current marker symbol
         *   The appropriate identifications can be retrieved through the id
         *   property of the connecting arcs generation functions. Example:
         *
         *   bui.connectingArcs.stimulation.id
         */
        markerId : function() {
            var privates = this._privates(identifier);

            return privates.markerId;
        },
        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * line.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            for (var availableStyle in bui.AbstractLine.Style) {
                if (bui.AbstractLine.Style.hasOwnProperty(availableStyle)) {
                    this.removeClass(bui.AbstractLine.Style[availableStyle]);
                }
            }

            this._privates(identifier).lineStyle = style;

            this.addClass(bui.AbstractLine.Style[style]);

            return this;
        },

        /**
         * Enable or disable the line's hover effect.
         *
         * @param {Boolean} [hoverEffect] True to enable hover effects, false
         *   otherwise. Omit to retrieve current setting.
         * @return {Boolean|bui.AbstractLine} Fluent interface in case you pass
         *   a new value, the current value if you omit the parameter.
         */
        hoverEffect : function(hoverEffect) {
            var privates = this._privates(identifier);
            
            if (hoverEffect !== undefined) {
                privates.hoverEffect = hoverEffect;
                return this;
            }

            return privates.hoverEffect;
        },

        /**
         * Show or hide the hover effect.
         *
         * @param {Boolean} [active] True to show the hover effect. Omit to
         *   retrieve whether it is shown or not.
         * @return {Boolean|bui.AbstractLine} If you pass a parameter the
         *   instance on which you called this function will be returned. In
         *   case you don't pass a parameter the current setting will be
         *   returned.
         */
        hoverEffectActive : function(active) {
            var privates = this._privates(identifier);

            if (active !== undefined) {
                // effect may only be shown when hover effects are activated.
                active = active && this.hoverEffect();
                
                if (active !== privates.hoverEffectActive) {
                    privates.hoverEffectActive = active;
                    this.fire(bui.AbstractLine.ListenerType.hoverEffectActive,
                                [this, active]);
                }

                return this;
            }

            return privates.hoverEffectActive;
        },

        // overridden
        toJSON : function() {
            var json = bui.AbstractLine.superClazz.prototype.toJSON.call(this),
                    dataFormat = bui.settings.dataFormat,
                    privates = this._privates(identifier);

            if (privates.lineStyle !== null &&
                    privates.lineStyle !== bui.AbstractLine.Style.solid) {
                updateJson(json, dataFormat.edge.style, privates.lineStyle);
            }

            if (privates.markerId !== null) {
                var sbo = getSBOForMarkerId(privates.markerId);

                if (sbo !== null) {
                    updateJson(json, dataFormat.drawable.sbo, sbo);
                }
                //updateJson(json, dataFormat.edge.type, privates.markerId); FIXME this collides with data.type indicating spline status
                
            }

            return json;
        }
    };

    bui.util.setSuperClass(bui.AbstractLine, bui.AttachedDrawable);

    /**
     * @namespace
     * Observable properties of the AbstractLine class
     */
    bui.AbstractLine.ListenerType = {
        /** @field */
        marker : bui.util.createListenerTypeId(),
        /** @field */
        click : bui.util.createListenerTypeId(),
        /** @field */
        mousedown : bui.util.createListenerTypeId(),
        /** @field */
        mouseEnter : bui.util.createListenerTypeId(),
        /** @field */
        mouseLeave : bui.util.createListenerTypeId(),
        /** @field */
        hoverEffectActive : bui.util.createListenerTypeId()
    };

    /**
     * @namespace
     * This Object defines the various line styles which can be applied to
     * a line.
     */
    bui.AbstractLine.Style = {
        solid : bui.settings.css.classes.lineStyle.solid,
        dotted : bui.settings.css.classes.lineStyle.dotted,
        dashed : bui.settings.css.classes.lineStyle.dashed
    };
})(bui);

(function(bui) {
    var identifier = 'StraightLine';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.StraightLine} straightLine
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(straightLine) {
        return identifier + straightLine.id();
    };

    /**
     * @class
     * A drawable which has both, a source and a target
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.StraightLine = function(args){
        bui.StraightLine.superClazz.apply(this, arguments);
    };

    bui.StraightLine.prototype = {
        identifier : function() {
            return identifier;
        },
        includeInJSON : false,

        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            this._line = document.createElementNS(bui.svgns, 'line');
            this.graph().edgeGroup().appendChild(this._line);
            this.addClass(bui.settings.css.classes.invisible);
        },

        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
            var target = this.target(),
                    source = this.source();

            if (target !== null && source !== null) {
                var to = source.calculateLineEnd(target);
                this._line.setAttributeNS(null, 'x1', to.x);
                this._line.setAttributeNS(null, 'y1', to.y);

                to = target.calculateLineEnd(source);
                this._line.setAttributeNS(null, 'x2', to.x);
                this._line.setAttributeNS(null, 'y2', to.y);
            }
        }
    };

    bui.util.setSuperClass(bui.StraightLine, bui.AbstractLine);
})(bui);

(function(bui) {
    var identifier = 'Edge';

    /**
     * @private
     * Function used for the generation of listener identifiers
     * @param {bui.Edge} edge
     * @return {String} listener identifier
     */
    var listenerIdentifier = function(edge) {
        return identifier + edge.id();
    };
    /**
     * @private
     * Function used to update SVG representation of Edge
     */
    
    var updateEdge = function(){
      var privates = this._privates(identifier);
      if (this.source() == null || this.target() == null) return;
 
//       if (privates.source.parent() == privates.target.parent()){
//         // if source and target have same parent, make all points also children
//         for (var i=0;i<privates.points.length;i++){
//           var p=privates.points[i].point;
//           if (p.parent() !== privates.source.parent()){
//             var pos=p.absoluteCenter();
//             p.parent(privates.source.parent());
//             p.absoluteCenter(pos);
//           }
//           if (privates.isSpline){
//             var h=privates.points[i].splineHandle;
//             }
//           }
//         }
//       }
      if (privates.isSpline) {
        updateSpline.call(this);
      } else {
        updateStraight.call(this);
      }
    };
    
    /**
     * @private
     * Function to calculate Spline from controlpoints and create SVG. Called by updateEdge for spline edges. Also updates spline handle positions if edge points are modified.
     */
    var updateSpline = function(){
      var privates = this._privates(identifier);

      var source = this.source();
      var target = this.target();
      

      // calculate intersect point of line defined by spline handle and border of node ( this is where the edge is supposed to start or end)
      var sourcePosition = source.calculateLineEnd(source.absoluteCenter().x+privates.sourceSplineHandleVec.x,
                                                source.absoluteCenter().y+privates.sourceSplineHandleVec.y),
          targetPosition = target.calculateLineEnd(target.absoluteCenter().x+privates.targetSplineHandleVec.x,
                                                target.absoluteCenter().y+privates.targetSplineHandleVec.y);
      //copy to privates for topLeft bottomRight prototype functions, which are needed for selection rectangles
      privates.sourcePosition = sourcePosition;
      privates.targetPosition = targetPosition;
      // repositon splineHandles if they are within the node
      var dx=sourcePosition.x-source.absoluteCenter().x,
          dy=sourcePosition.y-source.absoluteCenter().y;
      if (Math.abs(dx)>=Math.abs(privates.sourceSplineHandleVec.x)){
          privates.sourceSplineHandleVec.x=dx*1.2;
          privates.sourceSplineHandleVec.y=dy*1.2;
      }
      dx=targetPosition.x-target.absoluteCenter().x,
      dy=targetPosition.y-target.absoluteCenter().y;
      if (Math.abs(dx)>=Math.abs(privates.targetSplineHandleVec.x)){
          privates.targetSplineHandleVec.x=dx*1.2;
          privates.targetSplineHandleVec.y=dy*1.2;
      }

      var sourceSplineHandle = privates.sourceSplineHandle,
          targetSplineHandle = privates.targetSplineHandle;
      privates.positioningSplineHandles=true; // this is to indicate that position changes of spline handles are not user interactions
      // now set spline handle positions according to source, target and edge point positions
      sourceSplineHandle.absolutePositionCenter(source.absoluteCenter().x+privates.sourceSplineHandleVec.x,
                                                source.absoluteCenter().y+privates.sourceSplineHandleVec.y);
      for (var i=0;i<privates.points.length;i++){
          privates.points[i].splineHandle.absolutePositionCenter(privates.points[i].point.absoluteCenter().x+privates.points[i].dx,
                                                                 privates.points[i].point.absoluteCenter().y+privates.points[i].dy)
      }
      targetSplineHandle.absolutePositionCenter(target.absoluteCenter().x+privates.targetSplineHandleVec.x,
                                                target.absoluteCenter().y+privates.targetSplineHandleVec.y);
      privates.positioningSplineHandles=false;

      var sourceSplineHandlePosition = sourceSplineHandle
                      .absoluteCenter(),
              targetSplineHandlePosition = targetSplineHandle
                      .absoluteCenter();

      var data = ['M' ,
              sourcePosition.x,
              sourcePosition.y,
              'C',
              sourceSplineHandlePosition.x,
              sourceSplineHandlePosition.y]
      for (var i=0;i<privates.points.length;i++){
          var p=privates.points[i];
          data.push.apply(data,[p.point.absoluteCenter().x+p.dx,
                      p.point.absoluteCenter().y+p.dy,
                      p.point.absoluteCenter().x,
                      p.point.absoluteCenter().y,
                      'S']);
      }
      data.push.apply(data,[targetSplineHandlePosition.x,
              targetSplineHandlePosition.y,
              targetPosition.x,
              targetPosition.y]);


      this._line.setAttributeNS(null, 'd', data.join(' '));
      
    }
    /**
     * @private
     * Function to calculate straight path from controlpoints and create SVG. Called by updateEdge for straight edges. 
     */
    var updateStraight= function(){
      var privates = this._privates(identifier);
      var source = this.source();
      var target = this.target();
      
      var num=privates.points.length;
      if (bui.settings.straightenEdges){
        if((num> 0)){
          var sp = source.absoluteCenter();
          var tp = target.absoluteCenter();
          var lx = tp.x-sp.x;
          var ly = tp.y-sp.y;
          for(var i = 0; i<num; i++){
              privates.points[i].point.absolutePositionCenter(sp.x+((i+1)*lx/(num+1)),sp.y+((i+1)*ly/(num+1)));
          }
        }
      }

      // calculate intersect point of line defined first or last line segment and border of node ( this is where the edge is supposed to start or end)
      var sourcePosition = source.calculateLineEnd(num==0 ? target : privates.points[0].point),
          targetPosition = target.calculateLineEnd(num==0 ? source : privates.points[num-1].point);
      //copy to privates for topLeft bottomRight prototype functions, which are needed for selection rectangles
      privates.sourcePosition = sourcePosition;
      privates.targetPosition = targetPosition;
      // create Path data
      var data= ['M', sourcePosition.x, sourcePosition.y];
      for (var i=0;i<num;i++){
        var p=privates.points[i];
        data.push('L',p.point.absoluteCenter().x, p.point.absoluteCenter().y);
      }
      data.push('L', targetPosition.x, targetPosition.y);
      this._line.setAttributeNS(null, 'd', data.join(' '));
    }
    /**
     * @private
     * handler for reacting on user interaction with spline handle
     */
    var splineHandleChanged = function() {
//      console.log("splineHandleChanged");
      var privates = this._privates(identifier);
      if (privates.positioningSplineHandles) return; // if spline handles are modified internally return

      privates.sourceSplineHandleVec.x=privates.sourceSplineHandle.absoluteCenter().x-this.source().absoluteCenter().x;
      privates.sourceSplineHandleVec.y=privates.sourceSplineHandle.absoluteCenter().y-this.source().absoluteCenter().y;
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].dx=privates.points[i].splineHandle.absoluteCenter().x-privates.points[i].point.absoluteCenter().x;
        privates.points[i].dy=privates.points[i].splineHandle.absoluteCenter().y-privates.points[i].point.absoluteCenter().y;
      }
      privates.targetSplineHandleVec.x=privates.targetSplineHandle.absoluteCenter().x-this.target().absoluteCenter().x;
      privates.targetSplineHandleVec.y=privates.targetSplineHandle.absoluteCenter().y-this.target().absoluteCenter().y;

      updateSpline.call(this); // update spline (no need to call updateEdge?)
    };

    /**
     * @private
     * function called when straight edge is transformed into spline. Calculates initial spline handle positions and creates them. updates SVG.
     */
    var makeSpline = function(){
      console.log('making it a spline');
      var privates = this._privates(identifier);
      
      if (privates.isSpline) return;
      privates.isSpline=true;
      
      // calculate some feasible values for all spline handles
      if (privates.sourceSplineHandleVec == undefined){
        var t=(privates.points.length ? privates.points[0].point.absoluteCenter() : this.target().absoluteCenter());
        privates.sourceSplineHandleVec={x:(t.x-this.source().absoluteCenter().x)/4,y:(t.y-this.source().absoluteCenter().y)/4};
      }
      if (privates.targetSplineHandleVec == undefined){
        var t=(privates.points.length ? privates.points[privates.points.length-1].point.absoluteCenter() : this.source().absoluteCenter());
        privates.targetSplineHandleVec={x:(t.x-this.target().absoluteCenter().x)/4,y:(t.y-this.target().absoluteCenter().y)/4};
      }
      for (var i=0;i<privates.points.length;i++){
        var t1=(i==0 ? this.source().absoluteCenter() : privates.points[i-1].point.absoluteCenter());
        var t2=(i==privates.points.length-1 ? this.target().absoluteCenter() : privates.points[i+1].point.absoluteCenter());
        privates.points[i].dx=-(t2.x-t1.x)/4;
        privates.points[i].dy=-(t2.y-t1.y)/4;
      }
      
      // create spline handles and add listener
      var listener = splineHandleChanged.createDelegate(this);
      privates.sourceSplineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      listener,
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
      privates.targetSplineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      listener,
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
      console.log('fire edgePointAdded');
      this.fire(bui.Edge.ListenerType.edgePointAdded,
        [this, privates.sourceSplineHandle]);
      this.fire(bui.Edge.ListenerType.edgePointAdded,
        [this, privates.targetSplineHandle ]);
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].splineHandle=this.graph()
                .add(bui.SplineEdgeHandle)
                .bind(bui.Node.ListenerType.absolutePosition,
                  listener,
                  listenerIdentifier(this))
                .edge(this)
                .visible(privates.layoutElementsVisible);
        this.fire(bui.Edge.ListenerType.edgePointAdded,
          [this, privates.points[i].splineHandle]);
      }
      // create spline handle helper lines
      privates.sourceHelperLine = this.graph()
              .add(bui.StraightLine)
              .lineStyle(bui.AbstractLine.Style.dotted)
              .hoverEffect(false)
              .target(this.source())
              .source(privates.sourceSplineHandle)
              .visible(privates.layoutElementsVisible);

      privates.targetHelperLine = this.graph()
              .add(bui.StraightLine)
              .lineStyle(bui.AbstractLine.Style.dotted)
              .hoverEffect(false)
              .target(this.target())
              .source(privates.targetSplineHandle)
              .visible(privates.layoutElementsVisible);
      for (var i=0;i<privates.points.length;i++){
        privates.points[i].helperLine=this.graph()
                .add(bui.StraightLine)
                .lineStyle(bui.AbstractLine.Style.dotted)
                .hoverEffect(false)
                .source(privates.points[i].splineHandle)
                .target(privates.points[i].point)
                .visible(privates.layoutElementsVisible);
      }
      updateSpline.call(this);
    }
    /**
     * @private
     * function called when spline edge is transformed into straight edge. updates SVG.
     */
    var makeStraight = function(){
      var privates = this._privates(identifier);
      if (!privates.isSpline) return;
      for (var i=0;i<privates.points.length;i++){
        var p=privates.points[i];
        p.splineHandle.unbindAll(listenerIdentifier(this));
        p.splineHandle.remove();
        p.helperLine.remove();
      }
      privates.sourceSplineHandle.unbindAll(listenerIdentifier(this));
      privates.sourceSplineHandle.remove();
      privates.targetSplineHandle.unbindAll(listenerIdentifier(this));
      privates.targetSplineHandle.remove();
      privates.sourceHelperLine.remove();
      privates.targetHelperLine.remove();
      privates.isSpline=false;
      updateStraight.call(this);
    }
    /**
     * @private
     * function to find closest point on edge to given x,y position (for inserting edge point on right position
     * @param {x,y} position of new point
     * @return {idx} index of point after new point
     */
    var findClosest = function(x,y){ 
      var privates = this._privates(identifier);
      if (privates.points.length==0) return 0;
      var mind=-1;
      var closest=-1;
      for (var i=0;i<=privates.points.length;i++){
        var p1=(i==0 ? this.source().absolutePositionCenter() : privates.points[i-1].point.absolutePositionCenter());
        var p2=(i==privates.points.length ? this.target().absolutePositionCenter() : privates.points[i].point.absolutePositionCenter());
        var a={x: p2.x-p1.x, y: p2.y-p1.y};
        var b={x: x-p1.x , y: y-p1.y};
        var d=(a.x*b.y-a.y*b.x)/Math.sqrt(a.x*a.x+a.y*a.y); // distance to connecting lines
        var s=a.x*b.x+a.y*b.y;
        if (s<0) { // new point before p1
          d=Math.sqrt(b.x*b.x+b.y*b.y);
        } else {
          b={x: x-p2.x , y: y-p2.y};
          s=-a.x*b.x-a.y*b.y;
          if (s<0){ // new point behind p2
            d=Math.sqrt(b.x*b.x+b.y*b.y);
          }
        }
        if (mind==-1 || mind>d){
          mind=d;
          closest=i;
        }
      }
      return closest;
    }
    /**
     * @private
     * function to add a point to edge. 
     * 
     * @param {x,y} position of new point
     * @param {type} type of edge point (nothing or "Ourcome")
     * @param {position} index at which to insert in list of points
     * @param {dx,dy} spline handle vector if edge is spline
     * @return {idx} index of point after new point
     */
    var _addPoint = function(x, y, type, position, dx, dy){
      var privates = this._privates(identifier);
      
      if (position<0) { // position -1 is after last element
        position=privates.points.length+1+position;
      };
      
      var point = undefined;
      
      point = this.graph()
                  .add(bui.EdgeHandle)
                  .edge(this);
      
      if (type == "Outcome"){
          point.addClass('Outcome');// the stylesheet must fill the circle black
          point.size(12,12);
          point.visible(this.visible());
      } else {
          point.visible(privates.layoutElementsVisible)
               .addClass('edgeHandle');   //let the stylesheet make it grey
      }
                  
      point.absolutePositionCenter(x, y);
      
      var pth={point: point}; // object which contains all point data

      if (privates.isSpline){
        if (dx == undefined || dy == undefined || (dx==0 && dy==0)){ // make some feasible default spline handles
          var t1=(position==0? this.source().absolutePositionCenter() : privates.points[position-1].point.absolutePositionCenter());
          var t2=(position==privates.points.length? this.target().absolutePositionCenter() : privates.points[position].point.absolutePositionCenter());
          pth.dx=-(t2.x-t1.x)/4;
          pth.dy=-(t2.y-t1.y)/4;
        } else {
          pth.dx=dx;
          pth.dy=dy;
        }
        pth.splineHandle = this.graph()
              .add(bui.SplineEdgeHandle)
              .bind(bui.Node.ListenerType.absolutePosition,
                      splineHandleChanged.createDelegate(this),
                      listenerIdentifier(this))
              .edge(this)
              .visible(privates.layoutElementsVisible);
        pth.helperLine=this.graph()
                .add(bui.StraightLine)
                .lineStyle(bui.AbstractLine.Style.dotted)
                .hoverEffect(false)
                .source(pth.splineHandle)
                .target(pth.point)
                .visible(privates.layoutElementsVisible);

      }
      point.bind(bui.Node.ListenerType.absolutePosition, updateEdge.createDelegate(this), listenerIdentifier(this))
      point.bind(bui.Drawable.ListenerType.remove,
              this.removePoint.createDelegate(this),
              listenerIdentifier(this));

      privates.points.splice(position, 0, pth); // add point at position position
      
      this.fire(bui.Edge.ListenerType.edgePointAdded,
        [this, pth.splineHandle]);
      this.fire(bui.Edge.ListenerType.edgePointAdded,
        [this, point]);

      return point;
      
    }
    /**
     * @private
     * listener to source or target movement. checks if source and target move syncronously. if yes, moves all edge points as well;
     */
    var detectWholeEdgeMove = function(node,x,y){
      var privates = this._privates(identifier);
      var type=(node==this.source() ? "source" : "target");
      var dx=0,dy=0;
      if (privates.detectMove.prev[type]){
        dx=x-privates.detectMove.prev[type].x;
        dy=y-privates.detectMove.prev[type].y;
      }
      if ((dx!=0 || dy!=0) && dx==privates.detectMove.last.dx && dy==privates.detectMove.last.dy && privates.detectMove.last.type != type){
        // source and target moved by same amount
        for (var i=0;i<privates.points.length;i++){
          var pos=privates.points[i].point.absolutePositionCenter();
          privates.points[i].point.absolutePositionCenter(pos.x+dx,pos.y+dy);
        }
      }
      privates.detectMove.prev[type]={x:x,y:y};
      privates.detectMove.last={type:type,dx:dx,dy:dy};
    }
    /*
     * @private
     * if edge is a loop, make initial edge a spline which is a loop of a size similar to the node size
     */
    var fixLoopEdge=function(){
       var privates = this._privates(identifier);
       if (privates.points && privates.points.length) return; // then the user should know on its own
       var size=this.source().size();
       privates.sourceSplineHandleVec={x:size.width,y:-size.height};
       privates.targetSplineHandleVec={x:-size.width,y:-size.height};
       makeSpline.call(this);
    }
    /**
     * @private
     * Source changed event listener
     */
    var sourceChanged = function(node, source, old) {
        var privates = this._privates(identifier);
        if (privates.isSpline) privates.sourceHelperLine.target(source);
        if (old !== undefined && old !== null) old.unbindAll(listenerIdentifier(this) + 'source');
        if (source !== undefined && source !== null) source.bind(bui.Node.ListenerType.absolutePosition,
                    detectWholeEdgeMove.createDelegate(this),
                    listenerIdentifier(this) + 'source');
        if (source && source == this.target()) fixLoopEdge.call(this);
    };

    /**
     * @private
     * Target changed event listener
     */
    var targetChanged = function(node, target, old) {
        var privates = this._privates(identifier);
        if (privates.isSpline) privates.targetHelperLine.target(target);
        if (old !== undefined && old !== null) old.unbindAll(listenerIdentifier(this) + 'target');
        if (target !== undefined && target !== null) target.bind(bui.Node.ListenerType.absolutePosition,
                    detectWholeEdgeMove.createDelegate(this),
                    listenerIdentifier(this) + 'target');
        if (target && target == this.source()) fixLoopEdge.call(this);
    };

    /**
     * @private
     * Visibility changed event listener
     */
    var visibilityChanged = function(node, visible) {
        if (visible === false) {
            this.layoutElementsVisible(false);
        }
    };
    /**
     * @private mouse click listener
     */
    var lineMouseClick = function(event) {
        if (event.ctrlKey === true){
           var scale = 1 / this.graph().scale(),
                graph = this.graph(),
                graphTranslate = graph.translate(),
                graphHtmlTopLeft = graph.htmlTopLeft();

            this.addPoint(((event.pageX - graphHtmlTopLeft.x) * scale) - graphTranslate.x,
                          ((event.pageY - graphHtmlTopLeft.y) * scale) - graphTranslate.y);
            this.layoutElementsVisible(true);
        }
    };

    /**
     * @class
     * An edge which contains multiple segments, can be spline or straight
     *
     * @extends bui.AbstractLine
     * @constructor
     */
    bui.Edge = function(args){
        bui.Edge.superClazz.apply(this, arguments);
    };

    bui.Edge.prototype = {
        identifier : function() {
            return identifier;
        },
        /**
         * @private initial paint
         */
        _initialPaint : function() {
            var privates = this._privates(identifier);
            this._line = document.createElementNS(bui.svgns, 'path');
            this.graph().edgeGroup().appendChild(this._line);
//            this.addClass(bui.settings.css.classes.invisible);
            privates.layoutElementsVisible = false;
            privates.points = [];
            privates.marker = null;
            privates.lineStyle = null;
            privates.isSpline = false;
            privates.detectMove={prev:{}};

            this.bind(bui.AttachedDrawable.ListenerType.source,
                    sourceChanged.createDelegate(this),
                    listenerIdentifier(this));
            this.bind(bui.AttachedDrawable.ListenerType.target,
                    targetChanged.createDelegate(this),
                    listenerIdentifier(this));
            this.bind(bui.Drawable.ListenerType.visible,
                    visibilityChanged.createDelegate(this),
                    listenerIdentifier(this));
            jQuery(this._line).click(lineMouseClick.createDelegate(this));
            
        },
        /**
         * @private Source / target position and size listener
         */
        _sourceOrTargetDimensionChanged : function() {
	         //console.log("_sourceOrTargetDimensionChanged");
           // fk: why is this called when the node is moved??? is this correct? fkt name does not sound like that, is it just the naming?
           // th: its just naming. this reacts on everything that happens to source/target (i.e. change,position,size) and is a virtual method in AbstractLine
            updateEdge.call(this);
        },
        /**
        * method to return length of edge (in segments).
        * 
        * @return {length} number of points+1
        */
        length : function(){
          return this._privates(identifier).points.length+1;
        },
        /**
        * method to add a point to edge. 
        * 
        * @param {x,y} position of new point
        * @param {type} type of edge point (nothing or "Ourcome")
        * @param {position} index at which to insert in list of points
        * @param {dx,dy} spline handle vector if edge is spline
        * @return {bui.Node} created EdgeHandle
        */
        addPoint : function(x,y,type,position,dx,dy){
          var privates = this._privates(identifier);
          if (x==undefined){
            var p1=this.source().absolutePositionCenter();
            var p2=(privates.points.length ? privates.points[0].point.absolutePositionCenter() : this.target().absolutePositionCenter());
            x=(p1.x+p2.x)/2;
            y=(p1.y+p2.y)/2;
          }
          if (position==undefined) position=findClosest.call(this,x,y);
          var point=_addPoint.call(this,x,y,type,position,dx,dy);
          updateEdge.call(this);
          return point;
        },
        /**
        * method to update position and spline vector of a point  
        * 
        * @param {idx} index of the point in edge
        * @param {x,y} new position of point
        * @param {dx,dy} spline handle vector if edge is spline
        * @return {bui.Edge} fluent interface
        */
        updatePoint : function(idx,x,y,dx,dy,duration){
          var privates = this._privates(identifier);
          if (idx===undefined || idx<0 || idx>=privates.points.length) {
            console.log("updatePoint expects point idx in current range of edge points");
            return this;
          }
          if (privates.isSpline){
            if (dx===undefined || dy===undefined) {
              console.log("edge is spline, but dx,dy in updatePoint not set.");
              return this; 
            }
            
            privates.points[idx].dx=dx;
            privates.points[idx].dy=dy;
          }
          privates.points[idx].point.absolutePositionCenter(x,y,duration); // this triggers updateEdge automatically
          return this;
        },
        /**
        * method to get point at specified index
        * 
        * @param {Number} index of point
        * @return {bui.EdgeHandle} the point
        */
        getPoint : function(idx){
          return this._privates(identifier).points[idx].point;
        },
        /**
        * method to get index of a spcified point in list of edge points
        * 
        * @param {bui.EdgeHandle} point the point
        * @return {Number} index of point
        */
        getPosition : function(point){
          var privates = this._privates(identifier);
          var pos=-1;
          for (var i=0;i<privates.points.length;i++){
            if (privates.points[i].point == point) pos=i;
          }
          return pos;
        },
        /**
        * method to remove a point from edge.
        *
        * @param {point} index of point or the point itself
        * @return {bui.Edge} fluent interface
        */
        removePoint: function (point) {
          var privates = this._privates(identifier);
          var index=-1;
          if (Object.prototype.toString.call(point).slice(8,-1) == "Number"){
            index=point;
          } else {
            for (var i=0;i<privates.points.length;i++){
              if (privates.points[i].point==point) index=i;
            }
          }
          if (index<0) return;
          if (index>=privates.points.length) return;
          var pth=privates.points.splice(index, 1)[0];
          pth.point.unbindAll(listenerIdentifier(this));
          pth.point.remove();
          if (privates.isSpline) {
            pth.splineHandle.unbindAll(listenerIdentifier(this));
            pth.splineHandle.remove();
            pth.helperLine.remove();
          }
          updateEdge.call(this);
          
          return this;
        },

         /**
         * check or set whether Edge is spline or straight
         *
         * @param {Boolean} [setSpline] Pass true for splines, false
         *   for straight lines.
         * @return {bui.Spline|Boolean} Fluent interface in case you pass
         *   a parameter, the current spline status otherwise.
         */
        spline : function(setSpline) {
            var privates = this._privates(identifier);
            if (setSpline !== undefined) {
              
              if (privates.isSpline!=setSpline){
                if (setSpline) {
                  makeSpline.call(this);
                } else {
                  makeStraight.call(this);
                }
              }
              return this;
            } else {
              return privates.isSpline;
            }
        },
         /**
         * set source spline handle vector
         *
         * @param {int,int} [dx,dy] vector to be set
         * @return {bui.Edge|{x,y}} Fluent interface in case you pass
         *   a parameter, the current spline vector otherwise.
         */
 
        sourceSplineHandle : function(dx,dy){
          var privates = this._privates(identifier);
          if (dx == undefined) {
            return privates.sourceSplineHandleVec;
          } else {
            privates.sourceSplineHandleVec={x:dx,y:dy};
	    updateSpline.call(this);
            return this;
          }
        },
         /**
         * set target spline handle vector
         *
         * @param {int,int} [dx,dy] vector to be set
         * @return {bui.Edge|{x,y}} Fluent interface in case you pass
         *   a parameter, the current spline vector otherwise.
         */
        targetSplineHandle : function(dx,dy){
          var privates = this._privates(identifier);
          if (dx === undefined) {
            return privates.targetSplineHandleVec;
          } else {
            privates.targetSplineHandleVec={x:dx,y:dy};
            updateSpline.call(this);
            return this;
          }
        },
         /**
         * Show or hide the layout elements of this Spline. The layout
         * elements include two edgeSplineHandles and two lines. The handles
         * are used to modify the shape of the line while the two lines are
         * used as visual assistance.
         *
         * @param {Boolean} [visible] Pass true to show layout elements, false
         *   to hide them.
         * @return {bui.Spline|Boolean} Fluent interface in case you don't pass
         *   a parameter, the current visibility otherwise.
         */
        layoutElementsVisible : function(visible) {
            var privates = this._privates(identifier);

            if (visible !== undefined) {
                privates.layoutElementsVisible = visible;

                if (privates.isSpline) {
                  privates.sourceSplineHandle.visible(visible);
                  privates.targetSplineHandle.visible(visible);
                  privates.sourceHelperLine.visible(visible);
                  privates.targetHelperLine.visible(visible);
		}
		for (var i=0;i<privates.points.length;i++){
       if (visible || ! privates.points[i].point.hasClass("Outcome")) privates.points[i].point.visible(visible);
                  if (privates.isSpline){
		     privates.points[i].splineHandle.visible(visible);
		     privates.points[i].helperLine.visible(visible);
		   } 
                }

                return this;
            }

            return privates.layoutElementsVisible;
        },

        /**
         * Set the line style. Available line style can be retrieved through
         * the {@link bui.AbstractLine.Style} object.
         *
         * @param {Object} style A property of {@link bui.AbstractLine.Style}.
         * @return {bui.AbstractLine} Fluent interface
         * @example
         * edge.lineStyle(bui.AbstractLine.Style.dotted);
         */
        lineStyle : function(style) {
            var privates = this._privates(identifier);
            privates.lineStyle = style;
            redrawLines.call(this);
            return this;
        },
        /* top
        */
        absolutePosition: function(){
          var privates = this._privates(identifier);
          var x =0, y=0;
          x= (privates.sourcePosition.x>privates.targetPosition.x)? privates.targetPosition.x :privates.sourcePosition.x;
          y= (privates.sourcePosition.y>privates.targetPosition.y)? privates.targetPosition.y :privates.sourcePosition.y;
          return {x:x, y:y};
        },
        absoluteBottomRight: function(){
          var privates = this._privates(identifier);
          var x =0, y=0;
          x= (privates.sourcePosition.x<privates.targetPosition.x)? privates.targetPosition.x :privates.sourcePosition.x;
          y= (privates.sourcePosition.y<privates.targetPosition.y)? privates.targetPosition.y :privates.sourcePosition.y;
          return {x:x, y:y};
        },
        toJSON : function() {
            var json = bui.Edge.superClazz.prototype.toJSON.call(this),
                dataFormat = bui.settings.dataFormat,
                privates = this._privates(identifier);

            var handles = [], points = [], pointtypes = [];
            if (privates.isSpline) handles.push({x:privates.sourceSplineHandleVec.x,y:privates.sourceSplineHandleVec.y});
            if (privates.points.length > 0) {
              
              for (var i = 0; i < privates.points.length; i++) {
                var position = privates.points[i].point.absoluteCenter();
                points.push({x:position.x,y:position.y});
                if (privates.isSpline) {
                  var ps = privates.points[i].splineHandle.absoluteCenter();
                  handles.push({x:ps.x-position.x,y:ps.y-position.y});
                }
                if (privates.points[i].point.hasClass('Outcome')){
                  pointtypes[i]='Outcome';
                }
              }
            }
            if (privates.isSpline) handles.push({x:privates.targetSplineHandleVec.x,y:privates.targetSplineHandleVec.y});
            if (privates.isSpline) updateJson(json, dataFormat.edge.type, "spline");
            if (points.length) updateJson(json, dataFormat.edge.points, points);
            if (handles.length) updateJson(json, dataFormat.edge.handles, handles);
            if (pointtypes.length) updateJson(json, dataFormat.edge.pointtypes, pointtypes);

            //console.log('rock edge '+JSON.stringify(json));

            return json;
        }

    };

    bui.util.setSuperClass(bui.Edge, bui.AbstractLine);
    
    bui.Edge.ListenerType = {
    /** @field */
      edgePointAdded : bui.util.createListenerTypeId()
    }

})(bui);

/*
 * All these functions and variables are defined in the util.js file as
 * the specific node types need access for the variables for the JSON
 * export.
 */

addMapping(nodeMapping, [285], bui.UnspecifiedEntity);
addMapping(nodeMapping, [247, 240, 245, 421], bui.SimpleChemical);
addMapping(nodeMapping, [245, 252, 420], bui.Macromolecule);
addMapping(nodeMapping, [250, 251, 419], bui.NucleicAcidFeature);
addMapping(nodeMapping, [405, 357], bui.Perturbation);
addMapping(nodeMapping, [358], bui.Phenotype);
addMapping(nodeMapping, [253, 418], bui.Complex);
addMapping(nodeMapping, [289, 290], bui.Compartment);
addMapping(nodeMapping, [375, 167, 379, 396], bui.Process);
addMapping(nodeMapping, [-1], bui.Helper);
addMapping(nodeMapping, [110001], bui.VariableValue);
addMapping(nodeMapping, [110002, 110004], bui.Tag);
//SBO:0000395 ! encapsulating process
addMapping(nodeMapping, [395, 412], bui.RectangularNode);//Annotation
//SBO:0000409 ! interaction outcome
addMapping(nodeMapping, [177,409], bui.Association);
addMapping(nodeMapping, [180], bui.Dissociation);
addMapping(nodeMapping, [174,173,238,225], bui.LogicalOperator);
addMapping(nodeMapping, [291], bui.EmptySet);
addMapping(nodeMapping, [110005], bui.EdgeHandle);
addMapping(nodeMapping, [110003], bui.Annotation);
addMapping(processNodeMapping, [375, 167], bui.Process);




addMapping(edgeMarkerMapping, [19, 168], bui.connectingArcs.control.id);
addMapping(edgeMarkerMapping, [20, 169], bui.connectingArcs.inhibition.id);
addMapping(edgeMarkerMapping, [407], bui.connectingArcs.absoluteInhibition.id);
addMapping(edgeMarkerMapping, [464,342], bui.connectingArcs.assignment.id);
//addMapping(edgeMarkerMapping, [342], bui.connectingArcs.interaction.id);
addMapping(edgeMarkerMapping, [459, 462, 170], bui.connectingArcs.stimulation.id);
addMapping(edgeMarkerMapping, [15, 394], bui.connectingArcs.substrate.id);
addMapping(edgeMarkerMapping, [11, 393], bui.connectingArcs.production.id);
addMapping(edgeMarkerMapping, [461], bui.connectingArcs.necessaryStimulation.id);
addMapping(edgeMarkerMapping, [13,172], bui.connectingArcs.catalysis.id);
addMapping(edgeMarkerMapping, [411], bui.connectingArcs.absoluteStimulation.id);


addModificationMapping([111100], 'unknownModification', '?');
addModificationMapping([111101], 'active', 'active');
addModificationMapping([111102], 'inactive', 'inactive');
addModificationMapping([215], 'acetylation', 'A');
addModificationMapping([217], 'glycosylation', 'G');
addModificationMapping([233], 'hydroxylation', 'OH');
addModificationMapping([214], 'methylation', 'M');
addModificationMapping([219], 'myristoylation', 'MYR');
addModificationMapping([218], 'palmitoylation', 'PAL');
addModificationMapping([216], 'phosphorylation', 'P');
addModificationMapping([224], 'ubiquitination', 'U');
/*addModificationMapping([111100], 'glycosylphosphatidylinositolation', 'GPI');
addModificationMapping([111101], 'PTM_active1', 'active');
addModificationMapping([111101], 'PTM_active2', 'active');
addModificationMapping([111100], 'PTM_farnesylation', 'F');
addModificationMapping([111100], 'geranylgeranylation', 'GER');
addModificationMapping([111100], 'PTM_glycosaminoglycan', 'GA');
addModificationMapping([111100], 'PTM_oxidation', '0');
addModificationMapping([111100], 'PTM_sumoylation', 'S');
*/

(function(bui) {

    /**
     * Default generator for node types. This will be used when
     * nodeJSON.generator is undefined.
     *
     * @param {bui.Graph} graph The graph to which the node shall be added
     * @param {Object} nodeType Node type retrieved from the node mapping.
     * @param {Object} nodeJSON Node information
     * @return {bui.Node} The generated node
     */
    var defaultNodeGenerator = function(graph, nodeType, nodeJSON) {
       
        var node;
        if (nodeJSON.sbo == 174 || nodeJSON.sbo == 173 || nodeJSON.sbo == 238 || nodeJSON.sbo == 225 || nodeJSON.sbo == 396 || nodeJSON.sbo == 379){
            node = graph.add(nodeType.klass, nodeJSON.id, [nodeJSON.sbo]);
        }else{
            node = graph.add(nodeType.klass, nodeJSON.id);
        }

        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'label'])) {
            if (node.label !== undefined) {
                node.label(nodeJSON.data.label);
            }
        }
        if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'orientation'])) {
            if(node.identifier()=='bui.Tag') node.orientation(nodeJSON.data.orientation);
        }

        nodeJSON.data = nodeJSON.data || {};

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'x'], ['data', 'y'])) {
            nodeJSON.data.x = bui.util.toNumber(nodeJSON.data.x);
            nodeJSON.data.y = bui.util.toNumber(nodeJSON.data.y);

            node.position(nodeJSON.data.x, nodeJSON.data.y);
        }

        var standardNodeSize = bui.settings.style.importer.standardNodeSize;
        var size = {
            width : standardNodeSize.width,
            height : standardNodeSize.height
        };

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'width'], ['data', 'height'])) {
            size.width = nodeJSON.data.width;
            size.height = nodeJSON.data.height;
        } else if (node.sizeBasedOnLabel !== undefined && (!(node._ignLabelSize))) {
            size = node.sizeBasedOnLabel();

            // some padding because of various shapes
            var padding = bui.settings.style.importer.sizeBasedOnLabelPassing;
            size.width += padding.horizontal;
            size.height += padding.vertical;
        }

        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'cssClasses'])) {
            if (bui.util.propertySetAndNotNull(nodeJSON, ['data', 'cssClasses'])) {
              // added loop to be able to add more than one class
                if (nodeJSON.data.cssClasses instanceof Array) {
                    for (var i=0; i < nodeJSON.data.cssClasses.length; i++) {
                        node.addClass(nodeJSON.data.cssClasses[i]);
                    }
                } else {
                    log ('Converted cssClasses ' + nodeJSON.data.cssClasses +  ' to String');
                    node.addClass(nodeJSON.data.cssClasses);
                }
            }
        }

        if(('clonemarker' in nodeJSON.data)&&(nodeJSON.data.clonemarker === true)){
            node.clonemarker(true);
        }
        if((nodeJSON.sbo >= 418) && (nodeJSON.sbo <= 421) ){
            node.multimer(true);
        }
        if(nodeJSON.data.multimer === true) node.multimer(true);

        if (bui.util.propertySetAndNotNull(nodeJSON, ['data','color'])){
          if (Object.prototype.toString.call(nodeJSON.data.color).slice(8,-1) == "String"){
            node.color({background: nodeJSON.data.color});
          } else {
          
            node.color(nodeJSON.data.color);
          }
          
        }
        node.size(size.width, size.height)
                .visible(true);

        nodeJSON.data.width = size.width;
        nodeJSON.data.height = size.height;
        
        if (nodeJSON.data.unitofinformation !== undefined) {
            for (var i = 0; i < nodeJSON.data.unitofinformation.length; i++) {
                uoi = graph.add(bui.UnitOfInformation)
                        .label(nodeJSON.data.unitofinformation[i])
                        .parent(node)
                        .visible(true)
                        .json(nodeJSON.data.unitofinformation[i]);//FIXME needs to be added to json, no clue what this does
            }
        }
        // generic state variables
        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'statevariable'])) {
            var variables = nodeJSON.data.statevariable;
            var state_class_obj = bui.StateVariable;
            if(bui.settings.SBGNlang == 'ER'){
                state_class_obj = bui.StateVariableER;
            }
            for (var i = 0; i < variables.length; i++) {
                statevar = graph.add(state_class_obj)
                        .label(variables[i])
                        .parent(node)
                        .visible(true)
                        .json(variables[i]);//FIXME needs to be added to json, no clue what this does
                if(bui.settings.SBGNlang == 'ER'){
                    statevar.size(60,14)
                    if(variables[i] == 'existence'){
                        statevar.existence(true).size(15,15);
                    }
                    if(variables[i] == 'location'){
                        statevar.label('').addClass('location').size(14,14);
                    }
                }
            }
        }
        if (bui.util.propertySetAndNotNull(nodeJSON,
                ['data', 'modification'])) {
            //alert ('xyrock');
            var modifications = nodeJSON.data.modification;

            for (var i = 0; i < modifications.length; i++) {
                var modification = modifications[i];
                //log('adding modification');

                var label, mapping = retrieveFrom(modificationMapping,
                        modification[0]);

                label = mapping.shortlabel;

                if (bui.settings.style.importer.modificationLabel === 'longlabel') {
                    label += '@' + modification[1];
                }

                graph.add(bui.StateVariable)
                        .label(label)
                        .parent(node)
                        .visible(true)
                        .json(modification);
            }
        }

        return node;
    };

    /**
     * Import nodes.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllNodes = function(graph, data) {
        var nodes = data.nodes,
                generatedNodes = {},
                node,
                nodeJSON;

        var addNode = function(nodeJSON, id) {
            var nodeType = retrieveFrom(nodeMapping, nodeJSON.sbo);
            var node;

            if (nodeType === undefined) {
                return undefined;
            }

            if (bui.util.propertySetAndNotNull(nodeType, 'generator')) {
                node = nodeType.generator(graph, nodeJSON);
            } else {
                node = defaultNodeGenerator(graph, nodeType, nodeJSON);
            }

            if (node !== undefined) {
                node.json(nodeJSON);
                generatedNodes[id] = node;
            }

            return node;
        };

        // add all nodes
        for (var i = 0; i < nodes.length; i++) {
            try {
                nodeJSON = nodes[i];

                addNode(nodeJSON, nodeJSON.id);
            } catch (e) {
                log(e);
            }
        }

        // add relationship information
        for (var key in generatedNodes) {
            if (generatedNodes.hasOwnProperty(key)) {
                node = generatedNodes[key];
                nodeJSON = node.json();

                if (nodeJSON.data !== undefined &&
                        nodeJSON.data.subnodes !== undefined) {
                    for (var j = 0; j < nodeJSON.data.subnodes.length; j++) {
                        var subNodeId = nodeJSON.data.subnodes[j];
                        var subNode = generatedNodes[subNodeId];

                        if (subNode !== undefined) {
                            subNode.parent(node);
                        } else {
                            log('Warning: Broken sub node reference to sub' +
                                    ' node id: ' + subNodeId);
                        }
                    }
                }
            }
        }

        return generatedNodes;
    };

    /**
     * Layout the complex nodes using a table layout.
     *
     * @param {Object} nodes A map which keys map onto {@link bui.Node}
     *   instances.
     */
    var doComplexLayout = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                var node = nodes[key];

                if (node instanceof bui.Complex &&
                        node.parent() instanceof bui.Complex === false) {
                    node.tableLayout();

                    var size = node.size();
                    var json = node.json();
                    json.data.width = size.width;
                    json.data.height = size.height;
                }
            }
        }
    };

    /**
     * Position the auxiliary units for each node.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var positionAuxiliaryUnits = function(nodes) {
        for (var key in nodes) {
            if (nodes.hasOwnProperty(key)) {
                nodes[key].positionAuxiliaryUnits();
            }
        }
    };

    /**
     * Add edges to the graph. Information about the edges will be extracted
     * from the data parameter.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @return {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var addAllEdges = function(graph, data, generatedNodes) {
        var edges = data.edges;

        var edge_stack = [], edge_stack2 = edges.slice(); // make a shallow copy of edges array
        var drawables = graph.drawables();
        var generatedEdges = {};
        var last_len=edge_stack2.length+1;
        while (last_len>edge_stack2.length){ // repeat until no more edges from edge_Stack can be added
          last_len=edge_stack2.length
          edge_stack = edge_stack2;
          edge_stack2 = [];
          for (var i = 0; i < edge_stack.length; i++) {
          
            var edgeJSON = edge_stack[i], edge;

            if ((edgeJSON.source === undefined)||(edgeJSON.target===undefined)){
                continue;
            }
            var source = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.source.indexOf(':') != -1){
                var node_ids = edgeJSON.source.split(':');
                source = generatedNodes[node_ids[0]];
                if (source !== undefined) {
                    children = source.children();
                    for(var j = 0;j<children.length;j++){
                        if((children[j].label() == node_ids[1])||(children[j].hasClass(node_ids[1]))){
                            source = drawables[children[j].id()];
                            break;
                        }
                    }
                }
            }else{
                var source = generatedNodes[edgeJSON.source];
            }
            // still undefined? may be an edge
            if(source === undefined){
              var idx=-1;
              var source_edge= undefined;
              if (edgeJSON.source.indexOf(':') != -1){
                var ids = edgeJSON.source.split(':');
                idx = ids[1];
                source_edge = generatedEdges[ids[0]];
              } else {
                source_edge = generatedEdges[edgeJSON.source];
              }
              if (source_edge !== undefined) {
                if (idx>=0){
                  source = source_edge.getPoint(idx);
                } else {
                  source = source_edge.addPoint(undefined,undefined,"Outcome");
                }
              }
            }
            var target = undefined;
            //if there are ports defined (molecule:domain-port) make them to the target
            if (edgeJSON.target.indexOf(':') != -1){
                var node_ids = edgeJSON.target.split(':');
                target = generatedNodes[node_ids[0]];
                if (target !== undefined) {
                    var children = target.children();
                    for(var j = 0;j<children.length;j++){
                        if((children[j].label() == node_ids[1])||(children[j].hasClass(node_ids[1]))){
                            target = drawables[children[j].id()];
                            break;
                        }
                    }
                }
            }else{
                target = generatedNodes[edgeJSON.target];
            }
            // still undefined? may be an edge
            if(target === undefined){
              var idx=-1;
              var target_edge= undefined;
              if (edgeJSON.target.indexOf(':') != -1){
                var ids = edgeJSON.target.split(':');
                idx = ids[1];
                target_edge = generatedEdges[ids[0]];
              } else {
                target_edge = generatedEdges[edgeJSON.target];
              }
              if (target_edge !== undefined) {
                if (idx>=0){
                  target = target_edge.getPoint(idx);
                } else {
                  target = target_edge.addPoint();
                }
              }
            }
            // if source or target are still undefined they might reference an edge which is not yet added
            if ((source === undefined)||(target === undefined)) {
                edge_stack2.push(edgeJSON);
                continue;
            }

            // ensuring that the data property exists
            edgeJSON.data = edgeJSON.data || {};

            edge = graph.add(bui.Edge, edgeJSON.id);
            edge.json(edgeJSON).source(source).target(target);
            var spline=(edgeJSON.data.type=='curve' || edgeJSON.data.type=='spline');
            edge.spline(spline);
            if (spline){
              edge.sourceSplineHandle(edgeJSON.data.handles[0].x,edgeJSON.data.handles[0].y);
              edge.targetSplineHandle(edgeJSON.data.handles[edgeJSON.data.handles.length-1].x,edgeJSON.data.handles[edgeJSON.data.handles.length-1].y);
            }
            if(edgeJSON.data.points !== undefined){
              for(var j=0; j<edgeJSON.data.points.length; j ++){
                var type = (edgeJSON.data.pointtypes ? edgeJSON.data.pointtypes[j] : undefined);
                if (spline){
                  edge.addPoint(edgeJSON.data.points[j].x, edgeJSON.data.points[j].y,type,undefined,edgeJSON.data.handles[j+1].x,edgeJSON.data.handles[j+1].y)
                } else {
                  edge.addPoint(edgeJSON.data.points[j].x, edgeJSON.data.points[j].y,type)
                }
              }
            }


            if (edgeJSON.sbo !== undefined) {
                if ((edgeJSON.source.split(':')[0] == edgeJSON.target.split(':')[0])&&(edgeJSON.sbo == 342)){//SBO:0000342 molecular or genetic interaction
                    //log(JSON.stringify(edgeJSON));
                    // source and tartget are the same molecule add cis/trans infobox 
                    var pos = edge.source().absoluteCenter();
                    var size = edge.source().size();
                    var cis_trans = 'cis_trans';
                    if (edgeJSON.data.cis_trans !== undefined){
                        cis_trans = edgeJSON.data.cis_trans;
                    }
                    var handle = graph.add(bui.RectangularNode).visible(true).size(50,20).label(cis_trans);
                    handle.positionCenter(pos.x+size.width+30, pos.y);
                    edge.json(edgeJSON).source(handle).target(target);
                    back_edge = graph.add(bui.Edge, edgeJSON.id+'_back');
                    back_edge.json(edgeJSON).source(handle).target(source);
                    var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                    back_edge.marker(marker.klass);
                    edge.marker(marker.klass);
                    back_edge.addPoint(pos.x+size.width+30, pos.y-20);
                    edge.addPoint(pos.x+size.width+30, pos.y+20)
                }else{
                    try {
                        var marker = retrieveFrom(edgeMarkerMapping, edgeJSON.sbo);
                        edge.marker(marker.klass);
                    } catch (e) {
                        log(e);
                    }
                }
            }

            var style = bui.AbstractLine.Style[edgeJSON.data.style];
            if (style !== undefined) {
                edge.lineStyle(style);
            }

            edge.visible(true);
            generatedEdges[edgeJSON.id] = edge;   
          }
        }
        if (edge_stack2.length){
          log('Edge stack still contains '+String(edge_stack2.length)+' edges');
          for(var i = 0; i<edge_stack2.length; i++){
              var flag = true;
              if ((generatedNodes[edge_stack2[i].source] === undefined) && (generatedEdges[edge_stack2[i].source] === undefined)){
                  log('Edge source '+edge_stack2[i].source+' could not be found. Edge ID: '+edge_stack2[i].id);
                  flag = false;
              }
              if ((generatedNodes[edge_stack2[i].target] === undefined) && (generatedEdges[edge_stack2[i].target] === undefined)){
                  log('Edge target '+edge_stack2[i].target+' could not be found. Edge ID: '+edge_stack2[i].id);
                  flag = false;
              }
              if (flag) log('found but not added: '+JSON.stringify(edge_stack2[i]));
              //log('Edge source '+edge_stack[i].source+' or target ' + edge_stack[i].target + ' could not be found.');
          } 

        }
        
      };

    /**
     * Align nodes according to their parent-child relationships. Childs
     * should end up on top of their parents.
     *
     * @param {Object} All the generated nodes. Keys of this object are the
     *   node's ids or, if applicable, the node's ref key (node.data.ref).
     */
    var alignAccordingToNodeHierachy = function(nodes) {
        var id;
        var node;
        var alignRecursively = function(node) {
            var children = node.childrenWithoutAuxiliaryUnits();
            var i;
            if (!(node instanceof(bui.Compartment))) {
               node.toFront();
            }

            for (i = 0; i < children.length; i++) {
                var child = children[i];
                alignRecursively(child);
            }

            var auxUnits = node.auxiliaryUnits();
            for(i = 0; i < auxUnits.length; i++) {
               auxUnits[i].toFront();
            }
        };

        for (id in nodes) { //align compartments and its members
            if (nodes.hasOwnProperty(id)) {
                node = nodes[id];

                if (node.hasParent() === false &&
                   (node instanceof(bui.Compartment))){
                   alignRecursively(node);
                }

            }
        }
        for (id in nodes) { // bring non-compartment members to front
           if (nodes.hasOwnProperty(id)) {
              node = nodes[id];
              if (node.hasParent() === false &&
                 (!(node instanceof(bui.Compartment)))){
                    alignRecursively(node);
              }
           }
        }


    };

    /**
     * Import nodes and edges from JSON using this function.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     */
    bui.importFromJSON = function(graph, data) {
        var start = new Date().getTime();
        var suspendHandle = graph.suspendRedraw(20000);

        if('sbgnlang' in data){
            bui.settings.SBGNlang = data.sbgnlang; 
        }
        log('## Setting SBGN language to '+bui.settings.SBGNlang);

        log('## Importing all nodes');
        var generatedNodes = addAllNodes(graph, data);

        log('## Layout complexes');
        doComplexLayout(generatedNodes);

        log('## Layout auxiliary units');
        positionAuxiliaryUnits(generatedNodes);

        log('## Aligning nodes according to parent-child relationships');
        alignAccordingToNodeHierachy(generatedNodes);

        log('## Adding all edges');
        addAllEdges(graph, data, generatedNodes);

        log('## Reducing canvas size');
        graph.reduceCanvasSize();

        graph.unsuspendRedraw(suspendHandle);
        var elapsed = new Date().getTime() - start;
        log('## Complete import took ' + elapsed + 'ms.');
//         //FIXME horrible hack but neede to make the import work
//         for (var key in generatedNodes) {
//             if (generatedNodes.hasOwnProperty(key)) {
//                 var node = generatedNodes[key];
//                 var pos = node.position();
//                 var nparent = node.parent();
//                 if ('identifier' in nparent){
//                     if (nparent.identifier() == "Compartment"){
//                         var pos_parent = nparent.position();
//                         node.position(pos.x-pos_parent.x, pos.y-pos_parent.y);
//                         console.log('reset pos');
//                     }
//                 }
//             }
//         }
    };

    /**
     * Update node positions by reimporting data from JSON.
     *
     * @param {bui.Graph} graph The target graph to which the nodes and edges
     *   should be added.
     * @param {Object} data JSON data which should be imported
     * @param {Number} [duration] An optional duration in milliseconds.
     *   {@link bui.Node#move}
     */
    bui.importUpdatedNodePositionsFromJSON = function(graph, data, duration, finishListener) {
        var drawables = graph.drawables();

        // optimize the data structure to map json IDs to drawable references
        // to achieve a computational complexity of O(2n).
        var optimizedDrawables = {};
        for (var key in drawables) {
            if (drawables.hasOwnProperty(key)) {
                var drawable = drawables[key];
                var json = drawable.json();

                if (json !== undefined && json !== null) {
                    optimizedDrawables[json.id] = drawable;
                }
            }
        }

        var nodesJSON = data.nodes, i;
	var listener_set=false;
        for (i = 0; i < nodesJSON.length; i++) {
            var nodeJSON = nodesJSON[i],
                    node = optimizedDrawables[nodeJSON.id];

            if (node === undefined) {
                log('Warning: Can\'t update nodes position for json node id ' +
                        nodeJSON.id + ' because the node can\'t be found.');
                continue;
            } else if (bui.util.propertySetAndNotNull(nodeJSON,
                    ['data', 'x'], ['data', 'y']) === false) {
                continue;
            } else if (node.hasParent() === true) { // this ensures complex members are not moved
               if (!(node.parent() instanceof bui.Compartment)){  // allow members of compartments to be moved
                  continue;
               } 
            }
            if (node instanceof bui.Compartment){
               // animate size for compartments
               var w=nodeJSON.data.width,
                     h=nodeJSON.data.height;
               if (w && h){
                  node.resize(w,h,duration);
               }
            
            }

            var x = nodeJSON.data.x,
                    y = nodeJSON.data.y,
                    currentPosition = node.position();
	    if (!listener_set){
	      node.move(x - currentPosition.x, y - currentPosition.y, duration, finishListener); // the last node will call the finishListener
	      listener_set=true;
	    } else {
	      node.move(x - currentPosition.x, y - currentPosition.y, duration);
	    }
        }

        var edgesJSON = data.edges;
        for (i = 0; i < edgesJSON.length; i++) {
            var edgeJSON = edgesJSON[i],
                    edge = optimizedDrawables[edgeJSON.id];

            if (edge === undefined) {
                log('Warning: Can\'t update edge for json edge id ' +
                        edgeJSON.id + ' because the edge can\'t be found.');
                continue;
            }
            var isSpline=(edgeJSON.data.type == 'curve' || edgeJSON.data.type == 'spline');
            var points=[];
            if (bui.util.propertySetAndNotNull(edgeJSON,['data', 'points'])) {
                points=edgeJSON.data.points;
            }
            var handles=[];
            if (isSpline && (!bui.util.propertySetAndNotNull(edgeJSON,['data', 'handles']) || edgeJSON.data.handles.length+2!=points.length)) { 
              log('no/wrong data.handles property for spline edge');
              isSpline=false;
            }
            edge.spline(isSpline); // update spline status
            if (isSpline){
              handles=edgeJSON.data.handles
              edge.sourceSplineHandle(handles[0].x,handles[0].y);
              edge.targetSplineHandle(handles[handles.length-1].x,handles[handles.length-1].y);
            }
            for (var k=edge.length()-2;k>=points.length;k--){
              edge.removePoint(k);
            }
            for (var k=0;k<points.length;k++){
                //var type = (pointtypes ? pointtypes[j] : undefined); //WARNING cannot update type yet
              if (isSpline){
                edge.updatePoint(k,points[k].x, points[k].y,handles[k+1].x,handles[k+1].y,duration);
              } else {
                edge.updatePoint(k,points[k].x, points[k].y,undefined,undefined,duration);
              }
              
            }
            for (var k=edge.length();k<points.length;k++){
              var type = (pointtypes ? pointtypes[j] : undefined);
              if (isSpline){
                edge.addPoint(points[k].x, points[k].y,type,undefined,handles[k+1].x,handles[k+1].y)
              } else {
                edge.addPoint(points[k].x, points[k].y,type)
              }
            }
            edge.setSplineHandlePositions(edgeJSON.data.handles, duration);
            edge.setSplinePoints(edgeJSON.data.points, duration);
        }
    };
})(bui);


(function(bui){
   bui.layouter={};
   var arraytoxy=function(array){
     var xyar=[];
     for (var i=0;i<array.length/2;i++){
       xyar.push({x:array[2*i],y:array[2*i+1]});
     }
     return xyar;
   }
   /* creates a string from the json data which serves as input for the layouter */
   bui.layouter.makeLayouterFormat = function(jdata){
      var cc=0; // node index counter
      var ccc=1; // compartment index counter (starts with 1 as 0 is no compartment)
      var idx={};
      var cpidx={};
      var s=""; // string to be passed to layouter (as a file)
      var cphash={};
      var cphashid={};
      for (var i=0;i<jdata.nodes.length;i++){ // create node indexes; write output for compartments
         var n=jdata.nodes[i];
         if (n.is_abstract) continue; // abstract nodes are not send to the layouter
         if (bui.nodeMapping[n.sbo].klass === bui.Compartment){
            cpidx[n.id]=ccc;
            s = s + ccc + " " + n.id + "\n";
            if (n.data.subnodes){
               for (var j in n.data.subnodes){
                  cphash[n.data.subnodes[j]]=ccc;
                  cphashid[n.data.subnodes[j]]=n.id;
               }
            }
            ccc++;
         } else {
            idx[n.id]=cc;
            cc++;
         }
      }
      s = (ccc-1) + "\n" + s + "///\n"; // compartments
      s = s + cc + "\n"; // number of nodes
      //nodes
      for (var i=0;i<jdata.nodes.length;i++){
         var n=jdata.nodes[i];
         if (!idx.hasOwnProperty(n.id)) continue; 
         s = s + idx[n.id] + "\n";
         s = s + (bui.nodeMapping[n.sbo].klass === bui.Process ? 'Reaction' : 'Compound') + "\n";
         s = s + n.id + "\n";
         s = s + (n.data.compartment ? cpidx[n.data.compartment] : (cphash[n.id] ? cphash[n.id] : 0)) + "\n";
         if (!n.data.compartment && cphash[n.id]){
               n.data.compartment=cphashid[n.id]; // set data.compartment property as defined by compartments subnode property
         }
         s = s + (n.data.x ? n.data.x : 0) + "\n";
         s = s + (n.data.y ? n.data.y : 0) + "\n";
         s = s + (n.data.width ? n.data.width : 0) + "\n";
         s = s + (n.data.height ? n.data.height : 0) + "\n";
         s = s + (n.data.dir ? n.data.dir : 0) + "\n";
      }
      s = s + "///\n";
      
      //edges
      var se='';
      cc=0;
      for (var i=0;i<jdata.edges.length;i++){
         e=jdata.edges[i];
         var tp=bui.edgeMarkerMapping[e.sbo];
         var type;
         if (tp) {
            switch (tp.klass) {
               case (bui.connectingArcs.substrate.id) :
                  type="Substrate";
                  break;
               case (bui.connectingArcs.production.id) :
                  type="Product";
                  break;
               case (bui.connectingArcs.catalysis.id) :
                  type="Catalyst";
                  break;
               case (bui.connectingArcs.inhibition.id) :
                  type="Inhibitor";
                  break;
               case (bui.connectingArcs.stimulation.id) :
                  type="Activator";
                  break;
               case (bui.connectingArcs.necessaryStimulation.id) :
                  type="Activator";
                  break;
               case (bui.connectingArcs.control.id) :
                  type="Activator";
            }
         }
         if (type) {
            se = se + type + " " + idx[e.source] + " " + idx[e.target] + "\n";
            cc++;
         }
      }
      s = s + cc + "\n" + se + "\n";
      return s;
   };
   /* extracts position information from layouter output and includes it into json data */
   bui.layouter.fromLayouterFormat = function(jdata,lt,nosplines){ // jdata - original json input data, lt - layouter output, nosplines - do not setup spline data in jdata
      var nh={}; // node ids -> node idx
      var ch=[]; // node idx -> compartment id
      var idx={};
      var cc=0;
      for (var i=0;i<jdata.nodes.length;i++){ // create node hash
         var n=jdata.nodes[i];
         nh[n.id]=i;
         if (n.is_abstract) continue; // abstract nodes are not send to the layouter
         if (bui.nodeMapping[n.sbo].klass === bui.Compartment) continue;
         idx[n.id]=cc;
         cc++;
      }
      for (var i=0;i<jdata.nodes.length;i++){ // fix data.compartment settings
         var n=jdata.nodes[i];
         if (n.is_abstract) continue; // abstract nodes are not send to the layouter
         if (bui.nodeMapping[n.sbo].klass === bui.Compartment){
            if (n.data.subnodes){
               for (var j in n.data.subnodes){
                  //jdata.nodes[nh[n.data.subnodes[j]]].data.compartment=n.id;
                  if (nh[n.data.subnodes[j]]){
                    ch[nh[n.data.subnodes[j]]]=n.id
                  }
               }
            }
         }
      }
      var eh={};
      for (var i=0;i<jdata.edges.length;i++){ // create edge hash
         var e=jdata.edges[i];
         eh[idx[e.source]+'->'+idx[e.target]]=i;
         if (e.data.type) delete e.data.type; // remove spline indicator ( defaults all edges to straight edges)
      }
      var lines=lt.split("\n");
      var minx=1000000000000000000;
      var miny=1000000000000000000;
      while (lines.length){
         if (lines.shift() == '///') break; // edge section is currently ignored - no splines supported
         var type=lines.shift();
         var id=lines.shift();
         lines.shift(); // compartment
         var x=lines.shift();
         var y=lines.shift();
         var w=lines.shift();
         if (lines.length==0) break; // needed if emtpy lines at end of file
            var h=lines.shift();
         lines.shift(); //dir
         if (!nh.hasOwnProperty(id)){
            if (id != 'unknown') console.log('unknown id ' + id + '. runaway data?'); // unknown is the id of the unknown compartment defined by the layouter
               continue;
         }
         var n=jdata.nodes[nh[id]];
         if (type=="Compartment"){
            n.data.x=1*x;
            n.data.y=-y-h;
            n.data.width=1*w;
            n.data.height=1*h;
         } else {
            n.data.x=1*x-w/2;
            n.data.y=-y-h/2;
         }
         if (minx>n.data.x) minx=n.data.x;
         if (miny>n.data.y) miny=n.data.y;
      }
      for (var i=0;i<jdata.nodes.length;i++){ // make all positions positive; i.e. move to (0,0)
         var n=jdata.nodes[i];
         if (n.is_abstract) continue;
         if (n.data.x != undefined) n.data.x-=minx;
         if (n.data.y != undefined) n.data.y-=miny;
      }
      for (var i=0;i<jdata.nodes.length;i++){ // make positions relative to their compartments
         var n=jdata.nodes[i];
         if (n.is_abstract) continue;
         var cp=null;
         if (nh.hasOwnProperty(n.data.compartment)){ // is in compartment due to compartment property?
            cp=jdata.nodes[nh[n.data.compartment]];
         }
         if (ch[i]){ // is part of a compartment due to subnodes property
            cp=jdata.nodes[nh[ch[i]]];
         }
         if (cp) {
            if (n.data.x != undefined) n.data.x-=cp.data.x;
            if (n.data.y != undefined) n.data.y-=cp.data.y;
         }
      }
      if (nosplines) return jdata;
      // import edges (splines);
      layouter_OUTER: while (lines.length){
         var l=lines.shift();
         var parts=l.split(' ');
         if (parts.length<3) continue; // non edge or empty line
         var key=parts[1]+'->'+parts[2];
         if (!eh.hasOwnProperty(key)) throw "Edge "+key+" not found";
         var eidx=eh[key];
         delete jdata.edges[eidx].data.handles;
         delete jdata.edges[eidx].data.points;
         if (parts.length<3) continue; // non spline edge 
         var handles=parts[3].split(',');
         if (handles.length<2) handles=[]; // there shouldn't be a single number here
         var isx=1;
         for (var i=0;i<handles.length;i++){
            handles[i]*=(isx ? 1 : -1); 
            if (isNaN(handles[i])) continue layouter_OUTER;
            isx=1-isx;
         }
         var points=(parts.length>=5 ? parts[4].split(',') : []);
         if (points.length<2) points=[]; // there shouldn't be a single number here
         isx=1;
         for (var i=0;i<points.length;i++){ // alternating x and y coordinates
            points[i]*=(isx ? 1 : -1); 
            points[i]-=(isx ? minx : miny); // make positions positive
            if (isNaN(points[i])) continue layouter_OUTER;
            isx=1-isx;
         }
         if (!jdata.edges[eidx].data) jdata.edges[eidx].data={};
         if (handles.length) jdata.edges[eidx].data.handles=arraytoxy(handles);
         if (handles.length) jdata.edges[eidx].data.type="curve";
         if (points.length) jdata.edges[eidx].data.points=arraytoxy(points);
 
      }
      return jdata;
   }


})(bui);

(function(bui) {

bui.grid = { 
    nodes:[], 
    edges:[], 
    width:0,
    height:0,
    matrix_nodes: [],
    grid_space: 80//px
}
//=====================================================
bui.grid.spiral = function(length){
    //--------------------------------------
    var spiral_count4 = 0;
    var spiral_cur_edge_len = 1;
    var sprial_cur_edge_steps = 0;
    var spiral_add_x_abs = 0;
    var spiral_add_y_abs = 1;
    var mulitplierx = ['x',1,1,-1,1];
    var mulitpliery = ['x',1,-1,1,1];
    var spiral_setps = [];
    var counter = 0;
    //--------------------------------------
    while(true){
        //-----------------------
        if (sprial_cur_edge_steps%spiral_cur_edge_len==0){
            tmp = spiral_add_y_abs;
            spiral_add_y_abs = spiral_add_x_abs;
            spiral_add_x_abs = tmp;
            if(spiral_count4>3) spiral_count4=0;
            ++spiral_count4;
        }
        if (sprial_cur_edge_steps+1>2*spiral_cur_edge_len){
            sprial_cur_edge_steps = 0;
            ++spiral_cur_edge_len; 
        }
        ++sprial_cur_edge_steps;
        spiral_setps.push([spiral_add_x_abs*mulitplierx[spiral_count4], spiral_add_y_abs*mulitpliery[spiral_count4]]);
        ++counter;
        if(counter>=length) break
    }
    return spiral_setps

};
//=====================================================
bui.grid.add_padding = function(){
    var nodes = bui.grid.nodes;
    var matrix_nodes = bui.grid.matrix_nodes;
    var i;
    var nbucketx = bui.grid.nbucketx;
    var nbuckety = bui.grid.nbuckety;
    var ebucketx = bui.grid.ebucketx;
    var ebuckety = bui.grid.ebuckety;
    for(i=0;i<bui.grid.height; ++i){
        if(matrix_nodes[0][i] !== undefined){
            //---------
            matrix_nodes.push([]);
            for(i=0; i<bui.grid.height; ++i) matrix_nodes[bui.grid.width].push(undefined);
            ++bui.grid.width;
            nbucketx.push({});
            ebucketx.push({});
            //---------
            for(i=0; i<nodes.length; ++i){
                matrix_nodes[nodes[i].x][nodes[i].y] = undefined;
                ++nodes[i].x;
                matrix_nodes[nodes[i].x][nodes[i].y] = 1;
            }
            break;
        }
    }
    for(i=0;i<bui.grid.width; ++i){
        if(matrix_nodes[i][0] !== undefined){
            //---------
            for(i=0; i<bui.grid.width; ++i) matrix_nodes[i].push(undefined);
            ++bui.grid.height;
            nbuckety.push({});
            ebuckety.push({});
            //---------
            for(i=0; i<nodes.length; ++i){
                matrix_nodes[nodes[i].x][nodes[i].y] = undefined;
                ++nodes[i].y;
                matrix_nodes[nodes[i].x][nodes[i].y] = 1;
            }
            break;
        }
    }
    //----------------------
    //---------------
    for(i=0;i<bui.grid.height; ++i){
        if(matrix_nodes[bui.grid.width-1][i] != undefined){
            matrix_nodes.push([]);
            for(i=0; i<bui.grid.height; ++i) matrix_nodes[bui.grid.width].push(undefined);
            ++bui.grid.width;
            nbucketx.push({});
            ebucketx.push({});
        }
    }
    for(i=0;i<bui.grid.width; ++i){
        if(matrix_nodes[i][bui.grid.height-1] != undefined){
            for(i=0; i<bui.grid.width; ++i) matrix_nodes[i].push(undefined);
            ++bui.grid.height;
            nbuckety.push({});
            ebuckety.push({});
        }
    }
    //---------------
    //----------------------
    
    //bui.grid.matrix_nodes = matrix_nodes;
    bui.grid.render_current();
};
//=====================================================
bui.grid.find_circles = function(){
}
//=====================================================
bui.grid.init = function(input_nodes, edges, width, height, put_on_grid){
    var grid_space = bui.grid.grid_space;
    //-------------------------------------------------------
    // sort nodes that have a fixed switch to be the first in the list of nodes
    var fixed_nodes = [], other_nodes = [];
    for(var i=0; i<input_nodes.length; ++i){
        if (input_nodes[i].hasClass('fixed')) fixed_nodes.push(input_nodes[i]);
        else other_nodes.push(input_nodes[i]);
    }
    //-------------------------------------------------------
    var nodes = fixed_nodes.concat(other_nodes);
    bui.grid.nodes = nodes;
    bui.grid.edges = edges;
    //-------------------------------------------------------
    var node_id2node_idx = {};
    for(var i=0; i<nodes.length; ++i) node_id2node_idx[nodes[i].id()]=i;
    for(var i=0; i<edges.length; ++i){
        edges[i].source_idx = node_id2node_idx[edges[i].lsource.id()];
        edges[i].target_idx = node_id2node_idx[edges[i].ltarget.id()];
    }
    //-------------------------------------------------------
    bui.grid.spiral_steps = bui.grid.spiral(10000);
    var spiral_steps = bui.grid.spiral_steps;
    if(width===undefined || height===undefined){
        width = 2*Math.sqrt(nodes.length);
        height = 3*Math.sqrt(nodes.length);
    }
    bui.grid.max_x = Math.round(width);
    var max_x = bui.grid.max_x;
    bui.grid.max_y = Math.round(height);
    var max_y = bui.grid.max_y;
    var pos,i;
    //-------------------------------------------------------
    //compartments
    var compartments_border = [];
    var node_idx2cborder = [];
    var c_id2c_idx = {};
    var c_idx2num_nodes = {};
    var c_idx2max_nodes = {};
    for (var i=0; i<nodes.length; ++i){
        var node_parent = nodes[i].parent();
        if ('identifier' in node_parent && node_parent.identifier() == 'Compartment'){
            if (! (node_parent.id() in c_id2c_idx)){
                c_id2c_idx[node_parent.id()] = compartments_border.length;
                c_idx2num_nodes[compartments_border.length] = 0;
                var tl = node_parent.topLeft();
                if (tl.x<0) node_parent.position(1, tl.y);//move into view area
                tl = node_parent.topLeft();
                if (tl.y<0) node_parent.position(tl.x, 1);//move into view area
                tl = node_parent.topLeft();
                var br = node_parent.bottomRight();
                compartments_border.push({
                    left: Math.ceil(tl.x/grid_space),
                    top: Math.ceil(tl.y/grid_space),
                    bottom: Math.floor(br.y/grid_space),
                    right: Math.floor(br.x/grid_space)
                });
                var c_idx = compartments_border.length-1;
                c_idx2max_nodes[c_idx] = (compartments_border[c_idx].right-compartments_border[c_idx].left+1) * (compartments_border[c_idx].bottom-compartments_border[c_idx].top+1);
                //check if max_x/y is smaller than the bottom right pos of the compartment
                if(br.x>max_x*grid_space) max_x = Math.round(br.x/grid_space);
                if(br.y>max_y*grid_space) max_y = Math.round(br.y/grid_space);
            }
            var c_idx = c_id2c_idx[node_parent.id()];
            node_idx2cborder[i] = compartments_border[c_idx];
            c_idx2num_nodes[c_idx] += 1;
            if (c_idx2num_nodes[c_idx]>c_idx2max_nodes[c_idx]){
                alert('Compartment '+node_parent.label()+' is to small! Current maximum number of nodes is '+c_idx2max_nodes[c_idx]+'. Please resize it to make room for more nodes.');
                return;
            }
        }else{
            //console.log('node parent is not compartment! ');
        }
    }
    bui.grid.node_idx2comp_empty_fields = {}
    for(var i=0; i<nodes.length; ++i){
        if (nodes[i].parent().id() in c_id2c_idx){
            c_idx = c_id2c_idx[nodes[i].parent().id()];
            bui.grid.node_idx2comp_empty_fields[i] = c_idx2max_nodes[c_idx]-c_idx2num_nodes[c_idx];
        }
    }
    bui.grid.node_idx2cborder = node_idx2cborder;
    //-------------------------------------------------------
    //check if max_x is smaller than the max_x pos of the max x node pos
    //same for max_y
    for(i=0; i<nodes.length; ++i){
        pos = nodes[i].absolutePositionCenter();
        if(pos.x>max_x*grid_space) max_x = Math.round(pos.x/grid_space);
        if(pos.y>max_y*grid_space) max_y = Math.round(pos.y/grid_space);
    }
    bui.grid.width = max_x+1;
    bui.grid.height = max_y+1;
    //-------------------------------------------------------
    //init node matrix
    var matrix_nodes = [];
    for (var x=0; x<=max_x; ++x){
        matrix_nodes.push([]);
        for (var y=0; y<=max_y; ++y)
            matrix_nodes[x].push(undefined);
    }
    //------------------------------------------------
    //------------------------------------------------
    bui.grid.matrix_nodes = matrix_nodes;
    if(put_on_grid != undefined){
        bui.grid.put_on_grid();
        bui.grid.render_current();
    }
    /*for(var cni=0; cni<nodes.length; ++cni){
        pos = nodes[cni].absolutePositionCenter();
        nodes[cni].x = Math.round(pos.x/grid_space);
        nodes[cni].y = Math.round(pos.y/grid_space);
        matrix_nodes[nodes[cni].x][nodes[cni].y] = i;
    }*/
    // TODO insert empty padding around matrix
    //------------------------------------------------
    bui.grid.centerx = Math.round(bui.grid.width/2);
    bui.grid.centery = Math.round(bui.grid.height/2);
    //------------------------------------------------
    //------------------------------------------------
    //-----------------------
    //------------------------------------------------
    //------------------------------------------------
    var node_idx2nodes_idx = {};
    var node_idx2edges_idx = {};
    var node_idx2nodes_in_idx = {};
    var node_idx2nodes_in = {};
    var node_idx2nodes_out = {};
    //-----------------------
    for(var i=0; i<nodes.length; ++i){
        node_idx2nodes_in_idx[i] = [];
        node_idx2nodes_in[i] = [];
        node_idx2nodes_out[i] = [];
        node_idx2nodes_idx[i] = [];
        node_idx2edges_idx[i] = {};
    }
    for(var ce=0; ce<edges.length; ++ce){
        var s = edges[ce].source_idx;
        var t = edges[ce].target_idx;

        node_idx2nodes_out[s].push(edges[ce].ltarget);
        node_idx2nodes_in[t].push(edges[ce].lsource);
        node_idx2nodes_in_idx[t].push(s);
        
        node_idx2nodes_idx[s].push(t);
        node_idx2nodes_idx[t].push(s);
        node_idx2edges_idx[s][ce] = 1;
        node_idx2edges_idx[t][ce] = 1;
    }
    bui.grid.node_idx2nodes_idx = node_idx2nodes_idx;
    bui.grid.node_idx2edges_idx = node_idx2edges_idx;
    bui.grid.node_idx2nodes_in_idx = node_idx2nodes_in_idx;
    bui.grid.node_idx2nodes_in = node_idx2nodes_in;
    bui.grid.node_idx2nodes_out = node_idx2nodes_out;
    //------------------------------------------------
    //------------------------------------------------
    bui.grid.set_nodes_as_edges();
}
//=====================================================
bui.grid.put_on_grid = function(node_idx){
    //var matrix_nodes = bui.grid.matrix_nodes;
    var node_idx2cborder = bui.grid.node_idx2cborder;
    var spiral_steps = bui.grid.spiral_steps;
    var nodes = bui.grid.nodes;
    var grid_space = bui.grid.grid_space;
    var max_x = bui.grid.max_x;
    var max_y = bui.grid.max_y;
    //console.log('matrix nodes '+JSON.stringify(bui.grid.matrix_nodes));
    //-------------------------------------------------------
    //-------------------------------------------------------
    //position elements on grid, only one element is allowed on each grid point
    function place(i){
        pos = nodes[i].absolutePositionCenter();
        cx = Math.round(pos.x/grid_space);
        cy = Math.round(pos.y/grid_space);
        //matrix_nodes[cx][cy] = undefined;
        //console.log(nodes[i].label());
        //----------------------------
        var count = 0;
        while(true){
            if(i in node_idx2cborder){
                if(!(cx>=node_idx2cborder[i].left && cx<=node_idx2cborder[i].right && cy>=node_idx2cborder[i].top && cy<=node_idx2cborder[i].bottom && bui.grid.matrix_nodes[cx][cy] == undefined)){
                    spiral_step = spiral_steps[count];
                    //if(count>9997) console.log(nodes[i].label()+' spiral_step, count '+spiral_step +', '+count);
                    cx += spiral_step[0];
                    cy += spiral_step[1];
                    ++count;
                    continue;
                }
            }else{
                if(!(cx>=0 && cx<=max_x && cy>=0 && cy<=max_y && bui.grid.matrix_nodes[cx][cy] == undefined)){
                    spiral_step = spiral_steps[count];
                    cx += spiral_step[0];
                    cy += spiral_step[1];
                    ++count;
                    continue;
                }
            }
            //console.log('placed node '+cx+' '+cy+'->'+i);
            bui.grid.matrix_nodes[cx][cy] = i;
            nodes[i].x = cx;
            nodes[i].y = cy;
            break;
        }
    }

    if(node_idx == undefined){
        for(var cni=0; cni<nodes.length; ++cni){
            place(cni);
        }
    }else{
        place(node_idx)
    }
    //console.log('matrix nodes '+JSON.stringify(bui.grid.matrix_nodes));

}
//=====================================================
bui.grid.layout = function(node_idx){
    //important init buckets!
    bui.grid.init_ebuckets();
    bui.grid.init_nbuckets();
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var grid_space = bui.grid.grid_space;
    var matrix_nodes = bui.grid.matrix_nodes;
    var node_idx2cborder = bui.grid.node_idx2cborder;
    var node_idx2comp_empty_fields = bui.grid.node_idx2comp_empty_fields;
    var i;
    var spiral_steps = bui.grid.spiral_steps;
    var num_empty_fields = bui.grid.width*bui.grid.height - nodes.length;
    //console.log('num_empty_fields: '+num_empty_fields);
    var node_idx2nodes_idx = bui.grid.node_idx2nodes_idx;
    var node_idx2edges_idx = bui.grid.node_idx2edges_idx;
    var node_idx2nodes_in_idx = bui.grid.node_idx2nodes_in_idx;
    var node_idx2nodes_in = bui.grid.node_idx2nodes_in;
    var node_idx2nodes_out = bui.grid.node_idx2nodes_out;
    //------------------------------------------------
    //------------------------------------------------
    var cni = 0;//current node index
    var current_energy = 0.0;
    var tmp_ni,min_ni;
    var step = 0;
    console.log('line crossings before: '+bui.grid.num_intersections());
    console.log('node crossings before: '+bui.grid.num_node_intersections());
    //------------------------------------------------
    //bui.grid.add_padding();
    //------------------------------------------------
    //------------------------------------------------
    //randomize node order for sum more fun :D and better results
    nodes_idx_list = [];
    for(i = 0; i<nodes.length; ++i) nodes_idx_list.push(i);
    nodes_idx_list.sort(function() {return 0.5 - Math.random();});
    //------------------------------------------------
    //------------------------------------------------
    for(var nix=0; nix<nodes.length; ++nix){
        cni = nodes_idx_list[nix];
        var node = nodes[cni];
        //--------------------------------------
        //do not layout nodes that should stay at a fixed position
        if (node.hasClass('fixed')) continue;
        //--------------------------------------
        //console.log('step '+step+' curnode '+cni+'/'+nodes.length+' --- '+node.id());
        ++step;
        if(step>nodes.length) break;
        if (node_idx2nodes_idx[cni] === undefined){
            for(var cx=0;cx<bui.grid.width; ++cx){
                for(var cy=0;cy<bui.grid.height; ++cy){
                    if(matrix_nodes[cx][cy] === undefined){
                        matrix_nodes[cx][cy] = 1;
                        matrix_nodes[node.x][node.y] = undefined;
                        node.x=cx;
                        node.y=cy;
                    }
                }
            }
            continue;
        }
        //----------------------------------------
        //----------------------------------------
        //edge intersections
        min_ni = bui.grid.edge_intersections_fromto(node, node_idx2nodes_idx[cni], node_idx2edges_idx[cni]);
        //node intersections
        min_ni += bui.grid.node_intersections_fromto(cni, node, node_idx2nodes_idx[cni]);
        //distance
        min_ni += 0.1*bui.grid.edge_distance(node, node_idx2nodes_idx[cni]);
        min_ni += 0.05*bui.grid.edge_distance(node, node_idx2nodes_in_idx[cni]);
        //flow
        min_ni += 5*bui.grid.flow_fromto(node, node_idx2nodes_in[cni], node_idx2nodes_out[cni]);
        //90deg angle
        min_ni += 0.5*bui.grid.deg90_fromto(node, node_idx2nodes_idx[cni]);
        //graviation
        min_ni += 0.1*bui.grid.graviation_from(node);
        //----------------------------------------
        //node.addClass('Red');
        //alert('min_ni '+min_ni);
        //console.log('min ni '+min_ni);
        current_energy += min_ni;
        //----------------------------------------
        var cx = node.x;
        var cy = node.y;
        var counter = 0;
        var best_x = undefined;
        var best_y = undefined;
        var stop_distance = undefined;
        var fields_visited = 0;
        while(true){
            //-----------------------
            if (counter>9999){
                console.log('counter too high: '+counter);
                break;
            } 
            cx += spiral_steps[counter][0];
            cy += spiral_steps[counter][1];
            ++counter;
            //-----------------------
            if(node_idx2cborder[cni] !==  undefined){//is node in compartment
                if ( node_idx2comp_empty_fields[cni] == fields_visited ) break;//all possible fileds visited
                if(!(cx>=node_idx2cborder[cni].left && cx<=node_idx2cborder[cni].right && cy>=node_idx2cborder[cni].top && cy<=node_idx2cborder[cni].bottom && matrix_nodes[cx][cy] == undefined)){
                    continue;
                }
            }else{
                if ( num_empty_fields <= fields_visited ) break;
                if(!(cx>=0 && cx<bui.grid.width && cy>=0 && cy<bui.grid.height && matrix_nodes[cx][cy] == undefined)){
                    continue;
                }
            }
            //-----------------------
            ++fields_visited;
            tmp_ni = bui.grid.edge_intersections_fromto({ x : cx, y : cy }, node_idx2nodes_idx[cni], node_idx2edges_idx[cni]);
            tmp_ni += bui.grid.node_intersections_fromto(cni, { x : cx, y : cy}, node_idx2nodes_idx[cni]);
            tmp_ni += 0.1*bui.grid.edge_distance({ x : cx, y : cy }, node_idx2nodes_idx[cni]);
            tmp_ni += 0.05*bui.grid.edge_distance({ x : cx, y : cy }, node_idx2nodes_in_idx[cni]);
            tmp_ni += 5*bui.grid.flow_fromto({ x : cx, y : cy }, node_idx2nodes_in[cni], node_idx2nodes_out[cni]);
            tmp_ni += 0.5*bui.grid.deg90_fromto({ x : cx, y : cy }, node_idx2nodes_idx[cni]);
            tmp_ni += 0.1*bui.grid.graviation_from({ x : cx, y : cy });
            //--------------------------------------
            if(tmp_ni<min_ni){
                min_ni = tmp_ni;
                best_x = cx;
                best_y = cy;
                stop_distance = Math.abs(node.x-cx)+Math.abs(node.y-cy);
            }
            if (stop_distance != undefined){
                if((Math.abs(node.x-cx)+Math.abs(node.y-cy))*2>stop_distance){
                    //console.log('taxi stop');
                    break
                }
            }
            if(tmp_ni==0){
                break;
            }
        }
        //--------------------------------------
        if(best_x != undefined){
            bui.grid.set_nbuckets(cni,node.x, node.y, best_x, best_y);
            matrix_nodes[best_x][best_y] = cni;
            matrix_nodes[node.x][node.y] = undefined;
            node.x=best_x;
            node.y=best_y;
            bui.grid.set_nodes_as_edges(cni);
            for(var i=0; i<node_idx2edges_idx[cni].length; ++i) bui.grid.set_ebuckets(node_idx2edges_idx[cni][i],'clear');
            //bui.grid.add_padding();
        }
        //--------------------------------------
        ++cni;
        if (cni>=nodes.length-1) cni=0;
        //--------------------------------------
    }
    bui.grid.render_current();
    console.log('line crossings after: '+bui.grid.num_intersections());
    console.log('node crossings after: '+bui.grid.num_node_intersections());
    console.log('current_energy: '+current_energy);
    return current_energy;
}
//=====================================================
bui.grid.render_current = function(){
    var nodes = bui.grid.nodes;
    var grid_space = bui.grid.grid_space;
    var spacing_x = 0;
    var spacing_y = 0;
    for(i=0; i<nodes.length; ++i){
        if (nodes[i].x == 0) spacing_x = grid_space;
        if (nodes[i].y == 0) spacing_y = grid_space;
    }
    for(i=0; i<nodes.length; ++i) 
        if (! nodes[i].hasClass('fixed'))
            nodes[i].absolutePositionCenter(nodes[i].x*grid_space+spacing_x,nodes[i].y*grid_space+spacing_y); 
}
//=====================================================
bui.grid.edge_distance = function(from_node, to_nodes){
    distance = 0;
    var nodes = bui.grid.nodes;
    for(var i=0;i<to_nodes.length; ++i){
        distance += Math.abs(from_node.x-nodes[to_nodes[i]].x)+Math.abs(from_node.y-nodes[to_nodes[i]].y)
    }
    return distance;
}
//=====================================================
bui.grid.edge_intersections_fromto = function(from_node, to_nodes, to_edges){
    var counter = 0;
    var edges = bui.grid.edges;
    var nodes = bui.grid.nodes;
    for(var i=0;i<to_nodes.length; ++i){
        for(var j in bui.grid.edge_intersections_getedges(from_node, nodes[to_nodes[i]])){
            if(!(j in to_edges)){
                if( bui.grid.intersect(from_node, nodes[to_nodes[i]], edges[j].lsource, edges[j].ltarget) ){
                    ++counter;
                }
            }
        }
    }
    for(var i=0;i<to_nodes.length; ++i){
        for(var j=i+1;j<to_nodes.length; ++j){
            if( bui.grid.intersect(from_node, nodes[to_nodes[i]], from_node, nodes[to_nodes[j]]) ){
                ++counter;
            }
        }
    }
    return counter;
}
bui.grid.edge_intersections_getedges = function(node1, node2){
    var min,max,i,key;
    var edge_collectionx = {};
    var edge_collection = {};
    //x-------------------
    if(node1.x<node2.x){
        min=node1.x;
        max=node2.x;
    }else{
        max=node1.x;
        min=node2.x;
    }
    for(i=min; i<=max; ++i)
        for(key in bui.grid.ebucketx[i])
            edge_collectionx[key] = 1;
    //y-------------------
    if(node1.y<node2.y){
        min=node1.y;
        max=node2.y;
    }else{
        max=node1.y;
        min=node2.y;
    }
    for(i=min; i<=max; ++i)
        for(key in bui.grid.ebuckety[i])
            if(key in edge_collectionx) 
                edge_collection[key] = 1;
    return edge_collection
}
bui.grid.init_ebuckets = function(){
    var edges = bui.grid.edges;
    var ebucketx = [];
    var ebuckety = [];
    for(var x=0; x<bui.grid.width; ++x) ebucketx.push({});
    for(var y=0; y<bui.grid.height; ++y) ebuckety.push({});
    console.log('ebucketx length'+ebucketx.length)
    bui.grid.ebucketx = ebucketx;
    bui.grid.ebuckety = ebuckety;
    for(var ne=0;ne<edges.length; ++ne){
        bui.grid.set_ebuckets(ne);
    }
}
bui.grid.set_ebuckets = function(edge_index, clear){
    var i,min,max;
    var ebucketx = bui.grid.ebucketx;
    var ebuckety = bui.grid.ebuckety;
    var edge = bui.grid.edges[edge_index];
    //-------------------------
    if(clear != undefined){
        for(i=0;i<ebucketx.length; ++i) if(edge_index in ebucketx[i]) delete ebucketx[i][edge_index];
        for(i=0;i<ebuckety.length; ++i) if(edge_index in ebuckety[i]) delete ebuckety[i][edge_index];
    }
    //x-----------------------
    if(edge.lsource.x<edge.ltarget.x){
        min=edge.lsource.x;
        max=edge.ltarget.x;
    }else{
        max=edge.lsource.x;
        min=edge.ltarget.x;
    }
    //console.log('ebucketx min max '+min+' '+max);
    for(i=min;i<=max; ++i){
        //console.log('set ebucketx '+i);
        ebucketx[i][edge_index] = 1;//FIXME !!1!!!1111 edge_index seems to be out of range
    }
    //y-----------------------
    if(edge.lsource.y<edge.ltarget.y){
        min=edge.lsource.y;
        max=edge.ltarget.y;
    }else{
        max=edge.lsource.y;
        min=edge.ltarget.y;
    }
    for(i=min;i<=max; ++i) ebuckety[i][edge_index] = 1;
}
//=====================================================
bui.grid.node_intersections_fromto = function(from_node_index, from_node, to_nodes){
    var counter = 0;
    var nodes = bui.grid.nodes;
    var candidates,j;
    for(var i=0;i<to_nodes.length; ++i){
        candidates = bui.grid.node_intersections_getnodes(from_node,to_nodes[i]);
        for(var ji=0; ji<candidates.length; ++ji){
            j = candidates[ji];
            if(j!=from_node_index && j != to_nodes[i]){
                var nae = bui.grid.nodes_as_edges[j];
                if(bui.grid.intersect(from_node, nodes[to_nodes[i]], nae[0].source, nae[0].target)){
                    ++counter;
                }else if(bui.grid.intersect(from_node, nodes[to_nodes[i]], nae[1].source, nae[1].target)){
                    ++counter;
                }
            }
        }
    }
    return counter;
}
bui.grid.node_intersections_getnodes = function(from_node, to_node){
    var matrix_nodes = bui.grid.matrix_nodes;
    var minx,miny,maxx,maxy;
    if (from_node.x<to_node.x){
        minx=from_node.x;
        maxx=to_node.x
    }else{
        minx=to_node.x;
        maxx=from_node.x
    }
    if (from_node.y<to_node.y){
        miny=from_node.y;
        maxy=to_node.y
    }else{
        miny=to_node.y;
        maxy=from_node.y
    }
    var i;
    var xnodes = {};
    for(i=minx; i<=maxx; ++i)
        for( key in bui.grid.nbucketx[i] )
            xnodes[key] = 1;
    out_nodes = []
    for(i=miny; i<=maxy; ++i)
        for (key in bui.grid.nbuckety[i] )
            if(key in xnodes)
                out_nodes.push(key)

    return out_nodes
}
bui.grid.init_nbuckets = function(){
    var nodes = bui.grid.nodes;
    var nbucketx = [];
    var nbuckety = [];
    var i;
    for(i=0; i<bui.grid.width; ++i) nbucketx.push({});
    for(i=0; i<bui.grid.height; ++i) nbuckety.push({});
    for(i=0; i<nodes.length; ++i){
        nbucketx[nodes[i].x][i] = 1;
        nbuckety[nodes[i].y][i] = 1;
    }
    bui.grid.nbucketx = nbucketx;
    bui.grid.nbuckety = nbuckety;

}
bui.grid.set_nbuckets = function(node_idx, oldx, oldy, newx, newy){
    delete bui.grid.nbucketx[oldx][node_idx]
    delete bui.grid.nbuckety[oldy][node_idx]
    bui.grid.nbucketx[newx][node_idx] = 1;//FIXME fail here, newx not available
    bui.grid.nbuckety[newy][node_idx] = 1;
}
//=====================================================
bui.grid.set_nodes_as_edges = function(node_index){
    var nodes = bui.grid.nodes;
    var node_edges = [];
    var grid_space = bui.grid.grid_space;
    if (node_index == undefined){
        for(var i=0; i<nodes.length; ++i){
            var node = nodes[i];
            var size = node.size();
            var width = size.width/grid_space/2;
            var height = size.height/grid_space/2;
            var A = {x:node.x-width, y:node.y+height};
            var B = {x:node.x+width, y:node.y-height};
            var C = {x:node.x-width, y:node.y-height};
            var D = {x:node.x+width, y:node.y+height};
            node_edges.push([
                    {source: A, target: B },
                    {source: C, target: D }
                    ]);
        }
        bui.grid.nodes_as_edges = node_edges;
    }else{
        var node = nodes[node_index];
        var size = node.size();
        var width = size.width/grid_space/2;
        var height = size.height/grid_space/2;
        var A = {x:node.x-width, y:node.y+height};
        var B = {x:node.x+width, y:node.y-height};
        var C = {x:node.x-width, y:node.y-height};
        var D = {x:node.x+width, y:node.y+height};
        bui.grid.nodes_as_edges[node_index] = [
                {source: A, target: B },
                {source: C, target: D }
                ];
    }
}
//=====================================================
bui.grid.deg90_fromto = function(from_node, to_nodes){
    var score = 0;
    var nodes = bui.grid.nodes;
    for(var i=0; i<to_nodes.length; ++i){
        if (nodes[to_nodes[i]].x==from_node.x) score += 0
        else if (nodes[to_nodes[i]].y == from_node.y) score += 0.1;
        else score +=1;
    }
    return score
}
//=====================================================
bui.grid.flow_fromto = function(from_node, to_nodes_in, to_nodes_out, common_edge){
    if (to_nodes_in.length==0 || to_nodes_out.length == 0) return 0
    //bui.grid.flow_fromto({x:1,y:1},[{x:1,y:0}],[{x:2,y:2}],{x:2,y:2})
    if(common_edge == undefined) common_edge = bui.grid.common_edge(from_node, to_nodes_in, to_nodes_out);
    //console.log(JSON.stringify(common_edge));
    if(common_edge.x == from_node.x && common_edge.y == from_node.y){
        //bui.grid.render_current();
        /*console.log(from_node.x+' '+from_node.y)
        for(var i =0; i<to_nodes_out.length; ++i) 
            console.log( to_nodes_out[i].x+' '+to_nodes_out[i].x)
        for(var i =0; i<to_nodes_in.length; ++i) 
            console.log( to_nodes_in[i].x+' '+to_nodes_in[i].x)
            //to_nodes_out[i].addClass('Red');
        //alert('stop');
        console.log('problem: common edge node is from_node')
        */
        return 0;
    }
    var score = 0;
    common_edge_norm = Math.sqrt(Math.pow(common_edge.x,2)+Math.pow(common_edge.y,2))
    //console.log(common_edge_norm);
    for(var i=0; i<to_nodes_out.length; ++i){
        tmp_x = to_nodes_out[i].x-from_node.x;
        tmp_y = to_nodes_out[i].y-from_node.y;
        score += (1-(tmp_x*common_edge.x+tmp_y*common_edge.y)/ (Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2))*common_edge_norm))/2;
        //console.log('out'+score);
    }
    for(var i=0; i<to_nodes_in.length; ++i){
        tmp_x = from_node.x-to_nodes_in[i].x;
        tmp_y = from_node.y-to_nodes_in[i].y;
        score += (1-(tmp_x*common_edge.x+tmp_y*common_edge.y)/ (Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2))*common_edge_norm))/2;
        //console.log('in'+score);
    }
    if (isNaN(score)) return 0;
    return score;
};
bui.grid.common_edge = function(from_node, to_nodes_in, to_nodes_out){
    var x = 0;
    var y = 0;
    var edge_length;
    for(var i=0; i<to_nodes_in.length; ++i){
        
        tmp_x = from_node.x-to_nodes_in[i].x;
        tmp_y = from_node.y-to_nodes_in[i].y;
        edge_length = Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2));
        x += (tmp_x)/edge_length;
        y += (tmp_y)/edge_length;
    }
    for(var i=0; i<to_nodes_out.length; ++i){
        tmp_x = to_nodes_out[i].x-from_node.x;
        tmp_y = to_nodes_out[i].y-from_node.y;
        edge_length = Math.sqrt(Math.pow(tmp_x,2)+Math.pow(tmp_y,2));
        x += (tmp_x)/edge_length;
        y += (tmp_y)/edge_length;
    }
    return {x: x, y: y}
}
bui.grid.angle = function angle(center, p1) {
 //http://beradrian.wordpress.com/2009/03/23/calculating-the-angle-between-two-points-on-a-circle/
 var p0 = {x: center.x, y: center.y - Math.sqrt(Math.abs(p1.x - center.x) * Math.abs(p1.x - center.x) + Math.abs(p1.y - center.y) * Math.abs(p1.y - center.y))};
 return (2 * Math.atan2(p1.y - p0.y, p1.x - p0.x)) * 180 / Math.PI;
}
//=====================================================
bui.grid.graviation_from = function(from_node){
    var distance = Math.abs(from_node.x-bui.grid.centerx)+Math.abs(from_node.y-bui.grid.centery)
    return distance / (bui.grid.width+bui.grid.height)*2
}
//=====================================================
bui.grid.node_swap = function(node1, to_nodes1, node2, to_nodes2){
    //TODO not so easy to implement since both nodes need to be moved and node/edge intersections have to be calculated without the original nodes
}
//=====================================================
bui.grid.ccw = function(A,B,C){
    return (C.y-A.y)*(B.x-A.x) > (B.y-A.y)*(C.x-A.x)
}
bui.grid.collinear = function(A,B,C) {
  return (A.y - B.y) * (A.x - C.x) == (A.y - C.y) * (A.x - B.x);
}
bui.grid.point_on_segment = function(A,B,C){
    if (A.x == B.x){
        if(A.y<B.y){
            if(A.y<C.y && B.y>C.y) return true
            else return false
        }else{
            if(B.y<C.y && A.y>C.y) return true
            else return false
        }
    }else if (A.x<B.x){
        if(A.x<C.x && B.x>C.x) return true
        else return false
    }else{
        if(B.x<C.x && A.x>C.x) return true
        else return false
    }
}
bui.grid.intersect = function(A,B,C,D, mark){
    //if (mark!=undefined) console.log('check this '+JSON.stringify([A.id(),{x:A.x,y:A.y},B.id(),{x:B.x,y:B.y},C.id(),{x:C.x,y:C.y},D.id(),{x:D.x,y:D.y}]));
    if (bui.grid.collinear(A,B,C)){
        if (bui.grid.collinear(A,B,D)){
            if (A.x == B.x){
                if( (A.y>=C.y&&B.y>=C.y &&A.y>=D.y&&B.y>=D.y) || (A.y<=C.y&&B.y<=C.y &&A.y<=D.y&&B.y<=D.y) ) return false
                else return true // collinear horizontal overlapping
            }else{
                if( (A.x>=C.x&&B.x>=C.x &&A.x>=D.x&&B.x>=D.x) || (A.x<=C.x&&B.x<=C.x &&A.x<=D.x&&B.x<=D.x) ) return false;
                else return true;//colinear and overlapping
            }
        }else{
            //console.log('ABC  col')
            return bui.grid.point_on_segment(A,B,C)
        }
    }else if (bui.grid.collinear(A,B,D)){ 
        //console.log('ABD  col')
        return bui.grid.point_on_segment(A,B,D)
    }else if (bui.grid.collinear(C,D,A)){ 
        //console.log('CDA  col')
        return bui.grid.point_on_segment(C,D,A)
    }else if (bui.grid.collinear(C,D,B)){ 
        //console.log('CDB  col')
        return bui.grid.point_on_segment(C,D,B)
    }else{
        //console.log('ccw')
        return bui.grid.ccw(A,C,D) != bui.grid.ccw(B,C,D) && bui.grid.ccw(A,B,C) != bui.grid.ccw(A,B,D);
    }

}

//=====================================================
//=====================================================
bui.grid.num_intersections = function(edges_index, mark){
    var counter = 0;
    var crossing_edges = [];
    for(var i=0; i<bui.grid.edges.length; ++i){
        for(var j=i+1; j<bui.grid.edges.length; ++j){
            if(bui.grid.intersect(bui.grid.edges[i].lsource,bui.grid.edges[i].ltarget,bui.grid.edges[j].lsource,bui.grid.edges[j].ltarget, mark) == true){
                if(edges_index != undefined){
                    if(i in edges_index){
                        crossing_edges.push(j);
                        if(mark != undefined){
                            /*console.log(JSON.stringify([
                            {x:bui.grid.edges[i].lsource.x,y:bui.grid.edges[i].lsource.y},
                            {x:bui.grid.edges[i].ltarget.x,y:bui.grid.edges[i].ltarget.y},
                            {x:bui.grid.edges[j].lsource.x,y:bui.grid.edges[j].lsource.y},
                            {x:bui.grid.edges[j].ltarget.x,y:bui.grid.edges[j].ltarget.y},
                            ]));*/
                            bui.grid.edges[j].addPoint(1,1,'Outcome');
                            bui.grid.edges[j].recalculatePoints();
                        }
                    }else if (j in edges_index){
                        crossing_edges.push(i);
                        if(mark != undefined){
                            bui.grid.edges[i].addPoint(1,1,'Outcome');
                            bui.grid.edges[i].recalculatePoints();
                        }
                    }
                }
                ++counter;
            }
        }
    }
    if(edges_index != undefined){
        return crossing_edges;
    } 
    return counter
}
//=====================================================
bui.grid.num_node_intersections = function(edges_index, mark){
    var counter = 0;
    var edges = bui.grid.edges;
    for(var i=0; i<edges.length; ++i){
        for(var j=0; j<bui.grid.nodes.length; ++j){
            if(j != edges[i].source_idx && j != edges[i].target_idx){
                var nae = bui.grid.nodes_as_edges[j];
                if(bui.grid.intersect(edges[i].lsource, edges[i].ltarget, nae[0].source, nae[0].target)){
                    ++counter;
                }else if(bui.grid.intersect(edges[i].lsource, edges[i].ltarget, nae[1].source, nae[1].target)){
                    ++counter;
                }
            }
        }
    }
    return counter
}

//=====================================================
//do a breadth first search an place every node that is touched on the closest optimal position while ignoring nodes that are untouched
//bfs should find the smalles cycles first and thus create a nice layout ... lets see
bui.grid.bfs_layout = function(){
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var matrix_nodes = bui.grid.matrix_nodes;

    var node_id2children = {};
    var node_id2parents = {};
    for(var i=0; i<nodes.length; ++i){
        nodes[i].idx = i;
        node_idx2children[i] = [];
        node_idx2parents[i] = [];
    }
    for(var ce=0; ce<edges.length; ++ce){
        var sid = edges[ce].source().idx;
        var s = edges[ce].source();
        var tid = edges[ce].target().idx;
        var t = edges[ce].target();
        node_idx2children[sid].push(t);
        node_idx2parents[tid].push(s);
    }
    for(var cni=0; cni<nodes.length; ++cni){
        if (nodes[cni].bfs_grid == undefined){
            layout_node(nodes[cni]);
        }
    }
    var cni, cx, cy,i, count;
    function layout_node(node){
        node.bfs_grid = true;
        //check if a parent was already placed
        var parent_was_placed = false;
        var placed_parents = [];
        i = node.idx;
        for(cni = 0; cni<node_idx2parents[i].length; ++cni){
            node_parent = node_idx2parents[i][cni];
            if(node_parent.bfs_grid != undefined){
                parent_was_placed = true;
                placed_parents.push(node_idx2parents[i][cni]);
            }
        }
        if(parent_was_placed == false){
            //place the node in the center/free space of canvas/compartment
            cx = Math.abs(bui.grid.centerx/bui.grid.grid_space/2); //TODO find center of compartment for node in compartment
            cy = Math.abs(bui.grid.centery/bui.grid.grid_space/2);
            bui.grid.put_on_grid(i, cx, cy);
        }else{//parent was placed already
            console.log('should layout one node now');
        }
        //place children next that are not set yet: BFS
        for(cni = 0; cni<node_idx2children[i].length; ++cni){
            if (node_idx2children[i][cni].bfs_grid == undefined){
                layout_node(node_idx2children[i][cni]);
            }
        }
    }
}
//=====================================================
bui.grid.bfs_tarjan = function(){
    var nodes = bui.grid.nodes;
    var edges = bui.grid.edges;
    var node_id2nodes_out = {};
    for(var i=0; i<nodes.length; ++i){
        node_id2nodes_out[nodes[i].id()] = [];
    }
    for(var ce=0; ce<edges.length; ++ce){
        var s = edges[ce].source().id();
        var t = edges[ce].target();
        node_id2nodes_out[s].push(t);
    }
    //http://www.ics.uci.edu/~eppstein/161/960220.html http://en.wikipedia.org/wiki/Tarjan's_strongly_connected_components_algorithm
    var N = 0; //counter
    var L = [];
    var Lobj = {};
    for(var cni=0; cni<nodes.length; ++cni){
        if (nodes[cni].dfsnum == undefined){
            visit(nodes[cni]);
        }
    }
    function visit(p){
        L.push(p);
        Lobj[p.id()] = 1
        p.dfsnum = N;
        p.low = N;
        ++N;
        for(var i=0; i<node_id2nodes_out[p.id()].length; ++i){
            q = node_id2nodes_out[p.id()][i];
            if(q.dfsnum == undefined){
                visit(q);
                q.low = Math.min(p.low,q.low);
            }else if (q in Lobj){
                p.low = Math.min(p.low, q.dfsnum);
            }
        }
        if(p.low == p.dfsnum){
            if(L.length>0){
                console.log('strong connected:');
                do{
                    var node = L.pop();
                    delete Lobj[node.id()];
                    console.log('node - '+node.label());
                }while(node.id() == p.id());
            }
        }
    }
};

})(bui);

window.bui = bui;
})(window);
