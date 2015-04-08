// labeling
var LabelView = Backbone.View.extend({
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in selecting initialize");
        _.bindAll(this, 'set_label');

        this.label_selected = self.model.get("selected_egos");
        this.label_display = self.model.get("display_egos");
        
        this.model.bind('change:selected_egos', this.set_label);

        this.temp_selecting = [];
    },

    set_label: function(){ // dropdowm checkbox list
        var self = this;
        // selecting_label
        self.label_selected = self.model.get("selected_egos");
        self.label_display = self.model.get("display_egos");
        var group = self.model.get("dataset_group");
       
        var my_mode = self.model.get("view_mode");
        var all_tree = my_mode.split("_of_")[1].toUpperCase();
        
        $("#selecting_ego").empty();

        // set the label
        var label = document.getElementById("selecting_label");
        label.innerHTML = all_tree + ":";
        var label_btn = document.getElementById("selecting_ego");
        
        if(group != "all"){
            for(s in self.label_selected){
                var opt = document.createElement("div");
                opt.setAttribute('class', 'dropdown');
                opt.setAttribute('class', 'left');
                opt.setAttribute('style', 'margin-left:10px; position:relative');

                var remove_btn = document.createElement("span");
                remove_btn.id = "delect_ego_" + s;
                remove_btn.value = s;
                remove_btn.name = s;
                remove_btn.setAttribute('style', 'position: absolute; top:-4px; right:-4px; display:none;');
                remove_btn.setAttribute("class", "glyphicon glyphicon-remove-circle");
                
                
                var opt_btn = document.createElement("button");
                opt_btn.setAttribute('class', 'dropdown-toggle');
                opt_btn.setAttribute('class', 'ego_label');
                opt_btn.setAttribute('class', 'btn');
                opt_btn.setAttribute('data-toggle', 'dropdown'); //??
                opt_btn.id = "label_" + s;
                opt_btn.value = s;
                opt_btn.name = s;
                opt_btn.innerHTML = "EGO " + s.toUpperCase();
                
               
                var opt_menu = document.createElement("ul");
                opt_menu.setAttribute('class', 'dropdown-menu');
                opt_menu.setAttribute('role', 'menu');
                
                var count_checked = 0;
                for(var c = 0; c < self.label_selected[s].length; c++){
                    var id = "#selected_ego_" + self.label_selected[s][c];
                    var opt_row = document.createElement("li");
                    opt_row.id = "selected_ego_" + self.label_selected[s][c];

                    var lb = document.createElement("label");
                    lb.setAttribute('class', 'checkbox');
                    lb.innerHTML = self.label_selected[s][c];
                    var ip = document.createElement("input");
                    ip.setAttribute('type', 'checkbox');
                    ip.setAttribute('class', 'label_checkbox');
                    ip.value = s + "_" + self.label_selected[s][c];
                    ip.id = 'sub_'+s;

                    if(count_checked < self.label_display[s].length && self.label_display[s][count_checked] == self.label_selected[s][c]){
                        ip.setAttribute('checked', true);
                        count_checked++;
                    }
                                                  
                    lb.appendChild(ip);
                    opt_row.appendChild(lb);
                    opt_menu.appendChild(opt_row);
                }
                opt.appendChild(opt_btn);
                opt.appendChild(opt_menu);
                
                opt.appendChild(remove_btn);
                label_btn.appendChild(opt);

            }
            $('.dropdown-menu').on('click', function (e) { // e?? on vs click??
                e.stopPropagation();
            });

            this.set_label_event(group);
        }

        // no need to have dropdown menu
        else{
            for(s in self.label_selected){
                var gen_id = "";
                var name_array = s.split(" ");
                for(var w = 0; w < name_array.length; w++){
                    latter = name_array[w].split(".")[0];
                    if(w < name_array.length-1){
                        gen_id += latter + "_";
                    }
                    else{
                        gen_id += latter;
                    }
                }
                
                var opt = document.createElement("div");
                opt.setAttribute('class', 'left');
                opt.setAttribute('style', 'margin-left:10px; position:relative');

                var remove_btn = document.createElement("span");
                remove_btn.id = "delect_ego_" + gen_id;
                remove_btn.value = gen_id;
                remove_btn.name = s;
                remove_btn.setAttribute('style', 'position: absolute; top:-4px; right:-4px; display:none;');
                remove_btn.setAttribute("class", "glyphicon glyphicon-remove-circle");

                var opt_btn = document.createElement("button");
                // opt_btn.setAttribute('class', 'dropdown-toggle');
                opt_btn.setAttribute('class', 'ego_label');
                opt_btn.setAttribute('class', 'btn');
                // opt_btn.setAttribute('data-toggle', 'dropdown'); //??
                opt_btn.id = "label_" + gen_id;
                opt_btn.value = gen_id;
                opt_btn.name = s;
                opt_btn.innerHTML = "EGO " + s.toUpperCase();

                opt.appendChild(opt_btn);
                
                opt.appendChild(remove_btn);
                label_btn.appendChild(opt);
            }
            this.set_label_event(my_mode);

        }
        

    },

    set_label_event: function(group){
        var self = this;
        function delete_selection(selection){
            delete self.label_selected[selection];
            delete self.label_display[selection];
        }
        
        // delete one ego event
        for(s_store in self.label_selected){
            var s = s_store;
            var label_id = "#label_" + s;
            
            $(label_id).hover(function(){
                var delete_id = "#delect_ego_" + this.value;
                $(delete_id).show();
            });
            $(label_id).mouseout(function(){
                var delete_id = "#delect_ego_" + this.value;
                $(delete_id).hide();
            });

            var delete_ego_id = "#delect_ego_" + s;
            $(delete_ego_id).hover(function(){
                var delete_id = "#delect_ego_" + this.value;
                $(delete_id).show();
            });
            $(delete_ego_id).mouseout(function(){
                var delete_id = "#delect_ego_" + this.value;
                $(delete_id).hide();
            });
            
            $(delete_ego_id).click(function(){
                delete self.label_selected[this.name];
                delete self.label_display[this.name];
                console.log("after ", self.label_display);
                self.model.set({"selected_egos":self.label_selected});
                self.model.set({"display_egos":self.label_display});
                if(jQuery.isEmptyObject(self.label_display)){
                    self.model.set({"leaf_scale":3});
                    self.model.set({"fruit_scale":3});
                    self.model.set({"sub_leaf_len_scale":1});
                    self.model.set({"dtl_branch_curve":1});
                    self.model.set({"root_curve":0});
                    self.model.set({"root_len_scale":1});
                    self.model.set({"canvas_translate":[0, 0]});
                    self.model.set({"canvas_scale":0.15});
                    self.model.trigger('change:attribute');                    
                    self.update_slider();
                }
                // self.model.set({"canvas_translate":[0, 0]});
                // self.model.set({"canvas_scale":0.15});
                self.model.trigger('change:selected_egos');
                self.model.trigger('change:display_egos');
            });
            
        }
        // only for clicking the dropdown menu
        if(group != "all"){
            $('.label_checkbox').change(function() {
                self.temp_selecting = [];
                var on_ego = this.id.split("_")[1];
                var label_class_checked = '#sub_' + on_ego +':checked';
                $(label_class_checked).each(function(){
                    var e = this.value.split("_")[0];
                    var c = this.value.split("_")[1];
                    on_ego = e;
                    self.temp_selecting.push(c);
                });
                self.label_display[on_ego] = self.temp_selecting;
                self.model.set({"display_egos":self.label_display});
                // no display trees
                if(jQuery.isEmptyObject(self.label_display)){
                    self.model.set({"leaf_scale":3});
                    self.model.set({"fruit_scale":3});
                    self.model.set({"sub_leaf_len_scale":1});
                    self.model.set({"dtl_branch_curve":1});
                    self.model.set({"canvas_translate":[0, 0]});
                    self.model.set({"canvas_scale":0.15});
                    self.model.set({"root_curve":0});
                    self.model.set({"root_len_scale":1});
                    self.model.trigger('change:attribute');
                    self.update_slider();
                }
                self.model.trigger('change:display_egos');
            });
        }
                
    },

    update_slider: function(){
        var self = this;
        
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
        // $("#filter_contact").ionRangeSlider("update", {
        //     from: 0
        // });              
    }


});

