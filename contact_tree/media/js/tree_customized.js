var CustomizedView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in customized initialize");
        _.bindAll(this, 'auto_save');

        this.model.bind('change:display_egos', this.auto_save);
        this.model.bind('change:leaf_scale', this.auto_save);
        this.model.bind('change:fruit_scale', this.auto_save);
        this.model.bind('change:sub_leaf_len_scale', this.auto_save);
        this.model.bind('change:dtl_branch_curve', this.auto_save);
        this.model.bind('change:root_curve', this.auto_save);
        this.model.bind('change:root_len_scale', this.auto_save);
        this.model.bind('change:canvas_scale', this.auto_save);
        this.model.bind('change:filter_contact', this.auto_save);
        this.model.bind('change:tree_structure', this.save_structure);
        // this.model.bind('change:view_mode', this.change_mode);
    },

    auto_save: function(){
        var self = this;
        var save_array = []; // save all the information needed into array
        // get all the information
        

        // push into save array

        // generate the request link
         

    },

    save_structure: function(){
        var self = this;

    },

    sharing_restore: function(){
        var self = this;
        // drawing_canvas.middle = (myCanvas.width/0.15)/2;
    }

});
