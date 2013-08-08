(function () {
    var COMPILED = true;
    var goog = goog || {};
    goog.global = this;
    goog.DEBUG = true;
    goog.LOCALE = "en";
    goog.provide = function (name) {
        if (!COMPILED) {
            if (goog.isProvided_(name)) throw Error('Namespace "' + name + '" already declared.');
            delete goog.implicitNamespaces_[name];
            var namespace = name;
            while (namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
                if (goog.getObjectByName(namespace)) break;
                goog.implicitNamespaces_[namespace] = true
            }
        }
        goog.exportPath_(name)
    };
    goog.setTestOnly = function (opt_message) {
        if (COMPILED && !goog.DEBUG) {
            opt_message = opt_message || "";
            throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
        }
    };
    if (!COMPILED) {
        goog.isProvided_ = function (name) {
            return !goog.implicitNamespaces_[name] && !! goog.getObjectByName(name)
        };
        goog.implicitNamespaces_ = {}
    }
    goog.exportPath_ = function (name, opt_object, opt_objectToExportTo) {
        var parts = name.split(".");
        var cur = opt_objectToExportTo || goog.global;
        if (!(parts[0] in cur) && cur.execScript) cur.execScript("var " + parts[0]);
        for (var part; parts.length && (part = parts.shift());)
            if (!parts.length && goog.isDef(opt_object)) cur[part] = opt_object;
            else if (cur[part]) cur = cur[part];
        else cur = cur[part] = {}
    };
    goog.getObjectByName = function (name, opt_obj) {
        var parts = name.split(".");
        var cur = opt_obj || goog.global;
        for (var part; part = parts.shift();)
            if (goog.isDefAndNotNull(cur[part])) cur = cur[part];
            else return null;
        return cur
    };
    goog.globalize = function (obj, opt_global) {
        var global = opt_global || goog.global;
        for (var x in obj) global[x] = obj[x]
    };
    goog.addDependency = function (relPath, provides, requires) {
        if (!COMPILED) {
            var provide, require;
            var path = relPath.replace(/\\/g, "/");
            var deps = goog.dependencies_;
            for (var i = 0; provide = provides[i]; i++) {
                deps.nameToPath[provide] = path;
                if (!(path in deps.pathToNames)) deps.pathToNames[path] = {};
                deps.pathToNames[path][provide] = true
            }
            for (var j = 0; require = requires[j]; j++) {
                if (!(path in deps.requires)) deps.requires[path] = {};
                deps.requires[path][require] = true
            }
        }
    };
    goog.ENABLE_DEBUG_LOADER = true;
    goog.require = function (name) {
        if (!COMPILED) {
            if (goog.isProvided_(name)) return;
            if (goog.ENABLE_DEBUG_LOADER) {
                var path = goog.getPathFromDeps_(name);
                if (path) {
                    goog.included_[path] = true;
                    goog.writeScripts_();
                    return
                }
            }
            var errorMessage = "goog.require could not find: " + name;
            if (goog.global.console) goog.global.console["error"](errorMessage);
            throw Error(errorMessage);
        }
    };
    goog.basePath = "";
    goog.global.CLOSURE_BASE_PATH;
    goog.global.CLOSURE_NO_DEPS;
    goog.global.CLOSURE_IMPORT_SCRIPT;
    goog.nullFunction = function () {};
    goog.identityFunction = function (opt_returnValue, var_args) {
        return opt_returnValue
    };
    goog.abstractMethod = function () {
        throw Error("unimplemented abstract method");
    };
    goog.addSingletonGetter = function (ctor) {
        ctor.getInstance = function () {
            if (ctor.instance_) return ctor.instance_;
            if (goog.DEBUG) goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor;
            return ctor.instance_ = new ctor
        }
    };
    goog.instantiatedSingletons_ = [];
    if (!COMPILED && goog.ENABLE_DEBUG_LOADER) {
        goog.included_ = {};
        goog.dependencies_ = {
            pathToNames: {},
            nameToPath: {},
            requires: {},
            visited: {},
            written: {}
        };
        goog.inHtmlDocument_ = function () {
            var doc = goog.global.document;
            return typeof doc != "undefined" && "write" in doc
        };
        goog.findBasePath_ = function () {
            if (goog.global.CLOSURE_BASE_PATH) {
                goog.basePath = goog.global.CLOSURE_BASE_PATH;
                return
            }
            else if (!goog.inHtmlDocument_()) return;
            var doc = goog.global.document;
            var scripts = doc.getElementsByTagName("script");
            for (var i = scripts.length -
                1; i >= 0; --i) {
                var src = scripts[i].src;
                var qmark = src.lastIndexOf("?");
                var l = qmark == -1 ? src.length : qmark;
                if (src.substr(l - 7, 7) == "base.js") {
                    goog.basePath = src.substr(0, l - 7);
                    return
                }
            }
        };
        goog.importScript_ = function (src) {
            var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
            if (!goog.dependencies_.written[src] && importScript(src)) goog.dependencies_.written[src] = true
        };
        goog.writeScriptTag_ = function (src) {
            if (goog.inHtmlDocument_()) {
                var doc = goog.global.document;
                doc.write('<script type="text/javascript" src="' +
                    src + '"></' + "script>");
                return true
            }
            else return false
        };
        goog.writeScripts_ = function () {
            var scripts = [];
            var seenScript = {};
            var deps = goog.dependencies_;

            function visitNode(path) {
                if (path in deps.written) return;
                if (path in deps.visited) {
                    if (!(path in seenScript)) {
                        seenScript[path] = true;
                        scripts.push(path)
                    }
                    return
                }
                deps.visited[path] = true;
                if (path in deps.requires)
                    for (var requireName in deps.requires[path])
                        if (!goog.isProvided_(requireName))
                            if (requireName in deps.nameToPath) visitNode(deps.nameToPath[requireName]);
                            else throw Error("Undefined nameToPath for " +
                                requireName);
                if (!(path in seenScript)) {
                    seenScript[path] = true;
                    scripts.push(path)
                }
            }
            for (var path in goog.included_)
                if (!deps.written[path]) visitNode(path);
            for (var i = 0; i < scripts.length; i++)
                if (scripts[i]) goog.importScript_(goog.basePath + scripts[i]);
                else throw Error("Undefined script input");
        };
        goog.getPathFromDeps_ = function (rule) {
            if (rule in goog.dependencies_.nameToPath) return goog.dependencies_.nameToPath[rule];
            else return null
        };
        goog.findBasePath_();
        if (!goog.global.CLOSURE_NO_DEPS) goog.importScript_(goog.basePath +
            "deps.js")
    }
    goog.typeOf = function (value) {
        var s = typeof value;
        if (s == "object")
            if (value) {
                if (value instanceof Array) return "array";
                else if (value instanceof Object) return s;
                var className = Object.prototype.toString.call(value);
                if (className == "[object Window]") return "object";
                if (className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) return "array";
                if (className == "[object Function]" || typeof value.call != "undefined" &&
                    typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) return "function"
            }
            else return "null";
            else if (s == "function" && typeof value.call == "undefined") return "object";
        return s
    };
    goog.isDef = function (val) {
        return val !== undefined
    };
    goog.isNull = function (val) {
        return val === null
    };
    goog.isDefAndNotNull = function (val) {
        return val != null
    };
    goog.isArray = function (val) {
        return goog.typeOf(val) == "array"
    };
    goog.isArrayLike = function (val) {
        var type = goog.typeOf(val);
        return type == "array" || type == "object" && typeof val.length == "number"
    };
    goog.isDateLike = function (val) {
        return goog.isObject(val) && typeof val.getFullYear == "function"
    };
    goog.isString = function (val) {
        return typeof val == "string"
    };
    goog.isBoolean = function (val) {
        return typeof val == "boolean"
    };
    goog.isNumber = function (val) {
        return typeof val == "number"
    };
    goog.isFunction = function (val) {
        return goog.typeOf(val) == "function"
    };
    goog.isObject = function (val) {
        var type = typeof val;
        return type == "object" && val != null || type == "function"
    };
    goog.getUid = function (obj) {
        return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
    };
    goog.removeUid = function (obj) {
        if ("removeAttribute" in obj) obj.removeAttribute(goog.UID_PROPERTY_);
        try {
            delete obj[goog.UID_PROPERTY_]
        }
        catch (ex) {}
    };
    goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
    goog.uidCounter_ = 0;
    goog.getHashCode = goog.getUid;
    goog.removeHashCode = goog.removeUid;
    goog.cloneObject = function (obj) {
        var type = goog.typeOf(obj);
        if (type == "object" || type == "array") {
            if (obj.clone) return obj.clone();
            var clone = type == "array" ? [] : {};
            for (var key in obj) clone[key] = goog.cloneObject(obj[key]);
            return clone
        }
        return obj
    };
    Object.prototype.clone;
    goog.bindNative_ = function (fn, selfObj, var_args) {
        return fn.call.apply(fn.bind, arguments)
    };
    goog.bindJs_ = function (fn, selfObj, var_args) {
        if (!fn) throw new Error;
        if (arguments.length > 2) {
            var boundArgs = Array.prototype.slice.call(arguments, 2);
            return function () {
                var newArgs = Array.prototype.slice.call(arguments);
                Array.prototype.unshift.apply(newArgs, boundArgs);
                return fn.apply(selfObj, newArgs)
            }
        }
        else return function () {
            return fn.apply(selfObj, arguments)
        }
    };
    goog.bind = function (fn, selfObj, var_args) {
        if (Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) goog.bind = goog.bindNative_;
        else goog.bind = goog.bindJs_;
        return goog.bind.apply(null, arguments)
    };
    goog.partial = function (fn, var_args) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            var newArgs = Array.prototype.slice.call(arguments);
            newArgs.unshift.apply(newArgs, args);
            return fn.apply(this, newArgs)
        }
    };
    goog.mixin = function (target, source) {
        for (var x in source) target[x] = source[x]
    };
    goog.now = Date.now || function () {
        return +new Date
    };
    goog.globalEval = function (script) {
        if (goog.global.execScript) goog.global.execScript(script, "JavaScript");
        else if (goog.global.eval) {
            if (goog.evalWorksForGlobals_ == null) {
                goog.global.eval("var _et_ = 1;");
                if (typeof goog.global["_et_"] != "undefined") {
                    delete goog.global["_et_"];
                    goog.evalWorksForGlobals_ = true
                }
                else goog.evalWorksForGlobals_ = false
            }
            if (goog.evalWorksForGlobals_) goog.global.eval(script);
            else {
                var doc = goog.global.document;
                var scriptElt = doc.createElement("script");
                scriptElt.type = "text/javascript";
                scriptElt.defer = false;
                scriptElt.appendChild(doc.createTextNode(script));
                doc.body.appendChild(scriptElt);
                doc.body.removeChild(scriptElt)
            }
        }
        else throw Error("goog.globalEval not available");
    };
    goog.evalWorksForGlobals_ = null;
    goog.cssNameMapping_;
    goog.cssNameMappingStyle_;
    goog.getCssName = function (className, opt_modifier) {
        var getMapping = function (cssName) {
            return goog.cssNameMapping_[cssName] || cssName
        };
        var renameByParts = function (cssName) {
            var parts = cssName.split("-");
            var mapped = [];
            for (var i = 0; i < parts.length; i++) mapped.push(getMapping(parts[i]));
            return mapped.join("-")
        };
        var rename;
        if (goog.cssNameMapping_) rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts;
        else rename = function (a) {
            return a
        }; if (opt_modifier) return className + "-" + rename(opt_modifier);
        else return rename(className)
    };
    goog.setCssNameMapping = function (mapping, opt_style) {
        goog.cssNameMapping_ = mapping;
        goog.cssNameMappingStyle_ = opt_style
    };
    goog.global.CLOSURE_CSS_NAME_MAPPING;
    if (!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING;
    goog.getMsg = function (str, opt_values) {
        var values = opt_values || {};
        for (var key in values) {
            var value = ("" + values[key]).replace(/\$/g, "$$$$");
            str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
        }
        return str
    };
    goog.exportSymbol = function (publicPath, object, opt_objectToExportTo) {
        goog.exportPath_(publicPath, object, opt_objectToExportTo)
    };
    goog.exportProperty = function (object, publicName, symbol) {
        object[publicName] = symbol
    };
    goog.inherits = function (childCtor, parentCtor) {
        function tempCtor() {}
        tempCtor.prototype = parentCtor.prototype;
        childCtor.superClass_ = parentCtor.prototype;
        childCtor.prototype = new tempCtor;
        childCtor.prototype.constructor = childCtor
    };
    goog.base = function (me, opt_methodName, var_args) {
        var caller = arguments.callee.caller;
        if (caller.superClass_) return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1));
        var args = Array.prototype.slice.call(arguments, 2);
        var foundCaller = false;
        for (var ctor = me.constructor; ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor)
            if (ctor.prototype[opt_methodName] === caller) foundCaller = true;
            else if (foundCaller) return ctor.prototype[opt_methodName].apply(me, args);
        if (me[opt_methodName] ===
            caller) return me.constructor.prototype[opt_methodName].apply(me, args);
        else throw Error("goog.base called from a method of one name " + "to a method of a different name");
    };
    goog.scope = function (fn) {
        fn.call(goog.global)
    };
    goog.provide("goog.object");
    goog.object.forEach = function (obj, f, opt_obj) {
        for (var key in obj) f.call(opt_obj, obj[key], key, obj)
    };
    goog.object.filter = function (obj, f, opt_obj) {
        var res = {};
        for (var key in obj)
            if (f.call(opt_obj, obj[key], key, obj)) res[key] = obj[key];
        return res
    };
    goog.object.map = function (obj, f, opt_obj) {
        var res = {};
        for (var key in obj) res[key] = f.call(opt_obj, obj[key], key, obj);
        return res
    };
    goog.object.some = function (obj, f, opt_obj) {
        for (var key in obj)
            if (f.call(opt_obj, obj[key], key, obj)) return true;
        return false
    };
    goog.object.every = function (obj, f, opt_obj) {
        for (var key in obj)
            if (!f.call(opt_obj, obj[key], key, obj)) return false;
        return true
    };
    goog.object.getCount = function (obj) {
        var rv = 0;
        for (var key in obj) rv++;
        return rv
    };
    goog.object.getAnyKey = function (obj) {
        for (var key in obj) return key
    };
    goog.object.getAnyValue = function (obj) {
        for (var key in obj) return obj[key]
    };
    goog.object.contains = function (obj, val) {
        return goog.object.containsValue(obj, val)
    };
    goog.object.getValues = function (obj) {
        var res = [];
        var i = 0;
        for (var key in obj) res[i++] = obj[key];
        return res
    };
    goog.object.getKeys = function (obj) {
        var res = [];
        var i = 0;
        for (var key in obj) res[i++] = key;
        return res
    };
    goog.object.getValueByKeys = function (obj, var_args) {
        var isArrayLike = goog.isArrayLike(var_args);
        var keys = isArrayLike ? var_args : arguments;
        for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
            obj = obj[keys[i]];
            if (!goog.isDef(obj)) break
        }
        return obj
    };
    goog.object.containsKey = function (obj, key) {
        return key in obj
    };
    goog.object.containsValue = function (obj, val) {
        for (var key in obj)
            if (obj[key] == val) return true;
        return false
    };
    goog.object.findKey = function (obj, f, opt_this) {
        for (var key in obj)
            if (f.call(opt_this, obj[key], key, obj)) return key;
        return undefined
    };
    goog.object.findValue = function (obj, f, opt_this) {
        var key = goog.object.findKey(obj, f, opt_this);
        return key && obj[key]
    };
    goog.object.isEmpty = function (obj) {
        for (var key in obj) return false;
        return true
    };
    goog.object.clear = function (obj) {
        for (var i in obj) delete obj[i]
    };
    goog.object.remove = function (obj, key) {
        var rv;
        if (rv = key in obj) delete obj[key];
        return rv
    };
    goog.object.add = function (obj, key, val) {
        if (key in obj) throw Error('The object already contains the key "' + key + '"');
        goog.object.set(obj, key, val)
    };
    goog.object.get = function (obj, key, opt_val) {
        if (key in obj) return obj[key];
        return opt_val
    };
    goog.object.set = function (obj, key, value) {
        obj[key] = value
    };
    goog.object.setIfUndefined = function (obj, key, value) {
        return key in obj ? obj[key] : obj[key] = value
    };
    goog.object.clone = function (obj) {
        var res = {};
        for (var key in obj) res[key] = obj[key];
        return res
    };
    goog.object.unsafeClone = function (obj) {
        var type = goog.typeOf(obj);
        if (type == "object" || type == "array") {
            if (obj.clone) return obj.clone();
            var clone = type == "array" ? [] : {};
            for (var key in obj) clone[key] = goog.object.unsafeClone(obj[key]);
            return clone
        }
        return obj
    };
    goog.object.transpose = function (obj) {
        var transposed = {};
        for (var key in obj) transposed[obj[key]] = key;
        return transposed
    };
    goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
    goog.object.extend = function (target, var_args) {
        var key, source;
        for (var i = 1; i < arguments.length; i++) {
            source = arguments[i];
            for (key in source) target[key] = source[key];
            for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
                key = goog.object.PROTOTYPE_FIELDS_[j];
                if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key]
            }
        }
    };
    goog.object.create = function (var_args) {
        var argLength = arguments.length;
        if (argLength == 1 && goog.isArray(arguments[0])) return goog.object.create.apply(null, arguments[0]);
        if (argLength % 2) throw Error("Uneven number of arguments");
        var rv = {};
        for (var i = 0; i < argLength; i += 2) rv[arguments[i]] = arguments[i + 1];
        return rv
    };
    goog.object.createSet = function (var_args) {
        var argLength = arguments.length;
        if (argLength == 1 && goog.isArray(arguments[0])) return goog.object.createSet.apply(null, arguments[0]);
        var rv = {};
        for (var i = 0; i < argLength; i++) rv[arguments[i]] = true;
        return rv
    };
    goog.provide("sb.NodeType");
    goog.provide("sb.NodeTypeHelper");
    goog.require("goog.object");
    sb.NodeType = {};
    sb.NodeType.UnspecifiedEntity = "unspecified entity";
    sb.NodeType.SimpleChemical = "simple chemical";
    sb.NodeType.Macromolecule = "macromolecule";
    sb.NodeType.NucleicAcidFeature = "nucleic acid feature";
    sb.NodeType.SimpleChemicalMultimer = "simple chemical multimer";
    sb.NodeType.MacromoleculeMultimer = "macromolecule multimer";
    sb.NodeType.NucleicAcidFeatureMultimer = "nucleic acid feature multimer";
    sb.NodeType.Complex = "complex";
    sb.NodeType.ComplexMultimer = "complex multimer";
    sb.NodeType.SourceAndSink = "source and sink";
    sb.NodeType.Perturbation = "perturbation";
    sb.NodeType.BiologicalActivity = "biological activity";
    sb.NodeType.PerturbingAgent = "perturbing agent";
    sb.NodeType.Compartment = "compartment";
    sb.NodeType.Submap = "submap";
    sb.NodeType.Tag = "tag";
    sb.NodeType.Terminal = "terminal";
    sb.NodeType.Process = "process";
    sb.NodeType.OmittedProcess = "omitted process";
    sb.NodeType.UncertainProcess = "uncertain process";
    sb.NodeType.Association = "association";
    sb.NodeType.Dissociation = "dissociation";
    sb.NodeType.Phenotype = "phenotype";
    sb.NodeType.And = "and";
    sb.NodeType.Or = "or";
    sb.NodeType.Not = "not";
    sb.NodeType.StateVariable = "state variable";
    sb.NodeType.UnitOfInformation = "unit of information";
    sb.NodeType.Stoichiometry = "stoichiometry";
    sb.NodeType.Entity = "entity";
    sb.NodeType.Outcome = "outcome";
    sb.NodeType.Observable = "observable";
    sb.NodeType.Interaction = "interaction";
    sb.NodeType.InfluenceTarget = "influence target";
    sb.NodeType.Annotation = "annotation";
    sb.NodeType.VariableValue = "variable value";
    sb.NodeType.ImplicitXor = "implicit xor";
    sb.NodeType.Delay = "delay";
    sb.NodeType.Existence = "existence";
    sb.NodeType.Location = "location";
    sb.NodeType.Cardinality = "cardinality";
    sb.NodeTypeHelper.isNodeTypeSupported = function (nodeType) {
        return goog.object.containsValue(sb.NodeType, nodeType)
    };
    goog.provide("goog.debug.Error");
    goog.debug.Error = function (opt_msg) {
        if (Error.captureStackTrace) Error.captureStackTrace(this, goog.debug.Error);
        else this.stack = (new Error).stack || ""; if (opt_msg) this.message = String(opt_msg)
    };
    goog.inherits(goog.debug.Error, Error);
    goog.debug.Error.prototype.name = "CustomError";
    goog.provide("goog.string");
    goog.provide("goog.string.Unicode");
    goog.string.Unicode = {
        NBSP: "\u00a0"
    };
    goog.string.startsWith = function (str, prefix) {
        return str.lastIndexOf(prefix, 0) == 0
    };
    goog.string.endsWith = function (str, suffix) {
        var l = str.length - suffix.length;
        return l >= 0 && str.indexOf(suffix, l) == l
    };
    goog.string.caseInsensitiveStartsWith = function (str, prefix) {
        return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
    };
    goog.string.caseInsensitiveEndsWith = function (str, suffix) {
        return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
    };
    goog.string.subs = function (str, var_args) {
        for (var i = 1; i < arguments.length; i++) {
            var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
            str = str.replace(/\%s/, replacement)
        }
        return str
    };
    goog.string.collapseWhitespace = function (str) {
        return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
    };
    goog.string.isEmpty = function (str) {
        return /^[\s\xa0]*$/.test(str)
    };
    goog.string.isEmptySafe = function (str) {
        return goog.string.isEmpty(goog.string.makeSafe(str))
    };
    goog.string.isBreakingWhitespace = function (str) {
        return !/[^\t\n\r ]/.test(str)
    };
    goog.string.isAlpha = function (str) {
        return !/[^a-zA-Z]/.test(str)
    };
    goog.string.isNumeric = function (str) {
        return !/[^0-9]/.test(str)
    };
    goog.string.isAlphaNumeric = function (str) {
        return !/[^a-zA-Z0-9]/.test(str)
    };
    goog.string.isSpace = function (ch) {
        return ch == " "
    };
    goog.string.isUnicodeChar = function (ch) {
        return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
    };
    goog.string.stripNewlines = function (str) {
        return str.replace(/(\r\n|\r|\n)+/g, " ")
    };
    goog.string.canonicalizeNewlines = function (str) {
        return str.replace(/(\r\n|\r|\n)/g, "\n")
    };
    goog.string.normalizeWhitespace = function (str) {
        return str.replace(/\xa0|\s/g, " ")
    };
    goog.string.normalizeSpaces = function (str) {
        return str.replace(/\xa0|[ \t]+/g, " ")
    };
    goog.string.collapseBreakingSpaces = function (str) {
        return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
    };
    goog.string.trim = function (str) {
        return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
    };
    goog.string.trimLeft = function (str) {
        return str.replace(/^[\s\xa0]+/, "")
    };
    goog.string.trimRight = function (str) {
        return str.replace(/[\s\xa0]+$/, "")
    };
    goog.string.caseInsensitiveCompare = function (str1, str2) {
        var test1 = String(str1).toLowerCase();
        var test2 = String(str2).toLowerCase();
        if (test1 < test2) return -1;
        else if (test1 == test2) return 0;
        else return 1
    };
    goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
    goog.string.numerateCompare = function (str1, str2) {
        if (str1 == str2) return 0;
        if (!str1) return -1;
        if (!str2) return 1;
        var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
        var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
        var count = Math.min(tokens1.length, tokens2.length);
        for (var i = 0; i < count; i++) {
            var a = tokens1[i];
            var b = tokens2[i];
            if (a != b) {
                var num1 = parseInt(a, 10);
                if (!isNaN(num1)) {
                    var num2 = parseInt(b, 10);
                    if (!isNaN(num2) && num1 - num2) return num1 - num2
                }
                return a < b ? -1 : 1
            }
        }
        if (tokens1.length !=
            tokens2.length) return tokens1.length - tokens2.length;
        return str1 < str2 ? -1 : 1
    };
    goog.string.urlEncode = function (str) {
        return encodeURIComponent(String(str))
    };
    goog.string.urlDecode = function (str) {
        return decodeURIComponent(str.replace(/\+/g, " "))
    };
    goog.string.newLineToBr = function (str, opt_xml) {
        return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
    };
    goog.string.htmlEscape = function (str, opt_isLikelyToContainHtmlChars) {
        if (opt_isLikelyToContainHtmlChars) return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;");
        else {
            if (!goog.string.allRe_.test(str)) return str;
            if (str.indexOf("&") != -1) str = str.replace(goog.string.amperRe_, "&amp;");
            if (str.indexOf("<") != -1) str = str.replace(goog.string.ltRe_, "&lt;");
            if (str.indexOf(">") != -1) str = str.replace(goog.string.gtRe_, "&gt;");
            if (str.indexOf('"') != -1) str = str.replace(goog.string.quotRe_, "&quot;");
            return str
        }
    };
    goog.string.amperRe_ = /&/g;
    goog.string.ltRe_ = /</g;
    goog.string.gtRe_ = />/g;
    goog.string.quotRe_ = /\"/g;
    goog.string.allRe_ = /[&<>\"]/;
    goog.string.unescapeEntities = function (str) {
        if (goog.string.contains(str, "&"))
            if ("document" in goog.global) return goog.string.unescapeEntitiesUsingDom_(str);
            else return goog.string.unescapePureXmlEntities_(str);
        return str
    };
    goog.string.unescapeEntitiesUsingDom_ = function (str) {
        var seen = {
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": '"'
        };
        var div = document.createElement("div");
        return str.replace(goog.string.HTML_ENTITY_PATTERN_, function (s, entity) {
            var value = seen[s];
            if (value) return value;
            if (entity.charAt(0) == "#") {
                var n = Number("0" + entity.substr(1));
                if (!isNaN(n)) value = String.fromCharCode(n)
            }
            if (!value) {
                div.innerHTML = s + " ";
                value = div.firstChild.nodeValue.slice(0, -1)
            }
            return seen[s] = value
        })
    };
    goog.string.unescapePureXmlEntities_ = function (str) {
        return str.replace(/&([^;]+);/g, function (s, entity) {
            switch (entity) {
            case "amp":
                return "&";
            case "lt":
                return "<";
            case "gt":
                return ">";
            case "quot":
                return '"';
            default:
                if (entity.charAt(0) == "#") {
                    var n = Number("0" + entity.substr(1));
                    if (!isNaN(n)) return String.fromCharCode(n)
                }
                return s
            }
        })
    };
    goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
    goog.string.whitespaceEscape = function (str, opt_xml) {
        return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
    };
    goog.string.stripQuotes = function (str, quoteChars) {
        var length = quoteChars.length;
        for (var i = 0; i < length; i++) {
            var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
            if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) return str.substring(1, str.length - 1)
        }
        return str
    };
    goog.string.truncate = function (str, chars, opt_protectEscapedCharacters) {
        if (opt_protectEscapedCharacters) str = goog.string.unescapeEntities(str);
        if (str.length > chars) str = str.substring(0, chars - 3) + "...";
        if (opt_protectEscapedCharacters) str = goog.string.htmlEscape(str);
        return str
    };
    goog.string.truncateMiddle = function (str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
        if (opt_protectEscapedCharacters) str = goog.string.unescapeEntities(str);
        if (opt_trailingChars && str.length > chars) {
            if (opt_trailingChars > chars) opt_trailingChars = chars;
            var endPoint = str.length - opt_trailingChars;
            var startPoint = chars - opt_trailingChars;
            str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
        }
        else if (str.length > chars) {
            var half = Math.floor(chars / 2);
            var endPos = str.length - half;
            half += chars % 2;
            str = str.substring(0,
                half) + "..." + str.substring(endPos)
        }
        if (opt_protectEscapedCharacters) str = goog.string.htmlEscape(str);
        return str
    };
    goog.string.specialEscapeChars_ = {
        "\x00": "\\0",
        "\u0008": "\\b",
        "\u000c": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
        "\x0B": "\\x0B",
        '"': '\\"',
        "\\": "\\\\"
    };
    goog.string.jsEscapeCache_ = {
        "'": "\\'"
    };
    goog.string.quote = function (s) {
        s = String(s);
        if (s.quote) return s.quote();
        else {
            var sb = ['"'];
            for (var i = 0; i < s.length; i++) {
                var ch = s.charAt(i);
                var cc = ch.charCodeAt(0);
                sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
            }
            sb.push('"');
            return sb.join("")
        }
    };
    goog.string.escapeString = function (str) {
        var sb = [];
        for (var i = 0; i < str.length; i++) sb[i] = goog.string.escapeChar(str.charAt(i));
        return sb.join("")
    };
    goog.string.escapeChar = function (c) {
        if (c in goog.string.jsEscapeCache_) return goog.string.jsEscapeCache_[c];
        if (c in goog.string.specialEscapeChars_) return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
        var rv = c;
        var cc = c.charCodeAt(0);
        if (cc > 31 && cc < 127) rv = c;
        else {
            if (cc < 256) {
                rv = "\\x";
                if (cc < 16 || cc > 256) rv += "0"
            }
            else {
                rv = "\\u";
                if (cc < 4096) rv += "0"
            }
            rv += cc.toString(16).toUpperCase()
        }
        return goog.string.jsEscapeCache_[c] = rv
    };
    goog.string.toMap = function (s) {
        var rv = {};
        for (var i = 0; i < s.length; i++) rv[s.charAt(i)] = true;
        return rv
    };
    goog.string.contains = function (s, ss) {
        return s.indexOf(ss) != -1
    };
    goog.string.countOf = function (s, ss) {
        return s && ss ? s.split(ss).length - 1 : 0
    };
    goog.string.removeAt = function (s, index, stringLength) {
        var resultStr = s;
        if (index >= 0 && index < s.length && stringLength > 0) resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength);
        return resultStr
    };
    goog.string.remove = function (s, ss) {
        var re = new RegExp(goog.string.regExpEscape(ss), "");
        return s.replace(re, "")
    };
    goog.string.removeAll = function (s, ss) {
        var re = new RegExp(goog.string.regExpEscape(ss), "g");
        return s.replace(re, "")
    };
    goog.string.regExpEscape = function (s) {
        return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
    };
    goog.string.repeat = function (string, length) {
        return (new Array(length + 1)).join(string)
    };
    goog.string.padNumber = function (num, length, opt_precision) {
        var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
        var index = s.indexOf(".");
        if (index == -1) index = s.length;
        return goog.string.repeat("0", Math.max(0, length - index)) + s
    };
    goog.string.makeSafe = function (obj) {
        return obj == null ? "" : String(obj)
    };
    goog.string.buildString = function (var_args) {
        return Array.prototype.join.call(arguments, "")
    };
    goog.string.getRandomString = function () {
        var x = 2147483648;
        return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
    };
    goog.string.compareVersions = function (version1, version2) {
        var order = 0;
        var v1Subs = goog.string.trim(String(version1)).split(".");
        var v2Subs = goog.string.trim(String(version2)).split(".");
        var subCount = Math.max(v1Subs.length, v2Subs.length);
        for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
            var v1Sub = v1Subs[subIdx] || "";
            var v2Sub = v2Subs[subIdx] || "";
            var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
            var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
            do {
                var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
                var v2Comp =
                    v2CompParser.exec(v2Sub) || ["", "", ""];
                if (v1Comp[0].length == 0 && v2Comp[0].length == 0) break;
                var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
                var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
                order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
            } while (order == 0)
        }
        return order
    };
    goog.string.compareElements_ = function (left, right) {
        if (left < right) return -1;
        else if (left > right) return 1;
        return 0
    };
    goog.string.HASHCODE_MAX_ = 4294967296;
    goog.string.hashCode = function (str) {
        var result = 0;
        for (var i = 0; i < str.length; ++i) {
            result = 31 * result + str.charCodeAt(i);
            result %= goog.string.HASHCODE_MAX_
        }
        return result
    };
    goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
    goog.string.createUniqueString = function () {
        return "goog_" + goog.string.uniqueStringCounter_++
    };
    goog.string.toNumber = function (str) {
        var num = Number(str);
        if (num == 0 && goog.string.isEmpty(str)) return NaN;
        return num
    };
    goog.string.toCamelCase = function (str) {
        return String(str).replace(/\-([a-z])/g, function (all, match) {
            return match.toUpperCase()
        })
    };
    goog.string.toSelectorCase = function (str) {
        return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
    };
    goog.string.toTitleCase = function (str, opt_delimiters) {
        var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
        delimiters = delimiters ? "|[" + delimiters + "]+" : "";
        var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
        return str.replace(regexp, function (all, p1, p2) {
            return p1 + p2.toUpperCase()
        })
    };
    goog.provide("goog.asserts");
    goog.provide("goog.asserts.AssertionError");
    goog.require("goog.debug.Error");
    goog.require("goog.string");
    goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
    goog.asserts.AssertionError = function (messagePattern, messageArgs) {
        messageArgs.unshift(messagePattern);
        goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
        messageArgs.shift();
        this.messagePattern = messagePattern
    };
    goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
    goog.asserts.AssertionError.prototype.name = "AssertionError";
    goog.asserts.doAssertFailure_ = function (defaultMessage, defaultArgs, givenMessage, givenArgs) {
        var message = "Assertion failed";
        if (givenMessage) {
            message += ": " + givenMessage;
            var args = givenArgs
        }
        else if (defaultMessage) {
            message += ": " + defaultMessage;
            args = defaultArgs
        }
        throw new goog.asserts.AssertionError("" + message, args || []);
    };
    goog.asserts.assert = function (condition, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !condition) goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2));
        return condition
    };
    goog.asserts.fail = function (opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS) throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
    };
    goog.asserts.assertNumber = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertString = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertFunction = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertObject = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertArray = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertBoolean = function (value, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2));
        return value
    };
    goog.asserts.assertInstanceof = function (value, type, opt_message, var_args) {
        if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
    };
    goog.provide("goog.array");
    goog.provide("goog.array.ArrayLike");
    goog.require("goog.asserts");
    goog.NATIVE_ARRAY_PROTOTYPES = true;
    goog.array.ArrayLike;
    goog.array.peek = function (array) {
        return array[array.length - 1]
    };
    goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
    goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function (arr, obj, opt_fromIndex) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
    } : function (arr, obj, opt_fromIndex) {
        var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
        if (goog.isString(arr)) {
            if (!goog.isString(obj) || obj.length != 1) return -1;
            return arr.indexOf(obj, fromIndex)
        }
        for (var i = fromIndex; i < arr.length; i++)
            if (i in
                arr && arr[i] === obj) return i;
        return -1
    };
    goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function (arr, obj, opt_fromIndex) {
        goog.asserts.assert(arr.length != null);
        var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
        return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
    } : function (arr, obj, opt_fromIndex) {
        var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
        if (fromIndex < 0) fromIndex = Math.max(0, arr.length + fromIndex);
        if (goog.isString(arr)) {
            if (!goog.isString(obj) || obj.length !=
                1) return -1;
            return arr.lastIndexOf(obj, fromIndex)
        }
        for (var i = fromIndex; i >= 0; i--)
            if (i in arr && arr[i] === obj) return i;
        return -1
    };
    goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function (arr, f, opt_obj) {
        goog.asserts.assert(arr.length != null);
        goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
    } : function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2) f.call(opt_obj, arr2[i], i, arr)
    };
    goog.array.forEachRight = function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = l - 1; i >= 0; --i)
            if (i in arr2) f.call(opt_obj, arr2[i], i, arr)
    };
    goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function (arr, f, opt_obj) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
    } : function (arr, f, opt_obj) {
        var l = arr.length;
        var res = [];
        var resLength = 0;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2) {
                var val = arr2[i];
                if (f.call(opt_obj, val, i, arr)) res[resLength++] = val
            }
        return res
    };
    goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function (arr, f, opt_obj) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
    } : function (arr, f, opt_obj) {
        var l = arr.length;
        var res = new Array(l);
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2) res[i] = f.call(opt_obj, arr2[i], i, arr);
        return res
    };
    goog.array.reduce = function (arr, f, val, opt_obj) {
        if (arr.reduce)
            if (opt_obj) return arr.reduce(goog.bind(f, opt_obj), val);
            else return arr.reduce(f, val);
        var rval = val;
        goog.array.forEach(arr, function (val, index) {
            rval = f.call(opt_obj, rval, val, index, arr)
        });
        return rval
    };
    goog.array.reduceRight = function (arr, f, val, opt_obj) {
        if (arr.reduceRight)
            if (opt_obj) return arr.reduceRight(goog.bind(f, opt_obj), val);
            else return arr.reduceRight(f, val);
        var rval = val;
        goog.array.forEachRight(arr, function (val, index) {
            rval = f.call(opt_obj, rval, val, index, arr)
        });
        return rval
    };
    goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function (arr, f, opt_obj) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
    } : function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) return true;
        return false
    };
    goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function (arr, f, opt_obj) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
    } : function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) return false;
        return true
    };
    goog.array.find = function (arr, f, opt_obj) {
        var i = goog.array.findIndex(arr, f, opt_obj);
        return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
    };
    goog.array.findIndex = function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = 0; i < l; i++)
            if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) return i;
        return -1
    };
    goog.array.findRight = function (arr, f, opt_obj) {
        var i = goog.array.findIndexRight(arr, f, opt_obj);
        return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
    };
    goog.array.findIndexRight = function (arr, f, opt_obj) {
        var l = arr.length;
        var arr2 = goog.isString(arr) ? arr.split("") : arr;
        for (var i = l - 1; i >= 0; i--)
            if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) return i;
        return -1
    };
    goog.array.contains = function (arr, obj) {
        return goog.array.indexOf(arr, obj) >= 0
    };
    goog.array.isEmpty = function (arr) {
        return arr.length == 0
    };
    goog.array.clear = function (arr) {
        if (!goog.isArray(arr))
            for (var i = arr.length - 1; i >= 0; i--) delete arr[i];
        arr.length = 0
    };
    goog.array.insert = function (arr, obj) {
        if (!goog.array.contains(arr, obj)) arr.push(obj)
    };
    goog.array.insertAt = function (arr, obj, opt_i) {
        goog.array.splice(arr, opt_i, 0, obj)
    };
    goog.array.insertArrayAt = function (arr, elementsToAdd, opt_i) {
        goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
    };
    goog.array.insertBefore = function (arr, obj, opt_obj2) {
        var i;
        if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) arr.push(obj);
        else goog.array.insertAt(arr, obj, i)
    };
    goog.array.remove = function (arr, obj) {
        var i = goog.array.indexOf(arr, obj);
        var rv;
        if (rv = i >= 0) goog.array.removeAt(arr, i);
        return rv
    };
    goog.array.removeAt = function (arr, i) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
    };
    goog.array.removeIf = function (arr, f, opt_obj) {
        var i = goog.array.findIndex(arr, f, opt_obj);
        if (i >= 0) {
            goog.array.removeAt(arr, i);
            return true
        }
        return false
    };
    goog.array.concat = function (var_args) {
        return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
    };
    goog.array.toArray = function (object) {
        var length = object.length;
        if (length > 0) {
            var rv = new Array(length);
            for (var i = 0; i < length; i++) rv[i] = object[i];
            return rv
        }
        return []
    };
    goog.array.clone = goog.array.toArray;
    goog.array.extend = function (arr1, var_args) {
        for (var i = 1; i < arguments.length; i++) {
            var arr2 = arguments[i];
            var isArrayLike;
            if (goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) arr1.push.apply(arr1, arr2);
            else if (isArrayLike) {
                var len1 = arr1.length;
                var len2 = arr2.length;
                for (var j = 0; j < len2; j++) arr1[len1 + j] = arr2[j]
            }
            else arr1.push(arr2)
        }
    };
    goog.array.splice = function (arr, index, howMany, var_args) {
        goog.asserts.assert(arr.length != null);
        return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
    };
    goog.array.slice = function (arr, start, opt_end) {
        goog.asserts.assert(arr.length != null);
        if (arguments.length <= 2) return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
        else return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
    };
    goog.array.removeDuplicates = function (arr, opt_rv) {
        var returnArray = opt_rv || arr;
        var seen = {}, cursorInsert = 0,
            cursorRead = 0;
        while (cursorRead < arr.length) {
            var current = arr[cursorRead++];
            var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
            if (!Object.prototype.hasOwnProperty.call(seen, key)) {
                seen[key] = true;
                returnArray[cursorInsert++] = current
            }
        }
        returnArray.length = cursorInsert
    };
    goog.array.binarySearch = function (arr, target, opt_compareFn) {
        return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
    };
    goog.array.binarySelect = function (arr, evaluator, opt_obj) {
        return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
    };
    goog.array.binarySearch_ = function (arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
        var left = 0;
        var right = arr.length;
        var found;
        while (left < right) {
            var middle = left + right >> 1;
            var compareResult;
            if (isEvaluator) compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
            else compareResult = compareFn(opt_target, arr[middle]); if (compareResult > 0) left = middle + 1;
            else {
                right = middle;
                found = !compareResult
            }
        }
        return found ? left : ~left
    };
    goog.array.sort = function (arr, opt_compareFn) {
        goog.asserts.assert(arr.length != null);
        goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
    };
    goog.array.stableSort = function (arr, opt_compareFn) {
        for (var i = 0; i < arr.length; i++) arr[i] = {
            index: i,
            value: arr[i]
        };
        var valueCompareFn = opt_compareFn || goog.array.defaultCompare;

        function stableCompareFn(obj1, obj2) {
            return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
        }
        goog.array.sort(arr, stableCompareFn);
        for (var i = 0; i < arr.length; i++) arr[i] = arr[i].value
    };
    goog.array.sortObjectsByKey = function (arr, key, opt_compareFn) {
        var compare = opt_compareFn || goog.array.defaultCompare;
        goog.array.sort(arr, function (a, b) {
            return compare(a[key], b[key])
        })
    };
    goog.array.isSorted = function (arr, opt_compareFn, opt_strict) {
        var compare = opt_compareFn || goog.array.defaultCompare;
        for (var i = 1; i < arr.length; i++) {
            var compareResult = compare(arr[i - 1], arr[i]);
            if (compareResult > 0 || compareResult == 0 && opt_strict) return false
        }
        return true
    };
    goog.array.equals = function (arr1, arr2, opt_equalsFn) {
        if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) return false;
        var l = arr1.length;
        var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
        for (var i = 0; i < l; i++)
            if (!equalsFn(arr1[i], arr2[i])) return false;
        return true
    };
    goog.array.compare = function (arr1, arr2, opt_equalsFn) {
        return goog.array.equals(arr1, arr2, opt_equalsFn)
    };
    goog.array.compare3 = function (arr1, arr2, opt_compareFn) {
        var compare = opt_compareFn || goog.array.defaultCompare;
        var l = Math.min(arr1.length, arr2.length);
        for (var i = 0; i < l; i++) {
            var result = compare(arr1[i], arr2[i]);
            if (result != 0) return result
        }
        return goog.array.defaultCompare(arr1.length, arr2.length)
    };
    goog.array.defaultCompare = function (a, b) {
        return a > b ? 1 : a < b ? -1 : 0
    };
    goog.array.defaultCompareEquality = function (a, b) {
        return a === b
    };
    goog.array.binaryInsert = function (array, value, opt_compareFn) {
        var index = goog.array.binarySearch(array, value, opt_compareFn);
        if (index < 0) {
            goog.array.insertAt(array, value, -(index + 1));
            return true
        }
        return false
    };
    goog.array.binaryRemove = function (array, value, opt_compareFn) {
        var index = goog.array.binarySearch(array, value, opt_compareFn);
        return index >= 0 ? goog.array.removeAt(array, index) : false
    };
    goog.array.bucket = function (array, sorter) {
        var buckets = {};
        for (var i = 0; i < array.length; i++) {
            var value = array[i];
            var key = sorter(value, i, array);
            if (goog.isDef(key)) {
                var bucket = buckets[key] || (buckets[key] = []);
                bucket.push(value)
            }
        }
        return buckets
    };
    goog.array.repeat = function (value, n) {
        var array = [];
        for (var i = 0; i < n; i++) array[i] = value;
        return array
    };
    goog.array.flatten = function (var_args) {
        var result = [];
        for (var i = 0; i < arguments.length; i++) {
            var element = arguments[i];
            if (goog.isArray(element)) result.push.apply(result, goog.array.flatten.apply(null, element));
            else result.push(element)
        }
        return result
    };
    goog.array.rotate = function (array, n) {
        goog.asserts.assert(array.length != null);
        if (array.length) {
            n %= array.length;
            if (n > 0) goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
            else if (n < 0) goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
        }
        return array
    };
    goog.array.zip = function (var_args) {
        if (!arguments.length) return [];
        var result = [];
        for (var i = 0; true; i++) {
            var value = [];
            for (var j = 0; j < arguments.length; j++) {
                var arr = arguments[j];
                if (i >= arr.length) return result;
                value.push(arr[i])
            }
            result.push(value)
        }
    };
    goog.array.shuffle = function (arr, opt_randFn) {
        var randFn = opt_randFn || Math.random;
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(randFn() * (i + 1));
            var tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp
        }
    };
    goog.provide("goog.iter");
    goog.provide("goog.iter.Iterator");
    goog.provide("goog.iter.StopIteration");
    goog.require("goog.array");
    goog.require("goog.asserts");
    goog.iter.Iterable;
    if ("StopIteration" in goog.global) goog.iter.StopIteration = goog.global["StopIteration"];
    else goog.iter.StopIteration = Error("StopIteration");
    goog.iter.Iterator = function () {};
    goog.iter.Iterator.prototype.next = function () {
        throw goog.iter.StopIteration;
    };
    goog.iter.Iterator.prototype.__iterator__ = function (opt_keys) {
        return this
    };
    goog.iter.toIterator = function (iterable) {
        if (iterable instanceof goog.iter.Iterator) return iterable;
        if (typeof iterable.__iterator__ == "function") return iterable.__iterator__(false);
        if (goog.isArrayLike(iterable)) {
            var i = 0;
            var newIter = new goog.iter.Iterator;
            newIter.next = function () {
                while (true) {
                    if (i >= iterable.length) throw goog.iter.StopIteration;
                    if (!(i in iterable)) {
                        i++;
                        continue
                    }
                    return iterable[i++]
                }
            };
            return newIter
        }
        throw Error("Not implemented");
    };
    goog.iter.forEach = function (iterable, f, opt_obj) {
        if (goog.isArrayLike(iterable)) try {
            goog.array.forEach(iterable, f, opt_obj)
        }
        catch (ex) {
            if (ex !== goog.iter.StopIteration) throw ex;
        }
        else {
            iterable = goog.iter.toIterator(iterable);
            try {
                while (true) f.call(opt_obj, iterable.next(), undefined, iterable)
            }
            catch (ex) {
                if (ex !== goog.iter.StopIteration) throw ex;
            }
        }
    };
    goog.iter.filter = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        var newIter = new goog.iter.Iterator;
        newIter.next = function () {
            while (true) {
                var val = iterable.next();
                if (f.call(opt_obj, val, undefined, iterable)) return val
            }
        };
        return newIter
    };
    goog.iter.range = function (startOrStop, opt_stop, opt_step) {
        var start = 0;
        var stop = startOrStop;
        var step = opt_step || 1;
        if (arguments.length > 1) {
            start = startOrStop;
            stop = opt_stop
        }
        if (step == 0) throw Error("Range step argument must not be zero");
        var newIter = new goog.iter.Iterator;
        newIter.next = function () {
            if (step > 0 && start >= stop || step < 0 && start <= stop) throw goog.iter.StopIteration;
            var rv = start;
            start += step;
            return rv
        };
        return newIter
    };
    goog.iter.join = function (iterable, deliminator) {
        return goog.iter.toArray(iterable).join(deliminator)
    };
    goog.iter.map = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        var newIter = new goog.iter.Iterator;
        newIter.next = function () {
            while (true) {
                var val = iterable.next();
                return f.call(opt_obj, val, undefined, iterable)
            }
        };
        return newIter
    };
    goog.iter.reduce = function (iterable, f, val, opt_obj) {
        var rval = val;
        goog.iter.forEach(iterable, function (val) {
            rval = f.call(opt_obj, rval, val)
        });
        return rval
    };
    goog.iter.some = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        try {
            while (true)
                if (f.call(opt_obj, iterable.next(), undefined, iterable)) return true
        }
        catch (ex) {
            if (ex !== goog.iter.StopIteration) throw ex;
        }
        return false
    };
    goog.iter.every = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        try {
            while (true)
                if (!f.call(opt_obj, iterable.next(), undefined, iterable)) return false
        }
        catch (ex) {
            if (ex !== goog.iter.StopIteration) throw ex;
        }
        return true
    };
    goog.iter.chain = function (var_args) {
        var args = arguments;
        var length = args.length;
        var i = 0;
        var newIter = new goog.iter.Iterator;
        newIter.next = function () {
            try {
                if (i >= length) throw goog.iter.StopIteration;
                var current = goog.iter.toIterator(args[i]);
                return current.next()
            }
            catch (ex) {
                if (ex !== goog.iter.StopIteration || i >= length) throw ex;
                else {
                    i++;
                    return this.next()
                }
            }
        };
        return newIter
    };
    goog.iter.dropWhile = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        var newIter = new goog.iter.Iterator;
        var dropping = true;
        newIter.next = function () {
            while (true) {
                var val = iterable.next();
                if (dropping && f.call(opt_obj, val, undefined, iterable)) continue;
                else dropping = false;
                return val
            }
        };
        return newIter
    };
    goog.iter.takeWhile = function (iterable, f, opt_obj) {
        iterable = goog.iter.toIterator(iterable);
        var newIter = new goog.iter.Iterator;
        var taking = true;
        newIter.next = function () {
            while (true)
                if (taking) {
                    var val = iterable.next();
                    if (f.call(opt_obj, val, undefined, iterable)) return val;
                    else taking = false
                }
                else throw goog.iter.StopIteration;
        };
        return newIter
    };
    goog.iter.toArray = function (iterable) {
        if (goog.isArrayLike(iterable)) return goog.array.toArray(iterable);
        iterable = goog.iter.toIterator(iterable);
        var array = [];
        goog.iter.forEach(iterable, function (val) {
            array.push(val)
        });
        return array
    };
    goog.iter.equals = function (iterable1, iterable2) {
        iterable1 = goog.iter.toIterator(iterable1);
        iterable2 = goog.iter.toIterator(iterable2);
        var b1, b2;
        try {
            while (true) {
                b1 = b2 = false;
                var val1 = iterable1.next();
                b1 = true;
                var val2 = iterable2.next();
                b2 = true;
                if (val1 != val2) return false
            }
        }
        catch (ex) {
            if (ex !== goog.iter.StopIteration) throw ex;
            else {
                if (b1 && !b2) return false;
                if (!b2) try {
                    val2 = iterable2.next();
                    return false
                }
                catch (ex1) {
                    if (ex1 !== goog.iter.StopIteration) throw ex1;
                    return true
                }
            }
        }
        return false
    };
    goog.iter.nextOrValue = function (iterable, defaultValue) {
        try {
            return goog.iter.toIterator(iterable).next()
        }
        catch (e) {
            if (e != goog.iter.StopIteration) throw e;
            return defaultValue
        }
    };
    goog.iter.product = function (var_args) {
        var someArrayEmpty = goog.array.some(arguments, function (arr) {
            return !arr.length
        });
        if (someArrayEmpty || !arguments.length) return new goog.iter.Iterator;
        var iter = new goog.iter.Iterator;
        var arrays = arguments;
        var indicies = goog.array.repeat(0, arrays.length);
        iter.next = function () {
            if (indicies) {
                var retVal = goog.array.map(indicies, function (valueIndex, arrayIndex) {
                    return arrays[arrayIndex][valueIndex]
                });
                for (var i = indicies.length - 1; i >= 0; i--) {
                    goog.asserts.assert(indicies);
                    if (indicies[i] <
                        arrays[i].length - 1) {
                        indicies[i]++;
                        break
                    }
                    if (i == 0) {
                        indicies = null;
                        break
                    }
                    indicies[i] = 0
                }
                return retVal
            }
            throw goog.iter.StopIteration;
        };
        return iter
    };
    goog.iter.cycle = function (iterable) {
        var baseIterator = goog.iter.toIterator(iterable);
        var cache = [];
        var cacheIndex = 0;
        var iter = new goog.iter.Iterator;
        var useCache = false;
        iter.next = function () {
            var returnElement = null;
            if (!useCache) try {
                returnElement = baseIterator.next();
                cache.push(returnElement);
                return returnElement
            }
            catch (e) {
                if (e != goog.iter.StopIteration || goog.array.isEmpty(cache)) throw e;
                useCache = true
            }
            returnElement = cache[cacheIndex];
            cacheIndex = (cacheIndex + 1) % cache.length;
            return returnElement
        };
        return iter
    };
    goog.provide("goog.structs");
    goog.require("goog.array");
    goog.require("goog.object");
    goog.structs.getCount = function (col) {
        if (typeof col.getCount == "function") return col.getCount();
        if (goog.isArrayLike(col) || goog.isString(col)) return col.length;
        return goog.object.getCount(col)
    };
    goog.structs.getValues = function (col) {
        if (typeof col.getValues == "function") return col.getValues();
        if (goog.isString(col)) return col.split("");
        if (goog.isArrayLike(col)) {
            var rv = [];
            var l = col.length;
            for (var i = 0; i < l; i++) rv.push(col[i]);
            return rv
        }
        return goog.object.getValues(col)
    };
    goog.structs.getKeys = function (col) {
        if (typeof col.getKeys == "function") return col.getKeys();
        if (typeof col.getValues == "function") return undefined;
        if (goog.isArrayLike(col) || goog.isString(col)) {
            var rv = [];
            var l = col.length;
            for (var i = 0; i < l; i++) rv.push(i);
            return rv
        }
        return goog.object.getKeys(col)
    };
    goog.structs.contains = function (col, val) {
        if (typeof col.contains == "function") return col.contains(val);
        if (typeof col.containsValue == "function") return col.containsValue(val);
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.contains(col, val);
        return goog.object.containsValue(col, val)
    };
    goog.structs.isEmpty = function (col) {
        if (typeof col.isEmpty == "function") return col.isEmpty();
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.isEmpty(col);
        return goog.object.isEmpty(col)
    };
    goog.structs.clear = function (col) {
        if (typeof col.clear == "function") col.clear();
        else if (goog.isArrayLike(col)) goog.array.clear(col);
        else goog.object.clear(col)
    };
    goog.structs.forEach = function (col, f, opt_obj) {
        if (typeof col.forEach == "function") col.forEach(f, opt_obj);
        else if (goog.isArrayLike(col) || goog.isString(col)) goog.array.forEach(col, f, opt_obj);
        else {
            var keys = goog.structs.getKeys(col);
            var values = goog.structs.getValues(col);
            var l = values.length;
            for (var i = 0; i < l; i++) f.call(opt_obj, values[i], keys && keys[i], col)
        }
    };
    goog.structs.filter = function (col, f, opt_obj) {
        if (typeof col.filter == "function") return col.filter(f, opt_obj);
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.filter(col, f, opt_obj);
        var rv;
        var keys = goog.structs.getKeys(col);
        var values = goog.structs.getValues(col);
        var l = values.length;
        if (keys) {
            rv = {};
            for (var i = 0; i < l; i++)
                if (f.call(opt_obj, values[i], keys[i], col)) rv[keys[i]] = values[i]
        }
        else {
            rv = [];
            for (var i = 0; i < l; i++)
                if (f.call(opt_obj, values[i], undefined, col)) rv.push(values[i])
        }
        return rv
    };
    goog.structs.map = function (col, f, opt_obj) {
        if (typeof col.map == "function") return col.map(f, opt_obj);
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.map(col, f, opt_obj);
        var rv;
        var keys = goog.structs.getKeys(col);
        var values = goog.structs.getValues(col);
        var l = values.length;
        if (keys) {
            rv = {};
            for (var i = 0; i < l; i++) rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
        }
        else {
            rv = [];
            for (var i = 0; i < l; i++) rv[i] = f.call(opt_obj, values[i], undefined, col)
        }
        return rv
    };
    goog.structs.some = function (col, f, opt_obj) {
        if (typeof col.some == "function") return col.some(f, opt_obj);
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.some(col, f, opt_obj);
        var keys = goog.structs.getKeys(col);
        var values = goog.structs.getValues(col);
        var l = values.length;
        for (var i = 0; i < l; i++)
            if (f.call(opt_obj, values[i], keys && keys[i], col)) return true;
        return false
    };
    goog.structs.every = function (col, f, opt_obj) {
        if (typeof col.every == "function") return col.every(f, opt_obj);
        if (goog.isArrayLike(col) || goog.isString(col)) return goog.array.every(col, f, opt_obj);
        var keys = goog.structs.getKeys(col);
        var values = goog.structs.getValues(col);
        var l = values.length;
        for (var i = 0; i < l; i++)
            if (!f.call(opt_obj, values[i], keys && keys[i], col)) return false;
        return true
    };
    goog.provide("goog.structs.Map");
    goog.require("goog.iter.Iterator");
    goog.require("goog.iter.StopIteration");
    goog.require("goog.object");
    goog.require("goog.structs");
    goog.structs.Map = function (opt_map, var_args) {
        this.map_ = {};
        this.keys_ = [];
        var argLength = arguments.length;
        if (argLength > 1) {
            if (argLength % 2) throw Error("Uneven number of arguments");
            for (var i = 0; i < argLength; i += 2) this.set(arguments[i], arguments[i + 1])
        }
        else if (opt_map) this.addAll(opt_map)
    };
    goog.structs.Map.prototype.count_ = 0;
    goog.structs.Map.prototype.version_ = 0;
    goog.structs.Map.prototype.getCount = function () {
        return this.count_
    };
    goog.structs.Map.prototype.getValues = function () {
        this.cleanupKeysArray_();
        var rv = [];
        for (var i = 0; i < this.keys_.length; i++) {
            var key = this.keys_[i];
            rv.push(this.map_[key])
        }
        return rv
    };
    goog.structs.Map.prototype.getKeys = function () {
        this.cleanupKeysArray_();
        return this.keys_.concat()
    };
    goog.structs.Map.prototype.containsKey = function (key) {
        return goog.structs.Map.hasKey_(this.map_, key)
    };
    goog.structs.Map.prototype.containsValue = function (val) {
        for (var i = 0; i < this.keys_.length; i++) {
            var key = this.keys_[i];
            if (goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) return true
        }
        return false
    };
    goog.structs.Map.prototype.equals = function (otherMap, opt_equalityFn) {
        if (this === otherMap) return true;
        if (this.count_ != otherMap.getCount()) return false;
        var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
        this.cleanupKeysArray_();
        for (var key, i = 0; key = this.keys_[i]; i++)
            if (!equalityFn(this.get(key), otherMap.get(key))) return false;
        return true
    };
    goog.structs.Map.defaultEquals = function (a, b) {
        return a === b
    };
    goog.structs.Map.prototype.isEmpty = function () {
        return this.count_ == 0
    };
    goog.structs.Map.prototype.clear = function () {
        this.map_ = {};
        this.keys_.length = 0;
        this.count_ = 0;
        this.version_ = 0
    };
    goog.structs.Map.prototype.remove = function (key) {
        if (goog.structs.Map.hasKey_(this.map_, key)) {
            delete this.map_[key];
            this.count_--;
            this.version_++;
            if (this.keys_.length > 2 * this.count_) this.cleanupKeysArray_();
            return true
        }
        return false
    };
    goog.structs.Map.prototype.cleanupKeysArray_ = function () {
        if (this.count_ != this.keys_.length) {
            var srcIndex = 0;
            var destIndex = 0;
            while (srcIndex < this.keys_.length) {
                var key = this.keys_[srcIndex];
                if (goog.structs.Map.hasKey_(this.map_, key)) this.keys_[destIndex++] = key;
                srcIndex++
            }
            this.keys_.length = destIndex
        }
        if (this.count_ != this.keys_.length) {
            var seen = {};
            var srcIndex = 0;
            var destIndex = 0;
            while (srcIndex < this.keys_.length) {
                var key = this.keys_[srcIndex];
                if (!goog.structs.Map.hasKey_(seen, key)) {
                    this.keys_[destIndex++] = key;
                    seen[key] = 1
                }
                srcIndex++
            }
            this.keys_.length = destIndex
        }
    };
    goog.structs.Map.prototype.get = function (key, opt_val) {
        if (goog.structs.Map.hasKey_(this.map_, key)) return this.map_[key];
        return opt_val
    };
    goog.structs.Map.prototype.set = function (key, value) {
        if (!goog.structs.Map.hasKey_(this.map_, key)) {
            this.count_++;
            this.keys_.push(key);
            this.version_++
        }
        this.map_[key] = value
    };
    goog.structs.Map.prototype.addAll = function (map) {
        var keys, values;
        if (map instanceof goog.structs.Map) {
            keys = map.getKeys();
            values = map.getValues()
        }
        else {
            keys = goog.object.getKeys(map);
            values = goog.object.getValues(map)
        }
        for (var i = 0; i < keys.length; i++) this.set(keys[i], values[i])
    };
    goog.structs.Map.prototype.clone = function () {
        return new goog.structs.Map(this)
    };
    goog.structs.Map.prototype.transpose = function () {
        var transposed = new goog.structs.Map;
        for (var i = 0; i < this.keys_.length; i++) {
            var key = this.keys_[i];
            var value = this.map_[key];
            transposed.set(value, key)
        }
        return transposed
    };
    goog.structs.Map.prototype.toObject = function () {
        this.cleanupKeysArray_();
        var obj = {};
        for (var i = 0; i < this.keys_.length; i++) {
            var key = this.keys_[i];
            obj[key] = this.map_[key]
        }
        return obj
    };
    goog.structs.Map.prototype.getKeyIterator = function () {
        return this.__iterator__(true)
    };
    goog.structs.Map.prototype.getValueIterator = function () {
        return this.__iterator__(false)
    };
    goog.structs.Map.prototype.__iterator__ = function (opt_keys) {
        this.cleanupKeysArray_();
        var i = 0;
        var keys = this.keys_;
        var map = this.map_;
        var version = this.version_;
        var selfObj = this;
        var newIter = new goog.iter.Iterator;
        newIter.next = function () {
            while (true) {
                if (version != selfObj.version_) throw Error("The map has changed since the iterator was created");
                if (i >= keys.length) throw goog.iter.StopIteration;
                var key = keys[i++];
                return opt_keys ? key : map[key]
            }
        };
        return newIter
    };
    goog.structs.Map.hasKey_ = function (obj, key) {
        return Object.prototype.hasOwnProperty.call(obj, key)
    };
    goog.provide("sb.model.AttributeObject");
    goog.require("goog.structs.Map");
    sb.model.AttributeObject = function () {
        this.attrs_ = new goog.structs.Map
    };
    sb.model.AttributeObject.prototype.attr = function (key, opt_value, opt_notifyObject) {
        if (goog.isDef(opt_value)) {
            var oldValue = this.attrs_.get(key);
            this.attrs_.set(key, opt_value);
            if (opt_notifyObject) opt_notifyObject.onAttrChange(this, key, oldValue, opt_value);
            return this
        }
        else return this.attrs_.get(key)
    };
    goog.provide("sb.model.Element");
    goog.require("sb.model.AttributeObject");
    sb.model.Element = function (document) {
        goog.base(this);
        this.document_ = document;
        this.children_ = [];
        this.parent_ = null
    };
    goog.inherits(sb.model.Element, sb.model.AttributeObject);
    sb.model.Element.prototype.id = function (opt_id) {
        if (goog.isDef(opt_id)) this.assertIdUnique_(opt_id);
        return this.attr("id", opt_id, this.document_)
    };
    sb.model.Element.prototype.assertIdUnique_ = function (elementId) {
        var arc = this.document_.element(elementId);
        if (arc && arc != this) throw new Error("Given element id " + elementId + " already existed");
    };
    sb.model.Element.prototype.addChild = function (element) {
        if (element.parent_) element.parent_.removeChild(element);
        goog.array.insert(this.children_, element);
        element.parent_ = this
    };
    sb.model.Element.prototype.removeChild = function (element) {
        goog.array.remove(this.children_, element);
        element.parent_ = null
    };
    sb.model.Element.prototype.children = function () {
        return this.children_
    };
    sb.model.Element.prototype.parent = function () {
        return this.parent_
    };
    goog.provide("sb.Port");
    goog.require("sb.model.Element");
    sb.Port = function (document) {
        goog.base(this, document)
    };
    goog.inherits(sb.Port, sb.model.Element);
    goog.provide("sb.Node");
    goog.require("sb.NodeType");
    goog.require("sb.NodeTypeHelper");
    goog.require("sb.model.Element");
    goog.require("sb.Port");
    sb.Node = function (document) {
        goog.base(this, document)
    };
    goog.inherits(sb.Node, sb.model.Element);
    sb.Node.prototype.type = function (opt_type) {
        if (goog.isDef(opt_type))
            if (!sb.NodeTypeHelper.isNodeTypeSupported(opt_type)) throw new Error("Given node type " + opt_type + " is not supported.");
        return this.attr("type", opt_type)
    };
    sb.Node.prototype.label = function (opt_label) {
        return this.attr("label", opt_label)
    };
    sb.Node.prototype.createSubNode = function (opt_id) {
        var node = this.document_.createNode(opt_id);
        this.addChild(node);
        return node
    };
    sb.Node.prototype.createPort = function (opt_id) {
        var port = this.document_.createPort(opt_id);
        this.addChild(port);
        return port
    };
    goog.provide("sb.ArcType");
    goog.provide("sb.ArcTypeHelper");
    goog.require("goog.object");
    sb.ArcType = {};
    sb.ArcType.Production = "production";
    sb.ArcType.Consumption = "consumption";
    sb.ArcType.Catalysis = "catalysis";
    sb.ArcType.Modulation = "modulation";
    sb.ArcType.Stimulation = "stimulation";
    sb.ArcType.Inhibition = "inhibition";
    sb.ArcType.Assignment = "assignment";
    sb.ArcType.Interaction = "interaction";
    sb.ArcType.AbsoluteInhibition = "absolute inhibition";
    sb.ArcType.AbsoluteStimulation = "absolute stimulation";
    sb.ArcType.PositiveInfluence = "positive influence";
    sb.ArcType.NegativeInfluence = "negative influence";
    sb.ArcType.UnknownInfluence = "unknown influence";
    sb.ArcType.EquivalenceArc = "equivalence arc";
    sb.ArcType.NecessaryStimulation = "necessary stimulation";
    sb.ArcType.LogicArc = "logic arc";
    sb.ArcTypeHelper.isArcTypeSupported = function (arcType) {
        return goog.object.containsValue(sb.ArcType, arcType)
    };
    goog.provide("sb.Arc");
    goog.require("sb.ArcType");
    goog.require("sb.ArcTypeHelper");
    goog.require("sb.model.Element");
    goog.require("sb.Port");
    sb.Arc = function (document) {
        goog.base(this, document)
    };
    goog.inherits(sb.Arc, sb.model.Element);
    sb.Arc.prototype.type = function (opt_type) {
        if (goog.isDef(opt_type))
            if (!sb.ArcTypeHelper.isArcTypeSupported(opt_type)) throw new Error("Given arc type " + opt_type + " is not supported.");
        return this.attr("type", opt_type)
    };
    sb.Arc.prototype.source = function (opt_source) {
        if (opt_source && goog.isString(opt_source)) {
            var element = this.document_.element(opt_source);
            if (!element) throw new Error("Element " + opt_source + " do not exist.");
            opt_source = element
        }
        return this.attr("source", opt_source)
    };
    sb.Arc.prototype.target = function (opt_target) {
        if (opt_target && goog.isString(opt_target)) {
            var element = this.document_.element(opt_target);
            if (!element) throw new Error("Element " + opt_target + " do not exist.");
            opt_target = element
        }
        return this.attr("target", opt_target)
    };
    sb.Arc.prototype.createPort = function (opt_id) {
        var port = this.document_.createPort(opt_id);
        this.addChild(port);
        return port
    };
    sb.Arc.prototype.start = function (opt_startPoint) {
        return this.attr("start", opt_startPoint)
    };
    sb.Arc.prototype.startXY = function (x, y) {
        this.start(new sb.Point(x, y))
    };
    sb.Arc.prototype.end = function (opt_endPoint) {
        return this.attr("end", opt_endPoint)
    };
    sb.Arc.prototype.endXY = function (x, y) {
        this.end(new sb.Point(x, y))
    };
    goog.provide("sb.ArcGroup");
    goog.require("sb.Arc");
    goog.require("sb.ArcType");
    goog.require("sb.ArcTypeHelper");
    goog.require("sb.model.AttributeObject");
    sb.ArcGroup = function (document) {
        goog.base(this, document)
    };
    goog.inherits(sb.ArcGroup, sb.model.Element);
    goog.provide("sb.Document");
    goog.provide("sb.Language");
    goog.require("sb.Node");
    goog.require("sb.Arc");
    goog.require("sb.Port");
    goog.require("sb.ArcGroup");
    goog.require("goog.structs.Map");
    goog.require("goog.array");
    sb.Document = function (opt_id) {
        goog.base(this);
        this.id = opt_id;
        this.nodeIdSeq_ = 1;
        this.arcIdSeq_ = 1;
        this.portIdSeq_ = 1;
        this.arcGroupIdSeq_ = 1;
        this.elementMap_ = new goog.structs.Map;
        this.nodes_ = [];
        this.arcs_ = [];
        this.ports_ = [];
        this.arcGroups_ = []
    };
    goog.inherits(sb.Document, sb.model.AttributeObject);
    sb.Document.prototype.createNode = function (opt_id) {
        var id = opt_id ? opt_id : this.nextNodeId_();
        var node = (new sb.Node(this)).id(id);
        goog.array.insert(this.nodes_, node);
        return node
    };
    sb.Document.prototype.nextNodeId_ = function () {
        var nextNodeId_ = "node" + this.nodeIdSeq_++;
        if (this.element(nextNodeId_)) return this.nextNodeId_();
        else return nextNodeId_
    };
    sb.Document.prototype.nodes = function (opt_noSubNodes) {
        if (opt_noSubNodes) return goog.array.filter(this.nodes_, function (node, idx, arr) {
            return node.parent() ? false : true
        });
        return this.nodes_
    };
    sb.Document.prototype.node = function (id) {
        var element = this.element(id);
        if (element instanceof sb.Node) return element;
        return null
    };
    sb.Document.prototype.element = function (id) {
        return this.elementMap_.get(id)
    };
    sb.Document.prototype.createArc = function (opt_id) {
        var id = opt_id ? opt_id : this.nextArcId_();
        var arc = (new sb.Arc(this)).id(id);
        goog.array.insert(this.arcs_, arc);
        return arc
    };
    sb.Document.prototype.createArcGroup = function (opt_id) {
        var id = opt_id ? opt_id : this.nextArcGroupId_();
        var arcGroup = (new sb.ArcGroup(this)).id(id);
        goog.array.insert(this.arcGroups_, arcGroup);
        return arcGroup
    };
    sb.Document.prototype.connect = function (source, target) {
        var arc = this.createArc();
        arc.source(source).target(target);
        return arc
    };
    sb.Document.prototype.nextArcId_ = function () {
        var nextArcId_ = "arc" + this.arcIdSeq_++;
        if (this.element(nextArcId_)) return this.nextArcId_();
        else return nextArcId_
    };
    sb.Document.prototype.nextArcGroupId_ = function () {
        var nextArcGroupId_ = "arcGroup" + this.arcGroupIdSeq_++;
        if (this.element(nextArcGroupId_)) return this.nextArcGroupId_();
        else return nextArcGroupId_
    };
    sb.Document.prototype.arcs = function () {
        return this.arcs_
    };
    sb.Document.prototype.arc = function (id) {
        var element = this.element(id);
        if (element instanceof sb.Arc) return element;
        return null
    };
    sb.Document.prototype.onAttrChange = function (object, key, oldValue, newValue) {
        if (key == "id") {
            if (oldValue) this.elementMap_.remove(oldValue);
            this.elementMap_.set(newValue, object)
        }
    };
    sb.Document.prototype.nextPortId_ = function () {
        var nextPortId_ = "port" + this.portIdSeq_++;
        if (this.element(nextPortId_)) return this.nextPortId_();
        else return nextPortId_
    };
    sb.Document.prototype.createPort = function (opt_id) {
        var id = opt_id ? opt_id : this.nextPortId_();
        var port = (new sb.Port(this)).id(id);
        goog.array.insert(this.ports_, port);
        return port
    };
    sb.Document.prototype.lang = function (opt_lang) {
        if (goog.isDef(opt_lang))
            if (!goog.object.containsValue(sb.Language, opt_lang)) throw new Error("Given SBGN language type " + opt_lang + " is not supported.");
        return this.attr("language", opt_lang)
    };
    sb.Language = {
        AF: "activity flow",
        ER: "entity relationship",
        PD: "process description"
    };
    goog.provide("sb.Point");
    sb.Point = function (opt_x, opt_y) {
        this.x = goog.isDef(opt_x) ? opt_x : 0;
        this.y = goog.isDef(opt_y) ? opt_y : 0
    };
    sb.Point.prototype.clone = function () {
        return new sb.Point(this.x, this.y)
    };
    goog.provide("goog.math.Coordinate");
    goog.math.Coordinate = function (opt_x, opt_y) {
        this.x = goog.isDef(opt_x) ? opt_x : 0;
        this.y = goog.isDef(opt_y) ? opt_y : 0
    };
    goog.math.Coordinate.prototype.clone = function () {
        return new goog.math.Coordinate(this.x, this.y)
    };
    if (goog.DEBUG) goog.math.Coordinate.prototype.toString = function () {
        return "(" + this.x + ", " + this.y + ")"
    };
    goog.math.Coordinate.equals = function (a, b) {
        if (a == b) return true;
        if (!a || !b) return false;
        return a.x == b.x && a.y == b.y
    };
    goog.math.Coordinate.distance = function (a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy)
    };
    goog.math.Coordinate.squaredDistance = function (a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return dx * dx + dy * dy
    };
    goog.math.Coordinate.difference = function (a, b) {
        return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
    };
    goog.math.Coordinate.sum = function (a, b) {
        return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
    };
    goog.provide("goog.math.Box");
    goog.require("goog.math.Coordinate");
    goog.math.Box = function (top, right, bottom, left) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left
    };
    goog.math.Box.boundingBox = function (var_args) {
        var box = new goog.math.Box(arguments[0].y, arguments[0].x, arguments[0].y, arguments[0].x);
        for (var i = 1; i < arguments.length; i++) {
            var coord = arguments[i];
            box.top = Math.min(box.top, coord.y);
            box.right = Math.max(box.right, coord.x);
            box.bottom = Math.max(box.bottom, coord.y);
            box.left = Math.min(box.left, coord.x)
        }
        return box
    };
    goog.math.Box.prototype.clone = function () {
        return new goog.math.Box(this.top, this.right, this.bottom, this.left)
    };
    if (goog.DEBUG) goog.math.Box.prototype.toString = function () {
        return "(" + this.top + "t, " + this.right + "r, " + this.bottom + "b, " + this.left + "l)"
    };
    goog.math.Box.prototype.contains = function (other) {
        return goog.math.Box.contains(this, other)
    };
    goog.math.Box.prototype.expand = function (top, opt_right, opt_bottom, opt_left) {
        if (goog.isObject(top)) {
            this.top -= top.top;
            this.right += top.right;
            this.bottom += top.bottom;
            this.left -= top.left
        }
        else {
            this.top -= top;
            this.right += opt_right;
            this.bottom += opt_bottom;
            this.left -= opt_left
        }
        return this
    };
    goog.math.Box.prototype.expandToInclude = function (box) {
        this.left = Math.min(this.left, box.left);
        this.top = Math.min(this.top, box.top);
        this.right = Math.max(this.right, box.right);
        this.bottom = Math.max(this.bottom, box.bottom)
    };
    goog.math.Box.equals = function (a, b) {
        if (a == b) return true;
        if (!a || !b) return false;
        return a.top == b.top && a.right == b.right && a.bottom == b.bottom && a.left == b.left
    };
    goog.math.Box.contains = function (box, other) {
        if (!box || !other) return false;
        if (other instanceof goog.math.Box) return other.left >= box.left && other.right <= box.right && other.top >= box.top && other.bottom <= box.bottom;
        return other.x >= box.left && other.x <= box.right && other.y >= box.top && other.y <= box.bottom
    };
    goog.math.Box.relativePositionX = function (box, coord) {
        if (coord.x < box.left) return coord.x - box.left;
        else if (coord.x > box.right) return coord.x - box.right;
        return 0
    };
    goog.math.Box.relativePositionY = function (box, coord) {
        if (coord.y < box.top) return coord.y - box.top;
        else if (coord.y > box.bottom) return coord.y - box.bottom;
        return 0
    };
    goog.math.Box.distance = function (box, coord) {
        var x = goog.math.Box.relativePositionX(box, coord);
        var y = goog.math.Box.relativePositionY(box, coord);
        return Math.sqrt(x * x + y * y)
    };
    goog.math.Box.intersects = function (a, b) {
        return a.left <= b.right && b.left <= a.right && a.top <= b.bottom && b.top <= a.bottom
    };
    goog.math.Box.intersectsWithPadding = function (a, b, padding) {
        return a.left <= b.right + padding && b.left <= a.right + padding && a.top <= b.bottom + padding && b.top <= a.bottom + padding
    };
    goog.provide("sb.Box");
    goog.require("goog.math.Box");
    sb.Box = function (opt_x, opt_y, opt_width, opt_height) {
        this.x = goog.isDef(opt_x) ? opt_x : 0;
        this.y = goog.isDef(opt_y) ? opt_y : 0;
        this.width = goog.isDef(opt_width) ? opt_width : 0;
        this.height = goog.isDef(opt_height) ? opt_height : 0
    };
    sb.Box.prototype.contains = function (anotherBox) {
        return anotherBox.x >= this.x && anotherBox.y >= this.y && this.x + this.width >= anotherBox.x + anotherBox.width && this.y + this.height >= anotherBox.y + anotherBox.height
    };
    goog.provide("goog.userAgent");
    goog.require("goog.string");
    goog.userAgent.ASSUME_IE = false;
    goog.userAgent.ASSUME_GECKO = false;
    goog.userAgent.ASSUME_WEBKIT = false;
    goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
    goog.userAgent.ASSUME_OPERA = false;
    goog.userAgent.ASSUME_ANY_VERSION = false;
    goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
    goog.userAgent.getUserAgentString = function () {
        return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
    };
    goog.userAgent.getNavigator = function () {
        return goog.global["navigator"]
    };
    goog.userAgent.init_ = function () {
        goog.userAgent.detectedOpera_ = false;
        goog.userAgent.detectedIe_ = false;
        goog.userAgent.detectedWebkit_ = false;
        goog.userAgent.detectedMobile_ = false;
        goog.userAgent.detectedGecko_ = false;
        var ua;
        if (!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
            var navigator = goog.userAgent.getNavigator();
            goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
            goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
            goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
            goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
            goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
        }
    };
    if (!goog.userAgent.BROWSER_KNOWN_) goog.userAgent.init_();
    goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
    goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
    goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
    goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
    goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
    goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
    goog.userAgent.determinePlatform_ = function () {
        var navigator = goog.userAgent.getNavigator();
        return navigator && navigator.platform || ""
    };
    goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
    goog.userAgent.ASSUME_MAC = false;
    goog.userAgent.ASSUME_WINDOWS = false;
    goog.userAgent.ASSUME_LINUX = false;
    goog.userAgent.ASSUME_X11 = false;
    goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
    goog.userAgent.initPlatform_ = function () {
        goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
        goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
        goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
        goog.userAgent.detectedX11_ = !! goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
    };
    if (!goog.userAgent.PLATFORM_KNOWN_) goog.userAgent.initPlatform_();
    goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
    goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
    goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
    goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
    goog.userAgent.determineVersion_ = function () {
        var version = "",
            re;
        if (goog.userAgent.OPERA && goog.global["opera"]) {
            var operaVersion = goog.global["opera"].version;
            version = typeof operaVersion == "function" ? operaVersion() : operaVersion
        }
        else {
            if (goog.userAgent.GECKO) re = /rv\:([^\);]+)(\)|;)/;
            else if (goog.userAgent.IE) re = /MSIE\s+([^\);]+)(\)|;)/;
            else if (goog.userAgent.WEBKIT) re = /WebKit\/(\S+)/;
            if (re) {
                var arr = re.exec(goog.userAgent.getUserAgentString());
                version = arr ? arr[1] : ""
            }
        } if (goog.userAgent.IE) {
            var docMode = goog.userAgent.getDocumentMode_();
            if (docMode > parseFloat(version)) return String(docMode)
        }
        return version
    };
    goog.userAgent.getDocumentMode_ = function () {
        var doc = goog.global["document"];
        return doc ? doc["documentMode"] : undefined
    };
    goog.userAgent.VERSION = goog.userAgent.determineVersion_();
    goog.userAgent.compare = function (v1, v2) {
        return goog.string.compareVersions(v1, v2)
    };
    goog.userAgent.isVersionCache_ = {};
    goog.userAgent.isVersion = function (version) {
        return goog.userAgent.ASSUME_ANY_VERSION || goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
    };
    goog.userAgent.isDocumentModeCache_ = {};
    goog.userAgent.isDocumentMode = function (documentMode) {
        return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && !! document.documentMode && document.documentMode >= documentMode)
    };
    goog.provide("goog.dom.BrowserFeature");
    goog.require("goog.userAgent");
    goog.dom.BrowserFeature = {
        CAN_ADD_NAME_OR_TYPE_ATTRIBUTES: !goog.userAgent.IE || goog.userAgent.isDocumentMode(9),
        CAN_USE_CHILDREN_ATTRIBUTE: !goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"),
        CAN_USE_INNER_TEXT: goog.userAgent.IE && !goog.userAgent.isVersion("9"),
        CAN_USE_PARENT_ELEMENT_PROPERTY: goog.userAgent.IE || goog.userAgent.OPERA || goog.userAgent.WEBKIT,
        INNER_HTML_NEEDS_SCOPED_ELEMENT: goog.userAgent.IE
    };
    goog.provide("goog.dom.TagName");
    goog.dom.TagName = {
        A: "A",
        ABBR: "ABBR",
        ACRONYM: "ACRONYM",
        ADDRESS: "ADDRESS",
        APPLET: "APPLET",
        AREA: "AREA",
        AUDIO: "AUDIO",
        B: "B",
        BASE: "BASE",
        BASEFONT: "BASEFONT",
        BDO: "BDO",
        BIG: "BIG",
        BLOCKQUOTE: "BLOCKQUOTE",
        BODY: "BODY",
        BR: "BR",
        BUTTON: "BUTTON",
        CANVAS: "CANVAS",
        CAPTION: "CAPTION",
        CENTER: "CENTER",
        CITE: "CITE",
        CODE: "CODE",
        COL: "COL",
        COLGROUP: "COLGROUP",
        DD: "DD",
        DEL: "DEL",
        DFN: "DFN",
        DIR: "DIR",
        DIV: "DIV",
        DL: "DL",
        DT: "DT",
        EM: "EM",
        FIELDSET: "FIELDSET",
        FONT: "FONT",
        FORM: "FORM",
        FRAME: "FRAME",
        FRAMESET: "FRAMESET",
        H1: "H1",
        H2: "H2",
        H3: "H3",
        H4: "H4",
        H5: "H5",
        H6: "H6",
        HEAD: "HEAD",
        HR: "HR",
        HTML: "HTML",
        I: "I",
        IFRAME: "IFRAME",
        IMG: "IMG",
        INPUT: "INPUT",
        INS: "INS",
        ISINDEX: "ISINDEX",
        KBD: "KBD",
        LABEL: "LABEL",
        LEGEND: "LEGEND",
        LI: "LI",
        LINK: "LINK",
        MAP: "MAP",
        MENU: "MENU",
        META: "META",
        NOFRAMES: "NOFRAMES",
        NOSCRIPT: "NOSCRIPT",
        OBJECT: "OBJECT",
        OL: "OL",
        OPTGROUP: "OPTGROUP",
        OPTION: "OPTION",
        P: "P",
        PARAM: "PARAM",
        PRE: "PRE",
        Q: "Q",
        S: "S",
        SAMP: "SAMP",
        SCRIPT: "SCRIPT",
        SELECT: "SELECT",
        SMALL: "SMALL",
        SPAN: "SPAN",
        STRIKE: "STRIKE",
        STRONG: "STRONG",
        STYLE: "STYLE",
        SUB: "SUB",
        SUP: "SUP",
        TABLE: "TABLE",
        TBODY: "TBODY",
        TD: "TD",
        TEXTAREA: "TEXTAREA",
        TFOOT: "TFOOT",
        TH: "TH",
        THEAD: "THEAD",
        TITLE: "TITLE",
        TR: "TR",
        TT: "TT",
        U: "U",
        UL: "UL",
        VAR: "VAR",
        VIDEO: "VIDEO"
    };
    goog.provide("goog.dom.classes");
    goog.require("goog.array");
    goog.dom.classes.set = function (element, className) {
        element.className = className
    };
    goog.dom.classes.get = function (element) {
        var className = element.className;
        return goog.isString(className) && className.match(/\S+/g) || []
    };
    goog.dom.classes.add = function (element, var_args) {
        var classes = goog.dom.classes.get(element);
        var args = goog.array.slice(arguments, 1);
        var expectedCount = classes.length + args.length;
        goog.dom.classes.add_(classes, args);
        element.className = classes.join(" ");
        return classes.length == expectedCount
    };
    goog.dom.classes.remove = function (element, var_args) {
        var classes = goog.dom.classes.get(element);
        var args = goog.array.slice(arguments, 1);
        var newClasses = goog.dom.classes.getDifference_(classes, args);
        element.className = newClasses.join(" ");
        return newClasses.length == classes.length - args.length
    };
    goog.dom.classes.add_ = function (classes, args) {
        for (var i = 0; i < args.length; i++)
            if (!goog.array.contains(classes, args[i])) classes.push(args[i])
    };
    goog.dom.classes.getDifference_ = function (arr1, arr2) {
        return goog.array.filter(arr1, function (item) {
            return !goog.array.contains(arr2, item)
        })
    };
    goog.dom.classes.swap = function (element, fromClass, toClass) {
        var classes = goog.dom.classes.get(element);
        var removed = false;
        for (var i = 0; i < classes.length; i++)
            if (classes[i] == fromClass) {
                goog.array.splice(classes, i--, 1);
                removed = true
            }
        if (removed) {
            classes.push(toClass);
            element.className = classes.join(" ")
        }
        return removed
    };
    goog.dom.classes.addRemove = function (element, classesToRemove, classesToAdd) {
        var classes = goog.dom.classes.get(element);
        if (goog.isString(classesToRemove)) goog.array.remove(classes, classesToRemove);
        else if (goog.isArray(classesToRemove)) classes = goog.dom.classes.getDifference_(classes, classesToRemove);
        if (goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) classes.push(classesToAdd);
        else if (goog.isArray(classesToAdd)) goog.dom.classes.add_(classes, classesToAdd);
        element.className = classes.join(" ")
    };
    goog.dom.classes.has = function (element, className) {
        return goog.array.contains(goog.dom.classes.get(element), className)
    };
    goog.dom.classes.enable = function (element, className, enabled) {
        if (enabled) goog.dom.classes.add(element, className);
        else goog.dom.classes.remove(element, className)
    };
    goog.dom.classes.toggle = function (element, className) {
        var add = !goog.dom.classes.has(element, className);
        goog.dom.classes.enable(element, className, add);
        return add
    };
    goog.provide("goog.math.Size");
    goog.math.Size = function (width, height) {
        this.width = width;
        this.height = height
    };
    goog.math.Size.equals = function (a, b) {
        if (a == b) return true;
        if (!a || !b) return false;
        return a.width == b.width && a.height == b.height
    };
    goog.math.Size.prototype.clone = function () {
        return new goog.math.Size(this.width, this.height)
    };
    if (goog.DEBUG) goog.math.Size.prototype.toString = function () {
        return "(" + this.width + " x " + this.height + ")"
    };
    goog.math.Size.prototype.getLongest = function () {
        return Math.max(this.width, this.height)
    };
    goog.math.Size.prototype.getShortest = function () {
        return Math.min(this.width, this.height)
    };
    goog.math.Size.prototype.area = function () {
        return this.width * this.height
    };
    goog.math.Size.prototype.perimeter = function () {
        return (this.width + this.height) * 2
    };
    goog.math.Size.prototype.aspectRatio = function () {
        return this.width / this.height
    };
    goog.math.Size.prototype.isEmpty = function () {
        return !this.area()
    };
    goog.math.Size.prototype.ceil = function () {
        this.width = Math.ceil(this.width);
        this.height = Math.ceil(this.height);
        return this
    };
    goog.math.Size.prototype.fitsInside = function (target) {
        return this.width <= target.width && this.height <= target.height
    };
    goog.math.Size.prototype.floor = function () {
        this.width = Math.floor(this.width);
        this.height = Math.floor(this.height);
        return this
    };
    goog.math.Size.prototype.round = function () {
        this.width = Math.round(this.width);
        this.height = Math.round(this.height);
        return this
    };
    goog.math.Size.prototype.scale = function (s) {
        this.width *= s;
        this.height *= s;
        return this
    };
    goog.math.Size.prototype.scaleToFit = function (target) {
        var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
        return this.scale(s)
    };
    goog.provide("goog.dom");
    goog.provide("goog.dom.DomHelper");
    goog.provide("goog.dom.NodeType");
    goog.require("goog.array");
    goog.require("goog.dom.BrowserFeature");
    goog.require("goog.dom.TagName");
    goog.require("goog.dom.classes");
    goog.require("goog.math.Coordinate");
    goog.require("goog.math.Size");
    goog.require("goog.object");
    goog.require("goog.string");
    goog.require("goog.userAgent");
    goog.dom.ASSUME_QUIRKS_MODE = false;
    goog.dom.ASSUME_STANDARDS_MODE = false;
    goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
    goog.dom.NodeType = {
        ELEMENT: 1,
        ATTRIBUTE: 2,
        TEXT: 3,
        CDATA_SECTION: 4,
        ENTITY_REFERENCE: 5,
        ENTITY: 6,
        PROCESSING_INSTRUCTION: 7,
        COMMENT: 8,
        DOCUMENT: 9,
        DOCUMENT_TYPE: 10,
        DOCUMENT_FRAGMENT: 11,
        NOTATION: 12
    };
    goog.dom.getDomHelper = function (opt_element) {
        return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
    };
    goog.dom.defaultDomHelper_;
    goog.dom.getDocument = function () {
        return document
    };
    goog.dom.getElement = function (element) {
        return goog.isString(element) ? document.getElementById(element) : element
    };
    goog.dom.$ = goog.dom.getElement;
    goog.dom.getElementsByTagNameAndClass = function (opt_tag, opt_class, opt_el) {
        return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
    };
    goog.dom.getElementsByClass = function (className, opt_el) {
        var parent = opt_el || document;
        if (goog.dom.canUseQuerySelector_(parent)) return parent.querySelectorAll("." + className);
        else if (parent.getElementsByClassName) return parent.getElementsByClassName(className);
        return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
    };
    goog.dom.getElementByClass = function (className, opt_el) {
        var parent = opt_el || document;
        var retVal = null;
        if (goog.dom.canUseQuerySelector_(parent)) retVal = parent.querySelector("." + className);
        else retVal = goog.dom.getElementsByClass(className, opt_el)[0];
        return retVal || null
    };
    goog.dom.canUseQuerySelector_ = function (parent) {
        return !!(parent.querySelectorAll && parent.querySelector)
    };
    goog.dom.getElementsByTagNameAndClass_ = function (doc, opt_tag, opt_class, opt_el) {
        var parent = opt_el || doc;
        var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
        if (goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
            var query = tagName + (opt_class ? "." + opt_class : "");
            return parent.querySelectorAll(query)
        }
        if (opt_class && parent.getElementsByClassName) {
            var els = parent.getElementsByClassName(opt_class);
            if (tagName) {
                var arrayLike = {};
                var len = 0;
                for (var i = 0, el; el = els[i]; i++)
                    if (tagName == el.nodeName) arrayLike[len++] =
                        el;
                arrayLike.length = len;
                return arrayLike
            }
            else return els
        }
        var els = parent.getElementsByTagName(tagName || "*");
        if (opt_class) {
            var arrayLike = {};
            var len = 0;
            for (var i = 0, el; el = els[i]; i++) {
                var className = el.className;
                if (typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) arrayLike[len++] = el
            }
            arrayLike.length = len;
            return arrayLike
        }
        else return els
    };
    goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
    goog.dom.setProperties = function (element, properties) {
        goog.object.forEach(properties, function (val, key) {
            if (key == "style") element.style.cssText = val;
            else if (key == "class") element.className = val;
            else if (key == "for") element.htmlFor = val;
            else if (key in goog.dom.DIRECT_ATTRIBUTE_MAP_) element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val);
            else if (goog.string.startsWith(key, "aria-")) element.setAttribute(key, val);
            else element[key] = val
        })
    };
    goog.dom.DIRECT_ATTRIBUTE_MAP_ = {
        "cellpadding": "cellPadding",
        "cellspacing": "cellSpacing",
        "colspan": "colSpan",
        "rowspan": "rowSpan",
        "valign": "vAlign",
        "height": "height",
        "width": "width",
        "usemap": "useMap",
        "frameborder": "frameBorder",
        "maxlength": "maxLength",
        "type": "type"
    };
    goog.dom.getViewportSize = function (opt_window) {
        return goog.dom.getViewportSize_(opt_window || window)
    };
    goog.dom.getViewportSize_ = function (win) {
        var doc = win.document;
        var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
        return new goog.math.Size(el.clientWidth, el.clientHeight)
    };
    goog.dom.getDocumentHeight = function () {
        return goog.dom.getDocumentHeight_(window)
    };
    goog.dom.getDocumentHeight_ = function (win) {
        var doc = win.document;
        var height = 0;
        if (doc) {
            var vh = goog.dom.getViewportSize_(win).height;
            var body = doc.body;
            var docEl = doc.documentElement;
            if (goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight;
            else {
                var sh = docEl.scrollHeight;
                var oh = docEl.offsetHeight;
                if (docEl.clientHeight != oh) {
                    sh = body.scrollHeight;
                    oh = body.offsetHeight
                }
                if (sh > vh) height = sh > oh ? sh : oh;
                else height = sh < oh ? sh : oh
            }
        }
        return height
    };
    goog.dom.getPageScroll = function (opt_window) {
        var win = opt_window || goog.global || window;
        return goog.dom.getDomHelper(win.document).getDocumentScroll()
    };
    goog.dom.getDocumentScroll = function () {
        return goog.dom.getDocumentScroll_(document)
    };
    goog.dom.getDocumentScroll_ = function (doc) {
        var el = goog.dom.getDocumentScrollElement_(doc);
        var win = goog.dom.getWindow_(doc);
        return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
    };
    goog.dom.getDocumentScrollElement = function () {
        return goog.dom.getDocumentScrollElement_(document)
    };
    goog.dom.getDocumentScrollElement_ = function (doc) {
        return !goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
    };
    goog.dom.getWindow = function (opt_doc) {
        return opt_doc ? goog.dom.getWindow_(opt_doc) : window
    };
    goog.dom.getWindow_ = function (doc) {
        return doc.parentWindow || doc.defaultView
    };
    goog.dom.createDom = function (tagName, opt_attributes, var_args) {
        return goog.dom.createDom_(document, arguments)
    };
    goog.dom.createDom_ = function (doc, args) {
        var tagName = args[0];
        var attributes = args[1];
        if (!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
            var tagNameArr = ["<", tagName];
            if (attributes.name) tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"');
            if (attributes.type) {
                tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
                var clone = {};
                goog.object.extend(clone, attributes);
                attributes = clone;
                delete attributes.type
            }
            tagNameArr.push(">");
            tagName = tagNameArr.join("")
        }
        var element = doc.createElement(tagName);
        if (attributes)
            if (goog.isString(attributes)) element.className = attributes;
            else if (goog.isArray(attributes)) goog.dom.classes.add.apply(null, [element].concat(attributes));
        else goog.dom.setProperties(element, attributes); if (args.length > 2) goog.dom.append_(doc, element, args, 2);
        return element
    };
    goog.dom.append_ = function (doc, parent, args, startIndex) {
        function childHandler(child) {
            if (child) parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
        }
        for (var i = startIndex; i < args.length; i++) {
            var arg = args[i];
            if (goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.toArray(arg) : arg, childHandler);
            else childHandler(arg)
        }
    };
    goog.dom.$dom = goog.dom.createDom;
    goog.dom.createElement = function (name) {
        return document.createElement(name)
    };
    goog.dom.createTextNode = function (content) {
        return document.createTextNode(content)
    };
    goog.dom.createTable = function (rows, columns, opt_fillWithNbsp) {
        return goog.dom.createTable_(document, rows, columns, !! opt_fillWithNbsp)
    };
    goog.dom.createTable_ = function (doc, rows, columns, fillWithNbsp) {
        var rowHtml = ["<tr>"];
        for (var i = 0; i < columns; i++) rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>");
        rowHtml.push("</tr>");
        rowHtml = rowHtml.join("");
        var totalHtml = ["<table>"];
        for (i = 0; i < rows; i++) totalHtml.push(rowHtml);
        totalHtml.push("</table>");
        var elem = doc.createElement(goog.dom.TagName.DIV);
        elem.innerHTML = totalHtml.join("");
        return elem.removeChild(elem.firstChild)
    };
    goog.dom.htmlToDocumentFragment = function (htmlString) {
        return goog.dom.htmlToDocumentFragment_(document, htmlString)
    };
    goog.dom.htmlToDocumentFragment_ = function (doc, htmlString) {
        var tempDiv = doc.createElement("div");
        if (goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
            tempDiv.innerHTML = "<br>" + htmlString;
            tempDiv.removeChild(tempDiv.firstChild)
        }
        else tempDiv.innerHTML = htmlString; if (tempDiv.childNodes.length == 1) return tempDiv.removeChild(tempDiv.firstChild);
        else {
            var fragment = doc.createDocumentFragment();
            while (tempDiv.firstChild) fragment.appendChild(tempDiv.firstChild);
            return fragment
        }
    };
    goog.dom.getCompatMode = function () {
        return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
    };
    goog.dom.isCss1CompatMode = function () {
        return goog.dom.isCss1CompatMode_(document)
    };
    goog.dom.isCss1CompatMode_ = function (doc) {
        if (goog.dom.COMPAT_MODE_KNOWN_) return goog.dom.ASSUME_STANDARDS_MODE;
        return doc.compatMode == "CSS1Compat"
    };
    goog.dom.canHaveChildren = function (node) {
        if (node.nodeType != goog.dom.NodeType.ELEMENT) return false;
        switch (node.tagName) {
        case goog.dom.TagName.APPLET:
        case goog.dom.TagName.AREA:
        case goog.dom.TagName.BASE:
        case goog.dom.TagName.BR:
        case goog.dom.TagName.COL:
        case goog.dom.TagName.FRAME:
        case goog.dom.TagName.HR:
        case goog.dom.TagName.IMG:
        case goog.dom.TagName.INPUT:
        case goog.dom.TagName.IFRAME:
        case goog.dom.TagName.ISINDEX:
        case goog.dom.TagName.LINK:
        case goog.dom.TagName.NOFRAMES:
        case goog.dom.TagName.NOSCRIPT:
        case goog.dom.TagName.META:
        case goog.dom.TagName.OBJECT:
        case goog.dom.TagName.PARAM:
        case goog.dom.TagName.SCRIPT:
        case goog.dom.TagName.STYLE:
            return false
        }
        return true
    };
    goog.dom.appendChild = function (parent, child) {
        parent.appendChild(child)
    };
    goog.dom.append = function (parent, var_args) {
        goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
    };
    goog.dom.removeChildren = function (node) {
        var child;
        while (child = node.firstChild) node.removeChild(child)
    };
    goog.dom.insertSiblingBefore = function (newNode, refNode) {
        if (refNode.parentNode) refNode.parentNode.insertBefore(newNode, refNode)
    };
    goog.dom.insertSiblingAfter = function (newNode, refNode) {
        if (refNode.parentNode) refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
    };
    goog.dom.insertChildAt = function (parent, child, index) {
        parent.insertBefore(child, parent.childNodes[index] || null)
    };
    goog.dom.removeNode = function (node) {
        return node && node.parentNode ? node.parentNode.removeChild(node) : null
    };
    goog.dom.replaceNode = function (newNode, oldNode) {
        var parent = oldNode.parentNode;
        if (parent) parent.replaceChild(newNode, oldNode)
    };
    goog.dom.flattenElement = function (element) {
        var child, parent = element.parentNode;
        if (parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT)
            if (element.removeNode) return element.removeNode(false);
            else {
                while (child = element.firstChild) parent.insertBefore(child, element);
                return goog.dom.removeNode(element)
            }
    };
    goog.dom.getChildren = function (element) {
        if (goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) return element.children;
        return goog.array.filter(element.childNodes, function (node) {
            return node.nodeType == goog.dom.NodeType.ELEMENT
        })
    };
    goog.dom.getFirstElementChild = function (node) {
        if (node.firstElementChild != undefined) return node.firstElementChild;
        return goog.dom.getNextElementNode_(node.firstChild, true)
    };
    goog.dom.getLastElementChild = function (node) {
        if (node.lastElementChild != undefined) return node.lastElementChild;
        return goog.dom.getNextElementNode_(node.lastChild, false)
    };
    goog.dom.getNextElementSibling = function (node) {
        if (node.nextElementSibling != undefined) return node.nextElementSibling;
        return goog.dom.getNextElementNode_(node.nextSibling, true)
    };
    goog.dom.getPreviousElementSibling = function (node) {
        if (node.previousElementSibling != undefined) return node.previousElementSibling;
        return goog.dom.getNextElementNode_(node.previousSibling, false)
    };
    goog.dom.getNextElementNode_ = function (node, forward) {
        while (node && node.nodeType != goog.dom.NodeType.ELEMENT) node = forward ? node.nextSibling : node.previousSibling;
        return node
    };
    goog.dom.getNextNode = function (node) {
        if (!node) return null;
        if (node.firstChild) return node.firstChild;
        while (node && !node.nextSibling) node = node.parentNode;
        return node ? node.nextSibling : null
    };
    goog.dom.getPreviousNode = function (node) {
        if (!node) return null;
        if (!node.previousSibling) return node.parentNode;
        node = node.previousSibling;
        while (node && node.lastChild) node = node.lastChild;
        return node
    };
    goog.dom.isNodeLike = function (obj) {
        return goog.isObject(obj) && obj.nodeType > 0
    };
    goog.dom.isElement = function (obj) {
        return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
    };
    goog.dom.isWindow = function (obj) {
        return goog.isObject(obj) && obj["window"] == obj
    };
    goog.dom.getParentElement = function (element) {
        if (goog.dom.BrowserFeature.CAN_USE_PARENT_ELEMENT_PROPERTY) return element.parentElement;
        var parent = element.parentNode;
        return goog.dom.isElement(parent) ? parent : null
    };
    goog.dom.contains = function (parent, descendant) {
        if (parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) return parent == descendant || parent.contains(descendant);
        if (typeof parent.compareDocumentPosition != "undefined") return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16);
        while (descendant && parent != descendant) descendant = descendant.parentNode;
        return descendant == parent
    };
    goog.dom.compareNodeOrder = function (node1, node2) {
        if (node1 == node2) return 0;
        if (node1.compareDocumentPosition) return node1.compareDocumentPosition(node2) & 2 ? 1 : -1;
        if ("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
            var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
            var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
            if (isElement1 && isElement2) return node1.sourceIndex - node2.sourceIndex;
            else {
                var parent1 = node1.parentNode;
                var parent2 = node2.parentNode;
                if (parent1 == parent2) return goog.dom.compareSiblingOrder_(node1,
                    node2);
                if (!isElement1 && goog.dom.contains(parent1, node2)) return -1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2);
                if (!isElement2 && goog.dom.contains(parent2, node1)) return goog.dom.compareParentsDescendantNodeIe_(node2, node1);
                return (isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
            }
        }
        var doc = goog.dom.getOwnerDocument(node1);
        var range1, range2;
        range1 = doc.createRange();
        range1.selectNode(node1);
        range1.collapse(true);
        range2 = doc.createRange();
        range2.selectNode(node2);
        range2.collapse(true);
        return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
    };
    goog.dom.compareParentsDescendantNodeIe_ = function (textNode, node) {
        var parent = textNode.parentNode;
        if (parent == node) return -1;
        var sibling = node;
        while (sibling.parentNode != parent) sibling = sibling.parentNode;
        return goog.dom.compareSiblingOrder_(sibling, textNode)
    };
    goog.dom.compareSiblingOrder_ = function (node1, node2) {
        var s = node2;
        while (s = s.previousSibling)
            if (s == node1) return -1;
        return 1
    };
    goog.dom.findCommonAncestor = function (var_args) {
        var i, count = arguments.length;
        if (!count) return null;
        else if (count == 1) return arguments[0];
        var paths = [];
        var minLength = Infinity;
        for (i = 0; i < count; i++) {
            var ancestors = [];
            var node = arguments[i];
            while (node) {
                ancestors.unshift(node);
                node = node.parentNode
            }
            paths.push(ancestors);
            minLength = Math.min(minLength, ancestors.length)
        }
        var output = null;
        for (i = 0; i < minLength; i++) {
            var first = paths[0][i];
            for (var j = 1; j < count; j++)
                if (first != paths[j][i]) return output;
            output = first
        }
        return output
    };
    goog.dom.getOwnerDocument = function (node) {
        return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
    };
    goog.dom.getFrameContentDocument = function (frame) {
        var doc = frame.contentDocument || frame.contentWindow.document;
        return doc
    };
    goog.dom.getFrameContentWindow = function (frame) {
        return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
    };
    goog.dom.setTextContent = function (element, text) {
        if ("textContent" in element) element.textContent = text;
        else if (element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
            while (element.lastChild != element.firstChild) element.removeChild(element.lastChild);
            element.firstChild.data = text
        }
        else {
            goog.dom.removeChildren(element);
            var doc = goog.dom.getOwnerDocument(element);
            element.appendChild(doc.createTextNode(text))
        }
    };
    goog.dom.getOuterHtml = function (element) {
        if ("outerHTML" in element) return element.outerHTML;
        else {
            var doc = goog.dom.getOwnerDocument(element);
            var div = doc.createElement("div");
            div.appendChild(element.cloneNode(true));
            return div.innerHTML
        }
    };
    goog.dom.findNode = function (root, p) {
        var rv = [];
        var found = goog.dom.findNodes_(root, p, rv, true);
        return found ? rv[0] : undefined
    };
    goog.dom.findNodes = function (root, p) {
        var rv = [];
        goog.dom.findNodes_(root, p, rv, false);
        return rv
    };
    goog.dom.findNodes_ = function (root, p, rv, findOne) {
        if (root != null) {
            var child = root.firstChild;
            while (child) {
                if (p(child)) {
                    rv.push(child);
                    if (findOne) return true
                }
                if (goog.dom.findNodes_(child, p, rv, findOne)) return true;
                child = child.nextSibling
            }
        }
        return false
    };
    goog.dom.TAGS_TO_IGNORE_ = {
        "SCRIPT": 1,
        "STYLE": 1,
        "HEAD": 1,
        "IFRAME": 1,
        "OBJECT": 1
    };
    goog.dom.PREDEFINED_TAG_VALUES_ = {
        "IMG": " ",
        "BR": "\n"
    };
    goog.dom.isFocusableTabIndex = function (element) {
        var attrNode = element.getAttributeNode("tabindex");
        if (attrNode && attrNode.specified) {
            var index = element.tabIndex;
            return goog.isNumber(index) && index >= 0 && index < 32768
        }
        return false
    };
    goog.dom.setFocusableTabIndex = function (element, enable) {
        if (enable) element.tabIndex = 0;
        else {
            element.tabIndex = -1;
            element.removeAttribute("tabIndex")
        }
    };
    goog.dom.getTextContent = function (node) {
        var textContent;
        if (goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) textContent = goog.string.canonicalizeNewlines(node.innerText);
        else {
            var buf = [];
            goog.dom.getTextContent_(node, buf, true);
            textContent = buf.join("")
        }
        textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
        textContent = textContent.replace(/\u200B/g, "");
        if (!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) textContent = textContent.replace(/ +/g, " ");
        if (textContent != " ") textContent = textContent.replace(/^\s*/,
            "");
        return textContent
    };
    goog.dom.getRawTextContent = function (node) {
        var buf = [];
        goog.dom.getTextContent_(node, buf, false);
        return buf.join("")
    };
    goog.dom.getTextContent_ = function (node, buf, normalizeWhitespace) {
        if (node.nodeName in goog.dom.TAGS_TO_IGNORE_);
        else if (node.nodeType == goog.dom.NodeType.TEXT)
            if (normalizeWhitespace) buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""));
            else buf.push(node.nodeValue);
            else if (node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName]);
        else {
            var child = node.firstChild;
            while (child) {
                goog.dom.getTextContent_(child, buf, normalizeWhitespace);
                child = child.nextSibling
            }
        }
    };
    goog.dom.getNodeTextLength = function (node) {
        return goog.dom.getTextContent(node).length
    };
    goog.dom.getNodeTextOffset = function (node, opt_offsetParent) {
        var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
        var buf = [];
        while (node && node != root) {
            var cur = node;
            while (cur = cur.previousSibling) buf.unshift(goog.dom.getTextContent(cur));
            node = node.parentNode
        }
        return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
    };
    goog.dom.getNodeAtOffset = function (parent, offset, opt_result) {
        var stack = [parent],
            pos = 0,
            cur;
        while (stack.length > 0 && pos < offset) {
            cur = stack.pop();
            if (cur.nodeName in goog.dom.TAGS_TO_IGNORE_);
            else if (cur.nodeType == goog.dom.NodeType.TEXT) {
                var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
                pos += text.length
            }
            else if (cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length;
            else
                for (var i = cur.childNodes.length - 1; i >= 0; i--) stack.push(cur.childNodes[i])
        }
        if (goog.isObject(opt_result)) {
            opt_result.remainder =
                cur ? cur.nodeValue.length + offset - pos - 1 : 0;
            opt_result.node = cur
        }
        return cur
    };
    goog.dom.isNodeList = function (val) {
        if (val && typeof val.length == "number")
            if (goog.isObject(val)) return typeof val.item == "function" || typeof val.item == "string";
            else if (goog.isFunction(val)) return typeof val.item == "function";
        return false
    };
    goog.dom.getAncestorByTagNameAndClass = function (element, opt_tag, opt_class) {
        if (!opt_tag && !opt_class) return null;
        var tagName = opt_tag ? opt_tag.toUpperCase() : null;
        return goog.dom.getAncestor(element, function (node) {
            return (!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
        }, true)
    };
    goog.dom.getAncestorByClass = function (element, className) {
        return goog.dom.getAncestorByTagNameAndClass(element, null, className)
    };
    goog.dom.getAncestor = function (element, matcher, opt_includeNode, opt_maxSearchSteps) {
        if (!opt_includeNode) element = element.parentNode;
        var ignoreSearchSteps = opt_maxSearchSteps == null;
        var steps = 0;
        while (element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
            if (matcher(element)) return element;
            element = element.parentNode;
            steps++
        }
        return null
    };
    goog.dom.getActiveElement = function (doc) {
        try {
            return doc && doc.activeElement
        }
        catch (e) {}
        return null
    };
    goog.dom.DomHelper = function (opt_document) {
        this.document_ = opt_document || goog.global.document || document
    };
    goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
    goog.dom.DomHelper.prototype.setDocument = function (document) {
        this.document_ = document
    };
    goog.dom.DomHelper.prototype.getDocument = function () {
        return this.document_
    };
    goog.dom.DomHelper.prototype.getElement = function (element) {
        if (goog.isString(element)) return this.document_.getElementById(element);
        else return element
    };
    goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
    goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function (opt_tag, opt_class, opt_el) {
        return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
    };
    goog.dom.DomHelper.prototype.getElementsByClass = function (className, opt_el) {
        var doc = opt_el || this.document_;
        return goog.dom.getElementsByClass(className, doc)
    };
    goog.dom.DomHelper.prototype.getElementByClass = function (className, opt_el) {
        var doc = opt_el || this.document_;
        return goog.dom.getElementByClass(className, doc)
    };
    goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
    goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
    goog.dom.DomHelper.prototype.getViewportSize = function (opt_window) {
        return goog.dom.getViewportSize(opt_window || this.getWindow())
    };
    goog.dom.DomHelper.prototype.getDocumentHeight = function () {
        return goog.dom.getDocumentHeight_(this.getWindow())
    };
    goog.dom.Appendable;
    goog.dom.DomHelper.prototype.createDom = function (tagName, opt_attributes, var_args) {
        return goog.dom.createDom_(this.document_, arguments)
    };
    goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
    goog.dom.DomHelper.prototype.createElement = function (name) {
        return this.document_.createElement(name)
    };
    goog.dom.DomHelper.prototype.createTextNode = function (content) {
        return this.document_.createTextNode(content)
    };
    goog.dom.DomHelper.prototype.createTable = function (rows, columns, opt_fillWithNbsp) {
        return goog.dom.createTable_(this.document_, rows, columns, !! opt_fillWithNbsp)
    };
    goog.dom.DomHelper.prototype.htmlToDocumentFragment = function (htmlString) {
        return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
    };
    goog.dom.DomHelper.prototype.getCompatMode = function () {
        return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
    };
    goog.dom.DomHelper.prototype.isCss1CompatMode = function () {
        return goog.dom.isCss1CompatMode_(this.document_)
    };
    goog.dom.DomHelper.prototype.getWindow = function () {
        return goog.dom.getWindow_(this.document_)
    };
    goog.dom.DomHelper.prototype.getDocumentScrollElement = function () {
        return goog.dom.getDocumentScrollElement_(this.document_)
    };
    goog.dom.DomHelper.prototype.getDocumentScroll = function () {
        return goog.dom.getDocumentScroll_(this.document_)
    };
    goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
    goog.dom.DomHelper.prototype.append = goog.dom.append;
    goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
    goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
    goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
    goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
    goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
    goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
    goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
    goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
    goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
    goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
    goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
    goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
    goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
    goog.dom.DomHelper.prototype.contains = goog.dom.contains;
    goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
    goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
    goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
    goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
    goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
    goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
    goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
    goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
    goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
    goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
    goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
    goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
    goog.provide("goog.dom.xml");
    goog.require("goog.dom");
    goog.require("goog.dom.NodeType");
    goog.dom.xml.MAX_XML_SIZE_KB = 2 * 1024;
    goog.dom.xml.MAX_ELEMENT_DEPTH = 256;
    goog.dom.xml.createDocument = function (opt_rootTagName, opt_namespaceUri) {
        if (opt_namespaceUri && !opt_rootTagName) throw Error("Can't create document with namespace and no root tag");
        if (document.implementation && document.implementation.createDocument) return document.implementation.createDocument(opt_namespaceUri || "", opt_rootTagName || "", null);
        else if (typeof ActiveXObject != "undefined") {
            var doc = goog.dom.xml.createMsXmlDocument_();
            if (doc) {
                if (opt_rootTagName) doc.appendChild(doc.createNode(goog.dom.NodeType.ELEMENT,
                    opt_rootTagName, opt_namespaceUri || ""));
                return doc
            }
        }
        throw Error("Your browser does not support creating new documents");
    };
    goog.dom.xml.loadXml = function (xml) {
        if (typeof DOMParser != "undefined") return (new DOMParser).parseFromString(xml, "application/xml");
        else if (typeof ActiveXObject != "undefined") {
            var doc = goog.dom.xml.createMsXmlDocument_();
            doc.loadXML(xml);
            return doc
        }
        throw Error("Your browser does not support loading xml documents");
    };
    goog.dom.xml.serialize = function (xml) {
        if (typeof XMLSerializer != "undefined") return (new XMLSerializer).serializeToString(xml);
        var text = xml.xml;
        if (text) return text;
        throw Error("Your browser does not support serializing XML documents");
    };
    goog.dom.xml.selectSingleNode = function (node, path) {
        if (typeof node.selectSingleNode != "undefined") {
            var doc = goog.dom.getOwnerDocument(node);
            if (typeof doc.setProperty != "undefined") doc.setProperty("SelectionLanguage", "XPath");
            return node.selectSingleNode(path)
        }
        else if (document.implementation.hasFeature("XPath", "3.0")) {
            var doc = goog.dom.getOwnerDocument(node);
            var resolver = doc.createNSResolver(doc.documentElement);
            var result = doc.evaluate(path, node, resolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            return result.singleNodeValue
        }
        return null
    };
    goog.dom.xml.selectNodes = function (node, path) {
        if (typeof node.selectNodes != "undefined") {
            var doc = goog.dom.getOwnerDocument(node);
            if (typeof doc.setProperty != "undefined") doc.setProperty("SelectionLanguage", "XPath");
            return node.selectNodes(path)
        }
        else if (document.implementation.hasFeature("XPath", "3.0")) {
            var doc = goog.dom.getOwnerDocument(node);
            var resolver = doc.createNSResolver(doc.documentElement);
            var nodes = doc.evaluate(path, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            var results = [];
            var count =
                nodes.snapshotLength;
            for (var i = 0; i < count; i++) results.push(nodes.snapshotItem(i));
            return results
        }
        else return []
    };
    goog.dom.xml.setAttributes = function (element, attributes) {
        for (var key in attributes)
            if (attributes.hasOwnProperty(key)) element.setAttribute(key, attributes[key])
    };
    goog.dom.xml.createMsXmlDocument_ = function () {
        var doc = new ActiveXObject("MSXML2.DOMDocument");
        if (doc) {
            doc.resolveExternals = false;
            doc.validateOnParse = false;
            try {
                doc.setProperty("ProhibitDTD", true);
                doc.setProperty("MaxXMLSize", goog.dom.xml.MAX_XML_SIZE_KB);
                doc.setProperty("MaxElementDepth", goog.dom.xml.MAX_ELEMENT_DEPTH)
            }
            catch (e) {}
        }
        return doc
    };
    goog.provide("goog.structs.Collection");
    goog.structs.Collection = function () {};
    goog.structs.Collection.prototype.add;
    goog.structs.Collection.prototype.remove;
    goog.structs.Collection.prototype.contains;
    goog.structs.Collection.prototype.getCount;
    goog.provide("goog.structs.Set");
    goog.require("goog.structs");
    goog.require("goog.structs.Collection");
    goog.require("goog.structs.Map");
    goog.structs.Set = function (opt_values) {
        this.map_ = new goog.structs.Map;
        if (opt_values) this.addAll(opt_values)
    };
    goog.structs.Set.getKey_ = function (val) {
        var type = typeof val;
        if (type == "object" && val || type == "function") return "o" + goog.getUid(val);
        else return type.substr(0, 1) + val
    };
    goog.structs.Set.prototype.getCount = function () {
        return this.map_.getCount()
    };
    goog.structs.Set.prototype.add = function (element) {
        this.map_.set(goog.structs.Set.getKey_(element), element)
    };
    goog.structs.Set.prototype.addAll = function (col) {
        var values = goog.structs.getValues(col);
        var l = values.length;
        for (var i = 0; i < l; i++) this.add(values[i])
    };
    goog.structs.Set.prototype.removeAll = function (col) {
        var values = goog.structs.getValues(col);
        var l = values.length;
        for (var i = 0; i < l; i++) this.remove(values[i])
    };
    goog.structs.Set.prototype.remove = function (element) {
        return this.map_.remove(goog.structs.Set.getKey_(element))
    };
    goog.structs.Set.prototype.clear = function () {
        this.map_.clear()
    };
    goog.structs.Set.prototype.isEmpty = function () {
        return this.map_.isEmpty()
    };
    goog.structs.Set.prototype.contains = function (element) {
        return this.map_.containsKey(goog.structs.Set.getKey_(element))
    };
    goog.structs.Set.prototype.containsAll = function (col) {
        return goog.structs.every(col, this.contains, this)
    };
    goog.structs.Set.prototype.intersection = function (col) {
        var result = new goog.structs.Set;
        var values = goog.structs.getValues(col);
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            if (this.contains(value)) result.add(value)
        }
        return result
    };
    goog.structs.Set.prototype.difference = function (col) {
        var result = this.clone();
        result.removeAll(col);
        return result
    };
    goog.structs.Set.prototype.getValues = function () {
        return this.map_.getValues()
    };
    goog.structs.Set.prototype.clone = function () {
        return new goog.structs.Set(this)
    };
    goog.structs.Set.prototype.equals = function (col) {
        return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
    };
    goog.structs.Set.prototype.isSubsetOf = function (col) {
        var colCount = goog.structs.getCount(col);
        if (this.getCount() > colCount) return false;
        if (!(col instanceof goog.structs.Set) && colCount > 5) col = new goog.structs.Set(col);
        return goog.structs.every(this, function (value) {
            return goog.structs.contains(col, value)
        })
    };
    goog.structs.Set.prototype.__iterator__ = function (opt_keys) {
        return this.map_.__iterator__(false)
    };
    goog.provide("goog.debug");
    goog.require("goog.array");
    goog.require("goog.string");
    goog.require("goog.structs.Set");
    goog.require("goog.userAgent");
    goog.debug.catchErrors = function (logFunc, opt_cancel, opt_target) {
        var target = opt_target || goog.global;
        var oldErrorHandler = target.onerror;
        var retVal = !! opt_cancel;
        if (goog.userAgent.WEBKIT && !goog.userAgent.isVersion("535.3")) retVal = !retVal;
        target.onerror = function (message, url, line) {
            if (oldErrorHandler) oldErrorHandler(message, url, line);
            logFunc({
                message: message,
                fileName: url,
                line: line
            });
            return retVal
        }
    };
    goog.debug.expose = function (obj, opt_showFn) {
        if (typeof obj == "undefined") return "undefined";
        if (obj == null) return "NULL";
        var str = [];
        for (var x in obj) {
            if (!opt_showFn && goog.isFunction(obj[x])) continue;
            var s = x + " = ";
            try {
                s += obj[x]
            }
            catch (e) {
                s += "*** " + e + " ***"
            }
            str.push(s)
        }
        return str.join("\n")
    };
    goog.debug.deepExpose = function (obj, opt_showFn) {
        var previous = new goog.structs.Set;
        var str = [];
        var helper = function (obj, space) {
            var nestspace = space + "  ";
            var indentMultiline = function (str) {
                return str.replace(/\n/g, "\n" + space)
            };
            try {
                if (!goog.isDef(obj)) str.push("undefined");
                else if (goog.isNull(obj)) str.push("NULL");
                else if (goog.isString(obj)) str.push('"' + indentMultiline(obj) + '"');
                else if (goog.isFunction(obj)) str.push(indentMultiline(String(obj)));
                else if (goog.isObject(obj))
                    if (previous.contains(obj)) str.push("*** reference loop detected ***");
                    else {
                        previous.add(obj);
                        str.push("{");
                        for (var x in obj) {
                            if (!opt_showFn && goog.isFunction(obj[x])) continue;
                            str.push("\n");
                            str.push(nestspace);
                            str.push(x + " = ");
                            helper(obj[x], nestspace)
                        }
                        str.push("\n" + space + "}")
                    }
                    else str.push(obj)
            }
            catch (e) {
                str.push("*** " + e + " ***")
            }
        };
        helper(obj, "");
        return str.join("")
    };
    goog.debug.exposeArray = function (arr) {
        var str = [];
        for (var i = 0; i < arr.length; i++)
            if (goog.isArray(arr[i])) str.push(goog.debug.exposeArray(arr[i]));
            else str.push(arr[i]);
        return "[ " + str.join(", ") + " ]"
    };
    goog.debug.exposeException = function (err, opt_fn) {
        try {
            var e = goog.debug.normalizeErrorObject(err);
            var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
            return error
        }
        catch (e2) {
            return "Exception trying to expose exception! You win, we lose. " + e2
        }
    };
    goog.debug.normalizeErrorObject = function (err) {
        var href = goog.getObjectByName("window.location.href");
        if (goog.isString(err)) return {
            "message": err,
            "name": "Unknown error",
            "lineNumber": "Not available",
            "fileName": href,
            "stack": "Not available"
        };
        var lineNumber, fileName;
        var threwError = false;
        try {
            lineNumber = err.lineNumber || err.line || "Not available"
        }
        catch (e) {
            lineNumber = "Not available";
            threwError = true
        }
        try {
            fileName = err.fileName || err.filename || err.sourceURL || href
        }
        catch (e) {
            fileName = "Not available";
            threwError = true
        }
        if (threwError || !err.lineNumber || !err.fileName || !err.stack) return {
            "message": err.message,
            "name": err.name,
            "lineNumber": lineNumber,
            "fileName": fileName,
            "stack": err.stack || "Not available"
        };
        return err
    };
    goog.debug.enhanceError = function (err, opt_message) {
        var error = typeof err == "string" ? Error(err) : err;
        if (!error.stack) error.stack = goog.debug.getStacktrace(arguments.callee.caller);
        if (opt_message) {
            var x = 0;
            while (error["message" + x])++x;
            error["message" + x] = String(opt_message)
        }
        return error
    };
    goog.debug.getStacktraceSimple = function (opt_depth) {
        var sb = [];
        var fn = arguments.callee.caller;
        var depth = 0;
        while (fn && (!opt_depth || depth < opt_depth)) {
            sb.push(goog.debug.getFunctionName(fn));
            sb.push("()\n");
            try {
                fn = fn.caller
            }
            catch (e) {
                sb.push("[exception trying to get caller]\n");
                break
            }
            depth++;
            if (depth >= goog.debug.MAX_STACK_DEPTH) {
                sb.push("[...long stack...]");
                break
            }
        }
        if (opt_depth && depth >= opt_depth) sb.push("[...reached max depth limit...]");
        else sb.push("[end]");
        return sb.join("")
    };
    goog.debug.MAX_STACK_DEPTH = 50;
    goog.debug.getStacktrace = function (opt_fn) {
        return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
    };
    goog.debug.getStacktraceHelper_ = function (fn, visited) {
        var sb = [];
        if (goog.array.contains(visited, fn)) sb.push("[...circular reference...]");
        else if (fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
            sb.push(goog.debug.getFunctionName(fn) + "(");
            var args = fn.arguments;
            for (var i = 0; i < args.length; i++) {
                if (i > 0) sb.push(", ");
                var argDesc;
                var arg = args[i];
                switch (typeof arg) {
                case "object":
                    argDesc = arg ? "object" : "null";
                    break;
                case "string":
                    argDesc = arg;
                    break;
                case "number":
                    argDesc = String(arg);
                    break;
                case "boolean":
                    argDesc = arg ?
                        "true" : "false";
                    break;
                case "function":
                    argDesc = goog.debug.getFunctionName(arg);
                    argDesc = argDesc ? argDesc : "[fn]";
                    break;
                case "undefined":
                default:
                    argDesc = typeof arg;
                    break
                }
                if (argDesc.length > 40) argDesc = argDesc.substr(0, 40) + "...";
                sb.push(argDesc)
            }
            visited.push(fn);
            sb.push(")\n");
            try {
                sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
            }
            catch (e) {
                sb.push("[exception trying to get caller]\n")
            }
        }
        else if (fn) sb.push("[...long stack...]");
        else sb.push("[end]");
        return sb.join("")
    };
    goog.debug.setFunctionResolver = function (resolver) {
        goog.debug.fnNameResolver_ = resolver
    };
    goog.debug.getFunctionName = function (fn) {
        if (goog.debug.fnNameCache_[fn]) return goog.debug.fnNameCache_[fn];
        if (goog.debug.fnNameResolver_) {
            var name = goog.debug.fnNameResolver_(fn);
            if (name) {
                goog.debug.fnNameCache_[fn] = name;
                return name
            }
        }
        var functionSource = String(fn);
        if (!goog.debug.fnNameCache_[functionSource]) {
            var matches = /function ([^\(]+)/.exec(functionSource);
            if (matches) {
                var method = matches[1];
                goog.debug.fnNameCache_[functionSource] = method
            }
            else goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
        }
        return goog.debug.fnNameCache_[functionSource]
    };
    goog.debug.makeWhitespaceVisible = function (string) {
        return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
    };
    goog.debug.fnNameCache_ = {};
    goog.debug.fnNameResolver_;
    goog.provide("goog.debug.LogRecord");
    goog.debug.LogRecord = function (level, msg, loggerName, opt_time, opt_sequenceNumber) {
        this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
    };
    goog.debug.LogRecord.prototype.time_;
    goog.debug.LogRecord.prototype.level_;
    goog.debug.LogRecord.prototype.msg_;
    goog.debug.LogRecord.prototype.loggerName_;
    goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
    goog.debug.LogRecord.prototype.exception_ = null;
    goog.debug.LogRecord.prototype.exceptionText_ = null;
    goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
    goog.debug.LogRecord.nextSequenceNumber_ = 0;
    goog.debug.LogRecord.prototype.reset = function (level, msg, loggerName, opt_time, opt_sequenceNumber) {
        if (goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++;
        this.time_ = opt_time || goog.now();
        this.level_ = level;
        this.msg_ = msg;
        this.loggerName_ = loggerName;
        delete this.exception_;
        delete this.exceptionText_
    };
    goog.debug.LogRecord.prototype.getLoggerName = function () {
        return this.loggerName_
    };
    goog.debug.LogRecord.prototype.getException = function () {
        return this.exception_
    };
    goog.debug.LogRecord.prototype.setException = function (exception) {
        this.exception_ = exception
    };
    goog.debug.LogRecord.prototype.getExceptionText = function () {
        return this.exceptionText_
    };
    goog.debug.LogRecord.prototype.setExceptionText = function (text) {
        this.exceptionText_ = text
    };
    goog.debug.LogRecord.prototype.setLoggerName = function (loggerName) {
        this.loggerName_ = loggerName
    };
    goog.debug.LogRecord.prototype.getLevel = function () {
        return this.level_
    };
    goog.debug.LogRecord.prototype.setLevel = function (level) {
        this.level_ = level
    };
    goog.debug.LogRecord.prototype.getMessage = function () {
        return this.msg_
    };
    goog.debug.LogRecord.prototype.setMessage = function (msg) {
        this.msg_ = msg
    };
    goog.debug.LogRecord.prototype.getMillis = function () {
        return this.time_
    };
    goog.debug.LogRecord.prototype.setMillis = function (time) {
        this.time_ = time
    };
    goog.debug.LogRecord.prototype.getSequenceNumber = function () {
        return this.sequenceNumber_
    };
    goog.provide("goog.debug.LogBuffer");
    goog.require("goog.asserts");
    goog.require("goog.debug.LogRecord");
    goog.debug.LogBuffer = function () {
        goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
        this.clear()
    };
    goog.debug.LogBuffer.getInstance = function () {
        if (!goog.debug.LogBuffer.instance_) goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer;
        return goog.debug.LogBuffer.instance_
    };
    goog.debug.LogBuffer.CAPACITY = 0;
    goog.debug.LogBuffer.prototype.buffer_;
    goog.debug.LogBuffer.prototype.curIndex_;
    goog.debug.LogBuffer.prototype.isFull_;
    goog.debug.LogBuffer.prototype.addRecord = function (level, msg, loggerName) {
        var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
        this.curIndex_ = curIndex;
        if (this.isFull_) {
            var ret = this.buffer_[curIndex];
            ret.reset(level, msg, loggerName);
            return ret
        }
        this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
        return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
    };
    goog.debug.LogBuffer.isBufferingEnabled = function () {
        return goog.debug.LogBuffer.CAPACITY > 0
    };
    goog.debug.LogBuffer.prototype.clear = function () {
        this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
        this.curIndex_ = -1;
        this.isFull_ = false
    };
    goog.debug.LogBuffer.prototype.forEachRecord = function (func) {
        var buffer = this.buffer_;
        if (!buffer[0]) return;
        var curIndex = this.curIndex_;
        var i = this.isFull_ ? curIndex : -1;
        do {
            i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
            func(buffer[i])
        } while (i != curIndex)
    };
    goog.provide("goog.debug.LogManager");
    goog.provide("goog.debug.Logger");
    goog.provide("goog.debug.Logger.Level");
    goog.require("goog.array");
    goog.require("goog.asserts");
    goog.require("goog.debug");
    goog.require("goog.debug.LogBuffer");
    goog.require("goog.debug.LogRecord");
    goog.debug.Logger = function (name) {
        this.name_ = name
    };
    goog.debug.Logger.prototype.parent_ = null;
    goog.debug.Logger.prototype.level_ = null;
    goog.debug.Logger.prototype.children_ = null;
    goog.debug.Logger.prototype.handlers_ = null;
    goog.debug.Logger.ENABLE_HIERARCHY = true;
    if (!goog.debug.Logger.ENABLE_HIERARCHY) {
        goog.debug.Logger.rootHandlers_ = [];
        goog.debug.Logger.rootLevel_
    }
    goog.debug.Logger.Level = function (name, value) {
        this.name = name;
        this.value = value
    };
    goog.debug.Logger.Level.prototype.toString = function () {
        return this.name
    };
    goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
    goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
    goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
    goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
    goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
    goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
    goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
    goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
    goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
    goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
    goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
    goog.debug.Logger.Level.predefinedLevelsCache_ = null;
    goog.debug.Logger.Level.createPredefinedLevelsCache_ = function () {
        goog.debug.Logger.Level.predefinedLevelsCache_ = {};
        for (var i = 0, level; level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i]; i++) {
            goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
            goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
        }
    };
    goog.debug.Logger.Level.getPredefinedLevel = function (name) {
        if (!goog.debug.Logger.Level.predefinedLevelsCache_) goog.debug.Logger.Level.createPredefinedLevelsCache_();
        return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
    };
    goog.debug.Logger.Level.getPredefinedLevelByValue = function (value) {
        if (!goog.debug.Logger.Level.predefinedLevelsCache_) goog.debug.Logger.Level.createPredefinedLevelsCache_();
        if (value in goog.debug.Logger.Level.predefinedLevelsCache_) return goog.debug.Logger.Level.predefinedLevelsCache_[value];
        for (var i = 0; i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length; ++i) {
            var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
            if (level.value <= value) return level
        }
        return null
    };
    goog.debug.Logger.getLogger = function (name) {
        return goog.debug.LogManager.getLogger(name)
    };
    goog.debug.Logger.logToProfilers = function (msg) {
        if (goog.global["console"])
            if (goog.global["console"]["timeStamp"]) goog.global["console"]["timeStamp"](msg);
            else if (goog.global["console"]["markTimeline"]) goog.global["console"]["markTimeline"](msg);
        if (goog.global["msWriteProfilerMark"]) goog.global["msWriteProfilerMark"](msg)
    };
    goog.debug.Logger.prototype.getName = function () {
        return this.name_
    };
    goog.debug.Logger.prototype.addHandler = function (handler) {
        if (goog.debug.Logger.ENABLE_HIERARCHY) {
            if (!this.handlers_) this.handlers_ = [];
            this.handlers_.push(handler)
        }
        else {
            goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
            goog.debug.Logger.rootHandlers_.push(handler)
        }
    };
    goog.debug.Logger.prototype.removeHandler = function (handler) {
        var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
        return !!handlers && goog.array.remove(handlers, handler)
    };
    goog.debug.Logger.prototype.getParent = function () {
        return this.parent_
    };
    goog.debug.Logger.prototype.getChildren = function () {
        if (!this.children_) this.children_ = {};
        return this.children_
    };
    goog.debug.Logger.prototype.setLevel = function (level) {
        if (goog.debug.Logger.ENABLE_HIERARCHY) this.level_ = level;
        else {
            goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
            goog.debug.Logger.rootLevel_ = level
        }
    };
    goog.debug.Logger.prototype.getLevel = function () {
        return this.level_
    };
    goog.debug.Logger.prototype.getEffectiveLevel = function () {
        if (!goog.debug.Logger.ENABLE_HIERARCHY) return goog.debug.Logger.rootLevel_;
        if (this.level_) return this.level_;
        if (this.parent_) return this.parent_.getEffectiveLevel();
        goog.asserts.fail("Root logger has no level set.");
        return null
    };
    goog.debug.Logger.prototype.isLoggable = function (level) {
        return level.value >= this.getEffectiveLevel().value
    };
    goog.debug.Logger.prototype.log = function (level, msg, opt_exception) {
        if (this.isLoggable(level)) this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
    };
    goog.debug.Logger.prototype.getLogRecord = function (level, msg, opt_exception) {
        if (goog.debug.LogBuffer.isBufferingEnabled()) var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_);
        else logRecord = new goog.debug.LogRecord(level, String(msg), this.name_); if (opt_exception) {
            logRecord.setException(opt_exception);
            logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
        }
        return logRecord
    };
    goog.debug.Logger.prototype.shout = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
    };
    goog.debug.Logger.prototype.severe = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
    };
    goog.debug.Logger.prototype.warning = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
    };
    goog.debug.Logger.prototype.info = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
    };
    goog.debug.Logger.prototype.config = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
    };
    goog.debug.Logger.prototype.fine = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
    };
    goog.debug.Logger.prototype.finer = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
    };
    goog.debug.Logger.prototype.finest = function (msg, opt_exception) {
        this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
    };
    goog.debug.Logger.prototype.logRecord = function (logRecord) {
        if (this.isLoggable(logRecord.getLevel())) this.doLogRecord_(logRecord)
    };
    goog.debug.Logger.prototype.doLogRecord_ = function (logRecord) {
        goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
        if (goog.debug.Logger.ENABLE_HIERARCHY) {
            var target = this;
            while (target) {
                target.callPublish_(logRecord);
                target = target.getParent()
            }
        }
        else
            for (var i = 0, handler; handler = goog.debug.Logger.rootHandlers_[i++];) handler(logRecord)
    };
    goog.debug.Logger.prototype.callPublish_ = function (logRecord) {
        if (this.handlers_)
            for (var i = 0, handler; handler = this.handlers_[i]; i++) handler(logRecord)
    };
    goog.debug.Logger.prototype.setParent_ = function (parent) {
        this.parent_ = parent
    };
    goog.debug.Logger.prototype.addChild_ = function (name, logger) {
        this.getChildren()[name] = logger
    };
    goog.debug.LogManager = {};
    goog.debug.LogManager.loggers_ = {};
    goog.debug.LogManager.rootLogger_ = null;
    goog.debug.LogManager.initialize = function () {
        if (!goog.debug.LogManager.rootLogger_) {
            goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
            goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
            goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
        }
    };
    goog.debug.LogManager.getLoggers = function () {
        return goog.debug.LogManager.loggers_
    };
    goog.debug.LogManager.getRoot = function () {
        goog.debug.LogManager.initialize();
        return goog.debug.LogManager.rootLogger_
    };
    goog.debug.LogManager.getLogger = function (name) {
        goog.debug.LogManager.initialize();
        var ret = goog.debug.LogManager.loggers_[name];
        return ret || goog.debug.LogManager.createLogger_(name)
    };
    goog.debug.LogManager.createFunctionForCatchErrors = function (opt_logger) {
        return function (info) {
            var logger = opt_logger || goog.debug.LogManager.getRoot();
            logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
        }
    };
    goog.debug.LogManager.createLogger_ = function (name) {
        var logger = new goog.debug.Logger(name);
        if (goog.debug.Logger.ENABLE_HIERARCHY) {
            var lastDotIndex = name.lastIndexOf(".");
            var parentName = name.substr(0, lastDotIndex);
            var leafName = name.substr(lastDotIndex + 1);
            var parentLogger = goog.debug.LogManager.getLogger(parentName);
            parentLogger.addChild_(leafName, logger);
            logger.setParent_(parentLogger)
        }
        goog.debug.LogManager.loggers_[name] = logger;
        return logger
    };
    goog.provide("sb.io.XmlReader");
    goog.require("goog.dom.xml");
    goog.require("goog.dom.NodeType");
    goog.require("goog.array");
    goog.require("goog.structs.Map");
    goog.require("goog.debug");
    goog.require("goog.debug.Logger");
    sb.io.XmlReader = function () {
        this.idMap_ = null
    };
    sb.io.XmlReader.prototype.logger = goog.debug.Logger.getLogger("sb.io.XmlReader");
    sb.io.XmlReader.prototype.parseXmlText = function (xmlText) {
        this.logger.info("Parsing xml size:" + xmlText.length);
        if (xmlText.charAt(0) == "\ufeff") xmlText = xmlText.substr(1, xmlText.length);
        this.idMap_ = new goog.structs.Map;
        return goog.dom.xml.loadXml(xmlText)
    };
    sb.io.XmlReader.prototype.buildIdMap = function (element) {
        var id = element.getAttribute("id");
        if (id) this.idMap_.set(id, element);
        goog.array.forEach(element.childNodes, function (child) {
            if (child.nodeType == goog.dom.NodeType.ELEMENT) this.buildIdMap(child)
        }, this)
    };
    sb.io.XmlReader.prototype.traverse = function (element) {
        this.onElementOpen(element);
        goog.array.forEach(element.childNodes, function (child) {
            if (child.nodeType == goog.dom.NodeType.ELEMENT) this.traverse(child)
        }, this);
        this.onElementClose(element)
    };
    sb.io.XmlReader.prototype.onElementOpen = goog.abstractMethod;
    sb.io.XmlReader.prototype.onElementClose = goog.abstractMethod;
    goog.provide("sb.util.Stack");
    goog.require("goog.array");
    sb.util.Stack = function () {
        this.array_ = []
    };
    sb.util.Stack.prototype.push = function (element) {
        this.array_.push(element)
    };
    sb.util.Stack.prototype.pop = function () {
        return this.array_.pop()
    };
    sb.util.Stack.prototype.peek = function () {
        return goog.array.peek(this.array_)
    };
    sb.util.Stack.prototype.array = function () {
        return this.array_
    };
    goog.provide("sb.io.SbgnReader");
    goog.require("sb.io.XmlReader");
    goog.require("sb.Document");
    goog.require("sb.util.Stack");
    goog.require("goog.array");
    goog.require("sb.Box");
    goog.require("sb.Point");
    goog.require("goog.asserts");
    goog.require("goog.debug.Logger");
    sb.io.SbgnReader = function () {
        goog.base(this);
        this.objStack_ = null;
        this.delayedArcArray_ = null;
        this.document_ = null;
        this.compartments_ = null
    };
    goog.inherits(sb.io.SbgnReader, sb.io.XmlReader);
    sb.io.SbgnReader.prototype.logger = goog.debug.Logger.getLogger("sb.io.SbgnReader");
    sb.io.SbgnReader.prototype.parseText = function (text) {
        this.logger.info("Parsing xml size:" + text.length);
        this.objStack_ = new sb.util.Stack;
        this.document_ = new sb.Document;
        this.compartments_ = [];
        this.delayedArcArray_ = [];
        var xmlDocument = this.parseXmlText(text);
        goog.asserts.assert(xmlDocument.documentElement);
        if (xmlDocument.documentElement.tagName.toLowerCase() != "sbgn") throw "sbgn format error, root element is not <sbgn>";
        this.traverse(xmlDocument.documentElement);
        goog.asserts.assert(this.objStack_.array().length ==
            0);
        goog.array.forEach(this.delayedArcArray_, function (xmlElement) {
            var arc_id = xmlElement.getAttribute("id");
            var arc = this.document_.arc(arc_id);
            this.logger.finest("arc id: " + arc_id);
            var arc_target = xmlElement.getAttribute("target");
            this.logger.finest("arc arc_target: " + arc_target);
            var arc_source = xmlElement.getAttribute("source");
            this.logger.finest("arc arc_source: " + arc_source);
            arc.source(arc_source).target(arc_target)
        }, this);
        return this.document_
    };
    sb.io.SbgnReader.glyphPropertyMap_ = {};
    sb.io.SbgnReader.prototype.onElementOpen = function (xmlElement) {
        var tagName = xmlElement.tagName;
        tagName = tagName ? tagName.toLocaleLowerCase() : null;
        var nodeId = xmlElement.getAttribute("id");
        this.logger.finer("xmlElement open: " + tagName);
        var topElementInStack = this.objStack_.peek();
        if (tagName == "glyph") {
            this.logger.finest("glyph glyph_id: " + nodeId);
            var node = topElementInStack instanceof sb.Node ? topElementInStack.createSubNode(nodeId) : this.document_.createNode(nodeId);
            var glyph_class = xmlElement.getAttribute("class");
            this.logger.finest("glyph glyph_class: " + glyph_class);
            node.type(glyph_class);
            this.objStack_.push(node);
            if (glyph_class == "compartment") goog.array.insert(this.compartments_, node)
        }
        else if (tagName == "port") {
            this.logger.finest("port port_id: " + nodeId);
            if (topElementInStack instanceof sb.Node || topElementInStack instanceof sb.Arc) topElementInStack.createPort(nodeId)
        }
        else if (tagName == "arc") {
            this.logger.finest("arc arc_id: " + nodeId);
            var arc = this.document_.createArc(nodeId);
            if (!nodeId) {
                xmlElement.setAttribute("id",
                    arc.id());
                this.logger.finest("no arc id, arc_id automatically set to: " + xmlElement.getAttribute("id"))
            }
            var arc_class = xmlElement.getAttribute("class");
            this.logger.finest("arc arc_class: " + arc_class);
            arc.type(arc_class);
            this.objStack_.push(arc);
            goog.array.insert(this.delayedArcArray_, xmlElement)
        }
        else if (tagName == "label") topElementInStack.label(xmlElement.getAttribute("text"));
        else if (tagName == "bbox") {
            var box = new sb.Box(Number(xmlElement.getAttribute("x")), Number(xmlElement.getAttribute("y")), Number(xmlElement.getAttribute("w")),
                Number(xmlElement.getAttribute("h")));
            if (xmlElement.parentNode.tagName.toLocaleLowerCase() == "label") topElementInStack.attr("label.pos", box);
            else {
                topElementInStack.attr("box", box);
                if (topElementInStack instanceof sb.Node && topElementInStack.type() != sb.NodeType.Compartment) goog.array.forEach(this.compartments_, function (compartment) {
                    if (compartment.attr("box").contains(box)) compartment.addChild(topElementInStack)
                }, this)
            }
        }
        else if (tagName == "start" || tagName == "end") {
            if (topElementInStack instanceof sb.Arc) topElementInStack.attr(tagName,
                new sb.Point(Number(xmlElement.getAttribute("x")), Number(xmlElement.getAttribute("y"))))
        }
        else if (tagName == "map") {
            var language = xmlElement.getAttribute("language");
            if (language) this.document_.lang(language);
            this.objStack_.push(this.document_)
        }
        else if (tagName == "entity") topElementInStack.attr("entity", xmlElement.getAttribute("name"));
        else if (tagName == "state") {
            topElementInStack.attr("variable", xmlElement.getAttribute("variable"));
            topElementInStack.attr("variableValue", xmlElement.getAttribute("value"))
        }
        else if (tagName ==
            "clone") topElementInStack.attr("clone", true)
    };
    sb.io.SbgnReader.prototype.onElementClose = function (xmlElement) {
        var tagName = xmlElement.tagName;
        this.logger.finer("node close: " + tagName);
        if (tagName == "glyph" || tagName == "arc" || tagName == "map") this.objStack_.pop()
    };
    goog.provide("sb.io.SbgnWriter");
    goog.require("sb.Document");
    goog.require("goog.dom.xml");
    goog.require("goog.debug.Logger");
    sb.io.SbgnWriter = function () {
        this.xml = null
    };
    sb.io.SbgnWriter.prototype.logger = goog.debug.Logger.getLogger("sb.io.SbgnWriter");
    sb.io.SbgnWriter.prototype.write = function (doc) {
        this.xml = goog.dom.xml.createDocument();
        var sbgnElement = this.xml.createElement("sbgn");
        sbgnElement.setAttribute("xmlns", "http://sbgn.org/libsbgn/0.2");
        var mapElement = this.xml.createElement("map");
        var docLanguage = doc.lang();
        if (docLanguage) mapElement.setAttribute("language", docLanguage);
        var nodes = doc.nodes(true);
        goog.array.forEach(nodes, function (node) {
            this.writeNode_(node, mapElement)
        }, this);
        var arcs = doc.arcs();
        goog.array.forEach(arcs, function (arc) {
            this.writeArc_(arc,
                mapElement)
        }, this);
        sbgnElement.appendChild(mapElement);
        var xmlText = goog.dom.xml.serialize(sbgnElement);
        this.logger.fine(xmlText);
        return xmlText
    };
    sb.io.SbgnWriter.prototype.writeNode_ = function (node, parentElement) {
        var classText = node.type();
        var glyphElement = this.xml.createElement("glyph");
        glyphElement.setAttribute("class", classText);
        glyphElement.setAttribute("id", node.id());
        if (node.label()) {
            var labelElement = this.xml.createElement("label");
            labelElement.setAttribute("text", node.label());
            glyphElement.appendChild(labelElement)
        }
        if (node.attr("box")) {
            var boxElement = this.xml.createElement("box");
            var box = node.attr("box");
            boxElement.setAttribute("y", box.x)
        }
        parentElement.appendChild(glyphElement);
        this.writeChildren_(node, glyphElement)
    };
    sb.io.SbgnWriter.prototype.writeArc_ = function (arc, parentElement) {
        var classText = arc.type();
        var glyphElement = this.xml.createElement("arc");
        glyphElement.setAttribute("class", classText);
        glyphElement.setAttribute("id", arc.id());
        parentElement.appendChild(glyphElement);
        this.writeChildren_(arc, glyphElement)
    };
    sb.io.SbgnWriter.prototype.writeChildren_ = function (element, parentElement) {
        goog.array.forEach(element.children(), function (child) {
            if (child instanceof sb.Node) this.writeNode_(child, parentElement);
            else if (child instanceof sb.Arc) this.writeArc_(child, parentElement)
        }, this)
    };
    goog.provide("sb.io.Jsonp");
    sb.io.Jsonp = function (url, params, callback) {
        this.url = url;
        this.callback = callback;
        this.internalCallback = this.generateCallback();
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        var query = "";
        params = params || {};
        var key;
        for (key in params)
            if (params.hasOwnProperty(key)) query += encodeURIComponent(key) + "=" + encodeURIComponent(params[key]) + "&";
        script.setAttribute("src", url + "?" + query + "callback=sb.io.Jsonp." + this.internalCallback);
        this.script = document.getElementsByTagName("head")[0].appendChild(script)
    };
    sb.io.Jsonp.call = function (url, params, callback) {
        new sb.io.Jsonp(url, params, callback)
    };
    sb.io.Jsonp.prototype.generateCallback = function () {
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        var randomName = "";
        for (var i = 0; i < 15; i++) randomName += possible.charAt(Math.floor(Math.random() * possible.length));
        var self = this;
        sb.io.Jsonp[randomName] = function (data) {
            self.callback(data);
            delete sb.io.Jsonp[randomName];
            self.script.parentNode.removeChild(self.script)
        };
        return randomName
    };
    goog.provide("sb.sbo.NodeTypeMapping");
    goog.provide("sb.sbo.ArcTypeMapping");
    goog.provide("sb.sbo.ReverseNodeTypeMapping");
    goog.provide("sb.sbo.ReverseArcTypeMapping");
    goog.require("goog.object");
    sb.sbo.NodeTypeMapping = {};
    sb.sbo.ArcTypeMapping = {};
    sb.sbo.NodeTypeMapping[sb.NodeType.UnspecifiedEntity] = 285;
    sb.sbo.NodeTypeMapping[sb.NodeType.SimpleChemical] = 247;
    sb.sbo.NodeTypeMapping[sb.NodeType.Macromolecule] = 245;
    sb.sbo.NodeTypeMapping[sb.NodeType.NucleicAcidFeature] = 354;
    sb.sbo.NodeTypeMapping[sb.NodeType.MacromoleculeMultimer] = 420;
    sb.sbo.NodeTypeMapping[sb.NodeType.ComplexMultimer] = 418;
    sb.sbo.NodeTypeMapping[sb.NodeType.NucleicAcidFeatureMultimer] = 419;
    sb.sbo.NodeTypeMapping[sb.NodeType.SimpleChemicalMultimer] = 421;
    sb.sbo.NodeTypeMapping[sb.NodeType.Complex] = 253;
    sb.sbo.NodeTypeMapping[sb.NodeType.SourceAndSink] = 291;
    sb.sbo.NodeTypeMapping[sb.NodeType.Perturbation] = 405;
    sb.sbo.NodeTypeMapping[sb.NodeType.Compartment] = 290;
    sb.sbo.NodeTypeMapping[sb.NodeType.Submap] = 395;
    sb.sbo.NodeTypeMapping[sb.NodeType.Process] = 375;
    sb.sbo.NodeTypeMapping[sb.NodeType.OmittedProcess] = 397;
    sb.sbo.NodeTypeMapping[sb.NodeType.UncertainProcess] = 396;
    sb.sbo.NodeTypeMapping[sb.NodeType.Association] = 177;
    sb.sbo.NodeTypeMapping[sb.NodeType.Dissociation] = 180;
    sb.sbo.NodeTypeMapping[sb.NodeType.Phenotype] = 358;
    sb.sbo.ArcTypeMapping[sb.ArcType.Consumption] = 394;
    sb.sbo.ArcTypeMapping[sb.ArcType.Production] = 393;
    sb.sbo.ArcTypeMapping[sb.ArcType.Modulation] = 168;
    sb.sbo.ArcTypeMapping[sb.ArcType.Stimulation] = 170;
    sb.sbo.ArcTypeMapping[sb.ArcType.Catalysis] = 172;
    sb.sbo.ArcTypeMapping[sb.ArcType.Inhibition] = 169;
    sb.sbo.ArcTypeMapping[sb.ArcType.NecessaryStimulation] = 171;
    sb.sbo.ArcTypeMapping[sb.ArcType.LogicArc] = 398;
    sb.sbo.NodeTypeMapping[sb.NodeType.And] = 173;
    sb.sbo.NodeTypeMapping[sb.NodeType.Or] = 174;
    sb.sbo.NodeTypeMapping[sb.NodeType.Not] = 238;
    sb.sbo.NodeTypeMapping[sb.NodeType.Entity] = 245;
    sb.sbo.NodeTypeMapping[sb.NodeType.Outcome] = 409;
    sb.sbo.NodeTypeMapping[sb.NodeType.And] = 173;
    sb.sbo.NodeTypeMapping[sb.NodeType.Or] = 174;
    sb.sbo.NodeTypeMapping[sb.NodeType.Not] = 238;
    sb.sbo.NodeTypeMapping[sb.NodeType.Delay] = 225;
    sb.sbo.NodeTypeMapping[sb.NodeType.PerturbingAgent] = 405;
    sb.sbo.NodeTypeMapping[sb.NodeType.Assignment] = 464;
    sb.sbo.NodeTypeMapping[sb.NodeType.Interaction] = 342;
    sb.sbo.NodeTypeMapping[sb.NodeType.Phenotype] = 358;
    sb.sbo.ArcTypeMapping[sb.ArcType.Modulation] = 168;
    sb.sbo.ArcTypeMapping[sb.ArcType.Stimulation] = 170;
    sb.sbo.ArcTypeMapping[sb.ArcType.Inhibition] = 169;
    sb.sbo.ArcTypeMapping[sb.ArcType.NecessaryStimulation] = 171;
    sb.sbo.ArcTypeMapping[sb.ArcType.AbsoluteInhibition] = 407;
    sb.sbo.ArcTypeMapping[sb.ArcType.AbsoluteStimulation] = 411;
    sb.sbo.ArcTypeMapping[sb.ArcType.LogicArc] = 398;
    sb.sbo.NodeTypeMapping[sb.NodeType.BiologicalActivity] = 412;
    sb.sbo.NodeTypeMapping[sb.NodeType.Perturbation] = 357;
    sb.sbo.NodeTypeMapping[sb.NodeType.Phenotype] = 358;
    sb.sbo.NodeTypeMapping[sb.NodeType.Compartment] = 290;
    sb.sbo.NodeTypeMapping[sb.NodeType.Submap] = 395;
    sb.sbo.ArcTypeMapping[sb.ArcType.PositiveInfluence] = 170;
    sb.sbo.ArcTypeMapping[sb.ArcType.NegativeInfluence] = 169;
    sb.sbo.ArcTypeMapping[sb.ArcType.UnknownInfluence] = 168;
    sb.sbo.ArcTypeMapping[sb.ArcType.NecessaryStimulation] = 171;
    sb.sbo.ArcTypeMapping[sb.ArcType.LogicArc] = 398;
    sb.sbo.NodeTypeMapping[sb.NodeType.And] = 173;
    sb.sbo.NodeTypeMapping[sb.NodeType.Or] = 174;
    sb.sbo.NodeTypeMapping[sb.NodeType.Not] = 238;
    sb.sbo.NodeTypeMapping[sb.NodeType.Delay] = 225;
    sb.sbo.ReverseNodeTypeMapping = goog.object.transpose(sb.sbo.NodeTypeMapping);
    sb.sbo.ReverseArcTypeMapping = goog.object.transpose(sb.sbo.NodeTypeMapping);
    goog.provide("goog.json");
    goog.provide("goog.json.Serializer");
    goog.json.isValid_ = function (s) {
        if (/^\s*$/.test(s)) return false;
        var backslashesRe = /\\["\\\/bfnrtu]/g;
        var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
        var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
        var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
        return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
    };
    goog.json.parse = function (s) {
        var o = String(s);
        if (goog.json.isValid_(o)) try {
            return eval("(" + o + ")")
        }
        catch (ex) {}
        throw Error("Invalid JSON string: " + o);
    };
    goog.json.unsafeParse = function (s) {
        return eval("(" + s + ")")
    };
    goog.json.Replacer;
    goog.json.serialize = function (object, opt_replacer) {
        return (new goog.json.Serializer(opt_replacer)).serialize(object)
    };
    goog.json.Serializer = function (opt_replacer) {
        this.replacer_ = opt_replacer
    };
    goog.json.Serializer.prototype.serialize = function (object) {
        var sb = [];
        this.serialize_(object, sb);
        return sb.join("")
    };
    goog.json.Serializer.prototype.serialize_ = function (object, sb) {
        switch (typeof object) {
        case "string":
            this.serializeString_(object, sb);
            break;
        case "number":
            this.serializeNumber_(object, sb);
            break;
        case "boolean":
            sb.push(object);
            break;
        case "undefined":
            sb.push("null");
            break;
        case "object":
            if (object == null) {
                sb.push("null");
                break
            }
            if (goog.isArray(object)) {
                this.serializeArray_(object, sb);
                break
            }
            this.serializeObject_(object, sb);
            break;
        case "function":
            break;
        default:
            throw Error("Unknown type: " + typeof object);
        }
    };
    goog.json.Serializer.charToJsonCharCache_ = {
        '"': '\\"',
        "\\": "\\\\",
        "/": "\\/",
        "\u0008": "\\b",
        "\u000c": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "\t": "\\t",
        "\x0B": "\\u000b"
    };
    goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
    goog.json.Serializer.prototype.serializeString_ = function (s, sb) {
        sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function (c) {
            if (c in goog.json.Serializer.charToJsonCharCache_) return goog.json.Serializer.charToJsonCharCache_[c];
            var cc = c.charCodeAt(0);
            var rv = "\\u";
            if (cc < 16) rv += "000";
            else if (cc < 256) rv += "00";
            else if (cc < 4096) rv += "0";
            return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
        }), '"')
    };
    goog.json.Serializer.prototype.serializeNumber_ = function (n, sb) {
        sb.push(isFinite(n) && !isNaN(n) ? n : "null")
    };
    goog.json.Serializer.prototype.serializeArray_ = function (arr, sb) {
        var l = arr.length;
        sb.push("[");
        var sep = "";
        for (var i = 0; i < l; i++) {
            sb.push(sep);
            var value = arr[i];
            this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
            sep = ","
        }
        sb.push("]")
    };
    goog.json.Serializer.prototype.serializeObject_ = function (obj, sb) {
        sb.push("{");
        var sep = "";
        for (var key in obj)
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                var value = obj[key];
                if (typeof value != "function") {
                    sb.push(sep);
                    this.serializeString_(key, sb);
                    sb.push(":");
                    this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
                    sep = ","
                }
            }
        sb.push("}")
    };
    goog.provide("sb.io.JsbgnWriter");
    goog.require("sb.Document");
    goog.require("sb.sbo.NodeTypeMapping");
    goog.require("goog.json");
    goog.require("goog.array");
    goog.require("goog.object");
    goog.require("goog.asserts");
    goog.require("goog.debug.Logger");
    sb.io.JsbgnWriter = function () {};
    sb.io.JsbgnWriter.prototype.logger = goog.debug.Logger.getLogger("sb.io.JsbgnWriter");
    sb.io.JsbgnWriter.sbgnlangMapping_ = [];
    sb.io.JsbgnWriter.sbgnlangMapping_[sb.Language.ER] = "ER";
    sb.io.JsbgnWriter.sbgnlangMapping_[sb.Language.AF] = "AF";
    sb.io.JsbgnWriter.sbgnlangMapping_[sb.Language.PD] = "PD";
    sb.io.JsbgnWriter.prototype.getProperRef = function (element) {
        if (element instanceof sb.Port) return element.parent().id();
        else if (element.type() == sb.NodeType.StateVariable) return element.parent().id() + ":" + element.attr("variable");
        return element.id()
    };
    sb.io.JsbgnWriter.prototype.write = function (doc) {
        var jsbgn = {};
        jsbgn["nodes"] = [];
        jsbgn["edges"] = [];
        if (doc.lang()) jsbgn["sbgnlang"] = sb.io.JsbgnWriter.sbgnlangMapping_[doc.lang()];
        goog.array.forEach(doc.nodes(), function (node) {
            if (node instanceof sb.Port) return;
            if (goog.array.contains([sb.NodeType.UnitOfInformation, sb.NodeType.StateVariable], node.type())) return;
            var nodeObj = {};
            nodeObj["id"] = node.id();
            nodeObj["sbo"] = sb.sbo.NodeTypeMapping[node.type()];
            nodeObj["type"] = "node: " + node.type();
            nodeObj["is_abstract"] =
                false;
            var nodeData = {};
            nodeObj["data"] = nodeData;
            if (node.attr("clone")) nodeData["clone"] = true;
            if (node.label()) nodeData["label"] = node.label();
            var bbox = node.attr("box");
            if (bbox) {
                nodeData["x"] = bbox.x;
                nodeData["y"] = bbox.y;
                nodeData["width"] = bbox.width;
                nodeData["height"] = bbox.height
            }
            goog.array.forEach(node.children(), function (subNode) {
                if (subNode instanceof sb.Port) return;
                if (subNode.type() == sb.NodeType.UnitOfInformation) {
                    if (!nodeData["unitofinformation"]) nodeData["unitofinformation"] = [];
                    goog.array.insert(nodeData["unitofinformation"],
                        subNode.label() ? subNode.label() : "")
                }
                else if (subNode.type() == sb.NodeType.StateVariable) {
                    if (!nodeData["statevariable"]) nodeData["statevariable"] = [];
                    goog.array.insert(nodeData["statevariable"], subNode.attr("variable"))
                }
                else {
                    if (!nodeData["subnodes"]) nodeData["subnodes"] = [];
                    goog.array.insert(nodeData["subnodes"], subNode.id())
                }
            }, this);
            if (goog.object.isEmpty(nodeData)) goog.object.remove(nodeObj, "data");
            goog.array.insert(jsbgn["nodes"], nodeObj)
        }, this);
        goog.array.forEach(doc.arcs(), function (arc) {
            var arcObj = {};
            arcObj["id"] = arc.id();
            arcObj["sbo"] = sb.sbo.ArcTypeMapping[arc.type()];
            arcObj["type"] = "arc: " + arc.type();
            arcObj["source"] = arc.source().id();
            var target = arc.target();
            var targetId = target.id();
            if (target.type() == sb.NodeType.StateVariable) targetId = target.parent().id() + ":" + target.id();
            arcObj["target"] = targetId;
            var arcData = {};
            arcObj["data"] = arcData;
            if (goog.object.isEmpty(arcData)) goog.object.remove(arcObj, "data");
            goog.array.insert(jsbgn["edges"], arcObj)
        }, this);
        return goog.json.serialize(jsbgn)
    };
    goog.provide("sb.io.JsbgnReader");
    goog.require("sb.Document");
    goog.require("goog.array");
    goog.require("goog.json");
    goog.require("sb.Box");
    goog.require("sb.Point");
    goog.require("sb.util.Stack");
    goog.require("goog.asserts");
    goog.require("goog.debug.Logger");
    goog.require("sb.sbo.ReverseNodeTypeMapping");
    sb.io.JsbgnReader = function () {
        this.document_ = null;
        this.compartments_ = null
    };
    sb.io.JsbgnReader.prototype.logger = goog.debug.Logger.getLogger("sb.io.JsbgnReader");
    sb.io.JsbgnReader.prototype.parseText = function (text) {
        this.objStack_ = new sb.util.Stack;
        this.document_ = new sb.Document;
        this.compartments_ = [];
        var jsonObj = goog.json.parse(text);
        if (jsonObj && jsonObj["edges"] && jsonObj["nodes"]) {
            this.logger.fine("jsbgn JSON parsed");
            var edges = [];
            var json_edges = jsonObj["edges"];
            var json_nodes = jsonObj["nodes"];
            goog.array.forEach(json_nodes, function (json_node) {
                this.document_.createNode(String(json_node["id"]))
            }, this);
            goog.array.forEach(json_edges, function (json_edge) {
                    this.document_.createArc(String(json_edge["id"]))
                },
                this);
            goog.array.forEach(json_nodes, function (json_node) {
                var node = this.document_.node(String(json_node["id"]));
                node.attr("jsbgn.sbo", json_node["sbo"]);
                node.type(sb.sbo.ReverseNodeTypeMapping[json_node["sbo"]]);
                node.attr("jsbgn.is_abstract", json_node["is_abstract"]);
                node.attr("jsbgn.type", json_node["type"]);
                var json_data = json_node["data"];
                if (json_data) {
                    if (json_data["label"]) node.label(json_data["label"]);
                    if (json_data["clone_marker"]) node.attr("clone", true);
                    if (json_data["x"] && json_data["y"]) {
                        node.attr("jsbgn.data.x",
                            json_data["x"]);
                        node.attr("jsbgn.data.y", json_data["y"]);
                        if (json_data["width"] && json_data["height"]) {
                            node.attr("jsbgn.data.width", json_data["width"]);
                            node.attr("jsbgn.data.height", json_data["height"]);
                            var box = new sb.Box(Number(json_data["x"]), Number(json_data["y"]), Number(json_data["width"]), Number(json_data["height"]));
                            node.attr("box", box)
                        }
                    }
                    if (json_data["radius"]) node.attr("jsbgn.data.radius", json_data["radius"]);
                    if (json_data["subnodes"]) {
                        node.attr("jsbgn.data.subnodes", json_data["subnodes"]);
                        goog.array.forEach(json_data["subnodes"],
                            function (childNodeId) {
                                var childNode = this.document_.node(childNodeId);
                                if (childNode) node.addChild(childNode)
                            }, this)
                    }
                    if (json_data["compartment"]) node.attr("jsbgn.data.compartment", json_data["compartment"]);
                    if (json_data["modifications"]) node.attr("jsbgn.data.modifications", json_data["modifications"]);
                    if (json_data["statevariable"]) {
                        node.attr("jsbgn.data.statevariable", json_data["statevariable"]);
                        goog.array.forEach(json_data["statevariable"], function (stateVariableId) {
                            var childNode = node.createSubNode(node.id() +
                                ":" + stateVariableId);
                            childNode.type(sb.NodeType.StateVariable);
                            childNode.attr("variable", stateVariableId)
                        }, this)
                    }
                    if (json_data["unitofinformation"]) {
                        node.attr("jsbgn.data.unitofinformation", json_data["unitofinformation"]);
                        goog.array.forEach(json_data["unitofinformation"], function (unitofinformationId) {
                            var childNode = node.createSubNode(node.id() + ":" + unitofinformationId);
                            childNode.type(sb.NodeType.UnitOfInformation);
                            childNode.attr("label", unitofinformationId)
                        }, this)
                    }
                    if (json_data["cssClasses"]) node.attr("jsbgn.data.cssClasses",
                        json_data["cssClasses"])
                }
            }, this);
            goog.array.forEach(json_edges, function (json_edge) {
                var arc = this.document_.arc(String(json_edge["id"]));
                arc.attr("jsbgn.sbo", json_edge["sbo"]);
                arc.type(sb.sbo.ReverseArcTypeMapping[json_edge["sbo"]]);
                arc.source(json_edge["source"]);
                arc.target(json_edge["target"]);
                var json_data = json_edge["data"];
                if (json_data) {
                    if (json_data["type"]) arc.attr("jsbgn.data.type", json_data["type"]);
                    if (json_data["style"]) arc.attr("jsbgn.data.style", json_data["style"]);
                    if (json_data["thickness"]) arc.attr("jsbgn.data.thickness",
                        json_data["thickness"]);
                    if (json_data["label"]) arc.label(json_data["label"]);
                    if (json_data["label_x"]) arc.attr("jsbgn.data.label_x", json_data["label_x"]);
                    if (json_data["label_y"]) arc.attr("jsbgn.data.label_y", json_data["label_y"]);
                    if (json_data["handles"]) arc.attr("jsbgn.data.handles", json_data["handles"]);
                    if (json_data["pairs"]) arc.attr("jsbgn.data.pairs", json_data["pairs"])
                }
            }, this)
        }
        else throw "jsbgn JSON format error, it is not a valid JSON string";
        return this.document_
    };
    goog.provide("sb.util.dom");
    goog.require("goog.dom");
    goog.require("goog.array");
    sb.util.dom.forEachElement = function (domElement, f, opt_obj) {
        var elementChildren = goog.dom.getChildren(domElement);
        goog.array.forEach(elementChildren, f, opt_obj)
    };
    sb.util.dom.forEachElementByName = function (domElement, name, f, opt_obj) {
        var elementChildren = goog.array.filter(goog.dom.getChildren(domElement), function (element) {
            return element.tagName == name
        });
        goog.array.forEach(elementChildren, f, opt_obj)
    };
    goog.provide("sb.io.SbmlReader");
    goog.require("sb.io.XmlReader");
    goog.require("sb.Document");
    goog.require("sb.util.Stack");
    goog.require("goog.array");
    goog.require("sb.Box");
    goog.require("sb.Point");
    goog.require("goog.asserts");
    goog.require("goog.debug.Logger");
    goog.require("sb.util.dom");
    sb.io.SbmlReader = function () {
        goog.base(this);
        this.objStack_ = null;
        this.delayedArcArray_ = null;
        this.document_ = null;
        this.compartments_ = null
    };
    goog.inherits(sb.io.SbmlReader, sb.io.XmlReader);
    sb.io.SbmlReader.prototype.logger = goog.debug.Logger.getLogger("sb.io.SbmlReader");
    sb.io.SbmlReader.prototype.parseText = function (text) {
        this.logger.info("Parsing xml size:" + text.length);
        this.document_ = new sb.Document;
        this.compartments_ = [];
        this.delayedArcArray_ = [];
        var xmlDocument = this.parseXmlText(text);
        goog.asserts.assert(xmlDocument.documentElement);
        var node2compartment = {};
        sb.util.dom.forEachElementByName(xmlDocument.documentElement, "model", function (model) {
            sb.util.dom.forEachElementByName(model, "listOfCompartments", function (lo) {
                sb.util.dom.forEachElement(lo, function (compartment) {
                    var node =
                        this.document_.createNode(compartment.getAttribute("id")).type("compartment");
                    node.label(compartment.getAttribute("name"))
                }, this)
            }, this);
            sb.util.dom.forEachElementByName(model, "listOfSpecies", function (lo) {
                sb.util.dom.forEachElement(lo, function (species) {
                    var node = this.document_.createNode(species.getAttribute("id"));
                    node.label(species.getAttribute("name"));
                    var species_id = species.getAttribute("id");
                    var name_and_id = species.getAttribute("id") + species.getAttribute("name");
                    var compartment = this.document_.node(species.getAttribute("compartment"));
                    compartment.addChild(node);
                    node2compartment[species_id] = compartment;
                    if (name_and_id.toLowerCase().indexOf("sink") != -1 || name_and_id.toLowerCase().indexOf("emptyset") != -1) node.type("source and sink");
                    else if (name_and_id.toLowerCase().indexOf("dna") != -1 || name_and_id.toLowerCase().indexOf("rna") != -1) node.type("nucleic acid feature");
                    else if (goog.dom.xml.serialize(species).indexOf("urn:miriam:obo.chebi") != -1) node.type("simple chemical");
                    else if (goog.dom.xml.serialize(species).indexOf("urn:miriam:pubchem") != -1) node.type("simple chemical");
                    else if (goog.dom.xml.serialize(species).indexOf("urn:miriam:uniprot") != -1) node.type("macromolecule");
                    else node.type("unspecified entity")
                }, this)
            }, this);
            sb.util.dom.forEachElementByName(model, "listOfReactions", function (lor) {
                sb.util.dom.forEachElementByName(lor, "reaction", function (reaction) {
                    var reaction_id = reaction.getAttribute("id");
                    var node = this.document_.createNode(reaction_id).type("process");
                    node.label(reaction.getAttribute("name"));
                    node.attr("box", new sb.Box(0,
                        0, 10, 10));
                    var reaction_compartment;
                    console.log("reaction_id " + reaction_id);
                    var has_reactands = false,
                        has_products = false,
                        compartment;
                    sb.util.dom.forEachElementByName(reaction, "listOfReactants", function (lo) {
                        sb.util.dom.forEachElement(lo, function (item) {
                            var source = item.getAttribute("species");
                            var target = reaction_id;
                            var arc = this.document_.createArc(source + "_to_" + target).source(source).target(target).type("consumption");
                            has_reactands = true;
                            compartment = node2compartment[source]
                        }, this)
                    }, this);
                    sb.util.dom.forEachElementByName(reaction,
                        "listOfProducts", function (lo) {
                            sb.util.dom.forEachElement(lo, function (item) {
                                var source = reaction_id;
                                var target = item.getAttribute("species");
                                var arc = this.document_.createArc(source + "_to_" + target).source(source).target(target).type("production");
                                has_products = true;
                                compartment = node2compartment[target]
                            }, this)
                        }, this);
                    sb.util.dom.forEachElementByName(reaction, "listOfModifiers", function (lo) {
                        sb.util.dom.forEachElement(lo, function (item) {
                            var source = item.getAttribute("species");
                            var target = reaction_id;
                            var arc = this.document_.createArc(source +
                                "_to_" + target).source(source).target(target).type("modulation")
                        }, this)
                    }, this);
                    compartment.addChild(node);
                    if (!has_reactands) {
                        var source = reaction_id + "_source";
                        var node_source = this.document_.createNode(source).type("source and sink");
                        var target = reaction_id;
                        compartment.addChild(node_source);
                        var arc = this.document_.createArc(source + "_to_" + target).source(source).target(target).type("consumption")
                    }
                    if (!has_products) {
                        var target = reaction_id + "_sink";
                        var node_sink = this.document_.createNode(target).type("source and sink");
                        var source = reaction_id;
                        compartment.addChild(node_sink);
                        var arc = this.document_.createArc(source + "_to_" + target).source(source).target(target).type("production")
                    }
                }, this)
            }, this)
        }, this);
        return this.document_
    };
    goog.provide("sb.io");
    goog.require("sb.io.SbgnReader");
    goog.require("sb.io.SbgnWriter");
    goog.require("sb.io.Jsonp");
    goog.require("sb.io.JsbgnWriter");
    goog.require("sb.io.JsbgnReader");
    goog.require("sb.io.SbmlReader");
    goog.require("goog.debug.Logger");
    goog.require("goog.json");
    goog.require("goog.array");
    sb.io.logger_ = goog.debug.Logger.getLogger("sb.io");
    sb.io.read = function (text, format) {
        if (format) return sb.io.read_(text, format);
        else {
            var result;
            goog.array.find(["jsbgn", "sbgn-ml", "rxncon", "sbml"], function (formatToTest) {
                try {
                    var doc = sb.io.read_(text, formatToTest);
                    if (doc) {
                        result = doc;
                        return true
                    }
                }
                catch (e) {}
                return false
            }, this);
            return result
        }
    };
    sb.io.read_ = function (text, format) {
        sb.io.logger_.fine("Reading format: " + format);
        var reader;
        if (format == "sbgn-ml") {
            reader = new sb.io.SbgnReader;
            sb.io.logger_.fine("using sb.io.SbgnReader")
        }
        else if (format == "jsbgn") {
            reader = new sb.io.JsbgnReader;
            sb.io.logger_.fine("using sb.io.JsbgnReader")
        }
        else if (format == "rxncon") {
            reader = new sb.io.RxnconReader;
            sb.io.logger_.fine("using sb.io.RxnconReader")
        }
        else if (format == "sbml") {
            reader = new sb.io.SbmlReader;
            sb.io.logger_.fine("using sb.io.SbmlReader")
        }
        else throw new Error("Format " +
            format + " not supported");
        sb.io.logger_.fine("Parsing xml size:" + text.length);
        return reader.parseText(text)
    };
    sb.io.readUrl = function (url, format, callback_Success) {
        var proxyUrl = "http://chemhack.com/jsonp/ba-simple-proxy.php";
        new sb.io.Jsonp(proxyUrl, {
            "url": url
        }, function (data) {
            sb.io.logger_.fine(goog.json.serialize(data));
            if (data["status"]["http_code"] == 200) {
                var doc = sb.io.read(data["contents"], format);
                callback_Success(doc)
            }
        })
    };
    sb.io.write = function (doc, format) {
        var writer;
        if (format == "jsbgn") {
            writer = new sb.io.JsbgnWriter;
            sb.io.logger_.fine("using sb.io.JsbgnWriter")
        }
        else if (format == "sbgn-ml") {
            writer = new sb.io.SbgnWriter;
            sb.io.logger_.fine("using sb.io.SbgnWriter")
        }
        else throw new Error("Format " + format + " not supported");
        return writer.write(doc)
    };
    goog.provide("goog.debug.RelativeTimeProvider");
    goog.debug.RelativeTimeProvider = function () {
        this.relativeTimeStart_ = goog.now()
    };
    goog.debug.RelativeTimeProvider.defaultInstance_ = new goog.debug.RelativeTimeProvider;
    goog.debug.RelativeTimeProvider.prototype.set = function (timeStamp) {
        this.relativeTimeStart_ = timeStamp
    };
    goog.debug.RelativeTimeProvider.prototype.reset = function () {
        this.set(goog.now())
    };
    goog.debug.RelativeTimeProvider.prototype.get = function () {
        return this.relativeTimeStart_
    };
    goog.debug.RelativeTimeProvider.getDefaultInstance = function () {
        return goog.debug.RelativeTimeProvider.defaultInstance_
    };
    goog.provide("goog.debug.Formatter");
    goog.provide("goog.debug.HtmlFormatter");
    goog.provide("goog.debug.TextFormatter");
    goog.require("goog.debug.RelativeTimeProvider");
    goog.require("goog.string");
    goog.debug.Formatter = function (opt_prefix) {
        this.prefix_ = opt_prefix || "";
        this.startTimeProvider_ = goog.debug.RelativeTimeProvider.getDefaultInstance()
    };
    goog.debug.Formatter.prototype.showAbsoluteTime = true;
    goog.debug.Formatter.prototype.showRelativeTime = true;
    goog.debug.Formatter.prototype.showLoggerName = true;
    goog.debug.Formatter.prototype.showExceptionText = false;
    goog.debug.Formatter.prototype.showSeverityLevel = false;
    goog.debug.Formatter.prototype.formatRecord = goog.abstractMethod;
    goog.debug.Formatter.prototype.setStartTimeProvider = function (provider) {
        this.startTimeProvider_ = provider
    };
    goog.debug.Formatter.prototype.getStartTimeProvider = function () {
        return this.startTimeProvider_
    };
    goog.debug.Formatter.prototype.resetRelativeTimeStart = function () {
        this.startTimeProvider_.reset()
    };
    goog.debug.Formatter.getDateTimeStamp_ = function (logRecord) {
        var time = new Date(logRecord.getMillis());
        return goog.debug.Formatter.getTwoDigitString_(time.getFullYear() - 2E3) + goog.debug.Formatter.getTwoDigitString_(time.getMonth() + 1) + goog.debug.Formatter.getTwoDigitString_(time.getDate()) + " " + goog.debug.Formatter.getTwoDigitString_(time.getHours()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getMinutes()) + ":" + goog.debug.Formatter.getTwoDigitString_(time.getSeconds()) + "." + goog.debug.Formatter.getTwoDigitString_(Math.floor(time.getMilliseconds() /
            10))
    };
    goog.debug.Formatter.getTwoDigitString_ = function (n) {
        if (n < 10) return "0" + n;
        return String(n)
    };
    goog.debug.Formatter.getRelativeTime_ = function (logRecord, relativeTimeStart) {
        var ms = logRecord.getMillis() - relativeTimeStart;
        var sec = ms / 1E3;
        var str = sec.toFixed(3);
        var spacesToPrepend = 0;
        if (sec < 1) spacesToPrepend = 2;
        else
            while (sec < 100) {
                spacesToPrepend++;
                sec *= 10
            }
        while (spacesToPrepend-- > 0) str = " " + str;
        return str
    };
    goog.debug.HtmlFormatter = function (opt_prefix) {
        goog.debug.Formatter.call(this, opt_prefix)
    };
    goog.inherits(goog.debug.HtmlFormatter, goog.debug.Formatter);
    goog.debug.HtmlFormatter.prototype.showExceptionText = true;
    goog.debug.HtmlFormatter.prototype.formatRecord = function (logRecord) {
        var className;
        switch (logRecord.getLevel().value) {
        case goog.debug.Logger.Level.SHOUT.value:
            className = "dbg-sh";
            break;
        case goog.debug.Logger.Level.SEVERE.value:
            className = "dbg-sev";
            break;
        case goog.debug.Logger.Level.WARNING.value:
            className = "dbg-w";
            break;
        case goog.debug.Logger.Level.INFO.value:
            className = "dbg-i";
            break;
        case goog.debug.Logger.Level.FINE.value:
        default:
            className = "dbg-f";
            break
        }
        var sb = [];
        sb.push(this.prefix_, " ");
        if (this.showAbsoluteTime) sb.push("[",
            goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ");
        if (this.showRelativeTime) sb.push("[", goog.string.whitespaceEscape(goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get())), "s] ");
        if (this.showLoggerName) sb.push("[", goog.string.htmlEscape(logRecord.getLoggerName()), "] ");
        sb.push('<span class="', className, '">', goog.string.newLineToBr(goog.string.whitespaceEscape(goog.string.htmlEscape(logRecord.getMessage()))));
        if (this.showExceptionText && logRecord.getException()) sb.push("<br>",
            goog.string.newLineToBr(goog.string.whitespaceEscape(logRecord.getExceptionText() || "")));
        sb.push("</span><br>");
        return sb.join("")
    };
    goog.debug.TextFormatter = function (opt_prefix) {
        goog.debug.Formatter.call(this, opt_prefix)
    };
    goog.inherits(goog.debug.TextFormatter, goog.debug.Formatter);
    goog.debug.TextFormatter.prototype.formatRecord = function (logRecord) {
        var sb = [];
        sb.push(this.prefix_, " ");
        if (this.showAbsoluteTime) sb.push("[", goog.debug.Formatter.getDateTimeStamp_(logRecord), "] ");
        if (this.showRelativeTime) sb.push("[", goog.debug.Formatter.getRelativeTime_(logRecord, this.startTimeProvider_.get()), "s] ");
        if (this.showLoggerName) sb.push("[", logRecord.getLoggerName(), "] ");
        if (this.showSeverityLevel) sb.push("[", logRecord.getLevel().name, "] ");
        sb.push(logRecord.getMessage(), "\n");
        if (this.showExceptionText &&
            logRecord.getException()) sb.push(logRecord.getExceptionText(), "\n");
        return sb.join("")
    };
    goog.provide("goog.structs.CircularBuffer");
    goog.structs.CircularBuffer = function (opt_maxSize) {
        this.maxSize_ = opt_maxSize || 100;
        this.buff_ = []
    };
    goog.structs.CircularBuffer.prototype.nextPtr_ = 0;
    goog.structs.CircularBuffer.prototype.add = function (item) {
        this.buff_[this.nextPtr_] = item;
        this.nextPtr_ = (this.nextPtr_ + 1) % this.maxSize_
    };
    goog.structs.CircularBuffer.prototype.get = function (index) {
        index = this.normalizeIndex_(index);
        return this.buff_[index]
    };
    goog.structs.CircularBuffer.prototype.set = function (index, item) {
        index = this.normalizeIndex_(index);
        this.buff_[index] = item
    };
    goog.structs.CircularBuffer.prototype.getCount = function () {
        return this.buff_.length
    };
    goog.structs.CircularBuffer.prototype.isEmpty = function () {
        return this.buff_.length == 0
    };
    goog.structs.CircularBuffer.prototype.clear = function () {
        this.buff_.length = 0;
        this.nextPtr_ = 0
    };
    goog.structs.CircularBuffer.prototype.getValues = function () {
        return this.getNewestValues(this.getCount())
    };
    goog.structs.CircularBuffer.prototype.getNewestValues = function (maxCount) {
        var l = this.getCount();
        var start = this.getCount() - maxCount;
        var rv = [];
        for (var i = start; i < l; i++) rv[i] = this.get(i);
        return rv
    };
    goog.structs.CircularBuffer.prototype.getKeys = function () {
        var rv = [];
        var l = this.getCount();
        for (var i = 0; i < l; i++) rv[i] = i;
        return rv
    };
    goog.structs.CircularBuffer.prototype.containsKey = function (key) {
        return key < this.getCount()
    };
    goog.structs.CircularBuffer.prototype.containsValue = function (value) {
        var l = this.getCount();
        for (var i = 0; i < l; i++)
            if (this.get(i) == value) return true;
        return false
    };
    goog.structs.CircularBuffer.prototype.getLast = function () {
        if (this.getCount() == 0) return null;
        return this.get(this.getCount() - 1)
    };
    goog.structs.CircularBuffer.prototype.normalizeIndex_ = function (index) {
        if (index >= this.buff_.length) throw Error("Out of bounds exception");
        if (this.buff_.length < this.maxSize_) return index;
        return (this.nextPtr_ + Number(index)) % this.maxSize_
    };
    goog.provide("goog.debug.DebugWindow");
    goog.require("goog.debug.HtmlFormatter");
    goog.require("goog.debug.LogManager");
    goog.require("goog.structs.CircularBuffer");
    goog.require("goog.userAgent");
    goog.debug.DebugWindow = function (opt_identifier, opt_prefix) {
        this.identifier_ = opt_identifier || "";
        this.prefix_ = opt_prefix || "";
        this.outputBuffer_ = [];
        this.savedMessages_ = new goog.structs.CircularBuffer(goog.debug.DebugWindow.MAX_SAVED);
        this.publishHandler_ = goog.bind(this.addLogRecord, this);
        this.formatter_ = new goog.debug.HtmlFormatter(this.prefix_);
        this.filteredLoggers_ = {};
        this.setCapturing(true);
        this.enabled_ = goog.debug.DebugWindow.isEnabled(this.identifier_);
        goog.global.setInterval(goog.bind(this.saveWindowPositionSize_,
            this), 7500)
    };
    goog.debug.DebugWindow.MAX_SAVED = 500;
    goog.debug.DebugWindow.COOKIE_TIME = 30 * 24 * 60 * 60 * 1E3;
    goog.debug.DebugWindow.prototype.welcomeMessage = "LOGGING";
    goog.debug.DebugWindow.prototype.enableOnSevere_ = false;
    goog.debug.DebugWindow.prototype.win_ = null;
    goog.debug.DebugWindow.prototype.winOpening_ = false;
    goog.debug.DebugWindow.prototype.isCapturing_ = false;
    goog.debug.DebugWindow.showedBlockedAlert_ = false;
    goog.debug.DebugWindow.prototype.bufferTimeout_ = null;
    goog.debug.DebugWindow.prototype.lastCall_ = goog.now();
    goog.debug.DebugWindow.prototype.setWelcomeMessage = function (msg) {
        this.welcomeMessage = msg
    };
    goog.debug.DebugWindow.prototype.init = function () {
        if (this.enabled_) this.openWindow_()
    };
    goog.debug.DebugWindow.prototype.isEnabled = function () {
        return this.enabled_
    };
    goog.debug.DebugWindow.prototype.setEnabled = function (enable) {
        this.enabled_ = enable;
        if (this.enabled_) this.openWindow_();
        this.setCookie_("enabled", enable ? "1" : "0")
    };
    goog.debug.DebugWindow.prototype.setForceEnableOnSevere = function (enableOnSevere) {
        this.enableOnSevere_ = enableOnSevere
    };
    goog.debug.DebugWindow.prototype.isCapturing = function () {
        return this.isCapturing_
    };
    goog.debug.DebugWindow.prototype.setCapturing = function (capturing) {
        if (capturing == this.isCapturing_) return;
        this.isCapturing_ = capturing;
        var rootLogger = goog.debug.LogManager.getRoot();
        if (capturing) rootLogger.addHandler(this.publishHandler_);
        else rootLogger.removeHandler(this.publishHandler_)
    };
    goog.debug.DebugWindow.prototype.getFormatter = function () {
        return this.formatter_
    };
    goog.debug.DebugWindow.prototype.setFormatter = function (formatter) {
        this.formatter_ = formatter
    };
    goog.debug.DebugWindow.prototype.addSeparator = function () {
        this.write_("<hr>")
    };
    goog.debug.DebugWindow.prototype.hasActiveWindow = function () {
        return !!this.win_ && !this.win_.closed
    };
    goog.debug.DebugWindow.prototype.clear_ = function () {
        this.savedMessages_.clear();
        if (this.hasActiveWindow()) this.writeInitialDocument_()
    };
    goog.debug.DebugWindow.prototype.addLogRecord = function (logRecord) {
        if (this.filteredLoggers_[logRecord.getLoggerName()]) return;
        var html = this.formatter_.formatRecord(logRecord);
        this.write_(html);
        if (this.enableOnSevere_ && logRecord.getLevel().value >= goog.debug.Logger.Level.SEVERE.value) this.setEnabled(true)
    };
    goog.debug.DebugWindow.prototype.write_ = function (html) {
        if (this.enabled_) {
            this.openWindow_();
            this.savedMessages_.add(html);
            this.writeToLog_(html)
        }
        else this.savedMessages_.add(html)
    };
    goog.debug.DebugWindow.prototype.writeToLog_ = function (html) {
        this.outputBuffer_.push(html);
        goog.global.clearTimeout(this.bufferTimeout_);
        if (goog.now() - this.lastCall_ > 750) this.writeBufferToLog_();
        else this.bufferTimeout_ = goog.global.setTimeout(goog.bind(this.writeBufferToLog_, this), 250)
    };
    goog.debug.DebugWindow.prototype.writeBufferToLog_ = function () {
        this.lastCall_ = goog.now();
        if (this.hasActiveWindow()) {
            var body = this.win_.document.body;
            var scroll = body && body.scrollHeight - (body.scrollTop + body.clientHeight) <= 100;
            this.win_.document.write(this.outputBuffer_.join(""));
            this.outputBuffer_.length = 0;
            if (scroll) this.win_.scrollTo(0, 1E6)
        }
    };
    goog.debug.DebugWindow.prototype.writeSavedMessages_ = function () {
        var messages = this.savedMessages_.getValues();
        for (var i = 0; i < messages.length; i++) this.writeToLog_(messages[i])
    };
    goog.debug.DebugWindow.prototype.openWindow_ = function () {
        if (this.hasActiveWindow() || this.winOpening_) return;
        var winpos = this.getCookie_("dbg", "0,0,800,500").split(",");
        var x = Number(winpos[0]);
        var y = Number(winpos[1]);
        var w = Number(winpos[2]);
        var h = Number(winpos[3]);
        this.winOpening_ = true;
        this.win_ = window.open("", this.getWindowName_(), "width=" + w + ",height=" + h + ",toolbar=no,resizable=yes," + "scrollbars=yes,left=" + x + ",top=" + y + ",status=no,screenx=" + x + ",screeny=" + y);
        if (!this.win_)
            if (!this.showedBlockedAlert_) {
                alert("Logger popup was blocked");
                this.showedBlockedAlert_ = true
            }
        this.winOpening_ = false;
        if (this.win_) this.writeInitialDocument_()
    };
    goog.debug.DebugWindow.prototype.getWindowName_ = function () {
        return goog.userAgent.IE ? this.identifier_.replace(/[\s\-\.\,]/g, "_") : this.identifier_
    };
    goog.debug.DebugWindow.prototype.getStyleRules = function () {
        return "*{font:normal 14px monospace;}" + ".dbg-sev{color:#F00}" + ".dbg-w{color:#E92}" + ".dbg-sh{background-color:#fd4;font-weight:bold;color:#000}" + ".dbg-i{color:#666}" + ".dbg-f{color:#999}" + ".dbg-ev{color:#0A0}" + ".dbg-m{color:#990}"
    };
    goog.debug.DebugWindow.prototype.writeInitialDocument_ = function () {
        if (this.hasActiveWindow()) return;
        this.win_.document.open();
        var html = "<style>" + this.getStyleRules() + "</style>" + '<hr><div class="dbg-ev" style="text-align:center">' + this.welcomeMessage + "<br><small>Logger: " + this.identifier_ + "</small></div><hr>";
        this.writeToLog_(html);
        this.writeSavedMessages_()
    };
    goog.debug.DebugWindow.prototype.setCookie_ = function (key, value) {
        key += this.identifier_;
        document.cookie = key + "=" + encodeURIComponent(value) + ";path=/;expires=" + (new Date(goog.now() + goog.debug.DebugWindow.COOKIE_TIME)).toUTCString()
    };
    goog.debug.DebugWindow.prototype.getCookie_ = function (key, opt_default) {
        return goog.debug.DebugWindow.getCookieValue_(this.identifier_, key, opt_default)
    };
    goog.debug.DebugWindow.getCookieValue_ = function (identifier, key, opt_default) {
        var fullKey = key + identifier;
        var cookie = String(document.cookie);
        var start = cookie.indexOf(fullKey + "=");
        if (start != -1) {
            var end = cookie.indexOf(";", start);
            return decodeURIComponent(cookie.substring(start + fullKey.length + 1, end == -1 ? cookie.length : end))
        }
        else return opt_default || ""
    };
    goog.debug.DebugWindow.isEnabled = function (identifier) {
        return goog.debug.DebugWindow.getCookieValue_(identifier, "enabled") == "1"
    };
    goog.debug.DebugWindow.prototype.saveWindowPositionSize_ = function () {
        if (!this.hasActiveWindow()) return;
        var x = this.win_.screenX || this.win_.screenLeft || 0;
        var y = this.win_.screenY || this.win_.screenTop || 0;
        var w = this.win_.outerWidth || 800;
        var h = this.win_.outerHeight || 500;
        this.setCookie_("dbg", x + "," + y + "," + w + "," + h)
    };
    goog.debug.DebugWindow.prototype.addFilter = function (loggerName) {
        this.filteredLoggers_[loggerName] = 1
    };
    goog.debug.DebugWindow.prototype.removeFilter = function (loggerName) {
        delete this.filteredLoggers_[loggerName]
    };
    goog.debug.DebugWindow.prototype.resetBufferWithNewSize = function (size) {
        if (size > 0 && size < 5E4) {
            this.clear_();
            this.savedMessages_ = new goog.structs.CircularBuffer(size)
        }
    };
    goog.provide("goog.debug.FancyWindow");
    goog.require("goog.debug.DebugWindow");
    goog.require("goog.debug.LogManager");
    goog.require("goog.debug.Logger");
    goog.require("goog.debug.Logger.Level");
    goog.require("goog.dom.DomHelper");
    goog.require("goog.object");
    goog.require("goog.string");
    goog.require("goog.userAgent");
    goog.debug.FancyWindow = function (opt_identifier, opt_prefix) {
        this.readOptionsFromLocalStorage_();
        goog.base(this, opt_identifier, opt_prefix)
    };
    goog.inherits(goog.debug.FancyWindow, goog.debug.DebugWindow);
    goog.debug.FancyWindow.HAS_LOCAL_STORE = function () {
        try {
            return !!window["localStorage"].getItem
        }
        catch (e) {}
        return false
    }();
    goog.debug.FancyWindow.LOCAL_STORE_PREFIX = "fancywindow.sel.";
    goog.debug.FancyWindow.prototype.writeBufferToLog_ = function () {
        this.lastCall_ = goog.now();
        if (this.hasActiveWindow()) {
            var logel = this.dh_.getElement("log");
            var scroll = logel.scrollHeight - (logel.scrollTop + logel.offsetHeight) <= 100;
            for (var i = 0; i < this.outputBuffer_.length; i++) {
                var div = this.dh_.createDom("div", "logmsg");
                div.innerHTML = this.outputBuffer_[i];
                logel.appendChild(div)
            }
            this.outputBuffer_.length = 0;
            this.resizeStuff_();
            if (scroll) logel.scrollTop = logel.scrollHeight
        }
    };
    goog.debug.FancyWindow.prototype.writeInitialDocument_ = function () {
        if (!this.hasActiveWindow()) return;
        var doc = this.win_.document;
        doc.open();
        doc.write(this.getHtml_());
        doc.close();
        (goog.userAgent.IE ? doc.body : this.win_).onresize = goog.bind(this.resizeStuff_, this);
        this.dh_ = new goog.dom.DomHelper(doc);
        this.dh_.getElement("openbutton").onclick = goog.bind(this.openOptions_, this);
        this.dh_.getElement("closebutton").onclick = goog.bind(this.closeOptions_, this);
        this.dh_.getElement("clearbutton").onclick = goog.bind(this.clear_,
            this);
        this.dh_.getElement("exitbutton").onclick = goog.bind(this.exit_, this);
        this.writeSavedMessages_()
    };
    goog.debug.FancyWindow.prototype.openOptions_ = function () {
        var el = this.dh_.getElement("optionsarea");
        el.innerHTML = "";
        var loggers = goog.debug.FancyWindow.getLoggers_();
        var dh = this.dh_;
        for (var i = 0; i < loggers.length; i++) {
            var logger = goog.debug.Logger.getLogger(loggers[i]);
            var curlevel = logger.getLevel() ? logger.getLevel().name : "INHERIT";
            var div = dh.createDom("div", {}, this.getDropDown_("sel" + loggers[i], curlevel), dh.createDom("span", {}, loggers[i] || "(root)"));
            el.appendChild(div)
        }
        this.dh_.getElement("options").style.display =
            "block";
        return false
    };
    goog.debug.FancyWindow.prototype.getDropDown_ = function (id, selected) {
        var dh = this.dh_;
        var sel = dh.createDom("select", {
            "id": id
        });
        var levels = goog.debug.Logger.Level.PREDEFINED_LEVELS;
        for (var i = 0; i < levels.length; i++) {
            var level = levels[i];
            var option = dh.createDom("option", {}, level.name);
            if (selected == level.name) option.selected = true;
            sel.appendChild(option)
        }
        sel.appendChild(dh.createDom("option", {
            "selected": selected == "INHERIT"
        }, "INHERIT"));
        return sel
    };
    goog.debug.FancyWindow.prototype.closeOptions_ = function () {
        this.dh_.getElement("options").style.display = "none";
        var loggers = goog.debug.FancyWindow.getLoggers_();
        var dh = this.dh_;
        for (var i = 0; i < loggers.length; i++) {
            var logger = goog.debug.Logger.getLogger(loggers[i]);
            var sel = dh.getElement("sel" + loggers[i]);
            var level = sel.options[sel.selectedIndex].text;
            if (level == "INHERIT") logger.setLevel(null);
            else logger.setLevel(goog.debug.Logger.Level.getPredefinedLevel(level))
        }
        this.writeOptionsToLocalStorage_();
        return false
    };
    goog.debug.FancyWindow.prototype.resizeStuff_ = function () {
        var dh = this.dh_;
        var logel = dh.getElement("log");
        var headel = dh.getElement("head");
        logel.style.top = headel.offsetHeight + "px";
        logel.style.height = dh.getDocument().body.offsetHeight - headel.offsetHeight - (goog.userAgent.IE ? 4 : 0) + "px"
    };
    goog.debug.FancyWindow.prototype.exit_ = function (e) {
        this.setEnabled(false);
        if (this.win_) this.win_.close()
    };
    goog.debug.FancyWindow.prototype.getStyleRules = function () {
        return goog.base(this, "getStyleRules") + "html,body{height:100%;width:100%;margin:0px;padding:0px;" + "background-color:#FFF;overflow:hidden}" + "*{}" + ".logmsg{border-bottom:1px solid #CCC;padding:2px;font:90% monospace}" + "#head{position:absolute;width:100%;font:x-small arial;" + "border-bottom:2px solid #999;background-color:#EEE;}" + "#head p{margin:0px 5px;}" + "#log{position:absolute;width:100%;background-color:#FFF;}" + "#options{position:absolute;right:0px;width:50%;height:100%;" +
            "border-left:1px solid #999;background-color:#DDD;display:none;" + "padding-left: 5px;font:normal small arial;overflow:auto;}" + "#openbutton,#closebutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:5px;font:x-small arial;}" + "#clearbutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:80px;font:x-small arial;}" + "#exitbutton{text-decoration:underline;color:#00F;cursor:" + "pointer;position:absolute;top:0px;right:50px;font:x-small arial;}" +
            "select{font:x-small arial;margin-right:10px;}" + "hr{border:0;height:5px;background-color:#8c8;color:#8c8;}"
    };
    goog.debug.FancyWindow.prototype.getHtml_ = function () {
        return "" + '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"' + '"http://www.w3.org/TR/html4/loose.dtd">' + "<html><head><title>Logging: " + this.identifier_ + "</title>" + "<style>" + this.getStyleRules() + "</style>" + "</head><body>" + '<div id="log" style="overflow:auto"></div>' + '<div id="head">' + "<p><b>Logging: " + this.identifier_ + "</b></p><p>" + this.welcomeMessage + "</p>" + '<span id="clearbutton">clear</span>' + '<span id="exitbutton">exit</span>' + '<span id="openbutton">options</span>' +
            "</div>" + '<div id="options">' + "<big><b>Options:</b></big>" + '<div id="optionsarea"></div>' + '<span id="closebutton">save and close</span>' + "</div>" + "</body></html>"
    };
    goog.debug.FancyWindow.prototype.writeOptionsToLocalStorage_ = function () {
        if (!goog.debug.FancyWindow.HAS_LOCAL_STORE) return;
        var loggers = goog.debug.FancyWindow.getLoggers_();
        var storedKeys = goog.debug.FancyWindow.getStoredKeys_();
        for (var i = 0; i < loggers.length; i++) {
            var key = goog.debug.FancyWindow.LOCAL_STORE_PREFIX + loggers[i];
            var level = goog.debug.Logger.getLogger(loggers[i]).getLevel();
            if (key in storedKeys)
                if (!level) window.localStorage.removeItem(key);
                else {
                    if (window.localStorage.getItem(key) != level.name) window.localStorage.setItem(key,
                        level.name)
                }
                else if (level) window.localStorage.setItem(key, level.name)
        }
    };
    goog.debug.FancyWindow.prototype.readOptionsFromLocalStorage_ = function () {
        if (!goog.debug.FancyWindow.HAS_LOCAL_STORE) return;
        var storedKeys = goog.debug.FancyWindow.getStoredKeys_();
        for (var key in storedKeys) {
            var loggerName = key.replace(goog.debug.FancyWindow.LOCAL_STORE_PREFIX, "");
            var logger = goog.debug.Logger.getLogger(loggerName);
            var curLevel = logger.getLevel();
            var storedLevel = window.localStorage.getItem(key).toString();
            if (!curLevel || curLevel.toString() != storedLevel) logger.setLevel(goog.debug.Logger.Level.getPredefinedLevel(storedLevel))
        }
    };
    goog.debug.FancyWindow.getStoredKeys_ = function () {
        var storedKeys = {};
        for (var i = 0, len = window.localStorage.length; i < len; i++) {
            var key = window.localStorage.key(i);
            if (key != null && goog.string.startsWith(key, goog.debug.FancyWindow.LOCAL_STORE_PREFIX)) storedKeys[key] = true
        }
        return storedKeys
    };
    goog.debug.FancyWindow.getLoggers_ = function () {
        var loggers = goog.object.getKeys(goog.debug.LogManager.getLoggers());
        loggers.sort();
        return loggers
    };
    goog.provide("sb.util.log");
    goog.require("goog.debug.FancyWindow");
    if (goog.DEBUG) {
        var logWindow = new goog.debug.FancyWindow("main");
        logWindow.setEnabled(true);
        logWindow.init()
    };
    goog.require("sb.Document");
    goog.require("sb.Node");
    goog.require("sb.NodeType");
    goog.require("sb.Arc");
    goog.require("sb.ArcType");
    goog.require("sb.Point");
    goog.require("sb.Box");
    goog.require("sb.io");
    goog.require("sb.sbo.NodeTypeMapping");
    goog.require("sb.sbo.ArcTypeMapping");
    goog.require("sb.util.log");
})();