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
        // this.model.bind('change:leaf_scale', this.auto_save);
        // this.model.bind('change:fruit_scale', this.auto_save);
        // this.model.bind('change:sub_leaf_len_scale', this.auto_save);
        // this.model.bind('change:dtl_branch_curve', this.auto_save);
        // this.model.bind('change:root_curve', this.auto_save);
        // this.model.bind('change:root_len_scale', this.auto_save);
        // this.model.bind('change:canvas_scale', this.auto_save);
        // this.model.bind('change:filter_contact', this.auto_save);
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
        // dont save while changing mode or not selecting a dataset
        if(save_array[0] == "" || save_array[0] == "0" || in_change_mode == 1)
            return;

        // render parameters and push into save array
        save_array[1] = JSON.stringify(self.model.get("display_egos"));
        save_array[2] = JSON.stringify(self.model.get("selected_egos"));
        // save_array[3] = self.model.get("leaf_scale");
        // save_array[4] = self.model.get("fruit_scale");
        // save_array[5] = self.model.get("sub_leaf_len_scale");
        // save_array[6] = self.model.get("dtl_branch_curve");
        // save_array[7] = self.model.get("root_curve");
        // save_array[8] = self.model.get("root_len_scale");
        // save_array[9] = self.model.get("canvas_scale");
        // save_array[10] = self.model.get("filter_contact");
        // save_array[11] = JSON.stringify(self.model.get("tree_boundary"));
        // save_array[12] = JSON.stringify(self.model.get("canvas_translate"));
        save_array[3] = 3;
        save_array[4] = 3;
        save_array[5] = 1;
        save_array[6] = 1;
        save_array[7] = 0;
        save_array[8] = 1;
        save_array[9] = 0.15;
        save_array[10] = 0;        
        save_array[11] = {};        
        save_array[12] = [0, 0];
        save_array[13] = JSON.stringify(total_ego);
        save_array[14] = self.model.get("dataset_group");
        save_array[15] = JSON.stringify(component_attribute[save_array[0]]);
        save_array[16] = JSON.stringify(waves);
        
        // generate the request link
        var request_url = request_builder.auto_save(save_array);
            
        d3.json(request_url, function(result) {
            // console.log(">>>>>>>>>", result);            
        }); 
    },

    auto_save_mapping: function(){
        var self = this;
        var single_attr = [];

        // mapping parameters
        var auto_map = {};
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");

        // dont save while changing mode or not selecting a dataset
        if(jQuery.isEmptyObject(attr_map) || data_mode == "0" || data_mode == "" || in_change_mode == 1)
            return;

        // set model attr_option whenever changing attribute
        for(a in attr_map){
            single_attr.push(attr_map[a]);
        }
        self.model.set({"attr_option": single_attr});

        this.legend_generator(attr_map, data_mode);

        auto_map["mode"] = data_mode;
        auto_map["attr"] = JSON.parse(JSON.stringify(attr_map));
        auto_map["map_info"] = JSON.parse(JSON.stringify(attribute_mapping));
        auto_map["render_leaf_color"] = JSON.parse(JSON.stringify(mapping_color.render_leaf_color));
        auto_map["render_roots_color"] = JSON.parse(JSON.stringify(mapping_color.render_roots_color));
        auto_map["name"] = "auto_map";
        
        // generate the request link
        var request_url = request_builder.save_mapping(self.model.get("view_mode"), auto_map, auto_map["name"], self.model.get("dataset_group"));
        d3.json(request_url, function(result) {
            // console.log(">>>>>>>>>", result);            
        });          

    },

    user_mapping_restore: function(){
        var self = this;
        var mode = self.model.get("view_mode");
        var group = self.model.get("dataset_group")
        $("#tree_restore").trigger("click");
        if(mode == "0" || group == "")
            return;
        // get all the user saving mapping of this mode        
        var request_url = request_builder.restore_user_mapping(mode, group);
        d3.json(request_url, function(result) {
            // console.log(">>>>>>>>>", result);
            self.model.set({"user_mapping": result});
            self.model.trigger('change:user_mapping');
        }); 
       
    },

    legend_generator: function(attr_map, data_mode){
        var self = this;
        display_detail["branch"] = attr_map["branch"];
        display_detail["fruit"] = attr_map["fruit_size"];
        display_detail["bside"] = attr_map["bside"];
        /*
        if('branch' in attribute_mapping && jQuery.type(attribute_mapping["branch"]) == 'object'){
            display_detail["branch_mapping"] = {};
            for(var key in attribute_mapping["branch"]){
                display_detail["branch_mapping"][attribute_mapping["branch"][key]] = key;
            }
        }
        */
        /*
        if(display_detail["fruit"] != "none"){
            var index1 = '';
            var index2 = '';
            var real_val = "None";
            if(jQuery.type(attribute_mapping["fruit_size"]) == 'array'){
                index1 = attribute_mapping["fruit_size"][0][attribute_mapping["fruit_size"][1].indexOf(info[2].toString())-1];
                index2 = attribute_mapping["fruit_size"][0][attribute_mapping["fruit_size"][1].indexOf(info[2].toString())];
                if(index1 == undefined) real_val = "~" + index2;
                else if(index2 == undefined) real_val = index1 + "~";
                else real_val = index1 + "~" + index2;
            }
            else if(jQuery.type(attribute_mapping["fruit_size"]) == 'object'){
            }
            real_val += " (" + info[2] + ")";
            context.fillText(display_detail["fruit"] + ": " + real_val, px, py+100);
        }
        
        if(display_detail["branch"] != "none"){
            var index1 = '';
            var index2 = '';
            var real_val = "None";
            if(jQuery.type(attribute_mapping["branch"]) == 'array'){
                index1 = attribute_mapping["branch"][info[3]-2];
                index2 = attribute_mapping["branch"][info[3]-1];
                if(index1 == undefined) real_val = "~" + index2;
                else if(index2 == undefined) real_val = index1 + "~";
                else real_val = index1 + "~" + index2;
            }
            else if(jQuery.type(attribute_mapping["branch"]) == 'object'){
                real_val = display_detail["branch_mapping"][(info[3]-1).toString()];
            }
            real_val += " (L" + info[3] + ")";
            context.fillText(display_detail["branch"] + ": " + real_val, px, py+60);
        }
        */
        var legens_cotainer = $("#legends");
        legens_cotainer.empty();
        for(a in attr_map){
            if(attr_map[a] != 'none' && attr_map[a] != 'alterid'){
                var one_legend = $("<div class='legends_list' style='cursor:pointer;'><b>" + component_legends[a] + "</b> " + attr_map[a] + "</div>");
                // var extend_button = $("<span class='glyphicon glyphicon-info-sign' style='margin-left:5px; font-size:smaller;'></span>");
                // extend_button.attr('id', "legend_" + a);
                // one_legend.append(extend_button);
                one_legend.attr('id', "legend_" + a);
                legens_cotainer.append(one_legend);
                // set event of clicking
                one_legend.click(function(){
                    $("#sidekey_dialog").dialog("open");
                    var attr = this.id.split("legend_")[1];
                    var trriger_attr_id = "#" + attr + "_label";
                    $(trriger_attr_id).trigger("click");
                    return false;
                }); 
            }
        }

    }

});
