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
	    // dataset_mode: ["combine_diary", "international"],
	    dataset_mode: [],
	    user_mapping: []
  	},

  	initialize: function(args) {
	    var self = this;
	    user_history = 0;
	    console.log("in model initialize");
	    
	    // dont do anythnig if it is a new user 
	    if(first_use == 0)
	    	return;

	    var request_url = request_builder.get_user_data(session_id, last_use);
	    var get_auto_saving = function(result){
			// var restore_array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]; // total = 15
			var restore_array = [];
			// console.log(restore_array);
			var view_mode = session_id.toString() + "_of_" + result.mode;
			restore_array.push(view_mode); // mode

	        self.set({"view_mode": restore_array[0]}, {silent: true});
	        
			$("#dataselect").trigger('change');
		};

		// check if we found any user history
	    d3.json(request_url, function(user_result){
			if(!jQuery.isEmptyObject(user_result)){
				get_auto_saving(user_result);
		        // user_history = 1;
		    }
		    else{
		    	first_use = 0;
		    	document.cookie = "mode=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
		    }

		});
  	},
  	
  	// get total_ego and attribute informaion
  	query_ego_list: function(table, group){
	    var self = this;	    
	    // set the result function
        var set_ego_list_json = function(data){
          	total_ego = data;
        };

        var set_default_attr = function(data){
          	var single_attr = [];
          	// self.set({"attr_option": data});
          	self.set({"attribute": data}, {silent: true});
          	for(a in data){
            	single_attr.push(data[a]);
          	}
          	self.set({"attr_option": single_attr});
        };

        var set_attribute_info = function(data){
        	var mode = self.get("view_mode");
        	var group = self.get("dataset_group");
        	component_attribute[mode] = {};
        	if(group == "dataset"){
        		for(a in data){
        			if(a != "dataset")
	        			component_attribute[mode][a] = data[a];
	        	}
        	}
        	else{
        		for(a in data){
	        		component_attribute[mode][a] = data[a];
	        	}
        	}
        	
        	component_attribute[mode]["none"] = [["none"], 0, 0, 0, 1, "none"];
        };
	    	   
	    var request = table + ":-" + group;
	    var request_url = request_builder.datatable(table, group);
	    // var request_url = "datatable/?table="+encodeURIComponent(request);
	    d3.json(request_url, function(result){
	        in_change_mode = 0;
	        set_ego_list_json(result[0]);
	        set_default_attr(result[1]);
        	set_attribute_info(result[2]);
        	user_history = 2;
	        
	        self.trigger('change:attribute');
	        var d = self.get("done_query_list");
	        self.set({"done_query_list": d+1});        
	       	// label user as old user
	        initial_user = 1;
	        first_use = 1;
	    });
	   
	},

	// get the tree structure of selected ego
	query_data: function(request_url, sub_request){
	    var self = this;
	    var mode = self.get("view_mode");
	    // var request_url = "get_update/?contact="+encodeURIComponent(request);	    
	    var el_block_page= $("#block_page");
	    var el_submit_ego = $("#submit_ego");
	    var el_ego_checkbox = $('.ego_checkbox');

	    el_block_page.show();
        $("#loading_process").html("<b>Loading...</b>");
	    el_submit_ego.attr("disabled", true);
	    el_submit_ego.text("Loading");
	    el_ego_checkbox.attr("disabled", true);

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
		    // var sub_request = JSON.parse(request.split(":-")[5]);
		    for(s in sub_request)
		    	set_structure(result, s);
	      	
	      	el_submit_ego.removeAttr("disabled");
	      	el_submit_ego.text("Done");
	      	el_ego_checkbox.removeAttr("disabled");
	      	el_block_page.hide();           

	    });
	    
	}

});

