var Tree_Model = Backbone.Model.extend({
	defaults: {
	    selected_egos: {},
	    display_egos: {},
	    tree_structure: {},
	    canvas_scale: 0.15,
	    canvas_translate: [0, 0],
	    done_query: [],
	    snapshot: [],
	    done_query_list: 0, // use for query author

	    done_table_loading: [],

	    attr_option: [],
	    attribute: {},
	    dataset_group: "",
	    stick_unique: "",

	    fruit_control: 1,
	    tree_data: {},

	    tree_style:["symmetry"],

	    view_mode: "",

	    leaf_scale: 3,
	    fruit_scale: 3,
	    root_curve: 0,
	    root_len_scale: 1,
	    sub_leaf_len_scale: 1,
	    dtl_branch_curve: 1,

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
  	},

  	initialize: function(args) {
	    var self = this;
	    user_history = 0;
	    console.log("in model initialize");
	    
	    // dont do anythnig if it is a new user 
	    if(first_use == 0)
	    	return;

	    // if(last_use != "none"){
	    // 	// user_history = 1;
	    // 	var view_mode = session_id.toString() + "_of_" + last_use;
	    // 	self.set({"view_mode": view_mode}, {silent: true});
	    // 	$("#dataselect").trigger('change');	    	
	    // 	return;
	    // }

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
		};

		// check if we found any user history
	    d3.json(request_url, function(user_result){
			if(!jQuery.isEmptyObject(user_result)){
				get_auto_saving(user_result);
		        // user_history = 1;
		    }

		});
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
		});

  	},

  	query_ego_list: function(table, group){
	    var self = this;
	    
	    // set the result function
        var set_ego_list_json = function(data){
          	total_ego = data;
          	var sub_array = [];
          	for(var d in data){
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
	        // only for the new dataset
	        if(user_history == 0){
	        	set_default_attr(result[1]);
	        	set_attribute_info(result[2]);
	        	user_history = 2;
	        }
	        else{
	        	set_default_attr(self.get("attribute"));
	        }
	        
	        var d = self.get("done_query_list");
	        self.set({"done_query_list": d+1});
	        self.trigger('change:attribute');        
	       	// label user as old user
	        initial_user = 1;
	        first_use = 1;
	    });
	   
	},

	// get the tree structure of selected ego
	query_data: function(request){
	    var self = this;
	    var mode = self.get("view_mode");
	    // var request_url = "get_contact/?contact="+request;
	    var request_url = "get_update/?contact="+request;
	    
	    $("#block_page").show();
        $("#loading_process").html("<b>Loading...</b>");
	    $("#submit_ego").attr("disabled", true);
	    $("#submit_ego").text("Loading");
	    $('.ego_checkbox').attr("disabled", true);
	    d3.json(request_url, function(result) {
	      	var tree_structure = self.get("tree_structure");
	      	if(mode in tree_structure){}
	      	else{
		        tree_structure[mode] = {};
	      	}
	    
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
		        
		        self.set({"tree_structure": tree_structure}, {silent: true});
		        
	      	};
	      	
		    var sub_request = JSON.parse(request.split(":-")[5]);
		    for(s in sub_request)
		    	set_structure(result, s);
	      	
	      	$("#submit_ego").removeAttr("disabled");
	      	$("#submit_ego").text("Done");
	      	$('.ego_checkbox').removeAttr("disabled");
	      	$("#block_page").hide();           

	    });
	    
	}

});

