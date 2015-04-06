// selecting
var SelectingView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in selecting initialize");
        _.bindAll(this, 'change_mode');
        // _.bindAll(this, 'set_dblp_label');
        // _.bindAll(this, 'set_ego_label');
        _.bindAll(this, 'set_data_label');
        _.bindAll(this, 'set_dataset');

        this.model.bind('change:view_mode', this.change_mode);
        this.model.bind('change:dataset_group', this.change_mode);
        this.model.bind('change:dataset_mode', this.set_dataset);
        // this.model.bind('change:folder', this.change_mode);
        // this.model.bind('change:done_query_list', this.set_dblp_label);
        // this.model.bind('change:done_query_list', this.set_ego_label);
        // this.model.bind('change:done_query_list', this.set_label);
        this.model.bind('change:done_query_list', this.set_data_label);
        
        
        this.my_ego_selected = {};
        this.my_ego_display = {};
        this.my_ego = 0;
        this.ego_cat = ["", "all"],
        // default setting??

        // open the dialog
        $( "#menu_dialog" ).dialog({
            autoOpen: false,
            // height: 400,
            // width: 550,
            height: $(window).width()*0.4*0.7,
            width: $(window).width()*0.4,
            modal: true,
            resizable: false
        });

        $("#divTable_menu").css({'height': ($(window).width()*0.4*0.7) - $("ego_container").height() - $("main_title").height() - 100}); // - $("ui-id-2").height() 

        $( "#menu" ).click(function() {
            var mode = self.model.get("view_mode");
            $( "#menu_dialog" ).dialog( "open" );
            // self.model.set({"selected_egos":{}});
            // this.my_ego_selected = self.model.get("selected_egos");
            // this.my_ego_display = self.model.get("display_egos");
            
            // clean checked
            $("#sub_selection").empty();
            $('.ego_checkbox:checked').each(function(i, item){
                this.checked = item.defaultChecked;
            });
            $("#detail_menu").hide();
                      
        });

        this.get_dataset();
        this.get_data_event();
    },

    set_dataset: function(){
        var self = this;
        var on_mode = self.model.get("view_mode");
        var container = document.getElementById("dataselect");
        $("#dataselect").empty();
        var data_mode = self.model.get("dataset_mode");
        container.setAttribute("class", "dataset_selector");
        for(var s = 0; s < data_mode.length; s++){
            var selection_opt = document.createElement('option');
            if(data_mode[s] == ""){
                selection_opt.value = "0";
                selection_opt.innerHTML = "dataset";
                if(data_mode[s] == on_mode)
                    selection_opt.setAttribute("selected", true);
                // selection_opt.setAttribute("class", "myfont3");
            }
            else{
                selection_opt.value = session_id + "_of_" + data_mode[s];
                selection_opt.innerHTML = data_mode[s];
                if(selection_opt.value == on_mode)
                    selection_opt.setAttribute("selected", true);
            }
            
            selection_opt.setAttribute("class", "myfont3");
            container.appendChild(selection_opt);
        }

    },

    get_dataset: function(){
        var self = this;
        // var data_mode = self.model.get("dataset_mode");
        var request_url = "dataset_mode/?mode=" + session_id;
        var data_selection = [""]
        d3.json(request_url, function(result){
            data_selection = data_selection.concat(result);
            self.model.set({"dataset_mode": data_selection});
            // self.model.trigger('change:dataset_mode');          
        });

    },

    get_data_event: function(){
        var self = this;

        var set_user_history = function(result){
            if(!jQuery.isEmptyObject(result)){
                user_history = 1;
            }
            else{
                user_history = 0;
                return;
            }
            var restore_array = [];
            // console.log(restore_array);
            var view_mode = session_id.toString() + "_of_" + result.mode;
            restore_array.push(view_mode); // mode
            restore_array.push(JSON.parse(result.display_egos)); // display_egos
            restore_array.push(JSON.parse(result.selected_egos)); // selected_egos
            restore_array.push(result.leaf_scale); // leaf_scale
            restore_array.push(result.fruit_scale); // fruit_scale
            restore_array.push(result.leaf_len_scale); // leaf_len_scale
            restore_array.push(result.branch_curve); // branch_curve
            restore_array.push(result.root_curve); // root_curve
            restore_array.push(result.root_len_scale); // root_len_scale
            restore_array.push(result.canvas_scale); // canvas_scale
            restore_array.push(result.filter_contact); // filter_contact
            restore_array.push(JSON.parse(result.tree_boundary)); // tree_boundary
            restore_array.push(JSON.parse(result.canvas_translate)); // canvas_translate
            restore_array.push(JSON.parse(result.total_ego)); // total_ego
            restore_array.push(JSON.parse(result.attr_info)); // attr_info
            restore_array.push(result.group); // group
            restore_array.push(JSON.parse(result.component_attr)); // component_attribute

            self.model.set({"view_mode": restore_array[0]}, {silent: true});
            self.model.set({"display_egos": restore_array[1]}, {silent: true});
            self.model.set({"selected_egos": restore_array[2]}, {silent: true});
            self.model.set({"leaf_scale": restore_array[3]}, {silent: true});
            self.model.set({"fruit_scale": restore_array[4]}, {silent: true});
            self.model.set({"sub_leaf_len_scale": restore_array[5]}, {silent: true});
            self.model.set({"dtl_branch_curve": restore_array[6]}, {silent: true});
            self.model.set({"root_curve": restore_array[7]}, {silent: true});
            self.model.set({"root_len_scale": restore_array[8]}, {silent: true});
            self.model.set({"canvas_scale": restore_array[9]}, {silent: true});
            self.model.set({"filter_contact": restore_array[10]}, {silent: true});
            self.model.set({"tree_boundary": restore_array[11]}, {silent: true});
            self.model.set({"canvas_translate": restore_array[12]}, {silent: true});
            total_ego = restore_array[13];
            self.model.set({"dataset_group": restore_array[15]}, {silent: true});
            component_attribute[view_mode] = restore_array[16]

            self.model.set({"attribute": restore_array[14]["attr"]}, {silent: true});
            attribute_mapping = restore_array[14]["map_info"];
            mapping_color.render_leaf_color = restore_array[14]["render_leaf_color"];
            mapping_color.render_roots_color = restore_array[14]["render_roots_color"];

        };

        var set_display_value = function(){
            in_change_mode = 0;
            // set_ego_list_json
            // set_value(result);
            var sub_array = [];
            for(var d in total_ego){
                // var obj = {};
                // obj[d] =total_ego[d].length;
                sub_array.push({sub: d, len:total_ego[d].length});
            }
            sub_array.sort(function(obj1, obj2) {
                // Ascending: first age less than the previous
                return obj2.len - obj1.len;
            });
            // console.log(sub_array);
            var temp_array = [];
            for(var t = 0; t < sub_array.length; t++){
                temp_array.push(sub_array[t].sub);
            }
            sub_ego = temp_array;

            // set_default_attr
            var single_attr = [];
          
            var attr = self.model.get("attribute");
            for(a in attr){
                single_attr.push(attr[a]);
            }
            self.model.set({"attr_option": single_attr}, {silent: true});

            
            var set_structure = function(data, all_ego){
                var ego_selections = self.model.get("selected_egos");
                if(jQuery.isEmptyObject(ego_selections)){
                    $("#block_page").hide();
                    return
                }
                var data_mode = self.model.get("view_mode");
                
                var tree_structure = self.model.get("tree_structure");
                tree_structure[data_mode] = {};
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
                self.model.set({"tree_structure": tree_structure}, {silent: true});
                self.model.trigger('change:tree_structure');
                // $("#block_page").hide();   
            };

            var data_group = self.model.get("dataset_group");
            var now_attr = self.model.get("attribute");
            var now_mode = self.model.get("view_mode");;
            var all_ego = self.model.get("selected_egos");
            var ego_list = [];
            
            for(var ego in all_ego){
                ego_list.push(ego);
            }
            var request = JSON.stringify(now_attr) + ":-" + JSON.stringify(ego_list) + ":-" + now_mode + ":-" + JSON.stringify(attribute_mapping) + ":-" + data_group + ":-" + JSON.stringify(all_ego);
            var request_url = "restore_data/?restore="+request;
            
            $("#block_page").show();

            d3.json(request_url, function(result) {
                set_structure(result, ego_list);
                // self.model.trigger('change:tree_structure');
                // $("#block_page").hide();
            }); 
         

            // set_attribute_info
            // var mode = self.model.get("view_mode");
            // component_attribute[mode] = {};
            // for(a in data[2]){
            //     component_attribute[mode][a] = data[2][a];
            // }
            // component_attribute[mode]["none"] = [["none"], 0, 0, 0, 1, "none"];

        };
        
        $("#dataselect").change(function(){
            // default_component = ["stick", "trunk", "branch", "bside", "leaf_color", "leaf_size", "fruit"];
            if(initial_user != 0){
                in_change_mode = 1;
                self.model.set({"moving": 0});
                self.model.set({"selected_egos": {}});
                self.model.set({"display_egos": {}});
                self.model.set({"tree_structure":{}});
                
                // self.my_ego_selected = {};
                // self.my_ego_display = {};
                // attribute_mapping = {};
                // save_user_mapping = [];
                // $("#save_mapping_container").empty();
                self.model.set({"user_mapping": []});
                self.model.trigger('change:user_mapping');
                self.model.set({"attribute": {}});
                
                self.model.set({"leaf_scale":3});
                self.model.set({"fruit_scale":3});
                self.model.set({"sub_leaf_len_scale":1});
                self.model.set({"dtl_branch_curve":1});
                self.model.set({"filter_contact":0});
                // self.model.set({"abt_branch_curve":1});
                self.model.set({"root_curve":0});
                self.model.set({"root_len_scale":1});
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});

                self.model.trigger('change:display_egos');
                self.ego_cat = ["", "all"];
                $("#egogroup").empty();
                $("#group_container").hide();
                user_history = 0;
                // initial_user = 1;                
            }
            
            $("#egogroup").empty();
            if($("#dataselect").val() == "0" && initial_user != 0){
                self.model.set({"egos_data": {}});
                self.model.set({"view_mode":"0"});
                $("#group_container").hide();
                document.cookie = "mode=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
            // others data
            else{
                // default_component.push("root");
                var data_selected = $("#dataselect").val();
                $("#divTable_menu").empty();
                $("#main_title").hide();
                $("#divTable_menu").hide();
                $("#submit_ego").hide();
                $("#sub_title").hide();
                $("#detail_menu").hide();

                if((data_selected == null || initial_user == 0) && first_use != 0)
                    data_selected = self.model.get("view_mode");


                document.cookie = "mode=" + data_selected.split("_of_")[1] + ";";
                
                // add function to get the last infomation
                // set evert model parameter silent
                var pre_request_url = "restore_user_history/?user="+data_selected;

                if(first_use == 0){
                    var request_url = "dataset/?data="+data_selected;
                    d3.json(request_url, function(result){
                        // console.log("in model.query_data_info");
                        // console.log(result)
                        var set_dataset_group = function(data){
                            self.ego_cat = data;
                            
                            var on_group = self.model.get("dataset_group");
                            if(user_history == 0)
                                on_group = "";
                            // for(var d = 0; d < data.length; d++){
                            //   self.ego_cat.push(data[d]);
                            // }
                            var container = document.getElementById("egogroup");
                            // container.setAttribute("class", "dataset_selector");
                            for(var s = 0; s < self.ego_cat.length; s++){
                                var selection_opt = document.createElement('option');
                                selection_opt.value = self.ego_cat[s];
                                if(selection_opt.value == on_group)
                                    selection_opt.setAttribute("selected", true);
                                selection_opt.innerHTML = self.ego_cat[s];
                                selection_opt.setAttribute("class", "myfont3");
                                
                                container.appendChild(selection_opt);
                            }
                            $("#group_container").show();
                            if(user_history == 1)
                                $("#egogroup").trigger('change');
                        };
                        set_dataset_group(result);
                        // dataset_mode
                    });
                    return;
                }
                    
                d3.json(pre_request_url, function(result){
                    // console.log(result);
                    
                    // if(!jQuery.isEmptyObject(result)){
                    set_user_history(result);
                    
                    var request_url = "dataset/?data="+data_selected;
                    d3.json(request_url, function(result){
                        // console.log("in model.query_data_info");
                        // console.log(result)
                        var set_dataset_group = function(data){
                            self.ego_cat = data;
                            
                            var on_group = self.model.get("dataset_group");
                            if(user_history == 0)
                                on_group = "";
                            // for(var d = 0; d < data.length; d++){
                            //   self.ego_cat.push(data[d]);
                            // }
                            var container = document.getElementById("egogroup");
                            // container.setAttribute("class", "dataset_selector");
                            for(var s = 0; s < self.ego_cat.length; s++){
                                var selection_opt = document.createElement('option');
                                selection_opt.value = self.ego_cat[s];
                                if(selection_opt.value == on_group)
                                    selection_opt.setAttribute("selected", true);
                                selection_opt.innerHTML = self.ego_cat[s];
                                selection_opt.setAttribute("class", "myfont3");
                                
                                container.appendChild(selection_opt);
                            }
                            $("#group_container").show();
                            if(user_history == 1)
                                $("#egogroup").trigger('change');
                        };
                        set_dataset_group(result);
                        // dataset_mode
                    });
                                        
                });
                
            }

        });

        $("#egogroup").change(function(){
            if(user_history == 0){
                in_change_mode = 1;
                self.model.set({"moving": 0});
                // console.log("on menu dialog before:", self.model.get("display_egos"));
                self.model.set({"selected_egos": {}});
                self.model.set({"display_egos": {}});
                self.model.set({"tree_structure":{}});
                
                self.my_ego_selected = {};
                self.my_ego_display = {};
                attribute_mapping = {};
                // save_user_mapping = [];
                // $("#save_mapping_container").empty();
                self.model.set({"user_mapping": []});
                self.model.trigger('change:user_mapping');

                self.model.set({"leaf_scale":3});
                self.model.set({"fruit_scale":3});
                self.model.set({"sub_leaf_len_scale":1});
                self.model.set({"dtl_branch_curve":1});
                self.model.set({"filter_contact":0});
                // self.model.set({"abt_branch_curve":1});
                self.model.set({"root_curve":0});
                self.model.set({"root_len_scale":1});
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});

                self.model.trigger('change:display_egos');
                // user_history = 0;                
            }
            else if(user_history == 1){
                initial_user = 1;
                in_change_mode = 1;
                set_display_value();
                
                self.model.trigger('change:attribute');
                self.model.trigger('change:view_mode');
                self.model.trigger('change:dataset_mode');
                self.model.trigger('change:selected_egos');
                self.model.trigger('change:canvas_scale');
                // $("#divTable_menu").empty();
                // $("#main_title").hide();
                // $("#divTable_menu").hide();
                self.set_data_label();
                user_history = 2;
                return;
            }
            else if(user_history == 2){
                in_change_mode = 1;
                self.model.set({"moving": 0});
                // console.log("on menu dialog before:", self.model.get("display_egos"));
                self.model.set({"selected_egos": {}});
                self.model.set({"display_egos": {}});
                self.model.set({"tree_structure":{}});
                
                self.my_ego_selected = {};
                self.my_ego_display = {};
                attribute_mapping = {};
               
                // save_user_mapping = [];
                // $("#save_mapping_container").empty();
                // self.model.set({"user_mapping": []});
                // self.model.trigger('change:user_mapping');

                self.model.set({"leaf_scale":3});
                self.model.set({"fruit_scale":3});
                self.model.set({"sub_leaf_len_scale":1});
                self.model.set({"dtl_branch_curve":1});
                self.model.set({"filter_contact":0});
                // self.model.set({"abt_branch_curve":1});
                self.model.set({"root_curve":0});
                self.model.set({"root_len_scale":1});
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});

                self.model.trigger('change:display_egos');
            }

            var data_selected = $("#dataselect").val();
            var ego_group = $("#egogroup").val();
            if(ego_group == ""){
                return
            }       

            self.model.query_ego_list(data_selected, ego_group);
            
            self.model.set({"dataset_group": ego_group});
            self.model.set({"view_mode":data_selected});
            // self.model.set({"tree_structure":{}});
            $('#egogroup').attr("disabled", true);
            $("#block_page").show();
            $("#loading_process").html("<b>Fetching...</b>");
            var label = document.getElementById("selecting_label");
            // var all_tree_len = data_selected.toUpperCase().split("_");
            var all_tree = data_selected.split("_of_")[1].toUpperCase();
            /*
            if(all_tree_len.length > 2){
                all_tree = data_selected.toUpperCase().split("_")[2];
                // replace(/_/g, " ") + ":";
                for( var a = 3; a < all_tree_len.length; a++){
                    all_tree += " " + all_tree_len[a];
                }
            }
            else{
                all_tree = all_tree.replace(/_/g, " ")
            }
            */
            label.innerHTML = all_tree + ":";
            // label.innerHTML = "<b>" + all_tree + ":</b>";
            // label.innerHTML = data_selected.toUpperCase().replace("_", " ");
        });
    },

    change_mode: function(){
        var self = this;
        var mode = self.model.get("view_mode");
        $("#main_title").show();
        $("#main_title").text("Select Ego:");
        $("#divTable_menu").show();
        if(mode == "0"){
            $("#divTable_menu").empty();
            $("#main_title").hide();
            $("#divTable_menu").hide();
            $("#submit_ego").hide();
            $("#sub_title").hide();
            $("#detail_menu").hide();
        }
        else if(user_history != 1){
            this.data_option();
        }
       
    },

    data_option: function(){
        var self = this;
        // var name = "EGO ";
        // var sub = "";
        // var select_ego = [];
        $("#divTable_menu").empty();
        $("#detail_menu").hide();
        
        $("#main_title").show();
        $("#main_title").text("Select Ego:");
        $("#divTable_menu").show();
        
    },

    set_data_label: function(){
        var self = this;
        var name = "EGO";
        var sub = "";
        var select_ego = [];
        if(user_history != 1)
            $("#block_page").hide();
        $('#egogroup').removeAttr("disabled");
        function opt_change(ego){
            // console.log("in opt_function", ego);
            // console.log("in opt_function", self.my_ego_selected);
            var subset = self.model.get("dataset_group");
            if(subset != "all"){
                $("#sub_title").show();
                $("#sub_title").text("Sub Group:");
                $("#detail_menu").show();

                $("#sub_selection").empty();
                $("#sub_selection").show();
                $("#submit_ego").show();
                // $('.ego_checkbox').attr("disabled", true);
            }
            else{
                $("#sub_title").hide();
                // $("#sub_title").text("Sub Group:");
                $("#detail_menu").show();

                $("#sub_selection").empty();
                $("#sub_selection").hide();
                $("#submit_ego").show();
                // $('.ego_checkbox').attr("disabled", true);

            }
            $("#submit_ego").removeAttr("disabled");
            $("#submit_ego").text("Done");
            // $('.ego_checkbox').removeAttr("disabled");
            
            var ego_subgroup = [];
            for(var c = 0; c < sub_ego.length; c++){
                for(var v = 0; v < total_ego[sub_ego[c]].length; v++){
                    if(total_ego[sub_ego[c]][v] == ego){
                        ego_subgroup.push(sub_ego[c]);
                        break;
                    }
               }
            }
            var ego_group = {};
            ego_group[self.my_ego] = ego_subgroup;
            for(var s = 0; s < ego_subgroup.length; s++){
                if(s == ego_subgroup.length-1)
                    $("#sub_selection").append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + ego_subgroup[s] + '" id="' + ego_subgroup[s] + '" checked>' + ego_subgroup[s] + '</label>');            
                else
                    $("#sub_selection").append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + ego_subgroup[s] + '" id="' + ego_subgroup[s] + '">' + ego_subgroup[s] + '</label>');            
                $("#sub_selection").append("<p></p>");
            }
            var data_group = self.model.get("dataset_group");
            var now_attr = JSON.stringify(self.model.get("attribute"));
            var now_mode = self.model.get("view_mode");
            var ego_group = JSON.stringify(ego_group);

            var requst = now_attr + ":-" + self.my_ego + ":-" + now_mode + ":-" + JSON.stringify(attribute_mapping) + ":-" + data_group + ":-" + ego_group;
            // self.model.update_data(requst);
            self.model.query_data(requst);
            
            // button click event
            $("#submit_ego").click(function(){ // store selecting data
                self.my_ego_selected = self.model.get("selected_egos");
                self.my_ego_display = self.model.get("display_egos");
                var now_attr = JSON.stringify(self.model.get("attribute"));
                var now_mode = self.model.get("view_mode");
                var now_ego = {};
                var now_subset = self.model.get("dataset_group");

                // store last page's selections
                var display = [];
                select_ego = [];
                var total = 0;
                var data_group = self.model.get("dataset_group");
                if(data_group == "all"){
                    select_ego.push("all");
                    total++;
                }
                else{
                    $('.sub_option:checked').each(function(){
                        //alert($(this).val());
                        select_ego.push($(this).val());
                        total++;
                    });
                }
                $("#submit_ego").attr("disabled", true);
                $("#block_page").show();
                $("#loading_process").html("<b>Rendering...</b>");
                $("#submit_ego").text("Rendering");

                // now_ego[self.my_ego] = select_ego;
                // now_ego = JSON.stringify(now_ego);
                // console.log(">>>>", self.model.get("tree_structure"));

                self.my_ego_selected[self.my_ego] = select_ego;

                display.push(select_ego[total-1]);
                self.my_ego_display[self.my_ego] = display;
                
                self.model.set({"display_egos":self.my_ego_display});
                self.model.set({"selected_egos":self.my_ego_selected});
                // console.log(">>>>", self.model.get("selected_egos"));
                
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});
                
                self.model.trigger('change:tree_structure');
                $("#submit_ego").removeAttr("disabled");
                $("#block_page").hide();
                $( "#menu_dialog" ).dialog( "close" );

                self.model.trigger('change:selected_egos');
                self.model.trigger('change:display_egos');   
                // var requst = now_attr + ":-" + now_ego + ":-" + now_subset + ":-" + now_mode;
                // self.model.query_data(requst);

                
                // self.model.trigger('change:display_egos');
                // self.model.trigger('change:selected_egos');

            });
        }

        // all ego selections
        for(var c = 0; c < total_ego[sub_ego[0]].length; c++){
            var check_amont = 0;
            for(var t = 0; t < sub_ego.length; t++){
                for(var t1 = 0; t1 < total_ego[sub_ego[t]].length; t1++){
                    if(total_ego[sub_ego[t]][t1] == total_ego[sub_ego[0]][c]){
                        check_amont++;
                        break;
                    }
               }
            }
            $("#divTable_menu").append('<div><label><input class="myfont3 ego_checkbox" name="ego_selection" type="radio" id="' + total_ego[sub_ego[0]][c] + '" value="' + total_ego[sub_ego[0]][c] +'" style="margin-right:5px;">' + name + '_' + total_ego[sub_ego[0]][c].toUpperCase() + ' ('+ check_amont +')</label></div>');
        }
         
        // sub = $('.sub_option:checked').val();
        // single selection with same name
        $('.ego_checkbox').change(function() {
            var checked_ego = $('.ego_checkbox:checked').val();
            // var instructure = checked_ego
            // $("#sub_title").show();
            // $("#sub_title").text("Sub Group:");
            // $("#detail_menu").show();
            // querying
            self.my_ego = checked_ego;
            opt_change(checked_ego);
            
            // $('.ego_checkbox:checked').prop('checked', false); // dont know
        });
    }


});
