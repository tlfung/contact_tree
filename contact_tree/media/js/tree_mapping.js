// mapping
var MappingView = Backbone.View.extend({

    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in mapping initialize");
        _.bindAll(this, 'set_component');
        _.bindAll(this, 'set_user_mapping');

        this.el_mark_group_select = $("#mark_group_select");
        this.el_sidekeyselect = $("#sidekeyselect");
        this.el_mapping_img = $("#mapping_img");
        this.el_sidekey_selection = $("#sidekey_selection");
        this.el_sidekey_operation = $("#sidekey_operation");
        this.el_mark_group = $("#mark_group");
        this.el_sidekey_save_img = $("#sidekey_save_img");
        this.el_loading_process = $("#loading_process");
        this.el_block_layer = $("#block_layer");
        this.el_sidekey_title = $("#sidekey_title");
        this.el_block_page = $("#block_page");
        this.el_sidekey_submit = $("#sidekey_submit");
        
        this.change_structure = 0;
        this.change_mapping = 0;
        $( "#sidekey_dialog" ).dialog({
            autoOpen: false,
            // height: 600,
            // width: 800,
            height: $(window).width()*0.7*0.7,
            width: $(window).width()*0.7,
            modal: true,
            resizable: false,
            close: function(){
                if(self.change_structure != 0 && self.change_mapping != 0){
                    self.model.trigger('change:tree_structure');
                }
                else if(self.change_mapping != 0){
                    var data_group = self.model.get("dataset_group");
                    var now_attr = self.model.get("attribute");
                    var now_mode = self.model.get("view_mode");
                    var all_ego = self.model.get("selected_egos");
                    var ego_list = [];
                    
                    for(var ego in all_ego){
                        ego_list.push(ego);
                    }
                    var request_url = request_builder.restore_data(now_attr, ego_list, now_mode, attribute_mapping, data_group, all_ego);
                    self.el_block_page.show();
                    d3.json(request_url, function(result) {
                        self.restructure(result);
                        self.model.trigger('change:tree_structure');
                    });
                }
            }
        });

        $("#map").click(function() {
            self.el_mapping_img.attr('src', 'media/img/real_mix_tree.png');
            $("#sidekey_dialog").dialog( "open" );
            self.el_sidekey_save_img.hide();
            self.el_sidekey_selection.hide();
            self.el_sidekey_operation.hide();
            self.el_mark_group.hide();
            self.change_structure = 0;
            self.change_mapping = 0;
            self.set_component();

        });

        $("#save_label").click(function() {
            var save_user_mapping = self.model.get("user_mapping");
            if(save_user_mapping.length >= 5){
                alert("Can only save 5 mapping at most!");
                return 0;
            }
            var user_map = {};
            var data_mode = self.model.get("view_mode");
            var attr_map = self.model.get("attribute");
            user_map["mode"] = data_mode;
            user_map["attr"] = JSON.parse(JSON.stringify(attr_map));
            user_map["map_info"] = JSON.parse(JSON.stringify(attribute_mapping));
            user_map["render_leaf_color"] = JSON.parse(JSON.stringify(mapping_color.render_leaf_color));
            user_map["render_roots_color"] = JSON.parse(JSON.stringify(mapping_color.render_roots_color));

            var count_item = save_user_mapping.length + 1;
            
            var map_name = prompt("Please enter your mapping name", "Map" + count_item.toString());
            if (map_name != null){
                user_map["name"] = map_name;
                save_user_mapping.push(user_map);

                var request_url = request_builder.save_mapping(self.model.get("view_mode"), user_map, map_name, self.model.get("dataset_group"));
                d3.json(request_url, function(result) {
                    self.model.set({"user_mapping": save_user_mapping});
                    self.model.trigger('change:user_mapping');
                }); 
                
            }
            else{
                return 0;
            }
            
        });

        $("#use_label").click(function() {
            // console.log(save_user_mapping);
            var data_group = self.model.get("dataset_group");
            var save_user_mapping = self.model.get("user_mapping");
            var now_attr = JSON.parse(JSON.stringify(save_user_mapping[this.value]["attr"]));
            var now_mode = save_user_mapping[this.value]["mode"];
            var now_attr_map = JSON.parse(JSON.stringify(save_user_mapping[this.value]["map_info"]));
            var all_ego = self.model.get("selected_egos");
            var ego_list = [];
            mapping_color.render_leaf_color = JSON.parse(JSON.stringify(save_user_mapping[this.value]["render_leaf_color"]));
            mapping_color.render_roots_color = JSON.parse(JSON.stringify(save_user_mapping[this.value]["render_roots_color"]));
        
            // self.el_sidekey_save_img.hide();
            for(var ego in all_ego){
                ego_list.push(ego);
            }

            var request_url = request_builder.restore_data(now_attr, ego_list, now_mode, now_attr_map, data_group, all_ego);
            self.el_block_page.show();
            d3.json(request_url, function(result) {
                self.el_block_page.hide();
                attribute_mapping = now_attr_map;
                self.model.set({"attribute": now_attr});
                self.restructure(result);
                // self.model.trigger('change:attribute');
            });            
            
        });       
        
        this.model.bind('change:attribute', this.set_component);
        this.model.bind('change:user_mapping', this.set_user_mapping);  
        
        self.set_option();
    },

    set_user_mapping: function(){
        var self = this;
        var save_user_mapping = self.model.get("user_mapping");
        // console.log(save_user_mapping);
        var save_container = $("#save_mapping_container");
        save_container.empty();
        for(var s = 1; s <= save_user_mapping.length; s++){
            var count_item = s;
            var map_name = save_user_mapping[s-1]["name"];
            var save_item_container = $("<div class='left' style='margin-left:10px; position:relative'></div>");
            save_item_container.attr('id', "mapping_container_" + count_item.toString());
            var save_item_dlt = $('<span style="position:absolute; top:-4px; right:-4px; display:none;" class="glyphicon glyphicon-remove-circle"></span>');
            save_item_dlt.attr('id', "dlt_mapping_" + count_item.toString()).val(count_item.toString());
            var save_item = $('<button class="btn save_mapping_item"></button>');
            save_item.val(count_item.toString()).attr('id', "save_mapping_" + count_item.toString()).text(map_name);
            save_item_container.append(save_item);
            save_item_container.append(save_item_dlt);
            save_container.append(save_item_container);

            save_item.hover(function(){
                var delete_id = "#dlt_mapping_" + this.value;
                $(delete_id).show();
            });
            save_item.mouseout(function(){
                var delete_id = "#dlt_mapping_" + this.value;
                $(delete_id).hide();
            });

            save_item.click(function(){
                self.el_sidekey_selection.hide();
                self.el_sidekey_save_img.show();
                self.set_save_component(save_user_mapping[this.value-1]["attr"]);
                $("#use_label").val(this.value-1);
            });    

            save_item_dlt.hover(function(){
                $("#"+this.id).show();
            });   

            save_item_dlt.mouseout(function(){
                $("#"+this.id).hide();
            });     

            save_item_dlt.click(function(){
                var set_new_record = function(){
                    save_user_mapping.splice(this.value-1, 1);
                    var del_container_id = "#mapping_container_" + this.value;
                    $(del_container_id).remove();
                    for(var s = (parseInt(this.value)+1); s <= save_user_mapping.length+1; s++){
                        var mapping_id = "#save_mapping_" + s;
                        var dlt_mapping_id = "#dlt_mapping_" + s;
                        var container_id = "#mapping_container_" + s;
                        $(mapping_id).val((s-1).toString()).attr('id', "save_mapping_" + (s-1).toString()); //.text("Map"+(s-1));
                        $(dlt_mapping_id).val((s-1).toString()).attr('id', "dlt_mapping_" + (s-1).toString());
                        $(container_id).attr('id', "mapping_container_" + (s-1).toString());
                    }
                    self.model.set({"user_mapping": save_user_mapping});
                    self.model.trigger('change:user_mapping');
                    return false;
                };

                var request_url = request_builder.del_mapping(self.model.get("view_mode"), save_user_mapping[this.value-1]["name"], self.model.get("dataset_group"));
            
                d3.json(request_url, function(result) {
                    set_new_record();
                }); 

                
            });
        }
        

    },

    set_option: function(){
        var self = this;

        $("#trunk_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.trunk_map();

        });

        $("#branch_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.branch_map();
        });

        $("#bside_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.bside_map();
        });

        $("#root_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.root_map();
        });

        $("#leaf_size_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.leaf_size_map();
        });

        $("#leaf_color_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.leaf_color_map();
        });

        $("#leaf_highlight_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.leaf_highlight_map();
        });

        $("#fruit_size_label").click(function() {
            self.el_sidekey_save_img.hide();
            self.el_sidekey_operation.hide();
            self.el_sidekey_submit.hide();
            self.fruit_size_map();
        });        

    },

    binary_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");            
        var group1 = $('<div class="column left first"></div>');
        var group2 = $('<div class="column left"></div>');
        var list1 = $('<ul id="mapping_group1" class="sortable-list" style="background-color:rgba(33, 178, 239, 0.5);"></ul>');
        var list2 = $('<ul id="mapping_group2" class="sortable-list" style="background-color:rgba(236, 91, 94, 0.5);"></ul>');
        
        var item_array = component_attribute[data_mode][one_attr][0]
        if(one_attr == ori_attr && comp in attribute_mapping){
            for(var c0 = 0; c0 < attribute_mapping[comp][0].length; c0++){
                var item = $('<li class="sortable-item"></li>');
                item.html(attribute_mapping[comp][0][c0]);
                item.val(item_array.indexOf(attribute_mapping[comp][0][c0]));
                list1.append(item);
            }
            for(var c1 = 0; c1 < attribute_mapping[comp][1].length; c1++){
                var item = $('<li class="sortable-item"></li>');
                item.html(attribute_mapping[comp][1][c1]);
                item.val(item_array.indexOf(attribute_mapping[comp][1][c1]));
                list2.append(item);
            }

        }

        else{
            var total_items = item_array.length
            for(var c = 0; c < total_items; c ++){
                var item = $('<li class="sortable-item"></li>');
                item.html(item_array[c]).val(c);
                
                if(c < total_items/2)
                    list1.append(item);
                else
                    list2.append(item);
            }
            
        }

        group1.append(list1);
        group2.append(list2);
        self.el_mark_group_select.append(group1);
        self.el_mark_group_select.append(group2);

        $('#mark_group_select .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });

    },

    binary_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
            
        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        
        var sep = $('<div class="binary_sep"></div>');
        var sep_title = $('<span id="sep_group" style="position:absolute;"></span>');
        var group_slider = $('<div id="binary_slider" class="binary_group_slider"></div>');
        var range = $('<div style="width:100%; margin-top:10px;"></div>');
        var range_min = $('<span class="left"></span>');
        var range_max = $('<span class="right"></span>');
        
        range_min.html(attr_min);
        range_max.html(attr_max);

        sep.append(sep_title);
        sep.append(group_slider);
        range.append(range_min);
        range.append(range_max);
        self.el_mark_group_select.append(sep);
        self.el_mark_group_select.append(range);

        if(one_attr == ori_attr && comp in attribute_mapping){
            sep_title.css({"left": 100*(parseInt(attribute_mapping[comp][0])-attr_min)/((attr_max-attr_min)+1) + "%"})
            .html(parseInt(attribute_mapping[comp][0])).val(parseInt(attribute_mapping[comp][0]));
            
            group_slider.slider({
                orientation: "horizontal",
                range: "min",
                min: attr_min,
                max: attr_max,
                value: parseInt(attribute_mapping[comp][0]),
                step: 1,
                slide: function( event, ui ) {
                    sep_title.text(ui.value);
                    sep_title.val(ui.value);
                    sep_title.css({"left": 100*(ui.value-attr_min)/((attr_max-attr_min)+1) + "%"});
                }
            });
            
            $('#binary_slider .ui-slider-range').css({'background':'rgba(33, 178, 239, 0.5)'});

        }

        else{
            sep_title.css({"left": 100*(Math.floor((attr_min + attr_max)/2)-attr_min)/((attr_max-attr_min)+1) + "%"})
            .html(Math.floor((attr_min + attr_max)/2)).val(Math.floor((attr_min + attr_max)/2));
            
            group_slider.slider({
                orientation: "horizontal",
                range: "min",
                min: attr_min,
                max: attr_max,
                value: Math.floor((attr_min + attr_max)/2),
                step: 1,
                slide: function( event, ui ) {
                    sep_title.text(ui.value);
                    sep_title.val(ui.value);
                    sep_title.css({"left": 100*(ui.value-attr_min)/((attr_max-attr_min)+1) + "%"});
                }
            });                    

            $('#binary_slider .ui-slider-range').css({'background':'rgba(33, 178, 239, 0.5)'});
        }

    },

    layer_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var group = $('<div class="column left first"></div>');
        var list = $('<ul id="mapping_group" class="sortable-list" style="background-color:rgba(125, 96, 66, 0.7);"></ul>');

        if(one_attr == ori_attr && comp in attribute_mapping){
            var user_map = attribute_mapping[comp];
            var total_items = component_attribute[data_mode][one_attr][0].map(function(d){return 0});
            
            for(var real in user_map){
                total_items[user_map[real]] = real;
            }
            
            for(var c = total_items.length-1; c >= 0 ; c--){
                var item = $('<li class="sortable-item"></li>');
                item.html(total_items[c]).val(total_items[c]);
                list.append(item);
            }
        }
        else{            
            var total_items = component_attribute[data_mode][one_attr][0].length;
            for(var c = total_items-1; c >= 0; c--){
                var item = $('<li class="sortable-item"></li>');
                item.html(component_attribute[data_mode][one_attr][0][c]).val(component_attribute[data_mode][one_attr][0][c]);
                list.append(item);
            }
        }
        group.append(list);
        self.el_mark_group_select.append(group);

        $('#mark_group_select .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });

    },

    layer_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var revert = "d";
        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        var attr_range = component_attribute[data_mode][one_attr][3];

        var sep = $('<div id="sep_group" class="left" style="margin:15 0 0 10; position:relative;"></div>');
        var gap = $('<div style="margin-top:5px;"></div>');
        var gap_title = $('<span class="myfont3">Total Layer: </span>');
        var gap_input = $('<select id="sep_gap" style="width:100px"></select>');
        var revert_button = $('<button id="revert_button" class="right">Revert</button>');
        var group_slider = $('<div id="layer_slider" class="left layer_slider"></div>');
        var range = $('<div id="sep_range" class="left layer_range"></div>');
                
        var mapping_gap = attr_range/9;
        var slider_val = [];
        // check the gap
        var total_gap = 20;
        if(attr_range < 10)
            total_gap = attr_range*2;
        if(one_attr == ori_attr && comp in attribute_mapping){
            var user_map = attribute_mapping[comp];   
            group_slider.attr("style", "height:" + (50*(user_map.length+1)) + ";");
        
            for(var s=4; s < total_gap; s++){
                var opt = util.create_option(s, s, "myfont3", s==user_map.length+1);
                gap_input.append(opt);
            }

            gap.append(gap_title);
            gap.append(gap_input);
            gap.append(revert_button);

            self.el_mark_group_select.append(gap);
            self.el_mark_group_select.append(range);
            self.el_mark_group_select.append(group_slider);
            self.el_mark_group_select.append(sep);

            // mapping_gap = attr_range/user_map.length;
            if(parseFloat(user_map[1],10) < parseFloat(user_map[0],10))
                revert = "a";

            var last = user_map.length-1;
            for(var i = 0; i < user_map.length; i++){
                if(revert == "a")
                    slider_val.push(0-parseFloat(user_map[last-i],10));
                else
                    slider_val.push(parseFloat(user_map[i],10));
            }

        }
        else{
            group_slider.attr("style", "height:500;");
        
            for(var s=4; s < total_gap; s++){
                var opt = util.create_option(s, s, "myfont3", s==10);
                gap_input.append(opt);
            }

            gap.append(gap_title);
            gap.append(gap_input);
            gap.append(revert_button);

            self.el_mark_group_select.append(gap);
            self.el_mark_group_select.append(range);
            self.el_mark_group_select.append(group_slider);
            self.el_mark_group_select.append(sep);

            
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                slider_val.push(Math.round(g*100)/100);
            }
            if(slider_val.length < 9){
                slider_val.push(attr_max);
            }

        }

        if(revert == "a")
            slider_val = slider_val.reverse();
        
        if(revert == "a"){
            group_slider.slider({
                orientation: "vertical",
                // range: "min",
                min: 0-attr_max,
                max: 0-attr_min,
                values: slider_val,
                step: 0.1,
                slide: function( event, ui ) {
                    var v = parseInt(ui.handle.id.split("_").pop());
                    return self.set_revert_slide(v, ui.values, slider_val);
                }
            });

        }
        else{
            group_slider.slider({
                orientation: "vertical",
                // range: "min",
                min: attr_min,
                max: attr_max,
                values: slider_val,
                step: 0.1,
                slide: function( event, ui ) {
                    var v = parseInt(ui.handle.id.split("_").pop());
                    return self.set_general_slide(v, ui.values, slider_val);
                }
            });
        }

        $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
        $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

        sep.empty();
        range.empty();
        
        self.set_layer_handle_id(revert, slider_val);

        revert_button.unbind();
        revert_button.click(function(){
            var my_revert = "a";
            if(revert == "a")
                my_revert = "d";
            
            var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
            var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
            var attr_range = component_attribute[data_mode][one_attr][3];
            var gap = attr_range/($("#sep_gap").val()-1); //!!!
            var new_slider_val = [];
            var real_slider_val = [];
            for(var g = attr_min; g <= attr_max; g+=gap){
                if(my_revert == "a")
                    new_slider_val.push(0-Math.round(g*100)/100);
                else
                    new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                if(my_revert == "a")
                    new_slider_val.push(0-attr_max);
                else
                    new_slider_val.push(attr_max);
                
            }
            if(my_revert == "a")
                new_slider_val = new_slider_val.reverse();
            
            $("#layer_slider").slider( "destroy" ); //!!!
            $("#layer_slider").attr("class", "left layer_slider");
            $("#layer_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
            if(my_revert == "a"){
                $("#layer_slider").slider({
                    orientation: "vertical",
                    min: 0-attr_max,
                    max: 0-attr_min,
                    values: new_slider_val,
                    step: 0.1,
                    slide: function( event, ui ) {
                        var v = parseInt(ui.handle.id.split("_").pop());
                        return self.set_revert_slide(v, ui.values, new_slider_val);
                    }
                });

            }
            else{
                $("#layer_slider").slider({
                    orientation: "vertical",
                    min: attr_min,
                    max: attr_max,
                    values: new_slider_val,
                    step: 0.1,
                    slide: function( event, ui ) {
                        var v = parseInt(ui.handle.id.split("_").pop());
                        return self.set_general_slide(v, ui.values, new_slider_val);
                    }
                });
            }
            
            $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
            $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

            $("#sep_group").empty();
            $("#sep_range").empty();

            self.set_layer_handle_id(my_revert, new_slider_val);

            revert = my_revert;
            
        });

        gap_input.unbind();
        gap_input.change(function(){
            revert = "d";
            var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
            var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
            var attr_range = component_attribute[data_mode][one_attr][3];
            var gap = attr_range/($("#sep_gap").val()-1);
            var new_slider_val = [];
            
            for(var g = attr_min; g <= attr_max; g+=gap){
                new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                new_slider_val.push(attr_max);
            }
            
            $("#layer_slider").slider( "destroy" );
            $("#layer_slider").attr("class", "left layer_slider");
            $("#layer_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
        
            $("#layer_slider").slider({
                orientation: "vertical",
                // range: "min",
                min: attr_min,
                max: attr_max,
                values: new_slider_val,
                step: 0.1,
                slide: function( event, ui ) {
                    var v = parseInt(ui.handle.id.split("_").pop());
                    return self.set_general_slide(v, ui.values, new_slider_val);
                }
               
            });
            $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
            $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

            $("#sep_group").empty();
            $("#sep_range").empty();
            self.set_layer_handle_id(revert, new_slider_val);            
        });             

    },

    color_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var total_items = component_attribute[data_mode][one_attr][0];
        var color_table = [];
        var render_table = [];
        var used = 0;
        if(one_attr == ori_attr && comp in attribute_mapping){
            used = 1;
            if(comp == "leaf_color")
                render_table = mapping_color.render_leaf_color;
            else if(comp == "root")
                render_table = mapping_color.render_roots_color;
        }

        if(comp == "leaf_color")
            color_table = mapping_color.leaf_color;
        else if(comp == "root")
            color_table = mapping_color.roots_color;

        for(var c = 0; c < total_items.length; c ++){
            if(c == 0){
                var c1 = $('<span class="myfont3">Color Map</span>');
                var c2 = $('<span class="myfont3" style="position:absolute; left:125px;">Attribute Data</span>');
                self.el_mark_group_select.append(c1);
                self.el_mark_group_select.append(c2);                
                self.el_mark_group_select.append('<br><p>');
            }

            var label_container =$('<span style="position:absolute; left:125px;"></span>'); // attribute data
            label_container.html(total_items[c]);

            var select_container = $('<div class="dropdown"></div>');
            select_container.val(c.toString()).attr('id', "ori_attr_val_" + c);
            var select_button = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="height:15px;"></button>');
            select_button.attr('id', "dLabel_" + c);
            var select_span = $('<span class="caret"></span>');
            select_button.append(select_span);
            select_container.append(select_button);
            
            var selection_ul = $('<ul class="dropdown-menu" role="menu" style="padding:0;"></ul>');
            selection_ul.attr('aria-labelledby', "dLabel_" + c);     
            
            for(var l_color = 0; l_color < color_table.length; l_color++){                
                var selection_opt_container = $('<li></li>');
                var selection_opt = $('<a></a>');
                selection_opt.val(l_color.toString()).attr('name', c).attr('style', "height:15px; width:100px; background-color:" + color_table[l_color] + ";");
                
                if(used == 1){
                    if(color_table[l_color] == render_table[c]){
                        select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; background-color:" + color_table[l_color] + ";");
                    }
                }
                else{
                    if(l_color == c){
                        select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; background-color:" + color_table[l_color] + ";");
                    }
                        
                    else if(color_table.length < c && l_color == color_table.length-1){
                        select_container.val((color_table.length-1).toString()).attr('style', "height:15px; width:100px; position:absolute; background-color:" + color_table[color_table.length-1] + ";");
                    }
                }
                selection_opt.unbind();
                selection_opt.click(function(){
                    var select_container_id = "#ori_attr_val_" + this.name;
                    $(select_container_id).val((this.value).toString()).attr('style', "height:15px; width:100px; position:absolute; background-color:" + color_table[this.value] + ";");
                });
                selection_opt_container.append(selection_opt)
                selection_ul.append(selection_opt_container);
                
            }
            select_container.append(selection_ul);
            self.el_mark_group_select.append(select_container);
            self.el_mark_group_select.append(label_container);
            self.el_mark_group_select.append('<br><p>');
        }


    },

    color_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var total_gap = 0;
        var used = 0;
        var user_map = [];
        if(one_attr == ori_attr && comp in attribute_mapping){
            user_map = attribute_mapping[comp];
            used = 1;
        }
        
        if(comp == "leaf_color")
            total_gap = mapping_color.leaf_color.length;
        else if(comp == "root")
            total_gap = mapping_color.roots_color.length;

        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        var attr_range = component_attribute[data_mode][one_attr][3];

        var sep = $('<div id="sep_group" class="left" style="margin:15 0 0 10; position:relative;"></div>');
        var gap = $('<div style="margin-top:10px; margin-bottom: 10px;"></div>');
        var gap_title = $('<span class="myfont3">Total Categories: </span>');
        var gap_input = $('<select id="sep_gap" style="width:100px"></select>');
        var group_slider = $('<div id="layer_slider"></div>');
        var range = $('<div id="sep_range" class="left color_range"></div>');
        
        var mapping_gap = attr_range/5;
        var slider_val = [];

        if(used == 1){
            if(comp == "leaf_color")
                group_slider.attr("class", "left leaf_color_slider").attr("style", "height:" + (50*(user_map.length+1)) + ";");
            else if(comp == "root")
                group_slider.attr("class", "left root_slider").attr("style", "height:" + (50*(user_map.length+1)) + ";");
                
            for(var s=2; s <= total_gap; s++){
                var opt = util.create_option(s, s, "myfont3", s==(user_map.length+1));
                gap_input.append(opt);
            }
            gap.append(gap_title);
            gap.append(gap_input);
            self.el_mark_group_select.append(gap);

            var c1 = $('<span class="myfont3">Color Map</span>');
            var c2 = $('<span class="myfont3" style="margin-left:50px;">Attribute Data</span>');
                
            self.el_mark_group_select.append(c1);
            self.el_mark_group_select.append(c2);
            self.el_mark_group_select.append('<br><p>');

            self.el_mark_group_select.append(range);
            self.el_mark_group_select.append(group_slider);
            self.el_mark_group_select.append(sep);

            var slider_val = [];

            for(var real = 0; real < user_map.length; real++){
                 slider_val.push(parseFloat(user_map[real], 10));
            }
        }
        else{
            if(comp == "leaf_color")
                group_slider.attr("class", "left leaf_color_slider").attr("style", "height:300;");
            else if(comp == "root")
                group_slider.attr("class", "left root_slider").attr("style", "height:300;");
            
            for(var s=2; s <= total_gap; s++){
                var opt = util.create_option(s, s, "myfont3", s==6);
                gap_input.append(opt);
            }

            gap.append(gap_title);
            gap.append(gap_input);
            self.el_mark_group_select.append(gap);

            var c1 = $('<span class="myfont3">Color Map</span>');
            var c2 = $('<span class="myfont3" style="margin-left:50px;">Attribute Data</span>');

            self.el_mark_group_select.append(c1);
            self.el_mark_group_select.append(c2);
            self.el_mark_group_select.append('<br><p>');

            self.el_mark_group_select.append(range);
            self.el_mark_group_select.append(group_slider);
            self.el_mark_group_select.append(sep);
            
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                slider_val.push(Math.round(g*100)/100);
            }
            if(slider_val.length < 5){
                slider_val.push(attr_max);
            }

        }

        group_slider.slider({
            orientation: "vertical",
            min: attr_min,
            max: attr_max,
            values: slider_val,
            step: 0.1,            
            slide: function( event, ui ) {
                var v = parseInt(ui.handle.id.split("_").pop());
                return self.set_general_slide(v, ui.values, slider_val);
            }
        });

        $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
        $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

        sep.empty();
        range.empty();

        self.set_color_handle_id(slider_val, comp, used);
        

        gap_input.unbind();
        gap_input.change(function(){
            used = 0;
            var attr_min = parseInt(component_attribute[data_mode][self.el_sidekeyselect.val()][1]);
            var attr_max = parseInt(component_attribute[data_mode][self.el_sidekeyselect.val()][2]);
            var attr_range = component_attribute[data_mode][self.el_sidekeyselect.val()][3];
            var gap = attr_range/($("#sep_gap").val()-1); //!!!
            var new_slider_val = [];
        
            for(var g = attr_min; g <= attr_max; g+=gap){
                new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                new_slider_val.push(attr_max);
            }
            
            $("#layer_slider").slider( "destroy" );
            if(comp == "leaf_color")
                $("#layer_slider").attr("class", "left leaf_color_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
            else if(comp == "root")
                $("#layer_slider").attr("class", "left root_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
        
            $("#layer_slider").slider({
                orientation: "vertical",
                min: attr_min,
                max: attr_max,
                values: new_slider_val,
                step: 0.1,                
                slide: function(event, ui) {
                    var v = parseInt(ui.handle.id.split("_").pop());
                    return self.set_general_slide(v, ui.values, new_slider_val);
                }
            });
            $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
            $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

            $("#sep_group").empty();
            $("#sep_range").empty();

            self.set_color_handle_id(new_slider_val, comp, used);

        });        

    },

    size_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var total_items = component_attribute[data_mode][one_attr][0];
        var img_src;
        if(comp == "leaf_size")
            img_src = "media/img/one_leaf.png";
        else if(comp == "fruit_size")
            img_src = "media/img/one_fruit.png";

        var used = 0;
        var user_map;
        if(one_attr == ori_attr && comp in attribute_mapping){
            used = 1;
            user_map = attribute_mapping[comp];
        }

        for(var c = 0; c < total_items.length; c ++){
            var size_val = c;
            if(used == 1)
                size_val = parseInt(user_map[total_items[c]]);
            if(c == 0){
                var c1 = $('<span class="myfont3">Size Scale</span>');
                var c2 = $('<span class="myfont3" style="margin-left: 60px;">Attribute Data</span>');
                self.el_mark_group_select.append(c1);
                self.el_mark_group_select.append(c2);                
                self.el_mark_group_select.append('<br><p>');
            }                    
            var select_container = $('<div class="size_cat_select_container"></div>');
            var oneitem = $('<img></img>');
            var objslider = $('<div class="size_cat_objslider"></div>');
            var label_container = $('<span class="size_cat_label_container"></span>');
            var slider_label = $('<span class="size_cat_slider_label"></span>');
            
            select_container.attr("style", "height:" + (15 + (10+(parseInt(size_val)*3))) + "px;");
            select_container.attr("id", "size_selector_" + c);

            oneitem.attr("id", "oneitem_" + c).attr("style", "position:absolute; width:"+ (10 + size_val*3) +"%;").attr("src", img_src);
            objslider.attr("id", "ori_attr_val_" + c);
            slider_label.attr("id", "slider_label_" + c);

            label_container.html(total_items[c]);
            
            select_container.append(oneitem);
            select_container.append(objslider);
            select_container.append(slider_label);
            select_container.append(label_container);
                        
            self.el_mark_group_select.append(select_container);

            var handle = "#ori_attr_val_" + c + " .ui-slider-handle";

            objslider.slider({
                orientation: "horizontal",
                min: 0,
                max: 10,
                value: size_val,
                slide: function( event, ui) {
                    var myid = this.id;
                    var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop(); //!!!
                    var container_id = "#size_selector_" + myid.split("attr_val_").pop();
                    var s_label = "#slider_label_" + myid.split("attr_val_").pop();
                    
                    $(s_label).css({"left": (ui.value*10-5)+"%"});
                    $(s_label).text(ui.value);
                    $(s_label).val(ui.value);
                    $(oneitem_id).css({"width": 10+(ui.value*3)});
                    $(container_id).css({"height": 15+(10+(ui.value*3))});
                }
            });

            $(handle).css({'width':'0.7em'});
            $(handle).css({'height':'1em'});
            objslider.css({'height':'8px'});

            slider_label.text(size_val);
            slider_label.val(size_val);
            slider_label.css({"left": (size_val*10-5)+"%"});
                            
        }
    },

    size_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        
        var total_items = component_attribute[data_mode][one_attr][0];
        var used = 0;
        var selected_gap = 6;

        var val_map = [];
        var size_map = [];
        if(one_attr == ori_attr && comp in attribute_mapping){
            used = 1;
            var user_map = attribute_mapping[comp];
            size_map = user_map[1];
            val_map = user_map[0];
            selected_gap = size_map.length;
        }

        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        var attr_range = component_attribute[data_mode][one_attr][3];
        
        var sep = $('<div id="sep_group" class="left" style="margin:15 0 0 10; position:relative;"></div>');
        var gap = $('<div style="margin-top:10px;"></div>');
        var gap_title = $('<span class="myfont3">Number of Difference: </span>');
        var gap_input = $('<select id="sep_gap" style="width:100px"></select>');
        var group_slider = $('<div id="layer_slider"></div>');
        var range = $('<div id="sep_range" class="left size_range"></div>');
        
        if(comp == "leaf_size")
            group_slider.attr("class", "left leaf_size_slider").attr("style", "height:" + 50*selected_gap + ";");
        else
            group_slider.attr("class", "left fruit_size_slider").attr("style", "height:" + 50*selected_gap + ";");
        
        var total_gap = 10;
        if(attr_range < 5)
            total_gap = attr_range*2-1;
        for(var s=2; s <= total_gap; s++){
            var opt = util.create_option(s, s, "myfont3", s==selected_gap);
            gap_input.append(opt);
        }

        gap.append(gap_title);
        gap.append(gap_input);
        self.el_mark_group_select.append(gap);

        var c1 = $('<span class="myfont3">Size Scale</span>');
        var c2 = $('<span class="myfont3" style="margin-left:90px;">Attribute Data</span>');
                
        self.el_mark_group_select.append(c1);
        self.el_mark_group_select.append(c2);
        self.el_mark_group_select.append('<br><p>');

        self.el_mark_group_select.append(range);
        self.el_mark_group_select.append(group_slider);                    
        self.el_mark_group_select.append(sep);

        var slider_val = [];

        if(used == 1){
            for(var g = 0; g < val_map.length; g++){
                slider_val.push(parseFloat(val_map[g],10));
            }
        }
        else{
            var mapping_gap = attr_range/(selected_gap-1);
            var slider_val = [];
        
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                slider_val.push(Math.round(g*100)/100);
            }
            if(slider_val.length < (selected_gap-1)){
                slider_val.push(attr_max);
            }
        }

        group_slider.slider({
            orientation: "vertical",
            min: attr_min,
            max: attr_max,
            values: slider_val,
            step: 0.1,
            slide: function( event, ui ) {
                var v = parseInt(ui.handle.id.split("_").pop());
                return self.set_general_slide(v, ui.values, slider_val);
            }
        });

        $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
        $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

        sep.empty();
        range.empty();       
        
        self.set_size_handle_id(slider_val, comp, used, size_map, val_map);

        gap_input.unbind();
        gap_input.change(function(){
            var used = 0;
            var size_map = [];
            var val_map = [];
            var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
            var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
            var attr_range = component_attribute[data_mode][one_attr][3];
            var mapping_gap = attr_range/($("#sep_gap").val()-1); //!!!
            var new_slider_val = [];
        
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                new_slider_val.push(attr_max);
            }
            
            $("#layer_slider").slider( "destroy" ); //!!!     
            if(comp == "leaf_size")
                $("#layer_slider").attr("class", "left leaf_size_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
            else
                $("#layer_slider").attr("class", "left fruit_size_slider").attr("style", "height:" + (50*$("#sep_gap").val()) + ";");
            
            $("#layer_slider").slider({
                orientation: "vertical",
                min: attr_min,
                max: attr_max,
                values: new_slider_val,
                step: 0.1,
                slide: function( event, ui ) {
                    var v = parseInt(ui.handle.id.split("_").pop());
                    return self.set_general_slide(v, ui.values, new_slider_val);
                }
                
            });
            $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
            $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});
            
            $("#sep_group").empty(); //!!!
            $("#sep_range").empty();

            self.set_size_handle_id(new_slider_val, comp, used, size_map, val_map);
        });

    },

    color_submit: function(ori_attr, new_attr, comp){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var ego_selections = self.model.get("selected_egos");
        var color_table = [];
        if(comp == "leaf_color"){
            color_table = mapping_color.leaf_color;
            // render_table = mapping_color.render_leaf_color;
        }
        else if(comp == "root"){
            color_table = mapping_color.roots_color;
            // render_table = mapping_color.render_roots_color;
        }

        if(comp in attribute_mapping){
            delete attribute_mapping[comp];
        }
        attr_map[comp] = new_attr;

        if(new_attr == "none"){
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr + ":-" + JSON.stringify(["none"]);
            if(comp == "leaf_color"){
                mapping_color.render_leaf_color = ["#924307", "#C2B208", "#94AE0F", "#5F9915"];
            }
            else if(comp == "root"){
                mapping_color.render_roots_color = ["#964343", "#90093F", "#967636", "#6B435E"];
            }
        
            for(ego in ego_selections){
                update_info += ":=" + ego;
            }
            
            attr_map[comp] = new_attr;
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();
        }

        else{
            if(comp == "leaf_color"){
                mapping_color.render_leaf_color = [];
            }
            else if(comp == "root"){
                mapping_color.render_roots_color = [];
            }
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr;
            if(component_attribute[data_mode][new_attr][5] == "categorical" || component_attribute[data_mode][new_attr][5] == "boolean"){
                var color_map = {};
                attribute_mapping[comp] = {};
                var total_items = component_attribute[data_mode][new_attr][0]
                for(var c = 0; c < total_items.length; c ++){
                    var item_id = "#ori_attr_val_" + c;
                    
                    attribute_mapping[comp][total_items[c]] = c;
                    color_map[total_items[c]] = c;

                    if(comp == "leaf_color"){
                        mapping_color.render_leaf_color.push(color_table[parseInt($(item_id).val())]);
                    }
                    else if(comp == "root"){
                        mapping_color.render_roots_color.push(color_table[parseInt($(item_id).val())]);
                    }
                    // mapping_color.render_roots_color.push(color_table[$(item_id).val()]);
                }
                
                update_info += ":-" + JSON.stringify(color_map);
                
            }
            else{
                var layer_map = [];
                attribute_mapping[comp] = []
                for(var v = 0; v < $("#sep_gap").val(); v++){
                    var layer_id = "#layer_" + v;
                    var selector_id = "#title_" + v;
                    if(v == $("#sep_gap").val()-1){
                        if(comp == "leaf_color"){
                            mapping_color.render_leaf_color.push(color_table[parseInt($(selector_id).val())]);
                        }
                        else if(comp == "root"){
                            mapping_color.render_roots_color.push(color_table[parseInt($(selector_id).val())]);
                        }
                        // mapping_color.render_roots_color.push(color_table[$(selector_id).val()]);
                        break;
                    }
                    layer_map.push($(layer_id).val());
                    attribute_mapping[comp].push($(layer_id).val());
                    if(comp == "leaf_color"){
                        mapping_color.render_leaf_color.push(color_table[parseInt($(selector_id).val())]);
                    }
                    else if(comp == "root"){
                        mapping_color.render_roots_color.push(color_table[parseInt($(selector_id).val())]);
                    }
                    
                }
               
                update_info += ":-" + JSON.stringify(layer_map);
            }
            for(ego in ego_selections){
                update_info += ":=" + ego;
            }

            attr_map[comp] = new_attr;
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();

        }
    },

    size_submit: function(ori_attr, new_attr, comp){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var ego_selections = self.model.get("selected_egos");

        if(comp in attribute_mapping){
            delete attribute_mapping[comp];
        }

        attr_map[comp] = new_attr;

        if(new_attr == "none"){
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr + ":-" + JSON.stringify(["none"]);

            for(ego in ego_selections){
                update_info += ":=" + ego;
            }

            attr_map[comp] = new_attr;
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();
        }
        else{
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr;             
            if(component_attribute[data_mode][new_attr][5] == "categorical" || component_attribute[data_mode][new_attr][5] == "boolean"){
                var size_map = {};
                attribute_mapping[comp] = {};
                var total_items = component_attribute[data_mode][new_attr][0]
                for(var c = 0; c < total_items.length; c ++){
                    var item_id = "#slider_label_" + c;
                    attribute_mapping[comp][total_items[c]] = $(item_id).val();
                    size_map[total_items[c]] = $(item_id).val();
                }
                update_info += ":-" + JSON.stringify(size_map);
                
            }
            else{
                var layer_map = [];
                var size_map = [];
                attribute_mapping[comp] = []
                for(var v = 0; v < $("#sep_gap").val(); v++){
                    var item_id = "#slider_label_" + v;
                    var layer_id = "#layer_" + v;
                    if(v == $("#sep_gap").val()-1){
                        size_map.push($(item_id).val());
                        break;
                    }
                    size_map.push($(item_id).val());
                    layer_map.push($(layer_id).val());
                }
                attribute_mapping[comp].push(layer_map);
                attribute_mapping[comp].push(size_map);
                update_info += ":-" + JSON.stringify(layer_map) + ":-" + JSON.stringify(size_map);
            }

            for(ego in ego_selections){
                update_info += ":=" + ego;
            }               

            attr_map[comp] = new_attr;
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();
        }

    },

    layer_submit: function(ori_attr, new_attr, comp){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var ego_selections = self.model.get("selected_egos");

    },

    binary_submit: function(ori_attr, new_attr, comp){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var ego_selections = self.model.get("selected_egos");
        
        if(comp in attribute_mapping){
            delete attribute_mapping[comp];
        }

        attr_map[comp] = new_attr;

        if(new_attr == "none"){}
        
        else{
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr;
            if(component_attribute[data_mode][new_attr][5] == "categorical" || component_attribute[data_mode][new_attr][5] == "boolean"){
                attribute_mapping[comp] = {"0": [], "1": []};
                
                $('#mapping_group1').children().each(function(){
                    update_info += ":-" + component_attribute[data_mode][new_attr][0][$(this).val()];
                    attribute_mapping[comp]["0"].push(component_attribute[data_mode][new_attr][0][$(this).val()]);
                });
                $('#mapping_group2').children().each(function(){
                    attribute_mapping[comp]["1"].push(component_attribute[data_mode][new_attr][0][$(this).val()]);
                });
                for(ego in ego_selections){
                    update_info += ":=" + ego;
                }

            }
            else{
                attribute_mapping[comp] = {"0": [], "1": []};
                update_info += ":-" + $("#sep_group").val();
                attribute_mapping[comp]["0"].push($("#sep_group").val());
                attribute_mapping[comp]["1"].push($("#sep_group").val());
                
                for(ego in ego_selections){
                    update_info += ":=" + ego;
                }
            }
            
            attr_map[comp] = new_attr;
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();
        } 
    },

    set_revert_slide: function(v, all_value, slider_val){
        var self = this;
        var display = "#layer_" + v;
        var label2 = "#title_" + (v+1);
        var label1 = "#title_" + v;
        var on_handle = "#layer_handle_"+ v;
        if(v < slider_val.length-1 && all_value[v] > Math.round((all_value[v+1]-0.5)*100)/100){
            $("#layer_slider").slider('values', v, Math.round((all_value[v+1]-0.5)*100)/100); 
            return false;
        }
        if(v > 0 && all_value[v] < Math.round((all_value[v-1]+0.5)*100)/100){
            $("#layer_slider").slider('values', v, Math.round((all_value[v-1]+0.5)*100)/100); 
            return false;
        }
        $(display).css({"top": $(on_handle).position().top});
        if(v == 0){
            var up_handle = "#layer_handle_"+ (v+1);
            $(label2).css({"top": ($(up_handle).position().top+$(on_handle).position().top)/2});
        }
        else if(v == slider_val.length-1){
            var down_handle = "#layer_handle_"+ (v-1);
            $(label1).css({"top": ($(down_handle).position().top+$(on_handle).position().top)/2});
        }
        else{
            var down_handle = "#layer_handle_"+ (v-1);
            var up_handle = "#layer_handle_"+ (v+1);
            $(label2).css({"top": ($(up_handle).position().top+$(on_handle).position().top)/2});
            $(label1).css({"top": ($(down_handle).position().top+$(on_handle).position().top)/2});
        }
        $(display).val(Math.round((0-all_value[v])*100)/100);

        return true;
    },

    // for all the slide on change
    set_general_slide: function(v, all_value, slider_val){
        var self = this;
        var display = "#layer_" + v;
        var label2 = "#title_" + (v+1);
        var label1 = "#title_" + v;
        var on_handle = "#layer_handle_"+ v;
        if(v < slider_val.length-1 && all_value[v] > Math.round((all_value[v+1]-0.5)*100)/100){
            $("#layer_slider").slider('values', v, Math.round((all_value[v+1]-0.5)*100)/100);
            // $(display).val(Math.round((all_value[v+1]-0.5)*100)/100);
            // $(display).css({"top": $(on_handle).position().top});
            return false;
        }
        if(v > 0 && all_value[v] < Math.round((all_value[v-1]+0.5)*100)/100){
            $("#layer_slider").slider('values', v, Math.round((all_value[v-1]+0.5)*100)/100); 
            // $(display).val(Math.round((all_value[v-1]+0.5)*100)/100);
            // $(display).css({"top": $(on_handle).position().top});
            return false;
        }
        $(display).css({"top": $(on_handle).position().top});
        if(slider_val.length > 1){
            if(v == 0){
                var up_handle = "#layer_handle_"+ (v+1);
                $(label2).css({"top": ($(up_handle).position().top+$(on_handle).position().top)/2});
            }
            else if(v == slider_val.length-1){
                var down_handle = "#layer_handle_"+ (v-1);
                $(label1).css({"top": ($(down_handle).position().top+$(on_handle).position().top)/2});
            }
            else{
                var down_handle = "#layer_handle_"+ (v-1);
                var up_handle = "#layer_handle_"+ (v+1);
                $(label2).css({"top": ($(up_handle).position().top+$(on_handle).position().top)/2});
                $(label1).css({"top": ($(down_handle).position().top+$(on_handle).position().top)/2});
            }
        }
        $(display).val(Math.round((all_value[v])*100)/100);

        return true;
    },

    set_layer_handle_id: function(my_revert, slider_val){
        var self = this;
        var sep_container = $("#sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');
        var range_container = $("#sep_range");
        
        for(var v = slider_val.length-1; v >= 0; v--){
            handle.eq(v).attr('id', "layer_handle_" + v);

            if(v == 0){
                var sep_layer_title = $('<span class="layer_label"></span>');
                sep_layer_title.attr("style", "top:" + ($("#layer_slider").height()-3) + ";");
                sep_layer_title.html("Layer " + (v+1)).attr("id", "title_" + v);
                range_container.append(sep_layer_title);
            }   
            else{
                var sep_layer_title = $('<span class="layer_label"></span>');
                sep_layer_title.attr("style", "top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + ";");
                sep_layer_title.html("Layer " + (v+1)).attr("id", "title_" + v);
                range_container.append(sep_layer_title);
                if(v == slider_val.length-1){
                    var sep_layer_title = $('<span class="layer_label" style="top:-15;"></span>');
                    sep_layer_title.html("Layer " + (v+2)).attr("id", "title_" + v);
                    range_container.append(sep_layer_title);
                }
            }
            var sep_layer_input = $('<input class="layer_order handle_input" readonly></input>');
            sep_layer_input.attr("style", "top:" + (handle.eq(v).position().top) + ";");
            // sep_layer_input.setAttribute("readonly", "readonly");
            if(my_revert == "a")
                sep_layer_input.val(0-slider_val[v]);
            else
                sep_layer_input.val(slider_val[v]);
            sep_layer_input.attr("id", "layer_" + v);

            sep_container.append(sep_layer_input);

        }
    },

    set_color_handle_id: function(slider_val, comp, used){
        var self = this;
        var sep_container = $("#sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');
        var range_container = $("#sep_range");

        var color_table = [];
        var render_table = [];
        
        if(used == 1){
            if(comp == "leaf_color")
                render_table = mapping_color.render_leaf_color;
            else if(comp == "root")
                render_table = mapping_color.render_roots_color;
        }

        if(comp == "leaf_color")
            color_table = mapping_color.leaf_color;
        else if(comp == "root")
            color_table = mapping_color.roots_color;

        for(var v = slider_val.length-1; v >= 0; v--){
            handle.eq(v).attr('id', "layer_handle_" + v);
            var select_container = $('<div class="dropdown"></div>');            
            var select_button = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="height:15px;"></button>');
            var select_span = $('<span class="caret"></span>');
            select_button.append(select_span);
            select_container.append(select_button);
            
            var selection_ul = $('<ul class="dropdown-menu" role="menu" style="padding:0;"></ul>');
            
            if(v == 0){
                select_container.val(v.toString()).attr('id', "title_" + v);
                select_button.attr('id', "dLabel_" + v);
                selection_ul.attr('aria-labelledby', "dLabel_" + v);

                for(var l_color = 0; l_color < color_table.length; l_color++){
                    var selection_opt_container = $('<li></li>');
                    var selection_opt = $('<a></a>');
                    selection_opt.val(l_color.toString()).attr('name', v).attr('style', "height:15px; width:100px; background-color:" + color_table[l_color] + ";");
                    
                    if(used == 1){
                        if(color_table[l_color] == render_table[v]){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + mapping_color.roots_color[l_color] + ";");
                        }
                    }
                    else{
                        if(l_color == v){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + color_table[l_color] + ";");
                        }
                            
                        else if(color_table.length < v && l_color == color_table.length-1){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + color_table[color_table.length-1] + ";");
                        }
                    }  
                        
                    selection_opt.unbind();
                    selection_opt.click(function(){
                        var select_container_id = "#title_" + this.name;
                        $(select_container_id).val((this.value).toString()).css('background-color', color_table[this.value]);
                    });
                    selection_opt_container.append(selection_opt)
                    selection_ul.append(selection_opt_container);
                    
                }
                select_container.append(selection_ul);
                range_container.append(select_container);
                
                if(slider_val.length == 1){
                    var select_container = $('<div class="dropdown"></div>');            
                    var select_button = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="height:15px;"></button>');
                    var select_span = $('<span class="caret"></span>');
                    select_button.append(select_span);
                    select_container.append(select_button);
                    
                    var selection_ul = $('<ul class="dropdown-menu" role="menu" style="padding:0;"></ul>');
                    select_container.val((v+1).toString()).attr('id', "title_" + (v+1));
                    select_button.attr('id', "dLabel_" + (v+1));
                    selection_ul.attr('aria-labelledby', "dLabel_" + (v+1));

                    for(var l_color = 0; l_color < color_table.length; l_color++){
                        var selection_opt_container = $('<li></li>');
                        var selection_opt = $('<a></a>');
                        selection_opt.val(l_color.toString()).attr('name', (v+1)).attr('style', "height:15px; width:100px; background-color:" + color_table[l_color] + ";");
                        
                        if(used == 1){
                            if(color_table[l_color] == render_table[(v+1)]){
                                select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:-15; background-color:" + mapping_color.roots_color[l_color] + ";");
                            }
                        }
                        else{
                            if(l_color == (v+1)){
                                select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:-15; background-color:" + color_table[l_color] + ";");
                            }
                        }  
                            
                        selection_opt.unbind();
                        selection_opt.click(function(){
                            var select_container_id = "#title_" + this.name;
                            $(select_container_id).val((this.value).toString()).css('background-color', color_table[this.value]);
                        });
                        selection_opt_container.append(selection_opt)
                        selection_ul.append(selection_opt_container);
                        
                    }
                    select_container.append(selection_ul);
                    range_container.append(select_container);
                }
            }   
            else{
                select_container.val(v.toString()).attr('id', "title_" + v);
                select_button.attr('id', "dLabel_" + v);
                selection_ul.attr('aria-labelledby', "dLabel_" + v);

                for(var l_color = 0; l_color < color_table.length; l_color++){
                    var selection_opt_container = $('<li></li>');
                    var selection_opt = $('<a></a>');
                    selection_opt.val(l_color.toString()).attr('name', v).attr('style', "height:15px; width:100px; background-color:" + color_table[l_color] + ";");
                                        
                    if(used == 1){
                        if(color_table[l_color] == render_table[v]){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + mapping_color.roots_color[l_color] + ";");
                        }
                    }
                    else{
                        if(l_color == v){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + color_table[l_color] + ";");
                        }
                            
                        else if(color_table.length < v && l_color == color_table.length-1){
                            select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + color_table[color_table.length-1] + ";");
                        }
                    } 
                        
                    selection_opt.unbind();
                    selection_opt.click(function(){
                        var select_container_id = "#title_" + this.name;
                        $(select_container_id).val((this.value).toString()).css('background-color', color_table[this.value]);
                    });
                    selection_opt_container.append(selection_opt)
                    selection_ul.append(selection_opt_container);
                    
                }
                select_container.append(selection_ul);
                range_container.append(select_container);

                if(v == slider_val.length-1){
                    var select_container = $('<div class="dropdown"></div>');            
                    var select_button = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="height:15px;"></button>');
                    var select_span = $('<span class="caret"></span>');
                    select_button.append(select_span);
                    select_container.append(select_button);
                    
                    var selection_ul = $('<ul class="dropdown-menu" role="menu" style="padding:0;"></ul>');
                    select_container.val((v+1).toString()).attr('id', "title_" + (v+1));
                    select_button.attr('id', "dLabel_" + (v+1));
                    selection_ul.attr('aria-labelledby', "dLabel_" + (v+1));

                    for(var l_color = 0; l_color < color_table.length; l_color++){
                        var selection_opt_container = $('<li></li>');
                        var selection_opt = $('<a></a>');
                        selection_opt.val(l_color.toString()).attr('name', (v+1)).attr('style', "height:15px; width:100px; background-color:" + color_table[l_color] + ";");
                    
                        if(used == 1){
                            if(color_table[l_color] == render_table[(v+1)]){
                                select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:-15; background-color:" + mapping_color.roots_color[l_color] + ";");
                            }
                        }
                        else{
                            if(l_color == (v+1)){
                                select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:-15; background-color:" + color_table[l_color] + ";");
                            }
                                
                            else if(color_table.length < v && l_color == color_table.length-1){
                                select_container.val(l_color.toString()).attr('style', "height:15px; width:100px; position:absolute; top:-15; background-color:" + color_table[color_table.length-1] + ";");
                            }
                        }                         
                            
                        selection_opt.unbind();
                        selection_opt.click(function(){
                            var select_container_id = "#title_" + this.name;
                            $(select_container_id).val((this.value).toString()).css('background-color', color_table[this.value]);
                        });
                        selection_opt_container.append(selection_opt)
                        selection_ul.append(selection_opt_container);
                        
                    }
                    select_container.append(selection_ul);
                    range_container.append(select_container);
                }
            }                 
            var sep_layer_input = $('<input class="layer_order handle_input" readonly></input>');

            sep_layer_input.attr("style", "top:" + (handle.eq(v).position().top) + ";");
            sep_layer_input.attr("id", "layer_" + v).val(slider_val[v]);//.attr('readonly', true)
            
            sep_container.append(sep_layer_input);
            
        }

        $(".mapping_selection").unbind();
        $(".mapping_selection").change(function(){
            this.style.background = color_table[this.value];
        });
    },

    set_size_handle_id: function(slider_val, comp, used, size_map, val_map){
        var self = this;

        var img_src;
        if(comp == "leaf_size")
            img_src = "media/img/one_leaf.png";
        else if(comp == "fruit_size")
            img_src = "media/img/one_fruit.png";
        
        var sep_container = $("#sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');   
        var range_container = $("#sep_range");

        var size_val = 0;
        for(var v = slider_val.length-1; v >= 0; v--){
            handle.eq(v).attr('id', "layer_handle_" + v); 
            if(v == 0){
                size_val = v;
                if(used == 1)
                    size_val = parseInt(size_map[v]);

                var select_container = $('<div class="size_num_select_container"></div>');
                var oneitem = $('<img></img>');
                var objslider = $('<div class="size_num_objslider"></div>');
                var slider_label = $('<span></span>');
                
                select_container.attr("id", "title_" + v);
                oneitem.attr("id", "oneitem_" + v).attr("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;").attr("src", img_src);

                objslider.attr("id", "ori_attr_val_" + v);

                slider_label.attr("id", "slider_label_" + v);
                slider_label.attr("style", "position:absolute; bottom:0px;");

                select_container.append(oneitem);
                select_container.append(objslider);
                select_container.append(slider_label);
                        
                range_container.append(select_container);

                var size_handle = "#ori_attr_val_" + v + " .ui-slider-handle";
                objslider.slider({
                    orientation: "horizontal",
                    min: 0,
                    max: 10,
                    value: size_val,
                    slide: function( event, ui) {
                        var myid = this.id;
                        var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop();
                        var container_id = "#title_" + myid.split("attr_val_").pop();
                        var s_label = "#slider_label_" + myid.split("attr_val_").pop();
                        
                        $(s_label).css({"left": 35+100*(0.1*ui.value)});
                        $(s_label).text(ui.value);
                        $(s_label).val(ui.value);
                        $(oneitem_id).css({"width": 5+30*(0.1*ui.value)});
                    }
                });

                select_container.css({"position": "absolute"});
                select_container.css({"top": $("#layer_slider").height()-5});
                
                objslider.css({'top':'8px'});
                $(size_handle).css({'width':'0.7em', 'height':'1em'});
                objslider.css({'height':'8px'});
                slider_label.text(size_val);
                slider_label.val(size_val);
                slider_label.css({"left": 35+100*(0.1*size_val)});

                if(slider_val.length == 1){
                    size_val = (v+1);
                    if(used == 1)
                        size_val = parseInt(size_map[(v+1)]);
                    var select_container = $('<div class="size_num_select_container"></div>');
                    var oneitem = $('<img></img>');
                    var objslider = $('<div class="size_num_objslider"></div>');
                    var slider_label = $('<span></span>');
                    
                    select_container.attr("id", "title_" + (v+1));
                    oneitem.attr("id", "oneitem_" + (v+1)).attr("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;").attr("src", img_src);

                    objslider.attr("id", "ori_attr_val_" + (v+1));

                    slider_label.attr("id", "slider_label_" + (v+1));
                    slider_label.attr("style", "position:absolute; bottom:0px;");

                    select_container.append(oneitem);
                    select_container.append(objslider);
                    select_container.append(slider_label);
                            
                    range_container.append(select_container);

                    var size_handle = "#ori_attr_val_" + (v+1) + " .ui-slider-handle";
                    objslider.slider({
                        orientation: "horizontal",
                        min: 0,
                        max: 10,
                        value: size_val,
                        slide: function( event, ui) {
                            var myid = this.id;
                            var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop(); //!!!
                            var container_id = "#title_" + myid.split("attr_val_").pop();
                            var s_label = "#slider_label_" + myid.split("attr_val_").pop();

                            $(s_label).css({"left": 35+100*(0.1*ui.value)});
                            $(s_label).text(ui.value);
                            $(s_label).val(ui.value);
                            $(oneitem_id).css({"width": 5+30*(0.1*ui.value)});
                        }
                    });

                    select_container.css({"position": "absolute"});
                    select_container.css({"top": -15});
                    
                    objslider.css({'top':'8px'});
                    $(size_handle).css({'width':'0.7em', 'height':'1em'});
                    objslider.css({'height':'8px'});
                   
                    slider_label.text(size_val);
                    slider_label.val(size_val);
                    slider_label.css({"left": 35+100*0.1*size_val});

                }

            }   
            else{
                size_val = v;
                if(used == 1)
                    size_val = parseInt(size_map[v]);
                var select_container = $('<div class="size_num_select_container"></div>');
                var oneitem = $('<img></img>');
                var objslider = $('<div class="size_num_objslider"></div>');
                var slider_label = $('<span></span>');
                
                select_container.attr("id", "title_" + v);
                oneitem.attr("id", "oneitem_" + v).attr("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;").attr("src", img_src);

                objslider.attr("id", "ori_attr_val_" + v);

                slider_label.attr("id", "slider_label_" + v);
                slider_label.attr("style", "position:absolute; bottom:0px;");

                select_container.append(oneitem);
                select_container.append(objslider);
                select_container.append(slider_label);
                        
                range_container.append(select_container);

                var size_handle = "#ori_attr_val_" + v + " .ui-slider-handle";
                objslider.slider({
                    orientation: "horizontal",
                    min: 0,
                    max: 10,
                    value: size_val,
                    slide: function( event, ui) {
                        var myid = this.id;
                        var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop(); //!!!
                        var container_id = "#title_" + myid.split("attr_val_").pop();
                        var s_label = "#slider_label_" + myid.split("attr_val_").pop();

                        $(s_label).css({"left": 35+100*(0.1*ui.value)});
                        $(s_label).text(ui.value);
                        $(s_label).val(ui.value);
                        $(oneitem_id).css({"width": 5+30*(0.1*ui.value)});
                    }
                });

                select_container.css({"position": "absolute"});
                select_container.css({"top": (handle.eq(v-1).position().top+handle.eq(v).position().top)/2});
                
                objslider.css({'top':'8px'});
                $(size_handle).css({'width':'0.7em', 'height':'1em'});
                objslider.css({'height':'8px'});
                
                slider_label.text(size_val);
                slider_label.val(size_val);
                slider_label.css({"left": 35+100*(0.1*size_val)});

                if(v == slider_val.length-1){
                    size_val = (v+1);
                    if(used == 1)
                        size_val = parseInt(size_map[(v+1)]);
                    var select_container = $('<div class="size_num_select_container"></div>');
                    var oneitem = $('<img></img>');
                    var objslider = $('<div class="size_num_objslider"></div>');
                    var slider_label = $('<span></span>');
                                        
                    select_container.attr("id", "title_" + (v+1));
                    oneitem.attr("id", "oneitem_" + (v+1)).attr("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;").attr("src", img_src);

                    objslider.attr("id", "ori_attr_val_" + (v+1));

                    slider_label.attr("id", "slider_label_" + (v+1));
                    slider_label.attr("style", "position:absolute; bottom:0px;");

                    select_container.append(oneitem);
                    select_container.append(objslider);
                    select_container.append(slider_label);
                            
                    range_container.append(select_container);

                    var size_handle = "#ori_attr_val_" + (v+1) + " .ui-slider-handle";
                    objslider.slider({
                        orientation: "horizontal",
                        min: 0,
                        max: 10,
                        value: size_val,
                        slide: function( event, ui) {
                            var myid = this.id;
                            var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop();
                            var container_id = "#title_" + myid.split("attr_val_").pop();
                            var s_label = "#slider_label_" + myid.split("attr_val_").pop();

                            $(s_label).css({"left": 35+100*(0.1*ui.value)});
                            $(s_label).text(ui.value);
                            $(s_label).val(ui.value);
                            $(oneitem_id).css({"width": 5+30*(0.1*ui.value)});
                        }
                    });

                    select_container.css({"position": "absolute"});
                    select_container.css({"top": -15});
                    
                    objslider.css({'top':'8px', 'height':'8px'});
                    $(size_handle).css({'width':'0.7em', 'height':'1em'});
                   
                    slider_label.text(size_val);
                    slider_label.val(size_val);
                    slider_label.css({"left": 35+100*0.1*size_val});
                    
                }
            } 
            var sep_layer_input = $('<input class="layer_order handle_input" readonly></input>');
            sep_layer_input.attr("style", "top:" + (handle.eq(v).position().top) + ";");
            sep_layer_input.attr("id", "layer_" + v).val(slider_val[v]);//.attr('readonly', true)
            
            sep_container.append(sep_layer_input);
            
        }
    },

    trunk_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in trunk mapping");
        self.el_mapping_img.attr('src', 'media/img/trunk_mapping.png');

        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Trunk Mapping:");
        
        self.el_sidekeyselect.empty();               
        // list all the attribute can be mapped
        for(s in component_attribute[data_mode]){
            if(s == "none"){
                continue;
            }
            else{
                // if(component_attribute[data_mode][s][0].length == 0 || (attr_opt.indexOf(s) != -1 && s != attr_map["trunk"]))
                if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["trunk"]))
                    continue;
            }
            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s + "*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["trunk"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        // set user's map
        if(attr_map["trunk"] != "none"){
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            self.el_mark_group.html("<b>NOTE: Blue</b> as left trunk | <b>Red</b> as right trunk");
            self.el_mark_group.show();

            if(component_attribute[data_mode][attr_map["trunk"]][5] == "categorical" || component_attribute[data_mode][attr_map["trunk"]][5] == "boolean"){
                self.binary_cat_operation(attr_map["trunk"], "trunk", attr_map["trunk"]);
            }
            else{
                self.binary_num_operation(attr_map["trunk"], "trunk", attr_map["trunk"]);
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");
                self.el_sidekey_operation.show();
                // self.el_mark_group.text("✔ as Left Side of Trunk: 【NOTE】");
                self.el_mark_group.html("<b>NOTE: Blue</b> as left trunk | <b>Red</b> as right trunk");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.binary_cat_operation(self.el_sidekeyselect.val(), "trunk", attr_map["trunk"]);
                }
                else{
                    self.binary_num_operation(self.el_sidekeyselect.val(), "trunk", attr_map["trunk"]);
                }
                
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        });
    
        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in trunk submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");

            // self.el_sidekey_submit.text("Update");
            // self.el_sidekey_submit.attr("disabled", true);
            self.el_block_layer.show();

            self.binary_submit(attr_map["trunk"], self.el_sidekeyselect.val(), "trunk");                   

        });

    },

    bside_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in bside mapping");
        self.el_mapping_img.attr('src', 'media/img/bside_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Branch Side Mapping:");
    
        self.el_sidekeyselect.empty();
        
        for(s in component_attribute[data_mode]){
            if(s == "none"){
                continue;
            }
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["bside"]))
                    continue;
            }

            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["bside"]);
            self.el_sidekeyselect.append(selection_opt);

        }

        if(attr_map["bside"] != "none"){
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            // self.el_mark_group.text("✔ as Left Side of bside: 【NOTE】");
            self.el_mark_group.html("<b>NOTE: Blue</b> as upper side | <b>Red</b> as lower side");
            self.el_mark_group.show();
            if(component_attribute[data_mode][attr_map["bside"]][5] == "categorical" || component_attribute[data_mode][attr_map["bside"]][5] == "boolean"){
                self.binary_cat_operation(attr_map["bside"], "bside", attr_map["bside"]);
            }
            else{
                self.binary_num_operation(attr_map["bside"], "bside", attr_map["bside"]);
            }                

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");
                self.el_sidekey_operation.show();
                
                self.el_mark_group.html("<b>NOTE: Blue</b> as upper side | <b>Red</b> as lower side");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.binary_cat_operation(self.el_sidekeyselect.val(), "bside", attr_map["bside"]);
                }
                else{
                    self.binary_num_operation(self.el_sidekeyselect.val(), "bside", attr_map["bside"]);
                }
            }
            
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        });

        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in bside submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");

            // self.el_sidekey_submit.text("Update");
            // self.el_sidekey_submit.attr("disabled", true);
            self.el_block_layer.show();

            self.binary_submit(attr_map["bside"], self.el_sidekeyselect.val(), "bside");

        });
    },

    branch_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in branch mapping");
        self.el_mapping_img.attr('src', 'media/img/branch_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Branch Layer Mapping:");
        $("#sidekey_description").text("The branch mapping will place alter into different layer, so the attribute is better to be related with alter or we will random place the same alter into duplication sticks. This determines the height of the tree and it will be menful if this attribute is in a order.");

        self.el_sidekeyselect.empty();
        

        for(s in component_attribute[data_mode]){
            if(s == "none"){
                continue;
            }
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["branch"]))
                    continue;
            }

            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["branch"]);
            self.el_sidekeyselect.append(selection_opt);
        }
        self.el_mark_group_select.empty();

        if(attr_map["branch"] != "none"){
            self.el_sidekey_operation.show();
            
            self.el_mark_group.html("<b>NOTE: Order</b> the attributes as the branch order</b>");
            self.el_mark_group.show();
            if(component_attribute[data_mode][attr_map["branch"]][5] == "categorical" || component_attribute[data_mode][attr_map["branch"]][5] == "boolean"){
                self.layer_cat_operation(attr_map["branch"], "branch", attr_map["branch"]);
            }
            else{
                self.layer_num_operation(attr_map["branch"], "branch", attr_map["branch"]);
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            self.el_mark_group_select.empty();
            var revert = "d";
            if( self.el_sidekeyselect.val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");                
                self.el_sidekey_operation.show();
                
                self.el_mark_group.html("<b>NOTE: Order</b> the attributes as the branch order</b>");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.layer_cat_operation(self.el_sidekeyselect.val(), "branch", attr_map["branch"]);
                }
                else{
                    self.layer_num_operation(self.el_sidekeyselect.val(), "branch", attr_map["branch"]);
                }
                
            }           
            
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        });

        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in branch submit");
            var data_mode = self.model.get("view_mode");
            var ego_selections = self.model.get("selected_egos");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");
            self.el_block_layer.show();

            if("branch" in attribute_mapping){
                delete attribute_mapping["branch"];
            }
            attr_map["branch"] = self.el_sidekeyselect.val();

            if(self.el_sidekeyselect.val() == "none"){}
            
            else{
                var update_info = data_mode + ":-ctree_branch:-" + self.el_sidekeyselect.val();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    var layer_map = {};
                    attribute_mapping["branch"] = {};
                    count_layer = component_attribute[data_mode][self.el_sidekeyselect.val()][0].length-1;
                    $('#mapping_group').children().each(function(){
                        
                        attribute_mapping["branch"][$(this).val()] = count_layer;
                        layer_map[$(this).val()] = count_layer;
                        count_layer--;
                    });
                    update_info += ":-" + JSON.stringify(layer_map);
                }
                else{
                    var layer_map = [];
                    attribute_mapping["branch"] = []
                    for(var v = 0; v < $("#sep_gap").val()-1; v++){
                        var layer_id = "#layer_" + v;
                        layer_map.push($(layer_id).val());
                        attribute_mapping["branch"].push($(layer_id).val());
                    }
                    update_info += ":-" + JSON.stringify(layer_map);
                }
                
                for(ego in ego_selections){
                    update_info += ":=" + ego;
                }

                attr_map["branch"] = self.el_sidekeyselect.val();
                self.model.set({"attribute": attr_map});
                self.set_component();
                self.el_block_page.hide();
                self.el_block_layer.hide();
            }

        });
    },

    root_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in root mapping");
        self.el_mapping_img.attr('src', 'media/img/root_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Root Mapping:");
        
        self.el_sidekeyselect.empty();
        
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0)
                    continue;
            }

            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["root"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        // set user mapping
        if(attr_map["root"] != "none"){
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            self.el_mark_group.html("<b>NOTE: Color</b> as different categories");
            self.el_mark_group.show();
            
            var user_map = attribute_mapping[attr_map["root"]];
            if(component_attribute[data_mode][attr_map["root"]][5] == "categorical" || component_attribute[data_mode][attr_map["root"]][5] == "boolean"){
                self.color_cat_operation(attr_map["root"], "root", attr_map["root"]);
            }
            else{
                self.color_num_operation(attr_map["root"], "root", attr_map["root"]);
            }
            
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            var attr_map = self.model.get("attribute");
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE: Color</b> as different categories");
                self.el_mark_group.show();
                
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.color_cat_operation(self.el_sidekeyselect.val(), "root", attr_map["root"]);
                }
                else{
                    self.color_num_operation(self.el_sidekeyselect.val(), "root", attr_map["root"]);
                }
                
            }
            else{
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE:</b> Map <b>nothing</b> to root");
                self.el_mark_group.show();
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        });

    
        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in root submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");
            
            self.el_block_layer.show();

            self.color_submit(attr_map["root"], self.el_sidekeyselect.val(), "root");

        });
    },    

    leaf_color_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in leaf_color mapping");
        self.el_mapping_img.attr('src', 'media/img/leaf_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Leaf Color Mapping:");
        $("#sidekey_description").text("The leaf color mapping will show the different category of each contact as a leaf color, so the attribute is better to be related with the unique information. You also can choose the group for the color.");

        self.el_sidekeyselect.empty();
        
        // container.setAttribute("class", "sidekey_selection");
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["leaf_color"]))
                    continue;
            }
            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["leaf_color"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        if(attr_map["leaf_color"] != "none"){
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            self.el_mark_group.html("<b>NOTE: Color</b> as different categories");
            self.el_mark_group.show();

            if(component_attribute[data_mode][attr_map["leaf_color"]][5] == "categorical" || component_attribute[data_mode][attr_map["leaf_color"]][5] == "boolean"){
                self.color_cat_operation(attr_map["leaf_color"], "leaf_color", attr_map["leaf_color"]);
            }
            else{
                self.color_num_operation(attr_map["leaf_color"], "leaf_color", attr_map["leaf_color"]);
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE: Color</b> as different categories");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.color_cat_operation(self.el_sidekeyselect.val(), "leaf_color", attr_map["leaf_color"]);
                }
                else{
                    self.color_num_operation(self.el_sidekeyselect.val(), "leaf_color", attr_map["leaf_color"]);
                }
            }
            else{
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE:</b> Map <b>nothing</b> to leaf color");
                self.el_mark_group.show();
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        });
        
        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in leaf_color submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");
            self.el_block_layer.show();

            self.color_submit(attr_map["leaf_color"], self.el_sidekeyselect.val(), "leaf_color");

        });
    },

    leaf_highlight_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var data_mode = self.model.get("view_mode");
        var ego_selections = self.model.get("selected_egos");
        console.log("in leaf_highlight mapping");
        self.el_mapping_img.attr('src', 'media/img/leaf_highlight_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Leaf Highlight Mapping:");
        
        self.el_sidekeyselect.empty();
        
        for(s in component_attribute[data_mode]){
            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["highlight"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE: Highlight \"" + self.el_sidekeyselect.val() + "\"</b> information on leaf<br><b>");
                self.el_mark_group.show();         
            }
            else{
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE:</b> Map <b>nothing</b> to leaf highlight");
                self.el_mark_group.show();
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        });

        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in highlight submit");
            var attr_map = self.model.get("attribute");
            var attr_opt = self.model.get("attr_option");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");

            var update_info = data_mode + ":-ctree_highlight:-" + self.el_sidekeyselect.val();
            for(ego in ego_selections){
                update_info += ":=" + ego;
            }
            attr_map["highlight"] = self.el_sidekeyselect.val();
            self.model.set({"attribute": attr_map});
            self.set_component();
            self.el_block_page.hide();
            self.el_block_layer.hide();
            
        });
    },

    leaf_size_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in leaf_size mapping");
        self.el_mapping_img.attr('src', 'media/img/leaf_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Leaf Size Mapping:");
        $("#sidekey_description").text("The leaf size mapping will show the quantity of each contact as a leaf size, so the attribute is better to be related with the unique information. You also can choose the scale of the different between the size.");

        self.el_sidekeyselect.empty();
        
        // container.setAttribute("class", "sidekey_selection");
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["leaf_size"]))
                    continue;
            }
            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["leaf_size"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        if(attr_map["leaf_size"] != "none"){
            var user_map = attribute_mapping[attr_map["leaf_size"]];
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            self.el_mark_group.html("<b>NOTE: Leaf size scale</b> of the attributes mapping");
            self.el_mark_group.show();
            
            if(component_attribute[data_mode][attr_map["leaf_size"]][5] == "categorical" || component_attribute[data_mode][attr_map["leaf_size"]][5] == "boolean"){
                self.size_cat_operation(attr_map["leaf_size"], "leaf_size", attr_map["leaf_size"]);
            }
            else{
                self.size_num_operation(attr_map["leaf_size"], "leaf_size", attr_map["leaf_size"]);
            }
            
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }


        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            var attr_map = self.model.get("attribute");
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){   
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE: Leaf size scale</b> of the attributes mapping");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.size_cat_operation(self.el_sidekeyselect.val(), "leaf_size", attr_map["leaf_size"]);
                }
                else{
                    self.size_num_operation(self.el_sidekeyselect.val(), "leaf_size", attr_map["leaf_size"]);
                }
            }
            else{
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE:</b> Map <b>nothing</b> to leaf size");
                self.el_mark_group.show();
            }
                        
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        });

        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in leaf_size submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");
            // self.el_sidekey_submit.text("Update");
            // self.el_sidekey_submit.attr("disabled", true);
            self.el_block_layer.show();

            self.size_submit(attr_map["leaf_size"], self.el_sidekeyselect.val(), "leaf_size");

        });
    },

    fruit_size_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in fruit_size mapping");
        self.el_mapping_img.attr('src', 'media/img/fruit_size_mapping.png');
        self.el_sidekey_selection.show();
        self.el_sidekey_title.text("Fruit Size Mapping:");
        
        self.el_sidekeyselect.empty();
        
        
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                if(component_attribute[data_mode][s][0].length == 0 || component_attribute[data_mode][s][4] != "1" || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["fruit_size"]))
                    continue;
            }
            var text = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                text = s +"*";
            else{
                if(s == "dataset")
                    text = "waves"; 
            }
            var selection_opt = util.create_option(s, text, "myfont3", s==attr_map["fruit_size"]);
            self.el_sidekeyselect.append(selection_opt);
        }

        if(attr_map["fruit_size"] != "none"){
            self.el_mark_group_select.empty();
            self.el_sidekey_operation.show();
            self.el_mark_group.html("<b>NOTE: Fruit size scale</b> of the attributes mapping");
            self.el_mark_group.show();
            
            var user_map = attribute_mapping[attr_map["fruit_size"]];
            if(component_attribute[data_mode][attr_map["fruit_size"]][5] == "categorical" || component_attribute[data_mode][attr_map["fruit_size"]][5] == "boolean"){
                self.size_cat_operation(attr_map["fruit_size"], "fruit_size", attr_map["fruit_size"]);                
            }
            else{
                self.size_num_operation(attr_map["fruit_size"], "fruit_size", attr_map["fruit_size"]);
            }
            
            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
        }

        self.el_sidekeyselect.unbind();
        self.el_sidekeyselect.change(function(){
            var attr_map = self.model.get("attribute");
            self.el_mark_group_select.empty();
            if( self.el_sidekeyselect.val() != "none"){   
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE: Fruit size scale</b> of the attributes mapping");
                self.el_mark_group.show();
                if(component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "categorical" || component_attribute[data_mode][self.el_sidekeyselect.val()][5] == "boolean"){
                    self.size_cat_operation(self.el_sidekeyselect.val(), "fruit_size", attr_map["fruit_size"]);
                }
                else{
                    self.size_num_operation(self.el_sidekeyselect.val(), "fruit_size", attr_map["fruit_size"]);
                }
            }
            else{
                self.el_sidekey_operation.show();
                self.el_mark_group.html("<b>NOTE:</b> Map <b>nothing</b> to fruit size");
                self.el_mark_group.show();
            }

            self.el_sidekey_submit.show();
            self.el_sidekey_submit.text("Done");
            
        });
        
        self.el_sidekey_submit.unbind();
        self.el_sidekey_submit.click(function(){
            self.change_mapping = 1;
            console.log("in fruit_size submit");
            self.el_block_page.show();
            self.el_loading_process.html("<b>Mapping...</b>");
            // self.el_sidekey_submit.text("Update");
            // self.el_sidekey_submit.attr("disabled", true);
            self.el_block_layer.show();

            self.size_submit(attr_map["fruit_size"], self.el_sidekeyselect.val(), "fruit_size");

        });
    },

    set_component: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var myattribute = self.model.get("attribute");
        
        if(jQuery.isEmptyObject(myattribute)){
            $(".sidekey_map").css('visibility', 'hidden');
            $('#save_label').attr("disabled", true);
        }
        else{
            $('#save_label').removeAttr("disabled");
            for(cmpt in myattribute){
                var cmpt_id = "#";
                if(cmpt == "stick")
                    continue;
                cmpt_id += cmpt + "_map";
                if(component_attribute[data_mode][myattribute[cmpt]][4] != "1" || myattribute[cmpt] == "none")                
                    $(cmpt_id).text(myattribute[cmpt]);
                else
                    $(cmpt_id).text(myattribute[cmpt] + "*");
                if(myattribute[cmpt] == "none"){
                    $(cmpt_id).attr('style', 'background: rgb(252, 180, 183);');
                }
                else
                    $(cmpt_id).attr('style', 'background: rgb(245, 244, 174);');
            }
            $(".sidekey_map").css('visibility', 'visible');
        }
        var single_attr = [];
        // set model attr_option whenever changing attribute
        for(a in myattribute){
            single_attr.push(myattribute[a]);
        }
        self.model.set({"attr_option": single_attr});
        
    },

    set_save_component: function(myattribute){
        var self = this;
        var data_mode = self.model.get("view_mode");
        for(cmpt in myattribute){
            var cmpt_id = "#";
            if(cmpt == "stick")
                continue;
            cmpt_id += cmpt + "_save_map";
            
            if(component_attribute[data_mode][myattribute[cmpt]][4] != "1" || myattribute[cmpt] == "none")                
                $(cmpt_id).text(myattribute[cmpt]);
            else
                $(cmpt_id).text(myattribute[cmpt] + "*");
            if(myattribute[cmpt] == "none")
                $(cmpt_id).attr('style', 'background: rgb(252, 180, 183);');
            else
                $(cmpt_id).attr('style', 'background: rgb(245, 244, 174);');
        }
        $(".sidekey_map").css('visibility', 'visible');
        
    },

    restructure: function(data){
        var self = this;
        self.change_structure = 1;
        self.change_mapping = 1;
        tree_size = {};
        self.model.set({"tree_boundary":{}});
        self.model.trigger('change:attribute');
        self.el_loading_process.html("<b>Rendering...</b>");
        var ego_selections = self.model.get("selected_egos");
        if(jQuery.isEmptyObject(ego_selections)){
            self.el_block_page.hide();
            return
        }
            
        var data_mode = self.model.get("view_mode");
        var all_ego = [];
        
        for(ego in ego_selections){
            all_ego.push(ego);
        }
        
        console.log("in model.restructure");
        var tree_structure = self.model.get("tree_structure");
        
        for(var i = 0; i < all_ego.length; i++){
            for(var d in data){
                if(d in tree_structure[data_mode]){
                    tree_structure[data_mode][d][all_ego[i]] = data[d][all_ego[i]];            
                }
                else{
                    tree_structure[data_mode][d] = {};
                    tree_structure[data_mode][d][all_ego[i]] = data[d][all_ego[i]];
                }
            }
        }                
        // self.model.trigger('change:tree_structure');
        self.el_block_page.hide();          
    }

});
