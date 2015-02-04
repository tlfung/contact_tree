// not use
var StructureView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in structure initialize");
        _.bindAll(this, 'build_tree');

        // this.model.bind('change:egos_data', this.build_tree);
        // this.model.bind('change:attribute', this.build_tree);
        // this.build_tree();
        this.mode = self.model.get("view_mode");
        this.temp_structure = {};
    },

    build_tree: function(){
        var self = this;
        this.mode = self.model.get("view_mode");
        var num_ego = [];
        var egos_data = self.model.get("egos_data");
        
        var tree_structure = self.model.get("tree_structure");
        $('#submit_diary').attr("disabled", true);
        $('#submit_dblp').attr("disabled", true);
        // console.log(egos_data);

        if(this.mode in tree_structure){}
        else{
          tree_structure[this.mode] = {};
          egos_data[this.mode] = {};
        }
        // console.log("total", num_ego);
        var my_tree = {};
        
        if(this.mode == "diary"){
          for(year in egos_data[this.mode]){
            // year = egos_data[y];
            my_tree = {};          
            for(var ego in egos_data[this.mode][year]){
              var one_ego = egos_data[this.mode][year][ego];
              // console.log(one_ego);
              my_tree[ego] = this.gen_tree_structure(one_ego);
              // break;
            }
            // console.log("ori", my_tree);
            tree_structure[this.mode][year] = my_tree;
            self.temp_structure = tree_structure;
            // console.log("temp",self.temp_structure);
          }
        }

        else if(this.mode == "DBLP"){
          // egos_data[this.mode] = {};
          var sub_element = "author";
          if(sub_element in egos_data[this.mode]){}
          else{
            egos_data[this.mode][sub_element] = {};
          }
          for(var au in egos_data[this.mode][sub_element]){
            var one_au = egos_data[this.mode][sub_element][au];
            // console.log(one_au);
            my_tree[au] = this.gen_tree_structure(one_au);
            // break;
          }
          // console.log("ori", my_tree);
          tree_structure[this.mode][sub_element] = my_tree;
          self.temp_structure = tree_structure;
          // console.log("temp",self.temp_structure);
        }
        
        $("#submit_diary").removeAttr("disabled");
        $("#submit_diary").text("Done");
        $("#submit_dblp").removeAttr("disabled");
        $("#submit_dblp").text("Done");
        
        // $("#sidekey_dialog").dialog( "close" );
        $('.au_checkbox').removeAttr("disabled");
        $('.ego_checkbox').removeAttr("disabled");


        self.model.set({"canvas_translate": [0, 0]});
        self.model.set({"canvas_scale": 0.15});
        self.model.set({"tree_structure": self.temp_structure});
        self.model.trigger('change:tree_structure');
        console.log("store", self.model.get("tree_structure"));
        
    },


    gen_tree_structure: function(data){
        var self = this;
        // self.get("attribute");
        var attr = self.model.get("attribute");
        var view = self.model.get("view_mode");
        // console.log(this.mode);
        var t = attr.trunk; //"sex"
        var b = attr.branch;
        var bs = attr.bside;
        var size = attr.leaf_size; //"howlong"
        var color = attr.leaf_color;
        var fruit = attr.fruit;

        // console.log("instructure", t, b, bs, size, color, fruit);
        var structure = {}
        structure["right"] = [];
        structure["left"] = [];
        var alter_array_right_up = [];
        var alter_array_left_up = [];
        var alter_array_right_down = [];
        var alter_array_left_down = [];
        // empty tree
        for(var c = data_range[view][b][0]; c <= data_range[view][b][1]; c++){
          // var layer = "level_" + (c+1).toString();
          // if(c > 8) break;
          structure["right"].push( {"level":{ "up":[], "down":[] } } );
          structure["left"].push( {"level":{ "up":[], "down":[] } } );
          alter_array_right_up.push([]);
          alter_array_left_up.push([]);
          alter_array_right_down.push([]);
          alter_array_left_down.push([]);
        }
        // console.log("empty_tree", structure);
        // console.log("empty_alter_array", alter_array_left_down);

        var t_range = Math.round((data_range[view][t][1]-data_range[view][t][0])/2);
        var bs_range = Math.round((data_range[view][bs][1]-data_range[view][bs][0])/2);
        // console.log("range",bs_range);
        for(var c in data){
          var meeting = data[c];
          // left
          if(meeting[t] <= t_range){
            var level = 0;
            var new_alter = -1;
            // layer
            for(var l = data_range[view][b][0]; l <= data_range[view][b][1]; l++){
              // level and up
              // if(meeting[b] > 8){
              //   meeting[b] == 8;
              //   // l == 8;
              // }  
              if(meeting[b] == l && meeting[bs] > bs_range){
                if(alter_array_left_up[level].length == 0){
                  structure["left"][level]["level"]["up"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                  structure["left"][level]["level"]["up"][alter_array_left_up[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  alter_array_left_up[level].push(meeting.alterid);
                }
                else{
                  for(var a = 0; a < alter_array_left_up[level].length; a++){
                    if(meeting.alterid == alter_array_left_up[level][a]){
                      new_alter = a;
                      break;
                    }
                  }
                  // new alter
                  if(new_alter == -1){
                    structure["left"][level]["level"]["up"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                    structure["left"][level]["level"]["up"][alter_array_left_up[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                    alter_array_left_up[level].push(meeting.alterid);
                  }
                  // alter existed
                  else{
                    structure["left"][level]["level"]["up"][new_alter]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  
                  }
                }
                break;
              }
              // level and down
              else if(meeting[b] == l && meeting[bs] <= bs_range){
                // console.log(structure["left"][level]["level"]["down"]);
                if(alter_array_left_down[level].length == 0){
                  structure["left"][level]["level"]["down"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                  structure["left"][level]["level"]["down"][alter_array_left_down[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  alter_array_left_down[level].push(meeting.alterid);
                }
                else{
                  for(var a = 0; a < alter_array_left_down[level].length; a++){
                    if(meeting.alterid == alter_array_left_down[level][a]){
                      new_alter = a;
                      break;
                    }
                  }
                  // new alter
                  if(new_alter == -1){
                    structure["left"][level]["level"]["down"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                    structure["left"][level]["level"]["down"][alter_array_left_down[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                    alter_array_left_down[level].push(meeting.alterid);
                  }
                  // alter existed
                  else{
                    structure["left"][level]["level"]["down"][new_alter]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  }
                }
                break;
              }
              level++;
            }
          }
          // right
          else{
            var level = 0;
            var new_alter = -1;
            // layer
            for(var l = data_range[view][b][0]; l <= data_range[view][b][1]; l++){
              // level and up
              if(meeting[b] == l && meeting[bs] > bs_range){
                if(alter_array_right_up[level].length == 0){
                  structure["right"][level]["level"]["up"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                  structure["right"][level]["level"]["up"][alter_array_right_up[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  alter_array_right_up[level].push(meeting.alterid);
                }
                else{
                  for(var a = 0; a < alter_array_right_up[level].length; a++){
                    if(meeting.alterid == alter_array_right_up[level][a]){
                      new_alter = a;
                      break;
                    }
                  }
                  // new alter
                  if(new_alter == -1){
                    structure["right"][level]["level"]["up"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                    structure["right"][level]["level"]["up"][alter_array_right_up[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                    alter_array_right_up[level].push(meeting.alterid);
                  }
                  // alter existed
                  else{
                    structure["right"][level]["level"]["up"][new_alter]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  
                  }
                }
                break;
              }
              // level and down
              else if(meeting[b] == l && meeting[bs] <= bs_range){
                // console.log("temp", structure["right"][level]);
                if(alter_array_right_down[level].length == 0){
                  structure["right"][level]["level"]["down"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                  structure["right"][level]["level"]["down"][alter_array_right_down[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  alter_array_right_down[level].push(meeting.alterid);
                }
                else{
                  for(var a = 0; a < alter_array_right_down[level].length; a++){
                    if(meeting.alterid == alter_array_right_down[level][a]){
                      new_alter = a;
                      break;
                    }
                  }
                  // new alter
                  if(new_alter == -1){
                    structure["right"][level]["level"]["down"].push({"id":meeting.alterid, "fruit":meeting[fruit], "leaf":[]});
                    structure["right"][level]["level"]["down"][alter_array_right_down[level].length]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                    alter_array_right_down[level].push(meeting.alterid);
                  }
                  // alter existed
                  else{
                    structure["right"][level]["level"]["down"][new_alter]["leaf"].push({"size":meeting[size], "color":meeting[color]});
                  }
                }
                break;
              }
              level++;
            }
          }
        }

        return structure;
    }

});
