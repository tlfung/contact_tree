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
        
        this.el_selecting_label = $("#selecting_label");
        this.el_selecting_ego = $("#selecting_ego");

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
        
        self.el_selecting_ego.empty();

        // set the label
        // var label = document.getElementById("selecting_label");
        // label.innerHTML = all_tree + ":";
        self.el_selecting_label.html(all_tree + ":");
        var label_btn = document.getElementById("selecting_ego");
        
        if(group != "all"){
            for(s in self.label_selected){
                var gen_id = s.replace(/[^a-zA-Z1234567890 ]/g, "").replace(/ /g, "");
                var opt = $('<div class="dropdown left" style="margin-left:10px; position:relative"></div>');

                var remove_btn = $('<span class="glyphicon glyphicon-remove-circle" style="position: absolute; top:-4px; right:-4px; display:none;"></span>');
                remove_btn.val(gen_id).attr('id', "delect_ego_" + gen_id).attr('name', s);
                
                var opt_btn = $('<button class="dropdown-toggle ego_label btn" data-toggle="dropdown"></button>');
                opt_btn.val(gen_id).attr('id', "label_" + gen_id).attr('name', s).html("EGO " + s.toUpperCase());
                
                var opt_menu = $('<ul class="dropdown-menu" role="menu"></ul>');
                
                var count_checked = 0;
                for(var c = 0; c < self.label_selected[s].length; c++){
                    var id = "#selected_ego_" + self.label_selected[s][c];
                    var opt_row = $('<li></li>');
                    opt_row.attr("id", "selected_ego_" + self.label_selected[s][c]);
                    
                    var lb = $('<label class="checkbox"></label>');
                    lb.html(self.label_selected[s][c]);
                    
                    var ip = $('<input class="label_checkbox" type="checkbox"></input>');
                    ip.val(gen_id + "_" + self.label_selected[s][c]).attr('name', s).attr('id', 'sub_'+gen_id)

                    if(count_checked < self.label_display[s].length && self.label_display[s][count_checked] == self.label_selected[s][c]){
                        ip.prop('checked', true);
                        count_checked++;
                    }
                                                  
                    lb.append(ip);
                    opt_row.append(lb);
                    opt_menu.append(opt_row);
                }
                opt.append(opt_btn);
                opt.append(opt_menu);                
                opt.append(remove_btn);

                self.el_selecting_ego.append(opt);

            }
            $('.dropdown-menu').on('click', function (e) { // e?? on vs click??
                e.stopPropagation();
            });

            this.set_label_event(group);
        }

        // no need to have dropdown menu
        else{
            for(s in self.label_selected){
                var gen_id = s.replace(/[^a-zA-Z1234567890 ]/g, "").replace(/ /g, "");
                var opt = $('<div class="left" style="margin-left:10px; position:relative"></div>');
                
                var remove_btn = $('<span class="glyphicon glyphicon-remove-circle" style="position: absolute; top:-4px; right:-4px; display:none;"></span>');
                remove_btn.val(gen_id).attr('id', "delect_ego_" + gen_id).attr('name', s);
                
                var opt_btn = $('<button class="ego_label btn"></button>');
                opt_btn.val(gen_id).attr('id', "label_" + gen_id).attr('name', s).html("EGO " + s.toUpperCase());

                opt.append(opt_btn);
                
                opt.append(remove_btn);
                self.el_selecting_ego.append(opt);
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
            var s = s_store.replace(/[^a-zA-Z1234567890 ]/g, "").replace(/ /g, "");;
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
                delete self.label_selected[this.attributes["name"].value];
                delete self.label_display[this.attributes["name"].value];
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
                return false;                
            });
            
        }
        // only for clicking the dropdown menu
        if(group != "all"){
            $('.label_checkbox').change(function() {
                self.temp_selecting = [];
                var on_ego_id = this.id.split("_")[1];
                var on_ego = this.attributes["name"].value;
                var label_class_checked = '#sub_' + on_ego_id +':checked';
                $(label_class_checked).each(function(){
                    var e = this.value.split("_")[0];
                    var c = this.value.split("_")[1];
                    // on_ego = this.attributes["name"].value;
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

