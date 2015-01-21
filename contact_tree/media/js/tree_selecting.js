// selecting
var SelectingView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in selecting initialize");
        _.bindAll(this, 'change_mode');
        // _.bindAll(this, 'set_dblp_label');
        // _.bindAll(this, 'set_diary_label');
        _.bindAll(this, 'set_label');

        this.model.bind('change:view_mode', this.change_mode);
        this.model.bind('change:folder', this.change_mode);
        // this.model.bind('change:done_query_list', this.set_dblp_label);
        // this.model.bind('change:done_query_list', this.set_diary_label);
        this.model.bind('change:done_query_list', this.set_label);
        
        this.my_diary_selected = {};
        this.my_diary_display = {};
        this.my_dblp_display = {};
        this.my_dblp_selected = {};
        this.my_ego = 0;
        this.author_name = "";
        this.author_publication = 0;
        this.author_area = "";
        this.set_area = 0;
        // default setting??

        // open the dialog
        $( "#menu_dialog" ).dialog({
            autoOpen: false,
            height: 400,
            width: 550,
            modal: true
        });
        $( "#menu" ).click(function() {
            var mode = self.model.get("view_mode");
            $( "#menu_dialog" ).dialog( "open" );
            // self.model.set({"selected_egos":{}});
            this.my_diary_selected = self.model.get("selected_egos");
            this.my_diary_display = self.model.get("display_egos");
            
            // clean checked
            $("#sub_selection").empty();
            $('.ego_checkbox:checked').each(function(i, item){
                this.checked = item.defaultChecked;
            });
            if(mode == "diary" || mode == "DBLP"){
                $("#detail_menu").hide();
            }
                      
        });

    },

    change_mode: function(){
        var self = this;
        var mode = self.model.get("view_mode");
        if(mode == "diary"){
            this.diary_option();
            // change tree component item
        }
        else if(mode == "inter"){
            this.inter_option();
            /*
            d3.json("inter/?inter=be", function(result) {
              console.log("in model.query_data_inter");
              console.log(result);
              var egos_data = self.model.get("egos_data");
              var tree_structure = self.model.get("tree_structure");
              if(mode in egos_data){}
              else{
                egos_data[mode] = {};
                tree_structure[mode] = {};
              }
              // var tree_structure = self.get("tree_structure");
              var set_inter_json = function(data){
                tree_structure[mode]["inter"] = {};
                tree_structure[mode]["inter"]["be"] = data;
                console.log("store", tree_structure);
                self.model.set({"tree_structure": tree_structure});
                
              };
               set_inter_json(result);
               var e = {"be": ["inter"]};
               self.model.set({"display_egos": e});
               self.model.set({"selected_egos": e});
               self.model.trigger('change:tree_structure');
                  
              });
            */
        }
        else if(mode == "DBLP"){
            this.dblp_option();
        }
        else{
            $("#divTable_menu").empty();
            $("#submit_dblp").hide();
            $("#main_title").hide();
            $("#main_title").hide();
            $("#divTable_menu").hide();
            $("#search_option").hide();
            $("#search_menu").hide();
            $("#submit_search").hide();
            $("#sub_selection").hide();
            $("#submit_diary").hide();
            $("#sub_title").hide();
            $("#submit_inter").hide();
            $("#detail_menu").hide();
            this.my_dblp_display = {};
            this.my_dblp_selected = {};
        }
    },

    set_label: function(){
        var self = this;
        var mode = self.model.get("view_mode");
        if(mode == "diary"){
            this.set_diary_label();
            // change tree component item
        }
        else if(mode == "inter"){
            this.set_inter_label();
        }
        else{
            this.set_dblp_label();
        }

    },

    inter_option: function(){
        var self = this;
        $("#divTable_menu").empty();
        $("#submit_dblp").hide();
        $("#main_title").show();
        $("#main_title").text("Select Countries:");
        $("#divTable_menu").show();
        $("#search_option").hide();
        $("#search_menu").hide();
        $("#submit_search").hide();
        $("#sub_selection").hide();
        $("#submit_diary").hide();
        $("#sub_title").hide();
        $("#submit_inter").show();
        $("#detail_menu").show();
        this.my_dblp_display = {};
        this.my_dblp_selected = {};
        self.author_name = "";
    },

    set_inter_label: function(){
        var self = this;

        for(var c = 0; c < international_countries.length; c++){
            var countries = countries_label[international_countries[c]];
            // <label><input class="myfont3 sub_option" type="checkbox"
            $("#divTable_menu").append('<div><label><input class="myfont3 country_option" type="checkbox" id="' + international_countries[c] + '" value="' + international_countries[c] +'" style="margin-right:5px;">' + countries + '</label></div>');
        }
        
        $("#submit_inter").click(function(){
            var checked_countries = [];
            var country_ego = {};
            // console.log(checked_countries);
            $('#submit_inter').attr("disabled", true);
            $('.country_option').attr("disabled", true);
            $("#submit_inter").text("Loading");
            $('.country_option:checked').each(function(){
                checked_countries.push($(this).val());
                country_ego[$(this).val()] = ["inter"];
            });
            var now_attr = self.model.get("attr_option");
            var requst = now_attr[0];
            for(var a = 1; a < now_attr.length; a++){
                requst = requst + "," + now_attr[a];
            }
            requst = requst + ":" + checked_countries[0];
            for(var s = 1; s < checked_countries.length; s++){
                requst = requst + "_" + checked_countries[s];
            }
            self.model.query_data(requst);
            // var e = {"be": ["inter"]};
            self.model.set({"selected_egos": country_ego});
            self.model.set({"display_egos": country_ego});
            
            // self.model.query_data(requst);
            // self.model.trigger('change:selected_egos');
        });

    },

    diary_option: function(){
        var self = this;
        // var name = "EGO ";
        // var sub = "";
        // var select_ego = [];
        $("#divTable_menu").empty();
        $("#detail_menu").hide();
        $("#submit_dblp").hide();
        $("#submit_inter").hide();
        // $("#sub_title").hide();
        $("#main_title").show();
        $("#main_title").text("Select Ego:");
        $("#divTable_menu").show();
        $("#search_option").hide();
        $("#search_menu").hide();
        $("#submit_search").hide();
        this.my_dblp_display = {};
        this.my_dblp_selected = {};
        self.author_name = "";
        
    },

    set_diary_label:function(){
        var self = this;
        var name = "EGO ";
        var sub = "";
        var select_ego = [];
        
        function opt_change(ego){
            // console.log("in opt_function", ego);
            // console.log("in opt_function", self.my_diary_selected);
            $("#sub_selection").empty();
            $("#sub_selection").show();
            $("#submit_diary").show();
            $('.ego_checkbox').attr("disabled", true);
            var ego_time = [];
            for(var c = 0; c < time.length; c++){
                for(var c1 = 0; c1 < total_ego[time[c]].length; c1++){
                    if(total_ego[time[c]][c1] == ego){
                        ego_time.push(time[c]);
                        break;
                    }
               }
            }
            // var check_done = self.model.get("done_query");
            var folder = self.model.get("folder");
            var now_attr = self.model.get("attr_option");
            
            $('#submit_diary').attr("disabled", true);
            $("#submit_diary").text("Loading");
            var requst = now_attr[0];
            for(var a = 1; a < now_attr.length; a++){
                requst = requst + "," + now_attr[a];
            }
            requst = requst + ":" + folder + "_" + ego;
            for(var s = 0; s < ego_time.length; s++){
                requst = requst + "_" + ego_time[s];
            }
            // self.model.set({"now_query":requst});
            
            // console.log("query_request", requst);
            // check_done.push(ego);
            // self.model.set({"done_query":check_done});
            self.model.query_data(requst);
            /*
            if(jQuery.inArray(ego, check_done) == -1){
                $('#submit_diary').attr("disabled", true);
                $("#submit_diary").text("Loading");
                var requst = folder + "_" + ego;
                for(var s = 0; s < ego_time.length; s++){
                    requst = requst + "_" + ego_time[s];
                }
                self.model.set({"now_query":requst});
                
                // console.log("query_request", requst);
                check_done.push(ego);
                self.model.set({"done_query":check_done});
                self.model.query_data(requst);
            }
            */
            
            for(var s = 0; s < ego_time.length; s++){

                if(s == ego_time.length-1)
                    $("#sub_selection").append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + ego_time[s] + '" id="' + ego_time[s] + '" checked>' + ego_time[s] + '</label>');            
                else
                    $("#sub_selection").append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + ego_time[s] + '" id="' + ego_time[s] + '">' + ego_time[s] + '</label>');            
                $("#sub_selection").append("<p></p>");
            }
            
            // button click event
            $("#submit_diary").click(function(){ // store selecting data
                // store last page's selections
                var display = [];
                select_ego = [];
                var total = 0;
                $('.sub_option:checked').each(function(){
                    //alert($(this).val());
                    select_ego.push($(this).val());
                    total++;
                });
                self.my_diary_selected[self.my_ego] = select_ego;
                display.push(select_ego[total-1]);
                self.my_diary_display[self.my_ego] = display;
                
                self.model.set({"display_egos":self.my_diary_display});
                self.model.set({"selected_egos":self.my_diary_selected});
                
                self.model.set({"canvas_translate":[0, 0]});
                self.model.set({"canvas_scale":0.15});
                self.model.trigger('change:display_egos');
                self.model.trigger('change:selected_egos');
                $( "#menu_dialog" ).dialog( "close" );
            });
        }

        // all ego selections
        for(var c = 0; c < total_ego[time[0]].length; c++){
            var check_amont = 0;
            for(var t = 0; t < time.length; t++){
                for(var t1 = 0; t1 < total_ego[time[t]].length; t1++){
                    if(total_ego[time[t]][t1] == total_ego[time[0]][c]){
                        check_amont++;
                        break;
                    }
               }
            }
            $("#divTable_menu").append('<div><label><input class="myfont3 ego_checkbox" name="ego_selection" type="radio" id="' + total_ego[time[0]][c] + '" value="' + total_ego[time[0]][c] +'" style="margin-right:5px;">' + name + ' ' + total_ego[time[0]][c] + ' ('+ check_amont +')</label></div>');
        }
         
        // sub = $('.sub_option:checked').val();
        // single selection with same name
        $('.ego_checkbox').change(function() {
            var checked_ego = $('.ego_checkbox:checked').val();
            // var instructure = checked_ego
            $("#sub_title").show();
            $("#sub_title").text("year");
            $("#detail_menu").show();
            // querying
            self.my_ego = checked_ego;
            opt_change(checked_ego);
            // $('.ego_checkbox:checked').prop('checked', false); // dont know
        });

    },

    dblp_option: function(){
        var self = this;
        self.my_diary_selected = {};
        self.my_diary_display = {};
       
        $("#sub_selection").hide();
        $("#detail_menu").hide();
        $("#submit_diary").hide();
        $("#submit_inter").hide();
        $("#main_title").show();
        $("#main_title").text("Search Ego:");
        $("#divTable_menu").hide();
        $("#submit_search").show();
        $("#search_option").show();
        
        if(this.set_area == 0){
            var container = document.getElementById("area_box");
            container.setAttribute("class", "area_selector");
            for(var s = 0; s < cat_dblp.length; s++){
                var selection_opt = document.createElement('option');
                selection_opt.value = cat_dblp[s];
                selection_opt.innerHTML = dblp_area_label[cat_dblp[s]];
                selection_opt.setAttribute("class", "myfont3");
                
                container.appendChild(selection_opt);
            }
            self.set_area = 1;
        }
        else{} // must?!

        var set_author = function(au_name){
            // $("#sub_selection").empty();
            self.model.query_one_author(au_name);
        }
        var set_author_list = function(au_name, au_total, au_area){
            // $("#sub_selection").empty();
            self.model.query_author_list(au_name, au_total, au_area);
        }

        $("#submit_search").off("click");
        $("#submit_search").click(function(){ // store selecting data
            total_ego["DBLP"] = [];
            self.author_name = $('#search_a_box').val();
            if($('#search_p_box').val() != ""){
                self.author_publication = $('#search_p_box').val();
            }
            else{
                self.author_publication = -1;
            }
            
            self.author_area = $('#area_box').val();
            // if(self.author_publication == -1 && self.author_area == " "){}
            // console.log(self.author_name, self.author_publication, self.author_area);
            set_author_list(self.author_name, self.author_publication, self.author_area);

            // if(self.author_name == ""){
            //     // total_ego["DBLP"] = [];
            // }
            // else{
            //     set_author(self.author_name)
            // }
            // if(self.author_publication == 0 && self.author_area == " "){}
            // else{
            //     // console.log(self.author_publication, self.author_area);
            //     set_author_list(self.author_name, self.author_publication, self.author_area);
            // }
            
            $("#detail_menu").show();
            $("#sub_title").text("Select Ego:");            
            $("#submit_dblp").show(); 
            $('#submit_dblp').attr("disabled", true);
            $("#submit_dblp").text("Loading");
            $("#sub_selection").show();
            
        }); 
        
        // $("#submit_button").empty();
        // $("#sidekey_button").empty();
    },

    set_dblp_label:function(){ // when the container is created
        var self = this;
        $('.au_checkbox').change(function() {
            $("#submit_dblp").show(); 
            $('#submit_dblp').attr("disabled", true);
            $("#submit_dblp").text("Loading");
            $('.au_checkbox').attr("disabled", true);
            $('#submit_search').attr("disabled", true);
            
            checked_au = $('.au_checkbox:checked').val();
            self.my_ego = checked_au;
            // self.model.query_data(self.my_ego);

            var now_attr = self.model.get("attr_option");

            var requst = now_attr[0];
            for(var a = 1; a < now_attr.length; a++){
                requst = requst + "," + now_attr[a];
            }
            requst = requst + ":" + self.my_ego;
            self.model.query_data(requst);
            var checked_au = $('.au_checkbox:checked').val();
            
            // console.log("DBLP request", requst);
        });

        $("#submit_dblp").off("click");
        $("#submit_dblp").click(function(){ // store selecting data
            self.my_dblp_display[self.my_ego] = ["author"];
            self.my_dblp_selected[self.my_ego] = ["author"];

            self.model.set({"selected_egos": self.my_dblp_selected});
            self.model.set({"display_egos": self.my_dblp_display});

            self.model.trigger('change:selected_egos');
            self.model.trigger('change:display_egos');
            $( "#menu_dialog" ).dialog( "close" );            
            
        });
    }

});
