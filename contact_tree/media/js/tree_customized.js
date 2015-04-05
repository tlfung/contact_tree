var CustomizedView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in customized initialize");
        _.bindAll(this, 'auto_save');
        _.bindAll(this, 'auto_save_mapping');
        _.bindAll(this, 'user_mapping_restore');
        

        this.model.bind('change:display_egos', this.auto_save);
        this.model.bind('change:leaf_scale', this.auto_save);
        this.model.bind('change:fruit_scale', this.auto_save);
        this.model.bind('change:sub_leaf_len_scale', this.auto_save);
        this.model.bind('change:dtl_branch_curve', this.auto_save);
        this.model.bind('change:root_curve', this.auto_save);
        this.model.bind('change:root_len_scale', this.auto_save);
        this.model.bind('change:canvas_scale', this.auto_save);
        this.model.bind('change:filter_contact', this.auto_save);
        this.model.bind('change:tree_structure', this.auto_save);
        this.model.bind('change:attribute', this.auto_save);
        this.model.bind('change:attribute', this.auto_save_mapping);
        this.model.bind('change:view_mode', this.user_mapping_restore);
        
    },

    auto_save: function(){
        var self = this;
        var save_array = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // save all the information needed into array
        // get all the information
        save_array[0] = self.model.get("view_mode");
        if(save_array[0] == "" || save_array[0] == "0" || in_change_mode == 1)
            return;

        // render parameters
        save_array[1] = JSON.stringify(self.model.get("display_egos"));
        save_array[2] = JSON.stringify(self.model.get("selected_egos"));
        save_array[3] = self.model.get("leaf_scale");
        save_array[4] = self.model.get("fruit_scale");
        save_array[5] = self.model.get("sub_leaf_len_scale");
        save_array[6] = self.model.get("dtl_branch_curve");
        save_array[7] = self.model.get("root_curve");
        save_array[8] = self.model.get("root_len_scale");
        save_array[9] = self.model.get("canvas_scale");
        save_array[10] = self.model.get("filter_contact");
        save_array[11] = JSON.stringify(self.model.get("tree_boundary"));
        save_array[12] = JSON.stringify(self.model.get("canvas_translate"));
        save_array[13] = JSON.stringify(total_ego);
        save_array[14] = self.model.get("dataset_group");
        save_array[15] = JSON.stringify(component_attribute[save_array[0]]);
        
        // mapping parameters
        // var auto_map = {};
        // var data_mode = self.model.get("view_mode");
        // var attr_map = self.model.get("attribute");
        // auto_map["mode"] = data_mode;
        // auto_map["attr"] = JSON.parse(JSON.stringify(attr_map));
        // auto_map["map_info"] = JSON.parse(JSON.stringify(attribute_mapping));
        // auto_map["render_leaf_color"] = JSON.parse(JSON.stringify(mapping_color.render_leaf_color));
        // auto_map["render_roots_color"] = JSON.parse(JSON.stringify(mapping_color.render_roots_color));
        // auto_map["name"] = "auto_map";

        // push into save array

        // generate the request link
        var request = JSON.stringify(save_array);
        var request_url = "auto_save/?save="+request;
        // $("#block_page").show();
        d3.json(request_url, function(result) {
            // $("#block_page").hide();
            // console.log(">>>>>>>>>", result);
            
        }); 
    },

    auto_save_mapping: function(){
        var self = this;

        // mapping parameters
        var auto_map = {};
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        if(jQuery.isEmptyObject(attr_map) || data_mode == "0" || data_mode == "")
            return;

        auto_map["mode"] = data_mode;
        auto_map["attr"] = JSON.parse(JSON.stringify(attr_map));
        auto_map["map_info"] = JSON.parse(JSON.stringify(attribute_mapping));
        auto_map["render_leaf_color"] = JSON.parse(JSON.stringify(mapping_color.render_leaf_color));
        auto_map["render_roots_color"] = JSON.parse(JSON.stringify(mapping_color.render_roots_color));
        auto_map["name"] = "auto_map";
        
        // generate the request link
        var request = self.model.get("view_mode") + ":-" + encodeURIComponent(JSON.stringify(auto_map)) + ":-" + auto_map["name"];

        var request_url = "save_mapping/?save="+request;
        
        // $("#block_page").show();
        d3.json(request_url, function(result) {
            // $("#block_page").hide();
            // console.log(">>>>>>>>>", result);            
        });          

    },

    user_mapping_restore: function(){
        var self = this;
        // var save_user_mapping = self.model.get("user_mapping");
        // var save_user_mapping = [];
        var request = self.model.get("view_mode"); 
        if(request == "0")
            return;

        var request_url = "restore_user_mapping/?user="+request;
        // $("#block_page").show();
        d3.json(request_url, function(result) {
            console.log(">>>>>>>>>", result);
            self.model.set({"user_mapping": result});
            self.model.trigger('change:user_mapping');
        }); 
       
        // drawing_canvas.middle = (myCanvas.width/0.15)/2;
    }

});
