/* graph.js */
(function(root){

	// First we will include all the useful helper functions

	/**
	 * @desc Make a copy of the object (to avoid over-writing it)
	 */
	function clone(a){ return JSON.parse(JSON.stringify(a)); }

	/**
	 * @desc Remove trailing zeroes after decimal point
	 */
	function clip(a){ return a.replace(/(\.[0-9]+?)0+$/,function(m,p1){return p1;}); }

	/**
	 * @desc Convert a "#xxxxxx" or rgb(r,g,b) colour into an rgba(r,g,b,a)
	 */
	function hex2rgba(c,a){
		a = (a||1);
		if(c.indexOf("rgba")==0) return c;
		else if(c.indexOf("rgb(")==0) return c.replace(/(.*)\)/,function(m,p1){ return p1+","+a+")"; });
		else if(c.indexOf('#')==0) return 'rgba('+parseInt(c.substr(1,2),16)+','+parseInt(c.substr(3,2),16)+','+parseInt(c.substr(5,2),16)+','+a+')';
		return "";
	}

	var hasbig = false;
	if(typeof Big==="function") hasbig = true;

	/**
	 * @desc Basic wrapper around big.js to avoid problems and add features
	 */
	function Num(v){
		/**
		 * @desc Create an object that has similar properties to Big
		 */
		function N(v){
			this.type = "Num";
			this.o = v;
			this.v = (hasbig ? new Big(v==null ? 0 : v) : parseFloat(v));
			this.toValue = function(){ return Number(this.v.toString()); };
			this.toString = function(){ return clip(typeof this.o=="string" ? this.o : this.o.toString()); };
			this.toExponential = function(dp){ return this.v.toExponential(dp); };

			return this;
		}
		// Boolean results
		N.prototype.eq = function(b){ return this.v.eq(b); };
		N.prototype.gt = function(b){ return this.v.gt(b); };
		N.prototype.gte = function(b){ return this.v.gte(b); };
		N.prototype.lt = function(b){ return this.v.lt(b); };
		N.prototype.lte = function(b){ return this.v.lte(b); };

		// Return a Num type
		N.prototype.abs = function(){ return Num(this.v.abs()); };
		N.prototype.plus = function(n){ return Num(this.v.plus(n)); };
		N.prototype.minus = function(n){ return Num(this.v.minus(n)); };
		N.prototype.div = function(n){ return Num(this.v.div(n)); };
		N.prototype.times = function(n){ return Num(this.v.times(n)); };
		N.prototype.pow = function(n){ return Num(this.v.pow(n)); };
		N.prototype.pow10 = function(n){ var b = Num(this); b.v.e += n; return b; };
		N.prototype.round = function(dp,t){ return Num(this.v.round(dp,(typeof t==="number" ? t:1))); };
		N.prototype.floor = function(dp){ return Num(this.v.round(dp,0)); };
		N.prototype.ceil = function(dp){ return Num(this.v.round(dp,3)); };

		return new N(v);
	}
	root.Num = Num;

	/*@cc_on
	// Fix for IE's inability to handle arguments to setTimeout/setInterval
	// From http://webreflection.blogspot.com/2007/06/simple-settimeout-setinterval-extra.html
	(function(f){
		window.setTimeout =f(window.setTimeout);
		window.setInterval =f(window.setInterval);
	})(function(f){return function(c,t){var a=[].slice.call(arguments,2);return f(function(){c.apply(this,a)},t)}});
	@*/

	// Full Screen API - http://johndyer.name/native-fullscreen-javascript-api-plus-jquery-plugin/
	var fullScreenApi = {
		supportsFullScreen: false,
		isFullScreen: function() { return false; },
		requestFullScreen: function() {},
		cancelFullScreen: function() {},
		fullScreenEventName: '',
		prefix: ''
	},
	browserPrefixes = 'webkit moz o ms khtml'.split(' ');
	// check for native support
	if(typeof document.cancelFullScreen != 'undefined') fullScreenApi.supportsFullScreen = true;
	else{
		// check for fullscreen support by vendor prefix
		for(var i = 0, il = browserPrefixes.length; i < il; i++ ) {
			fullScreenApi.prefix = browserPrefixes[i];
			if(typeof document[fullScreenApi.prefix + 'CancelFullScreen' ] != 'undefined' ) {
				fullScreenApi.supportsFullScreen = true;
				break;
			}
		}
	}
	// update methods to do something useful
	if(fullScreenApi.supportsFullScreen) {
		fullScreenApi.fullScreenEventName = fullScreenApi.prefix + 'fullscreenchange';
		fullScreenApi.isFullScreen = function() {
			switch (this.prefix) {
				case '':
					return document.fullScreen;
				case 'webkit':
					return document.webkitIsFullScreen;
				default:
					return document[this.prefix + 'FullScreen'];
			}
		};
		fullScreenApi.requestFullScreen = function(el){ return (this.prefix === '') ? el.requestFullScreen() : el[this.prefix + 'RequestFullScreen'](); };
		fullScreenApi.cancelFullScreen = function(el){ return (this.prefix === '') ? document.cancelFullScreen() : document[this.prefix + 'CancelFullScreen'](); };
		fullScreenApi.element = function(){ return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement; };
	}
	// export api
	root.fullScreenApi = fullScreenApi;
	// End of Full Screen API

	// Extra mathematical/helper functions that will be useful - inspired by http://alexyoung.github.com/ico/
	var G = {};
	G.sum = function(a) { var i, sum; for (i = 0, sum = 0; i < a.length; sum += a[i++]){} return sum; };
	if(typeof Array.prototype.max === 'undefined') G.max = function(a) { return Math.max.apply({}, a); };
	else G.max = function(a) { return a.max(); };
	if(typeof Array.prototype.min === 'undefined') G.min = function(a) { return Math.min.apply({}, a); };
	else G.min = function(a) { return a.min(); };
	G.mean = function(a) { return G.sum(a) / a.length; };
	G.deepExtend = function(out){
		out = out || {};
		for(var i = 1; i < arguments.length; i++){
			var obj = arguments[i];
			if(!obj) continue;

			for(var key in obj){
				if(obj.hasOwnProperty(key)){
					if(typeof obj[key] === 'object') out[key] = G.deepExtend(out[key], obj[key]);
					else out[key] = obj[key];
				}
			}
		}
		return out;
	};
	G.extend = function(out){
		out = out || {};
		for(var i = 1; i < arguments.length; i++){
			if(!arguments[i]) continue;
			for(var key in arguments[i]){
				if (arguments[i].hasOwnProperty(key)) out[key] = arguments[i][key];
			}
		}
		return out;
	};

	/**
	 * @desc Define a shortcut for checking variable types
	 */
	function is(a,b){ return (typeof a == b) ? true : false; }

	/**
	 * @desc Fill a number with zeroes
	 */
	function zeroFill(number, width){
		width -= number.toString().length;
		if(width > 0) return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
		return number + ""; // always return a string
	}

	/**
	 * @desc A non-jQuery dependent function to get a style
	 */
	function getStyle(el, styleProp) {
		if (typeof window === 'undefined') return;
		var style;
		if(!el) return style;
		if (el.currentStyle) style = el.currentStyle[styleProp];
		else if (window.getComputedStyle) style = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		if (style && style.length === 0) style = null;
		return style;
	}

	/**
	 * @desc Update an event with touches
	 */
	function updateEvent(e,touches){
		var el,oe,x,y,i,rect,bRect;
		el = e.currentTarget;
		oe = clone(e.originalEvent);
		x = [];
		y = [];
		for(i = 0; i < touches.length; i++){ x.push(touches[i].pageX); y.push(touches[i].pageY); }
		oe.layerX = G.mean(x)-el.offsetLeft;
		oe.layerY = G.mean(y)-el.offsetTop;
		oe.offsetX = el.offsetLeft;
		oe.offsetY = el.offsetTop;
		bRect = document.body.getBoundingClientRect();
		rect = el.getBoundingClientRect();
		oe.layerX -= (rect.left-bRect.left);
		oe.layerY -= (rect.top-bRect.top);
		return oe;
	}

	// End of helper functions


	/**
	 * @desc Define the class to deal with <code>canvas</code>.
	 * @param {HTMLelement} container - the container to create a canvas within
	 * @param {object} i - properties for the canvas
	 * @param {boolean} i.logging - do we log to the console?
	 * @param {number} i.width - the width of the canvas
	 * @param {number} i.height - the height of the canvas
	 * @param {boolean} i.fullscreen - is the canvas full screen?
	 * @param {boolean} i.fullwindow - is the canvas full window?
	 * @param {number} i.scale - how much to scale the pixels by
	 */
	function Canvas(container,i){

		if(!i) i = {};

		// Define default values
		var wide = 0;
		var tall = 0;
		var fullwindow = false;
		var fullscreen = false;
		var events = {resize:""};	// Let's add some default events
		var logging = false;
		var logtime = false;
		var scale = 1;

		// Overwrite defaults with variables passed to the function
		var n = "number";
		var t = "string";
		var b = "boolean";
		if(is(i.logging,b)) logging = i.logging;
		if(is(i.logtime,b)) logtime = i.logtime;
		if(is(i.width,n)) wide = i.width;
		if(is(i.height,n)) tall = i.height;
		if(is(i.fullwindow,b)) fullwindow = i.fullwindow;
		if(is(i.scale,n)) scale = i.scale;

		var log = new Logger({'id':'Canvas','logging':logging,'logtime':logtime});

		if(typeof container!=="object"){
			log.error('No container provided');
			return;
		}

		// Define the 3D shaders
		this.shaders = {
			// Todo:
			//		- Add sprites for highlighted version
			// 		- Also set a highlighted uPointSize
			'sprite': {
				'vertex': {'src':`
					attribute vec2 aVertexPosition;	// position of sprite
					attribute float aVertexIndex;	// id of the sprite
					uniform mat3 uMatrix;
					uniform float uPointSize;
					uniform bool uYLog;
					uniform float uYLogMin;
					uniform float uYLogMax;

					vec2 posV;

					float log10(float v){
						return log(v)/2.302585092994046;
					}

					void main() {
						posV = (uMatrix * vec3(aVertexPosition, 1)).xy;
						if(uYLog){
							//range = uYLogMax - uYLogMin;
							//if(posV.y > 0.0) posV.y = log10(posV.y)/range;
							//else posV.y = -2.0;
						}
						gl_Position = vec4(posV, 0.1, 1);

						// To do: send a boolean into the fragment shader to say if the point is highlighted or not
						//if(aVertexIndex == 8.0){
						//	gl_PointSize = 0.0;
						//}else{
							gl_PointSize = uPointSize;
						//}
					}`
				},
				'fragment':	{'src':`
					#ifdef GL_ES
					precision highp float;
					#endif
					uniform sampler2D uTexture;	// texture we are drawing
					void main() {
						gl_FragColor = texture2D(uTexture, gl_PointCoord);
					}`
				}
			},
			// Todo:
			//		- Set highlighted uColor
			// 		- Set highlighted uPointSize
			'point': {
				'vertex': {'src':`
					attribute vec2 aVertexPosition;	// position of point
					attribute float aVertexIndex;	// id of the point
					uniform mat3 uMatrix;
					uniform float uPointSize;
					uniform bool uYLog;
					uniform float uYLogMin;
					uniform float uYLogMax;

					vec2 posV;

					float log10(float v){
						return log(v)/2.302585092994046;
					}

					void main() {
						posV = (uMatrix * vec3(aVertexPosition, 1)).xy;
						if(uYLog){
							//range = uYLogMax - uYLogMin;
							//if(posV.y > 0.0) posV.y = log10(posV.y)/range;
							//else posV.y = -2.0;
						}
						gl_Position = vec4(posV, 0.1, 1);
					
						// To do: send a boolean into the fragment shader to say if the point is highlighted or not
						if(aVertexIndex == 10.0){
							gl_PointSize = uPointSize*10.0;
						}else{
							gl_PointSize = uPointSize;
						}
					}`
				},
				'fragment':	{'src':`
					#ifdef GL_ES
					precision lowp float;
					#endif
					uniform vec4 uColor;
					void main() {
						gl_FragColor = uColor;
					}`
				}
			},
			// Todo:
			//		- Set highlighted uColor
			// 		- Set highlighted uSize
			'thickline': {
				'vertex': {'src':`
					attribute vec2 aVertexPosition;	// position of vertex
					attribute vec2 aNormalPosition;	// position of normal
					attribute float aVertexIndex;	// id of the line
					uniform mat3 uMatrix;
					uniform bool uYLog;
					uniform float uYLogMin;
					uniform float uYLogMax;
					uniform float uStrokeWidth;
					uniform vec2 uSize;
					uniform bool uXaxis;
					uniform bool uYaxis;

					vec2 posV;
					vec2 posN;
					float scale_x;
					float scale_y;
					float new_x;
					float new_y;

					void main() {
						// Convert line width to final coords space in x and y
						scale_x = uStrokeWidth / uSize.x;
						scale_y = uStrokeWidth / uSize.y;

						posV = (uMatrix * vec3(aVertexPosition, 1)).xy;
						posN = aNormalPosition;

						// If we've defined a rule we need to stretch out the line to fill the screen
						if(uXaxis) posV.x = (aVertexPosition.x == 0.0 ? -1.0 : 1.0);
						if(uYaxis) posV.y = (aVertexPosition.y == 0.0 ? -1.0 : 1.0);

						gl_Position = vec4(posV.x + posN.x * scale_x, posV.y + posN.y * scale_y, 1.0, 1.0);
						if(aVertexIndex == 10.0){}
					}`
				},
				'fragment':	{'src':`
					#ifdef GL_ES
					precision lowp float;
					#endif
					uniform vec4 uColor;
					void main(void) {
						gl_FragColor = uColor;
					}`
				}
			},
			// Todo:
			//		- Set highlighted uColor
			'thinline': {
				'vertex': {'src':`
					attribute vec2 aVertexPosition;	// position of vertex
					attribute float aVertexIndex;	// id of the line
					uniform mat3 uMatrix;
					uniform bool uXaxis;
					uniform bool uYaxis;
					vec2 posV;

					void main() {
						posV = (uMatrix * vec3(aVertexPosition, 1)).xy;

						// If we've defined a rule we need to stretch out the line to fill the screen
						if(uXaxis) posV.x = (aVertexPosition.x == 0.0 ? -1.0 : 1.0);
						if(uYaxis) posV.y = (aVertexPosition.y == 0.0 ? -1.0 : 1.0);

						gl_Position = vec4(posV, 1.0, 1);
						if(aVertexIndex == 10.0){}
					}`
				},
				'fragment':	{'src':`
					#ifdef GL_ES
					precision lowp float;
					#endif
					uniform vec4 uColor;
					void main(void) {
						gl_FragColor = uColor;
					}`
				}
			},
			// Todo:
			//		- Set highlighted uColor
			'area': {
				'vertex': {'src':`
					attribute vec2 aVertexPosition;	// position of vertex
					attribute float aVertexIndex;	// id of the area
					uniform mat3 uMatrix;
					uniform bool uYLog;
					uniform float uYLogMin;
					uniform float uYLogMax;
					vec2 posV;

					void main() {
						posV = (uMatrix * vec3(aVertexPosition, 1)).xy;
						gl_Position = vec4(posV, 1.0, 1);
						if(aVertexIndex == 10.0){}
					}`
				},
				'fragment':	{'src':`
					#ifdef GL_ES
					precision lowp float;
					#endif
					uniform vec4 uColor;
					void main(void) {
						gl_FragColor = uColor;
					}`
				}
			}
		}

		/**
		 * @desc Function to find the canvas scale
		 */
		this.getScale = function(){ return scale; }

		/**
		 * @desc Function to find HTML elements
		 */
		this.find = function(str){ return container.find(str); }

		this.getStyle = function(sty){ return getStyle(container[0],sty); }

		/**
		 * @desc Function to update the internal variables defining the width and height.
		 */
		this.setWH = function(w,h){
			log.message('setWH',w,h);
			if(!w || !h) return;
			// Set virtual pixel scale
			scale = window.devicePixelRatio;
			for(var i = 0; i < canvas.length; i++){
				canvas[i].width = w*scale;
				canvas[i].height = h*scale;
			}
			wide = w;
			tall = h;

			// Normalize coordinate system to use css pixels.
			if(this.layers && this.layers.front.ctx) this.layers.front.ctx.scale(scale,scale);

			// Set CSS size
			this.holder.css({'width':w+'px','height':h+'px'});
			canvas.css({'width':w+'px','height':h+'px'});
		};

		// Construct the <canvas> container
		var container = S(container);
		if(container[0].nodeName!=="DIV") container = container.replaceWith('<div></div>');
		if(container.length == 0){
			log.error('No valid container provided');
			return;
		}
		container.css({'position':'relative','width':wide,'height':tall});
		// We'll need to change the sizes when the window changes size
		var _obj = this;
		root.addEventListener('resize',function(e){ _obj.resize(); });

		// If the Javascript function has been passed a width/height
		// those take precedence over the CSS-set values
		if(wide > 0) container.css({'width':wide+'px'});
		wide = container.width();
		if(tall > 0) container.css({'height':tall+'px'});
		tall = container.height();

		this.layers = {'back':{'type':'2d'},'threeD':{'type':'webgl'},'front':{'type':'2d'}};

		var str = '';
		for(var l in this.layers){
			if(this.layers[l]) str += '<canvas class="canvas canvas-'+this.layers[l].type+'" data="'+l+'" style="display:block;font:inherit;position:absolute;"></canvas>';
		}
		// Add each <canvas> to it
		container.html('<div class="canvasholder">'+str+'</div>');

		var containerbg = container.css('background');
		this.holder = container.find('.canvasholder');
		var canvas = container.find('.canvas');
		
		this.holder.css({'position':'relative'});

		if(canvas && canvas[0].getContext){

			this.setWH(wide,tall);

			for(var c = 0; c < canvas.length; c++){
				l = canvas[c].getAttribute('data');
				this.layers[l].canvas = canvas[c];
				if(this.layers[l].type=="2d"){
					this.layers[l].ctx = canvas[c].getContext(this.layers[l].type);
					this.layers[l].ctx.clearRect(0,0,wide*scale,tall*scale);
					if(l=="front"){
						this.layers[l].ctx.beginPath();
						var fs = 16;
						this.layers[l].ctx.font = fs+"px sans-serif";
						this.layers[l].ctx.fillStyle = 'rgb(0,0,0)';
						this.layers[l].ctx.lineWidth = 1.5;
						var loading = 'Loading graph...';
						this.layers[l].ctx.fillText(loading,(wide-this.layers[l].ctx.measureText(loading).width)/2,(tall-fs)/2);
						this.layers[l].ctx.fill();
					}
				}else{
					// Create the 3D canvas
					try {
						this.layers[l].canvas = canvas[c];
						this.layers[l].ctx = canvas[c].getContext("webgl",{ premultipliedAlpha: true });
					}catch(x){
						this.layers[l].ctx = null;
						S(canvas[c]).remove();
						delete this.layers[l].canvas;
					}
					if(this.layers[l].ctx){
						function compileShader(ctx, typ, attr){
							let type = (typ=="vertex") ? ctx.VERTEX_SHADER : ctx.FRAGMENT_SHADER;
							let code = attr.src;
							let shader = ctx.createShader(type);
							ctx.shaderSource(shader, code+'');
							ctx.compileShader(shader);
							if(!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
								log.error(`Error compiling ${typ} shader:`);
								log.message(ctx.getShaderInfoLog(shader));
							}
							return shader;
						}

						log.time("buildShaders");
						for(t in this.shaders){
							for(s in this.shaders[t]) this.shaders[t][s].shader = compileShader(this.layers[l].ctx, s, this.shaders[t][s]);
						}
						log.time("buildShaders");
					}
				}
			}
		}

		// Bind events
		canvas.on("mousedown",{me:this}, function(e){ e.data.me.trigger("mousedown",{event:e}); });
		canvas.on("mousemove",{me:this}, function(e){ e.data.me.trigger("mousemove",{event:e}); });
		canvas.on("mouseup",{me:this}, function(e){ e.data.me.trigger("mouseup",{event:e}); });
		canvas.on("mouseover",{me:this}, function(e){ e.data.me.trigger("mouseover",{event:e}); });
		canvas.on("mouseleave",{me:this}, function(e){ e.data.me.trigger("mouseleave",{event:e}); });
		this.holder.on("wheel",{me:this}, function(e){ e.data.me.trigger("wheel",{event:e}); });
		if('ontouchstart' in document.documentElement){
			var olddist = null;
			this.holder.on("touchstart",{me:this}, function(e){
				var ev = e.originalEvent;
				ev.preventDefault();
				olddist = null;
				var touches = ev.touches;
				if(touches && touches.length==1){
					// One touch maps to pan (mousedown)
					e.originalEvent = updateEvent(e,touches);
					e.originalEvent.which = 1;
					e.data.me.trigger("mousedown",{event:e});
					e.data.me.trigger("mouseover",{event:e});
				}
			});
			var lastevent = null;
			this.holder.on("touchmove",{me:this}, function(e){
				e.originalEvent.preventDefault();
				var g = e.data.me;
				var touches = e.originalEvent.touches;

				var m = (touches ? touches.length:0);
				e.originalEvent = updateEvent(e,touches);

				// Keep a copy of the event for the touchend event
				lastevent = e.originalEvent;
				if(typeof g.updating!=="boolean") g.updating = false;
				if(!g.updating){
					if(m == 1){
						// One touch maps to pan (mousemove)
						e.originalEvent.which = 1;
						g.trigger("mousemove",{event:e});
					}else if(m == 2){
						var dist = Math.hypot(touches[0].pageX - touches[1].pageX,touches[0].pageY - touches[1].pageY);
						// Multi-touch maps to zoom (wheel)
						e.originalEvent.deltaY = (olddist ? (dist > olddist ? -1 : 1):-1);
						if(Math.abs(dist-olddist) > 4){
							g.trigger("wheel",{event:e,'speed':0.95,'update':false});
							olddist = dist;
						}
					}
				}
			});
			this.holder.on("touchend",{me:this}, function(e){
				var ev = e.originalEvent;
				ev.preventDefault();
				var touches = ev.touches;
				var event = e;
				if(touches){
					// One touch maps to pan (mousedown)
					if(touches.length > 0) e.originalEvent = updateEvent(e,touches);
					e.originalEvent.which = 1;
				}else event = lastevent;
				e.data.me.trigger("mouseup",{event:event});
			});
		}
		if(fullScreenApi.supportsFullScreen){
			document.addEventListener(fullScreenApi.fullScreenEventName, function(event){
				fullscreen = (container[0] == fullScreenApi.element());
			});
		}
		
		/**
		 * @desc Attach a handler to an event for the Canvas object
		 * @usage canvas.on(eventType[,eventData],handler(eventObject));
		 * @usage canvas.on("resize",function(e){ console.log(e); });
		 * @usage canvas.on("resize",{me:this},function(e){ console.log(e.data.me); });
		 * @param {string} ev - the event type
		 * @param {object} e - any properties to add to the output as e.data
		 * @param {function} fn - a callback function
		 */
		this.on = function(ev,e,fn){
			if(typeof ev!="string") return this;
			if(is(fn,"undefined")){
				fn = e;
				e = {};
			}else{
				e = {data:e};
			}
			if(typeof e!="object" || typeof fn!="function") return this;
			if(events[ev]) events[ev].push({e:e,fn:fn});
			else events[ev] = [{e:e,fn:fn}];
			return this;
		}

		/**
		 * @desc Trigger a defined event with arguments. This is for internal-use to be sure to include the correct arguments for a particular event
		 */
		this.trigger = function(ev,args){
			if(typeof ev != "string") return;
			if(typeof args != "object") args = {};
			var o = [];
			if(typeof events[ev]=="object"){
				for(var i = 0 ; i < events[ev].length ; i++){
					var e = G.extend(events[ev][i].e,args);
					if(typeof events[ev][i].fn == "function") o.push(events[ev][i].fn.call(this,e));
				}
			}
			if(o.length > 0) return o;
		};

		var clipboard;
		var clipboardData;
		/**
		 * @desc Copy to the <code>canvas</code> clipboard
		 */
		this.copyToClipboard = function(){
			var x = Math.min(wide,this.layers.front.ctx.canvas.clientWidth)*scale;
			var y = Math.min(tall,this.layers.front.ctx.canvas.clientHeight)*scale;
			log.message('copyToClipboard',x,y,this);
			if(x > 0 && y > 0){
				clipboard = this.layers.front.ctx.getImageData(0, 0, x, y);
				clipboardData = clipboard.data;
			}
			return this;
		};

		/**
		 * @desc Paste from the <code>canvas</code> clipboard onto the canvas
		 */
		this.pasteFromClipboard = function(){
			if(clipboardData){
				clipboard.data = clipboardData;
				this.layers.front.ctx.putImageData(clipboard, 0, 0);
			}
			return this;
		};

		/**
		 * @desc Will toggle the <code>canvas</code> as a full screen element if the browser supports it.
		 */
		this.toggleFullScreen = function(){
			log.message('toggleFullScreen',fullscreen);
			this.elem = container[0];

			if(fullscreen){
				if(document.exitFullscreen) document.exitFullscreen();
				else if(document.mozCancelFullScreen) document.mozCancelFullScreen();
				else if(document.webkitCancelFullScreen) document.webkitCancelFullScreen();
			}else{
				if(this.elem.requestFullscreen) this.elem.requestFullscreen();
				else if(this.elem.mozRequestFullScreen) this.elem.mozRequestFullScreen();
				else if(this.elem.webkitRequestFullscreen) this.elem.webkitRequestFullscreen();
				else if(this.elem.msRequestFullscreen) this.elem.msRequestFullscreen();
			}
			fullscreen = !fullscreen;
			return this;
		};

		/**
		 * @desc A function to be called whenever the <code>canvas</code> needs to be resized.
		 * @usage canvas.resize()
		 * @usage canvas.resize(400,250)
		 */
		this.resize = function(w,h){
			if(!canvas) return;
			if(!w || !h){
				if(fullscreen) container.css({'background':'white'});
				else container.css({'background':containerbg});

				// We have to zap the width of the canvas to let it take the width of the container
				canvas.css({'width':'','height':'','max-width':'100%'});
				if(fullwindow){
					w = window.outerWidth;
					h = window.outerHeight;
					S(document).css({'width':w+'px','height':h+'px'});
				}else{
					// Set a max-width so that it can shrink
					container.css({'max-width':'100%'});
					w = container.outerWidth();
					h = container.outerHeight();
				}
			}
			if(w == wide && h == tall) return;
			this.setWH(w,h);
			// Trigger callback
			this.trigger("resize",{w:w,h:h});
		};

		this.width = function(str){
			return (str=="container") ? container.outerWidth() : wide;
		}

		this.height = function(str){
			return (str=="container") ? container.outerHeight() : tall;
		}

		return this;
	}


	/**
	 * @desc Function for making a graph object
	 * @usage mygraph = new Graph(id, data, options);
	 * @param {HTMLelement} id - the HTML element to attach the canvas to
	 * @param {object} options - contains any customisation options for the graph as a whole e.g. options = { xaxis:{ label:'Time (HJD)' },yaxis: { label: 'Delta (mag)' }};
	 */
	function Graph(element, options){

		if(!options) options = {};

		// Define some variables
		this.version = "0.4.0";
		if(typeof element!="object") return;
		this.marks = {};
		this.chart = {};
		this.options = {};
		this.timeout = {};
		this.selecting = false;
		this.panning = false;
		this.updating = false;
		this.events = [];
		this.lines = [];
		this.ready = true;
		this.fontscale = 1;
		this.quicktime = 75;
		this.colours = ["#a6cee3","#1f78b4","#b2df8a","#33a02c","#fb9a99","#e31a1c","#fdbf6f","#ff7f00","#cab2d6","#6a3d9a","#ffff99","#b15928"];
		this.offset = {'x':0,'y':0,'dx':0,'dy':0};
		this.log = new Logger({'id':'Graph','logging':options.logging,'logtime':options.logtime});
		if(typeof Big==="undefined") this.log.error('ERROR','Unable to find big.js');

		this.log.time("Graph");
		this.log.message('init',element,typeof element,options);

		// Define the drawing canvas
		var opt = {};
		if(options.width) opt.width = options.width;
		if(options.height) opt.height = options.height;
		opt.logging = options.logging;
		opt.logtime = options.logtime;

		this.canvas = new Canvas(element,opt);

		// Temporary canvases for drawing to
		this.paper = {
			'temp': {'c':document.createElement('canvas'),'ctx':''},  // Create a canvas for temporary work
			'data': {'c':document.createElement('canvas'),'ctx':''}   // Create a canvas to draw the data to
		};
		function setWH(p,w,h,s){
			p.width = w;
			p.height = h;
			p.scale = s;
			p.c.width = Math.round(w*s);
			p.c.height = Math.round(h*s);
			p.ctx = p.c.getContext('2d');
			p.ctx.scale(s,s);
			return p;
		}
		// Set canvas scaling for retina-type screens
		var s = window.devicePixelRatio;
		// Set properties of the temporary canvases
		for(var p in this.paper){
			if(this.paper[p]) this.paper[p] = setWH(this.paper[p],this.canvas.width(),this.canvas.height(),s);
		}

		// Bind events to the canvas holder
		this.canvas.holder.on("mouseenter",function(ev){ disableScroll(); }).on("mouseleave",function(ev){ enableScroll(); });

		// Bind events to the canvas
		this.canvas.on("resize",{me:this},function(ev){
			// Attach an event to deal with resizing the <canvas>
			var g = ev.data.me;
			var d = new Date();
			var s = window.devicePixelRatio;
			// Resize all the temporary canvases
			for(var p in g.paper){
				if(g.paper[p]) g.paper[p] = setWH(g.paper[p],g.canvas.width(),g.canvas.height(),s);
			}
			g.setOptions().defineAxis("x").setChartOffset().resetDataStyles().redraw({'update':true,'callback':function(){ this.trigger("resize",{event:ev.event}); }});
			g.log.message("Total until end of resize:" + (new Date() - d) + "ms");
		}).on("mousedown",{me:this},function(ev){
			var event,g,x,y,s,d,t,ii,a,m,ds;
			event = ev.event.originalEvent;
			g = ev.data.me;	// The graph object
			if(!g.ready) g.stop();
			if(event.which!=1) return;	// Only zoom on left click

			// Check if there is a data point at the position that the user clicked.
			x = event.layerX-2;
			y = event.layerY-2;
			ds = g.dataAtMousePosition(x,y);

			// No data (but the alt key is pressed) so we'll start the zoom selection
			if(g.within(x,y) && g.options.zoomable){
				g.selectfrom = [x,y];
				g.selectto = clone(g.selectfrom);
				if(event.altKey) g.selecting = true;
				else g.panning = true;
				if(g.coordinates) g.coordinates.css({'display':'none'});
				// Set the panning options now, as we start the pan. This
				// avoids the options changing during the pan which causes jumps.
				if(!g.panoptions) g.panoptions = {};
				g.panoptions.quick = (g.log.metrics.draw.av >= g.quicktime);
			}

			// Loop over the series that match
			m = [];
			var p;
			for(s = 0; s < ds.length; s++){
				d = ds[s].split(":");
				if(d && d.length == 2){
					// This is a data point so we'll trigger the clickpoint event
					t = (d[0]);
					ii = g.getPixPos(x,y);
					p = {'series':t,'title':g.marks[t].title,'color':g.marks[t].color,'xpix':ii[0],'ypix':ii[1]};
					if(d[1]!="*"){
						p.n = parseInt(d[1]);
						p.point = g.marks[t].data[p.n];
					}
					m.push(p);
				}
			}
			a = g.trigger("clickpoint",{event:event,matches:m});
			return true;
		}).on("mousemove",{me:this},function(ev){
			var event,g,x,y,d,t,ii,a,m,ds,p;
			event = ev.event.originalEvent;
			if(!event) return;
			g = ev.data.me;	// The graph object
			if(g.updating) return;
			g.updating = true;
			x = event.layerX-2;	// There seems to be an offset which isn't obvious
			y = event.layerY-2;
			// Attach hover event
			if(!g.selecting && !g.panning && !g.timeout.wheel){
				ds = g.dataAtMousePosition(x,y);
				g.highlight(ds);
				m = [];
				for(var s = 0; s < ds.length; s++){
					d = ds[s].split(":");
					if(d && d.length == 2){
						t = d[0];
						ii = g.getPixPos(x,y);
						p = {'series':t,'title':g.marks[t].title,'color':g.marks[t].color,'xpix':ii[0],'ypix':ii[1]};
						if(d[1]!="*"){
							p.n = parseInt(d[1]);
							p.point = g.marks[t].data[p.n];
						}
						m.push(p);
					}
				}
				a = g.trigger("hoverpoint",{event:event,matches:m});
				if(g.events.mousemove){
					var pos = g.pixel2data(x,y);
					g.trigger("mousemove",{event:event,x:pos.x,y:pos.y});
				}
			}
			if(g.selecting || g.panning){
				if(g.within(x,y)){
					g.selectto = [x,y];
					var to = clone(g.selectto);
					var from = clone(g.selectfrom);

					if(g.options.zoommode == "x"){
						from[1] = g.getPos("y",g.y.min);
						to[1] = g.getPos("y",g.y.max);
					}
					if(g.options.zoommode == "y"){
						from[0] = g.getPos("x",g.x.min);
						to[0] = g.getPos("x",g.x.max);
					}
					if(g.selecting){
						g.canvas.pasteFromClipboard();
						g.canvas.layers.front.ctx.beginPath();
						// Draw selection rectangle
						g.canvas.layers.front.ctx.fillStyle = g.options.grid.colorZoom || 'rgba(0,0,0,0.1)';
						g.canvas.layers.front.ctx.lineWidth = g.options.grid.border;
						g.canvas.layers.front.ctx.fillRect(from[0]-0.5,from[1]-0.5,to[0]-from[0],to[1]-from[1]);
						g.canvas.layers.front.ctx.fill();
						g.canvas.layers.front.ctx.closePath();
					}
					//if(g.panning) g.panBy(to[0]-from[0], to[1]-from[1], g.panoptions);
					if(g.panning){
						// Work out the new range
						var dx = to[0]-from[0];
						var dy = to[1]-from[1];
						var r = g.getDataRange(g.chart.left-dx, g.chart.left+g.chart.width-dx, g.chart.top-dy, g.chart.top+g.chart.height-dy);
						// Zoom to new range
						g.zoom(r,{'update':true});
						g.selectfrom = [x,y];
					}
				}
			}
			g.updating = false;
			return true;
		}).on("mouseleave",{me:this},function(ev){
			var g = ev.data.me;
			var event = ev.event.originalEvent;
			if(event.offsetX >= g.options.width) event.layerX = g.options.width;
			if(event.offsetX <= 0) event.layerX = 0;
			if(event.offsetY >= g.options.height) event.layerY = g.options.height;
			if(event.offsetY <= 0) event.layerY = 0;
			g.canvas.trigger('mousemove',{event:event});
			g.canvas.trigger('mouseup',{event:event});
		}).on("mouseup",{me:this},function(ev){
			var g = ev.data.me;	 // The graph object
			var event = ev.event.originalEvent;
			var r;
			if(g.selecting){
				r = g.getDataRange(g.selectfrom[0],g.selectto[0],g.selectfrom[1],g.selectto[1]);

				// No difference between points - reset view
				if(r[0]==r[1] && r[2]==r[3]) g.zoom();
				else{
					if(g.options.zoommode == "x"){
						// If we are only zooming in the x-axis we don't change the y values
						r[2] = g.y.data.min;
						r[3] = g.y.data.max;
					}
					if(g.options.zoommode == "y"){
						// If we are only zooming in the y-axis we don't change the x values
						r[0] = g.x.data.min;
						r[1] = g.x.data.max;
					}
					g.zoom(r,{'update':true});
				}
				g.selecting = false;
			}
			if(g.panning){
				var dx = event.layerX-g.selectfrom[0];
				var dy = event.layerY-g.selectfrom[1];
				// Update the overall offset for panning/updating
				g.offset.dx += dx;
				g.offset.dy += dy;
				// Work out the new range
				r = g.getDataRange(g.chart.left-dx, g.chart.left+g.chart.width-dx, g.chart.top-dy, g.chart.top+g.chart.height-dy);
				// Zoom to new range
				g.zoom(r,{});
				// Reset the offsets
				g.offset.x = 0;
				g.offset.y = 0;
				g.panning = false;
			}
			g.trigger("mouseup",{event:event});
			return true;
		}).on("wheel",{me:this,options:options},function(ev){
			var oe,g,c,co,f,s;
			oe = ev.event.originalEvent;
			g = ev.data.me;
			if(g.timeout.wheel) clearTimeout(g.timeout.wheel);
			if(!g.updating){
				g.updating = true;
				c = {'x':oe.layerX,'y':oe.layerY};
				co = g.coordinates;
				if(co && co[0] == oe.target){ c.x += co[0].offsetLeft; c.y += co[0].offsetTop; }
				f = (ev.speed || (1 - Math.min(40,Math.abs(oe.deltaY))/250));
				s = (oe.deltaY > 0 ? 1/f : f);
				oe.update = ev.update;
				if(co) co.css({'display':''});
				g.zoom([c.x,c.y],{'quick':(g.log.metrics.draw.av >= g.quicktime),'scalex':(oe.layerX > g.chart.left ? s : 1),'scaley':(oe.layerY < g.chart.top+g.chart.height ? s : 1),'update':false});
				g.trigger('wheel',{event:oe});
				g.updating = false;
			}
			// Set a timeout to trigger a wheelstop event
			g.timeout.wheel = setTimeout(function(e){ g.canvas.trigger('wheelstop',{event:e}); },100,{event:oe});
		}).on("wheelstop",{me:this,options:options},function(ev){
			var g = ev.data.me;
			g.updating = false;
			g.resetDataStyles();
			g.redraw({
				'update':true,
				'callback': function(){
					this.timeout.wheel = undefined;
					this.trigger('wheelstop',{event:ev.event});
				}
			});

		});

		// Extend the options with those provided by the user
		this.setOptions(options);

		// Finally, set the data and update the display
		this.updateData();

		this.log.time("Graph");
		return this;
	}

	/**
	 * @desc Make the graph fullscreen or not
	 */
	Graph.prototype.toggleFullScreen = function(){
		this.canvas.toggleFullScreen();
		return this;
	};

	/**
	 * @desc Attach a handler to an event for the Graph object
	 * @param {string} ev - the event type
	 * @param {object} e - any data to add to e.data
	 * @param {function} fn - the callback function
	 * @usage graph.on(eventType[,eventData],handler(eventObject));
	 * @usage graph.on("resize",function(e){ console.log(e); });
	 * @usage graph.on("resize",{me:this},function(e){ console.log(e.data.me); });
	 */
	Graph.prototype.on = function(ev,e,fn){
		if(typeof ev!="string") return this;
		if(typeof fn=="undefined"){ fn = e; e = {}; }
		else{ e = {data:e}; }
		if(typeof e!="object" || typeof fn!="function") return this;
		if(this.events[ev]) this.events[ev].push({e:e,fn:fn});
		else this.events[ev] = [{e:e,fn:fn}];
		return this;
	};

	/**
	 * @desc Trigger a defined event with arguments. This is for internal-use to be sure to include the correct arguments for a particular event
	 * @param {string} ev - the event to trigger
	 * @param {object} args - any arguments to add to the event
	 */
	Graph.prototype.trigger = function(ev,args){
		if(typeof ev != "string") return;
		if(typeof args != "object") args = {};
		var o = [];
		if(typeof this.events[ev]=="object"){
			for(var i = 0 ; i < this.events[ev].length ; i++){
				var e = G.extend(this.events[ev][i].e,args);
				if(typeof this.events[ev][i].fn == "function") o.push(this.events[ev][i].fn.call(this,e));
			}
		}
		if(o.length > 0) return o;
	};

	/**
	 * @desc Set Options
	 * @param {object} options - set any options
	 * @param {number} options.width - the width of the graph in pixels
	 * @param {number} options.height - the height of the graph in pixels
	 * @param {object} options.grid - properties of the grid
	 * @param {boolean} options.grid.show - Do we show the grid?
	 * @param {number} options.grid.border - the border width in pixels
	 * @param {string} options.grid.color - the color of the border
	 */
	Graph.prototype.setOptions = function(options){
		options = options || {};
		if(typeof this.options!="object") this.options = {};
		// Set the width and height
		this.options.width = this.canvas.width('container');
		this.options.height = this.canvas.height('container');

		// Add user-defined options
		//this.options = Object.assign(this.options, options);
		this.options = G.deepExtend({}, this.options, options);
		// Set defaults for options that haven't already been set
		if(typeof this.options.grid!=="object") this.options.grid = {};
		if(typeof this.options.grid.show!=="boolean") this.options.grid.show = false;
		if(typeof this.options.grid.border!=="number") this.options.grid.border = 1;
		if(typeof this.options.grid.color!=="string") this.options.grid.color = "#888888";
		if(typeof this.options.labels!=="object") this.options.labels = {};
		if(typeof this.options.labels.color!=="string") this.options.labels.color = "black";
		if(typeof this.options.padding!=="number") this.options.padding = 0;
		var k,a,axes;
		// Default axis types see https://vega.github.io/vega/docs/scales/#types
		// We support linear/log/utc/time so far
		var axisdefaults = {
			'type': { 'type': 'string', 'value': ['utc','linear']},
			'label': { 'type':'string', 'value':[''] },
			'fit': { 'type': 'boolean', 'value': [false] },
			'padding': { 'type': 'number', 'value': [0] }
		};
		axes = ['xaxis','yaxis'];
		for(k in axisdefaults){
			//if(typeof this.options[axes[a]]!=="object") this.options[axes[a]] = {};
			if(axisdefaults[k]){
				for(a = 0; a < axes.length; a++){
					if(!this.options[axes[a]]) this.options[axes[a]] = {};
					if(typeof this.options[axes[a]][k]!==axisdefaults[k].type) this.options[axes[a]][k] = axisdefaults[k].value[(axisdefaults[k].value.length==axes.length ? a : 0)];
				}
			}
		}
		if(typeof this.options.zoommode!=="string") this.options.zoommode = "both";
		if(typeof this.options.zoomable!=="boolean") this.options.zoomable = true;
		return this;
	};

	/**
	 * @desc Parse a dataset converting numbers and dates
	 * @param {object} data - the input dataset
	 * @param {array} data.data - the dataset as a 1D array of objects e.g. data.data[i][key]
	 * @param {object} data.parse - each key in the data has a string defining the format e.g. "number", "string", "date", "boolean"  
	 * @param {object} opts - options to customise parsing
	 * @param {boolean} opts.xaxis.highprecision - Do we need to use high precision numbers for dates? 
	 */
	function parseData(data,opts){
		var i,key,v,format,s;
		// Is the xaxis highprecision? We'll cheat here by assuming that only the 
		// xaxis can have this flag and it only applies to format=date
		if(typeof opts.xaxis.highprecision!=="boolean") opts.xaxis.highprecision = false;
		// Parse the data
		for(key in data.parse){
			if(data.parse[key]){
				format = data.parse[key];
				for(i = 0 ; i < data.data.length; i++){
				// Loop over each column in the line
					v = data.data[i][key];

					if(format!="string"){
						// "number", "boolean" or "date" https://github.com/vega/vega/wiki/Data#-csv
						if(format=="number"){
							v = parseFloat(v);
						}else if(format=="date"){
							if(v==null || v=="") v = parseFloat(v);
							else{
								if(opts.xaxis.highprecision){
									// If the 'highprecision' flag is set we treat this as a Big number.
									// Convert to integer seconds since the epoch as a string
									s = Math.floor(new Date(v.replace(/(^"|"$)/,"")).getTime()/1000)+'';
									// Extract anything less than seconds and add it back
									var m = v.match(/\.([0-9]+)/);
									if(m && m.length == 2) s += m[0];
									v = Num(s);	// Convert to Big number (inside our wrapper)
								}else{
									// Otherwise we will just use the date as a standard number
									v = new Date(v.replace(/(^"|"$)/,"")).getTime()/1000;
								}
							}
						}else if(format=="boolean"){
							if(v=="1" || v=="true" || v=="Y") v = true;
							else if(v=="0" || v=="false" || v=="N") v = false;
							else v = null;
						}
					}
					data.data[i][key] = v;
				}
			}
		}
		return data;
	}


	/**
	 * @desc Process a chunk of data
	 * @param {object} attr - the input parameters
	 * @param {array} attr.marks - 
	 * @param {number} attr.i - how far we have got through the marks
	 * @param {object} attr.attr -
	 */
	function processMarksChunk(attr){
		var t,max,chk,i,j,types;
		types = ['symbol','rect','lines','area','rule','text','format'];
		chk = 10000;
		max = Math.min(attr.marks.data.length,attr.i+chk);
		for(i = attr.i; i < max; i++){
			// If we have sent an update function we'll process it as we go
			if(attr.update && i > chk && i % Math.round(attr.total/100) == 0) attr.attr.progress.call((attr.attr['this']||this),{'mark':attr.original,'i':i,'total':attr.total});

			if(!attr.marks.mark[i]) attr.marks.mark[i] = {'props':{},'data':attr.marks.data[i],'original':attr.marks.original[i]};

			for(j = 0; j < types.length; j++){
				t = types[j];
				if(typeof attr.marks.mark[i].props[t]!=="object" && attr.marks[t]) attr.marks.mark[i].props[t] = clone(attr.marks[t]);
			}
		}
		// Should process all the "enter" options here
		if(attr.marks.enter) attr.marks.mark = attr.marks.enter.call(attr['this'],attr.marks.mark,attr.marks.encode.enter);
		attr.i = i;
		if(i < attr.marks.data.length){
			attr['this'].timeout.addMark = setTimeout(processMarksChunk,100,attr);
		}else{
			if(typeof attr.attr.success==="function"){
				attr.attr.i = i;
				attr.attr.total = attr.total;
				attr.attr.success.call((attr.attr['this']||this),attr.attr);
			}
		}
	}

	/**
	 * @desc Add datasets to the graph using parseData() for each one
	 * @param {object} datasets - each dataset has a unique key to refer to it.
	 */
	Graph.prototype.addDatasets = function(datasets){
		this.log.time('addDatasets');
		if(!this.datasets) this.datasets = {};
		for(var id in datasets){
			if(datasets[id]){
				if(!this.datasets[id]){
					this.datasets[id] = parseData(clone(datasets[id]),this.options);
				}
			}
		}
		this.log.time('addDatasets');
		return this;
	};

	/**
	 * @desc Only send one dataset at a time with this function. If an index is provided use it otherwise add sequentially. If a dataset already exists we don't over-write.
	 * @param {object} data - one set of marks to add
	 * @param {number} idx - the index for this set of marks
	 * @param {object} original - a copy of the original properties for this mark set
	 * @param {boolean} original.clip - are the marks clipped to the chart area?
	 * @param {string} original.description - a text-based description for the mark set (doesn't have to be unique).
	 * @param {object} original.encode - VEGA properties for enter, update, and hover e.g. { enter: {…}, update: {…} }
	 * @param {object} original.from - the key for the source of this dataset { data: "62a5a561-c30a-4047-9a78-5c55ab563031" }
	 * @param {boolean} original.include - does this mark set get included in the plot? Useful for turning on/off.
	 * @param {string} original.name - the unique key for this mark set e.g. "69119b81-e09d-47f5-aa44-3d718e5ab494-symbol"
	 * @param {string} original.type - the type of mark e.g. "symbol"
	 * @param {object} attr - some configuration attributes
	 * @param {function} attr.progress - a function called during the creation of the mark set
	 * @param {function} attr.success - a function that is called once the marks are all added
	 * @param {object} attr.this - set the context for the callback
	 */
	Graph.prototype.addMarks = function(data,idx,original,attr){
		var i,total;
		this.log.message('addMarks',idx);
		if(typeof idx!=="number"){
			if(typeof idx==="undefined"){
				// Create an idx
				for(i = 0; i < 200; i++){
					if(typeof this.marks[i]==="undefined"){
						idx = i;
						i = 100;
					}
				}
			}
		}
		attr.name = original.name;

		if(this.marks[idx]) this.log.warning('addMarks','refusing to overwrite existing dataset at '+idx,this.marks[idx],data);
		else {
			this.marks[idx] = parseData(data,this.options);

			// Set the default to show the dataset
			if(typeof this.marks[idx].show!=="boolean") this.marks[idx].show = true;
			if(typeof this.marks[idx].include!=="boolean") this.marks[idx].include = true;
			total = this.marks[idx].data.length;
			this.marks[idx].mark = new Array(total);

			if(!this.marks[idx].type) this.marks[idx].type = "symbol";
			if(!this.marks[idx].format) this.marks[idx].format = { };

			if(this.marks[idx].symbol && !this.marks[idx].symbol.shape) this.marks[idx].symbol.shape = "circle";
			if(typeof this.marks[idx].format.size!=="number") this.marks[idx].format.size = 4;
			if(!this.marks[idx].format.stroke) this.marks[idx].format.stroke = this.colours[0];
			if(!this.marks[idx].format.strokeDash) this.marks[idx].format.strokeDash = [1,0];
			if(typeof this.marks[idx].format.strokeWidth!=="number") this.marks[idx].format.strokeWidth = 0;
			if(!this.marks[idx].format.fill) this.marks[idx].format.fill = this.colours[0];

			// So that we can present a progress bar for big datasets,
			// we'll chunk up the processing into blocks of 5000
			this.timeout.addMark = processMarksChunk({'this':this,'marks':this.marks[idx],'attr':attr,'i':0,'total':total,'original':original,'update':(typeof attr.progress==="function")});
		}
		return this;
	}
	
	
	/**
	 * @desc Create the 3D layers
	 * @param {object} data - one set of marks to add
	 * @param {number} idx - the index for this set of marks
	 */
	Graph.prototype.createLayers = function(){
	
		var i,s,st,t,a,attr,data,l,p,nt,mark;
		
		if(!this.canvas.layers.threeD.ctx){
			this.log.warning('No 3D context exists yet for createLayers()');
			return this;
		}

		this.log.message('createLayers',this.marks);


		if(!this.threeD.layers){
			this.threeD.layers = [];
			this.threeD.layercounter = 0;
		}

		for(i in this.marks){

			// Update marks
			if(this.marks[i].enter) this.marks[i].mark = this.marks[i].enter.call(this,this.marks[i].mark,this.marks[i].encode.enter);
			if(this.marks[i].update) this.marks[i].mark = this.marks[i].update.call(this,this.marks[i].mark,this.marks[i].encode.update);

			mark = this.marks[i].mark[0];

			layer = clone(this.marks[i]);

			layer.source = this.threeD.layercounter;
			data = layer.data;
			attr = {};
			attr.style = layer.format;
			if(mark && mark.props && mark.props.format) attr.style = mark.props.format;
			if(attr.style.stroke) attr.style.strokeStyle = attr.style.stroke;
			if(attr.style.fill) attr.style.fillStyle = attr.style.fill;
			t = layer.type;
			nt = t;

			// Build the primitives that we need to draw for this layer
			primitives = [];
			

			// Update mark values
			var dims = ['x','x1','x2','y','y1','y2'];
			for(j = 0; j < data.length ; j++){
				m = this.marks[i].mark[j];
				p = {};
				for(d = 0; d < dims.length; d++){
					if(data[j][dims[d]]){
						if(typeof data[j][dims[d]]=="number") p[dims[d]] = data[j][dims[d]];
						if(typeof data[j][dims[d]].value=="number") p[dims[d]] = data[j][dims[d]].value;
						else p[dims[d]] = data[j][dims[d]];
					}
				}
				data[j] = p;
			}


			if(t=="symbol"){

				if(layer.size < 1.5) primitives.push({'shader':'point','color':'fillStyle','fn':makePoints});
				else primitives.push({'shader':'sprite','fn':makePoints});

			}else if(t=="rect"){

				// If we have fully defined rectangles (x1, x2, y1, y2)
				if(typeof data[0].x2==="number" && typeof data[0].y2==="number"){
					primitives.push({'shader':'area','color':'fillStyle','fn':makeRectAreas});
					if(attr.style.strokeWidth > 0){
						// Convert the rectangle outlines into triangle strips with normals
						primitives.push({'shader':'thickline','color':'strokeStyle','fn':makeRectOutlines});
					}
					nt = "area";
				}else{

					if(attr.style.width > 0) attr.style.strokeWidth = attr.style.width;
					if(attr.style.strokeWidth > 0){
						// Convert the rectangles into triangle strips with normals
						primitives.push({'shader':'thickline','color':'fillStyle','fn':makeRectLines});
					}
				}

			}else if(t=="line" || t=="rule"){

				// Update mark values
				for(j = 0; j < data.length ; j++){
					p = {};
					if(data[j].x2 && data[j].x2.field && data[j].x2.field.group=="width"){
						data[j].x2 = data[j].x+1;
						attr.style.group = "width";
					}
					if(data[j].y2 && data[j].y2.field && data[j].y2.field.group=="height"){
						data[j].y2 = data[j].y+1;
						attr.style.group = "height";
					}
				}

				if(t=="rule" && data.length==1){
					data = [{'x':data[0].x,'y':data[0].y},{'x':data[0].x2,'y':data[0].y2}];
				}

				if(attr.style.strokeWidth == 1){
					// Simpler line drawing if the width is 1
					primitives.push({'shader':'thinline','color':'strokeStyle','fn':makeThinLines});
				}else{
					// Convert the line into a triangle strip with normals
					primitives.push({'shader':'thickline','color':'strokeStyle','fn':makeThickLines});
				}

			}else if(t=="area"){

				// Create the area as triangles
				primitives.push({'shader':'area','color':'fillStyle','fn':makeAreas});
				if(attr.style.strokeWidth > 0){
					// Convert the boundaries into triangle strips with normals
					primitives.push({'shader':'thickline','color':'strokeStyle', 'fn':makeBoundaries });
				}

			}

			// For each primitive relating to this layer we create a buffer
			if(primitives.length > 0){
				for(p = 0; p < primitives.length; p++){

					// Which shader?
					st = primitives[p].shader;

					l = {'shader':st,'style':clone(attr.style),'source':layer.source,'markID':i};
					if(layer.symbol && typeof layer.symbol.shape==="string") l.shape = layer.symbol.shape;
					if(mark && mark.props && mark.props.symbol && typeof mark.props.symbol.shape==="string") l.shape = mark.props.symbol.shape;
					l.size = (attr && typeof attr.style.size==="number") ? attr.style.size : 10;
					if(typeof primitives[p].color==="string") l.color = primitives[p].color;

					l.program = this.canvas.layers.threeD.ctx.createProgram();
					// Set the shaders
					for(s in this.canvas.shaders[st]){
						if(this.canvas.shaders[st][s].shader) this.canvas.layers.threeD.ctx.attachShader(l.program, this.canvas.shaders[st][s].shader);
					}
					this.canvas.layers.threeD.ctx.linkProgram(l.program);
					if(!this.canvas.layers.threeD.ctx.getProgramParameter(l.program, this.canvas.layers.threeD.ctx.LINK_STATUS)) {
						this.log.error("Error linking shader program:");
						this.log.message(this.canvas.layers.threeD.ctx.getProgramInfoLog(l.program));
					}

					// Get the uniform locations
					l.loc = getProgramUniforms(this.canvas.layers.threeD.ctx, l.program);

					// Create the vertices using the appropriate function
					l.vertex = primitives[p].fn.call(this,data,[(attr.style.group && attr.style.group=="width" ? 0 : this.x.data.min),(attr.style.group && attr.style.group=="height" ? 0 : this.y.data.min)]);

					// Create a buffer and bind it
					l.buffer = this.canvas.layers.threeD.ctx.createBuffer();
					this.canvas.layers.threeD.ctx.bindBuffer(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, l.buffer);
					// Set the buffer data
					this.canvas.layers.threeD.ctx.bufferData(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, l.vertex.data, this.canvas.layers.threeD.ctx.STATIC_DRAW);

					// Unbind the buffer
					this.canvas.layers.threeD.ctx.bindBuffer(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, null);

					// Create a buffer and bind it
					l.bufferIndex = this.canvas.layers.threeD.ctx.createBuffer();
					this.canvas.layers.threeD.ctx.bindBuffer(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, l.bufferIndex);
					// Set the buffer data
					this.canvas.layers.threeD.ctx.bufferData(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, l.vertex.indices, this.canvas.layers.threeD.ctx.STATIC_DRAW);

					// Unbind the buffer
					this.canvas.layers.threeD.ctx.bindBuffer(this.canvas.layers.threeD.ctx.ARRAY_BUFFER, null);

					// Create sprite
					if(l.shader=="sprite" || l.shader=="point"){
						attr.size = Math.sqrt(l.size);
					}
					if(l.shader=="sprite"){
						attr.output = "texture";
						l.icon = Icon(l.shape||"circle",attr);
						l.texture = this.canvas.layers.threeD.ctx.createTexture();
						this.canvas.layers.threeD.ctx.activeTexture(this.canvas.layers.threeD.ctx.TEXTURE0+this.threeD.layers.length);	// set an index for the texture
						this.canvas.layers.threeD.ctx.bindTexture(this.canvas.layers.threeD.ctx.TEXTURE_2D, l.texture);
						this.canvas.layers.threeD.ctx.pixelStorei(this.canvas.layers.threeD.ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
						this.canvas.layers.threeD.ctx.texParameteri(this.canvas.layers.threeD.ctx.TEXTURE_2D, this.canvas.layers.threeD.ctx.TEXTURE_MAG_FILTER, this.canvas.layers.threeD.ctx.NEAREST);
						this.canvas.layers.threeD.ctx.texParameteri(this.canvas.layers.threeD.ctx.TEXTURE_2D, this.canvas.layers.threeD.ctx.TEXTURE_MIN_FILTER, this.canvas.layers.threeD.ctx.NEAREST);
						this.canvas.layers.threeD.ctx.texParameteri(this.canvas.layers.threeD.ctx.TEXTURE_2D, this.canvas.layers.threeD.ctx.TEXTURE_WRAP_S, this.canvas.layers.threeD.ctx.CLAMP_TO_EDGE);
						this.canvas.layers.threeD.ctx.texParameteri(this.canvas.layers.threeD.ctx.TEXTURE_2D, this.canvas.layers.threeD.ctx.TEXTURE_WRAP_T, this.canvas.layers.threeD.ctx.CLAMP_TO_EDGE);
						this.canvas.layers.threeD.ctx.texImage2D(this.canvas.layers.threeD.ctx.TEXTURE_2D, 0, this.canvas.layers.threeD.ctx.RGBA, this.canvas.layers.threeD.ctx.RGBA, this.canvas.layers.threeD.ctx.UNSIGNED_BYTE, l.icon);
					}

					this.threeD.layers.push(l);
				}
			}

			this.threeD.layercounter++;

			this.log.time('addLayer');
		}

		return this;
	};

	/**
	 * @desc Update the data on the graph. This calls getGraphRange(), setChartOffset(), resetDataStyles() and redraw()
	 */
	Graph.prototype.updateData = function(attr){
		// Should process all the "update" options here;
		this.log.message('updateData',this.marks);
		if(!attr || typeof attr!=="object") attr = {};
		// Over-ride variables
		attr.cancelable = false;
		attr.update = true;
		this.getGraphRange();
		this.setChartOffset();
		this.resetDataStyles();
		this.redraw(attr);
		// Create the WebGL layers
		this.createLayers();
		return this;
	};

	/**
	 * @desc Get the graph ranges for both axes. This sets various properties such as x.data.min, x.data.max, and x.data.range for each axis before calling defineAxis() on each
	 */
	Graph.prototype.getGraphRange = function(){
		var d,i,j,k,max,axes,axis,v,domain,keepers;
		if(!this.x) this.x = {};
		if(!this.y) this.y = {};
		G.extend(this.x,{ min: 1e100, max: -1e100, log: (this.options.xaxis.type=="log"), label:{text:this.options.xaxis.label}, fit:this.options.xaxis.fit });
		G.extend(this.y,{ min: 1e100, max: -1e100, log: (this.options.yaxis.type=="log"), label:{text:this.options.yaxis.label}, fit:this.options.yaxis.fit });

		if(this.options.xaxis.type=="time" || this.options.xaxis.type=="utc") this.x.isDate = true;

		if(this.marks.length <= 0) return this;

		function calc(out,vs){
			if(typeof vs==="undefined") return out;
			out.min = Math.min(out.min);
			out.max = Math.max(out.max);
			for(var i = 0; i < vs.length; i++){
				v = vs[i];
				if(typeof v!=="undefined"){
					if(typeof v==="object") v = v.valueOf();
					if(v < out.min) out.min = v;
					if(v > out.max) out.max = v;
				}
			}
			return out;
		}

		axes = {
			'xaxis':'x',
			'yaxis':'y'
		};
		for(axis in axes){
			if(this.options[axis].range == "width" || this.options[axis].range == "height"){
				domain = this.options[axis].domain;
				v = [];
				// Build hash of which columns to keep
				keepers = {};
				if(domain.field) keepers[domain.field] = true;
				if(domain.fields){
					for(k = 0; k < domain.fields.length; k++) keepers[domain.fields[k]] = true;
				}
				// Loop over the datasets
				for(i in this.datasets){
					// If no domain is provided or one is and this is the correct dataset
					if(!domain || (domain && domain.data==i) || (domain.length && domain.length==2)){
						if(domain && domain.length && domain.length==2){
							this[axes[axis]].min = domain[0];
							this[axes[axis]].max = domain[1];
						}else{
							if(this.datasets[i].data){
								max = this.datasets[i].data.length;
								// Loop over the columns in the dataset
								for(j = 0; j < max ; j++){
									d = this.datasets[i].data[j];
									// Work out the values to include in the min/max calculation
									if(this.options[axis].domain){
										for(k in keepers){
											if(d[k]) v.push(d[k]);
										}
									}else v.push(d[axes[axis]]);
								}
							}else{
								this.log.message('no marks');
							}
						}
					}
				}

				// Calculate the range for this axis
				this[axes[axis]] = calc(this[axes[axis]],v);

				v = [];
				// Loop over the data
				for(i in this.marks){
					// If no domain is provided or one is and this is the correct dataset
					if(!this.options[axis].domain || (this.options[axis].domain && this.options[axis].domain.data==this.marks[i].id)){
						if(this.marks[i].mark && this.marks[i].include){
							max = this.marks[i].mark.length;
							for(j = 0; j < max ; j++){
								d = this.marks[i].mark[j].data;
								// Work out the values to include in the min/max calculation
								if(this.options[axis].domain){
									for(k in keepers){
										if(d[k]){
											v.push(d[k]);
										}
									}
								}else v.push(d[axes[axis]]);
							}
						}else{
							this.log.message('no marks');
						}
					}
				}
				this[axes[axis]] = calc(this[axes[axis]],v);
			}
		}

		// Keep a record of the data min/max
		this.x.data = {'min':this.x.min,'max':this.x.max,'range':Num(this.x.max).minus(this.x.min).toValue()};
		this.y.data = {'min':this.y.min,'max':this.y.max,'range':Num(this.y.max).minus(this.y.min).toValue()};

		this.defineAxis("x");
		this.defineAxis("y");
		return this;
	};

	/**
	 * @desc Pan the graph.
	 * @param {number} dx - an amount to move by horizontally in pixels.
	 * @param {number} dy - an amount to move by vertically in pixels.
	 * @param {object} attr - configuration attributes
	 * @param {boolean} attr.quick - If set to true, we do a very quick draw of the data canvas rather than recalculate everything as that can be slow when there is a lot of data.
	 */
	Graph.prototype.panBy = function(dx,dy,attr){

		// Stop any existing processing
		this.stop();

		this.offset.x = dx;
		this.offset.y = dy;
		this.log.time('panBy');
		if(!attr) attr = {};

		if(attr.quick){
			this.clear();
			this.clear(this.paper.temp.ctx);
			this.drawAxes();
			var ctx = this.canvas.layers.front.ctx;
			// Build the clip path
			ctx.save();
			ctx.beginPath();
			ctx.rect(this.chart.left,this.chart.top,this.chart.width,this.chart.height);
			ctx.clip();
			// Quick draw the image offset by the currently computed offset (since mousedown)
			// and any existing offset from previous panBy() event that hasn't finished drawing
			ctx.drawImage(this.paper.data.c,dx+this.offset.dx,dy+this.offset.dy,this.paper.data.width,this.paper.data.height);
			ctx.restore();
		}else{
			// Update the graph
			this.redraw({'update':true});
		}
		this.log.time('panBy');
		return this;
	};

	/**
	 * @desc Zoom the graph. We can zoom around a point or we can zoom to a defined region.
	 * @param {array} pos - if this is 2 elements we treat this as a zoom around a point [x,y]. If it is 4 elements we zoom to the defined range [xmin,xmax,ymin,ymax]. If no values are given we reset the view to the original data range.
	 * @param {boolean} attr.quick - if set to true, we do a very quick draw of the data canvas rather than recalculate everything as that can be slow when there is a lot of data.
	 * @param {number} attr.scale - a factor to zoom by (1==no zoom)
	 * @param {number} attr.scalex - a factor to zoom the x-axis by
	 * @param {number} attr.scaley - a factor to zoom the y-axis by
	 * @param {boolean} attr.update - whether redraw() does an update or not
	 */
	Graph.prototype.zoom = function(pos,attr){

		// Stop any existing processing
		this.stop();

		if(!attr) attr = {};
		if(attr.quick) this.log.time('zoom');
		if(!pos) pos = [];
		if(this.coordinates) this.coordinates.css({'display':'none'});
		// Zoom by a scale around a point [scale,x,y]
		var c,sx,sy,x,y;
		if(pos.length == 2){
			sx = sy = 0.8;
			if(attr.scale) sx = sy = attr.scale;
			if(attr.scalex) sx = attr.scalex;
			if(attr.scaley) sy = attr.scaley;
			if(attr.quick){
				// Scale the top left location
				this.paper.data.scale.x *= sx;
				this.paper.data.scale.y *= sy;
				var nwide = Math.round(this.canvas.width()/this.paper.data.scale.x);
				var ntall = Math.round(this.canvas.height()/this.paper.data.scale.y);
				// We use x,y below to draw the scaled image
				x = pos[0] * (1 - nwide/this.canvas.width());
				y = pos[1] * (1 - ntall/this.canvas.height());
			}
			// Find the center
			c = this.pixel2data(pos[0],pos[1]);
			pos = new Array(4);
			// Calculate the new zoom range
			pos[0] = c.x - sx*(c.x-this.x.min);
			pos[1] = c.x + sx*(this.x.max-c.x);
			if(this.y.log){
				pos[2] = Math.pow(10,Math.log10(c.y) - sy*(Math.log10(c.y) - Math.log10(this.y.min)));
				pos[3] = Math.pow(10,Math.log10(c.y) + sy*(Math.log10(this.y.max) - Math.log10(c.y)));
			}else{
				pos[2] = c.y - sy*(c.y-this.y.min);
				pos[3] = c.y + sy*(this.y.max-c.y);
			}
		}

		// Zoom into a defined region [x1,x2,y1,y2]
		if(pos.length == 4){
			if(typeof pos[0]!="number" || typeof pos[1]!="number" || typeof pos[2]!="number" || typeof pos[3]!="number") pos = [];
			else{
				// Re-define the axes
				this.defineAxis("x",pos[0],pos[1]);
				this.defineAxis("y",pos[2],pos[3]);
			}
		}

		// No parameters set so reset the view
		if(!attr.quick && pos.length == 0){
			this.x.min = this.x.data.min;
			this.x.max = this.x.data.max;
			this.y.min = this.y.data.min;
			this.y.max = this.y.data.max;
			this.defineAxis("x");
			this.defineAxis("y");
		}

		this.setChartOffset();
		if(!attr.quick){
			this.resetDataStyles().redraw({'update':typeof attr.update==="boolean" ? attr.update : true});
		}else{
			this.clear();
			this.clear(this.paper.temp.ctx);
			this.drawAxes();
			var ctx = this.canvas.layers.front.ctx;
			// Build the clip path
			ctx.save();
			ctx.beginPath();
			ctx.rect(this.chart.left,this.chart.top,this.chart.width,this.chart.height);
			ctx.clip();
			ctx.drawImage(this.paper.data.c,x,y,Math.round(this.canvas.width()/this.paper.data.scale.x),Math.round(this.canvas.height()/this.paper.data.scale.y));
			ctx.restore();
			this.finishDraw(true);
		}

		if(attr.quick) this.log.time('zoom');

		return this;
	};

	/**
	 * @desc Add some padding to an axis.
	 * @param {string} t - the axis to add the padding to e.g. "x" or "y"
	 * @param {number} p - the number of pixels to add as padding to this axis
	 */
	Graph.prototype.addAxisPadding = function(t,p){

		// Update the range
		this[t].range = Num(this[t].max).minus(this[t].min).toValue();

		// First we need to calculate the log min/max/range
		if(this[t].log){
			// Adjust the low and high values for log scale
			this[t].logmax = Math.log10(this[t].max);
			this[t].logmin = (this[t].min <= 0) ? this[t].logmax-2 : Math.log10(this[t].min);
			this[t].logrange = this[t].logmax-this[t].logmin;
		}

		if(this[t].min < 1e100){
			// Work out the number of pixels for the chart dimension e.g. width - padding*2
			var dim = (t=="x" ? this.chart.width : this.chart.height)-(p*2);
			// Work out the data range to add/subtract
			var d = p*this[t][(this[t].log ? 'log':'')+'range']/dim;
			if(this[t].log){
				this[t].logmin -= d;
				this[t].logmax += d;
				this[t].min = Math.pow(10,this[t].logmin);
				this[t].max = Math.pow(10,this[t].logmax);
			}else{
				this[t].min -= d;
				this[t].max += d;
			}
			// Update range
			this[t].range = Num(this[t].max).minus(this[t].min).toValue();
		}
		return this;
	};

	/**
	 * @desc Convert a pixel-based bounding box into a data-based bounding box
	 */
	Graph.prototype.getDataRange = function(x1,x2,y1,y2){
		var c1 = this.pixel2data(x1,y1);
		var c2 = this.pixel2data(x2,y2);
		return [Math.min(c1.x,c2.x),Math.max(c1.x,c2.x),Math.min(c1.y,c2.y),Math.max(c1.y,c2.y)];
	};

	/**
	 * @desc Return the pixel value for a data value on a given axis
	 * @param {string} t - the axis e.g. "x" or "y"
	 * @param {number} c - the value
	 */
	Graph.prototype.getPos = function(t,c){
		if(!this[t]) return;
		var k,mn,mx,rn,v,off,dim;
		if(typeof c==="object"){
			if(!c.scale){
				if(typeof c==="object" && c.type=="Num"){
					v = c.toValue();
				}else{
					v = 0;
					if(c.field && c.field.group && (c.field.group=="width" || c.field.group=="height")) v = this[t].max; 
					if(c.value == 0) v = this[t].min;
				}
			}else v = c.value;
		}else v = c;
		k = (this[t].log) ? 'log':'';
		if(this[t].log) v = Math.log10(v);
		mn = this[t][k+'min'];
		mx = this[t][k+'max'];
		rn = this[t][k+'range'];
		off = (t=="x" ? this.chart.left : this.chart.bottom);
		dim = (t=="x" ? this.chart.width : this.chart.height);
		if(t=="y") return (this.offset[t]||0)+this.options.height-(this.chart.bottom + dim*((v-mn)/rn));
		else return (this.offset[t]||0)+(this[t].dir=="reverse" ? off + dim*((mx-v)/(rn)) : off + dim*((v-mn)/rn));
	};

	/**
	 * @desc For an input data value find the pixel locations
	 * @param {number} x - the horizontal axis value
	 * @param {number} y - the vertical axis value
	 */
	Graph.prototype.getPixPos = function(x,y){ return [this.getPos("x",x),this.getPos("y",y)]; };

	/**
	 * @desc Are the x,y pixel coordinates in the displayed chart area?
	 * @param {number} x - horizontal pixel value
	 * @param {number} y - vertical pixel value
	 */
	Graph.prototype.within = function(x,y){
		if(x > this.chart.left && y < this.chart.top+this.chart.height) return true;
		return false;
	};

	/**
	 * @desc Provide the pixel coordinates (x,y) and return the data-space values {x:number,y:number}
	 * @param {number} x - horizontal pixel value
	 * @param {number} y - vertical pixel value
	 */
	Graph.prototype.pixel2data = function(x,y){
		// x-axis
		if(typeof x==="number") x = this.x.min + ((x-this.chart.left)/this.chart.width)*this.x.range;
		// y-axis
		if(typeof y==="number"){
			if(this.y.log) y = Math.pow(10,this.y.logmin + (1-(y-this.chart.top)/this.chart.height)*this.y.logrange);
			else y = this.y.min + (1-(y-this.chart.top)/this.chart.height)*this.y.range;
		}
		return {x:x,y:y};
	};

	/**
	 * @desc An array of mark sets that match with the pixel position
	 * @param {number} x - horizontal pixel value
	 * @param {number} y - vertical pixel value
	 */
	Graph.prototype.dataAtMousePosition = function(x,y){
		x = Math.round(x*this.canvas.getScale());
		y = Math.round(y*this.canvas.getScale());
		var rtn = [];
		if(this.picker) rtn = this.picker.getMatches(this.marks,{'screen':{'x':x,'y':y},'data':this.pixel2data(x,y)},2);
		if(rtn.length<1) this.canvas.find('canvas').css({'cursor':''});
		return rtn;
	};

	/**
	 * @desc Set the canvas styles
	 * @param {context} ctx - a canvas context to apply the styles to
	 * @param {object} datum - an object for the mark datum
	 * @param {object} datum.props.format - formatting options for this datum
	 * @param {string} datum.props.format.fill - the fill colour
	 * @param {number} datum.props.format.fill - an index in the colour pallette
	 * @param {number} datum.props.format.fillOpacity - the opacity of the fill
	 * @param {string} datum.props.format.stroke - the stroke colour
	 * @param {string} datum.props.format.strokeOpacity - the stroke opacity
	 * @param {string} datum.props.format.strokeCap - the cap for the stroke e.g. "square"
	 * @param {array} datum.props.format.strokeDash - the dash styles
	 * @param {string} datum.props.format.fontSize - the font size
	 * @param {string} datum.props.format.baseline - the textBaseline
	 * @param {string} datum.props.format.align - the alignment
	 */
	Graph.prototype.setCanvasStyles = function(ctx,datum){
		if(!datum) return this;
		var a,f;
		f = datum.props.format;
		a = {};
		a.fillStyle = (typeof f.fill==="string" ? f.fill : (typeof f.fill==="number" ? this.colours[f.fill % this.colours.length]:'#000000'));
		if(f.fillOpacity) a.fillStyle = hex2rgba(a.fillStyle,f.fillOpacity);
		a.strokeStyle = (typeof f.stroke==="string" ? f.stroke : (typeof f.stroke==="number" ? this.colours[f.stroke % this.colours.length]:'#000000'));
		if(f.strokeOpacity) a.strokeStyle = hex2rgba(a.strokeStyle,f.strokeOpacity);
		a.lineWidth = (typeof f.strokeWidth==="number" ? f.strokeWidth : 0.8);
		a.lineCap = (f.strokeCap || "square");
		a.lineJoin = "bevel"; // To stop spikes occurring in certain regimes
		a.strokeDash = f.strokeDash ? f.strokeDash : [1,0];
		if(f.fontSize) a.font = buildFont(f);
		if(f.baseline) a.textBaseline = f.baseline;
		if(f.align) a.textAlign = f.align;
		ctx.fillStyle = a.fillStyle;
		ctx.strokeStyle = a.strokeStyle;
		ctx.lineWidth = a.lineWidth;
		ctx.lineCap = a.lineCap;
		ctx.lineJoin = a.lineJoin;	// To stop spikes occurring in certain regimes
		ctx.setLineDash(a.strokeDash);
		if(a.font) ctx.font = a.font;
		if(a.textBaseline) ctx.textBaseline = a.textBaseline;
		if(a.textAlign) ctx.textAlign = a.textAlign;
		return a;
	};

	/**
	 * @desc Highlight a particular set of marks (up to 10). This can also trigger a tooltip.
	 * @param {array} ds - an array of "marksetid:markid:weight" mark references
	 */
	Graph.prototype.highlight = function(ds){
		if(this.selecting) return this;	// If we are panning we don't want to highlight symbols
		if(!this.ready) return this;	// Don't highlight if we are in the middle of doing something
		if(this.picker && ds && ds.length > 0){
			// We want to put the saved version of the canvas back
			this.canvas.pasteFromClipboard();
			var d,t,i,w,clipping,typ,mark,ctx,n,s,val,top,topmark,series;
			ctx = this.canvas.layers.front.ctx;
			top = -1;

			// Only highlight the first 10 matches
			n = Math.min(10,ds.length);
			for(s = 0; s < n; s++){
				d = ds[s].split(":");
				t = d[0];
				if(d[1]=="*") i = 0;
				else i = parseInt(d[1]);
				w = 0.8;	// weight
				clipping = false;
				typ = this.marks[t].type;
				if(this.marks[t].encode.hover && this.marks[t].interactive){
					if(typ=="line" || typ=="rect" || typ=="area" || typ=="rule"){
						if(this.marks[t].clip){
							clipping = true;
							// Build the clip path
							ctx.save();
							ctx.beginPath();
							ctx.rect(this.chart.left,this.chart.top,this.chart.width,this.chart.height);
							ctx.clip();
						}
					}
					if(typ=="line" || typ=="symbol" || typ=="rect" || typ=="area" || typ=="rule" || typ=="text"){
						// Update the mark if necessary
						mark = (typeof this.marks[t].hover==="function" ? this.marks[t].hover.call(this,clone(this.marks[t].mark),this.marks[t].encode.hover,i) : clone(this.marks[t].mark[i]));
						// Set the canvas colours
						this.setCanvasStyles(ctx,mark);
						this.setCanvasStyles(this.paper.temp.ctx,mark);
					}

					// Draw the marks
					if(typ=="line") this.drawLine(t,{'ctx':ctx});
					if(typ=="symbol") this.drawShape(mark,{'ctx':ctx});
					if(typ=="rect") this.drawRect(mark,{'ctx':ctx});
					if(typ=="area") this.drawArea(t,{'ctx':ctx});
					if(typ=="rule") this.drawRule(t,{'ctx':ctx});
					if(typ=="text") this.drawText(mark,{'ctx':ctx});

					// Put the styles back to what they were
					if(typ=="line" || typ=="symbol" || typ=="rect" || typ=="area" || typ=="rule" || typ=="text"){
						this.setCanvasStyles(ctx,this.marks[t].mark[i]);
						this.setCanvasStyles(this.paper.temp.ctx,this.marks[t].mark[i]);
					}

					// Set the clipping
					if(clipping) ctx.restore();

					if(w >= top && mark.props.tooltip){
						top = w;
						topmark = mark;
						series = this.marks[t];
					}
				}
			}

			var cls = 'graph-tooltip aas-series-'+t+' '+(this.options.tooltip && this.options.tooltip.theme ? this.options.tooltip.theme : "");
			if(!this.coordinates){
				this.canvas.holder.append('<div class="'+cls+'" style="position:absolute;display:none;"></div>');
				this.coordinates = this.canvas.find('.graph-tooltip');
			}
			var html = "";

			if(topmark){
				// Build the hovertext output
				val = {
					title: (series.title) ? series.title : "", 
					xlabel: (this.x.label.text ? this.x.label.text : (this.x.isDate ? 'Time' : 'x')),
					ylabel: (this.y.label.text ? this.y.label.text : 'y'),
					data: series.data[i]
				};
				
				html = removeRoundingErrors(topmark.props.tooltip) || "";
			}
			if(html){
				var x,y,c;
				this.coordinates.html(html);
				x = topmark.props.x;// + this.canvas.c.offsetLeft;
				y = topmark.props.y;
				this.coordinates.css({'display':'block','left':Math.round(x)+'px','top':Math.round(y)+'px'});
				c = (y < this.chart.height/3 ? 'n' : (y > this.chart.height*2/3 ? 's':''));
				c += (x < this.chart.width/3 ? 'w' : (x > this.chart.width*2/3 ? 'e' : ''));
				if(!c) c = 'w';
				this.coordinates.attr('class',cls+' graph-tooltip-'+c);
				this.annotated = true;
			}else{
				this.coordinates.css({'display':'none'});
			}
			// How many are highlighted?
			this.highlighted = n;
		}else{
			if(this.annotated){
				this.annotated = false;
				this.coordinates.css({'display':'none'});
			}
			// If any data series are currently highlighted we clear them
			if(this.highlighted > 0){
				this.highlighted = 0;
				this.canvas.pasteFromClipboard();
			}
		}
		return this;
	};

	/**
	 * @desc Set the increment size for this axis
	 * @param {string} a - the axis e.g. "x" or "y"
	 * @param {number} inc - the axis tick mark increment
	 */
	Graph.prototype.setInc = function(a,inc){
		if(typeof inc=="number"){
			//this[a].inc = inc;
			this[a].ticks.inc = Num(inc);
		}else{
			if(inc.type!="Num") inc = Num(inc);
			this[a].ticks.inc = inc;
			//this[a].inc = inc.toValue();
		}
		return this;
	};

	/**
	 * @desc Defines max, min, inc, range, logmax, logmin, logrange, ticks, ticks.min, ticks.max, ticks.range, ticks.inc, spacing, precision
	 * @param {string} a - the axis e.g. "x" or "y"
	 * @param {number} min - the minimum value for the axis
	 * @param {number} max - the maximum value for the axis
	 */
	Graph.prototype.defineAxis = function(a,min,max){

		// Immediately return if the input seems wrong
		if(typeof a != "string" || (a != "x" && a != "y")) return this;

		var t_inc,steps,t_div,t_max,t_min,st,sp,n,i,rg,mx,mn,inc;

		// Set the min/max if provided
		if(typeof max=="number" && typeof min=="number"){
			this[a].max = max;
			this[a].min = min;
		}else{
			this[a].max = this[a].data.max;
			this[a].min = this[a].data.min;
			this.addAxisPadding(a,(this.options[a+'axis'].padding||0));
		}

		// Sort out what to do for log scales
		if(this[a].log){
			// Adjust the low and high values for log scale
			this[a].logmax = Math.log10(this[a].max);
			this[a].logmin = (this[a].min <= 0) ? this[a].logmax-2 : Math.log10(this[a].min);
			this[a].logrange = this[a].logmax-this[a].logmin;
		}

		// Set the range of the data
		this[a].range = Num(this[a].max).minus(this[a].min).toValue();
		// We'll create an object that behaves a bit like an array but contains other properties
		if(!this[a].ticks){
			this[a].ticks = {};
		}else{
			// Delete any existing ticks
			for(i = 0; i < this[a].ticks.length; i++) delete this[a].ticks[i];
			this[a].ticks.length = 0;
		}
		if(!this[a].ticks.props) this[a].ticks.props = {};

		// Sort out what to do for log scales
		if(this[a].log){
			this[a].ticks.min = this[a].min;
			this[a].ticks.max = this[a].max;
			this.setInc(a,1);
			this[a].range = this[a].max-this[a].min;
			this[a].ticks.range = this[a].max-this[a].min;
			this.makeTicks(a);
			return this;
		}
		// If we have zero range we need to expand it
		if(this[a].range < 0){
			this.setInc(a,0.0);
			this[a].ticks.range = 0.0;
			return this;
		}else if(this[a].range == 0){
			this[a].ticks.min = Math.ceil(this[a].max)-1;
			this[a].ticks.max = Math.ceil(this[a].max);
			this[a].min = this[a].ticks.min;
			this[a].max = this[a].ticks.max;
			this.setInc(a,1.0);
			this[a].range = this[a].max-this[a].min;
			this[a].ticks.range = this[a].ticks.max-this[a].ticks.min;
			this.makeTicks(a);
			return this;
		}

		rg = this[a].range;
		mx = this[a].max;
		mn = this[a].min;

		// Set the label scaling
		var scale = (a=="x" && this[a].ticks.props.scale) ? this[a].ticks.props.scale : 1;

		// Calculate reasonable grid line spacings
		// Dates are in seconds
		// Grid line spacings can range from 1 ms to 10000 years
		// Use Gregorian year length for calendar display
		// 31557600000
		steps = [{'name': 'nanoseconds', 'div': 1e-9, 'spacings':[1,2,5,10,20,50,100,200,500]},
				{'name': 'microseconds', 'div': 1e-6, 'spacings':[1,2,5,10,20,50,100,200,500]},
				{'name': 'milliseconds', 'div': 1e-3, 'spacings':[1,2,5,10,20,50,100,200,500]},
				{'name': 'seconds','div':1,'spacings':[1,2,5,10,15,20,30]},
				{'name': 'minutes', 'div':60,'spacings':[1,2,5,10,15,20,30]},
				{'name': 'hours', 'div':3600,'spacings':[1,2,4,6,12]},
				{'name': 'days', 'div':86400,'spacings':[1,2]},
				{'name': 'weeks', 'div':7*86400,'spacings':[1,2]},
				{'name': 'months', 'div': 30*86400, 'spacings':[1,3,6]},
				{'name': 'years', 'div':365.2425*86400,'spacings':[1,2,5,10,20,50,100,200,500,1000,2000,5e3,1e4,2e4,5e4,1e5,2e5,5e5,1e6]}];
		steps = (this[a].ticks.props.steps || steps);
		t_div = 1e100;

		for(st = 0; st < steps.length ; st++){
			for(sp = 0; sp < steps[st].spacings.length; sp++){
				n = Math.ceil(Num(this[a].range).times(scale).div(Num(steps[st].div).times(steps[st].spacings[sp])).toValue());
				if(n < 1 || n > 20) continue;
				else{
					if(n >= 3 && n < t_div){
						t_div = n;
						this[a].spacing = {
							'name':steps[st].name,
							'fract':steps[st].spacings[sp],
							'scale':scale,
							'div':steps[st].div
						};
					}
				}
			}
		}

		// If we have a function that converts the number, we now convert the min and max
		// to the current format from the input format (this[a].units)
		if(typeof this[a].ticks.props.convert==="function"){

			mn = this[a].ticks.props.convert.call(this,this[a].min,this[a].units);
			mx = this[a].ticks.props.convert.call(this,this[a].max,this[a].units);
			this[a].spacing = {'div':defaultSpacing(mn,mx,(this[a].isDate ? 3 : 5)),'fract':1};
			// See if we have a custom spacing function
			if(typeof this[a].ticks.props.spacing==="function"){
				sp = this[a].ticks.props.spacing.call(this,mx-mn);
				if(sp > 0) this[a].spacing.div = sp;
			}
		}

		// If the output format is a "date" type and the input scale is set to 1 we use base 60/24 as appropriate
		if(this[a].isDate && scale==1){

			// The displayed labels are shown as dates (this uses date rounding)
			this[a].showAsDate = true;

			// Set the min and max values by rounding the dates
			t_inc = Num(this[a].spacing.div).times(this[a].spacing.fract);
			t_min = (roundDate(mn,{'range':this[a].range,'unit':this[a].spacing.name,'inc':t_inc,'n':this[a].spacing.fract,'method':'floor'}));
			t_max = (roundDate(mx,{'range':this[a].range,'unit':this[a].spacing.name,'inc':t_inc,'n':this[a].spacing.fract,'method':'ceil'}));

		}else if(this[a].isPhase){

			this[a].showAsDate = false;

			t_inc = Num(this[a].spacing.div).times(this[a].spacing.fract);
			inc = t_inc.toValue();
			t_min = Num(mn).div(inc).floor().times(inc).toValue();
			t_max = Num(mx).div(inc).ceil().times(inc).toValue();
			this[a].precisionlabel = Math.abs(Math.floor(Math.log10(inc)));

		}else{

			// Do we do date-based rounding
			this[a].showAsDate = false;

			// Scale the range before we work out the spacings

			t_inc = defaultSpacing(Num(mn).div(scale).toValue(),Num(mx).div(scale).toValue(),(this[a].isDate ? 3 : 5));
			t_inc = Num(t_inc).times(scale);

			// Round to nearest t_inc (because of precision issues)
			t_min = Num(mn).div(t_inc).round(0,mn < 0 ? 3:0).times(t_inc).toValue();
			t_max = Num(mx).div(t_inc).round(0,mx < 0 ? 0:3).times(t_inc).toValue();

			// Determine the number of decimal places to show
			// Quicker to do it here than in makeTicks.
			this[a].precisionlabel = Math.ceil(Math.abs(Math.log10(t_inc.toValue())));
			if(this[a].precisionlabel==0 && Math.abs(t_min) > 10) this[a].precisionlabel = Math.floor(Math.log10(Math.abs(t_min)));
			// If we are dealing with dates we set the precision that way
			if(this[a].isDate){
				var p = Math.log10(t_inc.toValue());
				this[a].precisionlabeldp = (p < 0) ? Math.ceil(Math.abs(Math.log10(t_inc.toValue()))) : 0;
				this[a].precisionlabel = Math.ceil(Math.abs(Math.log10(t_max)-Math.log10(t_inc.toValue())));
			}
			//t_inc = Num(t_inc);

		}

		// Set the first/last gridline values as well as the spacing
		this[a].ticks.min = t_min;
		this[a].ticks.max = t_max;
		this.setInc(a,t_inc);
		this[a].ticks.range = this[a].ticks.max-this[a].ticks.min;
		this[a].precision = this[a].precisionlabel+Math.floor(Math.log10(Math.abs(scale)));

		this.makeTicks(a);

		return this;
	};

	/**
	 * @desc Define the output format for an axis
	 * @param {string} a - the axis e.g. "x" or "y"
	 * @param {string} type - the axis output units e.g. "unity", "jd", "radians", "relative"
	 * @param {object} types - the formats object that defines the types
	 */
	Graph.prototype.setAxisFormat = function(a,type,types){
		this[a].formats = types;
		// Update the tick properties
		this[a].ticks.props = types[type];
		// Update the tick label units
		this[a].ticks.units = type;
		if(types[type].types){
			this[a].isDate = (types[type].types.absolute ? true : false);
			this[a].isPhase = (types[type].types.phase ? true : false);
		}else{
			this[a].isDate = false;
			this[a].isPhase = false;
		}
		return this;
	};

	/**
	 * @desc Make the tick marks. Sets this[a].ticks.min, this[a].ticks.max, this[a].ticks.range, and this[a].ticks[i]
	 * @param {string} a - the axis e.g. "x" or "y"
	 */
	Graph.prototype.makeTicks = function(a){
		var v,mn,mx,l,sci,precision,fmt,i,d,vmx,calcval;
		this.log.time('makeTicks');

		// Get the min/max tick marks
		mn = this[a].ticks.min;
		mx = this[a].ticks.max;

		// If the range is negative we cowardly quit
		if(mn > mx) return this;

		// If the min or max are not numbers we quit
		if(isNaN(mn) || isNaN(mx)) return this;

		mn = Num(mn);
		mx = Num(mx);
		if(this[a].log){
			this[a].ticks = logTicks(mn.toValue(),mx.toValue());
		}else{
			this[a].ticks.length = 0;
			vmx = mx.plus(this[a].ticks.inc.times(0.2)).toValue();
			for(v = mn, i = 0; v.toValue() <= vmx; v = v.plus(this[a].ticks.inc), i++){
				if(this[a].showAsDate) this[a].ticks[i] = {'value':roundDate(v,{'range':this[a].range,'unit':this[a].spacing.name,'n':this[a].spacing.fract,'inc':this[a].ticks.inc}),'label':''};
				else this[a].ticks[i] = {'value':v,'label':''};
				this[a].ticks.length++;
			}
		}

		if(this[a].ticks.length == 0){
			this.log.warning('No ticks');
			return this;
		}
		mn = this[a].ticks[0].value;
		mx = this[a].ticks[this[a].ticks.length-1].value;

		// A function to format the date nicely
		function niceDate(d,sp){
			var hr,mn,sc,dy,mo,yr,n,f,fs,str,idx,bits;
			fs = "";
			str = (typeof d==="number" ? Num(d):d).toString();
			idx = str.indexOf(".");
			bits = [Num(str),Num(0)];
			if(idx >= 0){
				fs = "."+str.substr(idx+1,str.length-1);
				bits = [Num(str.substr(0,idx)),Num("0"+fs)];
			}
			d = new Date(bits[0].times(1000).toValue());
			if(!sp) sp = {'fract':1,'name':'seconds'};
			f = sp.fract;
			hr = zeroFill(d.getUTCHours(),2);
			mn = zeroFill(d.getUTCMinutes(),2);
			sc = removeRoundingErrors(zeroFill(d.getUTCSeconds()+d.getUTCMilliseconds()/1000,2));
			dy = zeroFill(d.getUTCDate(),2);
			mo = zeroFill(d.getUTCMonth()+1,2);
			yr = d.getUTCFullYear();
			n = sp.name;
			if(n=="nanoseconds" || n=="microseconds" || n=="milliseconds") return sc+""+fs;
			else if(n=="seconds") return (f >= 1 ? hr+":"+mn+":"+sc : ""+sc+""+fs);
			else if(n=="minutes") return hr+":"+mn+(d.getUTCSeconds()==0 ? "" : ":"+sc);
			else if(n=="hours") return hr+":"+mn;
			else if(n=="days") return (f >= 1 ? yr+"-"+mo+"-"+dy : yr+"-"+mo+"-"+dy+' '+hr+':'+mn);
			else if(n=="weeks") return yr+"-"+mo+"-"+dy;//+(hr=="00" ? '' : ' '+Math.round((d.getUTCHours()+(d.getUTCMinutes()/60)))+'h');
			else if(n=="months") return yr+"-"+mo;
			else if(n=="years") return (f >= 1 ? ''+(d.getUTCFullYear()+Math.round((d.getUTCMonth()+1)/12)) : (Math.round(d.getUTCMonth()+1)==12 ? (d.getUTCFullYear()+1)+"-01-01" : d.getUTCFullYear()+'-'+mo+'-01'));
			else return hr+':'+mn+':'+sc;
		}

		// Calculate the number of decimal places for the increment
		this.sci_hi = 10000;
		this.sci_lo = 1e-4;

		l = Math.max(Math.abs(mx),Math.abs(mn));
		sci = (l > this.sci_hi || l < this.sci_lo);
		// Check if the data range is within our scientific bounds
		if(mx-mn < this.sci_hi && mx-mn > this.sci_lo) sci = false;
		// Get the number of decimal places to show
		precision = this[a].precision;
		var _obj = this;
		function shortestFormat(fmt){
			var l = 1e100;
			var i = "";
			for(var f in fmt){
				if(fmt[f]){
					try { fmt[f] = fmt[f].replace(/\.0+((e[\+\-0-9]+)?)$/,function(m,p1){ return p1; }).replace(/^([^\.]+[\.][^1-9]*)0+$/,function(m,p1){return p1;}).toLocaleString(); }
					catch(err){ _obj.log.error(fmt[f],err); }
					if(typeof fmt[f]!=="string" || fmt[f] == "NaN") fmt[f] = "";
					if(fmt[f].length < l){
						l = fmt[f].length;
						i = f;
					}
				}
			}
			return fmt[i];
		}

		if(this[a].log){
			// Format labels for log scale
			for(i = 0; i < this[a].ticks.length; i++){
				if(this[a].ticks[i].label){
					v = this[a].ticks[i].value.toValue();
					sci = (Math.abs(v) > this.sci_hi || Math.abs(v) < this.sci_lo);
					fmt = {'existing':this[a].ticks[i].label};
					if(sci){
						precision = (""+v).length;
						fmt.normal = ""+v;
						fmt.exp = tidy(v.toExponential());
					}

					// Set the label to whichever is shortest
					this[a].ticks[i].label = shortestFormat(fmt);
				}
			}
		}else{
			// Format labels for linear scale
			for(i = 0; i < this[a].ticks.length; i++){
				v = this[a].ticks[i].value;
				if(this[a].showAsDate){
					// Default date formatting
					d = (this[a].spacing && this[a].spacing.name=="seconds" && this[a].spacing.fract < 1e-3) ? v.toValue().toFixed(precision+3) : niceDate(v,this[a].spacing);
					this[a].ticks[i].label = d;
				}else{
					fmt = {};
					precision = this[a].precision;
					// Find the differential precision
					if(v.gt(this.sci_hi) || v.lt(this.sci_lo)) precision = Math.floor(Math.log10(v.abs().toValue())) - Math.floor(Math.log10(Math.abs(this[a].ticks.inc.toValue())));
					if(this[a].isDate) precision = 1;
					if(precision < 1) precision = this[a].precisionlabel;
					if(sci){
						if(this[a].isDate) fmt.date = ""+v;
						else fmt.exp = v.toValue().toExponential(precision);
					}else{
						if(this[a].ticks.inc.toValue() > 1) fmt.round = ""+v.round(0,1).toString();
						else fmt.fixed = v.toString();
					}

					// Bug fix for Javascript rounding issues when the range is big
					if(Math.abs(v/this[a].range) < 1e-12) fmt.fixed = "0";

					// Set the label to whichever is shortest
					this[a].ticks[i].label = shortestFormat(fmt);
				}
			}
		}
		if(!this[a].showAsDate){
			for(i = 0; i < this[a].ticks.length; i++){
				// Because of precision issues, use the label to rebuild the value
				calcval = this[a].ticks[i].value.toValue();
				this[a].ticks[i].value = (typeof calcval==="number") ? calcval : parseFloat(this[a].ticks[i].label);
			}
		}

		// If formatLabel is set we use that to format the label
		if(this[a].ticks.props && typeof this[a].ticks.props.formatLabel==="function"){
			for(i = 0; i < this[a].ticks.length; i++){
				var str = '';
				var o = this[a].ticks.props.formatLabel.call(this,this[a].ticks[i].value,{'i':i,'axis':a,'dp':this[a].precisionlabeldp,'ticks':this[a].ticks,'input':(this[a].units||""),'output':(this[a].ticks.units||""),'niceDate':niceDate,'spacing':this[a].spacing});
				if(o) str = tidy(o.truncated || o.str);
				this[a].ticks[i].label = str;
			}
		}

		// Final tidy
		for(i = 0; i < this[a].ticks.length; i++) this[a].ticks[i].label = tidy(this[a].ticks[i].label);
		// Fix precision issues
		if(this[a].log){
			// Update all the values for the log scale
			//for(i = 0; i < this[a].ticks.length; i++) this[a].ticks[i].value = Math.pow(10,this[a].ticks[i].value);
			this[a].ticks.min = this[a].ticks[0].value;
			this[a].ticks.max = this[a].ticks[this[a].ticks.length-1].value;
		}else{
			this[a].ticks.min = this[a].ticks[0].value;
			this[a].ticks.max = this[a].ticks[this[a].ticks.length-1].value;
		}

		// We want to convert the values back to the input format so that
		// they appear in the correct place on the graph
		if(this[a].units && this[a].formats && this[a].formats[this[a].units] && typeof this[a].formats[this[a].units].convert==="function"){
			for(i = 0; i < this[a].ticks.length; i++){
				this[a].ticks[i].value = Num(this[a].formats[this[a].units].convert.call(this,this[a].ticks[i].value,this[a].ticks.units));
			}
		}

		this[a].ticks.range = this[a].ticks.max - this[a].ticks.min;
		this.log.time('makeTicks');

		return this;
	};

	/**
	 * @desc A factor to scale the overall font size then redraw the graph
	 */
	Graph.prototype.scaleFont = function(s){
		if(s == 0) this.fontscale = 1;
		else this.fontscale *= (s>0 ? 1.1 : 1/1.1);
		this.setChartOffset().resetDataStyles().redraw({'update':true});
		return this;
	};

	/**
	 * @desc Get the font height for an axis and type
	 * @param {string} a - the axis e.g. "x" or "y"
	 * @param {string} t - the chart element to style e.g. "title" or "label"
	 */
	Graph.prototype.getFontHeight = function(a,t){
		var fs = this.chart.fontsize;
		if(this.options[a+'axis'] && this.options[a+'axis'][t+'FontSize']) fs = this.options[a+'axis'][t+'FontSize'];
		return fs*this.fontscale;
	};

	/**
	 * @desc Set the chart offsets such as left, right, top, bottom, width, height, padding, fontsize, and fontfamily
	 */
	Graph.prototype.setChartOffset = function(){
		if(typeof this.chart!="object") this.chart = {};
		var fs,ff,o,c,a,ax,offx,dp,b;
		fs = this.canvas.getStyle('font-size');
		ff = this.canvas.getStyle('font-family');
		o = this.options;
		c = this.chart;
		if(!c.left) c.left = 0;
		// Set the target

		c.padding = (this.canvas.fullscreen) ? 36 : 0;
		c.fontsize = (typeof fs=="string") ? parseInt(fs) : 12;
		c.fontfamily = (typeof ff=="string") ? ff : "";

		// Correct for sub-pixel positioning
		b = o.grid.border*0.5;
		c.padding = o.padding || c.padding;
		c.top = c.padding + b;
		c.left = clone(c.top);
		c.bottom = clone(c.top);
		c.right = clone(c.top);
		offx = clone(c.top);
		ax = {'xaxis':'bottom','yaxis':'left'};
		for(a in ax){
			if(o[a]){
				if(o[a].title){
					dp = this.getFontHeight(a.substr(0,1),'title')*1.5;
					this.chart[ax[a]] += dp;
					if(a=="xaxis") offx += dp;
				}
				if(typeof o[a].labels==="undefined") o[a].labels = true;
				if(o[a].labels){
					c[ax[a]] += (a=="xaxis" ? this.getFontHeight('x','label')*1.2 : this.getLabelWidth());
					offx += 4;
				}
				if(o[a].ticks){
					dp = (o[a].tickSize||4) + 3;
					c[ax[a]] += dp;
					if(a=="xaxis") offx += dp;
				}
				c[ax[a]] = Math.round(c[ax[a]]);
			}
		}
		c.width = this.canvas.width()-c.right-c.left;
		c.height = this.canvas.height()-c.bottom-c.top;

		this.chart = c;
		return this;
	};

	/**
	 * @desc Get the maximum width of y-axis labels in pixels.
	 */
	Graph.prototype.getLabelWidth = function(){
		// If we aren't showing labels the width is 0
		var ok = (typeof this.options.yaxis.labels==="boolean") ? this.options.yaxis.labels : (this.options.labels && this.options.labels.show ? this.options.labels.show : false);
		if(!ok) return 0;

		var fs,ctx,i,maxw,s;

		// Set font for labels
		fs = this.getFontHeight('y','label');
		maxw = 0;
		ctx = this.canvas.layers.back.ctx;
		ctx.font = fs+'px '+this.chart.fontfamily;

		if(this.y.ticks){
			for(i = 0; i < this.y.ticks.length; i++){
				if(this.y.ticks[i].label) maxw = Math.max(maxw,ctx.measureText(this.y.ticks[i].label).width);
			}
		}
		s = Math.round(fs*1.5);
		return Math.max(s*2,Math.round(Math.ceil(maxw/s)*s)) + 4;
	};

	/**
	 * @desc Draw the axes and grid lines for the graph
	 */
	Graph.prototype.drawAxes = function(){
		var tw,tickw,lw,c,ctx,rot,axes,r,i,j,k,a,o,d,s,p,mn,mx,fs,y1,y2,x1,x2,prec,axis,oldx,str,v,ii;
		c = this.chart;
		ctx = this.canvas.layers.back.ctx;
		rot = Math.PI/2;
		axes = {'xaxis':{},'yaxis':{}};
		r = {
			'xmin': this.chart.left,
			'xmax': this.chart.left+this.chart.width,
			'ymax': this.chart.top+this.chart.height,
			'ymin': this.chart.top
		};
		var orient = {
			'left': {'rot':rot,'x1': r.xmin,'x2': r.xmax,'textAlign': 'end','textBaseline': 'middle'},
			'right': {'rot':-rot,'x1': r.xmin,'x2': r.xmax,'textBaseline': 'middle'},
			'bottom': {'textBaseline': 'top','y1': r.ymax,'y2': r.ymin}
		};

		if(!this.subgrid) this.subgrid = [2,3,4,5,6,7,8,9];

		if(typeof this.background==="string"){
			ctx.beginPath();
			ctx.fillStyle = (this.background||"transparent");
			ctx.rect(0,0,this.canvas.width(),this.canvas.height());
			ctx.fill();
			ctx.closePath();
		}

		ctx.beginPath();
		ctx.font = this.chart.fontsize+'px '+this.chart.fontfamily;
		ctx.textBaseline = 'middle';

		// Draw main rectangle
		if(this.options.grid.border > 0){
			ctx.strokeStyle = (this.options.grid.color || 'rgb(0,0,0)');
			ctx.lineWidth = this.options.grid.border;
			ctx.setLineDash([1,0]);
		}

		if(typeof this.options.grid.background=="string"){
			ctx.fillStyle = this.options.grid.background;
			ctx.fillRect(c.left,c.top,c.width,c.height);
		}
		ctx.closePath();

		for(a in axes){
			if(axes[a]){

				o = this.options[a].orient || "left";
				// Set axis direction
				d = "x";
				if(o=="left" || o=="right") d = "y";
				if(!this[d]) continue;

				// What do we show?
				var show = {'grid':false,'labels':true,'ticks':true,'domain':true};
				for(s in show){
					if(typeof show[s]!="undefined"){
						if(typeof this.options[a][s]==="boolean") show[s] = this.options[a][s];
						if(this.options[s] && this.options[s].show) show[s] = this.options[s].show;
					}
				}

				// Set the tick width
				tw = 0;
				if(show.ticks) tw = (this.options[a].tickSize||4);

				// Draw axis line
				if(show.domain){
					ctx.beginPath();
					ctx.strokeStyle = (this.options[a].domainColor || this.options.grid.color || 'rgb(0,0,0)');
					ctx.lineWidth = (this.options[a].domainWidth || this.options.grid.border);
					lw = 0.5;
					if(o=="left"){
						ctx.moveTo(c.left+lw,c.top);
						ctx.lineTo(c.left+lw,c.top+c.height);
					}else if(o=="bottom"){
						ctx.moveTo(c.left,c.top+c.height+lw);
						ctx.lineTo(c.left+c.width,c.top+c.height+lw);
					}
					ctx.stroke();
					ctx.closePath();
				}

				ctx.lineWidth = 1;

				// Draw label
				if(this.options[a].title!=""){
					p = [0,0];
					ctx.beginPath();
					ctx.textAlign = "center";
					ctx.textBaseline = "bottom";
					fs = this.getFontHeight(d,'title');
					ctx.font = (this.options[a].titleFontWeight || "bold")+' '+fs+'px '+(this.options[a].titleFont || this.chart.fontfamily);
					ctx.fillStyle = (this.options[a].titleColor || this.options.labels.color);

					// Work out coordinates
					if(o=="bottom") p = [c.left+c.width/2,this.options.height-Math.round(fs/2)-this.chart.padding];
					else if(o=="left") p = [-(c.top+(c.height/2)),Math.round(fs/2)+this.chart.padding];

					if(orient[o] && orient[o].rot) ctx.rotate(-orient[o].rot);
					this.drawTextLabel(this.options[a].title, p[0], p[1]+fs/2, {ctx:ctx, axis:d, format: { fontSize:fs, fontWeight:(this.options[a].titleFontWeight || "bold"), 'font':(this.options[a].titleFont || this.chart.fontfamily), 'baseline':'bottom'}});
					if(orient[o] && orient[o].rot) ctx.rotate(orient[o].rot);
					ctx.closePath();
				}

				// Draw axis grid and labels
				ctx.textAlign = orient[o].textAlign || 'end';
				ctx.textBaseline = orient[o].textBaseline || 'top';

				o = this.options[a].orient || "left";
				// Set axis direction
				d = "x";
				if(o=="left" || o=="right") d = "y";

				c = this.chart;
				//ctx = this.canvas.layers.back.ctx;

				// Get axis properties
				axis = this[d];
				if(!axis) return this;

				// Set font for labels
				fs = this.getFontHeight(d,'label');
				ctx.font = fs+'px '+this.chart.fontfamily;
				ctx.lineWidth = (this.options.grid.width ? this.options.grid.width : 0.5);

				// Set defaults for each axis
				x1 = r.xmin;
				x2 = r.xmax;
				y1 = r.ymax;
				y2 = r.ymin;

				// Calculate the number of decimal places for the increment - helps with rounding errors
				prec = 0;
				if(axis.precision) prec = axis.precision;
				if(axis.ticks.inc){
					prec = ""+axis.ticks.inc.toValue();
					prec = prec.length-prec.indexOf('.')-1;
				}
				oldx = 0;

				mn = axis.ticks.min;
				mx = axis.ticks.max;

				// Loop over the tick marks
				for(ii = 0; ii < axis.ticks.length; ii++) {
					i = axis.ticks[ii].value;
					tickw = tw*(axis.ticks[ii].length||1);
					p = this.getPos(d,i);
					if(!p || !isFinite(p)) continue;
					// As <canvas> uses sub-pixel positioning we want to shift the placement 0.5 pixels
					p = (p-Math.round(p) > 0) ? Math.floor(p)+0.5 : Math.ceil(p)-0.5;
					if(d=="y"){
						y1 = p;
						y2 = p;
					}else if(d=="x"){
						x1 = p;
						x2 = p;
					}
					v = (typeof i==="object") ? i.toValue() : i;
					j = (axis.log) ? v : parseFloat(v.toFixed(prec));

					if(p >= r[d+'min'] && p < r[d+'max']){
						ctx.beginPath();
						ctx.strokeStyle = (this.options[a].gridColor || 'rgba(0,0,0,0.5)');
						ctx.fillStyle = (this.options[a].labelColor || this.options.labels.color);

						// Draw tick labels
						if(show.labels && axis.ticks[ii].label){
							if(d=="x"){
								str = axis.ticks[ii].label;
								if(!str) str = "";
								var ds = str.split(/\n/);
								var maxw = 0;
								for(k = 0; k < ds.length ; k++) maxw = Math.max(maxw,ctx.measureText(ds[k]).width);
								if(x1+maxw/2 <= c.left+c.width && x1 > oldx && x1-maxw/2 > 0){
									ctx.textAlign = 'center';
									ctx.fillStyle = this.options.labels.color;
									for(k = 0; k < ds.length ; k++) this.drawTextLabel(ds[k], x1,(y1 + 3 + tickw + k*fs), {ctx:ctx, axis:d, format: { fontSize:fs, fontWeight:'normal', 'font':fs+'px '+this.chart.fontfamily, 'align':'center','baseline':(orient[o].textBaseline || 'top')}});
									oldx = x1 + (j == axis.ticks.min ? maxw : maxw) + 4;	// Add on the label width with a tiny bit of padding
								}
							}else if(d=="y"){
								if(p > 0){
									ctx.textAlign = 'end';
									if(p-fs < 0) ctx.textBaseline = 'top';
									str = axis.ticks[ii].label;
									ctx.fillText(str,(x1 - 3 - tickw),(y1).toFixed(1));
								}
							}
						}

						ctx.stroke();

						// Draw grid lines if there is a label
						ctx.strokeStyle = (this.options[a].gridColor || 'rgba(0,0,0,0.5)');
						if(show.grid && axis.ticks[ii].label && i >= axis.min && i <= axis.max){
							ctx.beginPath();
							ctx.lineWidth = (this.options[a].gridWidth || 0.5);
							ctx.moveTo(x1,y1);
							ctx.lineTo(x2,y2);
							ctx.stroke();
						}

						// Draw tick marks lines
						ctx.strokeStyle = (this.options[a].tickColor || 'rgba(0,0,0,0.5)');
						if(show.ticks && i >= axis.min && i <= axis.max){
							ctx.beginPath();
							ctx.lineWidth = (this.options[a].tickWidth || 0.5);
							ctx.strokeStyle = (this.options[a].tickColor || 'rgba(0,0,0,0.5)');
							if(d=="x"){
								ctx.moveTo(x1,y1);
								ctx.lineTo(x2,y1+tickw);
							}else if(d=="y"){
								ctx.moveTo(x1,y1);
								ctx.lineTo(x1-tickw,y2);
							}
							ctx.stroke();
							ctx.closePath();
						}
					}
				} // Drawn all the tick marks

				ctx.lineWidth = 0;
			}
		}
		return this;
	};

	/**
	 * @desc Reset all the styles for the datasets
	 */
	Graph.prototype.resetDataStyles = function(){
		for(var sh in this.marks){
			if(this.marks[sh].update && this.marks[sh].show) this.marks[sh].mark = this.marks[sh].update.call(this,this.marks[sh].mark,this.marks[sh].encode.update);
		}
		return this;
	};

	/**
	 * @desc Cancel any currently processing drawing step
	 */
	Graph.prototype.stop = function(){
		this.cancelredraw = true;
		if(this.timeout.redraw) clearTimeout(this.timeout.redraw);
		return this;
	};

	/**
	 * @desc Replacement function to combine calculateData() and draw() but allow interrupt
	 * @param {object} attr - attributes
	 * @param {boolean} attr.update - do we update things as we go?
	 * @param {boolean} attr.cancelable - can we cancel this redraw part-way through?
	 * @param {function} attr.callback - a callback function that gets called once we've finished
	 */
	Graph.prototype.redraw = function(attr){
		this.log.message('redraw');
		this.log.time('redraw');

		if(!attr) attr = {};
		if(typeof attr.update!=="boolean") attr.update = true;
		if(typeof attr.cancelable!=="boolean") attr.cancelable = true;

		var sh,chunk,series;
		this.cancelredraw = false;
		this.ready = false;

		// The calculation can lock up the process if there are a lot of points.
		// In order to be able to interrupt/cancel the calculation we need to 
		// put it into a setTimeout loop.
		chunk = 10000;	// Number of points to process at a time
		// Build a temporary array to store how many points we've processed for each series
		series = [];
		for(sh in this.marks){
			if(this.marks[sh] && this.marks[sh].show) series.push({'id':sh,'done':0});
		}

		// Function to process all the series chunk-by-chunk
		function processChunk(self,s,attr){
			var sh,d,i,j,v,a,a1,a2,axes,axis;
			axes = ['x','y'];
			j = 0;
			while(j < chunk && s < series.length && !self.cancelredraw){
				sh = series[s].id;

				// If we haven't yet finished this series
				for(i = series[s].done; i < self.marks[sh].mark.length && j < chunk; i++, j++){
					d = self.marks[sh].mark[i];

					// Store IDs for the layer and the item
					if(!d.id) d.id = parseInt(sh)+':'+i;
					for(axis = 0; axis < axes.length; axis++){
						a = axes[axis];
						a1 = a+'1';
						a2 = a+'2';
						if(d.data[a]!=null){

							v = self.getPos(a,d.data[a]);

							d.props[a] = parseFloat(v.toFixed(1));

							// Add properties for rule lines
							if(self.marks[sh].type=="rule"){
								if(!d.data[a2] && d.data[a]) d.data[a2] = clone(d.data[a]);
							}

							if(typeof d.data[a2]!=="undefined"){
								d.props[a2] = self.getPos(a,d.data[a2]);
								d.props[a1] = v;
								d.props[a] = v + (d.props[a2]-v)/2;
							}else{
								// Clear x1/x2 values in props if they aren't in data
								if(typeof d.props[a2]!=="undefined"){
									d.props[a1] = null;
									d.props[a2] = null;
								}
							}
						}
					}
				}
				series[s].done = i;

				// If we've finished this series we increment the counter
				if(series[s].done >= self.marks[sh].mark.length) s++;
			}

			// Have we finished or should we loop again?
			if(s >= series.length){

				// Done
				self.log.time('redraw');

				// Draw the points
				self.draw(attr.update);

				self.finishDraw(true);
				// Call the callback if we have one
				if(typeof attr.callback==="function") attr.callback.call((attr.self || self),{});

			}else{
				// Loop again
				if(attr.cancelable) self.timeout.redraw = setTimeout(processChunk,0,self,s,attr);
				else processChunk(self,s,attr);
			}
		}

		// Start processing
		if(attr.cancelable) this.timeout.redraw = setTimeout(processChunk,0,this,0,attr);
		else processChunk(this,0,attr);

		return this;
	};

	/**
	 * @desc Complete a drawing step
	 */
	Graph.prototype.finishDraw = function(update){
		// Reset the offsets
		this.offset.x = 0;
		this.offset.y = 0;
		this.offset.dx = 0;
		this.offset.dy = 0;
		if(update) this.canvas.copyToClipboard();
		this.ready = true;
		return this;
	};

	/**
	 * @desc Calculate all the data
	 * @param {boolean} update - if set to false we don't bother calculating anything
	 */
	Graph.prototype.calculateData = function(update){
		this.log.message('calculateData');
		this.log.time('calculateData');

		if(typeof update!=="boolean") update = true;
		if(!update) return this;

		var d,sh,i,v,a,a1,a2,axes,axis;
		axes = ['x','y'];

		for(sh in this.marks){
			if(this.marks[sh]){
				for(i = 0; i < this.marks[sh].mark.length ; i++){
					d = this.marks[sh].mark[i];

					// Store IDs for the layer and the item
					if(!d.id) d.id = parseInt(sh)+':'+i;
					for(axis = 0; axis < axes.length; axis++){
						a = axes[axis];
						a1 = a+'1';
						a2 = a+'2';
						if(d.data[a]!=null){

							v = this.getPos(a,d.data[a]);

							d.props[a] = parseFloat(v.toFixed(1));

							// Add properties for rule lines
							if(this.marks[sh].type=="rule"){
								if(!d.data[a2] && d.data[a]) d.data[a2] = clone(d.data[a]);
							}

							if(typeof d.data[a2]!=="undefined"){
								d.props[a2] = this.getPos(a,d.data[a2]);
								d.props[a1] = v;
								d.props[a] = v + (d.props[a2]-v)/2;
							}else{
								// Clear x1/x2 values in props if they aren't in data
								if(typeof d.props[a2]!=="undefined"){
									d.props[a1] = null;
									d.props[a2] = null;
								}
							}
						}
					}
				}
			}
		}

		this.log.time('calculateData');

		return this;
	};

	/**
	 * @desc Draw the data onto the graph
	 */
	Graph.prototype.drawData = function(){

		var p,sh,ctx,i,m,update;
		// Define a pixel->data lookup function
		if(!this.picker) this.picker = new Picker(this);
		// Clear the data canvas
		this.clear(this.paper.data.ctx);
		this.paper.data.scale = {'x':1,'y':1};
		ctx = this.canvas.layers.front.ctx;

		for(sh in this.marks){
			if(this.marks[sh].show && this.marks[sh].include){
				this.log.time('drawData '+sh+' '+this.marks[sh].type);
				this.setCanvasStyles(this.paper.data.ctx,this.marks[sh].mark[0]);
				this.setCanvasStyles(this.paper.temp.ctx,this.marks[sh].mark[0]);

				// Build the clip path for this marker layer
				if(this.marks[sh].clip){
					this.paper.data.ctx.save();
					this.paper.data.ctx.beginPath();
					this.paper.data.ctx.rect(this.chart.left,this.chart.top,this.chart.width,this.chart.height);
					this.paper.data.ctx.clip();
				}

				// Draw lines
				if(!this.canvas.layers.threeD.ctx){
					// If we don't have a 3D context we just draw
					if(this.marks[sh].type=="line") this.drawLine(sh,{'update':true});
					if(this.marks[sh].type=="rule") this.drawRule(sh,{'update':true});
					if(this.marks[sh].type=="area") this.drawArea(sh,{'update':true});
				}
				if(this.marks[sh].type=="symbol" || this.marks[sh].type=="rect" || this.marks[sh].type=="text"){
					// Work out if we need to update these marks
					update = (typeof this.marks[sh].hover==="function" && this.marks[sh].interactive);

					// Loop over points drawing them
					for(i = 0; i < this.marks[sh].mark.length ; i++){
						m = this.marks[sh].mark[i];
						p = m.props;
						if(p.x && p.y){
							// If we don't have a 3D context we just draw
							if(!this.canvas.layers.threeD.ctx){
								if(this.marks[sh].type=="symbol") this.drawShape(m,{'update':update});
								else if(this.marks[sh].type=="rect") this.drawRect(m,{'update':update});
							}
							if(this.marks[sh].type=="text") this.drawText(m,{'update':update});
						}
					}
				}
				this.log.time('drawData '+sh+' '+this.marks[sh].type);
				// Apply the clipping if set
				if(this.marks[sh].clip) this.paper.data.ctx.restore();
			}
		}
		// Draw the data canvas to the main canvas
		try { this.canvas.layers.front.ctx.drawImage(this.paper.data.c,0,0,this.paper.data.width,this.paper.data.height); }catch(e){ }


		// Now do the 3D layers
		if(this.canvas.layers.threeD.ctx){

			this.log.message('draw3D');

			let fillColor = [255/255, 255/255, 0/255, 1];
			let strokeColor = [255/255, 0/255, 0/255, 1];
			let strokeWidth = 1.0;

			// Set 3D properties
			if(!this.threeD){
				this.threeD = {
					'currentTranslation': [0,0],
					'view': new Matrix(),
					'layers':[],
					'layercounter': 0
				}
			}

			var ctx = this.canvas.layers.threeD.ctx;
			
			this.threeD.viewPort = {'left':this.chart.left, 'top':this.chart.top, 'right':this.chart.right, 'bottom':this.chart.bottom};
			this.threeD.currentScale = [this.x.range, this.y.range];
			this.threeD.currentTranslation = [this.x.min-this.x.data.min, this.y.min-this.y.data.min];

			// Define the viewport area in pixels (x,y,w,h)
			ctx.viewport(this.threeD.viewPort.left, this.threeD.viewPort.bottom, this.canvas.width()-this.threeD.viewPort.left-this.threeD.viewPort.right, this.canvas.height()-this.threeD.viewPort.top-this.threeD.viewPort.bottom);
			ctx.clearColor(0, 0, 0, 0);
			ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT);
			ctx.enable(ctx.BLEND);


			// Update view
			this.threeD.view = this.threeD.view.setIdentity().translate(-this.threeD.currentTranslation[0]*2/this.threeD.currentScale[0],-this.threeD.currentTranslation[1]*2/this.threeD.currentScale[1]).scale(2/this.threeD.currentScale[0], 2/this.threeD.currentScale[1]).translate(-1,-1);

			for(var n = 0 ; n < this.threeD.layers.length; n++){
				if(this.marks[this.threeD.layers[n].markID].show && this.marks[this.threeD.layers[n].markID].include){
					if(this.threeD.layers[n].shader=="sprite"){
						ctx.blendFunc(ctx.SRC_ALPHA, ctx.ONE_MINUS_SRC_ALPHA);
						ctx.depthMask(false);
					}else{
						ctx.blendFunc(ctx.SRC_ALPHA_SATURATE, ctx.ONE);
						ctx.depthMask(true);
					}
					ctx.useProgram(this.threeD.layers[n].program);

					// Set the view for this program
					if(this.threeD.layers[n].loc.uMatrix) ctx.uniformMatrix3fv(this.threeD.layers[n].loc.uMatrix, false, this.threeD.view.v);

					// Set colour
					if(this.threeD.layers[n].loc.uColor){
						c = "#000000";
						if(this.threeD.layers[n].color=="strokeStyle") c = (getRGBA(this.threeD.layers[n].style.stroke,this.threeD.layers[n].style.opacity||1.0)||strokeColor);
						if(this.threeD.layers[n].color=="fillStyle") c = (getRGBA(this.threeD.layers[n].style.fillStyle,this.threeD.layers[n].style.fillOpacity||1.0)||fillColor);
						ctx.uniform4fv(this.threeD.layers[n].loc.uColor,c);
					}

					// Set stroke width
					if(this.threeD.layers[n].loc.uStrokeWidth) ctx.uniform1f(this.threeD.layers[n].loc.uStrokeWidth, (this.threeD.layers[n].style.strokeWidth||strokeWidth));

		//			gl.ctx.uniform1i(layers[n].loc.uYLog, true);
		//			gl.ctx.uniform1f(layers[n].loc.uYLogMin,-1.0);
		//			gl.ctx.uniform1f(layers[n].loc.uYLogMax,1.2);

					if(this.threeD.layers[n].shader=="sprite"){
						ctx.uniform1i(this.threeD.layers[n].loc.uTexture, n);
						if(this.threeD.layers[n].size) ctx.uniform1f(this.threeD.layers[n].loc.uPointSize,this.threeD.layers[n].icon.width/window.devicePixelRatio);
						ctx.activeTexture(ctx.TEXTURE0+n);	// this is the nth texture
					}
					if(this.threeD.layers[n].shader=="point"){
						if(this.threeD.layers[n].size) ctx.uniform1f(this.threeD.layers[n].loc.uPointSize,this.threeD.layers[n].size);
					}

					// Only called when not initiated
					if(!this.threeD.layers[n].initiated && this.threeD.layers[n].vertex){

						// Set the size of the canvas
						if(this.threeD.layers[n].loc.uSize) ctx.uniform2fv(this.threeD.layers[n].loc.uSize, [this.canvas.width(),this.canvas.height()]);

						// For rule types set if it covers the full width/height of the view
						if(this.threeD.layers[n].loc.uXaxis) ctx.uniform1f(this.threeD.layers[n].loc.uXaxis, (this.threeD.layers[n].style.group=="width"));
						if(this.threeD.layers[n].loc.uYaxis) ctx.uniform1f(this.threeD.layers[n].loc.uYaxis, (this.threeD.layers[n].style.group=="height"));

						ctx.bindBuffer(ctx.ARRAY_BUFFER, this.threeD.layers[n].buffer);
						aVertexPosition = ctx.getAttribLocation(this.threeD.layers[n].program, "aVertexPosition");
						ctx.vertexAttribPointer(aVertexPosition, this.threeD.layers[n].vertex.components, ctx.FLOAT, false, 0, 0);
						ctx.enableVertexAttribArray(aVertexPosition);
				
						if(this.threeD.layers[n].shader=="thickline"){
							aNormalPosition = ctx.getAttribLocation(this.threeD.layers[n].program, "aNormalPosition");
							ctx.vertexAttribPointer(aNormalPosition, this.threeD.layers[n].vertex.components, ctx.FLOAT, false, 0, this.threeD.layers[n].vertex.count * 8);
							ctx.enableVertexAttribArray(aNormalPosition);
						}

						ctx.bindBuffer(ctx.ARRAY_BUFFER, this.threeD.layers[n].bufferIndex);

						aVertexIndex = ctx.getAttribLocation(this.threeD.layers[n].program, "aVertexIndex");
						if(aVertexIndex >= 0){
							ctx.vertexAttribPointer(aVertexIndex, 1, ctx.FLOAT, false, 0, 0);
							ctx.enableVertexAttribArray(aVertexIndex);
						}
				
						this.threeD.layers[n].inititated;
					}

					ctx.drawArrays(ctx[this.threeD.layers[n].vertex.type], 0, this.threeD.layers[n].vertex.count);
				}
			}
		}

		return this;
	};

	/**
	 * @desc Remove the canvas from DOM
	 */
	Graph.prototype.remove = function(){
		this.canvas.holder.remove();
		return {};
	};

	/**
	 * @desc Draw a rectangle
	 * @param {object} datum - the data point's attributes
	 * @param {object} attr - extra attributes
	 * @param {context} attr.ctx - the context of the canvas
	 * @param {number} attr.x - the x-axis centre value (used in conjunction with datum.props.format.width)
	 * @param {number} attr.y - the y-axis centre value (used in conjunction with datum.props.format.height)
	 * @param {number} attr.x1 - the x-axis value x1 value
	 * @param {number} attr.y1 - the y-axis value y1 value
	 * @param {number} attr.x2 - the x-axis value x2 value
	 * @param {number} attr.y2 - the y-axis value y2 value
	 */
	Graph.prototype.drawRect = function(datum,attr){
		var x1,y1,x2,y2,dx,dy,o,ctx,n,l,r,t,b,ok;
		n = "number";
		ctx = (attr.ctx || this.paper.data.ctx);
		if(is(attr.x,n)) datum.props.x = attr.x;
		if(is(attr.y,n)) datum.props.y = attr.y;
		if(is(attr.x1,n)) datum.props.x1 = attr.x1;
		if(is(attr.y1,n)) datum.props.y1 = attr.y1;
		if(is(attr.x2,n)) datum.props.x2 = attr.x2;
		if(is(attr.y2,n)) datum.props.y2 = attr.y2;
		if(is(datum.props.x2,n) || is(datum.props.y2,n)){
			x1 = is(datum.props.x1,n) ? datum.props.x1 : datum.props.x;
			y1 = is(datum.props.y1,n) ? datum.props.y1 : datum.props.y;
			x2 = is(datum.props.x2,n) ? datum.props.x2 : x1;
			y2 = is(datum.props.y2,n) ? datum.props.y2 : y1;
			dx = (x2-x1);
			dy = (y2-y1);

			// Use provided width/height
			if(datum.props.format.width){
				x1 = x1+(dx-datum.props.format.width)/2;
				dx = datum.props.format.width;
			}
			if(datum.props.format.height){
				y1 = y1+(dy-datum.props.format.height)/2;
				dy = datum.props.format.height;
			}

			// Bail out if it is outside the chart area
			l = 0;
			r = this.canvas.width();
			t = 0;
			b = this.canvas.height();
			ok = false;
			if((x2 >= l && x1 <= r) || (y1 >= b && y2 <= t) || (datum.props.x+dx > l && datum.props.x-dx < r) || (datum.props.y+dy > t && datum.props.y-dy < b)) ok = true;
			if(!ok) return {};

			ctx.beginPath();
			ctx.rect(x1,y1,dx,dy);
			ctx.fill();
			ctx.closePath();
			o = {'id':datum.id,'xa':Math.floor(x1),'xb':Math.ceil(x2),'ya':Math.round(y2),'yb':Math.round(y1),'w':1};
			return o;
		}
		return "";
	};

	/**
	 * @desc Draw a rule
	 * @param {number} sh - the index of the mark set
	 * @param {context} attr.ctx - the context of the canvas
	 */
	Graph.prototype.drawRule = function(sh,attr){
		if(!attr) attr = {};
		var ctx,i,p,m;
		ctx = (attr.ctx || this.paper.data.ctx);
		this.clear(this.paper.temp.ctx);
		this.paper.temp.ctx.beginPath();
		for(i = 0; i < this.marks[sh].mark.length ; i++){
			m = this.marks[sh].mark[i];
			p = m.props;
			if(m.data.x){
				if(!m.data.x.scale){
					if(m.data.x.value == 0) p.x1 = this.chart.left;
					if(m.data.x2.field && m.data.x2.field.group=="width") p.x2 = this.chart.width+this.chart.left;
				}
			}
			if(m.data.y){
				if(!m.data.y.scale){
					if(m.data.y.value == 0) p.y1 = this.chart.top;
					if(m.data.y2.field && m.data.y2.field.group=="height") p.y2 = this.chart.height+this.chart.top;
				}
			}
			if(isNaN(p.x)){
				p.x1 = this.chart.left;
				p.x2 = this.chart.width+this.chart.left;
			}
			if(isNaN(p.y)){
				p.y1 = this.chart.top;
				p.y2 = this.chart.height+this.chart.top;
			}
			if(!p.x1) p.x1 = p.x;
			if(!p.x2) p.x2 = p.x;
			if(!p.y1) p.y1 = p.y;
			if(!p.y2) p.y2 = p.y;
			if(p.x1 && p.y1) this.paper.temp.ctx.moveTo(p.x1,p.y1);
			if(p.x2 && p.y2) this.paper.temp.ctx.lineTo(p.x2,p.y2);
		}
		this.paper.temp.ctx.stroke();
		ctx.drawImage(this.paper.temp.c,0,0,this.paper.temp.width,this.paper.temp.height);
		return this;
	};

	/**
	 * @desc Draw a visible line segment (deprecated)
	 * @param {number} ax - starting x position
	 * @param {number} ay - starting y position
	 * @param {number} bx - ending x position
	 * @param {number} by - ending y position
	 */
	Graph.prototype.drawVisibleLineSegment = function(ax,ay,bx,by){
		// If the two points are both off to the left, right, top, or bottom the line won't be visible
		var w = this.canvas.width();
		var h = this.canvas.height();
		if((ax < 0 && bx < 0) || (ax > w && bx > w) || (ay < 0 && by < 0) || (ay > h && by > h)) return 0;
		// Truncate left edge of the line
		if(ax < 0){
			ay = ay + (by-ay)*(Math.abs(ax)/(bx-ax));
			ax = 0;
		}
		// Truncate right edge of the line
		if(bx > w){
			by = ay + (by-ay)*((w-ax)/(bx-ax));
			bx = w;
		}
		// Truncate top edge of the line
		if(ay < 0){
			ax = ax + (bx-ax)*(Math.abs(ay)/(by-ay));
			ay = 0;
		}
		// Truncate bottom edge of the line
		if(by > h){
			bx = ax + (bx-ax)*((h-ay)/(by-ay));
			by = h;
		}
		this.paper.temp.ctx.moveTo(ax,ay);
		this.paper.temp.ctx.lineTo(bx,by);
		return 1;
	};

	/**
	 * @desc Draw a line
	 * @param {number} sh - the index of the mark set
	 * @param {context} attr.ctx - the context of the canvas
	 */
	Graph.prototype.drawLine = function(sh,attr){
		var ctx,i,xok,oldxok,n;
		ctx = (attr.ctx || this.paper.data.ctx);
		this.clear(this.paper.temp.ctx);
		this.paper.temp.ctx.beginPath();
		this.paper.temp.ctx.moveTo(this.marks[sh].mark[0].x,this.marks[sh].mark[0].y);
		n = this.marks[sh].mark.length;
		for(i = 1; i < n ; i++){
			xok = !isNaN(this.marks[sh].mark[i].props.x);
			if(oldxok && xok) this.paper.temp.ctx.lineTo(this.marks[sh].mark[i].props.x,this.marks[sh].mark[i].props.y);
			oldxok = xok;
		}
		this.paper.temp.ctx.stroke();
		ctx.drawImage(this.paper.temp.c,0,0,this.paper.temp.width,this.paper.temp.height);
		return this;
	};

	/**
	 * @desc Draw an area on the chart
	 * @param {number} sh - the index of the mark set
	 * @param {context} attr.ctx - the context of the canvas
	 */
	Graph.prototype.drawArea = function(sh,attr){
		var ctx,a,j,poly,coord;
		ctx = (attr.ctx || this.paper.data.ctx);
		this.clear(this.paper.temp.ctx);
		this.paper.temp.ctx.beginPath();
		
		// Find each polygon in screen space
		poly = getPolygons(this.marks[sh].data);

		// Draw each polygon
		for(a = 0; a < poly.length; a++){
			if(poly[a]){
				for(j = 0; j < poly[a].length; j++){
					coord = { 'x':this.getPos('x',poly[a][j][0]),'y':this.getPos('y',poly[a][j][1]) };
					if(j==0) this.paper.temp.ctx.moveTo(coord.x,coord.y);
					else this.paper.temp.ctx.lineTo(coord.x,coord.y);
				}
			}
		}

		this.paper.temp.ctx.fill();
		if(this.marks[sh].mark[0].props.format.strokeWidth > 0) this.paper.temp.ctx.stroke();

		ctx.drawImage(this.paper.temp.c,0,0,this.paper.temp.width,this.paper.temp.height);

		return this;
	};

	/**
	 * @desc Draw text on the chart
	 * @param {object} datum - the data point
	 * @param {number} datum.props.x - the x-axis value to draw the text
	 * @param {number} datum.props.y - the y-axis value to draw the text
	 * @param {number} attr.x - over-ride the x-axis value
	 * @param {number} attr.y - over-ride the y-axis value
	 * @param {context} attr.ctx - the context of the canvas
	 */
	Graph.prototype.drawText = function(datum,attr){
		var ctx,t,f,o,x,y;
		ctx = (attr.ctx || this.paper.data.ctx);
		x = (attr.x || datum.props.x);
		y = (attr.y || datum.props.y);
		t = (attr.text || datum.data.text || "Label");
		f = JSON.parse(JSON.stringify(datum.props.format));
		if(attr.props) G.extend(f,attr.props);
		o = this.drawTextLabel(t,x,y,{'ctx':ctx,'format':f});
		o.id = datum.id;
		o.weight = 1;
		return o;
	};

	/**
	 * @desc Draw a text label
	 * @param {string} txt - the text to show
	 * @param {number} x - the x-axis value to draw the text
	 * @param {number} y - the y-axis value to draw the text
	 * @param {context} attr.ctx - the context of the canvas
	 * @param {object} attr.format - formatting properties for the text
	 * @param {string} attr.format.font - the font family to use
	 * @param {string} attr.format.fontSize - the font size to use
	 * @param {string} attr.format.fontWeight - the font weight to use
	 * @param {string} attr.format.align - the text alignment
	 * @param {string} attr.format.baseline - the text baseline
	 */
	Graph.prototype.drawTextLabel = function(txt,x,y,attr){
		if(!attr) attr = {};
		var str,w,b,l,bits,f,fs,s,ctx,dy;

		ctx = (attr.ctx||this.canvas.layers.front.ctx);
		f = (attr.format || {});
		if(!f.font) f.font = this.chart.fontfamily;
		if(!f.fontSize) f.fontSize = this.chart.fontsize*this.fontscale;
		if(!f.fontWeight) f.fontWeight = "bold";
		if(!f.align) f.align = "center";
		if(!f.baseline) f.baseline = "middle";

		// Deal with superscript
		if(!txt) txt = "";
		if(typeof txt==="object" && txt.value) txt = txt.value;
		str = (typeof txt==="string" ? 'NORMAL==='+txt.replace(/([\^\_])\{([^\}]*)\}/g,function(m,p1,p2){ var t = (p1=="^" ? 'SUP':'SUB');return '%%'+t+'==='+p2+'%%NORMAL==='; }):'');
		str = str.replace(/%%NORMAL===$/,"");
		bits = str.split(/%%/);

		w = 0;
		// Calculate the width of the text
		for(b = 0; b < bits.length; b++){
			bits[b] = bits[b].split("===");
			if(f.fontSize && f.font){
				fs = (bits[b][0]=="NORMAL" ? 1 : 0.8)*f.fontSize;
				ctx.font = buildFont(f);
			}
			w += ctx.measureText(bits[b][1]).width;
		}

		// Starting x-position
		var xo = x + (f.dx||0);
		if(f.align == "center") xo -= w/2;
		if(f.align == "right") xo -= w;
		//if(f.baseline == "top") ;
		// We've taken control of the positioning
		ctx.textAlign = "left";
		ctx.textBaseline = f.baseline;

		for(b=0,l=xo; b < bits.length; b++){
			s = (bits[b][0]=="NORMAL" ? 1 : 0.6);
			fs = s*f.fontSize;
			dy = 0;
			if(bits[b][0] == "SUP") dy = -(1-s)*f.fontSize;
			if(bits[b][0] == "SUB") dy = (1-s)*f.fontSize;
			ctx.font = f.fontWeight+' '+Math.round(fs)+'px '+f.font;
			ctx.fillText(bits[b][1],l,y+dy);
			l += ctx.measureText(bits[b][1]).width;
		}
		return {xa:Math.floor(xo),xb:Math.ceil(l),ya:Math.floor(y),yb:Math.ceil(y + f.fontSize)};
	};

	/**
	 * @desc Draw a shape
	 * @param {object} datum - the data point
	 * @param {number} datum.id - the index of the data point
	 * @param {string} data.props.symbol.shape - the shape to draw e.g. "circle", "rect", "cross", "diamond", "triangle-up", "triangle-down", "triangle-left", and "triangle-right"
	 * @param {number} datum.props.x - the x-axis value to draw the data point (use with width or x2)
	 * @param {number} datum.props.y - the y-axis value to draw the data point (use with height or y2)
	 * @param {number} datum.props.x2 - the second x value for type "rect" (used with x)
	 * @param {number} datum.props.y2 - the second y value for type "rect" (used with y)
	 * @param {number} datum.props.xc - a centre x value for type "rect" (used with width)
	 * @param {number} datum.props.yc - a centre y value for type "rect" (used with height)
	 * @param {number} datum.props.format.size - the size of the object (related to area)
	 * @param {number} datum.props.format.width - default width used for type "rect"
	 * @param {number} datum.props.format.height - default height for type "rect"
	 * @param {number} datum.props.width - width used for type "rect"
	 * @param {number} datum.props.height - height for type "rect"
	 * @param {number} attr.x - over-ride the x-axis value
	 * @param {number} attr.y - over-ride the y-axis value
	 * @param {context} attr.ctx - the context of the canvas (default is this.paper.data.ctx)
	 */
	Graph.prototype.drawShape = function(datum,attr){
		if(!attr.ctx) attr.ctx = this.paper.data.ctx;
		var ctx,p,x1,y1;
		ctx = attr.ctx;
		p = datum.props;

		x1 = (typeof attr.x==="number" ? attr.x : p.x);
		y1 = (typeof attr.y==="number" ? attr.y : p.y);

		Icon(p.symbol.shape,{'size':(Math.sqrt(p.format.size) || 4),'ctx':attr.ctx,'x':x1,'y':y1});

		return this;
	};

	Graph.prototype.drawIcon = function(typ,attr){
		return Icon(typ,attr);
	}

	/**
	 * @desc Clear the canvas
	 */
	Graph.prototype.clear = function(ctx){
		var w,h;
		w = ctx ? ctx.canvas.width : this.canvas.width();
		h = ctx ? ctx.canvas.height : this.canvas.height();
		(ctx || this.canvas.layers.front.ctx).clearRect(0,0,w,h);
		(ctx || this.canvas.layers.back.ctx).clearRect(0,0,w,h);
		return this;
	};

	/**
	 * @desc Draw everything - the axes, the data, and overlays
	 */
	Graph.prototype.draw = function(){
		this.log.time('draw');
		this.clear();
		this.drawAxes();
		this.drawData();
		this.finishDraw();
		this.log.time('draw');
		return this;
	};

	/**
	 * @desc Tidy up a string with rounding errors
	 * @param {string} v - the string to tidy
	 */
	function tidy(v){
		if(typeof v!=="string") return "";
		if(v=="0") return v;
		return v.replace(/\.0+e/,"e").replace(/\.0{6}[0-9]+e/,"e").replace(/([0-9]+)\.9{6}[0-9]+e/,function(m,p1){ var val = parseFloat(p1); return (val+(val < 0 ? -1 : 1))+"e"; }).replace(/(\.[1-9]+)0+e/,function(m,p1){ return p1+"e"; }).replace(/\.0$/,"").replace(/\.([0-9]+?)0+$/g,function(m,p1){ return "."+p1; });
	}

	/**
	 * @desc Remove rounding errors from a string
	 * @param {number} e - the value tidy
	 */
	function removeRoundingErrors(e){
		return (e) ? e.toString().replace(/(\.[0-9]+[1-9])[0]{6,}[1-9]*/,function(m,p1){ return p1; }).replace(/(\.[0-9]+[0-8])[9]{6,}[0-8]*/,function(m,p1){ var l = (p1.length-1); return parseFloat(p1).toFixed(l); }).replace(/^0+([0-9]+\.)/g,function(m,p1){ return p1; }) : "";
	}

	/**
	 * @desc Build the canvas font string
	 * @param {string} f.fontWeight - the weight of the font e.g. "bold"
	 * @param {number} f.fontSize - the font size in pixels
	 * @param {string} f.font - the font family
	 */
	function buildFont(f){ return f.fontWeight+" "+f.fontSize+"px "+f.font; }

	/**
	 * @desc Get some spacing given a minimum and maximum value
	 * @param {number} mn - the minimum value
	 * @param {number} mx - the maximum value
	 * @param {number} n - the minimum number of steps
	 */
	function defaultSpacing(mn,mx,n){

		var dv,log10_dv,base,frac,options,distance,imin,tmin,i;
		if(typeof mn==="number") mn = Num(mn);
		if(typeof mx==="number") mx = Num(mx);

		// Start off by finding the exact spacing
		dv = mx.minus(mn).div(n);

		// In any given order of magnitude interval, we allow the spacing to be
		// 1, 2, 5, or 10 (since all divide 10 evenly). We start off by finding the
		// log of the spacing value, then splitting this into the integer and
		// fractional part (note that for negative values, we consider the base to
		// be the next value 'down' where down is more negative, so -3.6 would be
		// split into -4 and 0.4).
		log10_dv = Math.log10(dv.toValue());
		base = Math.floor(log10_dv);
		frac = log10_dv - base;

		// We now want to check whether frac falls closest to 1, 2, 5, or 10 (in log
		// space). There are more efficient ways of doing this but this is just for clarity.
		options = [1,2,5,10];
		distance = new Array(options.length);
		imin = -1;
		tmin = 1e100;
		for(i = 0; i < options.length; i++){
			distance[i] = Math.abs(frac - Math.log10(options[i]));
			if(distance[i] < tmin){
				tmin = distance[i];
				imin = i;
			}
		}

		// Now determine the actual spacing
		return Num(Math.pow(10,base)).times(options[imin]).toValue();
	}

	/**
	 * @desc Round the date to a suitable place
	 * @param {number} s - the date (also as a <code>Num</code>)
	 * @param {object} attr - some attributes
	 * @param {number} attr.range - the time range in seconds
	 * @param {number} attr.inc - the increment size
	 * @param {number} attr.n - spacing between ticks in multiples of 'unit'
	 * @param {number} attr.unit - the unit of rounding e.g. "years", "months", "seconds", "decimal"
	 * @param {number} attr.method - the rounding method e.g. "floor"
	*/
	function roundDate(s,attr){
		var d,d2,df,a,a2,time,f,months,ly,ms,bits,idx,str;
		str = (typeof s==="number" ? Num(s):s).toString();
		idx = str.indexOf(".");
		bits = [Num(str),Num(0)];
		if(idx >= 0) bits = [Num(str.substr(0,idx)),Num("0."+str.substr(idx+1,str.length-1))];
		if(!attr) attr = {};
		if(!attr.method) attr.method = "round";
		if(!attr.n || attr.n < 1) attr.n = 1;
		if(!attr.range) attr.range = 1;

		// If we are in the sub-second range we'll 
		// just do some simple number-based rounding
		if(attr.range < 2){
			if(!attr.inc){
				console.error('No increment provided');
				return "";
			}
			a = bits[1].div(attr.inc).round(0,(attr.method=="floor" ? 0 : 3)).times(attr.inc);
			return bits[0].plus(a);
		}

		// If the range is larger than a second we
		// want to process this as a date properly
		ms = bits[0].toValue()*1000;

		time = new Date(ms);
		d = { 'dow': time.getUTCDay(), 'h': time.getUTCHours(), 'm': time.getUTCMinutes(), 's': (time.getUTCSeconds()+time.getUTCMilliseconds()/1000), 'ms': time.getUTCMilliseconds(), 'dd': time.getUTCDate(), 'mm': time.getUTCMonth(), 'yy': time.getUTCFullYear() };
		df = Num(0);
		ly = false;
		if(d.yy%4==0) ly = true;
		if(d.yy%100==0) ly = false;
		if(d.yy%400==0) ly = true;
		months = [31,(ly ? 29 : 28),31,30,31,30,31,31,30,31,30,31];
		// Round to nearest block
		if(attr.unit == "years"){
			a = d.yy + (d.mm + (d.dd + (d.h+((d.m+(d.s/60))/60))/24)/months[d.mm])/12;
			a2 = Math[attr.method].call([],a/attr.n)*attr.n;
			// There is no year zero
			if(a2 == 0) a2 = 1;
			d2 = new Date(zeroFill(a2,4)+'-01-01');
			df = Num(time-d2).div(1000);
		}else if(attr.unit == "months"){
			a = d.mm + d.dd/months[d.mm];
			a2 = (Math[attr.method].call([],a/attr.n)*attr.n + 1);
			if(a2 > 12){
				d.yy += Math.floor(a2/12);
				a2 = a2%12;
			}
			d2 = new Date(d.yy+'-'+zeroFill(a2,2)+'-01');
			df = Num(time-d2).div(1000);
		}else if(attr.unit == "weeks"){
			a = (d.dow + (d.h+((d.m+(d.s/60))/60))/24);
			a2 = Math[attr.method].call([],a/(attr.n*7))*(attr.n*7);
			f = 86400000;
			df = Num(Math.round((a-a2)*f)).div(1000);
		}else{
			f = 1;
			if(attr.unit == "nanoseconds"){ a = d.s; f = 1e-9; }
			else if(attr.unit == "microseconds"){ a = d.s; f = 1e-6; }
			else if(attr.unit == "milliseconds"){ a = d.s; f = 1e-3; }
			else if(attr.unit == "seconds"){ a = d.s; f = 1; }
			else if(attr.unit == "minutes"){ a = d.m + d.s/60; f = 60; }
			else if(attr.unit == "hours"){ a = d.h + (d.m+(d.s/60))/60; f = 3600; }
			else if(attr.unit == "days"){ a = d.dd + (d.h+((d.m+(d.s/60))/60))/24; f = 86400; }
			else{ a = d.s; f = 1; }

			a = Num(a).plus(bits[1].div(f));
			a2 = a.div(attr.n).round(0,(attr.method=="floor" ? 0 : 3)).times(attr.n).times(f);
			a = a.times(f);

			df = a.minus(a2).round(0,(attr.method=="floor" ? 0 : 3));
		}

		return bits[0].minus(df);
	}

	/**
	 * @desc Get the width of the scroll bar
	 */
	var scrollbarwidth = 0;
	function getScrollbarWidth(){ scrollbarwidth = window.innerWidth - S('body')[0].offsetWidth; return scrollbarwidth; }

	/**
	 * @desc Prevent scrolling on mouse wheel events
	 */
	function preventDefault(e) {
		e = e || window.event;
		if (e.preventDefault) e.preventDefault();
		e.returnValue = false;  
	}

	var scrollDisabled = false;
	/**
	 * @desc Disable the scroll event
	 */
	function disableScroll(){
		if(!scrollDisabled){
			if(window.addEventListener) window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
			window.onwheel = preventDefault; // modern standard
			window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
			window.ontouchmove  = preventDefault; // mobile
			// Get width of the scroll bar
			if(getScrollbarWidth() > 0) S('body').css({'overflow':'hidden','margin-right':scrollbarwidth+'px'});
			scrollDisabled = true;
		}
	}

	/**
	 * @desc Enable the scroll event
	 */
	function enableScroll(){
		if(scrollDisabled){
			if(window.removeEventListener) window.removeEventListener('DOMMouseScroll', preventDefault, false);
			window.onmousewheel = document.onmousewheel = null;
			window.onwheel = null;
			window.ontouchmove = null;
			if(scrollbarwidth > 0) S('body').css({'overflow':'','margin-right':''});
			scrollDisabled = false;
		}
	}

	/**
	 * @desc Create logarithmic tick marks that span the range
	 * @param {number} min - the minimum value to include
	 * @param {number} max - the maximum value to include
	 */
	function logTicks(min,max){
		var mn,mx,val,major,minor,i,j,ticks,vis,inc,n,show,o,r;
		ticks = {'length':0,'min':min,'max':max};
		if(min > max) return ticks;

		// Get the log range
		r = (Math.log10(max)-Math.log10(min));
		mn = Math.floor(Math.log10(min));
		mx = Math.ceil(Math.log10(max));
		o = Math.ceil(r/(3*6))*3;

		// The major tick marks
		major = [];

		// First we make the major tick marks
		for(i = mn; i <= mx ; i++){
			val = Num(Math.pow(10,i));
			major.push(val);
			if(val.gt(min) && val.lt(max)){
				// The tick mark is in the range of the graph
				show = true;
				// If the range is big, only show every 'o' orders
				if(r > 8 && Math.log10(val.toValue())%o!=0) show = false;
				ticks[''+ticks.length] = {'value':val,'label':(show ? val.toString() : ''),'length':1};
				ticks.length++;
			}
		}

		// Now create the minor tick marks
		if(ticks.length < 10){
			minor = [];
			n = ticks.length;
			for(i = 0; i < major.length; i++){
				minor.push(major[i]);
				for(j = 2; j <= 9; j++){
					val = major[i].times(j);
					vis = (val.gt(min) && val.lt(max));
					minor.push(val);
					if(vis){
						ticks[''+ticks.length] = {'value':val,'label':(n <= 2 ? val.toString() : ''),'length':1};
						ticks.length++;
					}
				}
			}
			if(ticks.length < 20){
				for(i = 0; i < minor.length; i++){
					inc = Num(Math.pow(10,Math.floor(Math.log10(minor[i].toValue())-1)));
					for(j = 1; j <= 9; j++){
						val = minor[i].plus(inc.times(j));
						vis = (val.gt(min) && val.lt(max));
						if(vis){
							ticks[''+ticks.length] = {'value':val,'label':'','length':0.5};
							ticks.length++;
						}
					}
				}
			}
		}

		return ticks;
	}

	/**
	 * @desc Process layers and look for any matches with the mouse position
	 * @param {object} g - a graph object
	 */
	function Picker(g){
	
		this.log = new Logger({'id':'Picker','logging':g.logging,'logtime':g.logtime});
		
		function inside(point, vs){
			// ray-casting algorithm based on http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
			var i,j,xi,xj,yi,yj,x,y,inside,intersect;
			x = point[0];
			y = point[1];
			inside = false;
			for(i = 0, j = vs.length - 1; i < vs.length; j = i++){
				xi = vs[i][0];
				yi = vs[i][1];
				xj = vs[j][0];
				yj = vs[j][1];
				intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
				if(intersect) inside = !inside;
			}
			return inside;
		}

		function distanceFromLine(p,a,b){
			return Math.sqrt(SqDistancePtSegment(p,a,b));
		}

		function SqDistancePtSegment(p,a,b){
			var c,e,f,n,pa,bp;
			function Dot(p1,p2){ return (p1.x*p2.x + p1.y*p2.y); }

			n = { 'x': b.x - a.x, 'y': b.y - a.y };
			pa = { 'x': a.x - p.x, 'y': a.y - p.y };

			c = Dot(n,pa);

			// Closest point is a
			if(c > 0.0 || (n.x==0 && n.y==0)) return Dot(pa,pa);

			bp = { 'x':p.x - b.x, 'y':p.y - b.y };

			// Closest point is b
			if(Dot(n,bp) > 0.0) return Dot(bp,bp);

			// Closest point is between a and b
			f = (c / Dot(n,n));
			e = {'x':pa.x - n.x * f, 'y': pa.y - n.y*f };

			return Dot(e,e);
		}
		
		function getV(values,key){
			if(typeof values[key]==="number") return values[key];
			else if(typeof values[key]==="object" && typeof values[key].value==="number") return values[key].value;
			else return null;
		}
		/**
		 * @desc Get the matches
		 * @param {object} ls - an object holding the layers
		 * @param {'screen':{'x':number,'y':number},'data':{'x':number,'y':number}} p - the cursor coordinates in data-space and screen-space
		 * @param {number} padding - an optional tolerance in pixels
		 */
		this.getMatches = function(ls,p,padding){
			var rs,a,b,d,i,j,l,m,x,x2,y,y2,w,h,t,dpx,ok,individual,tolerance,polygons;

			this.log.time('getMatches');
			m = [];
			if(!padding) padding = 0;
			if(!ls) ls = [];

			for(l in ls){

				if(!ls[l].encode.hover || !ls[l].show) continue;

				tolerance = padding + (ls[l].format ? ls[l].format.strokeWidth||0 : 0)/2;
				t = ls[l].type;
				rs = ls[l].data;

				individual = false;
				if(t=="rect" && (typeof rs[0].x==="number" || typeof rs[0].y==="number")) t = "rectline";
				if(t=="rule") t = "rectline";
				if(t=="rectline" || t=="symbol") individual = true;

				if(individual){

					// Loop over each individual element and see if they match
					for(i = 0; i < rs.length; i++){

						ok = false;

						// Find the tolerance (half line thickness + padding)
						dpx = (rs[i].strokeWidth ? (rs[i].strokeWidth/2)+padding : tolerance);

						if(t=="rectline"){

							// Check x-value
							x = getV(rs[i],'x');
							x2 = getV(rs[i],'x2');
							y = getV(rs[i],'y');
							y2 = getV(rs[i],'y2');

							if(typeof y2==="number"){
								x = g.getPos('x',x);

								if(p.screen.x >= x-dpx && p.screen.x <= x+dpx){
									a = g.getPos('y',y2);
									if(typeof a==="number"){
										b = g.getPos('y',y);
										if(p.screen.y >= a-dpx && p.screen.y <= b+dpx) ok = true;
									}else ok = true;
								}
							}
							if(typeof x2==="number"){
								y = g.getPos('y',y);
								if(p.screen.y >= y-dpx && p.screen.y <= y+dpx){
									a = g.getPos('x',x2);
									if(typeof a==="number"){
										b = g.getPos('x',x);
										if(p.screen.x >= a-dpx && p.screen.x <= b+dpx) ok = false;
									}else ok = true;
								}
							}

						}else if(t=="symbol"){

							x = g.getPos('x',getV(rs[i],'x'));
							y = g.getPos('y',getV(rs[i],'y'));
							w = dpx + ls[l].format.size/2;
							h = dpx + ls[l].format.size/2;
							if(p.screen.x >= x-w && p.screen.x <= x+w && p.screen.y >= y-h && p.screen.y <= y+h) ok = true;

						}

						if(ok) m.push(l+':'+i);
					}

				}else{

					// We want to match the entire object made of x,y pairs
					if(t=="line"){

						// Get the first point in pixel space
						a = { 'x':g.getPos('x',getV(rs[0],'x')),'y':g.getPos('y',getV(rs[0],'y')) };
						for(i = 1; i < rs.length; i++){
							// Find the tolerance (half line thickness + padding)
							dpx = (rs[i].strokeWidth ? (rs[i].strokeWidth/2)+padding : tolerance);
							b = { 'x':g.getPos('x',getV(rs[i],'x')),'y':g.getPos('y',getV(rs[i],'y')) };
							d = distanceFromLine(p.screen,a,b);
							// We've either matched or we move on to the next segment
							if(d <= dpx){
								m.push(l+':*');
								break;
							}else a = b;
						}

					}else if(t=="area"){

						// Find each polygon in screen space
						polygons = getPolygons(rs);

						// Find the tolerance
						dpx = (rs[0].strokeWidth ? (rs[0].strokeWidth/2)+padding : tolerance);

						// Check each polygon
						for(i = 0; i < polygons.length; i++){

							// Convert coordinates to screen space (add padding to y-axis)
							for(j = 0; j < polygons[i].length; j++){
								b = { 'x':g.getPos('x',polygons[i][j][0]),'y':g.getPos('y',polygons[i][j][1]) };
								polygons[i][j] = [b.x,b.y+(j < polygons[i].length/2 ? dpx : -dpx)];
							}
							
							// Add x-axis padding:
							// Step 1: Move first and last vertex to the left
							polygons[i][0][0] -= dpx;
							polygons[i][polygons[i].length-1][0] -= dpx;
							// Step 2: Move middle vertices to the right
							polygons[i][Math.floor(polygons[i].length/2)][0] += dpx;
							polygons[i][Math.ceil(polygons[i].length/2)][0] += dpx;
							
							if(inside([p.screen.x,p.screen.y],polygons[i])){
								m.push(l+':*');
								break;
							}
						}
					}
				}
			}
			this.log.time('getMatches');
			return m;
		};
		return this;
	}

	function getPolygons(rs){

		// Find each polygon in screen space
		var oldp,areas,poly,pt,a,i,j,k,y1,y2;
		oldp = {};
		areas = [];

		// We need to loop across the data first splitting into segments
		for(i = 0, a = 0; i < rs.length ; i++){
			y1 = (rs[i].y1 || rs[i].y);
			y2 = rs[i].y2;
			if(!isNaN(rs[i].x) && !isNaN(y1) && !isNaN(y2)){
				if(!areas[a]) areas[a] = [];
				areas[a].push(i);
			}else a++;
		}

		// To do: make the polygon lookup processing more efficient by
		// not processing the entire shape in one go
		poly = new Array(areas.length);
		for(a = 0; a < areas.length ; a++){
			if(areas[a] && areas[a].length){
				poly[a] = new Array(areas[a].length*2);
				// Move along top of area (y2 coordinates)
				k = 0;
				for(j = 0; j < areas[a].length; j++,k++){
					pt = rs[areas[a][j]];
					poly[a][k] = [pt.x,pt.y2];
				}
				// Move along bottom of area backwards
				for(j = areas[a].length-1; j >= 0; j--,k++){
					pt = rs[areas[a][j]];
					pt.y1 = (pt.y1 || pt.y);
					poly[a][k] = [pt.x,pt.y1];
				}
			}
		}

		return poly;
	}

	/**
	 * @desc Create a Matrix object
	 * @param {array} m - a 3x3 matrix (stored in a flat array)
	 */
	function Matrix(m){
		this.type = "matrix";
		identity = [1,0,0,0,1,0,0,0,1];
		if(m) this.v = m;
		else this.v = identity;

		this.setIdentity = function(){
			this.v = identity;
			return this;
		}
		this.translate = function(tx,ty){
			this.v = this.multiply([1,0,0,0,1,0,tx,ty,1]);
			return this;
		}
		this.scale = function(sx, sy){
			this.v = this.multiply([sx,0,0,0,sy,0,0,0,1]);
			return this;
		}
		this.multiply = function(m){
			if(m.length == 3 && typeof m[0]==="number"){
				// Point
				return [(m[0]*this.v[0]) + (m[1]*this.v[3]) + (m[2]*this.v[6]), (m[0]*this.v[1]) + (m[1]*this.v[4]) + (m[2]*this.v[7]), (m[0]*this.v[2]) + (m[1]*this.v[5]) + (m[2]*this.v[8])];
			}else{
				// Multiply each column by the matrix
				var r0 = this.multiply([m[0], m[3], m[6]]);
				var r1 = this.multiply([m[1], m[4], m[7]]);
				var r2 = this.multiply([m[2], m[5], m[8]]);
				// Turn the result columns back into a single matrix
				return [r0[0],r1[0],r2[0],r0[1],r1[1],r2[1],r0[2],r1[2],r2[2]];
			}
		}
		return this;
	}

	/**
	 * @desc Create a Path object
	 * @param {string} path - a string defining a path
	 */
	function Path(path){
		this.path = path;
		this.p = path;
		this.size = 1;
		this.off = 0;

		if(typeof path==="string"){
			this.path = path;
			this.p = path.match(/[A-Za-z][^A-Za-z]*/g)
			for(var i = 0; i < this.p.length; i++){
				bits = [];
				this.p[i].replace(/ $/,"").replace(/^([A-Za-z]) ?(.*)$/,function(m,p1,p2){ bits = [p1,p2]; return ""; });
				this.p[i] = bits;
				if(this.p[i][1]){
					this.p[i] = [this.p[i][0]].concat(this.p[i][1].split(/ /));
					for(var j = 1; j < this.p[i].length; j++){
						this.p[i][j] = this.p[i][j].split(/\,/);
						for(var k = 0; k < this.p[i][j].length; k++) this.p[i][j][k] = parseFloat(this.p[i][j][k]);
					}
				}else this.p[i].splice(1,1);
			}
		}
		this.setOrigin = function(x,y){
			this.o = {'x':x,'y':y};
			return this;
		};
		this.setSize = function(s){
			this.size = s;
			return this;
		};
		this.draw = function(ctx){
			var x,y,first,t,size,i,uc;
			x = 0;
			y = 0;
			first;
			t = "";
			size = this.size;
			// Change origin
			if(this.o){
				x = this.o.x;
				y = this.o.y;
				ctx.moveTo(x,y);
			}
			for(i = 0; i < this.p.length; i++){
				t = this.p[i][0];
				uc = (this.p[i][0]==this.p[i][0].toUpperCase());
				if(this.p[i].length > 1){
					for(var j = 1; j < this.p[i].length; j++){
						if(t=="m" || t=="l"){ x += this.p[i][j][0]*size; y += this.p[i][j][1]*size; }
						else if(t=="M" || t=="L"){ x = this.p[i][j][0]*0.5*size + this.o.x; y = this.p[i][j][1]*0.5*size + this.o.y; }
						else if(t=="h") x += this.p[i][j][0]*size;
						else if(t=="H") x = this.p[i][j][0]*0.5*size + this.o.x;
						else if(t=="v") y += this.p[i][j][0]*size;
						else if(t=="V") y = this.p[i][j][0]*0.5*size + this.o.y;
						if(t.toLowerCase()=="m") ctx.moveTo(x,y);
						else ctx.lineTo(x,y);
						if(!first) first = {'x':x,'y':y};
					}
				}else{
					if(t=="Z") ctx.lineTo(first.x,first.y);
				}
			}
			return this;
		}
		this.toString = function(){
			var str = '';
			var size = this.size;
			for(var i = 0; i < this.p.length; i++){
				str += (i>0 ? ' ':'')+this.p[i][0];
				uc = (this.p[i][0]==this.p[i][0].toUpperCase());
				for(var j = 1; j < this.p[i].length; j++){
					str += ' ';
					if(typeof this.p[i][j]==="number") str += this.p[i][j]*(uc ? 0.5 : 1)*size+(uc ? this.o.x : 0);
					else{
						for(var k = 0; k < this.p[i][j].length; k++){
							if(k > 0) str += ',';
							if(typeof this.p[i][j][k]=="number") str += this.p[i][j][k]*(uc ? 0.5 : 1)*size+(uc ? this.o.x : 0);
						}
					}
				}
			}
			if(this.o) str = 'M '+this.o.x+' '+this.o.y+' '+str;
			return str;
		}
		this.svg = function(attr){
			if(!attr) attr = {};
			if(!attr.width) attr.width = 32;
			if(!attr.height) attr.height = 32;
			var svg = '<svg width="'+attr.width+'" height="'+attr.height+'"	viewBox="0 0 '+attr.width+' '+attr.height+'" xmlns="http://www.w3.org/2000/svg"';
			if(attr.overflow) svg += ' style="overflow:visible"';
			svg += '><path d="'+this.toString()+'"'+(attr.fillStyle ? ' fill="'+attr.fillStyle+'"':'')+(attr.strokeStyle ? ' stroke="'+attr.strokeStyle+'"':'')+(attr.strokeWidth ? ' stroke-width="'+attr.strokeWidth+'"':'')+' />'
			svg += '</svg>';
			return svg;
		}
		return this;
	}
	/**
	 * @desc Create an Icon
	 * @param {string} shape - either a defined name or a string defining a path
	 * @param {object} attr - an object defining the icon
	 * @param {number} attr.width - the icon width
	 * @param {number} attr.height - the icon height
	 * @param {number} attr.size - the icon width/height
	 * @param {number} attr.lineWidth - the line width
	 * @param {number} attr.fillStyle - the fill colour
	 * @param {number} attr.strokeWidth - the stroke width
	 */
	function Icon(shape,attr){

		function setWH(p,w,h,s){
			p.width = w;
			p.height = h;
			p.scale = s;
			p.c.width = Math.round(w*s);
			p.c.height = Math.round(h*s);
			p.ctx = p.c.getContext('2d');
			p.ctx.scale(s,s);
			return p;
		}
		
		if(!attr) attr = {};
		var paper,w,h,cx,cy,dw,path,stroke,fill;
		w = attr.width || attr.size;
		h = attr.height || attr.size;
		stroke = false;
		fill = true;

		if(attr.ctx){
			paper = {'ctx':attr.ctx};
		}else{
			// Set properties of the temporary canvas
			paper = setWH({ 'c': document.createElement('canvas') },w,h,window.devicePixelRatio);
			paper.ctx.clearRect(0,0,w,h);
		}
		if(!attr.style) attr.style = {};
		if(!attr.style.lineWidth) attr.style.lineWidth = 0;

		if(attr.style.fillStyle) paper.ctx.fillStyle = attr.style.fillStyle;
		if(attr.style.strokeStyle) paper.ctx.strokeStyle = attr.style.strokeStyle;
		paper.ctx.lineWidth = attr.style.lineWidth;
		paper.ctx.lineCap = (attr.lineCap||"square");

		if(shape=="square" && attr.style.lineWidth > 1) attr.overflow = true; 

		paper.ctx.beginPath();

		cx = (attr.x||w/2);
		cy = (attr.y||h/2);
		dw = (attr.size-attr.style.lineWidth)/2;
		
		if(attr.style.lineWidth > 0) stroke = true;

		if(shape=="circle"){
			paper.ctx.arc(cx,cy,(dw || 4),0,Math.PI*2,false);
			if(fill) paper.ctx.fill();
			if(stroke) paper.ctx.stroke();
		}

		// https://vega.github.io/vega/docs/marks/symbol/
		if(shape=="circle") path = 'm -'+(dw||4)+',0 a '+(dw||4)+' '+(dw||4)+' 0 1 0 '+((dw||4)*2)+' 0 a '+(dw||4)+' '+(dw||4)+' 0 1 0 -'+((dw||4)*2)+' 0';
		else if(shape=="square") path = "m-0.5,0.5 l 1,0 0,-1 -1,0 Z";
		else if(shape=="cross") path = "m-0.2,0.2 h -0.3 v -0.4 h 0.3 v -0.3 h 0.4 v 0.3 h 0.3 v 0.4 h-0.3 v 0.3 h -0.4Z";
		else if(shape=="diamond") path = 'm0,0.5l0.5,-0.5 -0.5,-0.5 -0.5,0.5 Z';
		else if(shape=="triangle-up" || shape=="triangle") path = 'm-0.5,0.4330127 l 1,0 -0.5,-0.8660254 Z';
		else if(shape=="triangle-down") path = 'm-0.5,-0.4330127 l 1,0 -0.5,0.8660254 Z';
		else if(shape=="triangle-right") path = 'm-0.4330127,0.5 l0,-1 0.8660254,0.5Z';
		else if(shape=="triangle-left") path = 'm0.4330127,0.5 l0,-1 -0.8660254,0.5Z';
		else if(shape=="arrow") path = 'm-0.1,0.5 l 0,-0.5 -0.15,0 0.25,-0.5 0.25,0.5 -0.15,0 0,0.5 Z';
		else if(shape=="wedge") path = 'm-0.25,0.4330127 l 0.5,0 -0.25,-0.8660254 Z';
		else if(shape=="stroke") path = 'm-0.5,0 l 1,0';
		else if(shape=="stroke-vertical") path = 'm0,-0.5 l 0,1';
		else if(shape=="hexagram") path = 'm-0.1666667,0.2886751 l 0.1666667,0.2886751 0.1666667,-0.2886751 0.333333,0 -0.1666667,-0.2886751 0.1666667,-0.2886751 -0.333333,0 -0.1666667,-0.2886751 -0.1666667,0.2886751 -0.333333,0 0.1666667,0.2886751 -0.1666667,0.2886751 Z';
		else path = shape;

		if(path[path.length-1]!="Z") fill = false;

		path = (new Path(path));
		path.setOrigin(cx,cy);

		if(shape!="circle"){
			path.setSize(attr.size);
			path.draw(paper.ctx);
			if(fill) paper.ctx.fill();
			if(stroke) paper.ctx.stroke();
		}
		if(attr.output == "texture") return paper.ctx.getImageData(0, 0, attr.size, attr.size);
		else if(attr.output == "svg") return path.svg(attr);
		else return paper.c;
	}
	function addOff(v,off){
		return (typeof v==="number") ? v - off : v;
	}
	/**
	 * @desc Make a WebGL structure for points
	 * @param {array} o - an array of x,y data
	 */
	function makePoints(o,offset){
		var vertices = new Float32Array(o.length*2);
		var ids = new Float32Array(o.length);
		for(i = 0; i < o.length ; i++){
			// Build point-based vertices
			vertices[i*2] = addOff(o[i].x,offset[0]);
			vertices[i*2 + 1] = addOff(o[i].y,offset[1]);
			ids[i] = i;
		}
		return {'data':vertices, 'indices':ids, 'components':2, 'count':o.length, 'type': 'POINTS' };
	}
	/**
	 * @desc Make a WebGL structure for areas
	 * @param {array} o - an array of x,y or x,y1,y2 data
	 */
	function makeBoundaries(o,offset){
		var areas = [];
		var v = [];
		var i,a,poly,y1,y2;
		// We need to loop across the data first splitting into segments
		for(i = 0, a = 0; i < o.length ; i++){
			p = o[i];
			y1 = (typeof p.y1==="number" ? p.y1 : p.y);
			y2 = (typeof p.y2==="number" ? p.y2 : y1);
			if(!isNaN(p.x) && !isNaN(y1) && !isNaN(y2)){
				if(!areas[a]) areas[a] = [];
				areas[a].push(i);
			}else a++;
		}
		poly = new Array(areas.length);

		for(a = 0; a < areas.length ; a++){
			if(areas[a] && areas[a].length){
				// Loop over the top
				for(j = 0; j < areas[a].length; j++){
					p = o[areas[a][j]];
					v.push({'x':addOff(p.x,offset[0]),'y':addOff(p.y2,offset[1])});
				}
				// Loop over the bottom
				for(j = areas[a].length-1; j >= 0; j--){
					p = o[areas[a][j]];
					v.push({'x':addOff(p.x,offset[0]),'y':addOff(p.y1,offset[1])});
				}
				p = o[areas[a][0]];
				// Connect back to the top
				v.push({'x':addOff(p.x,offset[0]),'y':addOff(p.y2,offset[1])});
			}
			// Break the lines
			if(a < areas.length - 1) v.push({'x':null,'y':null});
		}

		return makeThickLines(v,[0,0]);
	}
	function makeAreas(o,offset){
		var areas = [];
		// We need to loop across the data first splitting into segments
		for(i = 0, a = 0; i < o.length ; i++){
			p = o[i];
			y1 = (typeof p.y1==="number" ? p.y1 : p.y);
			y2 = (typeof p.y2==="number" ? p.y2 : y1);
			if(!isNaN(p.x) && !isNaN(y1) && !isNaN(y2)){
				if(!areas[a]) areas[a] = [];
				areas[a].push(i);
			}else a++;
		}
		var v = [];
		// To do: make the polygon lookup processing more efficient by
		// not processing the entire shape in one go
		var poly = new Array(areas.length);
		for(a = 0; a < areas.length ; a++){
			if(areas[a] && areas[a].length){
				for(j = 0; j < areas[a].length-1; j++){
					p1 = o[areas[a][j]];
					p2 = o[areas[a][j+1]];
					v = v.concat([addOff(p1.x,offset[0]),addOff(p1.y2,offset[1]),addOff(p1.x,offset[0]),addOff(p1.y1||p1.y,offset[1]),addOff(p2.x,offset[0]),addOff(p2.y1||p2.y,offset[1]),addOff(p1.x,offset[0]),addOff(p1.y2,offset[1]),addOff(p2.x,offset[0]),addOff(p2.y2,offset[1]),addOff(p2.x,offset[0]),addOff(p2.y1||p2.y,offset[1])]);
				}
			}
		}
		var ids = new Array(v.length/2);
		for(i = 0; i < ids.length; i++) ids[i] = 0;
		return { 'data': new Float32Array(v), 'indices': new Float32Array(ids), 'components': 2, 'count': v.length/2, 'type':'TRIANGLES' };
	}
	function makeThickLines(original,offset){
		// TR: compute normal vector
		var v = [];
		var l = original.length;
		var o = new Array(l*2);
		var i,norm,ivert,ibeg,iend,dx,dy,scale,sign;
		for(i = 0; i < l;i++){
			o[i*2] = addOff(original[i].x,offset[0]);
			o[i*2 + 1] = addOff(original[i].y,offset[1]);
		}

		for(i = 0; i < (o.length / 2 - 1) * 4; i++){
			ivert = Math.floor((i + 2) / 4);

			// Are we dealing with a gap or not?
			if(typeof o[2*ivert]==="number"){
				// Add vertex
				v.push(o[2 * ivert]);
				v.push(o[2 * ivert + 1]);
			}else{
				// For the gap we will add another copy of the previous vertex
				v.push(o[2*ivert - 2]);
				v.push(o[2*ivert - 1]);
			}
		}

		for(i = 0; i < (o.length / 2 - 1) * 4; i++){
			sign = (i%2==0 ? 1 : -1);
			// Find normal vector
			ibeg = Math.floor(i / 4);
			iend = ibeg + 1;
			// Are we dealing with the gap or not?
			if(typeof o[2 * ibeg]==="number" && typeof o[2*ibeg]==="number"){
				// Add normal
				dx = o[2 * iend] - o[2 * ibeg];
				dy = o[2 * iend + 1] - o[2 * ibeg + 1];
				scale = (dx * dx + dy * dy) ** 0.5;
				v.push(-dy / scale * sign);
				v.push(dx / scale * sign);
			}else{
				// This is the gap
				v.push(0.);
				v.push(0.);
			}
		}
		
		var ids = new Array(v.length/2);
		for(i = 0; i < ids.length; i++) ids[i] = 0;

		return {'data':new Float32Array(v), 'indices': new Float32Array(ids), 'components':2,'count': 4 * (l - 1), 'type': 'TRIANGLE_STRIP' };
	}
	function makeThinLines(o,offset){
		var l = o.length;
		var gaps = 0;
		var lines = 0;
		var t = 'LINE_STRIP';
		var v;
		if(o.length >= 2){
			var j = 0;
			for(var i = 0; i < o.length ; i++){
				if(typeof o[i].x!=="number") gaps++;
			}

			if(gaps==0){
				v = new Array(l*2);
				for(var i = 0, j = 0; i < o.length ; i++){
					v[j++] = addOff(o[i].x,offset[0]);
					v[j++] = addOff(o[i].y,offset[1]);
				}
			}else{

				t = 'LINES';
				v = new Array((l-1-gaps*2)*4);

				for(var i = 0, j = 0; i < o.length-1 ; i++){
					// If this segment exists
					if(typeof o[i].x==="number" && typeof o[i+1].x==="number"){
						v[j++] = addOff(o[i].x,offset[0]);
						v[j++] = addOff(o[i].y,offset[1]);
						v[j++] = addOff(o[i+1].x,offset[0]);
						v[j++] = addOff(o[i+1].y,offset[1]);
					}
				}
			}
		}
		var ids = new Array(v.length/2);
		for(i = 0; i < ids.length; i++) ids[i] = 0;
		return {'data':new Float32Array(v), 'indices': new Float32Array(ids), 'components':2, 'count': v.length/2, 'type':t };
	}
	function makeRectAreas(o,offset){
		var vertices = [];
		var ids = [];
		var a,p;
	
		// To do: make the polygon lookup processing more efficient by
		// not processing the entire shape in one go
		for(a = 0; a < o.length ; a++){
			p = o[a];
			vertices = vertices.concat([addOff(p.x1,offset[0]),addOff(p.y1,offset[1]),addOff(p.x1,offset[0]),addOff(p.y2,offset[1]),addOff(p.x2,offset[0]),addOff(p.y1,offset[1]),addOff(p.x1,offset[0]),addOff(p.y2,offset[1]),addOff(p.x2,offset[0]),addOff(p.y2,offset[1]),addOff(p.x2,offset[0]),addOff(p.y1,offset[1])]);
			ids = ids.concat([a,a,a,a,a,a]);
		}
		
		return { 'data': new Float32Array(vertices), 'indices': new Float32Array(ids), 'components': 2, 'count': vertices.length/2, 'type':'TRIANGLES' };
	}
	function makeRectLines(o,offset){
		var v = [];
		var ids = [];
		for(i = 0; i < o.length;i++){
			if(typeof o[i].x==="number"){
				v.push({'x':addOff(o[i].x,offset[0]),'y':addOff(o[i].y1||o[i].y,offset[1])});
				v.push({'x':addOff(o[i].x,offset[0]),'y':addOff(o[i].y2,offset[1])});
				v.push({'x':null,'y':null});
			}else if(typeof o[i].y==="number"){
				v.push({'x':addOff(o[i].x1||o[i].x,offset[0]),'y':addOff(o[i].y,offset[1])});
				v.push({'x':addOff(o[i].x2,offset[0]),'y':addOff(o[i].y,offset[1])});
				v.push({'x':null,'y':null});
			}
			ids.push(i);
			ids.push(i);
			ids.push(i);
		}
		return makeThickLines(v,[0,0]);
	}
	function makeRectOutlines(o,offset){
		var v = [];
		for(i = 0; i < o.length;i++){
			v.push({'x':addOff(o[i].x1,offset[0]),'y':addOff(o[i].y1,offset[1])});
			v.push({'x':addOff(o[i].x1,offset[0]),'y':addOff(o[i].y2,offset[1])});
			v.push({'x':addOff(o[i].x2,offset[0]),'y':addOff(o[i].y2,offset[1])});
			v.push({'x':addOff(o[i].x2,offset[0]),'y':addOff(o[i].y1,offset[1])});
			v.push({'x':addOff(o[i].x1,offset[0]),'y':addOff(o[i].y1,offset[1])});
			if(i < o.length-1) v.push({'x':null,'y':null});
		}
		return makeThickLines(v,[0,0]);
	}
	/**
	 * @desc Get the RGBA values from a string
	 * @param {string} c - the string containing e.g. "rgba(0,100,240,0.4)" or "rgb(0,100,240)" or "#396bad"
	 * @param {number} a - the opacity
	*/ 
	function getRGBA(c,a){
		a = (a||1.0);
		var rgba;
		if(c=="" || typeof c=="undefined") return undefined;
		if(c.indexOf("rgb")==0) c.replace(/rgba?\(([0-9]+), *([0-9]+), *([0-9]+),? *([0-9\.]+)?/,function(m,p1,p2,p3,p4){ rgba = [parseInt(p1)/255,parseInt(p2)/255,parseInt(p3)/255,(p4 ? parseFloat(p4) : a)]; return ""; });
		else if(c.indexOf('#')==0) rgba =[parseInt(c.substr(1,2),16)/255,parseInt(c.substr(3,2),16)/255,parseInt(c.substr(5,2),16)/255,a];
		return rgba;
	}
	/**
	 * @desc Get the uniform locations from a WebGL program
	 * @param {ctx} ctx - the WebGL context
	 * @param {program} program - the WebGL program to get the uniform from
	*/ 
	function getProgramUniforms(ctx, program){
		var u,i,count,name,info;
		u = {};
		count = ctx.getProgramParameter(program, ctx.ACTIVE_UNIFORMS);
		name = "";
		for(i = 0; i < count; i++){
			info = ctx.getActiveUniform(program, i);
			name = info.name.replace("[0]", "");
			u[name] = ctx.getUniformLocation(program, name);
		}
		return u;
	}
	/**
	 * @desc Create a logger for console messages and timing
	 * @param {boolean} inp.logging - do we log messages to the console?
	 * @param {boolean} inp.logtime - do we want to log execution times?
	 * @param {string} inp.id - an ID to use for the log messages (default "JS")
	 */
	function Logger(inp){
		if(!inp) inp = {};
		this.logging = (inp.logging||false);
		this.logtime = (inp.logtime||false);
		this.id = (inp.id||"JS");
		this.metrics = {};
		this.error = function(){ this.log('ERROR',arguments); };
		this.warning = function(){ this.log('WARNING',arguments); };
		this.info = function(){ this.log('INFO',arguments); };
		this.message = function(){ this.log('MESSAGE',arguments); };
		/**
		 * @desc A wrapper for log messages. The first argument is the type of message e.g. "ERROR", "WARNING", "INFO", or "MESSAGE". Other arguments are any objects/values you want to include.
		 */
		this.log = function(){
			if(this.logging || arguments[0]=="ERROR" || arguments[0]=="WARNING" || arguments[0]=="INFO"){
				var args,args2,bold;
				args = Array.prototype.slice.call(arguments[1], 0);
				args2 = (args.length > 1 ? args.splice(1):"");
				// Remove array if only 1 element
				if(args2.length == 1) args2 = args2[0];
				bold = 'font-weight:bold;';
				if(console && typeof console.log==="function"){
					if(arguments[0] == "ERROR") console.error('%c'+this.id+'%c: '+args[0],bold,'',args2);
					else if(arguments[0] == "WARNING") console.warn('%c'+this.id+'%c: '+args[0],bold,'',args2);
					else if(arguments[0] == "INFO") console.info('%c'+this.id+'%c: '+args[0],bold,'',args2);
					else console.log('%c'+this.id+'%c: '+args[0],bold,'',args2);
				}
			}
			return this;
		};
		
		/**
		 * @desc Start/stop a timer. This will build metrics for the key containing the start time ("start"), weighted average ("av"), and recent durations ("times")
		 * @param {string} key - the key for this timer
		 */
		this.time = function(key){
			if(!this.metrics[key]) this.metrics[key] = {'times':[],'start':''};
			if(!this.metrics[key].start) this.metrics[key].start = new Date();
			else{
				var t,w,v,tot,l,i,ts;
				t = ((new Date())-this.metrics[key].start);
				ts = this.metrics[key].times;
				// Define the weights for each time in the array
				w = [1,0.75,0.55,0.4,0.28,0.18,0.1,0.05,0.002];
				// Add this time to the start of the array
				ts.unshift(t);
				// Remove old times from the end
				if(ts.length > w.length-1) ts = ts.slice(0,w.length);
				// Work out the weighted average
				l = ts.length;
				this.metrics[key].av = 0;
				if(l > 0){
					for(i = 0, v = 0, tot = 0 ; i < l ; i++){
						v += ts[i]*w[i];
						tot += w[i];
					}
					this.metrics[key].av = v/tot;
				}
				this.metrics[key].times = ts.splice(0);
				if(this.logtime) this.info(key+' '+t+'ms ('+this.metrics[key].av.toFixed(1)+'ms av)');
				delete this.metrics[key].start;
			}
			return this;
		};
		
		return this;
	}

	root.Graph = Graph;
	root.Logger = Logger;

})(window || this);
