// selecting
var SelectingView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in selecting initialize");
        _.bindAll(this, 'change_mode');
        _.bindAll(this, 'set_data_label');
        _.bindAll(this, 'set_dataset');

        this.model.bind('change:view_mode', this.change_mode);
        this.model.bind('change:dataset_group', this.change_mode);
        this.model.bind('change:dataset_mode', this.set_dataset);
        this.model.bind('change:done_query_list', this.set_data_label);
        
        this.my_ego_selected = {};
        this.my_ego_display = {};
        this.my_ego = 0; // selected ego before done
        this.ego_subgroup = [];

        // define element container
        this.el_sub_selection = $("#sub_selection");
        this.el_dataselect = $("#dataselect");
        this.el_block_page = $("#block_page");
        this.el_loading = $("#loading_process");
        this.el_detail_menu = $("#detail_menu");
        this.el_divTable_menu = $("#divTable_menu");
        this.el_main_title = $("#main_title");
        this.el_submit_ego = $("#submit_ego");
        this.el_sub_title = $("#sub_title");
        
        // open the dialog
        $( "#menu_dialog" ).dialog({
            autoOpen: false,
            height: $(window).width()*0.4*0.7,
            width: $(window).width()*0.4,
            modal: true,
            resizable: false
        });

        self.el_divTable_menu.css({'height': ($(window).width()*0.4*0.7) - $("ego_container").height() - $("main_title").height() - 120}); // - $("ui-id-2").height() 


        $( "#menu" ).click(function() {
            var mode = self.model.get("view_mode");
            $( "#menu_dialog" ).dialog( "open" );            
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

    // reset if user add dataset
    set_dataset: function(){
        var self = this;
        var on_mode = self.model.get("view_mode");
        self.el_dataselect.empty();
        var data_mode = self.model.get("dataset_mode");

        self.el_dataselect.attr('class', 'dataset_selector');
        for(var s = 0; s < data_mode.length; s++){
            var text = data_mode[s];
            var option_val = session_id + "_of_" + data_mode[s];
            // var selection_opt = $('<option></option>');
            if(data_mode[s] == ""){
                text = "dataset";
                option_val = "0";
                if(data_mode[s] == on_mode)
                    on_mode = "0"    
            }
            
            var selection_opt = util.create_option(option_val, text, "myfont3", option_val==on_mode);
            self.el_dataselect.append(selection_opt);
        }


    },

    // get all the available dataset
    get_dataset: function(){
        var self = this;
        // var request_url = "dataset_mode/?mode=" + encodeURIComponent(session_id);
        var request_url = request_builder.dataset_mode(session_id);
        var data_selection = [""]

        d3.json(request_url, function(result){
            data_selection = data_selection.concat(result);
            self.model.set({"dataset_mode": data_selection});     
        });

    },

    // get user auto save information
    set_user_history: function(result){
        var self = this;
        if(!jQuery.isEmptyObject(result)){
            user_history = 1;
        }
        else{
            user_history = 0;
            return;
        }
        var restore_array = [];
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
        restore_array.push(JSON.parse(result.waves)); // how many group can be selected

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
        component_attribute[view_mode] = restore_array[16];
        waves = restore_array[17];

        self.model.set({"attribute": restore_array[14]["attr"]}, {silent: true});
        attribute_mapping = restore_array[14]["map_info"];
        mapping_color.render_leaf_color = restore_array[14]["render_leaf_color"];
        mapping_color.render_roots_color = restore_array[14]["render_roots_color"];

    },

    // set diaplay data and get structure
    set_display_value: function(){
        var self = this;
        self.el_loading.html("<b>Fetching...</b>");
        in_change_mode = 0;
        
        var single_attr = [];
      
        var attr = self.model.get("attribute");
        for(a in attr){
            single_attr.push(attr[a]);
        }
        self.model.set({"attr_option": single_attr}, {silent: true});
        
        var set_structure = function(data, all_ego){
            user_history = 2;
            var ego_selections = self.model.get("selected_egos");
            if(jQuery.isEmptyObject(ego_selections)){
                self.el_block_page.hide();
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
            self.set_data_label();
            
        };
        var data_group = self.model.get("dataset_group");
        var now_attr = self.model.get("attribute");
        var now_mode = self.model.get("view_mode");;
        var all_ego = self.model.get("selected_egos");
        var ego_list = [];
        
        for(var ego in all_ego){
            ego_list.push(ego);
        }
        
        var request_url = request_builder.last_use_data(now_attr, ego_list, now_mode, attribute_mapping, data_group, all_ego);
        self.el_block_page.show();
        d3.json(request_url, function(result) {
            set_structure(result, ego_list);
        }); 

    },

    get_data_event: function(){
        var self = this;
        // data selection on change event
        // on dataset change
        self.el_dataselect.change(function(){
            user_history = 0;
            // if get the new dataset
            if(initial_user != 0){ // not the first to triggr change effect
                in_change_mode = 1;
                self.model.set({"moving": 0});
                self.model.set({"selected_egos": {}});
                self.model.set({"display_egos": {}});
                self.model.set({"tree_structure":{}});
                
                self.model.set({"user_mapping": []});
                self.model.trigger('change:user_mapping');
                self.model.set({"attribute": {}});
                
                self.model.set({"leaf_scale":3});
                self.model.set({"fruit_scale":3});
                self.model.set({"sub_leaf_len_scale":1});
                self.model.set({"dtl_branch_curve":1});
                self.model.set({"filter_contact":0});
                self.model.set({"root_curve":0});
                self.model.set({"root_len_scale":1});
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});

                self.model.trigger('change:display_egos');
                user_history = 0;
                // initial_user = 1;
            }
            
            if(self.el_dataselect.val() == "0" && initial_user != 0){
                self.model.set({"egos_data": {}});
                self.model.set({"view_mode":"0"});
                document.cookie = "mode=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
            // others data
            else{
                var data_selected = self.el_dataselect.val();
                self.el_divTable_menu.empty();
                self.el_main_title.hide();
                self.el_divTable_menu.hide();
                self.el_submit_ego.hide();
                self.el_sub_title.hide();
                self.el_detail_menu.hide();

                // if it is initial model trigger the change
                if((data_selected == null || initial_user == 0) && first_use != 0)
                    data_selected = self.model.get("view_mode");

                document.cookie = "mode=" + data_selected.split("_of_")[1] + ";";

                // if it is new user
                if(first_use == 0){
                    self.el_block_page.show();
                    var request_url = request_builder.dataset(data_selected);
                    // var request_url = "dataset/?data="+encodeURIComponent(data_selected);
                    d3.json(request_url, function(result){
                        var set_dataset_group = function(data){
                            // waves = data;
                            if(data.length == 3)
                                self.model.set({"dataset_group": "dataset"});
                            else
                                self.model.set({"dataset_group": "all"});
                        };
                        set_dataset_group(result);
                        self.set_list_dataset();
                    });
                    return;
                }

                // find the user information
                var pre_request_url = request_builder.restore_user_history(data_selected);   
                d3.json(pre_request_url, function(result){
                    // check and set the result
                    self.set_user_history(result);
                    self.el_block_page.show();
                    if(user_history == 1){
                        self.set_list_dataset();
                    }
                    else{
                        var request_url = request_builder.dataset(data_selected);                        
                        d3.json(request_url, function(result){
                            var set_dataset_group = function(data){
                                if(data.length == 3)
                                    self.model.set({"dataset_group": "dataset"});
                                else
                                    self.model.set({"dataset_group": "all"});
                            };
                            set_dataset_group(result);
                            self.set_list_dataset();
                        });
                    }                    
                                        
                }); // end of d3.json for restore_user_history 
                
            }

        }); // end of _dataselect.change

    },

    set_list_dataset: function(){
        var self = this;
        if(user_history == 1){
            self.el_block_page.show();
            initial_user = 1;
            in_change_mode = 1;
            self.set_display_value();
            
            self.model.trigger('change:attribute');
            self.model.trigger('change:view_mode');
            self.model.trigger('change:dataset_mode');
            self.model.trigger('change:selected_egos');
            self.model.trigger('change:canvas_scale');
            // set the UI
            self.set_data_label();
            // already set group for this mode
            user_history = 2;
            return;
        }
        else{
            in_change_mode = 1;
                
            var data_selected = self.el_dataselect.val();
            var data_group = self.model.get("dataset_group");
                           
            attribute_mapping = {};
            mapping_color.render_leaf_color = ["#924307", "#C2B208", "#94AE0F", "#5F9915"];
            mapping_color.render_roots_color = ["#964343", "#90093F", "#967636", "#6B435E"];
            self.model.set({"moving": 0});
            self.model.set({"selected_egos": {}});
            self.model.set({"display_egos": {}});
            self.model.set({"tree_structure":{}});
            
            self.my_ego_selected = {};
            self.my_ego_display = {};
                           
            self.model.set({"leaf_scale":3});
            self.model.set({"fruit_scale":3});
            self.model.set({"sub_leaf_len_scale":1});
            self.model.set({"dtl_branch_curve":1});
            self.model.set({"filter_contact":0});
            self.model.set({"root_curve":0});
            self.model.set({"root_len_scale":1});
            self.model.set({"canvas_translate":[0, 0]});
            self.model.set({"canvas_scale":0.15});

            self.model.trigger('change:display_egos');
            var data_selected = self.el_dataselect.val();
            
            // reset every for new view group
            self.model.query_ego_list(data_selected, data_group);
            
            // self.model.set({"dataset_group": data_group});
            self.model.set({"view_mode":data_selected});
            
            self.el_block_page.show();
            self.el_loading.html("<b>Fetching...</b>");
            
            // set the label title
            var label = $("#selecting_label");
            var all_tree = data_selected.split("_of_")[1].toUpperCase();
            
            label.html(all_tree + ":");
            user_history = 2;
               
        }


    },

    change_mode: function(){
        var self = this;
        var mode = self.model.get("view_mode");
        self.el_main_title.show();
        self.el_main_title.text("Select Ego:");
        self.el_divTable_menu.show();
        if(mode == "0"){
            self.el_divTable_menu.empty();
            self.el_main_title.hide();
            self.el_divTable_menu.hide();
            self.el_submit_ego.hide();
            self.el_sub_title.hide();
            self.el_detail_menu.hide();
        }
        else if(user_history != 1){
            this.data_option();
        }
       
    },

    // set the title of ego selection
    data_option: function(){
        var self = this;
        self.el_divTable_menu.empty();
        self.el_detail_menu.hide();
        
        self.el_main_title.show();
        self.el_main_title.text("Select Ego:");
        self.el_divTable_menu.show();
        
    },

    // if getting all the data then we set the UI
    set_data_label: function(){
        var self = this;
        var name = "EGO";
        var sub = "";
        var select_ego = [];
        if(user_history != 1)
            self.el_block_page.hide();
        
        function opt_change(ego){
            var subset = self.model.get("dataset_group");
            self.el_sub_selection.empty();
            self.ego_subgroup = [];
            if(subset != "all"){
                self.el_sub_title.show();
                self.el_sub_title.text("Sub Group:");
                self.el_detail_menu.show();

                self.el_sub_selection.show();
                self.el_submit_ego.show();
                for(var c = 0; c < total_ego[ego].length; c++){
                    self.ego_subgroup.push(total_ego[ego][c]);
                }
            }
            else{
                self.el_sub_title.hide();
                self.el_detail_menu.show();

                self.el_sub_selection.hide();
                self.el_submit_ego.show();
                self.ego_subgroup.push("all");
            }
            self.el_submit_ego.removeAttr("disabled");
            self.el_submit_ego.text("Done");
            
            var ego_group = {};
            ego_group[self.my_ego] = self.ego_subgroup;
            for(var s = 0; s < self.ego_subgroup.length; s++){
                if(s == self.ego_subgroup.length-2)
                    self.el_sub_selection.append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + self.ego_subgroup[s] + '" id="' + self.ego_subgroup[s] + '" checked>' + self.ego_subgroup[s] + '</label>');            
                else
                    self.el_sub_selection.append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + self.ego_subgroup[s] + '" id="' + self.ego_subgroup[s] + '">' + self.ego_subgroup[s] + '</label>');            
                self.el_sub_selection.append("<p></p>");
            }

            var data_group = self.model.get("dataset_group");
            var now_attr = self.model.get("attribute");
            var now_mode = self.model.get("view_mode");

            // var requst = now_attr + ":-" + self.my_ego + ":-" + now_mode + ":-" + JSON.stringify(attribute_mapping) + ":-" + data_group + ":-" + ego_group;
            var request_url = request_builder.get_update(now_attr, self.my_ego, now_mode, attribute_mapping, data_group, ego_group);
            // get all the structure of this selected ego
            self.model.query_data(request_url, ego_group);
            
            // button click event
            self.el_submit_ego.unbind();
            self.el_submit_ego.click(function(){ // store selecting data
                self.my_ego_selected = self.model.get("selected_egos");
                self.my_ego_display = self.model.get("display_egos");
                
                // store last page's selections
                var display = [];
                var select_ego = [];
                
                var data_group = self.model.get("dataset_group");
                if(data_group == "all"){
                    select_ego.push("all");
                }
                else{
                    $('.sub_option:checked').each(function(){
                        select_ego.push($(this).val());
                    });
                }
                self.el_submit_ego.attr("disabled", true);
                self.el_block_page.show();
                self.el_loading.html("<b>Rendering...</b>");
                self.el_submit_ego.text("Rendering");

                self.my_ego_selected[self.my_ego] = self.ego_subgroup;
                self.my_ego_display[self.my_ego] = select_ego;
                
                self.model.set({"display_egos":self.my_ego_display});
                self.model.set({"selected_egos":self.my_ego_selected});
                
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});
                
                self.model.trigger('change:tree_structure');
                self.el_submit_ego.removeAttr("disabled");
                self.el_block_page.hide();
                $("#menu_dialog").dialog("close");

                self.model.trigger('change:selected_egos');
                // self.model.trigger('change:display_egos');   

            });
        }
        var data_group = self.model.get("dataset_group");
        self.el_divTable_menu.empty();
        self.el_detail_menu.hide();
        // all ego selections
        for(var c in total_ego){
            var detail_amont = "";
            for(var t = 0; t < total_ego[c].length; t++){
                if(total_ego[c][t] != "all"){
                    detail_amont += total_ego[c][t] + "+";
                }
            }
            if(detail_amont == "")
                self.el_divTable_menu.append('<div><label><input class="myfont3 ego_checkbox" name="ego_selection" type="radio" id="' + c + '" value="' + c +'" style="margin-right:5px;">' + name + '_' + c.toUpperCase() + '</label></div>');
            else{
                detail_amont = detail_amont.slice(0, detail_amont.length-1);
                self.el_divTable_menu.append('<div><label><input class="myfont3 ego_checkbox" name="ego_selection" type="radio" id="' + c + '" value="' + c +'" style="margin-right:5px;">' + name + '_' + c.toUpperCase() + ' ('+ detail_amont +')</label></div>');
            }
        }
         
        $('.ego_checkbox').unbind();
        $('.ego_checkbox').change(function() {
            var checked_ego = $('.ego_checkbox:checked').val();
            // querying
            self.my_ego = checked_ego;
            opt_change(checked_ego);
            
        });
    }


});
