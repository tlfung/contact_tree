var Tree_Model = Backbone.Model.extend({
  defaults: {
    egos_data: {},
    // dblp_data: {},
    selected_egos: {},
    display_egos: {},
    tree_structure: {},
    canvas_scale: 0.15,
    canvas_translate: [0, 0],
    done_query: [],
    // now_query: " ",
    done_query_list: 0, // use for query author

    done_table_loading: [],

    attr_option: [],
    attribute: {},
    component: [],

    fruit_control: 1,
    tree_data: {},

    // tree_style:["symmetry"],
    tree_style:["symmetry"],

    view_mode: "",
    folder:"",

    leaf_scale: 3,
    fruit_scale: 3,
    root_curve: 0,
    root_len_scale: 1,
    sub_leaf_len_scale: 1,
    dtl_branch_curve: 1,
    abt_branch_curve: 1,

    canvas_grid: [],
    info_table: {},
    canvas_detail: 1.5,

    canvas_height: 0,
    canvas_width: 0,
    moving: 0,
    clicking_leaf: -1,

    leaf_switch: 1,
    fruit_switch: 0
    // stick:"coauthor"
  },

  initialize: function(args) {
    var self = this;
    console.log("in model initialize");
    self.query_dataset("folder");
    self.set({"component": default_component});
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

  load_data: function(request){
    var self = this;
    var request_url = "loadcsv/?folder="+request;
    d3.json(request_url, function(result){
          console.log("in model.load_data");
          // console.log(result)
          var check = function(data){
            var table = self.get("done_table_loading");
            table.push(data);
            self.set({"done_table_loading": table});
            console.log(self.get("done_table_loading"));
          };
          check(result);
      });
  },

  query_ego_list: function(request){
    var self = this;
    // console.log(request);
    var request_url = "datafolder/?folder="+request;
    d3.json(request_url, function(result){
        console.log("in model.query_ego_list");
        // console.log(result);
        var set_ego_list_json = function(data){
          total_ego = data;
          var time_array = [];
          for(var d in data){
            // var obj = {};
            // obj[d] = data[d].length;
            time_array.push({year: d, len: data[d].length});
          }
          time_array.sort(function(obj1, obj2) {
            // Ascending: first age less than the previous
            return obj2.len - obj1.len;
          });
          // console.log(time_array);
          var t_array = [];
          for(var t = 0; t < time_array.length; t++){
            t_array.push(time_array[t].year);
          }
          time = t_array;
        };
        set_ego_list_json(result);
        // console.log(total_ego);
        var d = self.get("done_query_list");
        self.set({"done_query_list": d+1});
        
        // dataset_mode
    });

    var request_url = "datainfo/?table=" + request;
    d3.json(request_url, function(result){
        console.log("in model.query_data_info");
        // console.log(result);
        var set_attr_info_json = function(data){
          data_range[request] = data[0];
          // console.log(data_range);
          component_attribute[request] = data[1];
          // console.log(component_attribute);
        };
        set_attr_info_json(result);
        component_attribute[request]["stick"] = ["alterid"];
    });


  },

  query_data: function(request){
    var self = this;
    var mode = self.get("view_mode");
    // var my_tree = {};
    // if(mode == "diary"){
    //   var sub_request = request.split("_");
    //   var request_url = "one_contact/?contact="+request;
    //   d3.json(request_url, function(result) {
    //       console.log("in model.query_data_diary");
    //       // console.log(result);
    //       var egos_data = self.get("egos_data");
    //       if(mode in egos_data){}
    //       else{
    //         egos_data[mode] = {};
    //       }
    //       // var tree_structure = self.get("tree_structure");
    //       var set_diary_json = function(data, sub){
    //         for(var d = 0; d < data.length; d++){
    //           if(sub[d+1] in egos_data[mode]){
    //             egos_data[mode][sub[d+1]][sub[0]] = data[d][sub[0]];
    //           }
    //           else{
    //             egos_data[mode][sub[d+1]] = {};
    //             egos_data[mode][sub[d+1]][sub[0]] = data[d][sub[0]];
    //           }
    //           // egos_data[mode][sub[d+1]] = data[d];
    //         }
    //         // egos_data[mode][request] = data;
    //         self.set({"egos_data": egos_data});
    //         console.log("egos_data", self.get("egos_data"));
    //         // trriger data has been change
    //         self.trigger('change:egos_data');
    //       };
    //       set_diary_json(result, sub_request);
    //   });
    // }

    if(mode == "DBLP"){
      var new_attr = request.split(":")[0];
      var author = request.split(":")[1];

      var request_url = "one_author/?author="+request;
      var sub_index = "author";
      d3.json(request_url, function(result){
          console.log("in model.query_data_dblp");
          var author_data = self.get("egos_data");
          var author_structure = self.get("tree_structure");
          if(mode in author_data){}
          else{
            author_data[mode] = {};
            author_structure[mode] = {};
            author_structure[mode]["author"] = {};
          }
          
          var set_dblp_json = function(data, a_name){
            if(data[author].length == 0){
              // var r = alert(a_name + " do not have enough data!");
              var r = confirm(a_name + " do not have enough data!");
              if (r == true) {
                $('.au_checkbox').removeAttr("disabled");
              }
              else{
                $('.au_checkbox').removeAttr("disabled");
              }
              // $(window).on("okbuttonclicked", function() {
              //   $('.au_checkbox').removeAttr("disabled");
              // });
            }
            else{
              author_structure[mode]["author"][author] = data[author];
              console.log("lucky", author_structure);
              self.set({"tree_structure": author_structure});
              
              
            }
            
          };
          set_dblp_json(result, request);
          $("#submit_dblp").removeAttr("disabled");
          $("#submit_dblp").text("Done");
          $('#submit_search').removeAttr("disabled");
          // $("#sidekey_dialog").dialog( "close" );
          $('.au_checkbox').removeAttr("disabled");
          self.trigger('change:tree_structure');
      });
          
    }

    else if(mode == "inter"){
      var new_attr = request.split(":")[0];
      var sub_country = request.split(":")[1].split("_");
      var request_url = "one_country/?international="+request;
      
      d3.json(request_url, function(result) {
        console.log("in model.query_inter_diary");
        var egos_data = self.get("egos_data");
        var tree_structure = self.get("tree_structure");
        if(mode in egos_data){}
        else{
          egos_data[mode] = {};
          tree_structure[mode] = {};
        }
        var set_inter_json = function(data){
          tree_structure[mode]["inter"] = {};
          tree_structure[mode]["inter"] = data;
          self.set({"tree_structure": tree_structure});
          console.log("......", tree_structure);
        };
        set_inter_json(result);
        $("#get").removeAttr("disabled");
        $("#get").text("Submit");
        $('#default').removeAttr("disabled");

        $("#submit_inter").removeAttr("disabled");
        $("#submit_inter").text("Done");
        $('.country_option').removeAttr("disabled");
        
        $( "#menu_dialog" ).dialog( "close" );
        self.trigger('change:tree_structure');
        // self.trigger('change:selected_egos');
        $("#sidekey_dialog").dialog( "close" );

      });

    }

    else{
      var new_attr = request.split(":")[0];
      var sub_request = request.split(":")[1].split("_");
      var request_url = "one_contact/?contact="+request;
      d3.json(request_url, function(result) {
          console.log("in model.query_data_diary");
          // console.log(result);
          var egos_data = self.get("egos_data");
          var tree_structure = self.get("tree_structure");
          if(mode in egos_data){}
          else{
            egos_data[mode] = {};
            tree_structure[mode] = {};
          }
          // var tree_structure = self.get("tree_structure");
          var set_diary_json = function(data, sub){
            for(var d in data){
              if(d in tree_structure[mode]){
                // tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                /*
                if(jQuery.type(tree_structure[mode][d]) == "object"){
                  tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                }
                else{
                  tree_structure[mode][d] = {};
                  tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                }
                */
                
              }
              else{
                // tree_structure[mode] = {};
                // tree_structure[d][sub[1]] = data[d][sub[1]];
                tree_structure[mode][d] = {};
                tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                /*
                if(jQuery.type(tree_structure[mode][d]) == "object"){
                  tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                }
                else{
                  tree_structure[d] = {};
                  tree_structure[mode][d][sub[1]] = data[d][sub[1]];
                }
                */
                

              }
            }
            // console.log("store", tree_structure);
            self.set({"tree_structure": tree_structure});
            console.log("lucky", tree_structure);
            /*
            for(var d = 0; d < data.length; d++){
              if(sub[d+2] in egos_data[mode]){
                egos_data[mode][sub[d+2]][sub[1]] = data[d][sub[1]];
              }
              else{
                egos_data[mode][sub[d+2]] = {};
                egos_data[mode][sub[d+2]][sub[1]] = data[d][sub[1]];
              }
              // egos_data[mode][sub[d+1]] = data[d];
            }
            // egos_data[mode][request] = data;
            self.set({"egos_data": egos_data});
            console.log("egos_data", self.get("egos_data"));
            // trriger data has been change
            self.trigger('change:egos_data');
            */
          };
          set_diary_json(result, sub_request);
          $("#submit_diary").removeAttr("disabled");
          $("#submit_diary").text("Done");
          $('.ego_checkbox').removeAttr("disabled");
          // self.trigger('change:tree_structure');

      });

    }
    
  },

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
          self.trigger('change:tree_structure');
          $("#sidekey_dialog").dialog( "close" );
          self.set({"tree_structure": tree_structure});
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
