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
	    dataset_group: "all",
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

	    filter_contact: 1,
	    filter_alter: 0
	    // stick:"coauthor"
  	},

  	initialize: function(args) {
	    var self = this;
	    console.log("in model initialize");
	    // self.set({"component": default_component});
	    // var c_detail = self.get("canvas_detail")*self.get("canvas_scale");
	    // self.set({"canvas_detail": c_detail});
	    // self.set({"attr_option": mapping_item["diary"]});
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
	    var request = table + ":-" + group;
	    var request_url = "datatable/?table="+request;
	    d3.json(request_url, function(result){
	        // console.log("in model.query_ego_list");
	        console.log(result);
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

	        set_ego_list_json(result[0]);
	        set_default_attr(result[1]);
	        set_attribute_info(result[2]);

	        var d = self.get("done_query_list");
	        self.set({"done_query_list": d+1});
	        self.trigger('change:attribute');        
	        // dataset_mode
	    });
	   
	},

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
	    
	    var request_url = "get_contact/?contact="+request;
	    // console.log(request_url);
	    d3.json(request_url, function(result) {
	      	// console.log("in model.query_one_contact");
	      	// console.log(result);
	      	var egos_data = self.get("egos_data");
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
		        self.set({"tree_structure": tree_structure});
		        // console.log("lucky", tree_structure);
	      	};
	      	// var new_attr = JSON.parse(request.split(":-")[0]);
		    var sub_request = JSON.parse(request.split(":-")[1]);
		    for(s in sub_request)
		    	set_structure(result, s);
	      		
	      	self.trigger('change:tree_structure');
	      	$("#submit_ego").removeAttr("disabled");
	      	$("#block_page").hide();
	      	$( "#menu_dialog" ).dialog( "close" );
	      	self.trigger('change:selected_egos');
	      	self.trigger('change:display_egos');            

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
