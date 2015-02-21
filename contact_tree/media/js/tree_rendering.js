// rendering
var RenderingView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in rendering initialize");
        _.bindAll(this, 'redraw');
        _.bindAll(this, 'update_fruit_size');

        this.model.bind('change:display_egos', this.redraw);
        this.model.bind('change:canvas_scale', this.redraw);
        this.model.bind('change:tree_structure', this.redraw);
        this.model.bind('change:tree_style', this.redraw);


        this.model.bind('change:canvas_height', this.redraw);
        this.model.bind('change:canvas_width', this.redraw);
        this.model.bind('change:leaf_scale', this.redraw);
        this.model.bind('change:fruit_scale', this.redraw);
        this.model.bind('change:sub_leaf_len_scale', this.redraw);
        this.model.bind('change:dtl_branch_curve', this.redraw);
        this.model.bind('change:root_curve', this.redraw);
        this.model.bind('change:root_len_scale', this.redraw);
        this.model.bind('change:clicking_leaf', this.redraw);
        this.model.bind('change:leaf_switch', this.redraw);
        this.model.bind('change:fruit_switch', this.redraw);


        this.model.bind('change:leaf_scale', this.update_fruit_size);

        this.view = self.model.get("view_mode");
        this.group = self.model.get("dataset_group");

        this.myCanvas = drawing_canvas.main_canvas;
        this.context =  this.myCanvas.getContext('2d');

        this.scale = self.model.get("canvas_scale");
        this.translate_point = self.model.get("canvas_translate");

        this.start_x = (1000/this.scale)/2; //_glx
        this.start_y = (this.myCanvas.height/this.scale)-600; //_gly
        this.tree_tall = 2120; //ori _dist
        this.temp_height = 0;
        // this.tree_slop = 150; //_slop
        // this.tree_long = 100; //_long
        this.x_dist = 350;
        this.y_dist = 150;
        this.stick_length = 0; //new _dist
        this.total_layer = 0;

        this.dr = 0;
        this.dl = 0;

        this.extra_y = 0; // var outy = layer*8; //control point weight for its torson
        this.extra_x = 0; // var outx = layer*8; //control point (constant)

        this.tree_rstpoint = [0, 0, 0, 0];
        this.tree_lstpoint = [0, 0, 0, 0];

        this.stick_dx = 50;
        this.stick_dy = 50;
        this.sub_stick_length = 55;
        this.sub_slop = 0;

        this.add_nature = 120;
        this.right_cluster_leaf = [];
        this.left_cluster_leaf = [];

        this.add_bend = 0;
        this.add_last_bend = 0;
        this.last_dr = 0;
        this.last_dl = 0;

        this.clicking_grid = initial_grid;
        this.subyear = 2014;
        this.hash_table = self.model.get("info_table");
        this.leaf_hovor = self.model.get("clicking_leaf");
        this.c_detail = 10*this.scale;
        this.on_moving = 0;
    },

    redraw: function(){
        var self = this;
        // console.log("in redraw", self.model.get("moving"));
        this.on_moving = self.model.get("moving");
        this.scale = self.model.get("canvas_scale");
        this.leaf_hovor = self.model.get("clicking_leaf");
        var display_style = self.model.get("tree_style");
        this.view = self.model.get("view_mode");
        this.group = self.model.get("dataset_group");
        this.clicking_grid = initial_grid;
        this.translate_point = self.model.get("canvas_translate");
        this.c_detail = 11*this.scale;

        if(this.scale > 0.6){
            this.on_moving = 0;
        }
        if(jQuery.isEmptyObject(self.model.get("tree_structure"))){
            return 0;
        }
        // console.log("grid", this.clicking_grid);
        for(var x = 0; x <= this.myCanvas.width/this.c_detail; x++){
            this.clicking_grid[x] = [];
            // initial_grid[x] = [];
            for(var y = 0; y <= this.myCanvas.height/this.c_detail; y++){
                this.clicking_grid[x][y] = -1;
                // initial_grid[x][y] = -1;
            }
        }
        switch(display_style[0]){
            case 'symmetry':
                self.redraw_symmetry();
                break;
            case 'cluster':
                self.redraw_cluster();
                break;
            case 'crooked':
                self.redraw_crooked();
        }// end switch
        // console.log(self.clicking_grid[0].length);
        // console.log(self.clicking_grid.length);
        
        self.model.set({"canvas_grid":self.clicking_grid});    
        self.model.set({"info_table":self.hash_table});
        self.model.set({"canvas_detail":self.c_detail});
        self.model.set({"moving": 0});
        self.model.trigger('change:canvas_grid');

        // console.log("!!!!!!!!", self.hash_table);
    },

    redraw_crooked: function(){
        var self = this;
        // console.log("in redraw");
        var display_ego = self.model.get("display_egos");
        var structure = self.model.get("tree_structure");
        // console.log("display", display_ego);
        // console.log("structure", structure);
        // this.scale = self.model.get("canvas_scale");
        this.context.lineWidth = 102; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.myCanvas.width, this.myCanvas.height);
        this.context.save();

        this.context.translate(self.model.get("canvas_translate")[0], self.model.get("canvas_translate")[1]);
        this.context.scale(this.scale, this.scale);
        this.start_x = 0; //_glx
        var total_distance = 0;
        for(var e in display_ego){
            for(var t = 0; t < display_ego[e].length; t++){
                this.context.lineWidth = 5; // set the style
                // this.right_cluster_leaf = [];
                // this.left_cluster_leaf = [];
                var sub = display_ego[e][t];
                // console.log("render slected", structure[self.view][sub][e]);
                var ego = structure[self.view][sub][e];
                this.tree_rstpoint = [0, 0, 0, 0];
                this.tree_lstpoint = [0, 0, 0, 0];
                var left_side = 0;
                var right_side = 0;
                self.total_layer = ego["left"].length;
                self.stick_length = self.tree_tall/self.total_layer; //_dist
                var layer_total_alter = {"right": [], "left": []};
                
                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly

                for(var s = 0; s < self.total_layer; s++){
                    var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
                    var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;

                    layer_total_alter["right"].push(r);
                    layer_total_alter["left"].push(l);
                    left_side += l;
                    right_side += r;
                }
                var total_contact = left_side + right_side;
                if(total_contact == 0){
                    continue;
                    // alart and delete this ego
                }
                // console.log("count total amount for layer", layer_total_alter);
                // console.log("count total amount for rendering", left_side, right_side, total_contact);
                
                // var branch_index = layer_total_alter["left"].indexOf(Math.max.apply(Math, layer_total_alter["left"]));
                var msg = "";
                if(self.view == "diary"){
                    msg = "EGO" + e + "|" + sub;
                }
                else if(self.view == "DBLP"){
                    msg = e;
                }
                var pos = [];
                var info_pos = [];
                var info_box = ["Total Alters on Right: "+ right_side, "Total Alters on Left: "+ left_side];
                // this.start_x + this.x_dist - stick_width + this.extra_x
                var left_dist = Math.max.apply(Math, layer_total_alter["left"]);

                this.start_x += (left_dist + 150)*7 + this.x_dist; //_glx
                total_distance += (left_dist + 150)*7 + this.x_dist;
                
                var t_scale = (right_side + left_side)/150;
                if(this.view == "diary"){
                    // console.log("scale", ((right_side + left_side)/150));
                    if(t_scale < 1){
                        t_scale = 1;
                    }
                    // this.dr = ori_dr/t_scale;//1.5;
                    // this.dl = ori_dl/t_scale;
                }
                else{
                    if(right_side+left_side < 80){
                        t_scale = 0.4;
                    }
                    else{
                        if(t_scale < 1){
                            t_scale = 1;
                        }
                    }
                    // this.dr = ori_dr*1.1;
                    // this.dl = ori_dl*1.1;
                    // this.dr = ori_dr/t_scale;
                    // this.dl = ori_dl/t_scale;
                }

                var ori_dr = right_side;
                var ori_dl = left_side;
                // pos = [this.start_x - ori_dl/1.5 - 130, this.start_y + this.stick_length + 350];
                pos = [((this.start_x - ori_dl/t_scale - 50)+(this.start_x + ori_dr/t_scale + 50))/2-270, this.start_y + this.stick_length + 350];
                info_pos = [this.start_x + ori_dr/t_scale + 100, this.start_y + this.stick_length + 50];

                var bend_scale = self.model.get("abt_branch_curve");
                for(var height = 0; height < self.total_layer; height++){                    
                    var num = parseInt("7D6041", 16); 
                    num += 6*(height-2);

                    this.context.fillStyle = "#" + num.toString(16);
                    this.context.strokeStyle = "#" + num.toString(16);
                    // trunk width left and right
                   
                    // this.dr = layer_total_alter["right"][height];
                    // this.dl = layer_total_alter["left"][height];

                    this.dr = ori_dr/t_scale;//1.5;
                    this.dl = ori_dl/t_scale;

                    this.temp_height = 100;
                    this.add_nature = 0;
                    this.add_bend = (layer_total_alter["right"][height] - layer_total_alter["left"][height])*5;
                    
                    this.add_bend = this.add_bend*bend_scale;
                                        
                    // draw right tree
                    this.extra_y = layer_total_alter["right"][height];
                    this.context.beginPath();
                    if(height == self.total_layer-1 && layer_total_alter["right"][height] == 0){}

                    else
                        this.draw_right_crooked(height, layer_total_alter["right"][height], ego["right"][height]["level"]);

                    this.context.beginPath();
                    // this.start_x -= 35;
                    this.extra_y = layer_total_alter["left"][height];
                    if(height == self.total_layer-1 && layer_total_alter["left"][height] == 0){}

                    else
                        this.draw_left_crooked(height, layer_total_alter["left"][height], ego["left"][height]["level"]);

                    this.add_last_bend = this.add_bend;
                    // next layer
                    this.last_dr = this.dr;
                    this.last_dl = this.dl;
                    ori_dr -= layer_total_alter["right"][height];
                    ori_dl -= layer_total_alter["left"][height];
                    // ori_dr -= (right_side/self.total_layer);
                    // ori_dl -= (left_side/self.total_layer);
                    this.start_y = this.start_y - this.stick_length - this.temp_height;
                    
                    this.start_x = this.start_x + this.add_bend;
                    
                    // height += 1;
                }
                
                this.set_tree_label(this.context, msg, pos);
                this.set_tree_info(this.context, info_box, info_pos);
                // var branch_index = layer_total_alter["right"].indexOf(Math.max.apply(Math,layer_total_alter["right"]));

                // if(ego["right"][branch_index]["level"]["down"].length >= ego["right"][branch_index]["level"]["up"].length){
                //     this.start_x += ((ego["right"][branch_index]["level"]["down"].length + 100)*7 + this.x_dist); //_glx
                //     total_distance += ((ego["right"][branch_index]["level"]["down"].length + 100)*7 + this.x_dist);
                // }
                // else{
                //     this.start_x += ((ego["right"][branch_index]["level"]["up"].length + 100)*7 + this.x_dist); //_glx
                //     total_distance += ((ego["right"][branch_index]["level"]["up"].length + 100)*7 + this.x_dist);
                // }
                var right_dist = Math.max.apply(Math, layer_total_alter["right"]);

                this.start_x += (right_dist + 150)*7 + this.x_dist; //_glx
                total_distance += (right_dist + 150)*7 + this.x_dist;

                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly
            }
        }
        // this.context.restore();
    },

    draw_right_crooked: function(layer, num_alter, alters){
        var self = this;
        this.extra_x = (num_alter)*3;
        // console.log("this.extra_x", this.extra_x); 
        var tree_rstpoint = [0, 0, 0, 0];
        // end point
        tree_rstpoint[0] = this.start_x + this.x_dist + this.add_bend + (alters["up"].length+alters["down"].length)*7 - layer*26 + 100; // up point
        tree_rstpoint[1] = this.start_y + this.add_bend - (alters["up"].length+alters["down"].length)*3 - (layer+1)*30 - 100;
        tree_rstpoint[2] = this.start_x + this.x_dist + this.add_bend + alters["down"].length*10 - layer*26 + 100; // down point
        tree_rstpoint[3] = this.start_y + this.add_bend + alters["down"].length*5- (layer+1)*30 + 100;

        var cp_stick_up = [ this.start_x + this.dr + this.add_bend + layer*5, this.start_y + this.add_bend - (alters["up"].length+alters["down"].length)*3 - (layer+1)*20 - 120,
                            this.start_x + this.x_dist + this.add_bend + (alters["up"].length+alters["down"].length)*7 - layer*20, this.start_y + this.add_bend - layer*30];
        var cp_stick_down = [ this.start_x + this.dr + this.add_bend + layer*5, this.start_y + this.add_bend - alters["down"].length*5 - (layer+1)*20 - 120,
                            this.start_x + this.x_dist + this.add_bend + alters["down"].length*10 - layer*20, this.start_y + this.add_bend - layer*20];

        var total_leaf = this.count_total_leaf(alters);
               
        // this.context.moveTo(this.start_x + this.add_bend, this.start_y);
        if(num_alter > 0){
            var stop = [8, 0];
            // alter["up"][c]["leaf"].length;
            var fruit_u = 0;
            var fruit_d = 0;
            var attr = self.model.get("attribute");
            var draw_fruit = data_range[this.view][attr.fruit][1];
            // Math.round((data_range[this.view][attr.fruit][1]-data_range[this.view][attr.fruit][0])/2);
            
            if(alters["up"].length > 0){
                this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                this.context.bezierCurveTo(cp_stick_up[0], cp_stick_up[1], cp_stick_up[2], cp_stick_up[3], tree_rstpoint[0], tree_rstpoint[1]);
                this.context.bezierCurveTo(cp_stick_up[2], cp_stick_up[3], cp_stick_up[0], cp_stick_up[1]-80+layer*5, this.start_x + this.add_bend, this.start_y);
                this.context.fill();//fill color
                this.context.stroke();//draw line
                                
                for(var a = 0, len = alters["up"].length; a < len; a++){
                    // store fruits
                    // fruit_u += alters["up"][a]["fruit"];
                    if(jQuery.isEmptyObject(alter["up"][a])){
                        continue;
                    }
                    if(alters["up"][a]["fruit"] == draw_fruit){
                        fruit_u++;
                    }

                    for(var n = 0; n < alters["up"][a]["leaf"].length; n++){
                        var raw_color = parseInt(alters["up"][a]["leaf"][n]["color"]);
                        if(raw_color>stop[1]){
                            stop[1] = raw_color;
                        }
                        if(raw_color<stop[0]){
                            stop[0] = raw_color;
                        }
                        // up_leaf += alters["up"][a]["leaf"][n]["size"];
                    }
                }

                // var grd = this.context.createLinearGradient(tree_rstpoint[0], tree_rstpoint[1], tree_rstpoint[0]+(Math.log(total_leaf["up"])+1)*15, tree_rstpoint[1]);
                var grd = this.context.createLinearGradient(0, 0, (Math.log(total_leaf["up"])+1)*25, 0);
                grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);

                this.context.fillStyle = grd;
                // this.context.strokeStyle ='#809C73';//line's color
                // this.context.fillStyle = "#C2B208";
        
                // this.context.moveTo(tree_rstpoint[0], tree_rstpoint[1]);
                // this.context.beginPath();

                this.leaf_style_1(this.context, tree_rstpoint[0], tree_rstpoint[1], (Math.log(total_leaf["up"])+1)*20, grd, -Math.PI/4);
                // this.context.closePath();
                // this.context.stroke();
                // this.context.fill();
                // this.context.lineWidth = 5;

                // this.context.beginPath();
                // this.context.fillStyle ='rgb(225,0,0)';//fill color
                // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                // this.circle(this.context, tree_rstpoint[0]-fruit_u, tree_rstpoint[1]+fruit_u, fruit_u);
                var radius_u = (fruit_u/alters["up"].length)*30+fruit_u;
                this.tree_fruit(this.context, tree_rstpoint[0]-radius_u, tree_rstpoint[1]-20, radius_u);
                this.context.closePath();
                this.context.stroke();
                this.context.fill();

                if(total_leaf["down"] > 0){
                    this.context.beginPath();
                    for(var a = 0, len = alters["down"].length; a < len; a++){
                        // store fruits
                        // fruit_d += alters["down"][a]["fruit"];
                        if(jQuery.isEmptyObject(alter["down"][a])){
                            continue;
                        }
                        if(alters["down"][a]["fruit"] == draw_fruit){
                            fruit_d++;
                        }

                        for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                            var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                            if(raw_color>stop[1]){
                                stop[1] = raw_color;
                            }
                            if(raw_color<stop[0]){
                                stop[0] = raw_color;
                            }
                            // down_leaf += alters["down"][a]["leaf"][n]["size"];
                        }
                    }
                    
                    // this.context.beginPath();
                    // this.context.fillStyle ='rgb(225,0,0)';//fill color
                    // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                    // this.circle(this.context, tree_rstpoint[0]-fruit_u, tree_rstpoint[1]+fruit_u, fruit_u);
                    var radius_d = (fruit_d/alters["down"].length)*30+fruit_d;
                    this.tree_fruit(this.context, tree_rstpoint[0]-radius_u/2, tree_rstpoint[1]+radius_u+radius_d, radius_d);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();

                    // var grd = this.context.createLinearGradient(tree_rstpoint[0], tree_rstpoint[1], tree_rstpoint[0]+(Math.log(total_leaf["down"])+1)*15, tree_rstpoint[1]);
                    var grd = this.context.createLinearGradient(0, 0, (Math.log(total_leaf["down"])+1)*25, 0);
                    grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                    grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);

                    this.context.fillStyle = grd;
                    // this.context.strokeStyle ='#809C73';//line's color
                    // this.context.strokeStyle ='#376959';//line's color // original color
                    // this.context.moveTo(tree_rstpoint[0], tree_rstpoint[1]);
                    // this.context.beginPath();

                    this.leaf_style_1(this.context, tree_rstpoint[0], tree_rstpoint[1], (Math.log(total_leaf["down"])+1)*20, grd, Math.PI/4);
                    // this.context.closePath();
                    // this.context.stroke();
                    // this.context.fill();
                    // this.context.lineWidth = 5;

                }                
                
                var num = parseInt("7D6041", 16); 
                num += 6*(layer-2);

                this.context.fillStyle = "#" + num.toString(16);
                this.context.strokeStyle = "#" + num.toString(16);
                this.context.beginPath();

            }
            else if(alters["down"].length > 0){
                this.context.beginPath();
                // this.context.moveTo(this.start_x + this.add_bend, this.start_y);
                // this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
                var leaf_pos = [tree_rstpoint[0], tree_rstpoint[1]];
                if(this.add_bend>0){
                    this.context.moveTo(this.start_x + this.add_bend, this.start_y);
                    this.context.bezierCurveTo(cp_stick_down[0], cp_stick_down[1], cp_stick_down[2], cp_stick_down[3], tree_rstpoint[2], tree_rstpoint[3]);
                    this.context.bezierCurveTo(cp_stick_down[2], cp_stick_down[3], cp_stick_down[0], cp_stick_down[1]+80-layer*5, this.start_x + this.add_bend + this.dr, this.start_y);
                    leaf_pos = [tree_rstpoint[02], tree_rstpoint[3]];
                }
                else{
                    this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                    this.context.bezierCurveTo(cp_stick_up[0], cp_stick_up[1], cp_stick_up[2], cp_stick_up[3], tree_rstpoint[0], tree_rstpoint[1]);
                    this.context.bezierCurveTo(cp_stick_up[2], cp_stick_up[3], cp_stick_up[0], cp_stick_up[1]-80+layer*5, this.start_x + this.add_bend, this.start_y);
                }
                
            
                this.context.fill();//fill color
                this.context.stroke();//draw line
                // this.context.fillStyle = "#C2B208";

                for(var a = 0, len = alters["down"].length; a < len; a++){
                    // store fruits
                    // fruit_d += alters["down"][a]["fruit"];
                    if(jQuery.isEmptyObject(alter["down"][a])){
                        continue;
                    }
                    if(alters["down"][a]["fruit"] == draw_fruit){
                        fruit_d++;
                    }

                    for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                        var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                        if(raw_color>stop[1]){
                            stop[1] = raw_color;
                        }
                        if(raw_color<stop[0]){
                            stop[0] = raw_color;
                        }
                        // down_leaf += alters["down"][a]["leaf"][n]["size"];
                    }
                }
                // console.log("right fruit down: ", layer, "---", fruit_d);
                // this.context.beginPath();
                // this.context.fillStyle ='rgb(225,0,0)';//fill color
                // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                // this.circle(this.context, tree_rstpoint[0]-fruit_u, tree_rstpoint[1]+fruit_u, fruit_u);
                var radius_d = (fruit_d/alters["down"].length)*30 + fruit_d;
                this.tree_fruit(this.context, leaf_pos[0], leaf_pos[1]+radius_d, radius_d);
                this.context.closePath();
                this.context.stroke();
                this.context.fill();

                // var grd = this.context.createLinearGradient(tree_rstpoint[0], tree_rstpoint[1], tree_rstpoint[0]+(Math.log(total_leaf["down"])+1)*15, tree_rstpoint[1]);
                var grd = this.context.createLinearGradient(0, 0, (Math.log(total_leaf["down"])+1)*25, 0);
                grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);
                this.context.fillStyle = grd;
                // this.context.strokeStyle ='#809C73';//line's color

                // this.context.beginPath();
                this.leaf_style_1(this.context, leaf_pos[0], leaf_pos[1], (Math.log(total_leaf["down"])+1)*20, grd, Math.PI/4);
                // this.context.closePath();
                // this.context.stroke();
                // this.context.fill();


                var num = parseInt("7D6041", 16); 
                num += 6*(layer-2);

                this.context.fillStyle = "#" + num.toString(16);
                this.context.strokeStyle = "#" + num.toString(16);
                this.context.beginPath();
            }
            
            // this.context.closePath();
            // draw rectangle to fill the trunk
            // this.context.stroke();//draw line
            // this.context.fill();//fill color
            this.context.beginPath();
           
            if(layer == 0){
                var cp_trunk = [this.start_x + this.add_bend/2 + this.dr, this.start_y + this.temp_height + this.stick_length, this.start_x + this.add_bend/2, this.start_y + this.temp_height + this.stick_length];
                this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[0], cp_trunk[1], this.start_x + this.dr + 80, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x + this.add_bend, this.start_y);
            
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x + this.add_bend/2 + this.dr, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2 + this.dr, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                var cp_trunk_inside = [this.start_x + this.add_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                // this.context.lineTo(this.start_x + this.last_dr, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.last_dr, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk_inside[2], cp_trunk_inside[3], cp_trunk_inside[0], cp_trunk_inside[1], this.start_x + this.add_bend, this.start_y);
                // this.context.lineTo(this.start_x + this.add_bend, this.start_y);
                
                this.context.closePath();
            }

            this.context.stroke();//draw line
            this.context.fill();//fill color

        }

        else{ // no branch
            this.context.beginPath();
            if(layer == 0){
                var cp_trunk = [this.start_x + this.add_bend/2 + this.dr, this.start_y + this.temp_height + this.stick_length, this.start_x + this.add_bend/2, this.start_y + this.temp_height + this.stick_length];
                this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[0], cp_trunk[1], this.start_x + this.dr + 80, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x + this.add_bend, this.start_y);

                this.context.closePath();
            }
            else{
                var cp_trunk = [this.start_x + this.add_bend/2 + this.dr, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2 + this.dr, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                var cp_trunk_inside = [this.start_x + this.add_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                this.context.moveTo(this.start_x + this.add_bend + this.dr, this.start_y);
                // this.context.lineTo(this.start_x + this.last_dr, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.last_dr, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk_inside[2], cp_trunk_inside[3], cp_trunk_inside[0], cp_trunk_inside[1], this.start_x + this.add_bend, this.start_y);
                // this.context.lineTo(this.start_x + this.add_bend, this.start_y);

                this.context.closePath();
            }
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.right_cluster_leaf.push({});
            return 1;
        }
        
        
    },

    draw_left_crooked: function(layer, num_alter, alters){
        var self = this;
        
        // var stick_width = this.extra_y;
        // stick_width = 0;
        // this.extra_y
        // this.extra_x = Math.sqrt(num_alter)*10; //control point (constant)
        this.extra_x = (num_alter)*6;
        var tree_lstpoint = [0, 0, 0, 0];
        // this.extra_y = 50; 

        tree_lstpoint[0] = this.start_x - this.x_dist + this.add_bend - (alters["up"].length+alters["down"].length)*7 + layer*26 - 100; // up point
        tree_lstpoint[1] = this.start_y - this.add_bend - (alters["up"].length+alters["down"].length)*3 - (layer+1)*30 - 100;
        tree_lstpoint[2] = this.start_x - this.x_dist + this.add_bend - alters["down"].length*10 + layer*26 - 100; // down point
        tree_lstpoint[3] = this.start_y - this.add_bend + alters["down"].length*5 - (layer+1)*30 + 100;

        var cp_stick_up = [ this.start_x - this.dr + this.add_bend - layer*5, this.start_y - this.add_bend - (alters["up"].length+alters["down"].length)*3 - (layer+1)*20 - 120,
                            this.start_x - this.x_dist + this.add_bend - (alters["up"].length+alters["down"].length)*7 + layer*20, this.start_y - this.add_bend - layer*30];
        var cp_stick_down = [ this.start_x - this.dr + this.add_bend - layer*5, this.start_y - this.add_bend - alters["down"].length*5 - (layer+1)*20 - 120,
                            this.start_x - this.x_dist + this.add_bend - alters["down"].length*10 + layer*20, this.start_y - this.add_bend - layer*20];

        var total_leaf = this.count_total_leaf(alters);
        // var cp_stick = [this.start_x + stick_width, this.start_y - this.y_dist - this.dl, this.start_x - this.x_dist - this.extra_x + 70 + stick_width, this.start_y - this.y_dist - 50];
        // this.context.moveTo(this.start_x + stick_width, this.start_y+15);

        
        if(num_alter > 0){
            var stop = [8, 0];
            // alter["up"][c]["leaf"].length;
            var fruit_u = 0;
            var fruit_d = 0;
            var attr = self.model.get("attribute");
            var draw_fruit = data_range[this.view][attr.fruit][1];
            if(alters["up"].length > 0){
                this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                // this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);
                this.context.bezierCurveTo(cp_stick_up[0], cp_stick_up[1], cp_stick_up[2], cp_stick_up[3], tree_lstpoint[0], tree_lstpoint[1]);
                this.context.bezierCurveTo(cp_stick_up[2], cp_stick_up[3], cp_stick_up[0], cp_stick_up[1]-80+layer*5, this.start_x + this.add_bend, this.start_y);
                this.context.fill();//fill color
                this.context.stroke();//draw line

                // this.context.strokeStyle ='#809C73';//line's color
                // this.context.fillStyle = "#C2B208";

                for(var a = 0, len = alters["up"].length; a < len; a++){
                    // store fruits
                    // fruit_u += alters["up"][a]["fruit"];
                    if(jQuery.isEmptyObject(alter["up"][a])){
                            continue;
                        }
                    if(alters["up"][a]["fruit"] == draw_fruit){
                        fruit_u++;
                    }

                    for(var n = 0; n < alters["up"][a]["leaf"].length; n++){
                        var raw_color = parseInt(alters["up"][a]["leaf"][n]["color"]);
                        if(raw_color>stop[1]){
                            stop[1] = raw_color;
                        }
                        if(raw_color<stop[0]){
                            stop[0] = raw_color;
                        }
                        // up_leaf += alters["up"][a]["leaf"][n]["size"];
                    }
                }
                // console.log("left fruit up: ", layer, "---", fruit_u);
                // var grd = this.context.createLinearGradient(tree_lstpoint[0], tree_lstpoint[1], tree_lstpoint[0]-(Math.log(total_leaf["up"])+1)*15, tree_lstpoint[1]);
                var grd = this.context.createLinearGradient(0, 0, -(Math.log(total_leaf["up"])+1)*25, 0);
                grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);
                
                this.context.fillStyle = grd;
                // this.context.strokeStyle ='#809C73';//line's color
        
                // this.context.moveTo(tree_lstpoint[0], tree_lstpoint[1]);
                // this.context.beginPath();

                this.leaf_style_1(this.context, tree_lstpoint[0], tree_lstpoint[1], -(Math.log(total_leaf["up"])+1)*20, grd, Math.PI/4);
                // this.context.closePath();
                // this.context.stroke();
                // this.context.fill();
                // this.context.lineWidth = 5;
                // this.context.beginPath();
                // this.context.fillStyle ='rgb(225,0,0)';//fill color
                // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                // this.circle(this.context, tree_rstpoint[0]-fruit_u, tree_rstpoint[1]+fruit_u, fruit_u);
                var radius_u = (fruit_u/alters["up"].length)*30+fruit_u;
                this.tree_fruit(this.context, tree_lstpoint[0]+radius_u, tree_lstpoint[1]-20, radius_u);
                this.context.closePath();
                this.context.stroke();
                this.context.fill();

                // this.context.moveTo(tree_lstpoint[0], tree_lstpoint[1]);
                if(total_leaf["down"]>0){
                    for(var a = 0, len = alters["down"].length; a < len; a++){
                        // store fruits
                        // fruit_d += alters["down"][a]["fruit"];
                        if(jQuery.isEmptyObject(alter["down"][a])){
                            continue;
                        }
                        if(alters["down"][a]["fruit"] == draw_fruit){
                            fruit_d++;
                        }

                        for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                            var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                            if(raw_color>stop[1]){
                                stop[1] = raw_color;
                            }
                            if(raw_color<stop[0]){
                                stop[0] = raw_color;
                            }
                            // down_leaf += alters["down"][a]["leaf"][n]["size"];
                        }
                    }
                    // console.log("left fruit down: ", layer, "---", fruit_d);
                    // this.context.beginPath();
                    // this.context.fillStyle ='rgb(225,0,0)';//fill color
                    // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                    var radius_d = (fruit_d/alters["down"].length)*30+fruit_d;
                    this.tree_fruit(this.context, tree_lstpoint[0]+radius_u/2, tree_lstpoint[1]+radius_u+radius_d, radius_d);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();

                    // var grd = this.context.createLinearGradient(tree_lstpoint[0], tree_lstpoint[1], tree_lstpoint[0]-(Math.log(total_leaf["down"])+1)*15, tree_lstpoint[1]);
                    var grd = this.context.createLinearGradient(0, 0, -(Math.log(total_leaf["down"])+1)*25, 0);
                    grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                    grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);

                    this.context.fillStyle = grd;
                    // this.context.strokeStyle ='#809C73';//line's color
                    this.context.beginPath();

                    this.leaf_style_1(this.context, tree_lstpoint[0], tree_lstpoint[1], -(Math.log(total_leaf["down"])+1)*20, grd, -Math.PI/4);
                    // this.context.closePath();
                    // this.context.stroke();
                    // this.context.fill();
                    // this.context.lineWidth = 5;
                }
                
                
                var num = parseInt("7D6041", 16); 
                num += 6*(layer-2);

                this.context.fillStyle = "#" + num.toString(16);
                this.context.strokeStyle = "#" + num.toString(16);
                this.context.beginPath();
            }
            else if(alters["down"].length > 0){
                this.context.beginPath();
                var leaf_pos = [tree_lstpoint[0], tree_lstpoint[1]];
                if(this.add_bend<0){
                    this.context.moveTo(this.start_x + this.add_bend, this.start_y);
                    // this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
                    this.context.bezierCurveTo(cp_stick_down[0], cp_stick_down[1], cp_stick_down[2], cp_stick_down[3], tree_lstpoint[2], tree_lstpoint[3]);
                    this.context.bezierCurveTo(cp_stick_down[2], cp_stick_down[3], cp_stick_down[0], cp_stick_down[1]+80-layer*5, this.start_x + this.add_bend - this.dl, this.start_y);
                    leaf_pos = [tree_lstpoint[2], tree_lstpoint[3]];
                }
                else{
                    this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                    // this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);
                    this.context.bezierCurveTo(cp_stick_up[0], cp_stick_up[1], cp_stick_up[2], cp_stick_up[3], tree_lstpoint[0], tree_lstpoint[1]);
                    this.context.bezierCurveTo(cp_stick_up[2], cp_stick_up[3], cp_stick_up[0], cp_stick_up[1]-80+layer*5, this.start_x + this.add_bend, this.start_y);
                }
                
                this.context.fill();//fill color
                this.context.stroke();//draw line

                for(var a = 0, len = alters["down"].length; a < len; a++){
                    // store fruits
                    // fruit_d += alters["down"][a]["fruit"];
                    if(jQuery.isEmptyObject(alter["down"][a])){
                        continue;
                    }
                    if(alters["down"][a]["fruit"] == draw_fruit){
                        fruit_d++;
                    }

                    for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                        var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                        if(raw_color>stop[1]){
                            stop[1] = raw_color;
                        }
                        if(raw_color<stop[0]){
                            stop[0] = raw_color;
                        }
                        // down_leaf += alters["down"][a]["leaf"][n]["size"];
                    }
                }

                // this.context.beginPath();
                // this.context.fillStyle ='rgb(225,0,0)';//fill color
                // this.context.strokeStyle ='rgb(225,0,0)';//line's color

                // this.circle(this.context, tree_rstpoint[0]-fruit_u, tree_rstpoint[1]+fruit_u, fruit_u);
                var radius_d = (fruit_d/alters["down"].length)*30+fruit_d;
                this.tree_fruit(this.context, leaf_pos[0], leaf_pos[1]+radius_d, radius_d);
                this.context.closePath();
                this.context.stroke();
                this.context.fill();

                // var grd = this.context.createLinearGradient(tree_lstpoint[2], tree_lstpoint[3], tree_lstpoint[2]-(Math.log(total_leaf["down"])+1)*15, tree_lstpoint[3]);
                var grd = this.context.createLinearGradient(0, 0, -(Math.log(total_leaf["down"])+1)*25, 0);
                grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
                grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);

                this.context.fillStyle = grd;
                // this.context.strokeStyle ='#809C73';//line's color
                // this.context.fillStyle = "#C2B208";

                // this.context.beginPath();
                this.leaf_style_1(this.context, leaf_pos[0], leaf_pos[1], -(Math.log(total_leaf["down"])+1)*20, grd, -Math.PI/4);
                // this.context.closePath();
                // this.context.stroke();
                // this.context.fill();

                var num = parseInt("7D6041", 16); 
                num += 6*(layer-2);

                this.context.fillStyle = "#" + num.toString(16);
                this.context.strokeStyle = "#" + num.toString(16);
                this.context.beginPath();

            }
            // this.context.fill();//fill color
            this.context.beginPath();
            if(layer == 0){
                var cp_trunk = [this.start_x + this.add_bend/2 - this.dl, this.start_y + this.temp_height + this.stick_length, this.start_x + this.add_bend/2, this.start_y + this.temp_height + this.stick_length];
                this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[0], cp_trunk[1], this.start_x - this.dl - 80, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x + this.add_bend, this.start_y);
                
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x + this.add_bend/2 - this.dl, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2 - this.dl, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                var cp_trunk_inside = [this.start_x + this.add_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                // this.context.lineTo( this.start_x - this.last_dl, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.last_dl, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk_inside[2], cp_trunk_inside[3], cp_trunk_inside[0], cp_trunk_inside[1], this.start_x + this.add_bend, this.start_y);
                // this.context.lineTo(this.start_x + this.add_bend, this.start_y);
                
                this.context.closePath();
            }
            

            this.context.stroke();//draw line
            this.context.fill();//fill color
        }
        else{ // no branch
            this.context.beginPath();
            if(layer == 0){
                var cp_trunk = [this.start_x + this.add_bend/2 - this.dl, this.start_y + this.temp_height + this.stick_length, this.start_x + this.add_bend/2, this.start_y + this.temp_height + this.stick_length];
                this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[0], cp_trunk[1], this.start_x - this.dl - 80, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + 150);
                this.context.lineTo(this.start_x + this.add_bend, this.start_y);
                
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x + this.add_bend/2 - this.dl, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2 - this.dl, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                var cp_trunk_inside = [this.start_x + this.add_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2, 
                                this.start_x + this.add_last_bend/2, 
                                this.start_y + (this.temp_height + this.stick_length)/2];
                this.context.moveTo(this.start_x + this.add_bend - this.dl, this.start_y);
                // this.context.lineTo( this.start_x - this.last_dl, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.last_dl, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.bezierCurveTo(cp_trunk_inside[2], cp_trunk_inside[3], cp_trunk_inside[0], cp_trunk_inside[1], this.start_x + this.add_bend, this.start_y);
                // this.context.lineTo(this.start_x + this.add_bend, this.start_y);
                
                this.context.closePath();
            }
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.left_cluster_leaf.push({});
        
            return 1;
        }

    },

    /****************************** Not good looking ***********************************************************/
    redraw_cluster: function(){
        var self = this;
        // console.log("in redraw");
        var display_ego = self.model.get("display_egos");
        var structure = self.model.get("tree_structure");
        // console.log("display", display_ego);
        // console.log("structure", structure);
        // this.scale = self.model.get("canvas_scale");
        this.context.lineWidth = 102; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.myCanvas.width, this.myCanvas.height);
        this.context.save();

        this.context.translate(self.model.get("canvas_translate")[0], self.model.get("canvas_translate")[1]);
        this.context.scale(this.scale, this.scale);
        this.start_x = 0; //_glx
        this.add_nature = 120;

        for(var e in display_ego){
            for(var t = 0; t < display_ego[e].length; t++){
                this.context.lineWidth = 102; // set the style
                this.right_cluster_leaf = [];
                this.left_cluster_leaf = [];
                var sub = display_ego[e][t];
                // console.log("render slected", structure[sub][e]);
                var ego = structure[self.view][sub][e];
                this.tree_rstpoint = [0, 0, 0, 0];
                this.tree_lstpoint = [0, 0, 0, 0];
                var left_side = 0;
                var right_side = 0;
                self.total_layer = ego["left"].length;
                self.stick_length = self.tree_tall/self.total_layer; //_dist
                var layer_total_alter = {"right": [], "left": []};
                
                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly

                for(var s = 0; s < self.total_layer; s++){
                    var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
                    var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;

                    layer_total_alter["right"].push(r);
                    layer_total_alter["left"].push(l);
                    left_side += l;
                    right_side += r;
                }
                var total_contact = left_side + right_side;
                if(total_contact == 0){
                    continue;
                    // alart and delete this ego
                }
                
                // console.log("count total amount for layer", layer_total_alter);
                // console.log("count total amount for rendering", left_side, right_side, total_contact);
                
                var branch_index = layer_total_alter["left"].indexOf(Math.max.apply(Math,layer_total_alter["left"]));
                var msg = "";
                if(self.view == "diary"){
                    msg = "EGO" + e + "|" + sub;
                }
                else if(self.view == "DBLP"){
                    msg = e;
                }
                var pos = [];
                var info_pos = [];
                var info_box = ["Total Alters on Right: "+ right_side, "Total Alters on Left: "+ left_side];
                // this.start_x + this.x_dist - stick_width + this.extra_x
                if(ego["left"][branch_index]["level"]["down"].length >= ego["left"][branch_index]["level"]["up"].length){
                    this.start_x += ((ego["left"][branch_index]["level"]["down"].length + 100)*7 + this.x_dist); //_glx
                }
                else{
                    this.start_x += ((ego["left"][branch_index]["level"]["up"].length + 100)*7 + this.x_dist); //_glx
                }
                // console.log("branch max", Math.max.apply(Math,layer_total_alter["left"]))

                var ori_dr = right_side;
                var ori_dl = left_side;
                var check_dr = right_side;
                var check_dl = left_side;

                // pos = [this.start_x - ori_dl/1.5 - 130, this.start_y + this.stick_length + 350];
                pos = [((this.start_x - ori_dl/1.7 - 50)+(this.start_x + ori_dr/1.7 + 50))/2-270, this.start_y + this.stick_length + 350];
                info_pos = [this.start_x + ori_dr/1.7 + 150, this.start_y + this.stick_length + 50];

                for(var height = 0; height < self.total_layer; height++){                    
                    // console.log("trunk_r",ori_dr);
                    // console.log("trunk_l",ori_dl);
                    // mapping_color.trunk.split("#")[0]
                    var num = parseInt("7D6041", 16); 
                    num += 6*(height-2);

                    this.context.fillStyle = "#" + num.toString(16);
                    this.context.strokeStyle = "#" + num.toString(16);
                    // trunk width left and right
                   
                    this.dr = ori_dr/1.7;
                    this.dl = ori_dl/1.7;

                    this.temp_height = 50;
                    
                    if(height % 2 == 0){
                        this.start_y += this.add_nature;
                    }
                    else{
                        // this.start_y -= this.add_nature;
                    }
                    // draw right tree
                    this.extra_y = (right_side/self.total_layer)/1.7; //control point weight for its torson
                    this.context.beginPath();
                    if((height == self.total_layer-1 && layer_total_alter["right"][height] == 0) || check_dr == 0){}

                    else
                        this.draw_right_cluster(height, layer_total_alter["right"][height], ego["right"][height]["level"]);

                    this.context.beginPath();
                    if(height % 2 == 1){
                        // this.start_y += this.add_nature;
                    }
                    else{
                        this.start_y -= this.add_nature;
                    }
                    this.extra_y = (left_side/self.total_layer)/1.5; //control point weight for its torson
                    if((height == self.total_layer-1 && layer_total_alter["left"][height] == 0) || check_dl == 0){}

                    else
                        this.draw_left_cluster(height, layer_total_alter["left"][height], ego["left"][height]["level"]);
                    // this.context.restore();
                    // next layer
                    ori_dr -= (right_side/self.total_layer);
                    ori_dl -= (left_side/self.total_layer);
                    check_dr -= layer_total_alter["right"][height];
                    check_dl -= layer_total_alter["left"][height];
                    this.start_y = this.start_y - this.stick_length - this.temp_height;
                    // this.start_x = this.start_x + 100;
                    // height += 1;
                }
                /*
                // draw cluster leaf
                this.context.lineWidth = 30; // set the style
                for(var h = 0; h < self.total_layer; h++){

                    if(!jQuery.isEmptyObject(self.right_cluster_leaf[h])){
                        this.ellipse(this.context, this.right_cluster_leaf[h]["pu"][0], this.right_cluster_leaf[h]["pu"][1], this.right_cluster_leaf[h]["ru"], this.right_cluster_leaf[h]["cu"], this.right_cluster_leaf[h]["fu"]); 
                        this.ellipse(this.context, this.right_cluster_leaf[h]["pd"][0], this.right_cluster_leaf[h]["pd"][1], this.right_cluster_leaf[h]["rd"], this.right_cluster_leaf[h]["cd"], this.right_cluster_leaf[h]["fd"]); 
                        // this.ellipse(this.context, this.left_cluster_leaf[h]["pu"][0], this.left_cluster_leaf[h]["pu"][1], this.left_cluster_leaf[h]["ru"]); 
                        // this.ellipse(this.context, this.left_cluster_leaf[h]["pd"][0], this.left_cluster_leaf[h]["pd"][1], this.left_cluster_leaf[h]["rd"]);  
                    }
                    if(!jQuery.isEmptyObject(self.left_cluster_leaf[h])){
                        // this.ellipse(this.context, this.right_cluster_leaf[h]["pu"][0], this.right_cluster_leaf[h]["pu"][1], this.right_cluster_leaf[h]["ru"]); 
                        // this.ellipse(this.context, this.right_cluster_leaf[h]["pd"][0], this.right_cluster_leaf[h]["pd"][1], this.right_cluster_leaf[h]["rd"]); 
                        this.ellipse(this.context, this.left_cluster_leaf[h]["pu"][0], this.left_cluster_leaf[h]["pu"][1], this.left_cluster_leaf[h]["ru"], this.left_cluster_leaf[h]["cu"], this.left_cluster_leaf[h]["fu"]); 
                        this.ellipse(this.context, this.left_cluster_leaf[h]["pd"][0], this.left_cluster_leaf[h]["pd"][1], this.left_cluster_leaf[h]["rd"], this.left_cluster_leaf[h]["cd"], this.left_cluster_leaf[h]["fd"]);  
                    }
                }
                */
                this.set_tree_label(this.context, msg, pos);
                this.set_tree_info(this.context, info_box, info_pos);
                var branch_index = layer_total_alter["right"].indexOf(Math.max.apply(Math,layer_total_alter["right"]));

                if(ego["right"][branch_index]["level"]["down"].length >= ego["right"][branch_index]["level"]["up"].length){
                    this.start_x += ((ego["right"][branch_index]["level"]["down"].length + 100)*7 + this.x_dist); //_glx
                }
                else{
                    this.start_x += ((ego["right"][branch_index]["level"]["up"].length + 100)*7 + this.x_dist); //_glx
                }

                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly
            }
        }
        this.context.restore();
    },

    draw_right_cluster: function(layer, num_alter, alters){
        var self = this;
        
        var stick_width = this.extra_y;
        // this.extra_y
        // this.extra_x = Math.sqrt(num_alter)*10; //control point (constant)
        this.extra_x = (num_alter)*6;
        // console.log("this.extra_x", this.extra_x); 
        var tree_rstpoint = [0, 0, 0, 0];
        // this.extra_y = 50; 
        tree_rstpoint[0] = this.start_x + this.x_dist - stick_width + this.extra_x; // down point
        tree_rstpoint[1] = this.start_y - this.y_dist - this.extra_x - 40 - layer*20;

        // tree_rstpoint[2] = this.start_x + this.x_dist - stick_width + this.extra_x; // up point
        // tree_rstpoint[3] = this.start_y - this.y_dist - stick_width - 60 - 30;
        var cp_stick = [this.start_x + this.dr - stick_width, this.start_y - this.y_dist - 50, this.start_x + this.x_dist + this.extra_x - 70 - stick_width, this.start_y - this.y_dist - 50];
        
        this.context.moveTo(this.start_x + this.dr - stick_width, this.start_y+15);
        if(num_alter > 0){
            this.context.bezierCurveTo(cp_stick[0], cp_stick[1], cp_stick[2], cp_stick[3], tree_rstpoint[0], tree_rstpoint[1]);
            // this.context.moveTo(tree_rstpoint[0], tree_rstpoint[1]-5);
            this.context.bezierCurveTo(cp_stick[2], cp_stick[3], cp_stick[0], cp_stick[1], this.start_x + this.dr - stick_width, this.start_y + 15);
            // this.context.lineTo(tree_rstpoint[0], tree_rstpoint[1]);
            // this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
            // this.context.lineTo(this.start_x, tree_rstpoint[3] + 80);
            // this.context.lineTo(this.start_x, this.start_y);
            // this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.context.beginPath();
            if(layer == 0){
                var cp_trunk = [this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x + this.dr - stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.dr + 50, this.start_y + this.temp_height + this.stick_length);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x + this.dr, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x + this.dr - stick_width, this.start_y);
                // this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();
            }

            this.context.stroke();//draw line
            this.context.fill();//fill color

        }
        else{ // no branch
            if(layer == 0){
                var cp_trunk = [this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x + this.dr - stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.dr + 50, this.start_y + this.temp_height + this.stick_length);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();
            }
            else{
                var cp_trunk = [this.start_x + this.dr - stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x + this.dr, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x + this.dr - stick_width, this.start_y);
                // this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length + this.add_nature);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();
            }
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.right_cluster_leaf.push({});
            return 1;
        }
        var attr = self.model.get("attribute");
        var draw_fruit = data_range[this.view][attr.fruit][1];
        // store cluster leaf
        var up_leaf = 0;
        var down_leaf = 0;
        var cu = [8, 0];
        var cd = [8, 0];
        var fruit_u = 0;
        var fruit_d = 0;
        alter_exit = {"up":0, "down":0};

        for(var a = 0; a < alters["up"].length; a++){
            if(jQuery.isEmptyObject(alter["up"][a])){
                continue;
            }
            up_leaf += alters["up"][a]["leaf"].length;
            alter_exit["up"] = 1;
            // store fruits
            if(alters["up"][a]["fruit"] == draw_fruit){
                fruit_u++;
            }

            for(var n = 0; n < alters["up"][a]["leaf"].length; n++){
                var raw_color = parseInt(alters["up"][a]["leaf"][n]["color"]);
                if(raw_color>cu[1]){
                    cu[1] = raw_color;
                }
                if(raw_color<cu[0]){
                    cu[0] = raw_color;
                }
                // up_leaf += alters["up"][a]["leaf"][n]["size"];
            }
        }

        for(var a = 0; a < alters["down"].length; a++){
            if(jQuery.isEmptyObject(alter["down"][a])){
                continue;
            }
            down_leaf += alters["down"][a]["leaf"].length;
            alter_exit["down"] = 1;
            // store fruits
            if(alters["down"][a]["fruit"] == draw_fruit){
                fruit_d++;
            }

            for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                if(raw_color>cd[1]){
                    cd[1] = raw_color;
                }
                if(raw_color<cd[0]){
                    cd[0] = raw_color;
                }
                // down_leaf += alters["down"][a]["leaf"][n]["size"];
            }
        }
        // console.log("up and down", up_leaf, down_leaf)

        // store fruits
        // var attr = self.model.get("attribute");
        // var draw_fruit = Math.round((data_range[this.view][attr.fruit][1]-data_range[this.view][attr.fruit][0])/2);
        
        // // alters[long_stick][n]["fruit"]
        // if(alters[long_stick][n]["fruit"] > draw_fruit){
        //     this.tree_fruit(this.context, fruit_pos[long_stick][0], fruit_pos[long_stick][1]);
        // }
       
        if(alter_exit["up"] == 0){
            this.right_cluster_leaf.push({"pu":[tree_rstpoint[0] + 25 + down_leaf/3+120, tree_rstpoint[1]-25], "ru":0, "pd":[tree_rstpoint[0] + 25, tree_rstpoint[1]+25], "rd":down_leaf/3+100, "cd":cd, "cu":[0,0], "fu":fruit_u, "fd":fruit_d});
        }
        else if(alter_exit["down"] == 0){
            this.right_cluster_leaf.push({"pu":[tree_rstpoint[0] + 25, tree_rstpoint[1]-25], "ru":up_leaf/3+100, "pd":[tree_rstpoint[0] + 25, tree_rstpoint[1]+25], "rd":0, "cd":[0,0], "cu":cu, "fu":fruit_u, "fd":fruit_d});
        }
        else{
            this.right_cluster_leaf.push({"pu":[tree_rstpoint[0] + 25 + down_leaf/3+120, tree_rstpoint[1]-25], "ru":up_leaf/3+100, "pd":[tree_rstpoint[0] + 25, tree_rstpoint[1]+25], "rd":down_leaf/3+100, "cd":cd, "cu":cu, "fu":fruit_u, "fd":fruit_d});
        }
    },

    draw_left_cluster: function(layer, num_alter, alters){
        var self = this;
        
        var stick_width = this.extra_y;
        // this.extra_y
        // this.extra_x = Math.sqrt(num_alter)*10; //control point (constant)
        this.extra_x = (num_alter)*6; 
        var tree_lstpoint = [0, 0, 0, 0];
        // this.extra_y = 50; 
        // console.log("this.extra_x", this.extra_x);
        tree_lstpoint[0] = this.start_x - this.x_dist + stick_width - this.extra_x; // down point
        tree_lstpoint[1] = this.start_y - this.y_dist - this.extra_x - 40 - layer*20;

        // tree_lstpoint[2] = this.start_x - this.x_dist + stick_width - this.extra_x; // up point
        // tree_lstpoint[3] = this.start_y - this.y_dist - stick_width - 60 - 30;
        var cp_stick = [this.start_x - this.dl + stick_width, this.start_y - this.y_dist - 50, this.start_x - this.x_dist - this.extra_x + 70 + stick_width, this.start_y - this.y_dist - 50];
        
        this.context.moveTo(this.start_x - this.dl + stick_width, this.start_y+15);
        if(num_alter > 0){
            this.context.bezierCurveTo(cp_stick[0], cp_stick[1], cp_stick[2], cp_stick[3], tree_lstpoint[0], tree_lstpoint[1]);
            this.context.bezierCurveTo(cp_stick[2], cp_stick[3], cp_stick[0], cp_stick[1], this.start_x - this.dl + stick_width, this.start_y + 15);
            // this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);
            // this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
            // this.context.lineTo(this.start_x, tree_lstpoint[3] + 80);
            // this.context.lineTo(this.start_x, this.start_y);
            // this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.context.beginPath();
            if(layer == 0){
                var cp_trunk = [this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x - this.dl + stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.dl - 50, this.start_y + this.temp_height + this.stick_length  + this.add_nature);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length + this.add_nature);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x - this.dl, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x - this.dl + stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();
            }
            

            this.context.stroke();//draw line
            this.context.fill();//fill color
        }
        else{ // no branch
            if(layer == 0){
                var cp_trunk = [this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x - this.dl + stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.dl - 50, this.start_y + this.temp_height + this.stick_length  + this.add_nature);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length  + this.add_nature);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();

            }
            else{
                var cp_trunk = [this.start_x - this.dl + stick_width, this.start_y + this.stick_length/2 + this.temp_height/2, this.start_x - this.dl, this.start_y + this.stick_length/2 + this.temp_height/2];
                this.context.moveTo(this.start_x - this.dl + stick_width, this.start_y);
                this.context.bezierCurveTo(cp_trunk[0], cp_trunk[1], cp_trunk[2], cp_trunk[3], this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length);
                // this.context.lineTo(this.start_x - this.dr, this.start_y + this.temp_height + this.stick_length);
            
                this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length);
                this.context.lineTo(this.start_x, this.start_y);
                this.context.closePath();
            }
            this.context.stroke();//draw line
            this.context.fill();//fill color
            this.left_cluster_leaf.push({});
        
            return 1;
        }
        var attr = self.model.get("attribute");
        var draw_fruit = data_range[this.view][attr.fruit][1];
        // Math.round((data_range[this.view][attr.fruit][1]-data_range[this.view][attr.fruit][0])/2);
        // store cluster leaf
        var up_leaf = 0;
        var down_leaf = 0;
        var cu = [8, 0];
        var cd = [8, 0];
        var fruit_u = 0;
        var fruit_d = 0;
        var alter_exit = {"up":0, "down":0};
        for(var a = 0; a < alters["up"].length; a++){
            if(jQuery.isEmptyObject(alter["up"][a])){
                continue;
            }
            up_leaf += alters["up"][a]["leaf"].length;
            alter_exit["up"] = 1;
            // store fruits
            if(alters["up"][a]["fruit"] == draw_fruit){
                fruit_u++;
            }
            for(var n = 0; n < alters["up"][a]["leaf"].length; n++){
                var raw_color = parseInt(alters["up"][a]["leaf"][n]["color"]);
                if(raw_color>cu[1]){
                    cu[1] = raw_color;
                }
                if(raw_color<cu[0]){
                    cu[0] = raw_color;
                }
                // up_leaf += alters["up"][a]["leaf"][n]["size"];
            }
        }
        
        for(var a = 0; a < alters["down"].length; a++){
            if(jQuery.isEmptyObject(alter["down"][a])){
                continue;
            }
            down_leaf += alters["down"][a]["leaf"].length;
            alter_exit["down"] = 1;
            // store fruits
            if(alters["down"][a]["fruit"] == draw_fruit){
                fruit_d++;
            }
            for(var n = 0; n < alters["down"][a]["leaf"].length; n++){
                var raw_color = parseInt(alters["down"][a]["leaf"][n]["color"]);
                if(raw_color>cd[1]){
                    cd[1] = raw_color;
                }
                if(raw_color<cd[0]){
                    cd[0] = raw_color;
                }
                // down_leaf += alters["down"][a]["leaf"][n]["size"];
            }
        }
        // console.log("check", cd);
        if(alter_exit["up"] == 0){
            this.left_cluster_leaf.push({"pu":[tree_lstpoint[0] - 25 - down_leaf/3-120, tree_lstpoint[1]-25], "ru":0, "pd":[tree_lstpoint[0] - 25, tree_lstpoint[1]+25], "rd":down_leaf/3+100, "cd":cd, "cu":[0,0], "fu":fruit_u, "fd":fruit_d});   
        }
        else if(alter_exit["down"] == 0){
            this.left_cluster_leaf.push({"pu":[tree_lstpoint[0] - 25, tree_lstpoint[1]-25], "ru":up_leaf/3+100, "pd":[tree_lstpoint[0] - 25, tree_lstpoint[1]+25], "rd":0, "cd":[0,0], "cu":cu, "fu":fruit_u, "fd":fruit_d});
        }
        else{
            this.left_cluster_leaf.push({"pu":[tree_lstpoint[0] - 25 - down_leaf/3-120, tree_lstpoint[1]-25], "ru":up_leaf/3+100, "pd":[tree_lstpoint[0] - 25, tree_lstpoint[1]+25], "rd":down_leaf/3+100, "cd":cd, "cu":cu, "fu":fruit_u, "fd":fruit_d});
        }

    },
    /**********************************************************************************************************/

    redraw_symmetry: function(){
        var self = this;

        this.stick_dx = 50;
        this.stick_dy = 50;
        this.sub_stick_length = 55;
        this.sub_slop = 0;
        // console.log("in redraw");
        var display_ego = self.model.get("display_egos");
        var structure = self.model.get("tree_structure");
        // console.log("select", display_ego);
        // console.log("structure", structure);
        // this.scale = self.model.get("canvas_scale");
        // this.translate_point = self.model.get("canvas_translate");
        this.context.lineWidth = 5; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.myCanvas.width, this.myCanvas.height);
        this.context.save();

        this.context.translate(this.translate_point[0], this.translate_point[1]);
        this.context.scale(this.scale, this.scale);
        this.start_x = 0; //_glx
        // this.start_y = (this.myCanvas.height/0.15)-650; //_gly
        var canvas_x_boundary = [-this.translate_point[0]/this.scale, (self.myCanvas.width - this.translate_point[0]) / this.scale ];
        var canvas_y_boundary = [-this.translate_point[1]/this.scale, (self.myCanvas.height - this.translate_point[1]) / self.scale ];

        // for each ego tree
        var total_distance = 0;
        for(var e in display_ego){
            for(var t = 0; t < display_ego[e].length; t++){
                var sub = display_ego[e][t];
                this.subyear = sub;
                
                var ego = structure[self.view][sub][e];
                this.tree_rstpoint = [0, 0, 0, 0];
                this.tree_lstpoint = [0, 0, 0, 0];
                var left_side = 0;
                var right_side = 0;
                self.total_layer = ego["left"].length;
                self.stick_length = self.tree_tall/self.total_layer; //_dist
                var layer_total_alter = {"right": [], "left": []};
                
                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly

                for(var s = 0; s < self.total_layer; s++){
                    var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
                    var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;

                    layer_total_alter["right"].push(r);
                    layer_total_alter["left"].push(l);
                    left_side += l;
                    right_side += r;
                }
                var total_contact = left_side + right_side;
                // console.log("count total amount for layer", layer_total_alter);
                // console.log("count total amount for rendering", left_side, right_side, total_contact);
                
                // var branch_index = layer_total_alter["left"].indexOf(Math.max.apply(Math,layer_total_alter["left"]));
                var info_box = ["Total Alters on Right: "+ right_side, "Total Alters on Left: "+ left_side];
                if(total_contact == 0){
                    continue;
                    // alart and delete this ego
                }
                var msg = "";
                if(self.group != "all"){
                    msg = "EGO_" + e.toUpperCase() + "|" + sub;
                }
                else{
                    msg = "EGO_" + e.toUpperCase();
                }
                // info_box = info_box = ["", ""];
                var pos = [];
                var info_pos = [];                

                // if(ego["left"][branch_index]["level"]["down"].length >= ego["left"][branch_index]["level"]["up"].length){
                //     this.start_x += ((ego["left"][branch_index]["level"]["down"].length + 2)*this.sub_stick_length + this.x_dist); //_glx
                // }
                // else{
                //     this.start_x += ((ego["left"][branch_index]["level"]["up"].length + 2)*this.sub_stick_length + this.x_dist); //_glx
                // }
                // console.log("branch max", Math.max.apply(Math,layer_total_alter["left"]))
               
                var stick_length = 0;
                
                for(var l = 0; l < layer_total_alter["left"].length; l++){
                    var down = ego["left"][l]["level"]["down"].length + l;
                    var up = ego["left"][l]["level"]["up"].length + l;
                    if(stick_length < down && down >= up){
                        stick_length = down;
                    }
                    else if(stick_length < up && down < up){
                        stick_length = up;
                    }
                }
                
                if(this.start_x > canvas_x_boundary[1]){
                    // console.log("extend right", msg);
                    break;
                }

                this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist); //_glx
                total_distance += ((stick_length)*this.sub_stick_length + this.x_dist);
                var ori_dr = right_side;
                var ori_dl = left_side;
                var t_scale = (right_side + left_side)/150;
                if(right_side+left_side < 80){
                    t_scale = 0.5;
                }
                else{
                    if(t_scale < 1){
                        t_scale = 1;
                    }
                }
                /*
                if(this.view == "diary" || this.view == "inter"){
                    // console.log("scale", ((right_side + left_side)/150));
                    if(t_scale < 1){
                        t_scale = 1;
                    }
                    // this.dr = ori_dr/t_scale;//1.5;
                    // this.dl = ori_dl/t_scale;
                }
                else{
                    if(right_side+left_side < 80){
                        t_scale = 0.5;
                    }
                    else{
                        if(t_scale < 1){
                            t_scale = 1;
                        }
                    }
                    // this.dr = ori_dr*1.1;
                    // this.dl = ori_dl*1.1;
                    // this.dr = ori_dr/t_scale;
                    // this.dl = ori_dl/t_scale;
                }
                */
                // pos = [this.start_x - 270, this.start_y + this.stick_length + 350];
                pos = [((this.start_x - ori_dl/t_scale)+(this.start_x + ori_dr/t_scale))/2-270, this.start_y + this.stick_length + 350];
                info_pos = [this.start_x + ori_dr/t_scale + 50, this.start_y + this.stick_length + 50];
                if(self.group == "all"){
                    pos = [((this.start_x - ori_dl/t_scale)+(this.start_x + ori_dr/t_scale))/2-170, this.start_y + this.stick_length + 350];
                }
                // count the right boundary
                var stick_length = 0;
                for(var r = 0; r < layer_total_alter["right"].length; r++){
                    var down = ego["right"][r]["level"]["down"].length + r;
                    var up = ego["right"][r]["level"]["up"].length + r;
                    if(stick_length < down && down >= up){
                        stick_length = down;
                    }
                    else if(stick_length < up && ego["right"][r]["level"]["down"].length < up){
                        stick_length = up;
                    }
                }
                
                if(this.start_x + ((stick_length)*this.sub_stick_length + this.x_dist) < canvas_x_boundary[0]){
                    // console.log("less left", msg);
                    this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist);
                    continue;
                }
                var start_h = 0;
                var add_h = 1;
                var max_h = self.total_layer;
                var mod_layer = Math.floor(8/self.total_layer);
                var layer_slop = Math.round(100/self.total_layer)/10;
                // console.log("in layer", self.total_layer);
                // if(mod_layer > 1){
                //     start_h = mod_layer-1;
                //     add_h = mod_layer;
                //     max_h = 8;
                // }

                // root
                var root_drawing = self.model.get("leaf_switch");
                if("root" in ego){
                    total_root = ego["root"][0];
                    if(root_drawing == 1)
                        self.draw_root(total_root, this.start_y + this.stick_length + 260, this.start_x + (ori_dr/t_scale)*1.5, this.start_x - (ori_dl/t_scale)*1.5, this.context);
                }
                
                this.context.lineWidth = 5; // set the style
                var real_height = 0;
                // for(var height = start_h; height < max_h; height+=add_h){
                for(var height = 0; height < self.total_layer; height++){
                    if(this.start_y + this.stick_length + this.temp_height < canvas_y_boundary[0]){
                        break;
                    }
                    if(this.start_y - (this.stick_length + this.temp_height)*5 > canvas_y_boundary[1]){
                        ori_dr -= layer_total_alter["right"][real_height];
                        ori_dl -= layer_total_alter["left"][real_height];
                        this.start_y = this.start_y - this.stick_length - this.temp_height;
                        // this.start_x = this.start_x + 100;
                        real_height += 1;
                        continue;
                    }
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();

                    // trunk width left and right
                    // this.dr = ori_dr/1.5;
                    // this.dl = ori_dl/1.5;
                    
                    this.dr = (ori_dr/t_scale)*1.5;//1.5;
                    this.dl = (ori_dl/t_scale)*1.5;
                    // if(this.dr<10){
                    //     this.dr = this.dr*10;
                    // }
                    // if(this.dl<10){
                    //     this.dl = this.dl*10;
                    // }
                    
                    this.temp_height = 30*height; //_d
                    if(real_height == 0){
                        this.temp_height = 60;
                    }

                    // this.extra_y = height*8; //control point weight for its torson
                    // this.extra_x = height*8; //control point (constant)
                    // this.sub_slop = height*10;
                    this.extra_y = height*8*layer_slop; //control point weight for its torson
                    this.extra_x = height*8*layer_slop; //control point (constant)
                    this.sub_slop = height*10*layer_slop;
                    // console.log("----", layer_slop);
                    // draw right tree
                    if((real_height == self.total_layer-1 && layer_total_alter["right"][real_height] == 0) || ori_dr == 0){}

                    else
                        this.draw_right_branch(height, layer_total_alter["right"][real_height], ego["right"][real_height]["level"]);

                    // draw left tree
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();
                    if((real_height == self.total_layer-1 && layer_total_alter["left"][real_height] == 0) || ori_dl == 0){}

                    else
                        this.draw_left_branch(height, layer_total_alter["left"][real_height], ego["left"][real_height]["level"]);

                    // next layer
                    ori_dr -= layer_total_alter["right"][real_height];
                    ori_dl -= layer_total_alter["left"][real_height];
                    this.start_y = this.start_y - this.stick_length - this.temp_height;
                    // this.start_x = this.start_x + 100;
                    real_height += 1;
                }
                // this.x_dist*this.scale

                this.set_tree_label(this.context, msg, pos);
                this.set_tree_info(this.context, info_box, info_pos);
                
                this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist); //_glx
                // total_distance += ((stick_length + 2)*this.sub_stick_length + this.x_dist);
                
                // var branch_index = layer_total_alter["right"].indexOf(Math.max.apply(Math,layer_total_alter["right"]));

                // if(ego["right"][branch_index]["level"]["down"].length >= ego["right"][branch_index]["level"]["up"].length){
                //     this.start_x += ((ego["right"][branch_index]["level"]["down"].length + 2)*this.sub_stick_length + this.x_dist); //_glx
                // }
                // else{
                //     this.start_x += ((ego["right"][branch_index]["level"]["up"].length + 2)*this.sub_stick_length + this.x_dist); //_glx
                // }

                // this.start_x += (Math.max.apply(Math,layer_total_alter["right"])*55 + this.x_dist); //_glx
                // this.start_y = (this.myCanvas.height/0.15)-650; //_gly
                // console.log("======", total_distance*this.scale, this.myCanvas.width);
                // if(total_distance*this.scale > this.myCanvas.width){
                //     break;
                // }
                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly
            }
            // if(total_distance*this.scale > this.myCanvas.width){
            //     break;
            // }
        }
        
        /*
        this.context.save();
        this.context.translate(-this.translate_point[0]/this.scale, -this.translate_point[1]/this.scale);
        // this.context.translate(0, 0);
        // this.context.scale(1, 1);
        for(var x = 0; x <= this.myCanvas.width/this.c_detail; x++){
            for(var y = 0; y <= this.myCanvas.height/this.c_detail; y++){
                if(this.clicking_grid[x][y] != -1){
                    this.context.font = '12pt Calibri';
                    this.context.fillStyle = 'red';
                    this.context.fillText("0", (x*self.c_detail)/this.scale, (y*self.c_detail)/this.scale); //pos
                }
            }
        }
        */
        
        this.context.restore();        
    },

    draw_right_branch: function(layer, num_alter, alters){
        var self = this;
        // console.log("branch_r", num_alter);
        var stick_scale = 0;
        stick_scale = num_alter/15;
        if(num_alter < 15){
            stick_scale = 1/1.5;
        }
        else{
            if(stick_scale < 1){
                stick_scale = 1;
            }
        }
        /*
        if(this.view == "diary" || this.view == "inter"){
            stick_scale = num_alter/20;//1.7;
            if(stick_scale < 1){
                stick_scale = 1;
            }
            // else{}
        }
        else{
            stick_scale = num_alter/15;
            if(num_alter < 15){
                stick_scale = 1/1.5;
            }
            else{
                if(stick_scale < 1){
                    stick_scale = 1;
                }
            }
            
        }
        */
        var stick_width = num_alter/stick_scale;
        // end point
        var tree_rstpoint = [0, 0, 0, 0];
        tree_rstpoint[0] = this.start_x + this.x_dist - this.extra_x; // down point
        tree_rstpoint[1] = this.start_y - this.y_dist - this.stick_length - this.extra_y;

        tree_rstpoint[2] = this.start_x + this.x_dist - this.extra_x; // up point
        tree_rstpoint[3] = this.start_y - this.y_dist - this.stick_length - this.extra_y - stick_width;

        // find control point
        // var m = (layer*10)/55;
        var m = this.sub_slop/55;
        // y = m(x-x1)+y1
        var c1 = m*(tree_rstpoint[0] - (this.start_x + this.dr)) + tree_rstpoint[1];
        var c2 = m*(tree_rstpoint[2] - this.start_x) + tree_rstpoint[3];

        var cp1 = [this.start_x + this.dr, this.start_y-100];
        var cp2 = [this.start_x + this.dr, c1];
        
        var cp3 = [this.start_x, c2];
        var cp4 = [this.start_x, this.start_y-100];

        // draw branch
        this.context.moveTo(this.start_x + this.dr, this.start_y + this.temp_height);
        if(num_alter > 0){
            this.context.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], tree_rstpoint[0], tree_rstpoint[1]);
            this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
            this.context.bezierCurveTo(cp3[0], cp3[1], cp4[0], cp4[1], this.start_x, this.start_y + this.temp_height);
            this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x + this.dr, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color
        }
        else{ // no branch
            this.context.lineTo(this.start_x + this.dr, this.start_y - this.stick_length);
            this.context.lineTo(this.start_x, this.start_y - this.stick_length);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x + this.dr, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color
            return 1;
        }
        // return 1;

        var weight = Math.abs(tree_rstpoint[3] - tree_rstpoint[1]);
        var stick_pos = {"up": [], "down": []};
        var long_stick, short_stick;
        // alters["up"], alters["down"]
        // count all the leaf
        // var total_leaf = this.count_total_leaf(alters);
        var temp_total_leaf = this.count_total_leaf(alters);
        var total_leaf = temp_total_leaf["up"] + temp_total_leaf["down"];
        // give index of position
        if(alters["up"].length > alters["down"].length){
            var n = Math.floor(alters["up"].length/alters["down"].length);
            stick_pos["up"] = util.order_list(0, alters["up"].length);
            //console.log("step", n)
            for(var a = alters["up"].length-1; a >= 0, alters["down"].length > 0; a -= n){
                stick_pos["down"].push(a);
                if(stick_pos["down"].length == alters["down"].length){
                    break;
                }
            }
            if(stick_pos["down"].length < alters["down"].length){
                stick_pos["down"].push(0);
            }
            stick_pos["down"].sort( function(a, b){return a-b} );
            long_stick = "up";
            short_stick = "down";
        }

        else if(alters["up"].length < alters["down"].length){
            var n = Math.floor(alters["down"].length/alters["up"].length);
            stick_pos["down"] = util.order_list(0, alters["down"].length);
            for(var a = alters["down"].length-1; a >= 0, alters["up"].length > 0; a -= n){
                stick_pos["up"].push(a);
                if(stick_pos["up"].length == alters["up"].length){
                    break;
                }
            }
            if(stick_pos["up"].length < alters["up"].length){
                stick_pos["up"].push(0);
            }
            stick_pos["up"].sort( function(a, b){return a-b} );
            long_stick = "down";
            short_stick = "up";
        }

        else{
            stick_pos["up"] = util.order_list(0, alters["up"].length);
            stick_pos["down"] = util.order_list(0, alters["down"].length);
            long_stick = "up";
            short_stick = "down";
        }

        //draw stick
        var count_short_stick = 0;
        var u = alters["up"].length;
        var d = alters["down"].length;
        
        // draw each sub stick
        // alters[long_stick].length?
        // if(self.on_moving == 1){
        //     return 0;
        // }
        var nature_scale = self.model.get("dtl_branch_curve");
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){
            // if(jQuery.isEmptyObject(alters[long_stick][n])){
            //     continue;
            // }
            // console.log("stick weight", Math.abs(tree_rstpoint[3] - tree_rstpoint[1]));
            // set up and down paramaters

            var nature = n*(Math.abs(d-u)/stick_scale);
            if(Math.abs(d-u)<len/2){
                // nature = n*(layer+1)*2;
                nature = n*((this.sub_slop/10)+1)*2;
            }
            else if(len>20 && Math.abs(d-u)/stick_scale>(layer+2)*2 && layer < 6){
                // nature = n*(layer+2)*2;
                nature = n*((this.sub_slop/10)+2)*2;
            }
            nature = nature*nature_scale;
            // nature = n*(layer+2)*2;
            // console.log("layer", layer, "abs", len/3, "nature", nature);
            var sx = {"up": (layer*5), "down":(layer*11)};
            var sy = {"up": (layer*7.5), "down":(layer*12)};
            var begin_index = {"up": [2, 3], "down":[0, 1]};
            var extra_slope = { "up": [(this.stick_dx-sx[long_stick])*0.4-nature/(len/2), (-this.stick_dy-sy[long_stick])*0.4-nature/(len/2)], 
                                "down":[(this.stick_dx+sx[long_stick])*0.4+nature/(len/2), (this.stick_dy-sy[long_stick])*0.4-nature/(len/2)] };
            // var stick_m = {"up": (-1.5 - layer/18)-nature/(len/2), "down":(0.5 - layer/5)-nature/(len/2)};
            var stick_m = {"up": extra_slope["up"][1]/extra_slope["up"][0], "down": extra_slope["down"][1]/extra_slope["down"][0]};
            var stick_v = {"up": [extra_slope["up"][0], extra_slope["up"][1]], "down": [extra_slope["down"][0], extra_slope["down"][1]]};
            var sub_total_leaf = 0;
            var fruit_pos = { "up": [tree_rstpoint[begin_index["up"][0]]+extra_slope["up"][0]+5, tree_rstpoint[begin_index["up"][1]]+extra_slope["up"][1]+10], 
                              "down":[tree_rstpoint[begin_index["down"][0]]+extra_slope["down"][0]-10, tree_rstpoint[begin_index["down"][1]]+extra_slope["down"][1]-3]};

            // this.tree_fruit(this.context, fruit_pos[long_stick][0], fruit_pos[long_stick][1], alters[long_stick][n]["fruit"]);
            
            // alters[long_stick][n]["id"]!!!!!!!!!!!
            // this.clicking_grid

            // sub stick
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();
                this.context.moveTo(tree_rstpoint[begin_index[long_stick][0]], tree_rstpoint[begin_index[long_stick][1]]);
                this.context.lineTo(tree_rstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_rstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1]);
                //context.lineTo(_rstpoint[2],_rstpoint[3])
                this.context.stroke();//draw line
                this.context.fill();//fill color
            }
            

            var stick_len = Math.sqrt( Math.pow(extra_slope[long_stick][0],2) + Math.pow(extra_slope[long_stick][1],2) );
            var point_in_canvas = [ (tree_rstpoint[begin_index[long_stick][0]]*this.scale) + this.translate_point[0], (tree_rstpoint[begin_index[long_stick][1]]*this.scale) + this.translate_point[1]];
            var stick_vector = [extra_slope[long_stick][0]/stick_len, extra_slope[long_stick][1]/stick_len];
            
            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick;
            
            /*
            // var hash = alters[long_stick][n]["id"]
            if(self.view == "inter"){
                // var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick;
            }
            else{
                var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"];
            }
            */
            
            /*
            for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                var p_index = [Math.round(point_in_canvas[0]+stick_vector[0]*i), Math.round(point_in_canvas[1]+stick_vector[1]*i)];
                // if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height){
                //     // console.log(p_index[0], p_index[1])
                //     this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                // }
                for(var xx = Math.ceil(-0.6*this.scale); xx < 0.6*this.scale; xx++){
                    for(var yy = Math.ceil(-0.6*this.scale); yy < 0.6*this.scale; yy++){
                        // var p_index = [Math.round(point_in_canvas[0]+stick_vector[0]*xx), Math.round(point_in_canvas[1]+stick_vector[1]*yy)];
                        p_index[0] += xx;
                        p_index[1] += yy;
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    }
                }                
            }
            */
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                    var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                    if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                        // console.log(p_index[0], p_index[1])
                        this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                    }
                }
            }
            

            // change to vector later
            var up_line = this.find_line(tree_rstpoint[begin_index["up"][0]]+extra_slope["up"][0], tree_rstpoint[begin_index["up"][1]]+extra_slope["up"][1], stick_m["up"]);
            var down_line = this.find_line(tree_rstpoint[begin_index["down"][0]]+extra_slope["down"][0], tree_rstpoint[begin_index["down"][1]]+extra_slope["down"][1], stick_m["down"]);
            var leaf_line = {"up": up_line, "down":down_line};
            var start_point = [ tree_rstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_rstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1] ];
            
            // draw leaf
            // sub_total_leaf += this.draw_right_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            var stick_leaf = 0;
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                stick_leaf = this.draw_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            }
            // var stick_leaf = this.draw_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            sub_total_leaf += stick_leaf;

            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick;
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    
                    // if(hash_index_id in this.hash_table[this.subyear]){}
                    // else{
                    //     this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
            }


            /*
            if(self.view == "inter" && !jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick;
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    
                    // if(hash_index_id in this.hash_table[this.subyear]){}
                    // else{
                    //     this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
            }

            else{
                if(this.subyear in this.hash_table){
                    if(alters[long_stick][n]["id"] in this.hash_table[this.subyear]){}
                    else{
                        this.hash_table[this.subyear][alters[long_stick][n]["id"]] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][alters[long_stick][n]["id"]] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }

            }
            */
            
            // short stick
            if(stick_pos[short_stick][count_short_stick] == n){
                // this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1], alters[short_stick][count_short_stick]["fruit"]);
                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    // this.context.lineWidth = 3;
                    this.context.beginPath();
                    this.context.moveTo(tree_rstpoint[begin_index[short_stick][0]], tree_rstpoint[begin_index[short_stick][1]]);
                    this.context.lineTo(tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                    
                    this.context.stroke();//draw line
                    this.context.fill();//fill color
                }
                

                var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                var point_in_canvas = [ (tree_rstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_rstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                /*
                // var hash = alters[short_stick][n]["id"]
                if(self.view == "inter"){
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                }
                else{
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"];
                }
                */
                
                
                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    } 
                }
                 

                start_point = [ tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                // sub_total_leaf += this.draw_right_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                var stick_leaf = 0;
                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                   stick_leaf = this.draw_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]); 
                }
                sub_total_leaf += stick_leaf;

                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        
                        // if(hash_index_id in this.hash_table[this.subyear]){}
                        // else{
                        //     this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                }
                /*
                if(self.view == "inter" && !jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        
                        // if(hash_index_id in this.hash_table[this.subyear]){}
                        // else{
                        //     this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                }
                else{
                    if(this.subyear in this.hash_table){
                        if(alters[short_stick][count_short_stick]["id"] in this.hash_table[this.subyear]){}
                        else{
                            this.hash_table[this.subyear][alters[short_stick][count_short_stick]["id"]] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][alters[short_stick][count_short_stick]["id"]] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                }
                */                 


                // if(alters[short_stick][count_short_stick]["fruit"] > draw_fruit){
                //     this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1]);
                // }
                // if(alters[short_stick][count_short_stick]["fruit"] == draw_fruit){
                //     // this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1]);
                // }
                count_short_stick++;
            }
            // var w = (weight/total_leaf)*sub_total_leaf;
            var w = weight/len;
            if(sub_total_leaf > 35 && n < stick_pos[long_stick].length-1){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();

                var ori_rstpoint = [0, 0, 0, 0];
                ori_rstpoint[0]=tree_rstpoint[0];
                ori_rstpoint[1]=tree_rstpoint[1];
                ori_rstpoint[2]=tree_rstpoint[2];
                ori_rstpoint[3]=tree_rstpoint[3];
                tree_rstpoint[0] = tree_rstpoint[0]+this.sub_stick_length-nature/(len/2);
                tree_rstpoint[1] = tree_rstpoint[1]-this.sub_slop-nature/(len/2);
                tree_rstpoint[2] = tree_rstpoint[2]+this.sub_stick_length-nature/(len/2);
                tree_rstpoint[3] = tree_rstpoint[3]-this.sub_slop-nature/(len/2);

                this.context.moveTo(ori_rstpoint[0], ori_rstpoint[1]);
                // this.context.lineTo(tree_rstpoint[0]+this.sub_stick_length/2-nature/2, tree_rstpoint[1]-w/2-this.sub_slop/2-nature);
                // this.context.lineTo(tree_rstpoint[2]+this.sub_stick_length/2-nature/2, tree_rstpoint[3]+w/2-this.sub_slop/2-nature);
                this.context.lineTo(tree_rstpoint[0], tree_rstpoint[1]);
                this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
                this.context.lineTo(ori_rstpoint[2], ori_rstpoint[3]);
                this.context.closePath();
                this.context.stroke();//draw line
                this.context.fill();//fill color
            }
            
            // var nature = n*(Math.abs(u+d)/stick_scale);
            if(n < stick_pos[long_stick].length-1){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();

                var ori_rstpoint = [0, 0, 0, 0];
                ori_rstpoint[0] = tree_rstpoint[0];
                ori_rstpoint[1] = tree_rstpoint[1];
                ori_rstpoint[2] = tree_rstpoint[2];
                ori_rstpoint[3] = tree_rstpoint[3];
                tree_rstpoint[0] = tree_rstpoint[0]+this.sub_stick_length-nature/(len/2);
                tree_rstpoint[1] = tree_rstpoint[1]-w/2-this.sub_slop-nature/(len/2);
                tree_rstpoint[2] = tree_rstpoint[2]+this.sub_stick_length-nature/(len/2);
                tree_rstpoint[3] = tree_rstpoint[3]+w/2-this.sub_slop-nature/(len/2);

                this.context.moveTo(ori_rstpoint[0],ori_rstpoint[1]);
                // this.context.lineTo(tree_rstpoint[0]+this.sub_stick_length/2-nature/2, tree_rstpoint[1]-w/2-this.sub_slop/2-nature);
                // this.context.lineTo(tree_rstpoint[2]+this.sub_stick_length/2-nature/2, tree_rstpoint[3]+w/2-this.sub_slop/2-nature);
                this.context.lineTo(tree_rstpoint[0], tree_rstpoint[1]);

                if(n < stick_pos[long_stick].length-2){
                    this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
                    this.context.lineTo(ori_rstpoint[2], ori_rstpoint[3]);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    this.context.fill();//fill color
                }   

                else{
                    this.context.lineTo(ori_rstpoint[2], ori_rstpoint[3]);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    this.context.fill();//fill color

                    this.context.beginPath();
                    this.context.lineWidth = 1;
                    this.context.arc(tree_rstpoint[0], tree_rstpoint[1], 2, 0, 2*Math.PI, true);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();
                    this.context.lineWidth = 5;
                    tree_rstpoint[2] = tree_rstpoint[0];
                    tree_rstpoint[3] = tree_rstpoint[1];
                }                 
                                
            }
        
        }
        // this.stick_length


    },

    draw_left_branch: function(layer, num_alter, alters){
        var self = this;
        var stick_scale = 0;
        stick_scale = num_alter/15;
        if(num_alter < 15){
            stick_scale = 1/1.5;
        }
        else{
            if(stick_scale < 1){
                stick_scale = 1;
            }
        }
        /*
        if(this.view == "diary" || this.view == "inter"){
            stick_scale = num_alter/30;//1.7;
            if(stick_scale < 1){
                stick_scale = 1;
            }
            // else{}
        }
        else{
            stick_scale = num_alter/15;
            if(num_alter < 15){
                stick_scale = 1/1.5;
            }
            else{
                if(stick_scale < 1){
                    stick_scale = 1;
                }
            }
            
        }
        */
        var stick_width = num_alter/stick_scale;
        // end point
        var tree_lstpoint = [0, 0, 0, 0];
        tree_lstpoint[0] = this.start_x - this.x_dist + this.extra_x; // down point
        tree_lstpoint[1] = this.start_y - this.y_dist - this.stick_length - this.extra_y;

        tree_lstpoint[2] = this.start_x - this.x_dist + this.extra_x; // up point
        tree_lstpoint[3] = this.start_y - this.y_dist - this.stick_length - this.extra_y - stick_width;

        // find control point
        // var m = -(layer*10)/55;
        var m = -this.sub_slop/55;
        // y = m(x-x1)+y1
        var c1 = m*(tree_lstpoint[0] - (this.start_x - this.dl)) + tree_lstpoint[1];
        var c2 = m*(tree_lstpoint[2] - this.start_x) + tree_lstpoint[3];

        var cp1 = [this.start_x - this.dl, this.start_y-100];
        var cp2 = [this.start_x - this.dl, c1];
        
        var cp3 = [this.start_x, c2];
        var cp4 = [this.start_x, this.start_y-100];

        // draw branch
        this.context.moveTo(this.start_x - this.dl, this.start_y + this.temp_height);
        if(num_alter > 0){
            this.context.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], tree_lstpoint[0], tree_lstpoint[1]);
            this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
            this.context.bezierCurveTo(cp3[0], cp3[1], cp4[0], cp4[1], this.start_x, this.start_y + this.temp_height);
            this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x - this.dl, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color
        }
        else{ // no branch
            this.context.lineTo(this.start_x - this.dl, this.start_y - this.stick_length);
            this.context.lineTo(this.start_x, this.start_y - this.stick_length);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x - this.dl, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color
            return 1;
        }
        // return 1;

        var weight = Math.abs(tree_lstpoint[3] - tree_lstpoint[1]);
        var stick_pos = {"up": [], "down": []};
        var long_stick, short_stick;
        // alters["up"], alters["down"]
        // count all the leaf
        // var total_leaf = this.count_total_leaf(alters);
        var temp_total_leaf = this.count_total_leaf(alters);
        var total_leaf = temp_total_leaf["up"] + temp_total_leaf["down"];
        // give index of position
        if(alters["up"].length > alters["down"].length){
            var n = Math.floor(alters["up"].length/alters["down"].length);
            stick_pos["up"] = util.order_list(0, alters["up"].length);
            //console.log("step", n)
            for(var a = alters["up"].length-1; a >= 0, alters["down"].length > 0; a -= n){
                stick_pos["down"].push(a);
                if(stick_pos["down"].length == alters["down"].length){
                    break;
                }
            }
            if(stick_pos["down"].length < alters["down"].length){
                stick_pos["down"].push(0);
            }
            stick_pos["down"].sort( function(a, b){return a-b} );
            long_stick = "up";
            short_stick = "down";
        }

        else if(alters["up"].length < alters["down"].length){
            var n = Math.floor(alters["down"].length/alters["up"].length);
            stick_pos["down"] = util.order_list(0, alters["down"].length);
            for(var a = alters["down"].length-1; a >= 0, alters["up"].length > 0; a -= n){
                stick_pos["up"].push(a);
                if(stick_pos["up"].length == alters["up"].length){
                    break;
                }
            }
            if(stick_pos["up"].length < alters["up"].length){
                stick_pos["up"].push(0);
            }
            stick_pos["up"].sort( function(a, b){return a-b} );
            long_stick = "down";
            short_stick = "up";
        }

        else{
            stick_pos["up"] = util.order_list(0, alters["up"].length);
            stick_pos["down"] = util.order_list(0, alters["down"].length);
            long_stick = "up";
            short_stick = "down";
        }

        var count_short_stick = 0;
        var u = alters["up"].length;
        var d = alters["down"].length;
        
        // draw each sub stick
        // alters[long_stick].length?
        // if(self.on_moving == 1){
        //     return 0;
        // }
        var nature_scale = self.model.get("dtl_branch_curve");
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){

            var nature = n*(Math.abs(d-u)/stick_scale);
            if(Math.abs(d-u)<len/2){
                nature = n*((this.sub_slop/10)+1)*2;
            }
            else if(len>20 && Math.abs(d-u)/stick_scale>(layer+1)*3){
                nature = n*((this.sub_slop/10)+2)*2;
            }
            nature = nature*nature_scale;
            // console.log("layer", layer, "abs", len/3, "nature", nature);
            // set up and down paramaters
            // var stick_m = {"up": (1.2 + layer/18), "down": (-0.5 + layer/5)};
            var sx = {"up": (layer*5), "down":(layer*11)};
            var sy = {"up": (layer*7.5), "down":(layer*12)};
            var begin_index = {"up": [2, 3], "down":[0, 1]};
            var extra_slope = { "up": [(-this.stick_dx+sx[long_stick])*0.4+nature/(len/2), (-this.stick_dy-sy[long_stick])*0.4-nature/(len/2)], 
                                "down":[(-this.stick_dx-sx[long_stick])*0.4-nature/(len/2), (this.stick_dy-sy[long_stick])*0.4-nature/(len/2)] };
            var stick_m = {"up": extra_slope["up"][1]/extra_slope["up"][0], "down": extra_slope["down"][1]/extra_slope["down"][0]};
            var stick_v = {"up": [extra_slope["up"][0], extra_slope["up"][1]], "down": [extra_slope["down"][0], extra_slope["down"][1]]};
            var fruit_pos = { "up": [tree_lstpoint[begin_index["up"][0]]+extra_slope["up"][0]+10, tree_lstpoint[begin_index["up"][1]]+extra_slope["up"][1]+5], 
                              "down":[tree_lstpoint[begin_index["down"][0]]+extra_slope["down"][0]+10, tree_lstpoint[begin_index["down"][1]]+extra_slope["down"][1]+3]};
            // this.tree_fruit(this.context, fruit_pos[long_stick][0], fruit_pos[long_stick][1], alters[long_stick][n]["fruit"]);
          
            var sub_total_leaf = 0;
            // sub stick
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();
                this.context.moveTo(tree_lstpoint[begin_index[long_stick][0]], tree_lstpoint[begin_index[long_stick][1]]);
                this.context.lineTo(tree_lstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_lstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1]);
                //context.lineTo(_rstpoint[2],_rstpoint[3])
                this.context.stroke();//draw line
                // this.context.fill();//fill color
            }
            

            var stick_len = Math.sqrt( Math.pow(extra_slope[long_stick][0],2) + Math.pow(extra_slope[long_stick][1],2) );
            var point_in_canvas = [ (tree_lstpoint[begin_index[long_stick][0]]*this.scale) + this.translate_point[0], (tree_lstpoint[begin_index[long_stick][1]]*this.scale) + this.translate_point[1]];
            var stick_vector = [extra_slope[long_stick][0]/stick_len, extra_slope[long_stick][1]/stick_len];
            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick;
            /*
            // var hash = alters[long_stick][n]["id"]
            if(self.view == "inter")
                var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick;
            else
                var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"];
            */

            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                    var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                    if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                        this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                    }
                    
                }
            }
            

            var up_line = this.find_line(tree_lstpoint[begin_index["up"][0]]+extra_slope["up"][0], tree_lstpoint[begin_index["up"][1]]+extra_slope["up"][1], stick_m["up"]);
            var down_line = this.find_line(tree_lstpoint[begin_index["down"][0]]+extra_slope["down"][0], tree_lstpoint[begin_index["down"][1]]+extra_slope["down"][1], stick_m["down"]);
            var leaf_line = {"up": up_line, "down":down_line};
            var start_point = [ tree_lstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_lstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1] ];
           
            // draw leaf
            // sub_total_leaf += this.draw_left_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            var stick_leaf = 0;
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                stick_leaf = this.draw_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            }
            // var stick_leaf = this.draw_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            sub_total_leaf += stick_leaf;

            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick;
                
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // if(hash_index_id in this.hash_table[this.subyear]){}
                    // else{
                    //     this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
               
            }
            /*
            if(self.view == "inter" && !jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick;
                
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // if(hash_index_id in this.hash_table[this.subyear]){}
                    // else{
                    //     this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    // } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
                // if(alters[long_stick][n]["id"] == 7990){
                //     console.log("7990:", this.hash_table[this.subyear][hash_index_id]);
                // }
                // if(alters[long_stick][n]["id"] == 7887){
                //     console.log("7887:", this.hash_table[this.subyear][hash_index_id]);
                // }
            }
            else if(!jQuery.isEmptyObject(alters[long_stick][n])){
                if(this.subyear in this.hash_table){
                    if(alters[long_stick][n]["id"] in this.hash_table[this.subyear]){}
                    else{
                        this.hash_table[this.subyear][alters[long_stick][n]["id"]] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    } 
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][alters[long_stick][n]["id"]] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
            }
            */
            
            
            // fruit
            var attr = self.model.get("attribute");
            // var draw_fruit = Math.round((data_range[this.view][attr.fruit][1]-data_range[this.view][attr.fruit][0])/2);
                     
            // if(alters[long_stick][n]["fruit"] > draw_fruit){
            //     this.tree_fruit(this.context, fruit_pos[long_stick][0], fruit_pos[long_stick][1]);
            // }
            // var draw_fruit = data_range[this.view][attr.fruit][1];
            // if(alters[long_stick][n]["fruit"] == draw_fruit){
            //     // this.tree_fruit(this.context, fruit_pos[long_stick][0], fruit_pos[long_stick][1]);
            // }
            // else{}

            // short stick
            if(stick_pos[short_stick][count_short_stick] == n){
                // this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1], alters[short_stick][count_short_stick]["fruit"]);
                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();
                    this.context.moveTo(tree_lstpoint[begin_index[short_stick][0]], tree_lstpoint[begin_index[short_stick][1]]);
                    this.context.lineTo(tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                    //context.lineTo(_rstpoint[2],_rstpoint[3])
                    this.context.stroke();//draw line
                    // this.context.fill();//fill color
                }
                

                var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                var point_in_canvas = [ (tree_lstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_lstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                /*
                // var hash = alters[short_stick][n]["id"]
                if(self.view == "inter")
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick;
                else
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"];
                */

                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    }
                }
                

                start_point = [ tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                // sub_total_leaf += this.draw_left_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                stick_leaf = 0;
                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    stick_leaf = this.draw_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                }
                // var stick_leaf = this.draw_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                sub_total_leaf += stick_leaf;

                if(!jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick;                    
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // if(hash_index_id in this.hash_table[this.subyear]){}
                        // else{
                        //     this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                
                }

                /*             
                if(self.view == "inter" && !jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick;                    
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // if(hash_index_id in this.hash_table[this.subyear]){}
                        // else{
                        //     this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        // } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                
                }
                else if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    if(this.subyear in this.hash_table){
                        if(alters[short_stick][count_short_stick]["id"] in this.hash_table[this.subyear]){}
                        else{
                            this.hash_table[this.subyear][alters[short_stick][count_short_stick]["id"]] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        } 
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][alters[short_stick][count_short_stick]["id"]] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }  
                }
                */
                // if(alters[short_stick][count_short_stick]["fruit"] > draw_fruit){
                //     this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1]);
                // }
                // if(alters[short_stick][count_short_stick]["fruit"] == draw_fruit){
                //     // this.tree_fruit(self.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1]);
                // }
                // else{}
                count_short_stick++;
            }
            
            // var w = (weight/total_leaf)*sub_total_leaf;
            var w = weight/len;
            if(sub_total_leaf>35 && n < stick_pos[long_stick].length-1){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                var ori_lstpoint = [0, 0, 0, 0];
                ori_lstpoint[0] = tree_lstpoint[0];
                ori_lstpoint[1] = tree_lstpoint[1];
                ori_lstpoint[2] = tree_lstpoint[2];
                ori_lstpoint[3] = tree_lstpoint[3];
                tree_lstpoint[0] = tree_lstpoint[0]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[1] = tree_lstpoint[1]-this.sub_slop-nature/(len/2);
                tree_lstpoint[2] = tree_lstpoint[2]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[3] = tree_lstpoint[3]-this.sub_slop-nature/(len/2);

                this.context.beginPath();
                this.context.moveTo(ori_lstpoint[0],ori_lstpoint[1]);
                this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);
                this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
                this.context.lineTo(ori_lstpoint[2], ori_lstpoint[3]);
                this.context.closePath();
                this.context.stroke();//draw line
                this.context.fill();//fill color

                
            }
            // var nature = n*(Math.abs(u+d)/stick_scale);

            if(n < stick_pos[long_stick].length-1){
                var ori_lstpoint = [0, 0, 0, 0];
                ori_lstpoint[0] = tree_lstpoint[0];
                ori_lstpoint[1] = tree_lstpoint[1];
                ori_lstpoint[2] = tree_lstpoint[2];
                ori_lstpoint[3] = tree_lstpoint[3];
                tree_lstpoint[0] = tree_lstpoint[0]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[1] = tree_lstpoint[1]-w/2-this.sub_slop-nature/(len/2);
                tree_lstpoint[2] = tree_lstpoint[2]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[3] = tree_lstpoint[3]+w/2-this.sub_slop-nature/(len/2);

                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();
                this.context.moveTo(ori_lstpoint[0],ori_lstpoint[1]);
                this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);
                if(n < stick_pos[long_stick].length-2){
                    this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
                    this.context.lineTo(ori_lstpoint[2], ori_lstpoint[3]);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    this.context.fill();//fill color
                }                    
                else{
                    this.context.lineTo(ori_lstpoint[2], ori_lstpoint[3]);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    this.context.fill();//fill color

                    this.context.beginPath();
                    this.context.lineWidth = 1;
                    this.context.arc(tree_lstpoint[0], tree_lstpoint[1], 2, 0, 2*Math.PI, true);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();
                    this.context.lineWidth = 5;
                    tree_lstpoint[2] = tree_lstpoint[0];
                    tree_lstpoint[3] = tree_lstpoint[1];
                }
               
            }
              
        }

    },

    draw_leaf: function(side, alter, line, m, p, v){
        var self = this;
        var next = 0;
        // var leaf_size_table = [5*0.5, 8*0.5, 11*0.5, 14*0.5, 17*0.5, 20*0.5, 23*0.5, 26*0.5];
        // var fruit_size_table = [0, 2, 4, 6, 8, 10, 12, 14];
        var leaf_scale = self.model.get("leaf_scale");
        // var fruit_scale = Math.round((self.model.get("fruit_scale")+self.model.get("leaf_scale")*0.3) * 10) / 10;
        var fruit_scale = Math.round(self.model.get("fruit_scale")*self.model.get("leaf_scale")*10/3)/10;
        // var fruit_scale = self.model.get("fruit_scale")+(Math.round(self.model.get("leaf_scale")*0.3*10)/10);
        // var new_fruit_scale = self.model.get("fruit_scale")+self.model.get("leaf_scale")*0.3;
        // self.model.set({"fruit_scale": new_fruit_scale});
        
        // var fruit_scale = self.model.get("leaf_scale");
        // var leaf_hovor = self.model.get("clicking_leaf");
        var len_scale = self.model.get("sub_leaf_len_scale");
        var leaf_table = [];
        for(var i=0; i<mapping_size.leaf_size_table.length; i++){
            leaf_table.push(mapping_size.leaf_size_table[i]*leaf_scale);
        }
        var sum_leaf = alter["leaf"];

        var fruit_size = mapping_size.fruit_size_table[alter["fruit"]]*fruit_scale;

        var cluster = 10;
        var len = sum_leaf.length; 
        var g = 0;
        var sub = 0;

        var point_y = p[1];
        var point_x = p[0];
        
        var ori_m = m;
        var v_dist = Math.sqrt( Math.pow(v[0],2) + Math.pow(v[1],2) )
        var ori_v = [v[0]/v_dist, v[1]/v_dist];
        var dir_v = ori_v;
        var angle = Math.PI/2;

        if(cluster <= 1){
            cluster = 1000;
        }

        this.context.fillStyle = mapping_color.trunk;
        this.context.strokeStyle = mapping_color.trunk;
        this.context.closePath();
        this.context.beginPath();
        this.context.lineWidth = 1;
        this.context.arc(p[0], p[1], 2, 0, 2*Math.PI, true);
        this.context.closePath();
        this.context.stroke();
        this.context.fill();
        this.context.lineWidth = 5;
        while(g<len){
            // if(self.on_moving == 1){
            //     return 0;
            // }
            next = 0;
            // angle = Math.PI/2;
            if(len <= cluster){
                sub = 2;
                var tip = 0;
                
                if(self.on_moving == 0){
                    if(len < 3)
                        tip = fruit_size/2+2;
                    for(var t = 0; t < len; t++){
                        tip += (leaf_table[sum_leaf[t].size]/2);
                    }
                    this.tree_fruit(this.context, p[0]+(dir_v[0]*tip), p[1]+(dir_v[1]*tip), fruit_size);
                }
                
            }

            if(((sub-1)%3)!=0 && sub>0){
                m = dir_v[1]/dir_v[0];
                if(len > cluster && (len-g)<=cluster && self.on_moving == 0){
                    var tip = 0;
                    for(var t = g; t < len; t++){
                        tip += leaf_table[sum_leaf[t].size]/2;
                    }
                    this.tree_fruit(this.context, p[0]+(dir_v[0]*(15+tip)), p[1]+(dir_v[1]*(15+tip)), fruit_size);
                }

                for(var h = 0; h < cluster; h++){ 
                    var radius = leaf_table[sum_leaf[g].size];                    
                    var color = mapping_color.leaf_color[sum_leaf[g].color];
                    var leaf_id = sum_leaf[g].leaf_id;
                    
                    if(leaf_id != "none" && self.leaf_hovor == leaf_id){
                        radius = leaf_table[sum_leaf[g].size]*2;
                        if(next > 0){
                            point_y += dir_v[1]*radius*0.75;
                            point_x += dir_v[0]*radius*0.75;
                        }                        
                    }
                    else{
                        point_y += dir_v[1]*next;
                        point_x += dir_v[0]*next;
                    }
                    
                   
                    if(!isFinite(m)){ // m == Infinity
                        if(dir_v[1]>0)
                            angle = Math.PI/2;
                        else
                            angle = -Math.PI/2;
                    }                         
                    else if(m > 0){
                        if(dir_v[0]>0 && dir_v[1]>0)
                            angle = Math.atan(m);
                        else
                            angle = Math.PI+Math.atan(m);
                    }
                    else if(m < 0){
                        if(dir_v[0]>0 && dir_v[1]<0)
                            angle = Math.atan(m);
                        else
                            angle = Math.PI+Math.atan(m);
                    }
                    else{ //m == 0
                        if(dir_v[0]>0)
                            angle = 0;
                        else
                            angle = Math.PI;
                    }
                    
                    if(g%2==0){
                        angle = angle + (Math.PI/4);
                        // var clicking_point;
                        // var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];
                        // console.log("point: ", point_x, point_y);
                        for(var leaf_x = 0; leaf_x < 2.5*radius*this.scale; leaf_x++){
                            for(var leaf_y = -radius*this.scale*0.25; leaf_y < radius*this.scale*0.25; leaf_y++){
                                // x = xcos - ysin, y = ycos + xsin
                                var real_x = (point_x*this.scale + this.translate_point[0]) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                var real_y = (point_y*this.scale + this.translate_point[1]) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                // var real_x = (point_x*this.scale + leaf_x)*Math.cos(angle) - (point_y*this.scale  + leaf_y)*Math.sin(angle);
                                // var real_y = (point_y*this.scale + leaf_y)*Math.cos(angle) + (point_x*this.scale  + leaf_x)*Math.sin(angle);
                                
                                // var clicking_point = [Math.round((real_x + this.translate_point[0])/self.c_detail), Math.round((real_y + this.translate_point[1]*this.scale)/self.c_detail)];
                                var clicking_point = [Math.round(real_x/self.c_detail), Math.round(real_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail){
                                    if(leaf_id != "none")
                                        this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+" +  leaf_id;
                                    else
                                        this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+ ";
                                }
                            }
                            
                        }
                        this.leaf_style_1(this.context, point_x, point_y, radius, color, angle, leaf_id);
                                                
                    }
                    else{
                        angle = angle - (Math.PI/4);
                        for(var leaf_x = 0; leaf_x < 2.5*radius*this.scale; leaf_x++){
                            for(var leaf_y = -radius*this.scale*0.5; leaf_y < radius*this.scale*0.5; leaf_y++){
                                // x = xcos - ysin, y = ycos + xsin
                                var real_x = (point_x*this.scale + this.translate_point[0]) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                var real_y = (point_y*this.scale + this.translate_point[1]) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                // var real_x = (point_x*this.scale + leaf_x)*Math.cos(angle) - (point_y*this.scale  + leaf_y)*Math.sin(angle);
                                // var real_y = (point_y*this.scale + leaf_y)*Math.cos(angle) + (point_x*this.scale  + leaf_x)*Math.sin(angle);
                                
                                // var clicking_point = [Math.round((real_x + this.translate_point[0])/self.c_detail), Math.round((real_y + this.translate_point[1]*this.scale)/self.c_detail)];
                                var clicking_point = [Math.round(real_x/self.c_detail), Math.round(real_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail){
                                    if(leaf_id != "none")
                                        this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+" +  leaf_id;
                                    else
                                        this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+ ";
                                }
                            }
                            
                        }
                        this.leaf_style_1(this.context, point_x, point_y, radius, color, angle, leaf_id);
                        
                    }

                    if(h>0){
                        if(h==1){
                            var max = Math.max(leaf_table[sum_leaf[g].size], leaf_table[sum_leaf[g-1].size]);
                            if(sum_leaf[g].leaf_id != "none" && self.leaf_hovor == sum_leaf[g].leaf_id){
                                max = leaf_table[sum_leaf[g].size]*4;
                            }
                            else if(sum_leaf[g].leaf_id != "none" && self.leaf_hovor == sum_leaf[g-1].leaf_id){
                                max = leaf_table[sum_leaf[g-1].size]*4;
                            }
                                                        
                            next = max/2;
                        }
                        else{
                            next = leaf_table[sum_leaf[g].size]/2;
                            if(sum_leaf[g].leaf_id != "none" && self.leaf_hovor == sum_leaf[g].leaf_id){
                                next = leaf_table[sum_leaf[g].size]*2;
                            }
                        }
                    }
                    g++;
                    if(g == len)
                        break;
                }

            }

            // var set_alter_id = this.subyear + "_" + alter["id"];
            var set_alter_id = this.subyear + "_" + alter["id"] + "#" + side;
            /*
            if(self.view == "inter")
                set_alter_id = this.subyear + "_" + alter["id"] + "#" + side;
            */
            if(g<len){
                // control middle stick by ori_m
                this.context.beginPath();
                if(sub%3==0){
                    point_y = p[1]+ori_v[1]*20*len_scale;
                    point_x = p[0]+ori_v[0]*20*len_scale; 

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];

                    // var set_alter_id = this.subyear + "_" + alter["id"];
                    // if(self.view == "inter")
                    //     set_alter_id = this.subyear + "_" + alter["id"] + "#" + side;
                    
                    for(var i = 0; i < Math.round(20*len_scale*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+ori_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+ori_v[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    }
                }
                else if(sub%3==1){
                    dir_v = this.find_dir(ori_v, Math.PI/4);
                    point_y = p[1]+dir_v[1]*13*len_scale;
                    point_x = p[0]+dir_v[0]*13*len_scale;
                }
                if(sub%3 == 2){ 
                    point_y = p[1]+ori_v[1]*13*len_scale;
                    point_x = p[0]+ori_v[0]*13*len_scale;

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];
                    // var set_alter_id = this.subyear + "_" + alter["id"];
                    // if(self.view == "inter")
                    //     set_alter_id = this.subyear + "_" + alter["id"] + "#" + side;
                    
                    for(var i = 0; i < Math.round(13*len_scale*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+ori_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+ori_v[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    } 
                    this.context.lineWidth = 1;
                    this.context.beginPath();
                    this.context.arc(point_x, point_y, 2, 0, 2*Math.PI, true);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();
                    this.context.beginPath();
                    this.context.lineWidth = 5;
                    this.context.moveTo(p[0], p[1]);
                    this.context.lineTo(point_x, point_y);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    p[0] = point_x;
                    p[1] = point_y;

                    dir_v = this.find_dir(ori_v, -Math.PI/4);
                    point_y = p[1]+dir_v[1]*13*len_scale;
                    point_x = p[0]+dir_v[0]*13*len_scale;
                }
                                           
                if(sub%3 > 0 || (sub%3 == 0 && sub>0 && len-g>0)){
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();
                    this.context.lineWidth = 1;
                    this.context.arc(point_x, point_y, 2, 0, 2*Math.PI, true);
                    this.context.closePath();
                    this.context.stroke();
                    this.context.fill();
                    this.context.beginPath();
                    this.context.lineWidth = 5;
                    this.context.moveTo(p[0], p[1]);
                    this.context.lineTo(point_x, point_y);
                    this.context.closePath();
                    this.context.stroke();//draw line
                    // this.context.fill();//fill color
                }
                
                if(sub%3==0 && sub>0){
                    p[0] = point_x;
                    p[1] = point_y;
                }
                sub ++;
            }
            if(self.on_moving == 1){
                return 0;
            }
        }
        return len;
    },

    draw_root: function(total_root, py, px_r, px_l, ctx){
        var self = this;
        ctx.lineWidth = 3;
        var grd = ctx.createLinearGradient((px_r + px_l)/2, py, (px_r + px_l)/2, py+200);
        // var grd_same = ctx.createLinearGradient((px_r + px_l)/2, py, (px_r + px_l)/2, py+500);
        grd.addColorStop(0, mapping_color.trunk);
        grd.addColorStop(1, mapping_color.root);
        // grd_same.addColorStop(0, mapping_color.trunk);
        // grd_same.addColorStop(1, mapping_color.root);
        grd.addColorStop(0, mapping_color.trunk);
        grd.addColorStop(1, mapping_color.root);
        // ctx.strokeStyle = '376941';//num.toString();//line's color
        ctx.fillStyle = grd;
        ctx.strokeStyle = grd;
        // ctx.fillStyle = grd_same;
        // ctx.strokeStyle = grd_same;
        // this.context.beginPath();
        var root_index = [];
        var root_amount = [];
        var sorted_root = [];
        var total_amount = 0;
        var total_stick = 0;
        for(var r in total_root){
            if(r != -1){
                total_stick++;
                total_amount += total_root[r]["length"];
                root_index.push(r)
                root_amount.push(total_root[r]["length"]);
                sorted_root.push(total_root[r]["length"]);
            }
        }
        sorted_root.sort(function(a,b){return b - a})
        
        var min_root = 1;
        var max_root = Math.max.apply(Math, root_amount);
        // var root_size = min_root*Math.sqrt(max_root);
        var root_size = min_root*Math.pow(max_root, 0.3);
        var author_area = root_index[jQuery.inArray(max_root, root_amount)];
        // console.log("main area: ", root_index);
        var root_scale = self.model.get("root_curve");
        var root_length = self.model.get("root_len_scale");
        // var trunk_weigth = (px_r - px_l)/root_index.length; ///total_stick;
        var trunk_weigth = (px_r - px_l)/4; ///total_stick;
        
        // draw main root
        ctx.beginPath();
        // var main_portion = (total_amount/max_root)*5;
        // var cpr = [px_r - main_portion, py + 120];
        // var cpl = [px_l + main_portion, py + 120];
        // ctx.moveTo(px_r, py);
        // ctx.bezierCurveTo(px_r, cpr[1], cpr[0], cpr[1], px_r - main_portion*2, py+200);
        // ctx.lineTo(px_l + main_portion*2, py+200);
        // ctx.bezierCurveTo(cpl[0], cpl[1], px_l, cpl[1], px_l, py);
        // this.context.closePath();
        // ctx.stroke();
        // ctx.fill();

        var cpr = [(px_r+px_l)/2 + trunk_weigth*1.5, py + 120];
        var cpl = [(px_r+px_l)/2 - trunk_weigth*1.5, py + 120];
        ctx.moveTo(px_r, py);
        ctx.bezierCurveTo(px_r, cpr[1], cpr[0], cpr[1], (px_r+px_l)/2 + trunk_weigth, py+200);
        ctx.lineTo((px_r+px_l)/2 - trunk_weigth, py+200);
        ctx.bezierCurveTo(cpl[0], cpl[1], px_l, cpl[1], px_l, py);
        this.context.closePath();
        ctx.stroke();
        ctx.fill();
        
        // console.log(author_area);
        var grd_root = ctx.createLinearGradient((px_r + px_l)/2, py+200, (px_r + px_l)/2, py+400);
        grd_root.addColorStop(0, mapping_color.root);
        grd_root.addColorStop(1, mapping_color.roots_color[author_area]);
        ctx.fillStyle = grd_root;
        ctx.strokeStyle = grd_root;
        
        var cp_bottom = [(px_r + px_l)/2, py + 200 + root_size*1.5];
        // var stick_right_side = [px_r - main_portion*2, py+200];
        // var stick_left_side = [px_l + main_portion*2, py+200];
        var stick_right_side = [(px_r+px_l)/2 + trunk_weigth, py+200];
        var stick_left_side = [(px_r+px_l)/2 - trunk_weigth, py+200];
        // var main_step = [(px_r - px_l - main_portion*4)/(2*total_root[author_area]["sub"].length), ((root_size*100 + 200)/total_root[author_area]["sub"].length)*root_length]; //-250
        var main_step = [ trunk_weigth/total_root[author_area]["sub"].length, ((root_size*105 + 200)/total_root[author_area]["sub"].length)*root_length]; //-250
       
        // var unit_weigth = trunk_weigth/total_root[r]["sub"].length;
        var n = 4;
        for(var i = 1; i < total_root[author_area]["sub"].length; i++){

            if(i%2 == 0)
                curve = -(25 + i);
            else
                curve = 25 + i;
            var right_m = [stick_right_side[0] - main_step[0] + curve, stick_right_side[1] + main_step[1]/2];
            var left_m = [stick_left_side[0] + main_step[0] + curve, stick_left_side[1] + main_step[1]/2];
            
            if(total_root[author_area]["sub"][i] != 0){
                var fractal = 0;
                if((i+1) % n == 0) fractal = (25 + i);
                else if(i % n == 0) fractal = -(25 + i);
                if(i%2 == 0){ 
                    ctx.beginPath();
                    ctx.moveTo(stick_right_side[0], stick_right_side[1]);              
                    
                    ctx.bezierCurveTo(stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1], stick_right_side[0] + main_step[0]*3 + Math.abs(curve), stick_right_side[1] + main_step[1]*0.5, stick_right_side[0] + main_step[0]*3 + total_root[author_area]["sub"][i]*3 + Math.abs(curve) + fractal, stick_right_side[1] + main_step[1]*2 + total_root[author_area]["sub"][i]*2.5 - fractal); //+/- total_root[author_area]["sub"][i]*5
                    ctx.bezierCurveTo(stick_right_side[0] + main_step[0]*3 + Math.abs(curve), stick_right_side[1] + main_step[1]*0.5 + 10, stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1], (stick_left_side[0] + stick_right_side[0])/2, stick_right_side[1]);
                    ctx.stroke();
                    ctx.fill();
                    
                }
                else{
                    ctx.beginPath();
                    ctx.moveTo(stick_left_side[0], stick_left_side[1]);
                    ctx.bezierCurveTo(stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1], stick_left_side[0] - main_step[0]*3 - Math.abs(curve), stick_left_side[1] + main_step[1]*0.5, stick_left_side[0] - main_step[0]*3 - total_root[author_area]["sub"][i]*3 - Math.abs(curve) - fractal, stick_left_side[1] + main_step[1]*2 + total_root[author_area]["sub"][i]*2.5 - fractal); //+/- total_root[author_area]["sub"][i]*5
                    ctx.bezierCurveTo(stick_left_side[0] - main_step[0]*3 - Math.abs(curve), stick_left_side[1] + main_step[1]*0.5 + 10, stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1], (stick_left_side[0] + stick_right_side[0])/2, stick_left_side[1]);
                    ctx.stroke();
                    ctx.fill();
                                      
                }

            }
            
            if(i == 1){
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.bezierCurveTo(right_m[0] - curve, right_m[1], right_m[0], right_m[1], stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
                // ctx.lineTo(stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
                ctx.lineTo(stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]);
                ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                // ctx.lineTo(stick_left_side[0], stick_left_side[1]);

                for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                        var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                        if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                            self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                        }
                    }
                }

                stick_right_side = [stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]];
                stick_left_side = [stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]];
                
                 
                ctx.stroke();
                ctx.fill();
                continue;
            }
            // var right_m = [stick_right_side[0] - main_step[0] + curve, stick_right_side[1] + main_step[1]/2];
            // var left_m = [stick_left_side[0] + main_step[0] + curve, stick_left_side[1] + main_step[1]/2];

            else if(i % n == 0){
                /*
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.quadraticCurveTo(right_m[0] + curve*1.5, right_m[1], stick_right_side[0] - main_step[0] + curve*2, stick_right_side[1] + main_step[1]);
                // ctx.lineTo(stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
                ctx.lineTo(stick_left_side[0] + main_step[0] + curve*2, stick_left_side[1] + main_step[1]);
                ctx.quadraticCurveTo(left_m[0] + curve*1.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                        var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                        if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                            self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                        }
                    }
                }
                stick_right_side = [stick_right_side[0] - main_step[0] + curve*2, stick_right_side[1] + main_step[1]];
                stick_left_side = [stick_left_side[0] + main_step[0] + curve*2, stick_left_side[1] + main_step[1]];
                 
                ctx.stroke();
                ctx.fill();
                continue;
                */
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] - main_step[0] + curve*2, stick_right_side[1] + main_step[1]);
                // ctx.lineTo(stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
                ctx.lineTo(stick_left_side[0] + main_step[0]  + curve*2, stick_left_side[1] + main_step[1]);
                ctx.bezierCurveTo(left_m[0]  + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                // ctx.lineTo(stick_left_side[0], stick_left_side[1]);

                for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                        var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                        if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                            self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                        }
                    }
                }

                stick_right_side = [stick_right_side[0] - main_step[0]  + curve*2, stick_right_side[1] + main_step[1]];
                stick_left_side = [stick_left_side[0] + main_step[0] + curve*2, stick_left_side[1] + main_step[1]];
                
                 
                ctx.stroke();
                ctx.fill();
                n = n + 3;
                continue;
                
            }

            ctx.beginPath();
            ctx.moveTo(stick_right_side[0], stick_right_side[1]);
            ctx.quadraticCurveTo(right_m[0], right_m[1], stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
            // ctx.lineTo(stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]);
            ctx.lineTo(stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]);
            ctx.quadraticCurveTo(left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
            // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
            for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                    var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                    if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                    }
                }
            }
            stick_right_side = [stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]];
            stick_left_side = [stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]];
             
            ctx.stroke();
            ctx.fill();
            
        }

        var right_m = [stick_right_side[0] - main_step[0] - curve*2, stick_right_side[1] + main_step[1]];
        var left_m = [stick_left_side[0] + main_step[0] - curve*2, stick_left_side[1] + main_step[1]];

        ctx.beginPath();
        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
        // ctx.bezierCurveTo(right_m[0], right_m[1], right_m[0] + curve*3, right_m[1], (px_r + px_l)/2, stick_left_side[1] + main_step[1]*2);        
        ctx.bezierCurveTo(right_m[0], right_m[1], right_m[0] + curve*3, right_m[1], (px_r + px_l)/2 - curve*4, stick_left_side[1] + main_step[1]*2);
        ctx.bezierCurveTo(left_m[0] + curve*3, left_m[1], left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
        // ctx.lineTo((px_r + px_l)/2, stick_left_side[1] + main_step[1]*2);
        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
        
        ctx.stroke();
        ctx.fill();

        // y++
        var total = root_index.length;
        var side = 0;
        var cp_side = [px_r, px_l];
        // var trunk_weigth = (px_r - px_l)/4; ///total_stick;
        // using slider bar: side*15
        var extend = 300/root_amount.length;
        // for(var r in total_root)

        // var order = 0;
        var root_index_sorted = [];
        // console.log("00", root_index);
        for(var i in sorted_root){
            // console.log("00", root_index);
            // console.log("01", root_amount);
            root_index_sorted.push(root_index[jQuery.inArray(sorted_root[i], root_amount)]);
            // console.log(jQuery.inArray(sorted_root[i], root_amount));
            root_amount.splice(jQuery.inArray(sorted_root[i], root_amount), 1, -1);
        }
        
        for(var index in root_index_sorted){
            r = root_index_sorted[index]
            // console.log(r);      
            // root_size = Math.sqrt(total_root[r]["length"]);
            root_size = Math.pow(total_root[r]["length"], 0.3);
            if(r == author_area || root_size == 0 || r == -1){
                continue;
            }
            // root_portion = (total_amount/total_root[r])*3;
            ctx.beginPath();
            if(side%2 == 0){ //right side
                ctx.fillStyle = grd;
                ctx.strokeStyle = grd;
                n = 4;
                ctx.moveTo(px_r, py);
                ctx.bezierCurveTo(px_r + side*15, py + 120, cp_side[0] + total*10 - side*15, py+60, cp_side[0] + total*10 + side*15 + extend, py+200);
                ctx.lineTo(cp_side[0] + total*10 + side*15 - trunk_weigth + extend, py+200);
                ctx.bezierCurveTo(cp_side[0] + total*10 - side*15 - trunk_weigth, py + 100, cp_bottom[0], py + 200, cp_bottom[0], py);
                this.context.closePath();
                ctx.stroke();
                ctx.fill();

                grd_root = ctx.createLinearGradient((px_r + px_l)/2, py+200, (px_r + px_l)/2, py+400);
                grd_root.addColorStop(0, mapping_color.root);
                grd_root.addColorStop(1, mapping_color.roots_color[r]);
                ctx.fillStyle = grd_root;
                ctx.strokeStyle = grd_root;

                cp_side[0] = cp_side[0] + total*10 + side*15 + extend;
                var unit_point = [(((side*22.5 + extend*0.65)*root_size)/total_root[r]["sub"].length)*root_length, ((105*root_size)/total_root[r]["sub"].length)*root_length]; // root_size*3
                var unit_weigth = trunk_weigth/total_root[r]["sub"].length;
                var stick_right_side = [cp_side[0], py+200];
                var stick_left_side = [cp_side[0] - trunk_weigth, py+200];
                var i = 0;
                curve = 10+root_size*2;
                
                for(i = 1; i < total_root[r]["sub"].length; i++){
                   
                    if(i%2 == 0)
                        curve = -(10+root_size*2-i)
                    else
                        curve = 10+root_size*2-i 

                    var curve_point = [(stick_right_side[0]*2 + unit_point[0] - root_scale*(i-1))/2, (stick_left_side[0]*2 + unit_point[0] + unit_weigth - root_scale*(i-1))/2];    
                    var right_m = [curve_point[0] + curve, stick_right_side[1] + unit_point[1]/2];
                    var left_m = [curve_point[1] + curve, stick_left_side[1] + unit_point[1]/2]; 
                    if(total_root[r]["sub"][i] != 0){
                        var fractal = 0;
                        if((i+1) % n == 0) fractal = (10+root_size*2-i);
                        else if(i % n == 0) fractal = -(10+root_size*2-i);
                        if(i%2 == 0){
                            ctx.beginPath();
                            ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                            ctx.bezierCurveTo(stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_right_side[0] + unit_point[0]*2 + total + 30 - root_scale*(i-1), stick_right_side[1] + unit_point[1], stick_right_side[0] + unit_point[0]*5 - root_scale*(i+1) + 30 + total_root[r]["sub"][i]*3 + fractal, stick_right_side[1] + unit_point[1] + total_root[r]["sub"][i]*2.5 - fractal); //+/- total_root[r]["sub"][i]*5
                            ctx.bezierCurveTo(stick_right_side[0] + unit_point[0]*2 + total + 30 - root_scale*(i-1), stick_right_side[1] + unit_point[1] + 5, stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_left_side[0], stick_right_side[1]);
                            ctx.stroke();
                            ctx.fill();
                            
                        }
                        else{
                            ctx.beginPath();
                            ctx.moveTo(stick_left_side[0], stick_left_side[1]);
                            ctx.bezierCurveTo(stick_left_side[0] + unit_point[0]*2 - root_scale*(i-1)*2 + unit_weigth*2, stick_left_side[1] + unit_point[1]*2, stick_left_side[0] + unit_point[0] - total - 30 - root_scale*(i-1) + unit_weigth, stick_left_side[1] + unit_point[1], stick_left_side[0] + unit_point[0]*2 + unit_weigth*2 - root_scale*(i+1) - 30 - total_root[r]["sub"][i]*3 - fractal, stick_left_side[1] + unit_point[1]*3 + total_root[r]["sub"][i]*2.5 - fractal); //+/- total_root[r]["sub"][i]*5
                            ctx.bezierCurveTo(stick_left_side[0] + unit_point[0] - total - 30 - root_scale*(i-1) + unit_weigth, stick_left_side[1] + unit_point[1] + 5, stick_left_side[0] + unit_point[0]*2 - root_scale*(i-1)*2 + unit_weigth*2, stick_left_side[1] + unit_point[1]*2, stick_right_side[0], stick_left_side[1]);
                            ctx.stroke();
                            ctx.fill();
                            
                        }
                       
                    }
                    
                    if(i == 1){
                        // var curve_point = [(stick_right_side[0]*2 + unit_point[0] - root_scale*(i-1))/2, (stick_left_side[0]*2 + unit_point[0] + unit_weigth - root_scale*(i-1))/2]; 
                        // var right_m = [curve_point[0] + curve, stick_right_side[1] + unit_point[1]/2];
                        // var left_m = [curve_point[1] + curve, stick_left_side[1] + unit_point[1]/2];
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] - curve, right_m[1], right_m[0], right_m[1], stick_right_side[0] + unit_point[0] - root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
                            }
                        }
                        stick_right_side = [stick_right_side[0] + unit_point[0] - root_scale*(i-1), stick_right_side[1] + unit_point[1]];
                        stick_left_side = [stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1), stick_left_side[1] + unit_point[1]];
                         
                        ctx.stroke();
                        ctx.fill();
                        continue;
                    }

                    else if(i % n == 0){
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] + unit_point[0] - root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0] + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
                            }
                        }
                        stick_right_side = [stick_right_side[0] + unit_point[0] - root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]];
                        stick_left_side = [stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]];
                         
                        ctx.stroke();
                        ctx.fill();
                        n = n + 3;
                        continue;                        
                    }

                                                            
                    ctx.beginPath();
                    ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                    ctx.quadraticCurveTo(right_m[0], right_m[1], stick_right_side[0] + unit_point[0] - root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                    ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                    ctx.quadraticCurveTo(left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);

                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                        for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                            var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                            if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                            }
                        }
                    }
                    stick_right_side = [stick_right_side[0] + unit_point[0] - root_scale*(i-1), stick_right_side[1] + unit_point[1]];
                    stick_left_side = [stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1), stick_left_side[1] + unit_point[1]];
                                
                    ctx.stroke();
                    ctx.fill();
                }

                var curve_point = [(stick_right_side[0]*2 + unit_point[0] - root_scale*(i-1))/2, (stick_left_side[0]*2 + unit_point[0] + unit_weigth - root_scale*(i-1))/2];    
                var right_m = [curve_point[0] - curve, stick_right_side[1] + unit_point[1]/2];
                var left_m = [curve_point[1] - curve, stick_left_side[1] + unit_point[1]/2]; 
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.bezierCurveTo(right_m[0], right_m[1], right_m[0] + curve, right_m[1], stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2);
                ctx.bezierCurveTo(left_m[0] + curve, left_m[1], left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
                // ctx.beginPath();
                // ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                // ctx.lineTo(stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2);
                // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                
                ctx.stroke();
                ctx.fill();                
            }

            else{ // left side
                ctx.fillStyle = grd;
                ctx.strokeStyle = grd;
                ctx.moveTo(px_l, py);
                ctx.bezierCurveTo(px_l - side*15, py + 120, cp_side[1] - total*10 + side*15, py + 60, cp_side[1] - total*10 - side*15 - extend, py+200);
                ctx.lineTo(cp_side[1] - total*10 - side*15 + trunk_weigth - extend, py+200);
                ctx.bezierCurveTo(cp_side[1] - total*10 + side*15 + trunk_weigth, py + 100, cp_bottom[0], py + 250, cp_bottom[0], py);
                this.context.closePath();
                ctx.stroke();
                ctx.fill();

                grd_root = ctx.createLinearGradient((px_r + px_l)/2, py+200, (px_r + px_l)/2, py+400);
                grd_root.addColorStop(0, mapping_color.root);
                grd_root.addColorStop(1, mapping_color.roots_color[r]);
                ctx.fillStyle = grd_root;
                ctx.strokeStyle = grd_root;

                cp_side[1] = cp_side[1] - total*10 - side*15 - extend;

                var unit_point = [(((side*22.5 + extend*0.65)*root_size)/total_root[r]["sub"].length)*root_length, ((105*root_size)/total_root[r]["sub"].length)*root_length]; // root_size*3
                var unit_weigth = trunk_weigth/total_root[r]["sub"].length;
                var stick_right_side = [cp_side[1], py+200];
                var stick_left_side = [cp_side[1] + trunk_weigth, py+200];
                var i = 0;
                curve = 10+root_size*2;
                n = 4;
                for(i = 1; i < total_root[r]["sub"].length; i++){
                    if(i%2 == 0)
                        curve = -(10+root_size*2-i)
                    else
                        curve = 10+root_size*2-i 

                    var curve_point = [(stick_right_side[0]*2 - unit_point[0] + root_scale*(i-1))/2, (stick_left_side[0]*2 - unit_point[0] - unit_weigth + root_scale*(i-1))/2];                         
                    var right_m = [curve_point[0] + curve, stick_right_side[1] + unit_point[1]/2];
                    var left_m = [curve_point[1] + curve, stick_left_side[1] + unit_point[1]/2];

                    if(total_root[r]["sub"][i] != 0){
                        var fractal = 0;
                        if((i+1) % n == 0) fractal = (10+root_size*2-i);
                        else if(i % n == 0) fractal = -(10+root_size*2-i);
                        
                        if(i%2 == 0){
                            ctx.beginPath();
                            ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                            ctx.bezierCurveTo(stick_right_side[0] - unit_point[0]*2 + root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_right_side[0] - unit_point[0]*2 - total - 30 + root_scale*(i-1), stick_right_side[1] + unit_point[1], stick_right_side[0] - unit_point[0]*5 + root_scale*(i+1) - 30 - total_root[r]["sub"][i]*3 - fractal, stick_right_side[1] + unit_point[1] + total_root[r]["sub"][i]*2.5 - fractal); //+/- total_root[r]["sub"][i]*5
                            ctx.bezierCurveTo(stick_right_side[0] - unit_point[0]*2 - total - 30 + root_scale*(i-1), stick_right_side[1] + unit_point[1] + 5, stick_right_side[0] - unit_point[0]*2 + root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_left_side[0], stick_right_side[1]);
                            ctx.stroke();
                            ctx.fill();
                        }
                        /*
                        if(i%2 == 0){
                            ctx.beginPath();
                            ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                            ctx.bezierCurveTo(stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_right_side[0] + unit_point[0]*2 + total + 30 - root_scale*(i-1), stick_right_side[1] + unit_point[1], stick_right_side[0] + unit_point[0]*5 - root_scale*(i+1) + 30 + total_root[r]["sub"][i]*3 + fractal, stick_right_side[1] + unit_point[1] + total_root[r]["sub"][i]*2.5 - fractal); //+/- total_root[r]["sub"][i]*5
                            ctx.bezierCurveTo(stick_right_side[0] + unit_point[0]*2 + total + 30 - root_scale*(i-1), stick_right_side[1] + unit_point[1] + 5, stick_right_side[0] + unit_point[0]*2 - root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2, stick_left_side[0], stick_right_side[1]);
                            ctx.stroke();
                            ctx.fill();                            
                        }
                        */
                        else{
                            ctx.beginPath();
                            ctx.moveTo(stick_left_side[0], stick_left_side[1]);
                            ctx.bezierCurveTo(stick_left_side[0] - unit_point[0]*2 + root_scale*(i-1)*2 - unit_weigth*2, stick_left_side[1] + unit_point[1]*2, stick_left_side[0] - unit_point[0] + total + 30 + root_scale*(i-1) - unit_weigth, stick_left_side[1] + unit_point[1], stick_left_side[0] - unit_point[0]*2 - unit_weigth*2 + root_scale*(i+1) + 30 + total_root[r]["sub"][i]*3 + fractal, stick_left_side[1] + unit_point[1]*3 + total_root[r]["sub"][i]*2.5 - fractal); //+/- total_root[r]["sub"][i]*5
                            ctx.bezierCurveTo(stick_left_side[0] - unit_point[0] + total + 30 + root_scale*(i-1) - unit_weigth, stick_left_side[1] + unit_point[1] + 5, stick_left_side[0] - unit_point[0]*2 + root_scale*(i-1)*2 - unit_weigth*2, stick_left_side[1] + unit_point[1]*2, stick_right_side[0], stick_left_side[1]);
                            ctx.stroke();
                            ctx.fill();
                        }

                    }
                    if(i == 1){
                        // var curve_point = [(stick_right_side[0]*2 - unit_point[0] + root_scale*(i-1))/2, (stick_left_side[0]*2 - unit_point[0] - unit_weigth + root_scale*(i-1))/2]; 
                        // var right_m = [curve_point[0] + curve, stick_right_side[1] + unit_point[1]/2];
                        // var left_m = [curve_point[1] + curve, stick_left_side[1] + unit_point[1]/2];
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] - curve, right_m[1], right_m[0], right_m[1], stick_right_side[0] - unit_point[0] + root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
                            }
                        }
                        stick_right_side = [stick_right_side[0] - unit_point[0] + root_scale*(i-1), stick_right_side[1] + unit_point[1]];
                        stick_left_side = [stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1), stick_left_side[1] + unit_point[1]];    
                         
                        ctx.stroke();
                        ctx.fill();
                        continue;
                    }
                    else if(i % n == 0){
                        /*
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] + unit_point[0] - root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0] + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
                            }
                        }
                        stick_right_side = [stick_right_side[0] + unit_point[0] - root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]];
                        stick_left_side = [stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]];
                         
                        ctx.stroke();
                        ctx.fill();
                        */
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] - unit_point[0] + root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0] + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
                            }
                        }
                        stick_right_side = [stick_right_side[0] - unit_point[0] + root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]];
                        stick_left_side = [stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]];    
                         
                        ctx.stroke();
                        ctx.fill();
                        n = n + 3;
                        continue;                        
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                    ctx.quadraticCurveTo(right_m[0], right_m[1], stick_right_side[0] - unit_point[0] + root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                    ctx.lineTo(stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                    ctx.quadraticCurveTo(left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
                    
                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                        for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                            var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                            if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                            }
                        }
                    }
                    stick_right_side = [stick_right_side[0] - unit_point[0] + root_scale*(i-1), stick_right_side[1] + unit_point[1]];
                    stick_left_side = [stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1), stick_left_side[1] + unit_point[1]];               
                    ctx.stroke();
                    ctx.fill();
                }

                var curve_point = [(stick_right_side[0]*2 - unit_point[0] + root_scale*(i-1))/2, (stick_left_side[0]*2 - unit_point[0] - unit_weigth + root_scale*(i-1))/2];                         
                var right_m = [curve_point[0] - curve, stick_right_side[1] + unit_point[1]/2];
                var left_m = [curve_point[1] - curve, stick_left_side[1] + unit_point[1]/2];
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.bezierCurveTo(right_m[0], right_m[1], right_m[0] + curve, right_m[1], stick_right_side[0] - unit_point[0]*2 + root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2);
                ctx.bezierCurveTo(left_m[0] + curve, left_m[1], left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);

                // ctx.beginPath();
                // ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                // ctx.lineTo(stick_right_side[0] - unit_point[0]*2 + root_scale*(i-1)*2, stick_right_side[1] + unit_point[1]*2);
                // ctx.lineTo(stick_left_side[0], stick_left_side[1]);

                ctx.stroke();
                ctx.fill();
            }          

            side ++;
            total --;
            
        }
        
        
    },
                    
    count_total_leaf: function(alter){
        var total_up = 0;
        var total_down = 0;
        for(var c = 0; c < alter["up"].length; c++){
            if(!jQuery.isEmptyObject(alter["up"][c]))
                total_up += alter["up"][c]["leaf"].length;
        }
        for(var c = 0; c < alter["down"].length; c++){
            if(!jQuery.isEmptyObject(alter["down"][c]))
                total_down += alter["down"][c]["leaf"].length;
        }
        return {"up": total_up, "down": total_down};

    },

    find_line: function(x, y, m){
        var c = y - m*x;
        return c;
    },

    find_y_point: function(m, c, x){
        var y = m*x + c;
        return y;

    },

    find_x_point: function(m, c, y){
        var x = (y-c)/m;
        return x;

    },

    find_dir: function(v, angle){
        var rotate_matrix = [ Math.cos(angle), Math.sin(angle),
                             -Math.sin(angle), Math.cos(angle) ];

        var vx = rotate_matrix[0]*v[0] + rotate_matrix[1]*v[1];
        var vy = rotate_matrix[2]*v[0] + rotate_matrix[3]*v[1];

        return [vx, vy];
    },

    leaf_style_0: function(ctx, cx, cy, radius, color, angle, l_id, index) {
        var self = this;
        // ctx.save();
        this.context.lineWidth = 1;
        // if(self.leaf_hovor == l_id){
        //     this.context.lineWidth = 25;
        // }
        this.context.strokeStyle = mapping_color.leaf_stork;//line's color
        this.context.fillStyle = color;
        
        // ctx.translate(cx, cy);
        // ctx.rotate(angle);

        ctx.beginPath();
        // ctx.moveTo(0, 0);
                
        // ctx.quadraticCurveTo(radius, radius, radius*2.5, 0);
        // ctx.stroke();
        // ctx.quadraticCurveTo(radius, -radius, 0, 0);
        // this.context.closePath();
        if(index == 0)
            ctx.arc(cx-radius/1.5, cy, radius, 0, 2*Math.PI, true);
        else
            ctx.arc(cx+radius/1.5, cy, radius, 0, 2*Math.PI, true);
        ctx.stroke();
        this.context.fill();
        // ctx.restore();
        this.context.lineWidth = 5;
    },
    
    leaf_style_1: function(ctx, cx, cy, radius, color, angle, l_id) {
        var self = this;
        ctx.save();
        this.context.lineWidth = 1;
        if(l_id != "none" && self.leaf_hovor == l_id){
            this.context.lineWidth = 25;
        }
        this.context.strokeStyle = mapping_color.leaf_stork;//line's color
        this.context.fillStyle = color;
        
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, 0);
                
        ctx.quadraticCurveTo(radius, radius, radius*2.5, 0);
        // ctx.stroke();
        ctx.quadraticCurveTo(radius, -radius, 0, 0);
        this.context.closePath();
        ctx.stroke();
        this.context.fill();
        ctx.restore();
        // this.context.lineWidth = 5;
    },

    tree_fruit: function(context, posx, posy, r){
        var self = this;
        // var r = 9;
        var fruit_drawing = self.model.get("fruit_switch");
        if(fruit_drawing == 0)
            return;
        context.fillStyle = mapping_color.fruit;//fill color
        context.strokeStyle = mapping_color.fruit;;//line's color

        context.beginPath()
        var cx = posx;
        var cy = posy;
        var radius = r;
        this.circle(context, cx, cy, radius);
        context.closePath();
        context.fill();
    },

    circle: function(ctx, cx, cy, radius){
        var self = this;
        ctx.arc(cx, cy, radius, 0, 2*Math.PI, true);
    },

    set_tree_label: function (context, message, pos){
        // var context = canvas.getContext('2d');
        // context.clearRect(0, 0, canvas.width, canvas.height);
        context.font = '78pt Calibri';
        context.fillStyle = 'black';
        context.fillText(message, pos[0], pos[1]); //pos
    },

    set_tree_info: function(context, info, pos){
        context.font = '78pt Calibri';
        context.fillStyle = 'black';
        context.fillText(info[0], pos[0], pos[1]); //pos
        context.fillText(info[1], pos[0], pos[1]+150); //pos
    },

    ellipse: function(ctx, cx, cy, radius, stop, fruit){
        var self = this;
        // var color = ["#927007", "#CF9D00", "#C2B208", "#699B1A", "#2E7523", "#214E33", "#1F4230", "#184E35", "#19432F"];
        // var num = 376951;
        
        // this.context.fillStyle ='rgb(0,'+color[c]+',0)';//fill color
        var grd=ctx.createRadialGradient(cx, cy, 30, cx, cy, radius+10);
        grd.addColorStop(0, mapping_color.leaf_color[stop[0]]);
        grd.addColorStop(1, mapping_color.leaf_color[stop[1]]);
        // ctx.strokeStyle = '376941';//num.toString();//line's color
        ctx.fillStyle = grd;
        ctx.beginPath(); 
        ctx.arc(cx, cy, radius, 0, Math.PI*2);  
        // ctx.stroke();  
        ctx.closePath();
        ctx.fill();
       
        var real_radius = radius - 60;
        var fruit_pos = [real_radius-65, -real_radius+95,real_radius-40,  real_radius-55, -real_radius+20, -real_radius+60, -real_radius+30, real_radius-45, real_radius-60, -real_radius+75, real_radius-80, real_radius-150, real_radius+100];
        // draw fruit
        var len = Math.round(fruit/4);
        if(len > 12){
            len = 12;
        }
        ctx.beginPath();
        // ctx.moveTo(cx+real_radius, cy+real_radius);
        // ctx.lineTo(cx-real_radius, cy-real_radius);s
        // ctx.stroke();
        for(var f = 0; f < len; f++){
            var grd_fruit = ctx.createRadialGradient(cx + fruit_pos[f], cy + fruit_pos[f+1], 0.5, cx + fruit_pos[f], cy + fruit_pos[f+1], 25);
            grd_fruit.addColorStop(0, "#EA767A");
            grd_fruit.addColorStop(1, "#E31C23");
            ctx.fillStyle = grd_fruit;
            ctx.beginPath();
            ctx.arc(cx + fruit_pos[f], cy + fruit_pos[f+1], 25, 0, Math.PI*2);
            ctx.closePath();
            ctx.fill();
        }

    },

    update_fruit_size: function(){
        var self = this;
        // var fruit_scale = Math.round((self.model.get("fruit_scale")+self.model.get("leaf_scale")*0.3) * 10) / 10;
        var fruit_scale = Math.round(self.model.get("fruit_scale")*self.model.get("leaf_scale")*10/3)/10;
        // var fruit_scale = self.model.get("fruit_scale")*(Math.round(self.model.get("leaf_scale")*0.3*10)/10);
        $("#dtl_fruit_size").ionRangeSlider("update", {
            from: fruit_scale
        });

    }

});
