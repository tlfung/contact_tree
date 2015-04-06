var Tree_Model = Backbone.Model.extend({
	defaults: {
	    // egos_data: {},
	    // dblp_data: {},
	    selected_egos: {},
	    display_egos: {},
	    tree_structure: {},
	    canvas_scale: 0.15,
	    canvas_translate: [0, 0],
	    done_query: [],
	    snapshot: [],
	    // now_query: " ",
	    done_query_list: 0, // use for query author

	    done_table_loading: [],

	    attr_option: [],
	    attribute: {},
	    // component: [],
	    // attribute_info: {},
	    // component_attribute: {},
	    dataset_group: "",
	    stick_unique: "",

	    fruit_control: 1,
	    tree_data: {},

	    // tree_style:["symmetry"],
	    tree_style:["symmetry"],

	    view_mode: "",
	    // folder:"",

	    leaf_scale: 3,
	    fruit_scale: 3,
	    root_curve: 0,
	    root_len_scale: 1,
	    sub_leaf_len_scale: 1,
	    dtl_branch_curve: 1,
	    // abt_branch_curve: 1,

	    canvas_grid: [],
	    snap_grid: [],
	    info_table: {},
	    canvas_detail: 1.5,

	    canvas_height: 0,
	    canvas_width: 0,
	    moving: 0,
	    clicking_leaf: -1,

	    leaf_switch: 1,
	    fruit_switch: 0,

	    filter_contact: 0,
	    filter_alter: 0,
	    tree_boundary: {},
	    save_tree: [],
	    dataset_mode: ["combine_diary", "international"],
	    user_mapping: []
	    // stick:"coauthor"
  	},

  	initialize: function(args) {
	    var self = this;
	    user_history = 0;
	    console.log("in model initialize");
	    // get all the values of model

	    if(first_use == 0)
	    	return;

	    var request = session_id + ":-" + last_use;
	    var request_url = "get_user_data/?user="+request;
	    var get_auto_saving = function(result){
			// var restore_array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // total = 15
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
			restore_array.push(result.group); // attr_info
			// restore_array.push(JSON.parse(result.component_attr)); // attr_info

	        self.set({"view_mode": restore_array[0]}, {silent: true});
	        self.set({"display_egos": restore_array[1]}, {silent: true});
	        self.set({"selected_egos": restore_array[2]}, {silent: true});
	        self.set({"leaf_scale": restore_array[3]}, {silent: true});
	        self.set({"fruit_scale": restore_array[4]}, {silent: true});
	        self.set({"sub_leaf_len_scale": restore_array[5]}, {silent: true});
	        self.set({"dtl_branch_curve": restore_array[6]}, {silent: true});
	        self.set({"root_curve": restore_array[7]}, {silent: true});
	        self.set({"root_len_scale": restore_array[8]}, {silent: true});
	        self.set({"canvas_scale": restore_array[9]}, {silent: true});
	        self.set({"filter_contact": restore_array[10]}, {silent: true});
	        self.set({"tree_boundary": restore_array[11]}, {silent: true});
	        self.set({"canvas_translate": restore_array[12]}, {silent: true});
	        total_ego = restore_array[13];
	        self.set({"dataset_group": restore_array[15]}, {silent: true});
	        // component_attribute[view_mode] = restore_array[16]

			self.set({"attribute": restore_array[14]["attr"]}, {silent: true});
			attribute_mapping = restore_array[14]["map_info"];
			mapping_color.render_leaf_color = restore_array[14]["render_leaf_color"];
			mapping_color.render_roots_color = restore_array[14]["render_roots_color"];
			$("#dataselect").trigger('change');

			// self.trigger('change:attribute');
			// self.trigger('change:view_mode');
			// self.trigger('change:dataset_mode');
			// self.trigger('change:selected_egos');
			// self.trigger('change:canvas_scale'); 
		};

	    d3.json(request_url, function(user_result){
			// console.log(user_result);
			
			var restore_structure = function(){
				var set_structure = function(data, all_ego){
			        var ego_selections = self.get("selected_egos");
			        if(jQuery.isEmptyObject(ego_selections)){
			            $("#block_page").hide();
			            return
			        }
			        var data_mode = self.get("view_mode");
			        
			        var tree_structure = self.get("tree_structure");
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
			        self.set({"tree_structure": tree_structure}, {silent: true});
			        $("#block_page").hide();   
				};

				var data_group = self.get("dataset_group");
	            var now_attr = self.get("attribute");
	            var now_mode = self.get("view_mode");;
	            var all_ego = self.get("selected_egos");
	            var ego_list = [];
	            
				for(var ego in all_ego){
	                ego_list.push(ego);
	            }
	            var request = JSON.stringify(now_attr) + ":-" + JSON.stringify(ego_list) + ":-" + now_mode + ":-" + JSON.stringify(attribute_mapping) + ":-" + data_group + ":-" + JSON.stringify(all_ego);
	            var request_url = "restore_data/?restore="+request;
	            
	            $("#block_page").show();

	            d3.json(request_url, function(result) {
	                set_structure(result, ego_list);
	                self.trigger('change:tree_structure');
	            }); 
			};

			if(!jQuery.isEmptyObject(user_result)){
				get_auto_saving(user_result);
		        // restore_structure();
		        // user_history = 1;
		    }

			// self.trigger('change:attribute');
			// self.trigger('change:view_mode');
			// self.trigger('change:dataset_mode');
			// self.trigger('change:selected_egos');
			// self.trigger('change:canvas_scale');  
		});
	    // self.set({"view_mode": session_id + "_of_combine_diary"});
  	},

  	query_dataset: function(request){
	    var self = this;
	    var request_url = "dataset/?data="+request;
	    d3.json(request_url, function(result){
			console.log("in model.query_dataset");
			// console.log(result)
			var set_dataset_json = function(data){
				for(var d = 0; d < data.length; d++){
			  		dataset_mode.push(data[d]);
				}
			};
          	set_dataset_json(result);
          	var container = document.getElementById("dataselect");
          	container.setAttribute("class", "dataset_selector");
          	for(var s = 0; s < dataset_mode.length; s++){
	            var selection_opt = document.createElement('option');
	            selection_opt.value = dataset_mode[s];
	            selection_opt.innerHTML = dataset_mode[s];
	            selection_opt.setAttribute("class", "myfont3");
            
            	container.appendChild(selection_opt);
          	}
          	// dataset_mode
		});

  	},

  	query_ego_list: function(table, group){
	    var self = this;
	    // console.log(request);
	    
        var set_ego_list_json = function(data){
          	total_ego = data;
          	var sub_array = [];
          	for(var d in data){
	            // var obj = {};
	            // obj[d] = data[d].length;
	            sub_array.push({sub: d, len: data[d].length});
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
        };

        var set_default_attr = function(data){
          	var single_attr = [];
          	// self.set({"attr_option": data});
          	self.set({"attribute": data});
          	for(a in data){
            	single_attr.push(data[a]);
          	}
          	self.set({"attr_option": single_attr});
        };

        var set_attribute_info = function(data){
        	var mode = self.get("view_mode");
        	component_attribute[mode] = {};
        	for(a in data){
        		component_attribute[mode][a] = data[a];
        	}
        	component_attribute[mode]["none"] = [["none"], 0, 0, 0, 1, "none"];
        };

	    	   
	    var request = table + ":-" + group;
	    var request_url = "datatable/?table="+request;
	    d3.json(request_url, function(result){
	        console.log(result);
	        
	        in_change_mode = 0;
	        set_ego_list_json(result[0]);
	        // console.log(user_history);
	        if(user_history == 0){
	        	set_default_attr(result[1]);
	        	set_attribute_info(result[2]);
	        }
	        else{
	        	set_default_attr(self.get("attribute"));
	        }
	        // set_attribute_info(result[2]);
	        var d = self.get("done_query_list");
	        self.set({"done_query_list": d+1});
	        self.trigger('change:attribute');        
	        // dataset_mode
	        initial_user = 1;
	        first_use = 1;
	    });
	   
	},

	// not use
	update_data: function(request){
	    var self = this;
	    var mode = self.get("view_mode");
	    $("#block_page").show();
        $("#loading_process").html("<b>Loading...</b>");

	    $("#submit_ego").attr("disabled", true);
      	$("#submit_ego").text("Loading");
      	$('.ego_checkbox').attr("disabled", true);
	    var request_url = "get_update/?contact="+request;
	    d3.json(request_url, function(result) {
	      	// console.log("in model.update_one_contact");
	      	// console.log(result);
	      	
	      	$("#submit_ego").removeAttr("disabled");
	      	$("#submit_ego").text("Done");
	      	$('.ego_checkbox').removeAttr("disabled");
	      	$("#block_page").hide();
	      	// self.trigger('change:tree_structure');

	    });
	    
	},

	query_data: function(request){
	    var self = this;
	    var mode = self.get("view_mode");
	    
	    // var request_url = "get_contact/?contact="+request;
	    var request_url = "get_update/?contact="+request;
	    // console.log(request_url);
	    $("#block_page").show();
        $("#loading_process").html("<b>Loading...</b>");
	    $("#submit_ego").attr("disabled", true);
	    $("#submit_ego").text("Loading");
	    $('.ego_checkbox').attr("disabled", true);
	    d3.json(request_url, function(result) {
	      	// console.log("in model.query_one_contact");
	      	// console.log(result);
	      	// var egos_data = self.get("egos_data");
	      	var tree_structure = self.get("tree_structure");
	      	if(mode in tree_structure){}
	      	else{
		        // egos_data[mode] = {};
		        tree_structure[mode] = {};
	      	}
	      	// var tree_structure = self.get("tree_structure");
	      	var set_structure = function(data, sub){

	        	for(var d in data){
	          		if(d in tree_structure[mode]){
	            		tree_structure[mode][d][sub] = data[d][sub];            
	          		}
	          		else{
	            		tree_structure[mode][d] = {};
	            		tree_structure[mode][d][sub] = data[d][sub];
	          		}
	        	}
		        // console.log("store", tree_structure);
		        self.set({"tree_structure": tree_structure}, {silent: true});
		        
		        // console.log("lucky", tree_structure);
	      	};
	      	// var new_attr = JSON.parse(request.split(":-")[0]);
		    var sub_request = JSON.parse(request.split(":-")[5]);
		    for(s in sub_request)
		    	set_structure(result, s);
	      	
	      	$("#submit_ego").removeAttr("disabled");
	      	$("#submit_ego").text("Done");
	      	$('.ego_checkbox').removeAttr("disabled");
	      	$("#block_page").hide();

	      	// self.trigger('change:tree_structure');
	      	// $("#submit_ego").removeAttr("disabled");
	      	// $("#block_page").hide();
	      	// $( "#menu_dialog" ).dialog( "close" );
	      	// self.trigger('change:selected_egos');
	      	// self.trigger('change:display_egos');            

	    });
	    
	},


	/************************* old code *********************************/
	update_query_data: function(request){
	    var self = this;
	    var mode = self.get("view_mode");
	    var egos_data = self.get("egos_data");
	    var tree_structure = self.get("tree_structure");
	    
	    if(mode == "diary"){
	      	var new_attr = request.split(":")[0];
	      	var sub_request = request.split(":")[1].split("/");
	      	var request_url = "update_contact/?contacts="+request;
	      	d3.json(request_url, function(result) {
	          	console.log("in model.update_query_data");
	          	// console.log(result);
	          	var set_diary_json = function(data){
	            	// egos_data[mode] = data;
	            	tree_structure[mode] = data;
	          	};
	          	set_diary_json(result);
	          	// self.trigger('change:egos_data');
	          	self.trigger('change:tree_structure');
	          	$("#sidekey_dialog").dialog( "close" );
	          	self.set({"tree_structure": tree_structure});
	      	});
	    }
	    else if(mode == "DBLP"){
	      	var new_attr = request.split(":")[0];
	      	var sub_request = request.split(":")[1].split("/");
	      	var request_url = "update_author/?author="+request;
	      	d3.json(request_url, function(result) {
	          	console.log("in model.update_query_data");
	          	// console.log(result);
	          	var set_diary_json = function(data){
	            	// egos_data[mode] = data;
	            	tree_structure[mode] = data;
	          	};
	          	set_diary_json(result);
	          	// self.trigger('change:egos_data');
	          	$("#sidekey_dialog").dialog( "close" );
	          	self.set({"tree_structure": tree_structure});
	          	self.trigger('change:tree_structure');
	      	});
	    }
	},

	query_author_list: function(request0, request1, request2){
	    var self = this;
	    var request_url = "dblp_list/?list=a:"+ request0 + "_p:" + request1 + "_f:" + request2;
	    var set_list = function(data){
	      	for(var d = 0; d < data.length; d++){
	        	total_ego["DBLP"].push(data[d]);
	      	}
	    };

	    d3.json(request_url, function(result) {
	        console.log("in model.query_author_list");
	        set_list(result);

	        $("#sub_selection").empty();
	        if(total_ego["DBLP"].length == 0){
	          	alert("Do not have enough information in database of this author!");
	        }
	        else{
	          	for(var c = 0; c < total_ego["DBLP"].length; c++){
	              	$("#sub_selection").append('<div><label><input class="myfont3 au_checkbox" name="author_selection" type="radio" id="' + c + '" value="' + total_ego["DBLP"][c] +'" style="margin-right:5px;">' + total_ego["DBLP"][c] + '</label></div>');
	          	}
	        }
	        
	        var d = self.get("done_query_list");
	        self.set({"done_query_list": d+1});

	    });
	}

});

var Data_Model = Backbone.Model.extend({
  	defaults: {
    
  	}

});
