// mapping
var MappingView = Backbone.View.extend({

    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in mapping initialize");
        _.bindAll(this, 'set_component');
        _.bindAll(this, 'set_user_mapping');
        
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
                if(self.change_mapping != 0)
                    self.model.trigger('change:tree_structure');
            }
        });

        $( "#map" ).click(function() {
            $('#mapping_img').attr('src', 'media/img/real_mix_tree.png');
            $("#sidekey_dialog").dialog( "open" );
            $("#sidekey_save_img").hide();
            $("#sidekey_selection").hide();
            $("#sidekey_operation").hide();
            $("#mark_group").hide();
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

                var request = self.model.get("view_mode") + ":-" + encodeURIComponent(JSON.stringify(user_map)) + ":-" + map_name + ":-" +  self.model.get("dataset_group");
                var request_url = "save_mapping/?save="+request;
        
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
        
            // $("#sidekey_save_img").hide();
            for(var ego in all_ego){
                ego_list.push(ego);
            }
            var request = JSON.stringify(now_attr) + ":-" + JSON.stringify(ego_list) + ":-" + now_mode + ":-" + JSON.stringify(now_attr_map) + ":-" + data_group + ":-" + JSON.stringify(all_ego);
            var request_url = "restore_data/?restore="+request;
            
            $("#block_page").show();

            d3.json(request_url, function(result) {
                $("#block_page").hide();
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
                // $(delete_id).css('visibility', 'visible');
                $(delete_id).show();
            });
            save_item.mouseout(function(){
                var delete_id = "#dlt_mapping_" + this.value;
                // $(delete_id).css('visibility', 'hidden');
                $(delete_id).hide();
            });

            save_item.click(function(){
                $("#sidekey_selection").hide();
                $("#sidekey_save_img").show();
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

                var request = self.model.get("view_mode") + ":-" + save_user_mapping[this.value-1]["name"] + ":-" + self.model.get("dataset_group");
                var request_url = "del_mapping/?save="+request;
                
                d3.json(request_url, function(result) {
                    set_new_record();
                }); 

                
            });
        }
        

    },

    set_option: function(){
        var self = this;

        $("#trunk_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.trunk_map();

        });

        $("#branch_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.branch_map();
        });

        $("#bside_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.bside_map();
        });

        $("#root_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.root_map();
        });

        $("#leaf_size_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.leaf_size_map();
        });

        $("#leaf_color_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.leaf_color_map();
        });

        $("#leaf_highlight_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.leaf_highlight_map();
        });

        $("#fruit_size_label").click(function() {
            $("#sidekey_save_img").hide();
            $("#sidekey_operation").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            self.fruit_size_map();
        });        

    },

    binary_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");
            
        var group1 = document.createElement("div");
        var group2 = document.createElement("div");
        var list1 = document.createElement("ul");
        var list2 = document.createElement("ul");
        group1.setAttribute("class", "column left first");
        group2.setAttribute("class", "column left");

        list1.id = "mapping_group1";
        list2.id = "mapping_group2";
        list1.setAttribute("class", "sortable-list");
        list2.setAttribute("class", "sortable-list");

        list1.setAttribute("style", "background-color:rgba(33, 178, 239, 0.5);");
        list2.setAttribute("style", "background-color:rgba(236, 91, 94, 0.5);");

        var item_array = component_attribute[data_mode][one_attr][0]
        if(one_attr == ori_attr && comp in attribute_mapping){
            for(var c0 = 0; c0 < attribute_mapping[comp][0].length; c0++){
                var item = document.createElement("li");
                item.setAttribute("class", "sortable-item");
                item.innerHTML = attribute_mapping[comp][0][c0];
                // item.value = component_attribute[data_mode][$("#sidekeyselect").val()][0][c];
                item.value = item_array.indexOf(attribute_mapping[comp][0][c0]);
                list1.appendChild(item);
            }
            for(var c1 = 0; c1 < attribute_mapping[comp][1].length; c1++){
                var item = document.createElement("li");
                item.setAttribute("class", "sortable-item");
                item.innerHTML = attribute_mapping[comp][1][c1];
                // item.value = component_attribute[data_mode][$("#sidekeyselect").val()][0][c];
                item.value = item_array.indexOf(attribute_mapping[comp][1][c1]);
                list2.appendChild(item);
            }

        }

        else{
            var total_items = item_array.length
            for(var c = 0; c < total_items; c ++){
                var item = document.createElement("li");
                item.setAttribute("class", "sortable-item");
                item.innerHTML = item_array[c];
                // item.value = component_attribute[data_mode][attr_map["trunk"]][0][c];
                item.value = c;
                if(c < total_items/2)
                    list1.appendChild(item);
                else
                    list2.appendChild(item);
            }
            
        }

        group1.appendChild(list1);
        group2.appendChild(list2);
        attr_container.appendChild(group1);
        attr_container.appendChild(group2);

        $('#mark_group_select .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });

    },

    binary_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");
            
        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        
        var sep = document.createElement("div");
        var sep_title = document.createElement("span");
        var group_slider = document.createElement("div");
        var range = document.createElement("div");
        var range_min = document.createElement("span");
        var range_max = document.createElement("span");
        
        sep_title.id = "sep_group";
        
        group_slider.id = "binary_slider";
        sep_title.setAttribute("style", "position:absolute;");
        sep.setAttribute("style", "margin-top:10px; position:relative; width:100%; margin-left:5px; height:30px;");
        group_slider.setAttribute("style", "background:rgba(236, 91, 94, 0.5); position:absolute; top:25px; width:100%;");

        range.setAttribute("style", " width:100%; margin-top:10px;");
        range_min.innerHTML = attr_min;
        range_max.innerHTML = attr_max;
        range_min.setAttribute("class", "left");
        range_max.setAttribute("class", "right");

        sep.appendChild(sep_title);
        sep.appendChild(group_slider);
        range.appendChild(range_min);
        range.appendChild(range_max);
        attr_container.appendChild(sep);
        attr_container.appendChild(range);

        if(one_attr == ori_attr && comp in attribute_mapping){
            $("#sep_group").css({"left": 100*(parseInt(attribute_mapping[comp][0])-attr_min)/((attr_max-attr_min)+1) + "%"})
            .html(parseInt(attribute_mapping[comp][0])).val(parseInt(attribute_mapping[comp][0]));
            
            $("#binary_slider").slider({
                orientation: "horizontal",
                range: "min",
                min: attr_min,
                max: attr_max,
                value: parseInt(attribute_mapping[comp][0]),
                step: 0.1,
                slide: function( event, ui ) {
                    $("#sep_group").text(ui.value);
                    $("#sep_group").val(ui.value);
                    $("#sep_group").css({"left": 100*(ui.value-attr_min)/((attr_max-attr_min)+1) + "%"});
                }
            });
            
            $('#binary_slider .ui-slider-range').css({'background':'rgba(33, 178, 239, 0.5)'});

        }

        else{
            $("#sep_group").css({"left": 100*(Math.floor((attr_min + attr_max)/2)-attr_min)/((attr_max-attr_min)+1) + "%"})
            .html(Math.floor((attr_min + attr_max)/2)).val(Math.floor((attr_min + attr_max)/2));
            
            $("#binary_slider").slider({
                orientation: "horizontal",
                range: "min",
                min: attr_min,
                max: attr_max,
                value: Math.floor((attr_min + attr_max)/2),
                step: 0.1,
                slide: function( event, ui ) {
                    $("#sep_group").text(ui.value);
                    $("#sep_group").val(ui.value);
                    $("#sep_group").css({"left": 100*(ui.value-attr_min)/((attr_max-attr_min)+1) + "%"});
                }
            });                    

            $('#binary_slider .ui-slider-range').css({'background':'rgba(33, 178, 239, 0.5)'});
        }

    },

    layer_cat_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");

        var group = document.createElement("div");
        var list = document.createElement("ul");
        group.setAttribute("class", "column left first");

        list.id = "mapping_group";
        list.setAttribute("class", "sortable-list");

        list.setAttribute("style", "background-color:rgba(125, 96, 66, 0.7);");

        if(one_attr == ori_attr && comp in attribute_mapping){
            var user_map = attribute_mapping[comp];
            var total_items = component_attribute[data_mode][one_attr][0].map(function(d){return 0});
            
            for(var real in user_map){
                total_items[user_map[real]] = real;
            }
            
            for(var c = total_items.length-1; c >= 0 ; c--){
                var item = document.createElement("li");
                item.setAttribute("class", "sortable-item");
                item.innerHTML = total_items[c];
                item.value = total_items[c];
                list.appendChild(item);
            }

        }

        else{            
            var total_items = component_attribute[data_mode][one_attr][0].length;
            for(var c = total_items-1; c >= 0; c--){
                var item = document.createElement("li");
                item.setAttribute("class", "sortable-item");
                item.innerHTML = component_attribute[data_mode][one_attr][0][c];
                item.value = component_attribute[data_mode][one_attr][0][c];
                list.appendChild(item);
            }
        }

        group.appendChild(list);
        attr_container.appendChild(group);

        $('#mark_group_select .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });

    },

    layer_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");
        var revert = "d";
        var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
        var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
        var attr_range = component_attribute[data_mode][one_attr][3];

        var sep = document.createElement("div");
        var gap = document.createElement("div");
        var gap_title = document.createElement("span");
        var gap_input = document.createElement("select");
        var revert_button = document.createElement("button");
        var group_slider = document.createElement("div");
        var range = document.createElement("div");
        
        gap_input.id = "sep_gap";
        revert_button.id = "revert_button";
        revert_button.innerHTML = "Revert";
        revert_button.setAttribute("class", "right");
        gap_input.setAttribute("style", "width:100px");
        group_slider.id = "layer_slider";
        gap.setAttribute("style", "margin-top:5px;");

        range.id = "sep_range";
        range.setAttribute("style", "margin:15 0 0 0; position:relative; width:65px;");
        range.setAttribute("class", "left");

        gap_title.innerHTML = "Total Layer: ";
        gap_title.setAttribute("class", "myfont3");
        sep.id = "sep_group";
        sep.setAttribute("style", "margin:15 0 0 10; position:relative;");
        sep.setAttribute("class", "left");
        // group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*(user_map.length+1)) + ";");
        group_slider.setAttribute("class", "left");

        var mapping_gap = attr_range/9;
        var slider_val = [];
        // check the gap
        var total_gap = 20;
        if(attr_range < 10)
            total_gap = attr_range*2;
        if(one_attr == ori_attr && comp in attribute_mapping){
            var user_map = attribute_mapping[comp];   
            group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*(user_map.length+1)) + ";");
        
            for(var s=4; s < total_gap; s++){
                var opt = document.createElement("option");
                opt.value = s;
                opt.innerHTML = s;
                opt.setAttribute("class", "myfont3");
                if(s == user_map.length+1)
                    opt.setAttribute("selected", true);
                
                gap_input.appendChild(opt);
            }

            gap.appendChild(gap_title);
            gap.appendChild(gap_input);
            gap.appendChild(revert_button);

            attr_container.appendChild(gap);
            attr_container.appendChild(range);
            attr_container.appendChild(group_slider);
            attr_container.appendChild(sep);

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
            group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:500;");
        
            for(var s=4; s < total_gap; s++){
                var opt = document.createElement("option");
                opt.value = s;
                opt.innerHTML = s;
                opt.setAttribute("class", "myfont3");
                if(s == 10)
                    opt.setAttribute("selected", true);
                gap_input.appendChild(opt);
            }

            gap.appendChild(gap_title);
            gap.appendChild(gap_input);
            gap.appendChild(revert_button);

            attr_container.appendChild(gap);
            attr_container.appendChild(range);
            attr_container.appendChild(group_slider);
            attr_container.appendChild(sep);

            
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
            $("#layer_slider").slider({
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
            $("#layer_slider").slider({
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

        $("#sep_group").empty();
        $("#sep_range").empty();
        
        self.set_layer_handle_id(revert, slider_val);

        $("#revert_button").unbind();
        $("#revert_button").click(function(){
            var my_revert = "a";
            if(revert == "a")
                my_revert = "d";
            
            var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
            var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
            var attr_range = component_attribute[data_mode][one_attr][3];
            var gap = attr_range/($("#sep_gap").val()-1);
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
            
            $("#layer_slider").slider( "destroy" );
            $("#layer_slider").attr("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
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

        $("#sep_gap").unbind();
        $("#sep_gap").change(function(){
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
            $("#layer_slider").attr("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
        
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
        var attr_container = document.getElementById("mark_group_select");
        var total_items = component_attribute[data_mode][one_attr][0];
        var color_table = [];
        var render_table = [];
        var used = 0;
        if(one_attr == ori_attr && comp in attribute_mapping){
            // total_items = component_attribute[data_mode][one_attr][0];
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
            var br = document.createElement("br");
            var p = document.createElement("p");
            if(c == 0){
                var br1 = document.createElement("br");
                var p1 = document.createElement("p");
                var c1 = document.createElement("span");
                var c2 = document.createElement("span");
                c1.innerHTML = "Color Map";
                c2.innerHTML = "Attribute Data";
                c1.setAttribute("class", "myfont3");
                c2.setAttribute("class", "myfont3");
                c2.setAttribute("style", "position:absolute; left:125px;");
                attr_container.appendChild(c1);
                attr_container.appendChild(c2);
                
                attr_container.appendChild(br1);
                attr_container.appendChild(p1);
            }


            var label_container = document.createElement("span"); // attribute data
            label_container.innerHTML = total_items[c];
            label_container.setAttribute("style", "position:absolute; left:125px;");

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
                        // select_container.setAttribute("style", "background-color:" + color_table[l_color] + ";");
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
            $("#mark_group_select").append(select_container);
            attr_container.appendChild(label_container);
            
            attr_container.appendChild(br);
            attr_container.appendChild(p);

            /*
            var select_container = document.createElement("select");
            var label_container = document.createElement("span");
            select_container.value = c;
            select_container.setAttribute("class", "mapping_selection");
            // select_container.setAttribute("style", "width:100px; position:absolute; left:30px;");
            select_container.id = "ori_attr_val_" + c;
            label_container.innerHTML = total_items[c];
            label_container.setAttribute("style", "position:absolute; left:125px;");

            for(var l_color = 0; l_color < color_table.length; l_color++){
                var selection_opt = document.createElement('option');
                selection_opt.value = l_color;
                selection_opt.setAttribute("class", "myfont3");
                selection_opt.setAttribute("style", "background-color:" + color_table[l_color] + ";");
                if(used == 1){
                    if(color_table[l_color] == render_table[c]){
                        selection_opt.setAttribute("selected", true);
                        select_container.setAttribute("style", "width:100px; position:absolute; background-color:" + color_table[l_color] + ";");
                    }
                }
                else{
                    if(l_color == c){
                        selection_opt.setAttribute("selected", true);
                        select_container.setAttribute("style", "width:100px; position:absolute; background-color:" + color_table[l_color] + ";");
                    }
                        
                    else if(color_table.length < c && l_color == color_table.length-1){
                        selection_opt.setAttribute("selected", true);
                        select_container.setAttribute("style", "width:100px; position:absolute; background-color:" + color_table[color_table.length-1] + ";");
                    }
                }                
                    
                select_container.appendChild(selection_opt);
                
            }
            
            attr_container.appendChild(select_container);
            attr_container.appendChild(label_container);
            
            attr_container.appendChild(br);
            attr_container.appendChild(p);
            */
        }

        // $(".mapping_selection").unbind();
        // $(".mapping_selection").change(function(){
        //     this.style.background = color_table[this.value];
        // });

    },

    color_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");
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

        var sep = document.createElement("div");
        var gap = document.createElement("div");
        var gap_title = document.createElement("span");
        var gap_input = document.createElement("select");
        var group_slider = document.createElement("div");
        var range = document.createElement("div");
        
        gap_input.id = "sep_gap";
        gap_input.setAttribute("style", "width:100px");

        group_slider.id = "layer_slider";
        gap.setAttribute("style", "margin-top:10px; margin-bottom: 10px;");

        range.id = "sep_range";
        range.setAttribute("style", "margin:15 0 0 0; position:relative; width:125px;");
        range.setAttribute("class", "left");

        gap_title.innerHTML = "Total Categories: ";
        gap_title.setAttribute("class", "myfont3");
        sep.id = "sep_group";
        sep.setAttribute("style", "margin:15 0 0 10; position:relative;");
        sep.setAttribute("class", "left");
        // group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*(user_map.length+1)) + ";");
        group_slider.setAttribute("class", "left");

        var mapping_gap = attr_range/5;
        var slider_val = [];

        if(used == 1){
            if(comp == "leaf_color")
                group_slider.setAttribute("style", "background:rgba(7, 147, 9, 0.6); margin-top:25px; margin-left:5px; height:" + (50*(user_map.length+1)) + ";");
            else if(comp == "root")
                group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*(user_map.length+1)) + ";");
            for(var s=2; s <= total_gap; s++){
                var opt = document.createElement("option");
                opt.value = s;
                opt.innerHTML = s;
                opt.setAttribute("class", "myfont3");
                
                if(s == (user_map.length+1))
                    opt.setAttribute("selected", true);
                
                gap_input.appendChild(opt);
            }
            gap.appendChild(gap_title);
            gap.appendChild(gap_input);
            attr_container.appendChild(gap);

            var br1 = document.createElement("br");
            var p1 = document.createElement("p");
            var c1 = document.createElement("span");
            var c2 = document.createElement("span");

            c1.innerHTML = "Color Map";
            c2.innerHTML = "Attribute Data";
            c1.setAttribute("class", "myfont3");
            c2.setAttribute("class", "myfont3");
            c2.setAttribute("style", "margin-left:50px;");
            attr_container.appendChild(c1);
            attr_container.appendChild(c2);
            
            attr_container.appendChild(br1);
            attr_container.appendChild(p1);                    
            
            attr_container.appendChild(range);
            attr_container.appendChild(group_slider);
            attr_container.appendChild(sep);

            var slider_val = [];

            for(var real = 0; real < user_map.length; real++){
                 slider_val.push(parseFloat(user_map[real], 10));
            }
        }
        else{
            if(comp == "leaf_color")
                group_slider.setAttribute("style", "background:rgba(7, 147, 9, 0.6); margin-top:25px; margin-left:5px; height:300;");
            else if(comp == "root")
                group_slider.setAttribute("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:300;");
            
            for(var s=2; s <= total_gap; s++){
                var opt = document.createElement("option");
                opt.value = s;
                opt.innerHTML = s;
                opt.setAttribute("class", "myfont3");
                if(s == 6)
                    opt.setAttribute("selected", true);
                gap_input.appendChild(opt);
            }

            gap.appendChild(gap_title);
            gap.appendChild(gap_input);
            attr_container.appendChild(gap);

            var br1 = document.createElement("br");
            var p1 = document.createElement("p");
            var c1 = document.createElement("span");
            var c2 = document.createElement("span");

            c1.innerHTML = "Color Map";
            c2.innerHTML = "Attribute Data";
            c1.setAttribute("class", "myfont3");
            c2.setAttribute("class", "myfont3");
            c2.setAttribute("style", "margin-left:50px;");
            attr_container.appendChild(c1);
            attr_container.appendChild(c2);
            
            attr_container.appendChild(br1);
            attr_container.appendChild(p1);

            attr_container.appendChild(range);
            attr_container.appendChild(group_slider);
            attr_container.appendChild(sep);
            
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                slider_val.push(Math.round(g*100)/100);
            }
            if(slider_val.length < 5){
                slider_val.push(attr_max);
            }

        }

        $("#layer_slider").slider({
            orientation: "vertical",
            min: attr_min,
            max: attr_max,
            values: slider_val,
            step: 0.1,            
            slide: function( event, ui ) {
                var v = parseInt(ui.handle.id.split("_").pop());
                return self.set_general_slide(v, ui.values, slider_val);
                // var display = "#layer_" + v;
                // var on_handle = "#layer_handle_"+ v;
                // console.log("handle:", $(on_handle).position().top);
                // console.log("handle_value:", $(display).position().top);
            }
        });

        $('#layer_slider .ui-slider-handle').css({'height':'0.5em'});
        $('#layer_slider .ui-slider-handle').css({'margin-bottom':'0.1px'});

        $("#sep_group").empty();
        $("#sep_range").empty();

        self.set_color_handle_id(slider_val, comp, used);
        

        $("#sep_gap").unbind();
        $("#sep_gap").change(function(){
            used = 0;
            var attr_min = parseInt(component_attribute[data_mode][$("#sidekeyselect").val()][1]);
            var attr_max = parseInt(component_attribute[data_mode][$("#sidekeyselect").val()][2]);
            var attr_range = component_attribute[data_mode][$("#sidekeyselect").val()][3];
            var gap = attr_range/($("#sep_gap").val()-1);
            var new_slider_val = [];
        
            for(var g = attr_min; g <= attr_max; g+=gap){
                new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                new_slider_val.push(attr_max);
            }
            
            $("#layer_slider").slider( "destroy" );
            if(comp == "leaf_color")
                $("#layer_slider").attr("style", "background:rgba(7, 147, 9, 0.6); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
        
            else if(comp == "root")
                $("#layer_slider").attr("style", "background:rgba(125, 96, 66, 0.7); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
        
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
        var attr_container = document.getElementById("mark_group_select");
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

        // var br = document.createElement("br");
        // var p = document.createElement("p");
        // attr_container.appendChild(br);
        // attr_container.appendChild(p);

        for(var c = 0; c < total_items.length; c ++){
            var size_val = c;
            if(used == 1)
                size_val = parseInt(user_map[total_items[c]]);
            if(c == 0){
                var br1 = document.createElement("br");
                var p1 = document.createElement("p");
                var c1 = document.createElement("span");
                var c2 = document.createElement("span");
                c1.innerHTML = "Size Scale";
                c2.innerHTML = "Attribute Data";
                c1.setAttribute("class", "myfont3");
                c2.setAttribute("class", "myfont3");
                c2.setAttribute("style", "margin-left: 60px;");
                attr_container.appendChild(c1);
                attr_container.appendChild(c2);
                
                attr_container.appendChild(br1);
                attr_container.appendChild(p1);
            }                    
            var select_container = document.createElement("div");
            var oneitem = document.createElement("img");
            var objslider = document.createElement("div");
            var label_container = document.createElement("span");
            var slider_label = document.createElement("span");
            
            select_container.setAttribute("style", "margin:15 0 20 10; padding-bottom:20px; width:100px; position:relative; height:" + (15 + (10+(parseInt(size_val)*3))) + "px;");
            
            select_container.id = "size_selector_" + c;
            oneitem.id = "oneitem_" + c;
            oneitem.setAttribute("style", "position:absolute; width:"+ (10 + size_val*3) +"%;");

            oneitem.src = img_src;

            objslider.id = "ori_attr_val_" + c;
            objslider.setAttribute("style", "width:100%; position:absolute; bottom:0px;");

            slider_label.id = "slider_label_" + c;
            slider_label.setAttribute("style", "position:absolute; bottom:-20px;");

            label_container.innerHTML = total_items[c];
            label_container.setAttribute("style", "position:absolute; left:125px; bottom:0px;");
            
            select_container.appendChild(oneitem);
            select_container.appendChild(objslider);
            select_container.appendChild(slider_label);
            select_container.appendChild(label_container);
                        
            attr_container.appendChild(select_container);

            var slider_id = "#ori_attr_val_" + c;
            var leaf_img_id = "#oneitem_" + c;
            var handle = "#ori_attr_val_" + c + " .ui-slider-handle";
            var s_label = "#slider_label_" + c;

            $(slider_id).slider({
                orientation: "horizontal",
                min: 0,
                max: 10,
                value: size_val,
                slide: function( event, ui) {
                    var myid = this.id;
                    var oneitem_id = "#oneitem_" + myid.split("attr_val_").pop();
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
            $(slider_id).css({'height':'8px'});

            $(s_label).text(size_val);
            $(s_label).val(size_val);
            $(s_label).css({"left": (size_val*10-5)+"%"});
                            
        }
    },

    size_num_operation: function(one_attr, comp, ori_attr){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_container = document.getElementById("mark_group_select");
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
        
        var sep = document.createElement("div");
        var gap = document.createElement("div");
        var gap_title = document.createElement("span");
        var gap_input = document.createElement("select");
        var group_slider = document.createElement("div");
        var range = document.createElement("div");

        gap_input.id = "sep_gap";
        gap_input.setAttribute("style", "width:100px");

        group_slider.id = "layer_slider";
        gap.setAttribute("style", "margin-top:10px;");

        range.id = "sep_range";
        range.setAttribute("style", "margin:15 0 0 0; position:relative; width:155px;");
        range.setAttribute("class", "left");

        gap_title.innerHTML = "Number of Difference: ";
        gap_title.setAttribute("class", "myfont3");
        sep.id = "sep_group";
        sep.setAttribute("style", "margin:15 0 0 180; position:relative;");
        
        if(comp == "leaf_size")
            group_slider.setAttribute("style", "background:rgba(7, 147, 9, 0.6); margin-top:25px; margin-left:5px; height:" + 50*selected_gap + ";");
        else
            group_slider.setAttribute("style", "background:rgba(187, 7, 12, 0.7); margin-top:25px; margin-left:5px; height:" + 50*selected_gap + ";");
        
        group_slider.setAttribute("class", "left");

        var total_gap = 10;
        if(attr_range < 5)
            total_gap = attr_range*2-1;
        for(var s=2; s <= total_gap; s++){
            var opt = document.createElement("option");
            opt.value = s;
            opt.innerHTML = s;
            opt.setAttribute("class", "myfont3");
            if(s == selected_gap)
                opt.setAttribute("selected", true);
            gap_input.appendChild(opt);
        }

        gap.appendChild(gap_title);
        gap.appendChild(gap_input);
        attr_container.appendChild(gap);

        var br1 = document.createElement("br");
        var p1 = document.createElement("p");
        var c1 = document.createElement("span");
        var c2 = document.createElement("span");

        c1.innerHTML = "Size Scale";
        c2.innerHTML = "Attribute Data";
        c1.setAttribute("class", "myfont3");
        c2.setAttribute("class", "myfont3");
        c2.setAttribute("style", "margin-left:90px;");
        attr_container.appendChild(c1);
        attr_container.appendChild(c2);
        
        attr_container.appendChild(br1);
        attr_container.appendChild(p1);

        attr_container.appendChild(range);
        attr_container.appendChild(group_slider);                    
        attr_container.appendChild(sep);

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

        $("#layer_slider").slider({
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

        $("#sep_group").empty();
        $("#sep_range").empty();       
        
        self.set_size_handle_id(slider_val, comp, used, size_map, val_map);

        $("#sep_gap").unbind();
        $("#sep_gap").change(function(){
            var used = 0;
            var size_map = [];
            var val_map = [];
            var attr_min = parseInt(component_attribute[data_mode][one_attr][1]);
            var attr_max = parseInt(component_attribute[data_mode][one_attr][2]);
            var attr_range = component_attribute[data_mode][one_attr][3];
            var mapping_gap = attr_range/($("#sep_gap").val()-1);
            var new_slider_val = [];
        
            for(var g = attr_min; g <= attr_max; g+=mapping_gap){
                new_slider_val.push(Math.round(g*100)/100);
            }

            if(new_slider_val.length < $("#sep_gap").val()-1){
                new_slider_val.push(attr_max);
            }
            
            $("#layer_slider").slider( "destroy" );
            if(comp == "leaf_size")
                $("#layer_slider").attr("style", "background:rgba(7, 147, 9, 0.6); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
            else
                $("#layer_slider").attr("style", "background:rgba(187, 7, 12, 0.7); margin-top:25px; margin-left:5px; height:" + (50*$("#sep_gap").val()) + ";");
            
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
            
            $("#sep_group").empty();
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
        var submit_id = "#sidekey_submit_" + comp;
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
            var request_url = "update_layer/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            // ok to use
            d3.json(request_url, function(result){
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");
                    $("#block_layer").hide();
                    $(submit_id).text("Done");
                    $(submit_id).removeAttr("disabled");

                    attr_map[comp] = new_attr;
                    
                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                };
                set_update_info(result);
            });
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

            var request_url = "update_layer/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            // console.log(request_url);
            d3.json(request_url, function(result){
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");
                    $("#block_layer").hide();
                    $(submit_id).text("Done");
                    $(submit_id).removeAttr("disabled");

                    attr_map[comp] = new_attr;
                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                };
                set_update_info(result);
            });

        }
    },

    size_submit: function(ori_attr, new_attr, comp){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        var ego_selections = self.model.get("selected_egos");

        var submit_id = "#sidekey_submit_" + comp;

        if(comp in attribute_mapping){
            delete attribute_mapping[comp];
        }

        attr_map[comp] = new_attr;

        if(new_attr == "none"){
            var update_info = data_mode + ":-ctree_" + comp + ":-" + new_attr + ":-" + JSON.stringify(["none"]);

            for(ego in ego_selections){
                update_info += ":=" + ego;
            }
            var request_url = "update_layer/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            
            d3.json(request_url, function(result){
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");
                    
                    $("#block_layer").hide();
                    $(submit_id).text("Done");
                    $(submit_id).removeAttr("disabled");

                    attr_map[comp] = new_attr;
                    
                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                    
                };
                set_update_info(result);
            });
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

            var request_url = "update_layer/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            // console.log(request_url);
            d3.json(request_url, function(result){
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");
                    $("#block_layer").hide();
                    $(submit_id).text("Done");
                    $(submit_id).removeAttr("disabled");

                    attr_map[comp] = new_attr;
                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                };
                set_update_info(result);
            });

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
        var submit_id = "#sidekey_submit_" + comp;

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
            
            var request_url = "update_binary/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            // console.log(request_url);
            d3.json(request_url, function(result){
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");                    
                    $("#block_layer").hide();
                    $(submit_id).text("Done");
                    $(submit_id).removeAttr("disabled");

                    attr_map[comp] = new_attr;

                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                };
                set_update_info(result);
            });
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
            // $(display).val(Math.round((0-(all_value[v+1]-0.5))*100)/100);
            // $(display).css({"top": $(on_handle).position().top});
            return false;
        }
        if(v > 0 && all_value[v] < Math.round((all_value[v-1]+0.5)*100)/100){
            $("#layer_slider").slider('values', v, Math.round((all_value[v-1]+0.5)*100)/100); 
            // $(display).val(Math.round((0-(all_value[v-1]+0.5))*100)/100);
            // $(display).css({"top": $(on_handle).position().top});
            // $(label).css({"top": $(on_handle).position().top});
            return false;
        }
        $(display).css({"top": $(on_handle).position().top});
        // $(label).css({"top": $(on_handle).position().top});
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
        var sep_container = document.getElementById("sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');
        var range_container = document.getElementById("sep_range");
        
        for(var v = slider_val.length-1; v >= 0; v--){
            handle.eq(v).attr('id', "layer_handle_" + v);

            if(v == 0){
                var sep_layer_title = document.createElement("span");
                sep_layer_title.setAttribute("class", "layer_label");
                // sep_layer_title.setAttribute("style", "top:" + ($("#layer_slider").height()+handle.eq(v).position().top)/2 + "; position:absolute;");
                sep_layer_title.setAttribute("style", "top:" + ($("#layer_slider").height()-3) + ";");
                sep_layer_title.innerHTML = "Layer " + (v+1);
                sep_layer_title.id = "title_" + v;
                range_container.appendChild(sep_layer_title);
            }   
            else{
                var sep_layer_title = document.createElement("span");
                sep_layer_title.setAttribute("class", "layer_label");
                sep_layer_title.setAttribute("style", "top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + ";");
                sep_layer_title.innerHTML = "Layer " + (v+1);
                sep_layer_title.id = "title_" + v;
                range_container.appendChild(sep_layer_title);
                if(v == slider_val.length-1){
                    var sep_layer_title = document.createElement("span");
                    sep_layer_title.setAttribute("class", "layer_label");
                    sep_layer_title.setAttribute("style", "top:-15;");
                    sep_layer_title.innerHTML = "Layer " + (v+2);
                    sep_layer_title.id = "title_" + v;
                    range_container.appendChild(sep_layer_title);
                }
            }
            var sep_layer_input = document.createElement("input");
            sep_layer_input.setAttribute("class", "layer_order");
            sep_layer_input.setAttribute("style", "top:" + (handle.eq(v).position().top) + "; width:100px; position:absolute; background:none; border:0;");
            sep_layer_input.setAttribute("readonly", "readonly");
            if(my_revert == "a")
                sep_layer_input.value = 0-slider_val[v];
            else
                sep_layer_input.value = slider_val[v];
            sep_layer_input.id = "layer_" + v;

            sep_container.appendChild(sep_layer_input);
        }
    },

    set_color_handle_id_old: function(slider_val, comp, used){
        var self = this;
        var sep_container = document.getElementById("sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');
        var range_container = document.getElementById("sep_range");

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

            if(v == 0){
                var color_container = document.createElement("select");
                color_container.value = v;
                color_container.setAttribute("class", "mapping_selection");
                color_container.id = "title_" + v;

                for(var l_color = 0; l_color < color_table.length; l_color++){
                    var selection_opt = document.createElement('option');
                    selection_opt.value = l_color;
                    // selection_opt.innerHTML = color_table[l_color];
                    selection_opt.setAttribute("class", "myfont3");
                    selection_opt.setAttribute("style", "background-color:" + color_table[l_color] + ";");

                    if(used == 1){
                        if(color_table[l_color] == render_table[v]){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + mapping_color.roots_color[l_color] + ";");
                        }
                    }
                    else{
                        if(l_color == v){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + color_table[l_color] + ";");
                        }
                            
                        else if(color_table.length < v && l_color == color_table.length-1){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + ($("#layer_slider").height()-3) + "; background-color:" + color_table[color_table.length-1] + ";");
                        }
                    }  
                        
                    color_container.appendChild(selection_opt);
                    
                }
                range_container.appendChild(color_container);
                if(slider_val.length == 1){
                    var color_container = document.createElement("select");
                    color_container.value = v;
                    color_container.setAttribute("class", "mapping_selection");
                    color_container.id = "title_" + (v+1);
                    for(var l_color = 0; l_color < color_table.length; l_color++){
                        var selection_opt = document.createElement('option');
                        selection_opt.value = l_color;
                        // selection_opt.innerHTML = color_table[l_color];
                        selection_opt.setAttribute("class", "myfont3");
                        selection_opt.setAttribute("style", "background-color:" + color_table[l_color] + ";");
                        if(used == 1){
                            if(color_table[l_color] == render_table[(v+1)]){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + mapping_color.roots_color[l_color] + ";");
                            }
                        }
                        else{
                            if(l_color == (v+1)){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + color_table[l_color] + ";");
                            }
                                
                            else if(color_table.length < v && l_color == color_table.length-1){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + color_table[color_table.length-1] + ";");
                            }
                        }                        
                            
                        color_container.appendChild(selection_opt);
                        
                    }
                    
                    range_container.appendChild(color_container);
                }
            }   
            else{
                var color_container = document.createElement("select");
                color_container.value = v;
                color_container.setAttribute("class", "mapping_selection");
                color_container.id = "title_" + v;

                for(var l_color = 0; l_color < color_table.length; l_color++){
                    var selection_opt = document.createElement('option');
                    selection_opt.value = l_color;
                    // selection_opt.innerHTML = color_table[l_color];
                    selection_opt.setAttribute("class", "myfont3");
                    selection_opt.setAttribute("style", "background-color:" + color_table[l_color] + ";");
                    
                    if(used == 1){
                        if(color_table[l_color] == render_table[v]){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + mapping_color.roots_color[l_color] + ";");
                        }
                    }
                    else{
                        if(l_color == v){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + color_table[l_color] + ";");
                        }
                            
                        else if(color_table.length < v && l_color == color_table.length-1){
                            selection_opt.setAttribute("selected", true);
                            color_container.setAttribute("style", "width:100px; position:absolute; top:" + (handle.eq(v-1).position().top+handle.eq(v).position().top)/2 + "; background-color:" + color_table[color_table.length-1] + ";");
                        }
                    } 
                        
                    color_container.appendChild(selection_opt);
                    
                }

                range_container.appendChild(color_container);

                if(v == slider_val.length-1){
                    var color_container = document.createElement("select");
                    color_container.value = v;
                    color_container.setAttribute("class", "mapping_selection");
                    color_container.id = "title_" + (v+1);
                    for(var l_color = 0; l_color < color_table.length; l_color++){
                        var selection_opt = document.createElement('option');
                        selection_opt.value = l_color;
                        // selection_opt.innerHTML = color_table[l_color];
                        selection_opt.setAttribute("class", "myfont3");
                        selection_opt.setAttribute("style", "background-color:" + color_table[l_color] + ";");

                        if(used == 1){
                            if(color_table[l_color] == render_table[(v+1)]){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + mapping_color.roots_color[l_color] + ";");
                            }
                        }
                        else{
                            if(l_color == (v+1)){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + color_table[l_color] + ";");
                            }
                                
                            else if(color_table.length < v && l_color == color_table.length-1){
                                selection_opt.setAttribute("selected", true);
                                color_container.setAttribute("style", "width:100px; position:absolute; top:-15; background-color:" + color_table[color_table.length-1] + ";");
                            }
                        }                         
                            
                        color_container.appendChild(selection_opt);
                        
                    }
                    
                    range_container.appendChild(color_container);
                }
            }                 
            var sep_layer_input = document.createElement("input");

            sep_layer_input.setAttribute("class", "layer_order");
            sep_layer_input.setAttribute("style", "top:" + (handle.eq(v).position().top) + "; width:100px; position:absolute; background:none; border:0;");
            sep_layer_input.setAttribute("readonly", "readonly");
            sep_layer_input.value = slider_val[v];
            sep_layer_input.id = "layer_" + v;

            sep_container.appendChild(sep_layer_input);
            
        }

        $(".mapping_selection").unbind();
        $(".mapping_selection").change(function(){
            this.style.background = color_table[this.value];
        });
    },

    set_color_handle_id: function(slider_val, comp, used){
        var self = this;
        var sep_container = document.getElementById("sep_group");
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
            var sep_layer_input = document.createElement("input");

            sep_layer_input.setAttribute("class", "layer_order");
            sep_layer_input.setAttribute("style", "top:" + (handle.eq(v).position().top) + "; width:100px; position:absolute; background:none; border:0;");
            sep_layer_input.setAttribute("readonly", "readonly");
            sep_layer_input.value = slider_val[v];
            sep_layer_input.id = "layer_" + v;

            sep_container.appendChild(sep_layer_input);
            
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
        
        var sep_container = document.getElementById("sep_group");
        var handle = $('#layer_slider A.ui-slider-handle');   
        var range_container = document.getElementById("sep_range");

        var size_val = 0;
        for(var v = slider_val.length-1; v >= 0; v--){
            handle.eq(v).attr('id', "layer_handle_" + v); 
            if(v == 0){
                size_val = v;
                if(used == 1)
                    size_val = parseInt(size_map[v]);

                var select_container = document.createElement("div");
                var oneitem = document.createElement("img");
                var objslider = document.createElement("div");
                var slider_label = document.createElement("span");
                select_container.setAttribute("style", "width:140px; position:relative; height:35px;");
                
                select_container.id = "title_" + v;
                oneitem.id = "oneitem_" + v;
                oneitem.setAttribute("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;");
                oneitem.src = img_src;

                objslider.id = "ori_attr_val_" + v;
                objslider.setAttribute("style", "position:absolute; left:40px; width:100px; top:10px;");

                slider_label.id = "slider_label_" + v;
                slider_label.setAttribute("style", "position:absolute; bottom:0px;");

                select_container.appendChild(oneitem);
                select_container.appendChild(objslider);
                select_container.appendChild(slider_label);
                        
                range_container.appendChild(select_container);

                var slider_id = "#ori_attr_val_" + v;
                var leaf_img_id = "#oneitem_" + v;
                var size_handle = "#ori_attr_val_" + v + " .ui-slider-handle";
                var s_label = "#slider_label_" + v;
                var s_container = "#title_" + v;
                $(slider_id).slider({
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

                $(s_container).css({"position": "absolute"});
                $(s_container).css({"top": $("#layer_slider").height()-5});
                
                $(slider_id).css({'top':'8px'});
                $(size_handle).css({'width':'0.7em'});
                $(size_handle).css({'height':'1em'});
                $(slider_id).css({'height':'8px'});
                $(s_label).text(size_val);
                $(s_label).val(size_val);
                $(s_label).css({"left": 35+100*(0.1*size_val)});

                if(slider_val.length == 1){
                    size_val = (v+1);
                    if(used == 1)
                        size_val = parseInt(size_map[(v+1)]);
                    var select_container = document.createElement("div");
                    var oneitem = document.createElement("img");
                    var objslider = document.createElement("div");
                    var slider_label = document.createElement("span");
                    // select_container.setAttribute("style", "margin-bottom:20px; padding-bottom:20px; margin-top:15px; width:100px; position:relative; height:" + (20 + (10*(c+1)*0.5)) + "px;");
                    select_container.setAttribute("style", "width:140px; position:relative; height:35px;");
                    
                    select_container.id = "title_" + (v+1);
                    oneitem.id = "oneitem_" + (v+1);
                    oneitem.setAttribute("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;");
                    oneitem.src = img_src;

                    objslider.id = "ori_attr_val_" + (v+1);
                    objslider.setAttribute("style", "position:absolute; left:40px; width:100px; top:10px;");

                    slider_label.id = "slider_label_" + (v+1);
                    slider_label.setAttribute("style", "position:absolute; bottom:0px;");

                    select_container.appendChild(oneitem);
                    select_container.appendChild(objslider);
                    select_container.appendChild(slider_label);
                            
                    range_container.appendChild(select_container);

                    var slider_id = "#ori_attr_val_" + (v+1);
                    var leaf_img_id = "#oneitem_" + (v+1);
                    var size_handle = "#ori_attr_val_" + (v+1) + " .ui-slider-handle";
                    var s_label = "#slider_label_" + (v+1);
                    var s_container = "#title_" + (v+1);
                    $(slider_id).slider({
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

                    $(s_container).css({"position": "absolute"});
                    $(s_container).css({"top": -15});
                    
                    $(slider_id).css({'top':'8px'});
                    $(size_handle).css({'width':'0.7em'});
                    $(size_handle).css({'height':'1em'});
                    $(slider_id).css({'height':'8px'});
                   
                    $(s_label).text(size_val);
                    $(s_label).val(size_val);
                    $(s_label).css({"left": 35+100*0.1*size_val});

                }

            }   
            else{
                size_val = v;
                if(used == 1)
                    size_val = parseInt(size_map[v]);
                var select_container = document.createElement("div");
                var oneitem = document.createElement("img");
                var objslider = document.createElement("div");
                var slider_label = document.createElement("span");
                select_container.setAttribute("style", "width:140px; position:relative; height:35px;");
                
                select_container.id = "title_" + v;
                oneitem.id = "oneitem_" + v;
                oneitem.setAttribute("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;");
                oneitem.src = img_src;

                objslider.id = "ori_attr_val_" + v;
                objslider.setAttribute("style", "position:absolute; left:40px; width:100px; top:10px;");

                slider_label.id = "slider_label_" + v;
                slider_label.setAttribute("style", "position:absolute; bottom:0px;");

                select_container.appendChild(oneitem);
                select_container.appendChild(objslider);
                select_container.appendChild(slider_label);
                        
                range_container.appendChild(select_container);

                var slider_id = "#ori_attr_val_" + v;
                var leaf_img_id = "#oneitem_" + v;
                var size_handle = "#ori_attr_val_" + v + " .ui-slider-handle";
                var s_label = "#slider_label_" + v;
                var s_container = "#title_" + v;
                $(slider_id).slider({
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

                $(s_container).css({"position": "absolute"});
                $(s_container).css({"top": (handle.eq(v-1).position().top+handle.eq(v).position().top)/2});
                
                $(slider_id).css({'top':'8px'});
                $(size_handle).css({'width':'0.7em'});
                $(size_handle).css({'height':'1em'});
                $(slider_id).css({'height':'8px'});
                
                $(s_label).text(size_val);
                $(s_label).val(size_val);
                $(s_label).css({"left": 35+100*(0.1*size_val)});

                if(v == slider_val.length-1){
                    size_val = (v+1);
                    if(used == 1)
                        size_val = parseInt(size_map[(v+1)]);
                    var select_container = document.createElement("div");
                    var oneitem = document.createElement("img");
                    var objslider = document.createElement("div");
                    var slider_label = document.createElement("span");
                    // select_container.setAttribute("style", "margin-bottom:20px; padding-bottom:20px; margin-top:15px; width:100px; position:relative; height:" + (20 + (10*(c+1)*0.5)) + "px;");
                    select_container.setAttribute("style", "width:140px; position:relative; height:35px;");
                    
                    select_container.id = "title_" + (v+1);
                    oneitem.id = "oneitem_" + (v+1);
                    oneitem.setAttribute("style", "position:absolute; width:"+ (5+30*(size_val*0.1)) +"%;");
                    oneitem.src = img_src;

                    objslider.id = "ori_attr_val_" + (v+1);
                    objslider.setAttribute("style", "position:absolute; left:40px; width:100px; top:10px;");

                    slider_label.id = "slider_label_" + (v+1);
                    slider_label.setAttribute("style", "position:absolute; bottom:0px;");

                    select_container.appendChild(oneitem);
                    select_container.appendChild(objslider);
                    select_container.appendChild(slider_label);
                            
                    range_container.appendChild(select_container);

                    var slider_id = "#ori_attr_val_" + (v+1);
                    var leaf_img_id = "#oneitem_" + (v+1);
                    var size_handle = "#ori_attr_val_" + (v+1) + " .ui-slider-handle";
                    var s_label = "#slider_label_" + (v+1);
                    var s_container = "#title_" + (v+1);
                    $(slider_id).slider({
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

                    $(s_container).css({"position": "absolute"});
                    $(s_container).css({"top": -15});
                    
                    $(slider_id).css({'top':'8px'});
                    $(size_handle).css({'width':'0.7em'});
                    $(size_handle).css({'height':'1em'});
                    $(slider_id).css({'height':'8px'});
                   
                    $(s_label).text(size_val);
                    $(s_label).val(size_val);
                    $(s_label).css({"left": 35+100*0.1*size_val});
                    
                }
            }                 
            var sep_layer_input = document.createElement("input");

            sep_layer_input.setAttribute("class", "layer_order");
            sep_layer_input.setAttribute("style", "top:" + (handle.eq(v).position().top) + "; width:100px; position:absolute; background:none; border:0;");
            sep_layer_input.setAttribute("readonly", "readonly");
            sep_layer_input.value = slider_val[v];
            sep_layer_input.id = "layer_" + v;

            sep_container.appendChild(sep_layer_input);
            
        }
    },

    trunk_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in trunk mapping");
        $('#mapping_img').attr('src', 'media/img/trunk_mapping.png');

        $("#sidekey_selection").show();
        $("#sidekey_title").text("Trunk Mapping:");
        
        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
       
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

            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["trunk"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        // set user's map
        if(attr_map["trunk"] != "none"){
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            $("#mark_group").html("<b>NOTE: Blue</b> as left trunk | <b>Red</b> as right trunk");
            $("#mark_group").show();

            if(component_attribute[data_mode][attr_map["trunk"]][5] == "categorical" || component_attribute[data_mode][attr_map["trunk"]][5] == "boolean"){
                self.binary_cat_operation(attr_map["trunk"], "trunk", attr_map["trunk"]);
            }
            else{
                self.binary_num_operation(attr_map["trunk"], "trunk", attr_map["trunk"]);
            }

            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            $("#sidekey_submit_trunk").show();
            $("#sidekey_submit_trunk").text("Done");
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");
                $("#sidekey_operation").show();
                // $("#mark_group").text("✔ as Left Side of Trunk: 【NOTE】");
                $("#mark_group").html("<b>NOTE: Blue</b> as left trunk | <b>Red</b> as right trunk");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.binary_cat_operation($("#sidekeyselect").val(), "trunk", attr_map["trunk"]);
                }
                else{
                    self.binary_num_operation($("#sidekeyselect").val(), "trunk", attr_map["trunk"]);
                }
                
            }

            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_trunk").show();
            $("#sidekey_submit_trunk").text("Done");
        });
    
        $("#sidekey_submit_trunk").unbind();
        $("#sidekey_submit_trunk").click(function(){
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");

            $("#sidekey_submit_trunk").text("Update");
            $("#sidekey_submit_trunk").attr("disabled", true);
            $("#block_layer").show();

            self.binary_submit(attr_map["trunk"], $("#sidekeyselect").val(), "trunk");                   

        });

    },

    bside_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in bside mapping");
        $('#mapping_img').attr('src', 'media/img/bside_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Branch Side Mapping:");
    
        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        // container.setAttribute("class", "sidekey_selection");
        for(s in component_attribute[data_mode]){
            if(s == "none"){
                continue;
            }
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["bside"]))
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["bside"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        if(attr_map["bside"] != "none"){
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            // $("#mark_group").text("✔ as Left Side of bside: 【NOTE】");
            $("#mark_group").html("<b>NOTE: Blue</b> as upper side | <b>Red</b> as lower side");
            $("#mark_group").show();
            if(component_attribute[data_mode][attr_map["bside"]][5] == "categorical" || component_attribute[data_mode][attr_map["bside"]][5] == "boolean"){
                self.binary_cat_operation(attr_map["bside"], "bside", attr_map["bside"]);
            }
            else{
                self.binary_num_operation(attr_map["bside"], "bside", attr_map["bside"]);
            }                

            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            $("#sidekey_submit_bside").show();
            $("#sidekey_submit_bside").text("Done");
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");
                $("#sidekey_operation").show();
                var attr_container = document.getElementById("mark_group_select");
                $("#mark_group").html("<b>NOTE: Blue</b> as upper side | <b>Red</b> as lower side");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.binary_cat_operation($("#sidekeyselect").val(), "bside", attr_map["bside"]);
                }
                else{
                    self.binary_num_operation($("#sidekeyselect").val(), "bside", attr_map["bside"]);
                }
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_bside").show();
            $("#sidekey_submit_bside").text("Done");
        });

        $("#sidekey_submit_bside").unbind();
        $("#sidekey_submit_bside").click(function(){
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");

            $("#sidekey_submit_bside").text("Update");
            $("#sidekey_submit_bside").attr("disabled", true);
            $("#block_layer").show();

            self.binary_submit(attr_map["bside"], $("#sidekeyselect").val(), "bside");

        });
    },

    branch_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in branch mapping");
        $('#mapping_img').attr('src', 'media/img/branch_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Branch Layer Mapping:");
        $("#sidekey_description").text("The branch mapping will place alter into different layer, so the attribute is better to be related with alter or we will random place the same alter into duplication sticks. This determines the height of the tree and it will be menful if this attribute is in a order.");

        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");

        for(s in component_attribute[data_mode]){
            if(s == "none"){
                continue;
            }
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["branch"]))
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["branch"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }
        $("#mark_group_select").empty();

        if(attr_map["branch"] != "none"){
            $("#sidekey_operation").show();
            // var attr_container = document.getElementById("mark_group_select");
            $("#mark_group").html("<b>NOTE: Order</b> the attributes as the branch order</b>");
            $("#mark_group").show();
            if(component_attribute[data_mode][attr_map["branch"]][5] == "categorical" || component_attribute[data_mode][attr_map["branch"]][5] == "boolean"){
                self.layer_cat_operation(attr_map["branch"], "branch", attr_map["branch"]);
            }
            else{
                self.layer_num_operation(attr_map["branch"], "branch", attr_map["branch"]);
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_branch").show();
            $("#sidekey_submit_branch").text("Done");
            
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            $("#mark_group_select").empty();
            var revert = "d";
            if( $("#sidekeyselect").val() != "none"){
                var data_mode = self.model.get("view_mode");
                var attr_map = self.model.get("attribute");                
                $("#sidekey_operation").show();
                // var attr_container = document.getElementById("mark_group_select");
                $("#mark_group").html("<b>NOTE: Order</b> the attributes as the branch order</b>");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.layer_cat_operation($("#sidekeyselect").val(), "branch", attr_map["branch"]);
                }
                else{
                    self.layer_num_operation($("#sidekeyselect").val(), "branch", attr_map["branch"]);
                }
                
            }           

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_branch").show();
            $("#sidekey_submit_branch").text("Done");
            
        });

        $("#sidekey_submit_branch").unbind();
        $("#sidekey_submit_branch").click(function(){
            var data_mode = self.model.get("view_mode");
            var ego_selections = self.model.get("selected_egos");
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");
            $("#sidekey_submit_branch").text("Update");
            $("#sidekey_submit_branch").attr("disabled", true);
            $("#block_layer").show();

            if("branch" in attribute_mapping){
                delete attribute_mapping["branch"];
            }
            attr_map["branch"] = $("#sidekeyselect").val();

            if($("#sidekeyselect").val() == "none"){}
            
            else{
                var update_info = data_mode + ":-ctree_branch:-" + $("#sidekeyselect").val();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    var layer_map = {};
                    attribute_mapping["branch"] = {};
                    count_layer = component_attribute[data_mode][$("#sidekeyselect").val()][0].length-1;
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

                var request_url = "update_layer/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
                d3.json(request_url, function(result){
                    var set_update_info = function(data){
                        var attr_map = self.model.get("attribute");
                        $("#block_layer").hide();
                        $("#sidekey_submit_branch").text("Done");
                        $("#sidekey_submit_branch").removeAttr("disabled");
                        
                        attr_map["branch"] = $("#sidekeyselect").val();
                        
                        self.model.set({"attribute": attr_map});
                        
                        self.restructure(data);
                    };
                    set_update_info(result);
                });
            }

        });
    },

    root_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in root mapping");
        $('#mapping_img').attr('src', 'media/img/root_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Root Mapping:");
        
        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0)
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["root"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        // set user mapping
        if(attr_map["root"] != "none"){
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            $("#mark_group").html("<b>NOTE: Color</b> as different categories");
            $("#mark_group").show();
            var attr_container = document.getElementById("mark_group_select");
            var user_map = attribute_mapping[attr_map["root"]];
            if(component_attribute[data_mode][attr_map["root"]][5] == "categorical" || component_attribute[data_mode][attr_map["root"]][5] == "boolean"){
                self.color_cat_operation(attr_map["root"], "root", attr_map["root"]);
            }
            else{
                self.color_num_operation(attr_map["root"], "root", attr_map["root"]);
            }
            
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();

            $("#sidekey_submit_root").show();
            $("#sidekey_submit_root").text("Done");
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            var attr_map = self.model.get("attribute");
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE: Color</b> as different categories");
                $("#mark_group").show();
                var attr_container = document.getElementById("mark_group_select");
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.color_cat_operation($("#sidekeyselect").val(), "root", attr_map["root"]);
                }
                else{
                    self.color_num_operation($("#sidekeyselect").val(), "root", attr_map["root"]);
                }
                
            }
            else{
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE:</b> Map <b>nothing</b> to root");
                $("#mark_group").show();
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();

            $("#sidekey_submit_root").show();
            $("#sidekey_submit_root").text("Done");
            
        });

    
        $("#sidekey_submit_root").unbind();
        $("#sidekey_submit_root").click(function(){
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");
            $("#sidekey_submit_root").text("Update");
            $("#sidekey_submit_root").attr("disabled", true);
            
            $("#block_layer").show();

            self.color_submit(attr_map["root"], $("#sidekeyselect").val(), "root");

        });
    },    

    leaf_color_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in leaf_color mapping");
        $('#mapping_img').attr('src', 'media/img/leaf_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Color Mapping:");
        $("#sidekey_description").text("The leaf color mapping will show the different category of each contact as a leaf color, so the attribute is better to be related with the unique information. You also can choose the group for the color.");

        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        // container.setAttribute("class", "sidekey_selection");
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["leaf_color"]))
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["leaf_color"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        if(attr_map["leaf_color"] != "none"){
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            $("#mark_group").html("<b>NOTE: Color</b> as different categories");
            $("#mark_group").show();

            if(component_attribute[data_mode][attr_map["leaf_color"]][5] == "categorical" || component_attribute[data_mode][attr_map["leaf_color"]][5] == "boolean"){
                self.color_cat_operation(attr_map["leaf_color"], "leaf_color", attr_map["leaf_color"]);
            }
            else{
                self.color_num_operation(attr_map["leaf_color"], "leaf_color", attr_map["leaf_color"]);
            }
                        
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();

            $("#sidekey_submit_leaf_color").show();
            $("#sidekey_submit_leaf_color").text("Done");
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE: Color</b> as different categories");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.color_cat_operation($("#sidekeyselect").val(), "leaf_color", attr_map["leaf_color"]);
                }
                else{
                    self.color_num_operation($("#sidekeyselect").val(), "leaf_color", attr_map["leaf_color"]);
                }
            }
            else{
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE:</b> Map <b>nothing</b> to leaf color");
                $("#mark_group").show();
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();

            $("#sidekey_submit_leaf_color").show();
            $("#sidekey_submit_leaf_color").text("Done");
            
        });
        
        $("#sidekey_submit_leaf_color").unbind();
        $("#sidekey_submit_leaf_color").click(function(){
            $("#sidekey_submit_leaf_color").text("Update");
            $("#sidekey_submit_leaf_color").attr("disabled", true);
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");
            $("#block_layer").show();

            self.color_submit(attr_map["leaf_color"], $("#sidekeyselect").val(), "leaf_color");

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
        $('#mapping_img').attr('src', 'media/img/leaf_highlight_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Highlight Mapping:");
        
        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        for(s in component_attribute[data_mode]){
            // if(s == "none"){}
            // else{
            //     if(s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["highlight"]) 
            //         continue;
            // }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none" && component_attribute[data_mode][s][4] == 1)
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["highlight"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE: Highlight \"" + $("#sidekeyselect").val() + "\"</b> information on leaf<br><b>");
                $("#mark_group").show();         
            }
            else{
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE:</b> Map <b>nothing</b> to leaf highlight");
                $("#mark_group").show();
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_fruit_size").hide();

            $("#sidekey_submit_leaf_highlight").show();
            $("#sidekey_submit_leaf_highlight").text("Done");
        });

        $("#sidekey_submit_leaf_highlight").unbind();
        $("#sidekey_submit_leaf_highlight").click(function(){
            var attr_map = self.model.get("attribute");
            var attr_opt = self.model.get("attr_option");
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");

            var update_info = data_mode + ":-ctree_highlight:-" + $("#sidekeyselect").val();
            for(ego in ego_selections){
                update_info += ":=" + ego;
            }
            attr_map["highlight"] = $("#sidekeyselect").val();
            var request_url = "update_highlight/?update=" + self.model.get("dataset_group") + ":-" + JSON.stringify(attr_map) + ":-" + update_info;
            // console.log(request_url);
            d3.json(request_url, function(result){
                // console.log("finish update");
                var set_update_info = function(data){
                    var attr_map = self.model.get("attribute");
                    // console.log(data)
                    $("#block_layer").hide();
                    $("#sidekey_submit_leaf_highlight").text("Done");
                    $("#sidekey_submit_leaf_highlight").removeAttr("disabled");

                    self.model.set({"attribute": attr_map});
                    
                    self.restructure(data);
                    // self.model.trigger('change:attribute');
                };
                set_update_info(result);
            });
        });
    },

    leaf_size_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in leaf_size mapping");
        $('#mapping_img').attr('src', 'media/img/leaf_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Leaf Size Mapping:");
        $("#sidekey_description").text("The leaf size mapping will show the quantity of each contact as a leaf size, so the attribute is better to be related with the unique information. You also can choose the scale of the different between the size.");

        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        // container.setAttribute("class", "sidekey_selection");
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                 if(component_attribute[data_mode][s][0].length == 0 || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["leaf_size"]))
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(component_attribute[data_mode][s][4] == "1" && s != "none")
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["leaf_size"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        if(attr_map["leaf_size"] != "none"){
            var user_map = attribute_mapping[attr_map["leaf_size"]];
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            $("#mark_group").html("<b>NOTE: Leaf size scale</b> of the attributes mapping");
            $("#mark_group").show();
            // var attr_container = document.getElementById("mark_group_select");
            if(component_attribute[data_mode][attr_map["leaf_size"]][5] == "categorical" || component_attribute[data_mode][attr_map["leaf_size"]][5] == "boolean"){
                self.size_cat_operation(attr_map["leaf_size"], "leaf_size", attr_map["leaf_size"]);
            }
            else{
                self.size_num_operation(attr_map["leaf_size"], "leaf_size", attr_map["leaf_size"]);
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_leaf_size").show();
            $("#sidekey_submit_leaf_size").text("Done");
        }


        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            var attr_map = self.model.get("attribute");
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){   
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE: Leaf size scale</b> of the attributes mapping");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.size_cat_operation($("#sidekeyselect").val(), "leaf_size", attr_map["leaf_size"]);
                }
                else{
                    self.size_num_operation($("#sidekeyselect").val(), "leaf_size", attr_map["leaf_size"]);
                }
            }
            else{
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE:</b> Map <b>nothing</b> to leaf size");
                $("#mark_group").show();
            }
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();
            $("#sidekey_submit_fruit_size").hide();
            
            $("#sidekey_submit_leaf_size").show();
            $("#sidekey_submit_leaf_size").text("Done");
            
        });

        $("#sidekey_submit_leaf_size").unbind();
        $("#sidekey_submit_leaf_size").click(function(){
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");
            $("#sidekey_submit_leaf_size").text("Update");
            $("#sidekey_submit_leaf_size").attr("disabled", true);
            $("#block_layer").show();

            self.size_submit(attr_map["leaf_size"], $("#sidekeyselect").val(), "leaf_size");

        });
    },

    fruit_size_map: function(){
        var self = this;
        var data_mode = self.model.get("view_mode");
        var attr_map = self.model.get("attribute");
        var attr_opt = self.model.get("attr_option");
        console.log("in fruit_size mapping");
        $('#mapping_img').attr('src', 'media/img/fruit_size_mapping.png');
        $("#sidekey_selection").show();
        $("#sidekey_title").text("Fruit Size Mapping:");
        
        $("#sidekeyselect").empty();
        var container = document.getElementById("sidekeyselect");
        
        for(s in component_attribute[data_mode]){
            if(s == "none"){}
            else{
                if(component_attribute[data_mode][s][0].length == 0 || component_attribute[data_mode][s][4] != "1" || (s != attr_map["root"] && attr_opt.indexOf(s) != -1 && s != attr_map["fruit_size"]))
                    continue;
            }
            var selection_opt = document.createElement('option');
            selection_opt.value = s;
            if(s != "none")
                selection_opt.innerHTML = s + "*";
            else{
                if(s == "dataset")
                    selection_opt.innerHTML = "waves";
                else
                    selection_opt.innerHTML = s;
            }
            selection_opt.setAttribute("class", "myfont3");
            if(s == attr_map["fruit_size"])
                selection_opt.setAttribute("selected", true);
            container.appendChild(selection_opt);
        }

        if(attr_map["fruit_size"] != "none"){
            $("#mark_group_select").empty();
            $("#sidekey_operation").show();
            $("#mark_group").html("<b>NOTE: Fruit size scale</b> of the attributes mapping");
            $("#mark_group").show();
            // var attr_container = document.getElementById("mark_group_select");
            var user_map = attribute_mapping[attr_map["fruit_size"]];
            if(component_attribute[data_mode][attr_map["fruit_size"]][5] == "categorical" || component_attribute[data_mode][attr_map["fruit_size"]][5] == "boolean"){
                self.size_cat_operation(attr_map["fruit_size"], "fruit_size", attr_map["fruit_size"]);                
            }
            else{
                self.size_num_operation(attr_map["fruit_size"], "fruit_size", attr_map["fruit_size"]);
            }
            
            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();

            $("#sidekey_submit_fruit_size").show();
            $("#sidekey_submit_fruit_size").text("Done");
        }

        $("#sidekeyselect").unbind();
        $("#sidekeyselect").change(function(){
            var attr_map = self.model.get("attribute");
            $("#mark_group_select").empty();
            if( $("#sidekeyselect").val() != "none"){   
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE: Fruit size scale</b> of the attributes mapping");
                $("#mark_group").show();
                if(component_attribute[data_mode][$("#sidekeyselect").val()][5] == "categorical" || component_attribute[data_mode][$("#sidekeyselect").val()][5] == "boolean"){
                    self.size_cat_operation($("#sidekeyselect").val(), "fruit_size", attr_map["fruit_size"]);
                }
                else{
                    self.size_num_operation($("#sidekeyselect").val(), "fruit_size", attr_map["fruit_size"]);
                }
            }
            else{
                $("#sidekey_operation").show();
                $("#mark_group").html("<b>NOTE:</b> Map <b>nothing</b> to fruit size");
                $("#mark_group").show();
            }

            $("#sidekey_submit_trunk").hide();
            $("#sidekey_submit_branch").hide();
            $("#sidekey_submit_bside").hide();
            $("#sidekey_submit_root").hide();
            $("#sidekey_submit_leaf_size").hide();
            $("#sidekey_submit_leaf_color").hide();
            $("#sidekey_submit_leaf_highlight").hide();

            $("#sidekey_submit_fruit_size").show();
            $("#sidekey_submit_fruit_size").text("Done");
            
        });
        
        $("#sidekey_submit_fruit_size").unbind();
        $("#sidekey_submit_fruit_size").click(function(){
            $("#block_page").show();
            $("#loading_process").html("<b>Mapping...</b>");
            $("#sidekey_submit_fruit_size").text("Update");
            $("#sidekey_submit_fruit_size").attr("disabled", true);
            $("#block_layer").show();

            self.size_submit(attr_map["fruit_size"], $("#sidekeyselect").val(), "fruit_size");

        });
    },

    set_component: function(){
        var self = this;
        // var myattribute = JSON.parse(JSON.stringify(self.model.get("attribute")));
        var data_mode = self.model.get("view_mode");
        var myattribute = self.model.get("attribute");
        // $("#block_layer").hide();
        // $("#sidekey_submit_trunk").hide();
        // $("#sidekey_submit_branch").hide();
        // $("#sidekey_submit_bside").hide();
        // $("#sidekey_submit_root").hide();
        // $("#sidekey_submit_leaf_size").hide();
        // $("#sidekey_submit_leaf_color").hide();
        // $("#sidekey_submit_leaf_highlight").hide();
        // $("#sidekey_submit_fruit_size").hide();
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
        
    },

    set_save_component: function(myattribute){
        var self = this;
        var data_mode = self.model.get("view_mode");
        for(cmpt in myattribute){
            var cmpt_id = "#";
            if(cmpt == "stick")
                continue;
            cmpt_id += cmpt + "_save_map";
            // console.log(cmpt_id);
            // $(cmpt_id).text(myattribute[cmpt]);
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
        self.change_mapping += 1;
        tree_size = {};
        self.model.set({"tree_boundary":{}});
        self.model.trigger('change:attribute');
        $("#loading_process").html("<b>Rendering...</b>");
        var ego_selections = self.model.get("selected_egos");
        if(jQuery.isEmptyObject(ego_selections)){
            $("#block_page").hide();
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
        $("#block_page").hide();          
    }

});
