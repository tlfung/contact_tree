// rendering
var RenderingView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in rendering initialize");
        _.bindAll(this, 'redraw');
        _.bindAll(this, 'update_fruit_size');
        _.bindAll(this, 'draw4snapshot');
        _.bindAll(this, 'draw4save');

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
        this.model.bind('change:filter_contact', this.redraw);

        this.model.bind('change:save_tree', this.draw4save);
        this.model.bind('change:snapshot', this.draw4snapshot);

        this.model.bind('change:leaf_scale', this.update_fruit_size);


        this.view = self.model.get("view_mode");
        this.group = self.model.get("dataset_group");

        this.myCanvas = drawing_canvas.main_canvas;

        this.snapCanvas = drawing_canvas.snap_canvas;
        this.saveCanvas = drawing_canvas.save_canvas;
        
        this.scale = self.model.get("canvas_scale");
        this.snap_scale = 1;
        this.save_scale = 1;
        this.translate_point = self.model.get("canvas_translate");

        this.start_x = (1000/this.scale)/2; //_glx
        this.start_y = (this.myCanvas.height/this.scale)-600; //_gly
        this.tree_tall = 2120; //ori _dist
        this.temp_height = 0;
       
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

        this.clicking_grid = [];
        this.snaping_grid = [];
        this.subyear = 2014;
        this.hash_table = self.model.get("info_table");
        this.leaf_hovor = self.model.get("clicking_leaf");
        this.c_detail = 11*this.scale;
        this.on_moving = 0;
        this.ego_label = "";
        this.snap = 0;
        this.snap_info = "";
        this.filter_cnt = 0;
        this.tree_size = {};
        this.approx_size = 0;
        this.save_img = 0;

        // element container
        this.el_block_page = $("#block_page");
        this.el_fruit_size = $("#dtl_fruit_size");
        this.el_snap_container = $("#snap_container");
        this.el_one_tree = $("#one_tree");
        this.el_custom_download_link = $("#custom_download_link");

        this.canvas_x_boundary;
        this.canvas_y_boundary;
    },

    redraw: function(){
        var self = this;
        this.context =  this.myCanvas.getContext('2d'); // get main canvas to draw
        this.snap = 0; // draw fo snap
        this.save_img = 0; // draw for save
        this.approx_size = 0; // havent get the exact boundary
        // get all the model parameter
        this.on_moving = self.model.get("moving");
        this.scale = self.model.get("canvas_scale");
        this.leaf_hovor = self.model.get("clicking_leaf");
        var display_style = self.model.get("tree_style");
        this.view = self.model.get("view_mode");
        this.group = self.model.get("dataset_group");
        
        this.filter_cnt = self.model.get("filter_contact");        
        self.tree_size = self.model.get("tree_boundary");
        this.translate_point = self.model.get("canvas_translate");
        // for the scale of clicking grid
        this.c_detail = 8*this.scale;

        self.canvas_x_boundary = [-this.translate_point[0]/this.scale, (self.myCanvas.width - this.translate_point[0]) / this.scale ];
        self.canvas_y_boundary = [-this.translate_point[1]/this.scale, (self.myCanvas.height - this.translate_point[1]) / self.scale ];

        if(this.scale > 0.6){ // to draw all the tree leaf
            this.on_moving = 0;
        }
        // else only draw part of the tree
        if(jQuery.isEmptyObject(self.model.get("tree_structure"))){
            return 0;
        }
        // for the size of clicking grid
        for(var x = 0; x <= Math.round(this.myCanvas.width/this.c_detail); x++){
            // this.clicking_grid[x] = [];
            this.clicking_grid.push([]);
            for(var y = 0; y <= Math.round(this.myCanvas.height/this.c_detail); y++){
                this.clicking_grid[x][y] = -1;
            }
        }
        switch(display_style[0]){
            case 'symmetry':
                self.redraw_symmetry();
                break;
        }// end switch
        
        // set all the dynamic 
        self.model.set({"tree_boundary":self.tree_size});
        // draw with the correct boundary
        if(this.approx_size == 1){
            this.redraw();
        }
        self.model.set({"canvas_grid":self.clicking_grid});    
        self.model.set({"info_table":self.hash_table});
        self.model.set({"canvas_detail":self.c_detail});
        
        self.model.set({"moving": 0});
        self.model.trigger('change:canvas_grid');
        self.el_block_page.hide();
    },


    redraw_symmetry: function(){
        var self = this;
        this.stick_dx = 50;
        this.stick_dy = 50;
        this.sub_stick_length = 55;
        this.sub_slop = 0;
        // console.log("in redraw");
        var display_ego = self.model.get("display_egos");
        var structure = self.model.get("tree_structure");
        var attr_map = self.model.get("attribute");

        this.context.lineWidth = 5; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.myCanvas.width, this.myCanvas.height);
        this.context.save();

        this.context.translate(this.translate_point[0], this.translate_point[1]);
        this.context.scale(this.scale, this.scale);
        this.start_x = 0; //_glx
        // self.canvas_x_boundary = [-this.translate_point[0]/this.scale, (self.myCanvas.width - this.translate_point[0]) / this.scale ];
        // self.canvas_y_boundary = [-this.translate_point[1]/this.scale, (self.myCanvas.height - this.translate_point[1]) / self.scale ];

        // for each ego tree
        var total_distance = 0;
        var total_tree = 0;
        var two_trees = 0;
        for(var e in display_ego){
            for(var t = 0; t < display_ego[e].length; t++){ // all the ego
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

                for(var s = 0; s < self.total_layer; s++){ // !!!count twice if alter is not unique...
                    var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
                    var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;
                    layer_total_alter["right"].push(r);
                    layer_total_alter["left"].push(l);
                    left_side += l;
                    right_side += r;
                }
                var total_contact = left_side + right_side;
                
                var info_box = ["Total Alters on Right: "+ right_side, "Total Alters on Left: "+ left_side];
                if(total_contact == 0){
                    continue;
                    // alart and delete this ego
                }
                
                var msg = "";
                var click_info = "";
                if(self.group != "all"){
                    msg = "EGO_" + e.toUpperCase() + "|" + sub;
                    click_info = e + ":-" + sub;
                }
                else{
                    msg = "EGO_" + e.toUpperCase();
                    click_info = e + ":-" + "all";
                }
                // info_box = info_box = ["", ""];
                var pos = [];
                var info_pos = [];  

                self.ego_label = e + "_" + sub;
                
                // if(this.start_x + (self.tree_size[this.ego_label][4] - self.tree_size[this.ego_label][0]) + 150 > self.canvas_x_boundary[1]){
                if(this.start_x > self.canvas_x_boundary[1]){
                    // console.log("extend right", msg);
                    break;
                }          
                
                // adjust the trunk scale
                var ori_dr = right_side*0.65;
                var ori_dl = left_side*0.65;
                var t_scale = (right_side + left_side)/150;
                if(right_side+left_side < 80){
                    t_scale = 0.5;
                }
                else{
                    if(t_scale < 1){
                        t_scale = 1;
                    }
                }

                if(self.ego_label in self.tree_size){ // has exact tree boundary
                    this.start_x += (self.tree_size[this.ego_label][4] - self.tree_size[this.ego_label][0]) + 150;
                    // if(total_tree == 0 && this.start_x > self.canvas_x_boundary[1] && this.translate_point[0] == 0 &&　this.translate_point[1] == 0)
                    if(total_tree == 0 && (self.tree_size[this.ego_label][4] - self.tree_size[this.ego_label][0]) + 150 > (self.canvas_x_boundary[1] + self.canvas_x_boundary[0]))
                        this.start_x = drawing_canvas.middle;
                    else if(total_tree > 0){
                        if(1000 > two_trees + (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 150){
                            this.start_x -= (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 150;
                            this.start_x += 1000;
                        }
                    }
                    if(this.start_x + (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 150 < self.canvas_x_boundary[0]){
                        // console.log("less left", msg);
                        this.start_x += (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 150;
                        continue;
                    }
                }
                else{
                    // for the left boundary
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
                    self.approx_size = 1;
                    this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist); //_glx
                    if(total_tree == 0 && this.start_x > self.canvas_x_boundary[1]){
                        // this.start_x = (self.myCanvas.width/0.15)/2;
                        this.start_x = drawing_canvas.middle;
                    }
                    if(this.start_x + ((stick_length)*this.sub_stick_length + this.x_dist) < self.canvas_x_boundary[0]){
                        // console.log("less left", msg);
                        this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist);
                        continue;
                    }
                    self.tree_size[self.ego_label] = [this.start_x, this.start_x, self.canvas_y_boundary[1], this.start_y + this.stick_length + 300, "none", this.start_y];
                }  

                
                pos = [((this.start_x - ori_dl/t_scale)+(this.start_x + ori_dr/t_scale))/2-270, this.start_y + this.stick_length + 350];
                info_pos = [this.start_x + ori_dr/t_scale + 50, this.start_y + this.stick_length + 50];
                if(self.group == "all"){
                    pos = [((this.start_x - ori_dl/t_scale)+(this.start_x + ori_dr/t_scale))/2-170, this.start_y + this.stick_length + 350];
                }
                
                var start_h = 0;
                var add_h = 1;
                var max_h = self.total_layer;
                var mod_layer = Math.floor(8/self.total_layer);
                var layer_slop = Math.round(100/self.total_layer)/10;
                
                // root
                var root_drawing = self.model.get("leaf_switch");
                if("root" in ego){
                    total_root = ego["root"][0];
                    if(root_drawing == 1)
                        self.draw_root(total_root, this.start_y + this.stick_length + 260, this.start_x + (ori_dr/t_scale)*1.5, this.start_x - (ori_dl/t_scale)*1.5, this.context);
                }
                
                this.context.lineWidth = 5; // set the style
                var real_height = 0;
                for(var height = 0; height < self.total_layer; height++){
                    if(this.start_y + this.stick_length + this.temp_height < self.canvas_y_boundary[0] && self.tree_size[self.ego_label][4] != "none"){ 
                        break;
                    }
                    if(this.start_y - (this.stick_length + this.temp_height)*5 > self.canvas_y_boundary[1]){
                        ori_dr -= layer_total_alter["right"][real_height]*0.45;
                        ori_dl -= layer_total_alter["left"][real_height]*0.45;
                        this.start_y = this.start_y - this.stick_length - this.temp_height;
                        // this.start_x = this.start_x + 100;
                        real_height += 1;
                        continue;
                    }
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();

                   
                    this.dr = (ori_dr/t_scale)*1.5;//1.5;
                    this.dl = (ori_dl/t_scale)*1.5;
                    
                    
                    this.temp_height = 30*height; //_d
                    if(real_height == 0){
                        this.temp_height = 60;
                    }

                    this.extra_y = height*8*layer_slop; //control point weight for its torson
                    this.extra_x = height*8*layer_slop; //control point (constant)
                    this.sub_slop = height*10*layer_slop;

                    var used_dr = 0;
                    var used_dl = 0;
                    // draw right tree
                    if((real_height == self.total_layer-1 && layer_total_alter["right"][real_height] == 0) || ori_dr == 0){}

                    else
                        used_dr = this.draw_right_branch(height, layer_total_alter["right"][real_height], ego["right"][real_height]["level"]);
                        // this.draw_right_branch(height, layer_total_alter["right"][real_height], ego["right"][real_height]["level"]);

                    // draw left tree
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.beginPath();
                    if((real_height == self.total_layer-1 && layer_total_alter["left"][real_height] == 0) || ori_dl == 0){}

                    else
                        used_dl = this.draw_left_branch(height, layer_total_alter["left"][real_height], ego["left"][real_height]["level"]);

                    ori_dr -= used_dr*0.45;                    
                    ori_dl -= used_dl*0.45;
                    this.start_y = this.start_y - this.stick_length - this.temp_height;
                    // this.start_x = this.start_x + 100;
                    real_height += 1;
                }
                // this.x_dist*this.scale
                if(self.tree_size[self.ego_label][4] == "none"){
                    self.tree_size[self.ego_label][4] = this.start_x;
                }                    

                this.set_tree_label(this.context, msg, pos, click_info);
                this.set_tree_info(this.context, info_box, info_pos);
                
                // this.start_x += ((stick_length)*this.sub_stick_length + this.x_dist); //_glx
                this.start_x += (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 100;
                two_trees = (self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][4]) + 100;
                this.start_y = (this.myCanvas.height/0.15)-this.stick_length-380; //_gly
                total_tree++;
            }
           
        }
        
        this.context.restore();        
    },

    draw_right_branch: function(layer, num_alter, alters){
        var self = this;
        var stick_scale = 0;
        stick_scale = num_alter/50;
        if(num_alter < 15){
            stick_scale = 1/1.5;
        }
        else{
            if(stick_scale < 1){
                stick_scale = 1;
            }
        }
       
        var stick_pos = {"up": [], "down": []};
        var long_stick, short_stick;
        
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
        
        var total_draw_stick = 0;
        var cnt_short = 0;
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){
            if(u == d){
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    if(alters[long_stick][n]["leaf"].length > self.filter_cnt)
                        total_draw_stick++;
                    else{
                        if(!jQuery.isEmptyObject(alters[short_stick][n]))
                            if(alters[short_stick][n]["leaf"].length > self.filter_cnt)
                                total_draw_stick++;
                    }                    
                }
                else if(!jQuery.isEmptyObject(alters[short_stick][n])){
                    if(alters[short_stick][n]["leaf"].length > self.filter_cnt)
                        total_draw_stick++;
                }                
            }
            else{
                if(alters[long_stick][n]["leaf"].length > self.filter_cnt){
                    total_draw_stick++;
                    if(stick_pos[short_stick][cnt_short] == n){
                        cnt_short++;
                    }
                }
                else{
                    if(stick_pos[short_stick][cnt_short] == n){
                        if(alters[short_stick][cnt_short]["leaf"].length > self.filter_cnt){
                            total_draw_stick++;
                        }
                        cnt_short++;
                    }
                }
            }
        }
        
        // var stick_width = num_alter/stick_scale;
        var stick_width = total_draw_stick/stick_scale;
        // end point
        var tree_rstpoint = [0, 0, 0, 0];
        tree_rstpoint[0] = this.start_x + this.x_dist - this.extra_x; // down point
        tree_rstpoint[1] = this.start_y - this.y_dist - this.stick_length - this.extra_y;

        tree_rstpoint[2] = this.start_x + this.x_dist - this.extra_x; // up point
        tree_rstpoint[3] = this.start_y - this.y_dist - this.stick_length - this.extra_y - stick_width;

        // find control point
        var m = this.sub_slop/55;
        // y = m(x-x1)+y1
        var c1 = m*(tree_rstpoint[0] - (this.start_x + this.dr)) + tree_rstpoint[1];
        var c2 = m*(tree_rstpoint[2] - this.start_x) + tree_rstpoint[3];

        var cp1 = [this.start_x + this.dr, this.start_y-100];
        var cp2 = [this.start_x + this.dr, c1];
        
        var cp3 = [this.start_x, c2];
        var cp4 = [this.start_x, this.start_y-100];

        var weight = Math.abs(tree_rstpoint[3] - tree_rstpoint[1]);

        // draw branch
        this.context.moveTo(this.start_x + this.dr, this.start_y + this.temp_height);
        if(total_draw_stick > 0){
            this.context.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], tree_rstpoint[0], tree_rstpoint[1]);
            this.context.lineTo(tree_rstpoint[2], tree_rstpoint[3]);
            this.context.bezierCurveTo(cp3[0], cp3[1], cp4[0], cp4[1], this.start_x - this.dl, this.start_y + this.temp_height);
            this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x + this.dr, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x - this.dl, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color

            // this.context.beginPath();
            // this.context.lineWidth = 1;
            // this.context.arc(tree_rstpoint[0], (tree_rstpoint[1]+tree_rstpoint[3])/2, stick_width/2.5, 0, 2*Math.PI, true);
            // this.context.closePath();
            // this.context.stroke();
            // this.context.fill();
            // this.context.lineWidth = 5;
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
            return 0;
        }


        var nature_scale = self.model.get("dtl_branch_curve");
        var w = weight/total_draw_stick;
        var real_drawing = 0;
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){
            // n = real_drawing;
            var nature = real_drawing*(Math.abs(d-u)/stick_scale);
            if(Math.abs(d-u)<len/2){
                // nature = n*(layer+1)*2;
                nature = real_drawing*((this.sub_slop/10)+1)*2;
            }
            else if(len>20 && Math.abs(d-u)/stick_scale>(layer+2)*2 && layer < 6){
                // nature = real_drawing*(layer+2)*2;
                nature = real_drawing*((this.sub_slop/10)+2)*2;
            }
            nature = nature*nature_scale;
            // nature = real_drawing*(layer+2)*2;
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


            var stick_len = Math.sqrt( Math.pow(extra_slope[long_stick][0],2) + Math.pow(extra_slope[long_stick][1],2) );
            var point_in_canvas = [ (tree_rstpoint[begin_index[long_stick][0]]*this.scale) + this.translate_point[0], (tree_rstpoint[begin_index[long_stick][1]]*this.scale) + this.translate_point[1]];
            var stick_vector = [extra_slope[long_stick][0]/stick_len, extra_slope[long_stick][1]/stick_len];
            
            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick + "#r#" + layer;
                        
            // change to vector later
            var up_line = this.find_line(tree_rstpoint[begin_index["up"][0]]+extra_slope["up"][0], tree_rstpoint[begin_index["up"][1]]+extra_slope["up"][1], stick_m["up"]);
            var down_line = this.find_line(tree_rstpoint[begin_index["down"][0]]+extra_slope["down"][0], tree_rstpoint[begin_index["down"][1]]+extra_slope["down"][1], stick_m["down"]);
            var leaf_line = {"up": up_line, "down":down_line};
            var start_point = [ tree_rstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_rstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1] ];
            

            if((!jQuery.isEmptyObject(alters[long_stick][n]) && alters[long_stick][n]["leaf"].length <= self.filter_cnt) || jQuery.isEmptyObject(alters[long_stick][n])){
                if(!jQuery.isEmptyObject(alters[long_stick][n]))
                    sub_total_leaf += alters[long_stick][n]["leaf"].length;
                if(stick_pos[short_stick][count_short_stick] == n){
                    if(jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                        count_short_stick++;
                        continue;
                    }
                    else if(alters[short_stick][count_short_stick]["leaf"].length <= self.filter_cnt){
                        sub_total_leaf += alters[short_stick][count_short_stick]["leaf"].length;
                        count_short_stick++;
                        continue;
                    }
                    else{
                        this.context.fillStyle = mapping_color.trunk;
                        this.context.strokeStyle = mapping_color.trunk;
                        // this.context.lineWidth = 15;
                        this.context.lineCap = 'round';
                        this.context.beginPath();
                        this.context.moveTo(tree_rstpoint[begin_index[short_stick][0]], tree_rstpoint[begin_index[short_stick][1]]);
                        this.context.lineTo(tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                        
                        this.context.stroke();//draw line
                        this.context.fill();//fill color
                        
                        var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                        var point_in_canvas = [ (tree_rstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_rstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                        var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                        var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                                               
                        if(this.snap == 0 && this.save_img == 0){
                            for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                                var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                                if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                    this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                                }
                            }
                        }
                        else if(this.save_img == 0){
                            this.snap_info = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                            for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                                var p_index = [Math.round(tree_rstpoint[begin_index[short_stick][0]]*this.snap_scale), Math.round(tree_rstpoint[begin_index[short_stick][0]]*this.snap_scale)];
                                this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;
                            }                    
                        }                        

                        start_point = [ tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                        // sub_total_leaf += this.draw_right_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                        var stick_leaf = 0;
                        stick_leaf = this.draw_leaf(set_alter_id, short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]); 
                        
                        sub_total_leaf += stick_leaf;

                        var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                        if(this.subyear in this.hash_table){
                            this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        }
                        else{
                            this.hash_table[this.subyear] = {};
                            this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        }                        
                        count_short_stick++;

                        if(total_draw_stick > 1){
                            this.context.fillStyle = mapping_color.trunk;
                            this.context.strokeStyle = mapping_color.trunk;
                            this.context.lineCap = 'round';
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
                           
                            this.context.lineTo(tree_rstpoint[0], tree_rstpoint[1]);

                            if(total_draw_stick > 2){
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

                                tree_rstpoint[2] = tree_rstpoint[0];
                                tree_rstpoint[3] = tree_rstpoint[1];
                            }                 
                            total_draw_stick-=1;            
                        }
                        real_drawing++;

                    }
                    
                }                
                continue;
            }
        
            // sub stick
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.lineCap = 'round';
                this.context.beginPath();
                this.context.moveTo(tree_rstpoint[begin_index[long_stick][0]], tree_rstpoint[begin_index[long_stick][1]]);
                this.context.lineTo(tree_rstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_rstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1]);
                //context.lineTo(_rstpoint[2],_rstpoint[3])
                this.context.stroke();//draw line
                this.context.fill();//fill color
            }
            
            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick + "#r#" + layer;
            if(this.snap == 0 && this.save_img == 0){
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            // console.log(p_index[0], p_index[1])
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }
                    }
                }
            }
            else if(this.save_img == 0){
                this.snap_info = alters[long_stick][n]["id"] + "#" + long_stick + "#r#" + layer;
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                        var p_index = [Math.round(tree_rstpoint[begin_index[long_stick][0]]*this.snap_scale), Math.round(tree_rstpoint[begin_index[long_stick][1]]*this.snap_scale)];
                        
                        this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;
                    }
                }
                
            }

            // draw leaf
            // sub_total_leaf += this.draw_right_leaf(long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            var stick_leaf = 0;
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                stick_leaf = this.draw_leaf(set_alter_id, long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            }
            // var stick_leaf = this.draw_leaf(set_alter_id, long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            sub_total_leaf += stick_leaf;

            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick + "#r#" + layer;
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
            }
            
            // short stick
            if(stick_pos[short_stick][count_short_stick] == n){
                if(jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    count_short_stick++;
                }
                else if(alters[short_stick][count_short_stick]["leaf"].length <= self.filter_cnt){
                    sub_total_leaf += alters[short_stick][count_short_stick]["leaf"].length;
                    count_short_stick++;
                }
                else{
                    // this.tree_fruit(this.context, fruit_pos[short_stick][0], fruit_pos[short_stick][1], alters[short_stick][count_short_stick]["fruit"]);
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.lineCap = 'round';
                    this.context.beginPath();
                    this.context.moveTo(tree_rstpoint[begin_index[short_stick][0]], tree_rstpoint[begin_index[short_stick][1]]);
                    this.context.lineTo(tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                    
                    this.context.stroke();//draw line
                    this.context.fill();//fill color
                   
                    var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                    var point_in_canvas = [ (tree_rstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_rstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                    var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                                    
                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        }
                    }
                    else if(this.save_img == 0){
                        this.snap_info = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                        for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                            var p_index = [Math.round(tree_rstpoint[begin_index[short_stick][0]]*this.snap_scale), Math.round(tree_rstpoint[begin_index[short_stick][0]]*this.snap_scale)];
                            this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;
                        }                    
                    }
                    

                    start_point = [ tree_rstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_rstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                    // sub_total_leaf += this.draw_right_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                    var stick_leaf = 0;
                    stick_leaf = this.draw_leaf(set_alter_id, short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]); 
                    
                    sub_total_leaf += stick_leaf;

                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#r#" + layer;
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                    
                    count_short_stick++;
                }
                
            }
            
            if(total_draw_stick > 1){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.lineCap = 'round';
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
                this.context.lineTo(tree_rstpoint[0], tree_rstpoint[1]);

                
                if(total_draw_stick > 2){
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

                    tree_rstpoint[2] = tree_rstpoint[0];
                    tree_rstpoint[3] = tree_rstpoint[1];
                }                 
                total_draw_stick-=1;  
                real_drawing++;   
            }
            
        }
        return (stick_pos[long_stick].length + stick_pos[short_stick].length);
        
    },

    draw_left_branch: function(layer, num_alter, alters){
        var self = this;
        var stick_scale = 0;
        stick_scale = num_alter/50;
        if(num_alter < 15){
            stick_scale = 1/1.5;
        }
        else{
            if(stick_scale < 1){
                stick_scale = 1;
            }
        }
        
        var stick_pos = {"up": [], "down": []};
        var long_stick, short_stick;
       
        var temp_total_leaf = this.count_total_leaf(alters);
        var total_leaf = temp_total_leaf["up"] + temp_total_leaf["down"];
        // give index of position
        if(alters["up"].length > alters["down"].length){
            var n = Math.floor(alters["up"].length/alters["down"].length);
            stick_pos["up"] = util.order_list(0, alters["up"].length);
            
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
        

        var total_draw_stick = 0;
        var cnt_short = 0;
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){
            if(u == d){
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    if(alters[long_stick][n]["leaf"].length > self.filter_cnt)
                        total_draw_stick++;
                    else{
                        if(!jQuery.isEmptyObject(alters[short_stick][n]))
                            if(alters[short_stick][n]["leaf"].length > self.filter_cnt)
                                total_draw_stick++;
                    }                    
                }
                else if(!jQuery.isEmptyObject(alters[short_stick][n])){
                    if(alters[short_stick][n]["leaf"].length > self.filter_cnt)
                        total_draw_stick++;
                }                
            }
            else{
                if(alters[long_stick][n]["leaf"].length > self.filter_cnt){
                    total_draw_stick++;
                    if(stick_pos[short_stick][cnt_short] == n){
                        cnt_short++;
                    }
                }
                else{
                    if(stick_pos[short_stick][cnt_short] == n){
                        if(alters[short_stick][cnt_short]["leaf"].length > self.filter_cnt){
                            total_draw_stick++;
                        }
                        cnt_short++;
                    }
                }
            }
            
        }


        var stick_width = total_draw_stick/stick_scale;
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

        var weight = Math.abs(tree_lstpoint[3] - tree_lstpoint[1]);
        // draw branch
        this.context.moveTo(this.start_x - this.dl, this.start_y + this.temp_height);
        if(total_draw_stick > 0){
            this.context.bezierCurveTo(cp1[0], cp1[1], cp2[0], cp2[1], tree_lstpoint[0], tree_lstpoint[1]);
            this.context.lineTo(tree_lstpoint[2], tree_lstpoint[3]);
            this.context.bezierCurveTo(cp3[0], cp3[1], cp4[0], cp4[1], this.start_x + this.dr, this.start_y + this.temp_height);
            this.context.closePath();
            // draw rectangle to fill the trunk
            this.context.moveTo(this.start_x - this.dl, this.start_y + this.temp_height);
            this.context.lineTo(this.start_x - this.dl, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height + this.stick_length+200);
            this.context.lineTo(this.start_x + this.dr, this.start_y + this.temp_height);
            this.context.closePath();

            this.context.stroke();//draw line
            this.context.fill();//fill color

            // this.context.beginPath();
            // this.context.lineWidth = 1;
            // this.context.arc(tree_lstpoint[0], (tree_lstpoint[1]+tree_lstpoint[3])/2, stick_width/2, 0, 2*Math.PI, true);
            // this.context.closePath();
            // this.context.stroke();
            // this.context.fill();
            // this.context.lineWidth = 5;

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
            return 0;
        }

        var nature_scale = self.model.get("dtl_branch_curve");
        var w = weight/total_draw_stick;
        for(var n = 0, len = stick_pos[long_stick].length; n < len; n++){

            var nature = n*(Math.abs(d-u)/stick_scale);
            if(Math.abs(d-u)<len/2){
                nature = n*((this.sub_slop/10)+1)*2;
            }
            else if(len>20 && Math.abs(d-u)/stick_scale>(layer+1)*3){
                nature = n*((this.sub_slop/10)+2)*2;
            }
            nature = nature*nature_scale;

            // set up and down paramaters
            var sx = {"up": (layer*5), "down":(layer*11)};
            var sy = {"up": (layer*7.5), "down":(layer*12)};
            var begin_index = {"up": [2, 3], "down":[0, 1]};
            var extra_slope = { "up": [(-this.stick_dx+sx[long_stick])*0.4+nature/(len/2), (-this.stick_dy-sy[long_stick])*0.4-nature/(len/2)], 
                                "down":[(-this.stick_dx-sx[long_stick])*0.4-nature/(len/2), (this.stick_dy-sy[long_stick])*0.4-nature/(len/2)] };
            var stick_m = {"up": extra_slope["up"][1]/extra_slope["up"][0], "down": extra_slope["down"][1]/extra_slope["down"][0]};
            var stick_v = {"up": [extra_slope["up"][0], extra_slope["up"][1]], "down": [extra_slope["down"][0], extra_slope["down"][1]]};
            var fruit_pos = { "up": [tree_lstpoint[begin_index["up"][0]]+extra_slope["up"][0]+10, tree_lstpoint[begin_index["up"][1]]+extra_slope["up"][1]+5], 
                              "down":[tree_lstpoint[begin_index["down"][0]]+extra_slope["down"][0]+10, tree_lstpoint[begin_index["down"][1]]+extra_slope["down"][1]+3]};
                     
            var stick_len = Math.sqrt( Math.pow(extra_slope[long_stick][0],2) + Math.pow(extra_slope[long_stick][1],2) );
            var point_in_canvas = [ (tree_lstpoint[begin_index[long_stick][0]]*this.scale) + this.translate_point[0], (tree_lstpoint[begin_index[long_stick][1]]*this.scale) + this.translate_point[1]];
            var stick_vector = [extra_slope[long_stick][0]/stick_len, extra_slope[long_stick][1]/stick_len];
            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick + "#l#" + layer;
            
            var up_line = this.find_line(tree_lstpoint[begin_index["up"][0]]+extra_slope["up"][0], tree_lstpoint[begin_index["up"][1]]+extra_slope["up"][1], stick_m["up"]);
            var down_line = this.find_line(tree_lstpoint[begin_index["down"][0]]+extra_slope["down"][0], tree_lstpoint[begin_index["down"][1]]+extra_slope["down"][1], stick_m["down"]);
            var leaf_line = {"up": up_line, "down":down_line};
            var start_point = [ tree_lstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_lstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1] ];
           
            var sub_total_leaf = 0;

            if((!jQuery.isEmptyObject(alters[long_stick][n]) && alters[long_stick][n]["leaf"].length <= self.filter_cnt) || jQuery.isEmptyObject(alters[long_stick][n])){
                if(!jQuery.isEmptyObject(alters[long_stick][n]))
                    sub_total_leaf += alters[long_stick][n]["leaf"].length; 
                if(stick_pos[short_stick][count_short_stick] == n){
                    if(jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                        count_short_stick++;
                        continue;
                    }
                    else if(alters[short_stick][count_short_stick]["leaf"].length <= self.filter_cnt){
                        sub_total_leaf += alters[short_stick][count_short_stick]["leaf"].length;
                        count_short_stick++;
                        continue;
                    }
                    else{
                        this.context.fillStyle = mapping_color.trunk;
                        this.context.strokeStyle = mapping_color.trunk;
                        this.context.lineCap = 'round';
                        this.context.beginPath();
                        this.context.moveTo(tree_lstpoint[begin_index[short_stick][0]], tree_lstpoint[begin_index[short_stick][1]]);
                        this.context.lineTo(tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                       
                        this.context.stroke();//draw line
                        // this.context.fill();//fill color
                        
                        var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                        var point_in_canvas = [ (tree_lstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_lstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                        var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                        var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;
                        
                        if(this.snap == 0 && this.save_img == 0){
                            for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                                var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                                if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                    this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                                }
                            }
                        }

                        else if(this.save_img == 0){
                            this.snap_info = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;
                            for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                                var p_index = [Math.round(tree_lstpoint[begin_index[short_stick][0]]*this.snap_scale), Math.round(tree_lstpoint[begin_index[short_stick][1]]*this.snap_scale)];
                                this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;
                               
                            }           
                        }

                        start_point = [ tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                        stick_leaf = 0;
                        stick_leaf = this.draw_leaf(set_alter_id, short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                        
                        sub_total_leaf += stick_leaf;

                        var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;                    
                        if(this.subyear in this.hash_table){
                            this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                           
                        }
                        else{
                            this.hash_table[this.subyear] = {};
                            this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                        }
                        
                        count_short_stick++;                    
                    }
                    if(total_draw_stick > 1){
                        var ori_lstpoint = [0, 0, 0, 0];
                        ori_lstpoint[0] = tree_lstpoint[0];
                        ori_lstpoint[1] = tree_lstpoint[1];
                        ori_lstpoint[2] = tree_lstpoint[2];
                        ori_lstpoint[3] = tree_lstpoint[3];
                        tree_lstpoint[0] = tree_lstpoint[0]-this.sub_stick_length+nature/(len/2);
                        tree_lstpoint[1] = tree_lstpoint[1]-w/2-this.sub_slop-nature/(len/2);
                        tree_lstpoint[2] = tree_lstpoint[2]-this.sub_stick_length+nature/(len/2);
                        tree_lstpoint[3] = tree_lstpoint[3]+w/2-this.sub_slop-nature/(len/2);

                        this.context.lineCap = 'round';
                        this.context.fillStyle = mapping_color.trunk;
                        this.context.strokeStyle = mapping_color.trunk;
                        this.context.beginPath();
                        this.context.moveTo(ori_lstpoint[0],ori_lstpoint[1]);
                        this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);

                        if(total_draw_stick > 2){
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

                            tree_lstpoint[2] = tree_lstpoint[0];
                            tree_lstpoint[3] = tree_lstpoint[1];                    
                        }
                       
                    }
                    total_draw_stick--;
                }
                continue;
            }
            // sub stick
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.lineCap = 'round';
                this.context.beginPath();
                this.context.moveTo(tree_lstpoint[begin_index[long_stick][0]], tree_lstpoint[begin_index[long_stick][1]]);
                this.context.lineTo(tree_lstpoint[begin_index[long_stick][0]]+extra_slope[long_stick][0], tree_lstpoint[begin_index[long_stick][1]]+extra_slope[long_stick][1]);
                //context.lineTo(_rstpoint[2],_rstpoint[3])
                this.context.stroke();//draw line
                // this.context.fill();//fill color
            }            

            var set_alter_id = this.subyear + "_" + alters[long_stick][n]["id"] + "#" + long_stick + "#l#" + layer;
            if(this.snap == 0 && this.save_img == 0){
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                        var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                        if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                            this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                        }                        
                    }
                }
            }
            else if(this.save_img == 0){
                this.snap_info = alters[long_stick][n]["id"] + "#" + long_stick + "#l#" + layer;
                if(!jQuery.isEmptyObject(alters[long_stick][n])){
                    for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                        var p_index = [Math.round(tree_lstpoint[begin_index[long_stick][0]]*this.snap_scale), Math.round(tree_lstpoint[begin_index[long_stick][1]]*this.snap_scale)];
                        this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;
                        
                    }
                }                
            }
            
            var stick_leaf = 0;
            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                stick_leaf = this.draw_leaf(set_alter_id, long_stick, alters[long_stick][n], leaf_line[long_stick], stick_m[long_stick], start_point, stick_v[long_stick]);
            }
            sub_total_leaf += stick_leaf;

            if(!jQuery.isEmptyObject(alters[long_stick][n])){
                var hash_index_id = alters[long_stick][n]["id"] + "#" + long_stick + "#l#" + layer;
                
                if(this.subyear in this.hash_table){
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                    
                }
                else{
                    this.hash_table[this.subyear] = {};
                    this.hash_table[this.subyear][hash_index_id] = [alters[long_stick][n]["id"], stick_leaf, alters[long_stick][n]["fruit"], layer+1, long_stick];
                }
               
            }           
            
            // short stick
            if(stick_pos[short_stick][count_short_stick] == n){
                if(jQuery.isEmptyObject(alters[short_stick][count_short_stick])){
                    count_short_stick++;
                }
                else if(alters[short_stick][count_short_stick]["leaf"].length <= self.filter_cnt){
                    sub_total_leaf += alters[short_stick][count_short_stick]["leaf"].length;
                    count_short_stick++;
                }
                else{
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    this.context.lineCap = 'round';
                    this.context.beginPath();
                    this.context.moveTo(tree_lstpoint[begin_index[short_stick][0]], tree_lstpoint[begin_index[short_stick][1]]);
                    this.context.lineTo(tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1]);
                    
                    this.context.stroke();//draw line
                    // this.context.fill();//fill color
                    
                    var stick_len = Math.sqrt( Math.pow(extra_slope[short_stick][0],2) + Math.pow(extra_slope[short_stick][1],2) );
                    var point_in_canvas = [ (tree_lstpoint[begin_index[short_stick][0]]*this.scale) + this.translate_point[0], (tree_lstpoint[begin_index[short_stick][1]]*this.scale) + this.translate_point[1]];
                    var stick_vector = [extra_slope[short_stick][0]/stick_len, extra_slope[short_stick][1]/stick_len];
                    var set_alter_id = this.subyear + "_" + alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;
                    
                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(stick_len*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+stick_vector[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+stick_vector[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        }
                    }

                    else if(this.save_img == 0){
                        this.snap_info = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;
                        for(var i = 0; i < Math.round(stick_len*this.snap_scale); i++){
                            var p_index = [Math.round(tree_lstpoint[begin_index[short_stick][0]]*this.snap_scale), Math.round(tree_lstpoint[begin_index[short_stick][1]]*this.snap_scale)];
                            
                            this.snaping_grid[p_index[0]][p_index[1]] = this.snap_info;    
                        }
                    }               
                    

                    start_point = [ tree_lstpoint[begin_index[short_stick][0]]+extra_slope[short_stick][0], tree_lstpoint[begin_index[short_stick][1]]+extra_slope[short_stick][1] ];
                    // sub_total_leaf += this.draw_left_leaf(short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                    stick_leaf = 0;
                    stick_leaf = this.draw_leaf(set_alter_id, short_stick, alters[short_stick][count_short_stick], leaf_line[short_stick], stick_m[short_stick], start_point, stick_v[short_stick]);
                    
                    sub_total_leaf += stick_leaf;

                    var hash_index_id = alters[short_stick][count_short_stick]["id"] + "#" + short_stick + "#l#" + layer;                    
                    if(this.subyear in this.hash_table){
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                    else{
                        this.hash_table[this.subyear] = {};
                        this.hash_table[this.subyear][hash_index_id] = [alters[short_stick][count_short_stick]["id"], stick_leaf, alters[short_stick][count_short_stick]["fruit"], layer+1, short_stick];
                    }
                    count_short_stick++;
                }
                
            }

            if(total_draw_stick > 1){
                var ori_lstpoint = [0, 0, 0, 0];
                ori_lstpoint[0] = tree_lstpoint[0];
                ori_lstpoint[1] = tree_lstpoint[1];
                ori_lstpoint[2] = tree_lstpoint[2];
                ori_lstpoint[3] = tree_lstpoint[3];
                tree_lstpoint[0] = tree_lstpoint[0]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[1] = tree_lstpoint[1]-w/2-this.sub_slop-nature/(len/2);
                tree_lstpoint[2] = tree_lstpoint[2]-this.sub_stick_length+nature/(len/2);
                tree_lstpoint[3] = tree_lstpoint[3]+w/2-this.sub_slop-nature/(len/2);

                this.context.lineCap = 'round';
                this.context.fillStyle = mapping_color.trunk;
                this.context.strokeStyle = mapping_color.trunk;
                this.context.beginPath();
                this.context.moveTo(ori_lstpoint[0],ori_lstpoint[1]);
                this.context.lineTo(tree_lstpoint[0], tree_lstpoint[1]);

                if(total_draw_stick > 2){
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

                    tree_lstpoint[2] = tree_lstpoint[0];
                    tree_lstpoint[3] = tree_lstpoint[1];                    
                }
               
            }
            total_draw_stick--;
              
        }
        return (stick_pos[long_stick].length + stick_pos[short_stick].length);

    },

    draw_leaf: function(set_alter_id, side, alter, line, m, p, v){
        var self = this;
        var next = 0;
        
        var leaf_scale = self.model.get("leaf_scale");
        var fruit_scale = Math.round(self.model.get("fruit_scale")*self.model.get("leaf_scale")*10/3)/10;
        
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
        this.context.lineCap = 'round';
        this.context.lineWidth = 5;
        while(g<len){
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
                    if(fruit_size != 0)
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
                    if(fruit_size != 0)
                        this.tree_fruit(this.context, p[0]+(dir_v[0]*(15+tip)), p[1]+(dir_v[1]*(15+tip)), fruit_size);
                }

                for(var h = 0; h < cluster; h++){ 
                    var radius = leaf_table[sum_leaf[g].size];                    
                    var color = mapping_color.render_leaf_color[sum_leaf[g].color];
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
                    
                        if(this.snap == 0 && this.save_img == 0){
                            for(var leaf_x = 0; leaf_x < 2.5*radius*this.scale; leaf_x++){
                                for(var leaf_y = -radius*this.scale*0.25; leaf_y < radius*this.scale*0.25; leaf_y++){
                                    // x = xcos - ysin, y = ycos + xsin
                                    var real_x = (point_x*this.scale + this.translate_point[0]) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                    var real_y = (point_y*this.scale + this.translate_point[1]) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                    
                                    var clicking_point = [Math.round(real_x/self.c_detail), Math.round(real_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail){
                                        if(leaf_id != "none")
                                            this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+" +  leaf_id;
                                        // else
                                        //     this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+ ";
                                    }
                                }
                                
                            }
                        }
                        else if(this.save_img == 0){
                            for(var leaf_x = 0; leaf_x < 2.5*radius*this.snap_scale; leaf_x++){
                                for(var leaf_y = -radius*this.snap_scale*0.25; leaf_y < radius*this.snap_scale*0.25; leaf_y++){
                                    // x = xcos - ysin, y = ycos + xsin
                                    var real_x = (point_x*this.snap_scale) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                    var real_y = (point_y*this.snap_scale) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                    this.snaping_grid[Math.round(real_x)][Math.round(real_y)] = self.snap_info;
                                }
                                
                            }
                        }

                        this.leaf_style_1(this.context, point_x, point_y, radius, color, angle, leaf_id);

                    }
                    else{
                        angle = angle - (Math.PI/4);
                        if(this.snap == 0 && this.save_img == 0){
                            for(var leaf_x = 0; leaf_x < 2.5*radius*this.scale; leaf_x++){
                                for(var leaf_y = -radius*this.scale*0.5; leaf_y < radius*this.scale*0.5; leaf_y++){
                                    // x = xcos - ysin, y = ycos + xsin
                                    var real_x = (point_x*this.scale + this.translate_point[0]) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                    var real_y = (point_y*this.scale + this.translate_point[1]) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                    
                                    var clicking_point = [Math.round(real_x/self.c_detail), Math.round(real_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail){
                                        if(leaf_id != "none")
                                            this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+" +  leaf_id;
                                        // else
                                        //     this.clicking_grid[clicking_point[0]][clicking_point[1]] = "leaf*+ ";
                                    }
                                }
                                
                            }
                        }

                        else if(this.save_img == 0){
                            for(var leaf_x = 0; leaf_x < 2.5*radius*this.snap_scale; leaf_x++){
                                for(var leaf_y = -radius*this.snap_scale*0.5; leaf_y < radius*this.snap_scale*0.5; leaf_y++){
                                    // x = xcos - ysin, y = ycos + xsin
                                    var real_x = (point_x*this.snap_scale) + (leaf_x*Math.cos(angle) - leaf_y*Math.sin(angle));
                                    var real_y = (point_y*this.snap_scale) + (leaf_y*Math.cos(angle) + leaf_x*Math.sin(angle));
                                    this.snaping_grid[Math.round(real_x)][Math.round(real_y)] = self.snap_info;
                                }
                                
                            }
                        }
                        
                        this.leaf_style_1(this.context, point_x, point_y, radius, color, angle, leaf_id);
                        
                    }

                    if(self.tree_size[self.ego_label][4] == "none" && self.snap == 0){
                        if(point_x > self.tree_size[self.ego_label][1])
                            self.tree_size[self.ego_label][1] = point_x;
                        if(point_x < self.tree_size[self.ego_label][0])
                            self.tree_size[self.ego_label][0] = point_x;
                        if(point_y < self.tree_size[self.ego_label][2])
                            self.tree_size[self.ego_label][2] = point_y;
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

            if(g<len){
                // control middle stick by ori_m
                this.context.beginPath();
                if(sub%3==0){
                    point_y = p[1]+ori_v[1]*20*len_scale;
                    point_x = p[0]+ori_v[0]*20*len_scale; 

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];

                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(20*len_scale*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+ori_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+ori_v[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        }
                    }
                    else if(this.save_img == 0){
                        for(var i = 0; i < Math.round(20*len_scale*this.snap_scale); i++){
                            var p_index = [Math.round(p[0]*this.snap_scale), Math.round(p[1]*this.snap_scale)];
                            this.snaping_grid[p_index[0]][p_index[1]] = self.snap_info;
                        }
                    }
                    
                }
                else if(sub%3==1){
                    dir_v = this.find_dir(ori_v, Math.PI/4);
                    point_y = p[1]+dir_v[1]*13*len_scale;
                    point_x = p[0]+dir_v[0]*13*len_scale;

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];

                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+dir_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+dir_v[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        }
                    }
                    else if(this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.snap_scale); i++){
                            var p_index = [Math.round(p[0]*this.snap_scale), Math.round(p[1]*this.snap_scale)];
                            this.snaping_grid[p_index[0]][p_index[1]] = self.snap_info;
                        }
                    }

                }
                if(sub%3 == 2){ 
                    point_y = p[1]+ori_v[1]*13*len_scale;
                    point_x = p[0]+ori_v[0]*13*len_scale;

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];
                    
                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+ori_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+ori_v[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        } 
                    }
                    else if(this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.snap_scale); i++){
                            var p_index = [Math.round(p[0]*this.snap_scale), Math.round(p[1]*this.snap_scale)];
                            this.snaping_grid[p_index[0]][p_index[1]] = self.snap_info;
                        } 
                    }
                    
                    this.context.beginPath();
                    this.context.lineWidth = 5;
                    this.context.lineCap = 'round';
                    this.context.moveTo(p[0], p[1]);
                    this.context.lineTo(point_x, point_y);
                    
                    this.context.stroke();//draw line
                    p[0] = point_x;
                    p[1] = point_y;

                    dir_v = this.find_dir(ori_v, -Math.PI/4);
                    point_y = p[1]+dir_v[1]*13*len_scale;
                    point_x = p[0]+dir_v[0]*13*len_scale;

                    var point_in_canvas = [ (p[0]*this.scale) + this.translate_point[0], (p[1]*this.scale) + this.translate_point[1]];

                    if(this.snap == 0 && this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.scale); i++){
                            var p_index = [Math.round((point_in_canvas[0]+dir_v[0]*i)/self.c_detail), Math.round((point_in_canvas[1]+dir_v[1]*i)/self.c_detail)];
                            if(p_index[0] >= 0 && p_index[0] <= this.myCanvas.width/self.c_detail && p_index[1] >= 0 && p_index[1] <= this.myCanvas.height/self.c_detail){
                                this.clicking_grid[p_index[0]][p_index[1]] = set_alter_id;
                            }
                        }
                    }
                    else if(this.save_img == 0){
                        for(var i = 0; i < Math.round(13*len_scale*this.snap_scale); i++){
                            var p_index = [Math.round(p[0]*this.snap_scale), Math.round(p[1]*this.snap_scale)];
                            this.snaping_grid[p_index[0]][p_index[1]] = self.snap_info;
                        }
                    }
                }
                                           
                if(sub%3 > 0 || (sub%3 == 0 && sub>0 && len-g>0)){
                    this.context.fillStyle = mapping_color.trunk;
                    this.context.strokeStyle = mapping_color.trunk;
                    
                    this.context.beginPath();
                    this.context.lineWidth = 5;
                    this.context.lineCap = 'round';
                    this.context.moveTo(p[0], p[1]);
                    this.context.lineTo(point_x, point_y);
                    // this.context.closePath();
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
        grd.addColorStop(0, mapping_color.trunk);
        grd.addColorStop(1, mapping_color.root);
        grd.addColorStop(0, mapping_color.trunk);
        grd.addColorStop(1, mapping_color.root);
        ctx.fillStyle = grd;
        ctx.strokeStyle = grd;
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
        var root_size = min_root*Math.pow(max_root, 0.3);
        var author_area = root_index[jQuery.inArray(max_root, root_amount)];
        var root_scale = self.model.get("root_curve");
        var root_length = self.model.get("root_len_scale");
        var trunk_weigth = (px_r - px_l)/4; ///total_stick;
        
        // draw main root
        ctx.beginPath();
        
        var cpr = [(px_r+px_l)/2 + trunk_weigth*1.5, py + 120];
        var cpl = [(px_r+px_l)/2 - trunk_weigth*1.5, py + 120];
        ctx.moveTo(px_r, py);
        ctx.bezierCurveTo(px_r, cpr[1], cpr[0], cpr[1], (px_r+px_l)/2 + trunk_weigth, py+200);
        ctx.lineTo((px_r+px_l)/2 - trunk_weigth, py+200);
        ctx.bezierCurveTo(cpl[0], cpl[1], px_l, cpl[1], px_l, py);
        this.context.closePath();
        ctx.stroke();
        ctx.fill();
        
        var grd_root = ctx.createLinearGradient((px_r + px_l)/2, py+200, (px_r + px_l)/2, py+400);
        grd_root.addColorStop(0, mapping_color.root);
        grd_root.addColorStop(1, mapping_color.render_roots_color[author_area]);
        ctx.fillStyle = grd_root;
        ctx.strokeStyle = grd_root;
        
        var cp_bottom = [(px_r + px_l)/2, py + 200 + root_size*1.5];
        var stick_right_side = [(px_r+px_l)/2 + trunk_weigth, py+200];
        var stick_left_side = [(px_r+px_l)/2 - trunk_weigth, py+200];
        var main_step = [ trunk_weigth/total_root[author_area]["sub"].length, ((root_size*105 + 200)/total_root[author_area]["sub"].length)*root_length]; //-250
       
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
                ctx.lineTo(stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]);
                ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                if(this.snap == 0 && this.save_img == 0){
                    for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                            var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                            if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                            }
                        }
                    }
                }
                

                stick_right_side = [stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]];
                stick_left_side = [stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]];
                
                ctx.stroke();
                ctx.fill();
                continue;
            }
            
            else if(i % n == 0){
                ctx.beginPath();
                ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] - main_step[0] + curve*2, stick_right_side[1] + main_step[1]);
                ctx.lineTo(stick_left_side[0] + main_step[0]  + curve*2, stick_left_side[1] + main_step[1]);
                ctx.bezierCurveTo(left_m[0]  + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                if(this.snap == 0 && this.save_img == 0){
                    for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                            var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                            if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                            }
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
            ctx.lineTo(stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]);
            ctx.quadraticCurveTo(left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
            if(this.snap == 0 && this.save_img == 0){
                for(var root_x = (stick_right_side[0]*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + self.translate_point[0]) ; root_x--){
                    for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + main_step[1])*this.scale + self.translate_point[1]); root_y++){
                        var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                        if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                            self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[author_area]["root_cat"];
                        }
                    }
                }
            }
            
            stick_right_side = [stick_right_side[0] - main_step[0], stick_right_side[1] + main_step[1]];
            stick_left_side = [stick_left_side[0] + main_step[0], stick_left_side[1] + main_step[1]];
             
            if(self.tree_size[self.ego_label][4] == "none" && self.snap == 0)
                self.tree_size[self.ego_label][3] = stick_left_side[1];

            ctx.stroke();
            ctx.fill();
            
        }

        var right_m = [stick_right_side[0] - main_step[0] - curve*2, stick_right_side[1] + main_step[1]];
        var left_m = [stick_left_side[0] + main_step[0] - curve*2, stick_left_side[1] + main_step[1]];

        ctx.beginPath();
        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
        ctx.bezierCurveTo(right_m[0], right_m[1], right_m[0] + curve*3, right_m[1], (px_r + px_l)/2 - curve*4, stick_left_side[1] + main_step[1]*2);
        ctx.bezierCurveTo(left_m[0] + curve*3, left_m[1], left_m[0], left_m[1], stick_left_side[0], stick_left_side[1]);
        
        ctx.stroke();
        ctx.fill();

        var total = root_index.length;
        var side = 0;
        var cp_side = [px_r, px_l];
        
        var extend = 300/root_amount.length;
        
        var root_index_sorted = [];
        for(var i in sorted_root){
            root_index_sorted.push(root_index[jQuery.inArray(sorted_root[i], root_amount)]);
            root_amount.splice(jQuery.inArray(sorted_root[i], root_amount), 1, -1);
        }
        
        for(var index in root_index_sorted){
            r = root_index_sorted[index];
            root_size = Math.pow(total_root[r]["length"], 0.3);
            if(r == author_area || root_size == 0 || r == -1){
                continue;
            }
            
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
                grd_root.addColorStop(1, mapping_color.render_roots_color[r]);
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
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] - curve, right_m[1], right_m[0], right_m[1], stick_right_side[0] + unit_point[0] - root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        if(this.snap == 0 && this.save_img == 0){
                            for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                                for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                    var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                    }
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
                        ctx.lineTo(stick_left_side[0] + unit_point[0] + unit_weigth - root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0] + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                        if(this.snap == 0 && this.save_img == 0){
                            for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                                for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                    var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                    }
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
                    if(this.snap == 0 && this.save_img == 0){
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] + unit_point[0] - root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x > (stick_left_side[0]*self.scale + this.translate_point[0]); root_x--){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
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
                grd_root.addColorStop(1, mapping_color.render_roots_color[r]);
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
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] - curve, right_m[1], right_m[0], right_m[1], stick_right_side[0] - unit_point[0] + root_scale*(i-1), stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1), stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0], left_m[1], left_m[0] - curve, left_m[1], stick_left_side[0], stick_left_side[1]);
                        if(this.snap == 0 && this.save_img == 0){
                            for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                                for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                                    var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                    }
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
                        ctx.beginPath();
                        ctx.moveTo(stick_right_side[0], stick_right_side[1]);
                        ctx.bezierCurveTo(right_m[0] + curve*0.5, right_m[1], right_m[0] + curve*2, right_m[1], stick_right_side[0] - unit_point[0] + root_scale*(i-1) + curve*2, stick_right_side[1] + unit_point[1]);
                        // ctx.lineTo(stick_right_side[0] - unit_point[0], stick_right_side[1] + unit_point[1]);
                        ctx.lineTo(stick_left_side[0] - unit_point[0] - unit_weigth + root_scale*(i-1) + curve*2, stick_left_side[1] + unit_point[1]);
                        ctx.bezierCurveTo(left_m[0] + curve*2, left_m[1], left_m[0] + curve*0.5, left_m[1], stick_left_side[0], stick_left_side[1]);
                        // ctx.lineTo(stick_left_side[0], stick_left_side[1]);
                        if(this.snap == 0 && this.save_img == 0){
                            for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                                for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                                    var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                    if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                    }
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
                    if(this.snap == 0 && this.save_img == 0){
                        for(var root_y = (stick_right_side[1]*self.scale + self.translate_point[1]); root_y < ((stick_right_side[1] + unit_point[1])*this.scale + self.translate_point[1]); root_y++){
                            for(var root_x = ((stick_right_side[0] - unit_point[0] + root_scale*(i-1))*self.scale + this.translate_point[0]) ; root_x < (stick_left_side[0]*self.scale + this.translate_point[0]); root_x++){                            
                                var clicking_point = [Math.round(root_x/self.c_detail), Math.round(root_y/self.c_detail)];
                                if(clicking_point[0] >= 0 && clicking_point[0] <= self.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= self.myCanvas.height/self.c_detail){
                                    self.clicking_grid[clicking_point[0]][clicking_point[1]] = "root*+" +  total_root[r]["root_cat"];
                                }
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

    // just a circle for the leaf
    leaf_style_0: function(ctx, cx, cy, radius, color, angle, l_id, index) {
        var self = this;
        
        this.context.lineWidth = 1;
        this.context.strokeStyle = mapping_color.leaf_stork;//line's color
        this.context.fillStyle = color;
        ctx.beginPath();
        
        if(index == 0)
            ctx.arc(cx-radius/1.5, cy, radius, 0, 2*Math.PI, true);
        else
            ctx.arc(cx+radius/1.5, cy, radius, 0, 2*Math.PI, true);
        ctx.stroke();
        this.context.fill();
        
        this.context.lineWidth = 5;
        this.context.lineCap = 'round';
    },
    
    leaf_style_1: function(ctx, cx, cy, radius, color, angle, l_id) {
        var self = this;
        if(this.snap == 0 && this.save_img == 0){
            // var canvas_x_boundary = [-this.translate_point[0]/this.scale, (self.myCanvas.width - this.translate_point[0]) / this.scale ];
            // var canvas_y_boundary = [-this.translate_point[1]/this.scale, (self.myCanvas.height - this.translate_point[1]) / self.scale ];
            if(cx < self.canvas_x_boundary[0] || cx > self.canvas_x_boundary[1] || cy > self.canvas_y_boundary[1] || cy < self.canvas_y_boundary[0])
                return;
        }
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
        ctx.quadraticCurveTo(radius, -radius, 0, 0);
        this.context.closePath();
        ctx.stroke();
        this.context.fill();
        ctx.restore();
        this.context.lineWidth = 5;
        this.context.lineCap = 'round';
    },

    tree_fruit: function(context, posx, posy, r){
        var self = this;
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

    set_tree_label: function (context, message, pos, click_info){
        var self = this;
        context.font = '78pt Calibri';
        context.fillStyle = 'black';
        context.fillText(message, pos[0], pos[1]); //pos

        // create info button
        if(this.snap == 0 && this.save_img == 0){
            // context.fillStyle = 'rgba(204,0,0, 0.5)';
            context.fillStyle = 'rgb(230, 127, 128)';
            context.fillRect(pos[0]+message.length*60+10, pos[1]-75, 90, 90);
            context.fillStyle = 'black';
            context.font = 'bold 64pt Courier';
            context.fillText("i", pos[0]+message.length*60+30, pos[1]-5);

            var box = [pos[0]+message.length*60+10, pos[1]-75];

            for(var tx=(box[0]*self.scale + self.translate_point[0]); tx < ((box[0]+90)*self.scale + self.translate_point[0]); tx++){
                for(var ty=(box[1]*self.scale + self.translate_point[1]); ty < ((box[1]+90)*self.scale + self.translate_point[1]); ty++){
                    var clicking_point = [Math.round(tx/self.c_detail), Math.round(ty/self.c_detail)];
                    if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail)
                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "popup*+" + click_info;
                }
            }

            context.fillStyle = 'rgb(145,186,240)';
            context.fillRect(pos[0]+message.length*60+10 + 100, pos[1]-75, 90, 90);
            context.fillStyle = 'black';
            context.font = 'bold 64pt Courier';
            context.fillText("↴", pos[0]+message.length*60+30 + 100, pos[1]);
            // context.fillText("↧", pos[0]+message.length*60+30 + 100, pos[1]);
            var box = [pos[0]+message.length*60+10 + 100, pos[1]-75];

            for(var tx=(box[0]*self.scale + self.translate_point[0]); tx < ((box[0]+90)*self.scale + self.translate_point[0]); tx++){
                for(var ty=(box[1]*self.scale + self.translate_point[1]); ty < ((box[1]+90)*self.scale + self.translate_point[1]); ty++){
                    var clicking_point = [Math.round(tx/self.c_detail), Math.round(ty/self.c_detail)];
                    if(clicking_point[0] >= 0 && clicking_point[0] <= this.myCanvas.width/self.c_detail && clicking_point[1] >= 0 && clicking_point[1] <= this.myCanvas.height/self.c_detail)
                        self.clicking_grid[clicking_point[0]][clicking_point[1]] = "saveIMG*+" + click_info;
                }
            }   
        }
    },

    set_tree_info: function(context, info, pos){
        context.font = '78pt Calibri';
        context.fillStyle = 'black';
        context.fillText(info[0], pos[0], pos[1]); //pos
        context.fillText(info[1], pos[0], pos[1]+150); //pos
    },

    
    update_fruit_size: function(){
        var self = this;
        var fruit_scale = Math.round(self.model.get("fruit_scale")*self.model.get("leaf_scale")*10/3)/10;
        self.el_fruit_size.ionRangeSlider("update", {
            from: fruit_scale
        });

    },

    draw4snapshot:function(){
        var self = this;
        this.context =  this.snapCanvas.getContext('2d');
        this.snapCanvas.height = self.el_snap_container.height();
        this.snapCanvas.width = self.el_snap_container.width();
        this.snap = 1;
        this.save_img = 0;
        this.stick_dx = 50;
        this.stick_dy = 50;
        this.sub_stick_length = 55;
        this.sub_slop = 0;
        
        var structure = self.model.get("tree_structure");
        var snap_tree = self.model.get("snapshot");
        this.ego_label = snap_tree[0] + "_" + snap_tree[1];
        var snap_width = self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][0] + 300;
        var snap_height = self.tree_size[this.ego_label][3] - self.tree_size[this.ego_label][2] + 500;
        
        this.context.lineWidth = 5; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.snapCanvas.width, this.snapCanvas.height);
        this.context.save();

        this.snap_scale = 1;
        while(snap_width*this.snap_scale > self.snapCanvas.width || snap_height*this.snap_scale > self.snapCanvas.height){
            this.snap_scale = Math.round((this.snap_scale-0.01)*100)/100;
        }

        self.el_one_tree.css({'width': '100%'});
        if(snap_width*this.snap_scale + 10 < this.snapCanvas.width){
            this.snapCanvas.width = snap_width*this.snap_scale + 10;
            self.el_one_tree.css({'width': snap_width*this.snap_scale + 10});
        }        

        for(var x = 0; x <= this.snapCanvas.width; x++){
            this.snaping_grid.push([]);
            for(var y = 0; y <= this.snapCanvas.height; y++){
                this.snaping_grid[x][y] = -1;
            }
        }

        self.el_one_tree.addClass("auto_center");
    
        this.context.translate(0.5, 0.5);
        this.context.scale(this.snap_scale, this.snap_scale);

        var ego = structure[self.view][snap_tree[1]][snap_tree[0]];
        var left_side = 0;
        var right_side = 0;
        self.total_layer = ego["left"].length;
        self.stick_length = self.tree_tall/self.total_layer; //_dist
        var layer_total_alter = {"right": [], "left": []};

        this.start_y = this.snapCanvas.height/this.snap_scale - (self.tree_size[this.ego_label][3] - self.tree_size[this.ego_label][5]) - 150; // align bottom

        for(var s = 0; s < self.total_layer; s++){
            var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
            var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;

            layer_total_alter["right"].push(r);
            layer_total_alter["left"].push(l);
            left_side += l;
            right_side += r;
        }
        var total_contact = left_side + right_side;
        var stick_length = 0;
        for(var l = 0; l < layer_total_alter["left"].length; l++){
            var down = ego["left"][l]["level"]["down"].length;
            var up = ego["left"][l]["level"]["up"].length;
            if(stick_length < down && down >= up){
                stick_length = down;
            }
            else if(stick_length < up && down < up){
                stick_length = up;
            }
        }
        this.start_x = self.tree_size[this.ego_label][4] - self.tree_size[this.ego_label][0] + 150;

        var ori_dr = right_side*0.65;
        var ori_dl = left_side*0.65;
        var t_scale = (right_side + left_side)/150;
        if(right_side+left_side < 80){
            t_scale = 0.5;
        }
        else{
            if(t_scale < 1){
                t_scale = 1;
            }
        }

        var start_h = 0;
        var add_h = 1;
        var max_h = self.total_layer;
        var mod_layer = Math.floor(8/self.total_layer);
        var layer_slop = Math.round(100/self.total_layer)/10;
        
        // root
        var root_drawing = self.model.get("leaf_switch");
        if("root" in ego){
            total_root = ego["root"][0];
            if(root_drawing == 1)
                self.draw_root(total_root, this.start_y + this.stick_length + 260, this.start_x + (ori_dr/t_scale)*1.5, this.start_x - (ori_dl/t_scale)*1.5, this.context);
        }
        
        this.context.lineWidth = 5; // set the style
        var real_height = 0;
        for(var height = 0; height < self.total_layer; height++){
            this.context.fillStyle = mapping_color.trunk;
            this.context.strokeStyle = mapping_color.trunk;
            this.context.beginPath();
            
            this.dr = (ori_dr/t_scale)*1.5;//1.5;
            this.dl = (ori_dl/t_scale)*1.5;
            
            this.temp_height = 30*height; //_d
            if(real_height == 0){
                this.temp_height = 60;
            }

            this.extra_y = height*8*layer_slop; //control point weight for its torson
            this.extra_x = height*8*layer_slop; //control point (constant)
            this.sub_slop = height*10*layer_slop;
    
            var used_dr = 0;
            var used_dl = 0;
            if((real_height == self.total_layer-1 && layer_total_alter["right"][real_height] == 0) || ori_dr == 0){}

            else
                used_dr = this.draw_right_branch(height, layer_total_alter["right"][real_height], ego["right"][real_height]["level"]);

            // draw left tree
            this.context.fillStyle = mapping_color.trunk;
            this.context.strokeStyle = mapping_color.trunk;
            this.context.beginPath();
            if((real_height == self.total_layer-1 && layer_total_alter["left"][real_height] == 0) || ori_dl == 0){}

            else
                used_dl = this.draw_left_branch(height, layer_total_alter["left"][real_height], ego["left"][real_height]["level"]);

            ori_dr -= used_dr*0.45;
            ori_dl -= used_dl*0.45;
            this.start_y = this.start_y - this.stick_length - this.temp_height;
            real_height += 1;
        }
        self.model.set({"snap_grid":self.snaping_grid});
        this.context.restore();
    },

    draw4save:function(){
        var self = this;
        this.context =  this.saveCanvas.getContext('2d');
        this.snap = 0;
        this.save_img = 1;
        this.stick_dx = 50;
        this.stick_dy = 50;
        this.sub_stick_length = 55;
        this.sub_slop = 0;

        var structure = self.model.get("tree_structure");
        var saving_tree = self.model.get("save_tree");
        this.ego_label = saving_tree[0] + "_" + saving_tree[1];
        var tree_width = self.tree_size[this.ego_label][1] - self.tree_size[this.ego_label][0] + 500;
        var tree_height = self.tree_size[this.ego_label][3] - self.tree_size[this.ego_label][2] + 500;
       
        this.context.lineWidth = 5; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.saveCanvas.width, this.saveCanvas.height);
        this.context.save();

        switch(saving_tree[2]){
            case 'low':
                this.save_scale = 0.15;
                break;
            case 'normal':
                // this.save_scale = self.model.get("canvas_scale");
                this.save_scale = 0.5;
                break;
            case 'high':
                this.save_scale = 1;    
        }
        this.saveCanvas.height = tree_height*this.save_scale;
        this.saveCanvas.width = tree_width*this.save_scale;

        this.context.lineWidth = 5; // set the style

        this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.saveCanvas.width, this.saveCanvas.height);
        this.context.save();

        this.context.translate(0.5, 0.5);
        this.context.scale(this.save_scale, this.save_scale);

        var ego = structure[self.view][saving_tree[1]][saving_tree[0]];
        
        var left_side = 0;
        var right_side = 0;
        self.total_layer = ego["left"].length;
        self.stick_length = self.tree_tall/self.total_layer; //_dist
        var layer_total_alter = {"right": [], "left": []};

        this.start_y = this.saveCanvas.height/this.save_scale - (self.tree_size[this.ego_label][3] - self.tree_size[this.ego_label][5]) - 150; // align bottom

        for(var s = 0; s < self.total_layer; s++){
            var l = ego["left"][s]["level"]["down"].length + ego["left"][s]["level"]["up"].length;
            var r = ego["right"][s]["level"]["down"].length + ego["right"][s]["level"]["up"].length;

            layer_total_alter["right"].push(r);
            layer_total_alter["left"].push(l);
            left_side += l;
            right_side += r;
        }
        var total_contact = left_side + right_side;
        var stick_length = 0;
        for(var l = 0; l < layer_total_alter["left"].length; l++){
            var down = ego["left"][l]["level"]["down"].length;
            var up = ego["left"][l]["level"]["up"].length;
            if(stick_length < down && down >= up){
                stick_length = down;
            }
            else if(stick_length < up && down < up){
                stick_length = up;
            }
        }
        
        this.start_x = self.tree_size[this.ego_label][4] - self.tree_size[this.ego_label][0] + 150;

        var ori_dr = right_side*0.65;
        var ori_dl = left_side*0.65;
        var t_scale = (right_side + left_side)/150;
        if(right_side+left_side < 80){
            t_scale = 0.5;
        }
        else{
            if(t_scale < 1){
                t_scale = 1;
            }
        }

        var start_h = 0;
        var add_h = 1;
        var max_h = self.total_layer;
        var mod_layer = Math.floor(8/self.total_layer);
        var layer_slop = Math.round(100/self.total_layer)/10;
        
        // root
        var root_drawing = self.model.get("leaf_switch");
        if("root" in ego){
            total_root = ego["root"][0];
            if(root_drawing == 1)
                self.draw_root(total_root, this.start_y + this.stick_length + 260, this.start_x + (ori_dr/t_scale)*1.5, this.start_x - (ori_dl/t_scale)*1.5, this.context);
        }
        
        this.context.lineWidth = 5; // set the style
        var real_height = 0;
        for(var height = 0; height < self.total_layer; height++){
            this.context.fillStyle = mapping_color.trunk;
            this.context.strokeStyle = mapping_color.trunk;
            this.context.beginPath();
            
            this.dr = (ori_dr/t_scale)*1.5;//1.5;
            this.dl = (ori_dl/t_scale)*1.5;
            
            this.temp_height = 30*height; //_d
            if(real_height == 0){
                this.temp_height = 60;
            }

            this.extra_y = height*8*layer_slop; //control point weight for its torson
            this.extra_x = height*8*layer_slop; //control point (constant)
            this.sub_slop = height*10*layer_slop;
    
            var used_dr = 0;
            var used_dl = 0;
            if((real_height == self.total_layer-1 && layer_total_alter["right"][real_height] == 0) || ori_dr == 0){}

            else
                used_dr = this.draw_right_branch(height, layer_total_alter["right"][real_height], ego["right"][real_height]["level"]);

            // draw left tree
            this.context.fillStyle = mapping_color.trunk;
            this.context.strokeStyle = mapping_color.trunk;
            this.context.beginPath();
            if((real_height == self.total_layer-1 && layer_total_alter["left"][real_height] == 0) || ori_dl == 0){}

            else
                used_dl = this.draw_left_branch(height, layer_total_alter["left"][real_height], ego["left"][real_height]["level"]);

            ori_dr -= used_dr*0.45;
            ori_dl -= used_dl*0.45;
            this.start_y = this.start_y - this.stick_length - this.temp_height;
            
            real_height += 1;
        }
        
        this.context.restore();
        // console.log("finish draw4save");
        // window.location.href = drawing_canvas.save_canvas.toDataURL().replace('image/png','image/octet-stream');
        var pic_url = drawing_canvas.save_canvas.toDataURL().replace('image/png','image/octet-stream');
        self.el_custom_download_link.attr('download', "myctree_" + this.ego_label + ".png");
        self.el_custom_download_link.attr('href', pic_url);
        self.el_custom_download_link[0].click();      
        
    }
});