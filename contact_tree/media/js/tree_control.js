// controling
var ControlView = Backbone.View.extend({

    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in controling initialize");
        _.bindAll(this, 'set_control_box');
        _.bindAll(this, 'update_tabs');
        
        this.model.bind('change:tree_style', this.set_control_box);
        this.model.bind('change:leaf_scale', this.update_tabs);
        this.model.bind('change:fruit_scale', this.update_tabs);
        this.model.bind('change:sub_leaf_len_scale', this.update_tabs);
        this.model.bind('change:dtl_branch_curve', this.update_tabs);
        
        // $("#save").click(function(){
        //     window.location.href = drawing_canvas.main_canvas.toDataURL().replace('image/png','image/octet-stream');
        // });

        $("#tree_restore").click(function(){
            self.model.set({"leaf_scale":3});
            self.model.set({"fruit_scale":3});
            self.model.set({"sub_leaf_len_scale":1});
            self.model.set({"dtl_branch_curve":1});
            self.model.set({"filter_contact":0});
            self.model.set({"root_curve":0});
            self.model.set({"root_len_scale":1});
            self.model.set({"canvas_translate":[0, 0]});
            self.model.set({"canvas_scale":0.15});
            self.model.set({"clicking_leaf":-1});
            
            self.model.trigger('change:canvas_scale');
            self.model.trigger('change:tree_style');
            self.model.set({"tree_boundary":{}});
            $("#dtl_length").ionRangeSlider("update", {
                from: 1
            });
            $("#dtl_bend").ionRangeSlider("update", {
                from: 1
            });
            $("#dtl_leaf_size").ionRangeSlider("update", {
                from: 3
            });
            $("#dtl_fruit_size").ionRangeSlider("update", {
                from: 3
            });
            $("#root_length").ionRangeSlider("update", {
                from: 1
            });
            $("#root_bend").ionRangeSlider("update", {
                from: 0
            });
            $("#filter_contact").ionRangeSlider("update", {
                from: 0
            });
        });
        

        this.set_slider();
        this.set_control_box();
        this.update_tabs();
    },


    // animation of the tool box
    set_control_box: function(){
        var self = this;
        var sty = self.model.get("tree_style");
        $("#tree_drawer").off("click");
        $("#tree_drawer").click(function(){
            var anchor = this;
            var removeClass = "show";
            var addClass = "complete";
            var diff = "-=140";
            
            if($(anchor).hasClass("complete")){
                diff = "+=140";
                removeClass = "complete";
                addClass="show";
            }
            if(self.model.get("tree_style")[0] == "symmetry"){
                $("#dtl_box").animate({
                    top: diff
                    }, 700, function() {
                    // Animation complete.
                    $(anchor).removeClass(removeClass).addClass(addClass);
                });
            }
        });

    },

    // initial the slider
    set_slider: function(){
        var self = this;
        $("#dtl_box").show();
        
        $("#dtl_length").ionRangeSlider({
            min: 0.5,
            max: 3,
            from: 1,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                self.model.set({"tree_boundary":{}});
                var val = obj.fromNumber;
                self.model.set({"sub_leaf_len_scale":val});
            }
        });
        $("#dtl_bend").ionRangeSlider({
            min: 0,
            max: 2,
            from: 1,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                self.model.set({"tree_boundary":{}});
                var val = obj.fromNumber;
                self.model.set({"dtl_branch_curve":val});
            }
        });

        $("#dtl_leaf_size").ionRangeSlider({
            min: 0.3,
            max: 8,
            from: 3,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                var val = obj.fromNumber;
                self.model.set({"leaf_scale":val});
            }
        });

        $("#dtl_fruit_size").ionRangeSlider({
            min: 0,
            max: 8,
            from: 3,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                var val = obj.fromNumber;
                if(val>8){
                    val = 8;
                    $("#dtl_fruit_size").ionRangeSlider("update", {
                        from: 8
                    });
                }
                self.model.set({"fruit_scale":val*3/self.model.get("leaf_scale")});
            }
        });

        $("#root_length").ionRangeSlider({
            min: 0.5,
            max: 2.5,
            from: 1,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                self.model.set({"tree_boundary":{}});
                var val = obj.fromNumber;
                self.model.set({"root_len_scale":val});
            }
        });

        $("#root_bend").ionRangeSlider({
            min: -2,
            max: 1.5,
            from: 0,
            type: 'single',
            step: 0.1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                self.model.set({"tree_boundary":{}});
                var val = obj.fromNumber;
                self.model.set({"root_curve":val});
            }
        });

        $("#fruit_switcher").toggleSwitch({
            highlight: true, // default
            width: 30, // default
            change: function(e) {
                var v = $("#fruit_switcher").val();
                if(v == "on")
                    self.model.set({"fruit_switch":1});
                else
                    self.model.set({"fruit_switch":0}); 
            }

        });

        $("#root_switcher").toggleSwitch({
            highlight: true, // default
            width: 30, // default
            change: function(e) {
                var v = $("#root_switcher").val();
                self.model.set({"tree_boundary":{}});
                if(v == "on")
                    self.model.set({"leaf_switch":1});
                else
                    self.model.set({"leaf_switch":0}); 
            }
        });

        $("#filter_contact").ionRangeSlider({
            min: 0,
            max: 15,
            from: 0,
            type: 'single',
            step: 1,
            // onChange: function(obj) {
            onFinish: function(obj) {
                var val = obj.fromNumber;
                self.model.set({"tree_boundary":{}});
                self.model.set({"filter_contact":val});
            }
        });

        $("#filter_alter").ionRangeSlider({
            min: 0,
            max: 100,
            from: 0,
            type: 'single',
            step: 1,
            onFinish: function(obj) {
                var val = obj.fromNumber;
            }
        });

        $("#dtl_box").tabs();
    },

    update_tabs: function(){
        var self = this;
        var l_scale = self.model.get("leaf_scale");
        var f_scale = self.model.get("fruit_scale");
        var len_scale = self.model.get("sub_leaf_len_scale");
        var dtl_b_curve = self.model.get("dtl_branch_curve");
        var r_curve = self.model.get("root_curve");
        var r_len = self.model.get("root_len_scale");
        $( "#dtl_box" ).tabs({ activate: function(event ,ui){
            var index = ui.newTab.index();
            switch (index) {
                case 0:
                    $("#dtl_length").ionRangeSlider("update", {
                        from: Math.round(10*len_scale)/10
                    });
                    $("#dtl_bend").ionRangeSlider("update", {
                        from: Math.round(10*dtl_b_curve)/10
                    });
                break;

                case 1:
                    $("#dtl_leaf_size").ionRangeSlider("update", {
                        from: Math.round(10*l_scale)/10
                    });
                    $("#dtl_fruit_size").ionRangeSlider("update", {
                        from: Math.round(10*f_scale)/10
                    });
                break;

                case 2:
                    $("#root_length").ionRangeSlider("update", {
                        from: r_len
                    });
                    $("#root_bend").ionRangeSlider("update", {
                        from: r_curve
                    });
                break;
            }
        } });
        
    }

});
