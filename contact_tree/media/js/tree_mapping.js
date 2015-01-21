// mapping
var MappingView = Backbone.View.extend({

    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in mapping initialize");
        // _.bindAll(this, 'set_option');
        _.bindAll(this, 'set_component');

        util.sampleTree("ori", "sidekey_tree");

        // this.mode = self.model.get("view_mode");
        
        $( "#sidekey_dialog" ).dialog({
            autoOpen: false,
            height: 490,
            width: 770,
            modal: true
        });
        $( "#map" ).click(function() {
            $( "#sidekey_dialog" ).dialog( "open" );
            self.myattribute = JSON.parse(JSON.stringify(self.model.get("attribute")));
            // self.set_option();
            self.set_component();
            // self.model.set({"attribute": default_attribute["diary"]});
            //document.getElementById('c').style.visibility='hidden';//'visible';
        });

        // this.model.bind('change:view_mode', this.set_option);
        // this.model.bind('change:attribute', this.set_option);
        this.model.bind('change:attribute', this.set_component);
        // this.attribute = self.model.get("attribute");
        this.myattribute = {};
        this.attr_array = [];
        
        this.data_mode = self.model.get("view_mode");
        this.set_default = default_attribute[this.data_mode];
    },

    highlight_key: function(){
        var self = this;
        $("#stick").mouseover(function(){
            util.sampleTree(" ", "sidekey_tree");
        });
        $("#trunk").mouseover(function(){
            util.sampleTree("side", "sidekey_tree");
        });
        $("#branch").mouseover(function(){
            util.sampleTree("branch", "sidekey_tree");
        });
        $("#bside").mouseover(function(){
            util.sampleTree("bside", "sidekey_tree");
        });
        $("#leaf_size").mouseover(function(){
            util.sampleTree("lsize", "sidekey_tree");
        });
        $("#leaf_color").mouseover(function(){
            util.sampleTree("lbright", "sidekey_tree");
        });
        $("#fruit").mouseover(function(){
            util.sampleTree("fruit", "sidekey_tree");
        });
    },

    // not use
    set_option: function(){
        var self = this;
        // var data_mode = self.model.get("view_mode");
        this.data_mode = self.model.get("view_mode");
        var attr_item = self.model.get("attr_option");
        this.attribute = self.model.get("attribute");
        // console.log("attribute attr_item", attr_item);
        // console.log("attribute", this.attribute);
        $("#sidekey_button").empty();
        $("#sidekey_selection").hide();
        this.highlight_key();
        if(this.data_mode == "diary" || this.data_mode == "DBLP" || this.data_mode == "inter"){
            $("#sidekey_selection").show();
            for(var l = 0; l < default_component.length; l++){
                // var id = "#" + default_component[l];

                var container = document.getElementById(default_component[l]);
                var map_id = "#" + default_component[l];
                $(map_id).empty();
                container.setAttribute("class", "mapping_selector component_selector");
                for(var a = 0; a < attr_item.length; a++){
                    var selection_opt = document.createElement('option');
                    selection_opt.value = attr_item[a];

                    selection_opt.innerHTML = mapping_label[this.data_mode][attr_item[a]];
                    selection_opt.setAttribute("class", "myfont3");
                    if(a == l){
                        selection_opt.setAttribute("selected", true);
                    }
                    container.appendChild(selection_opt);
                    // $(id).append(selection_opt);
                }
                /*
                var none_opt = document.createElement('option');
                none_opt.value = "none";
                none_opt.innerHTML = "none";
                none_opt.setAttribute("class", "myfont3");
                container.appendChild(none_opt);
                */
            }
            $("#sidekey_button").append('<button class="btn btn-default right" id="get">Submit</button>');
            $("#sidekey_button").append('<button class="btn btn-default right" id="default">Default</button>');
            this.set_sidekey_event();
        }
        else{
            util.sampleTree("ori", "sidekey_tree");
        }

    },

    set_component: function(){
        var self = this;
        // var data_mode = self.model.get("view_mode");
        this.data_mode = self.model.get("view_mode");
        var attr_item = self.model.get("attr_option");
        this.attribute = self.model.get("attribute");
        var folder = self.model.get("folder");
        // console.log("cmpt", component_attribute[folder]);
        // console.log(folder);
        // console.log("attribute attr_item", attr_item);
        // console.log("attribute", this.attribute);
        $("#sidekey_button").empty();
        $("#sidekey_selection").hide();
        this.highlight_key();
        // $('#row_root').css('visibility', 'hidden');
        if(this.data_mode == "diary" || this.data_mode == "DBLP" || this.data_mode == "inter"){
            $("#sidekey_selection").show();
            for(var l = 0; l < default_component.length; l++){
                // var id = "#" + default_component[l];
                var container = document.getElementById(default_component[l]);
                var map_id = "#" + default_component[l];
                $(map_id).empty();
                container.setAttribute("class", "mapping_selector component_selector");
                
                var cmpt = component_attribute[folder][default_component[l]];

                if(this.data_mode == "DBLP"){
                    $('#row_root').css('visibility', 'visible');
                    var cmpt_index = default_component[l];
                    if(attr_item[0] == "coauthor"){
                        cmpt_index = "author_"+cmpt_index;
                        // console.log("#######", cmpt_index)
                        var cmpt = component_attribute[folder][cmpt_index];
                    }
                    else if(attr_item[0] == "paper_id"){
                        cmpt_index = "paper_"+cmpt_index;
                        // console.log("#######", cmpt_index)
                        var cmpt = component_attribute[folder][cmpt_index];
                    }
                }
                // if(this.data_mode == "diary"){
                //     $('#row_root').css('visibility', 'visible');
                //     cmpt = component_attribute[folder][default_component[l]];
                // }

                for(var a = 0; a < cmpt.length; a++){
                    // console.log("'''", cmpt[a], attr_item[l])
                    var selection_opt = document.createElement('option');
                    selection_opt.value = cmpt[a];
                    // selection_opt.innerHTML = cmpt[a];
                    if(this.data_mode == "DBLP"){
                        selection_opt.innerHTML = DBLP_attribute[cmpt[a]];
                    }
                    else{
                        selection_opt.innerHTML = cmpt[a];
                    }
                    selection_opt.setAttribute("class", "myfont3");
                    if(cmpt[a] == attr_item[l]){
                        selection_opt.setAttribute("selected", true);
                    }
                    container.appendChild(selection_opt);
                    // $(id).append(selection_opt);
                }
            }
            $("#sidekey_button").append('<button class="btn btn-default right" id="get">Submit</button>');
            $("#sidekey_button").append('<button class="btn btn-default right" id="default">Default</button>');
            this.set_sidekey_event();
        }
        else{
            util.sampleTree("ori", "sidekey_tree");
        }
    },

    set_sidekey_event: function(){
        var self = this;

        $("#default").click(function(){
            self.attr_array = [];
            self.myattribute = {};
            // $("#trunk option").eq(0).prop('selected', true);//option's value
            // $("#branch option").eq(1).prop('selected', true);
            // $("#bside option").eq(2).prop('selected', true);
            // $("#leaf_color option").eq(3).prop('selected', true);
            // $("#leaf_size option").eq(4).prop('selected', true);
            // $("#fruit option").eq(5).prop('selected', true);
            // if(self.data_mode == "DBLP"){
            var attr_item = mapping_item[self.data_mode];
            for(var l = 0; l < default_component.length; l++){
                // var id = "#" + default_component[l];
                var container = document.getElementById(default_component[l]);
                var map_id = "#" + default_component[l];
                $(map_id).empty();
                container.setAttribute("class", "mapping_selector component_selector");
                
                var cmpt = component_attribute[self.data_mode][default_component[l]];
                var cmpt_index = default_component[l];
                var cmpt = component_attribute[self.data_mode][cmpt_index];
                if(self.data_mode == "DBLP"){
                    cmpt_index = "author_" + default_component[l];
                    cmpt = component_attribute[self.data_mode][cmpt_index];
                }
                
                for(var a = 0; a < cmpt.length; a++){
                    var selection_opt = document.createElement('option');
                    selection_opt.value = cmpt[a];
                    selection_opt.innerHTML = cmpt[a];
                    if(self.data_mode == "DBLP")
                        selection_opt.innerHTML = DBLP_attribute[cmpt[a]];
                    
                    selection_opt.setAttribute("class", "myfont3");
                    if(cmpt[a] == attr_item[l]){
                        selection_opt.setAttribute("selected", true);
                    }
                    container.appendChild(selection_opt);
                    // $(id).append(selection_opt);
                }
            }
            // }

            // else{
            //     $("#stick option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][0]+'"]').prop('selected', true);//option's value
            //     $("#trunk option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][1]+'"]').prop('selected', true);//option's value
            //     $("#branch option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][2]+'"]').prop('selected', true);
            //     $("#bside option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][3]+'"]').prop('selected', true);
            //     $("#leaf_color option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][4]+'"]').prop('selected', true);
            //     $("#leaf_size option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][5]+'"]').prop('selected', true);
            //     $("#fruit option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][6]+'"]').prop('selected', true);
            //     // $("#root option").prop('selected', false).filter('[value="'+mapping_item[self.data_mode][7]+'"]').prop('selected', true);

            // }
            
            
            
            self.myattribute = default_attribute[self.data_mode];
            // console.log("set default", self.myattribute);

            for(var c in self.myattribute){
                if(self.myattribute[c] != "none"){
                    self.attr_array.push(self.myattribute[c]);
                }
            }
            // console.log("change attr4", self.myattribute);
            // console.log("change attr5", self.attr_array);
            $('#get').removeAttr("disabled");
            $('#warnig').css('visibility', 'hidden');
            
            // self.set({"attribute": default_attribute["diary"]});
        });

        $(".mapping_selector").change(function(){
            // self.myattribute = JSON.parse(JSON.stringify(self.model.get("attribute")));
            // self.myattribute = self.model.get("attribute");
            // console.log("changing stick mapping:", this.id)
            self.myattribute[this.id] = this.value;
            self.attr_array = [];
            // for channging stick attribure to map to the right mapping
            if(self.data_mode == "DBLP" && this.id == "stick"){
                console.log("changing stick mapping:", this.id)
                for(var l = 1; l < default_component.length; l++){
                    var container = document.getElementById(default_component[l]);
                    var map_id = "#" + default_component[l];
                    $(map_id).empty();
                    container.setAttribute("class", "mapping_selector component_selector");
                    
                    var cmpt_index = default_component[l];
                    if(this.value == "coauthor"){
                        cmpt_index = "author_" + cmpt_index;
                        // var cmpt = component_attribute[folder][cmpt_index][0];
                    }
                    else if(this.value == "paper_id"){
                        cmpt_index = "paper_" + cmpt_index;
                        // var cmpt = component_attribute[folder][cmpt_index][0];
                    }
                    var cmpt = component_attribute["DBLP"][cmpt_index];
                    self.myattribute[default_component[l]] = component_attribute["DBLP"][cmpt_index][0];

                    for(var a = 0; a < cmpt.length; a++){
                        var selection_opt = document.createElement('option');
                        selection_opt.value = cmpt[a];
                        // selection_opt.innerHTML = cmpt[a];
                        selection_opt.innerHTML = DBLP_attribute[cmpt[a]];
                        
                        selection_opt.setAttribute("class", "myfont3");
                        if(a == 0){
                            selection_opt.setAttribute("selected", true);
                        }
                        container.appendChild(selection_opt);
                    }
                }
            }
            
            for(var c in self.myattribute){
                if(self.myattribute[c] != "none" && c != "root"){
                    self.attr_array.push(self.myattribute[c]);
                }
            }
            
            // console.log("change attr1", self.myattribute);
            var check_attr = self.attr_array.filter(util.unique);
            // console.log("change attr2", self.attr_array);
            // console.log("s attr3", check_attr);

            if(check_attr.length < self.attr_array.length){
                $('#get').attr("disabled", true);
                $('#warnig').css('visibility', 'visible');
            }
            else{
                $('#get').removeAttr("disabled");
                $('#warnig').css('visibility', 'hidden');
            }

        });

        $("#get").click(function(){
            var new_attr = "";
            for(var c = 0; c < default_component.length; c++){
                var id = "#" + default_component[c];
                self.myattribute[$(id).attr('id')] = $(id).val();
                
                if(c == default_component.length-1){
                    new_attr = new_attr + $(id).val();
                }
                else{
                    new_attr = new_attr + $(id).val() + ",";
                }
                // console.log("final idd", $(id).attr('id'), $(id).val());
            }

            var temp_attr_option = [];
            for(var c in self.myattribute){
                temp_attr_option.push(self.myattribute[c]);
            }

            /*
            d3.json("set_attr/?attr=" + new_attr, function(result) {
                console.log("in model.set_attr");
            });
            */
            $('#get').attr("disabled", true);
            $('#default').attr("disabled", true);
            $("#get").text("Loading");
            var all_ego = self.model.get("selected_egos");
            var folder = self.model.get("folder");
            
            if(self.data_mode == "diary"){
                // trigger query ego
                var requst = new_attr + ":" + folder;
                for(var e in all_ego){
                    requst = requst + "/" + e;
                    for(var s = 0; s < all_ego[e].length; s++){
                        requst = requst + "_" + all_ego[e][s];
                    }
                }
                self.model.update_query_data(requst);
            }
            else if(self.data_mode == "inter"){
                $('#get').attr("disabled", true);
                $('#default').attr("disabled", true);
                $("#get").text("Loading");
                var requst = new_attr + ":" + Object.keys(all_ego)[0];
                for(var e = 1, len = Object.keys(all_ego).length; e < len; e++){
                    requst = requst + "_" + Object.keys(all_ego)[e];
                }
                self.model.query_data(requst);                
            }

            else if(self.data_mode == "DBLP"){
                $('#get').attr("disabled", true);
                $('#default').attr("disabled", true);
                $("#get").text("Loading");
                var requst = new_attr + ":" + Object.keys(all_ego)[0];
                for(var e = 1, len = Object.keys(all_ego).length; e < len; e++){
                    requst = requst + "/" + Object.keys(all_ego)[e];
                }
                // console.log("--", requst);
                self.model.update_query_data(requst);                
            }

            self.attr_option = temp_attr_option;
            // console.log("final attr_option", self.attr_option);
            // console.log("final attr", self.myattribute);
            self.model.set({"attr_option": self.attr_option});
            self.model.set({"attribute": self.myattribute});
            self.model.set({"moving": 0});
            // self.model.trigger('change:attribute');
            // $( "#sidekey_dialog" ).dialog( "close" );
        });
        
    }


});
