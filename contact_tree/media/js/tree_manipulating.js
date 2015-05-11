// zooming
var ZoomView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in zooming initialize");

        // set the resolution dialog
        $("#resolution_dialog").dialog({
            autoOpen: false,
            height: 150,
            modal: true,
            resizable: false
        });

        this.myCanvas = drawing_canvas.main_canvas;
        this.snapCanvas = drawing_canvas.snap_canvas;

        this.click = false;
        this.dragStart = null;
        this.dragged = false;
        
        // canvas_scale
        this.scale = 0.15;
        // canvas_translate
        this.translate = [0, 0];
        this.grid = self.model.get("canvas_grid");
        
        this.set_mouse_event();
        this.set_snap_event();
        this.saving_info = [];

        this.el_block_page = $("#block_page");
        this.el_raw_data_table = $("#raw_data_table");
        this.el_information_page = $("#information_page");
        this.el_loading_table = $("#loading_table");
        this.el_info_title = $("#info_title");
        this.el_one_tree = $("#one_tree");
        this.el_main_canvas = $("#c");
        this.el_dtl_leaf_size = $("#dtl_leaf_size");
        this.el_dtl_length = $("#dtl_length");

        // submit the resolution and trigger the drawing buffer
        $("#res_submit").click(function(){
            self.saving_info.push($('.res_checkbox:checked').val());
            $("#resolution_dialog").dialog("close");
            self.model.set({"save_tree": self.saving_info});               
        });
       
    },

    get_grid: function(){
        var self = this;
        self.grid = self.model.get("canvas_grid");
    },

    set_mouse_event: function(){
        var self = this;

        self.myCanvas.addEventListener('mousewheel', function(evt) {
            self.grid = self.model.get("canvas_grid");
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            var leaf_scale = self.model.get("leaf_scale");
            var length_scale = self.model.get("sub_leaf_len_scale");

            var scaleFactor = 1.1;
            var mousePos = self.getMousePos(self.myCanvas, evt);//mousePos.x,mousePos.y
            var tx = (mousePos.x - self.translate[0]) / self.scale;
            var ty = (mousePos.y - self.translate[1]) / self.scale;

            var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? - evt.detail : 0;
           
            var delta_scale = Math.floor(evt.wheelDelta*3*10/100)/10; //for mac
        
            var factor = Math.pow(scaleFactor, delta);
            

            var nx = mousePos.x - (tx * factor * self.scale);
            var ny = mousePos.y - (ty * factor * self.scale);
            leaf_scale -= (delta/3)*0.2;
            length_scale += (delta/3)*0.2;
            
            if(leaf_scale < 1) leaf_scale = 1;
            else if(leaf_scale > 3) leaf_scale = 3;

            if(length_scale < 1) length_scale = 1;
            else if(length_scale > 2) length_scale = 2;

            if(factor*self.scale < 0.03 || factor*self.scale > 3.5){
            }
            else{
                self.model.set({"leaf_scale":leaf_scale}, {silent: true});
                // self.model.trigger('change:leaf_scale');

                self.el_dtl_leaf_size.ionRangeSlider("update", {
                    from: Math.floor(10*leaf_scale)/10
                });
                self.model.set({"sub_leaf_len_scale":length_scale}, {silent: true});

                self.el_dtl_length.ionRangeSlider("update", {
                    from: Math.floor(10*length_scale)/10
                });

                self.model.set({"canvas_translate":[nx, ny]});
                self.model.set({"canvas_scale":factor*self.scale});     
            }
        }, false);

        self.myCanvas.addEventListener('mousemove',function(evt){
            self.grid = self.model.get("canvas_grid");
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            self.model.set({"clicking_leaf":-1});
            // var grid = self.model.get("canvas_grid");
            var c_detail = self.model.get("canvas_detail");
            var mousePos = self.getMousePos(self.myCanvas, evt);
            
            self.el_main_canvas.css("cursor", "");
            if (self.dragStart && Math.abs(mousePos.x-self.dragStart.x)>0.1){
                self.dragged = true;
                // console.log("mousemove");
                mousePos = self.getMousePos(self.myCanvas, evt);
                var tx=self.translate[0]+(mousePos.x-self.dragStart.x);
                var ty=self.translate[1]+(mousePos.y-self.dragStart.y);
                self.model.set({"moving": 1});
                self.model.set({"canvas_translate":[tx, ty]});
                self.model.set({"canvas_scale":self.scale});
                self.model.trigger('change:canvas_scale');
                
                self.dragStart = self.getMousePos(self.myCanvas, evt);//mousePos.x,mousePos.y
            }
            else{
                var point_info = self.grid[Math.floor(mousePos.x/c_detail)][Math.floor(mousePos.y/c_detail)];
                if(point_info != -1){
                    var parse_grid = point_info.split("*+");
                    if(parse_grid.length == 1 || parse_grid[0] == "saveIMG" || parse_grid[0] == "popup" || parse_grid[0] == "root"){
                        self.el_main_canvas.css("cursor", "pointer");
                    }
                    else{ 
                        self.el_main_canvas.css("cursor", "");
                        if(parse_grid[0] == "leaf"){
                            self.model.set({"clicking_leaf":parse_grid[1]});
                            self.writeNote(Math.floor(mousePos.x), Math.floor(mousePos.y), parse_grid[1]);
                        }
                    }
                }
            }

        },false);

        self.myCanvas.addEventListener('mouseup',function(evt){
            self.grid = self.model.get("canvas_grid");
            self.model.set({"moving": 0});
            self.model.trigger('change:canvas_scale');
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            var mousePos = self.getMousePos(self.myCanvas, evt);
            var alter_info = self.model.get("info_table");

            var c_detail = self.model.get("canvas_detail");
            if (!self.dragged && !self.click){
                var point_info = self.grid[Math.floor(mousePos.x/c_detail)][Math.floor(mousePos.y/c_detail)];
                if(point_info != -1){    
                    var parse_grid = point_info.split("*+");                
                    if(parse_grid[0] == "leaf"){
                    }
                    else if(parse_grid[0] == "root"){
                        self.writeNote(Math.floor(mousePos.x), Math.floor(mousePos.y), parse_grid[1]);
                    }
                    else if(parse_grid[0] == "popup"){
                        var table = self.model.get("view_mode");
                        var ego = parse_grid[1].split(":-")[0]
                        var sub = parse_grid[1].split(":-")[1]
                        var attr_map = self.model.get("attribute");
                        self.el_information_page.show();
                        self.el_block_page.show();
                        self.el_raw_data_table.empty();

                        self.model.set({"snapshot": [ego, sub]});
                        self.model.trigger('change:snapshot');
                        
                        self.el_info_title.html("EGO " + ego.toUpperCase() + "(" + sub.toUpperCase() + ")");
                        self.el_loading_table.show();
                        var list_table = function(data){
                            for(var r = 0; r < data.length; r++){
                                var row = $('<tr id="' + data[r][0] + '"></tr>');
                                if(r == 0){
                                    row.attr('style', 'background:rgb(175, 175, 175)');
                                }
                                if(r == 1){
                                    row.attr('style', 'background:rgb(205, 205, 205)');
                                }
                                for(var c = 1; c < data[r].length; c++){
                                    var column = $('<td></td>');
                                    if(r < 2)
                                        column.html("<b>" + data[r][c] + "</b>");
                                    else
                                        column.html(data[r][c]);
                                    row.append(column);
                                }
                                self.el_raw_data_table.append(row);
                            }
                            self.el_loading_table.hide();
                           
                        };
                        
                        var request_url = request_builder.fetch_data(table, ego, sub, attr_map, -100);
                        d3.json(request_url, function(result) {
                            list_table(result);
                        });
                        
                    }
                    else if(parse_grid[0] == "saveIMG"){
                        var table = self.model.get("view_mode");
                        var ego = parse_grid[1].split(":-")[0]
                        var sub = parse_grid[1].split(":-")[1]
                        
                        $( "#resolution_dialog" ).dialog( "open" );
                        self.saving_info = [ego, sub];                        
                    }
                    else{
                        var index = self.grid[Math.floor(mousePos.x/c_detail)][Math.floor(mousePos.y/c_detail)].split("_");
                        self.writeMessage(Math.floor(mousePos.x), Math.floor(mousePos.y), alter_info[index[0]][index[1]]);
                    }
                }
            }
            self.dragStart = null;
        },false);

        self.myCanvas.addEventListener('mousedown', function(evt) {
            self.grid = self.model.get("canvas_grid");
            self.model.set({"moving": 0});
            
            self.dragStart = self.getMousePos(self.myCanvas, evt);//mousePos.x,mousePos.y
            self.dragged = false;
            if(self.dragged){
                self.model.set({"moving": 1});
            }
            // self.model.trigger('change:canvas_scale');
        }, false);

    },

    getMousePos: function(canvas, evt) {
        // var rect = this.myCanvas.getBoundingClientRect();
        var rect = canvas.getBoundingClientRect();
        // console.log("mousePos", rect)
        // console.log("mousePos: ", evt.clientX - rect.left, evt.clientY - rect.top);
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };

    },

    writeMessage: function (px, py, info) {
        var self = this;
        var mode = self.model.get("view_mode");
        var context = self.myCanvas.getContext('2d');
        context.fillStyle = 'rgba(225,225,225, 0.5)';
        
        context.fillRect(px-2, py, 140, 110);
        context.font = '12pt Calibri';
        context.fillStyle = 'black';
        context.fillText("Alter id: " + info[0], px, py+20); //pos
        context.fillText("Total Contacts: " + info[1], px, py+40);
        context.fillText("Fruit Size: " + info[2], px, py+60);
        context.fillText("Branch Layer: " + info[3], px, py+80);
        context.fillText("Sub Side: " + info[4], px, py+100);
    },

    writeNote: function (px, py, info) {
        var self = this;
        var mode = self.model.get("view_mode");
        var context = self.myCanvas.getContext('2d');
        
        context.font = '12pt Calibri';
        context.fillStyle = 'black';
        context.fillText(info, px+15, py+15); //pos
    },

    set_snap_event: function(){
        var self = this;
        self.snapCanvas.addEventListener('mouseup',function(evt){
            var mousePos = self.getMousePos(self.snapCanvas, evt);
            var grid = self.model.get("snap_grid");
            var attr_map = self.model.get("attribute");
            var snap_ego = self.model.get("snapshot");
            var table = self.model.get("view_mode");
            var ego = snap_ego[0];
            var sub = snap_ego[1];

            var snap_point_info = grid[Math.floor(mousePos.x)][Math.floor(mousePos.y)];
            if(snap_point_info != -1){
                var detail = snap_point_info.split("#");
                var g = snap_point_info;
                // 10009#up#r#0
                self.el_raw_data_table.empty();
                self.el_info_title.html("EGO " + ego.toUpperCase() + "(" + sub.toUpperCase() + "):" + detail[0].toUpperCase());
                self.el_loading_table.show();
                var list_table = function(data){                    
                    for(var r = 0; r < data.length; r++){
                        var row = $('<tr id="' + data[r][0] + '"></tr>');
                        if(r == 0){
                            row.attr('style', 'background:rgb(175, 175, 175)');
                        }
                        if(r == 1){
                            row.attr('style', 'background:rgb(205, 205, 205)');
                        }
                        for(var c = 1; c < data[r].length; c++){
                            var column = $('<td></td>');
                            if(r < 2)
                                column.html("<b>" + data[r][c] + "</b>");
                            else
                                column.html(data[r][c]);
                            row.append(column);
                        }
                        self.el_raw_data_table.append(row);
                    }                    
                    self.el_loading_table.hide();
                   
                };
                
                var request_url = request_builder.fetch_data(table, ego, sub, attr_map, detail);
                d3.json(request_url, function(result) {
                    list_table(result);
                });
            }
            else{
                self.el_info_title.html("EGO" + ego + "(" + sub.toUpperCase() + ")");
                self.el_raw_data_table.empty();
                self.el_loading_table.show();
                var list_table = function(data){
                    for(var r = 0; r < data.length; r++){
                        var row = $('<tr id="' + data[r][0] + '"></tr>');
                        if(r == 0){
                            row.attr('style', 'background:rgb(175, 175, 175)');
                        }
                        if(r == 1){
                            row.attr('style', 'background:rgb(205, 205, 205)');
                        }
                        for(var c = 1; c < data[r].length; c++){
                            var column = $('<td></td>');
                            if(r < 2)
                                column.html("<b>" + data[r][c] + "</b>");
                            else
                                column.html(data[r][c]);
                            row.append(column);
                        }
                        self.el_raw_data_table.append(row);
                    }                    
                    self.el_loading_table.hide();
                };
                
                var request_url = request_builder.fetch_data(table, ego, sub, attr_map, -100);
                d3.json(request_url, function(result) {
                    list_table(result);
                });

            }
            
        },false);

        self.snapCanvas.addEventListener('mousemove',function(evt){
            var mousePos = self.getMousePos(self.snapCanvas, evt);
            var grid = self.model.get("snap_grid");
            var snap_point_info = grid[Math.floor(mousePos.x)][Math.floor(mousePos.y)];

            if(snap_point_info != -1){
                self.el_one_tree.css("cursor", "pointer");
            }
            else{
               self.el_one_tree.css("cursor", "");
            }
            
        },false);
    }

});