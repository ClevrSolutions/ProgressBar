require(["dojo/dom-style", "dojo/html", "dojo/dom-class", "dojo/on"],
    
    // Name: Mendix 5 Bootstrap Progress Bar
    // Version: 1.1
    // Date: 17-09-2014
    // Author: Andries Smit
    // Organisation: Flock of Birds
    // Licence: 
    // 
    // Release notes 1.0: Upgraded version of tbhe progress bar, making use of Mx5
    // and dojo 1.8 functions, use Bootrstrap styling. Render normal, striped or
    // animated. Use an attribute to set bootstrap style success, warning, info, 
    // danger. Update Progressbar on refresh or change of attribute, Add 
    // optional onclick Microflow.

    // Release notes 1.1:
    // Fixed text being centered on barNode (rewritten html/css)

    function(domStyle, html, domClass, on) {
        "use strict";
        dojo.provide("ProgressBar.widget.ProgressBar");
				mxui.dom.addCss(require.toUrl("ProgressBar/widget/ui/ProgressBar.css"));

        mxui.widget.declare("ProgressBar.widget.ProgressBar", {
            mixins: [mxui.mixin._Contextable, dijit._TemplatedMixin],

            inputargs: {
                progressAtt: "",
                bootstrapStyleAtt: "",
                barType: "default",
                description: "",
                width: 0,
                textColorSwitch: 50,
                onclickMf: "",
                classBar: ""
            },

            templatePath: require.toUrl("ProgressBar/widget/ui/ProgressBar.html"),
            // templated variables 
            // progressNode: null,
            // progressTextNode: null,
            // barNode: null,

            // Implementation
            progressNode: null,
            progressBarNode: null,
            progressTextNodeBack: null,
            progressTextNodeFront: null,
            context: null,
            value: 0,
            previousClass: "",

            postCreate: function() {
                // Things that needs be done before start of widget
                this.buildProgressBar();
                this.actLoaded();
            },

            buildProgressBar: function() {
                // set the initial bar type and width of the progress bar
                if (this.width !== 0) {
                    domStyle.set(this.domNode, "width", this.width + "px");
                    domStyle.set(this.progressTextNodeFront, "width", this.width + "px");
                }
                if (this.barType === "striped") {
                    domClass.add(this.domNode, "progress-striped");
                } else if (this.barType === "animated") {
                    domClass.add(this.domNode, "progress-striped active");
                }
                domStyle.set(this.progressBarNode, "width", "0%");
            },

            applyContext: function(context, callback) {
                // Copy context and subscribe to changes
                this.context = context;
				this._contextObj = context.trackObject;

                var _objectHandle = null,
                		_attrHandle = null;

                if (this.onclickMf) {
                    on(this.domNode, "click", dojo.hitch(this, this.onclick));
                    domClass.add(this.domNode, "progress-link");
                }

                if (this._handles) {
                		this._handles.forEach(function(handle, i){
                			mx.data.unsubscribe(handle);
                		});
                		this._handles = [];
                }                

                if (this._contextObj) {
                    this.updateProgress();
                    _objectHandle = mx.data.subscribe({ // Subscribe to change of the object (refresh)
                        guid: context.trackId,
                        callback: dojo.hitch(this, function(guid) {
                            mx.data.get({
                                guid: guid,
                                callback: dojo.hitch(this, this.updateProgress)
                            });
                        })
                    });
					
					if (!this.progressMf) {
						_attrHandle = mx.data.subscribe({ // Subscribe to GUI changes of the progress attribute
							guid: context.trackId,
							attr: this.progressAtt,
							callback: dojo.hitch(this, function(guid) {
								mx.data.get({
									guid: guid,
									callback: dojo.hitch(this, this.updateProgress)
								});
							})
						});
					}                    

                    this._handles = [_objectHandle, _attrHandle];										
                }
                if (typeof(callback) === "function")
                    callback();
            },

            onclick: function() {
                // Handle click on the progress bar
                if (this.onclickMf) {
                    var guids = this.context.trackId ? [this.context.trackId] : [];
                    mx.data.action({
                        params: {
                            applyto: "selection",
                            actionname: this.onclickMf,
                            guids: guids
                        },
                        callback: function() {},
                        error: dojo.hitch(this, function(error) {
                            mx.ui.error("Error while executing MicroFlow: " + this.onclickMf + " : " + error.message);
                        })
                    });
                }
            },
			
			updateProgress: function() {
				if (this.progressMf) {
					var guids = (this._contextObj) ? [this._contextObj.getGuid()] : [];
					mx.data.action({
						params: {
							applyto: "selection",
							actionname: this.progressMf,
							guids: guids
						},
						callback: dojo.hitch(this, function(value) {
							this.value = value;
							this.setProgress();
						}),
						error: function(error) {
							console.log(this.id + "An error occurred while trying to retrieve the progress value by microflow: " + this.progressMf);
						}
					});
				} else {
					this.value = Math.round(this._contextObj.get(this.progressAtt)); // Empty value is handled as 0
					this.setProgress();
				}
			},

            setProgress: function() {
                // Correct value if need be to a sensible value
                if (this.value > 100)
                    this.value = 100;
                if (this.value < 0)
                    this.value = 0;

                if (this.progressBarNode) {
	                	domStyle.set(this.progressBarNode, "width", this.value + "%");
	                
		                if (this.bootstrapStyleAtt) {// Styling based on bootstrap style
		                    if (this.previousClass) { // Remove old class
		                        domClass.remove(this.barNode, this.previousClass);
		                        this.previousClass = "";
		                    }
		                    if (obj.get(this.bootstrapStyleAtt)) { // Set new class
		                        var newClass = "progress-bar-" + obj.get(this.bootstrapStyleAtt);
		                        domClass.add(this.progressBarNode, newClass);
		                        this.previousClass = newClass;
		                    }
		                }

		                if (this.value < this.textColorSwitch) { // Switch contrast colour
		                    domClass.add(this.progressTextNodeFront, "progressbar-text-contract");
		                    domClass.add(this.progressTextNodeBack, "progressbar-text-contract");
		                } else {
		                    domClass.remove(this.progressTextNodeFront, "progressbar-text-contract");
		                    domClass.remove(this.progressTextNodeBack, "progressbar-text-contract");
		                }

		                if (this.description !== "") { // Add description or set % value
		                    html.set(this.progressTextNodeFront, this.value + this.description);
		                    html.set(this.progressTextNodeBack, this.value + this.description);
		                } else {
		                    html.set(this.progressTextNodeFront, this.value + "%");
		                    html.set(this.progressTextNodeBack, this.value + "%")
		                }
	              }
            },

            uninitialize: function() {
                //Nothing to uninitialize
            }
        });
    }
 );