// mapping
var MappingView = Backbone.View.extend({

    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in mapping initialize");
        // _.bindAll(this, 'set_option');
        _.bindAll(this, 'set_component');

        // util.sampleTree("ori", "sidekey_tree");

        // this.mode = self.model.get("view_mode");
        
        $( "#sidekey_dialog" ).dialog({
            autoOpen: false,
            height: 650,
            width: 1000,
            modal: true
        });

        $( "#map" ).click(function() {
            $( "#sidekey_dialog" ).dialog( "open" );
            self.myattribute = JSON.parse(JSON.stringify(self.model.get("attribute")));
            self.set_component();
        });

        // this.model.bind('change:view_mode', this.set_option);
        // this.model.bind('change:attribute', this.set_option);
        this.model.bind('change:attribute', this.set_component);
        // this.attribute = self.model.get("attribute");
        this.myattribute = {};
        this.attr_array = [];
        
        this.data_mode = self.model.get("view_mode");
        this.set_default = default_attribute[this.data_mode];

        self.set_option();
    },

    set_option: function(){
        var self = this;
        $("#stick_label").click(function() {
            self.stick_map();
        });

        $("#trunk_label").click(function() {
            self.trunk_map();
        });

        $("#branch_label").click(function() {
            self.branch_map();
        });

        $("#bside_label").click(function() {
            self.bside_map();
        });

        $("#root_label").click(function() {
            self.root_map();
        });

        $("#leaf_size_label").click(function() {
            self.leaf_size_map();
        });

        $("#leaf_color_label").click(function() {
            self.leaf_color_map();
        });

        $("#leaf_highlight_label").click(function() {
            self.leaf_highlight_map();
        });

        $("#fruit_size_label").click(function() {
            self.fruit_size_map();
        });        

    },

    stick_map: function(){
        console.log("in stick mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Stick Mapping:");
        
    },

    trunk_map: function(){
        console.log("in trunk mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Trunk Mapping:");
    },

    branch_map: function(){
        console.log("in branch mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Branch Mapping:");
    },

    bside_map: function(){
        console.log("in bside mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Branch Side Mapping:");
    },

    root_map: function(){
        console.log("in root mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Root Mapping:");
    },

    leaf_size_map: function(){
        console.log("in leaf_size mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Size Mapping:");
    },

    leaf_color_map: function(){
        console.log("in leaf_color mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Color Mapping:");
    },

    leaf_highlight_map: function(){
        console.log("in leaf_highlight mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Highlight Mapping:");
    },

    fruit_size_map: function(){
        console.log("in fruit_size mapping");
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Fruit Size Mapping:");
    },

    set_component: function(){
        var self = this;
        // var data_mode = self.model.get("view_mode");
        
    },


    set_sidekey_event: function(){
        var self = this;
        
    }


});
