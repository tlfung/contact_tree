// zooming
var ZoomView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in zooming initialize");
        _.bindAll(this, 'get_grid');

        this.model.bind('change:canvas_grid', this.get_grid);

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
       
    },

    get_grid: function(){
        var self = this;
        this.grid = self.model.get("canvas_grid");
    },

    set_mouse_event: function(){
        var self = this;

        self.myCanvas.addEventListener('mousewheel', function(evt) {
            self.model.set({"moving": 1});
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            var leaf_scale = self.model.get("leaf_scale");
            var length_scale = self.model.get("sub_leaf_len_scale");

            var scaleFactor = 1.1;
            var mousePos = self.getMousePos(self.myCanvas, evt);//mousePos.x,mousePos.y
            var tx = (mousePos.x - self.translate[0]) / self.scale;
            var ty = (mousePos.y - self.translate[1]) / self.scale;

            var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? - evt.detail : 0;
            // console.log("delta", Math.round(evt.wheelDelta*10/1000)/10);
            var delta_scale = Math.round(evt.wheelDelta*3*10/100)/10; //for mac
            // var delta_scale = Math.round(evt.wheelDelta*10/1000)/10;
            var factor = Math.pow(scaleFactor, delta);
            // console.log("delta_scale, factor, delta: ", delta_scale, factor, delta);
            
            var nx = mousePos.x - (tx * factor * self.scale);
            var ny = mousePos.y - (ty * factor * self.scale);
            leaf_scale -= (delta/3)*0.2;
            length_scale += (delta/3)*0.2;
            /*
            if(evt.wheelDelta > 0){
                leaf_scale -= 0.2;
                length_scale += 0.2;
            }
            else if(evt.wheelDelta < 0){
                leaf_scale += 0.2;
                length_scale -= 0.2;
            }
            */            
            
            if(leaf_scale < 1) leaf_scale = 1;
            else if(leaf_scale > 3) leaf_scale = 3;

            if(length_scale < 1) length_scale = 1;
            else if(length_scale > 2) length_scale = 2;

            if(factor*self.scale < 0.03 || factor*self.scale > 3.5){
                // alert("This is the smallest size!");
            }
            else{
                // if(delta_scale < 1 && delta_scale > -1){
                    self.model.set({"leaf_scale":leaf_scale});
                    self.model.trigger('change:leaf_scale');
                    $("#dtl_leaf_size").ionRangeSlider("update", {
                        from: Math.round(10*leaf_scale)/10
                    });
                    self.model.set({"sub_leaf_len_scale":length_scale});
                    self.model.trigger('change:sub_leaf_len_scale');
                    $("#dtl_length").ionRangeSlider("update", {
                        from: Math.round(10*length_scale)/10
                    });
                // }
                
                self.model.set({"canvas_translate":[nx, ny]});
                self.model.set({"canvas_scale":factor*self.scale});
            }

        }, false);

        self.myCanvas.addEventListener('mousemove',function(evt){
            // self.model.set({"moving": 0});
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            self.model.set({"clicking_leaf":-1});
            // var grid = self.model.get("canvas_grid");
            var c_detail = self.model.get("canvas_detail");
            var mousePos = self.getMousePos(self.myCanvas, evt);
            // var Pos = self.getMousePos(self.myCanvas, evt);
            // var mes = Pos.x +','+Pos.y;
            // self.writeMessage(self.myCanvas, mes);
            
            
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
                // self.model.set({"moving": 0});
                if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)] != -1){
                    // console.log("Display Info:", self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)]);
                    if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[0] == "leaf"){
                        self.model.set({"clicking_leaf":self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1]});
                        self.writeNote(Math.round(mousePos.x), Math.round(mousePos.y), self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1]);
                    }
                }
            }

        },false);

        self.myCanvas.addEventListener('mouseup',function(evt){
            self.model.set({"moving": 0});
            self.model.trigger('change:canvas_scale');
            self.translate = self.model.get("canvas_translate");
            self.scale = self.model.get("canvas_scale");
            var mousePos = self.getMousePos(self.myCanvas, evt);
            // var grid = self.model.get("canvas_grid");
            var alter_info = self.model.get("info_table");
            //var s = (canvas.width/Math.abs(dragStart.x-mousePos.x))/10
            //console.log("myscale", s)

            var c_detail = self.model.get("canvas_detail");
            if (!self.dragged && !self.click){
                // var tx = (mousePos.x-self.translate[0])/self.scale;
                // var ty = (mousePos.y-self.translate[1])/self.scale;
                // self.model.set({"canvas_translate":[-tx*1.3+self.myCanvas.width/2, -ty*1.3+self.myCanvas.height/2]});
                // self.model.set({"canvas_scale":1.3});
                // self.model.trigger('change:canvas_scale');
                
                // console.log("##########(", mousePos.x, mousePos.y, ")############", self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)]);
                if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)] != -1){
                    // console.log("Display Info:", self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)]);
                    
                    if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[0] == "leaf"){
                        // console.log("-----leaf id:", self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("+").pop());
                        // self.writeNote(Math.round(mousePos.x), Math.round(mousePos.y), self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1]);
                    }
                    else if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[0] == "root"){
                        // console.log("-----leaf id:", self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("+").pop());
                        self.writeNote(Math.round(mousePos.x), Math.round(mousePos.y), self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1]);
                    }
                    else if(self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[0] == "popup"){
                        var table = self.model.get("view_mode");
                        var ego = self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1].split(":-")[0]
                        var sub = self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("*+")[1].split(":-")[1]
                        var attr_map = self.model.get("attribute");
                        $("#information_page").show();
                        $("#block_page").show();
                        self.model.set({"snapshot": [ego, sub]});
                        self.model.trigger('change:snapshot');
                        
                        $("#info_title").html("EGO" + ego + "(" + sub + ")");;
                        var list_table = function(data){
                            // console.log("table:", data);
                            $("#raw_data_table").empty();
                            var table_container = document.getElementById("raw_data_table");
                            for(var r = 0; r < data.length; r++){
                                var row = document.createElement("tr");
                                row.id = data[r][0];
                                if(r == 0){
                                    row.setAttribute('style', 'background:rgb(175, 175, 175)');
                                }
                                if(r == 1){
                                    row.setAttribute('style', 'background:rgb(205, 205, 205)');
                                }
                                for(var c = 1; c < data[r].length; c++){
                                    var column = document.createElement("td");
                                    if(r < 2)
                                        column.innerHTML = "<b>" + data[r][c] + "</b>";
                                    else
                                        column.innerHTML = data[r][c];
                                    row.appendChild(column);
                                }
                                table_container.appendChild(row);
                            }
                           
                        };
                        
                        var request_url = "fetch_data/?ego="+table+":-"+ego+":-"+sub+":="+JSON.stringify(attr_map);
                        
                        d3.json(request_url, function(result) {
                            list_table(result);
                        });
                        
                    }
                    else{
                        var index = self.grid[Math.round(mousePos.x/c_detail)][Math.round(mousePos.y/c_detail)].split("_");
                        self.writeMessage(Math.round(mousePos.x), Math.round(mousePos.y), alter_info[index[0]][index[1]]);
                        self.draw_textbox(mousePos.x, mousePos.y, alter_info[index[0]][index[1]]);
                        // console.log("-----alter id:", alter_info[index[0]][index[1]][0], "--------total contact:", alter_info[index[0]][index[1]][1]);
                    }
                    
                    // console.log("-----alter id:", alter_info[index[0]][index[1]][0], "--------total contact:", alter_info[index[0]][index[1]][1]);
                }
            }
            self.dragStart = null;
        },false);

        self.myCanvas.addEventListener('mousedown', function(evt) {
            self.model.set({"moving": 0});
            
            self.dragStart = self.getMousePos(self.myCanvas, evt);//mousePos.x,mousePos.y
            //drawDetail(getid(), mousePos.x, mousePos.y )
            self.dragged = false;
            if(self.dragged){
                self.model.set({"moving": 1});
            }
            // d3.select("svg").remove();
            self.model.trigger('change:canvas_scale');
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
        if(mode == "DBLP")
            context.fillRect(px-2, py, 185, 110);
        else
            context.fillRect(px-2, py, 135, 110);
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

    // not be used
    draw_textbox: function(px, py, info){
        // var svg = d3.select("body").append("svg:svg")
        //     .attr("width", 200)
        //     .attr("height", 200);
        var svg = d3.select("#canvas_container").append("svg")
            .attr("width", drawing_canvas.main_canvas.width)
            .attr("height", drawing_canvas.main_canvas.height)
            .style("position", "absolute")
            .style("right", 0)
            .style("top", 0)
            .style("z-index", -10)
            .style("opacity", 0);
            // .attr("style", "position:absolute; right:0px; top:0px; opacity: 0; z-index:-10");
            // .attr("x", 0)
            // .attr("y", 0)
            // .attr("z-index", 150);

        // var svg = d3.select("svg")
        //     .attr("width", myCanvas.width)
        //     .attr("height", myCanvas.height);

        var text = svg.append("text")
            .attr("x", px)
            .attr("y", py)
            .style("z-index", 1000)
            .style("color", "black")
            // .style("display", "none")
            // .attr("style", "z-index:150; color:#0B173B")
            // .attr("dy", ".35em")
            // .attr("text-anchor", "middle")
            // .style("font", "100 48px Helvetica Neue")
            .style("background", "black")
            .text(info[0]);

        var bbox = text.node().getBBox();

        // var rect = svg.append("rect")
        //     .attr("x", px)
        //     .attr("y", py)
        //     .attr("width", bbox.width)
        //     .attr("height", bbox.height)
        //     .style("fill", "#ccc")
        //     .style("fill-opacity", ".3")
        //     .style("stroke", "#666")
        //     .style("stroke-width", "1.5px");

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

            // console.log("snap_grid:", grid);
            if(grid[Math.round(mousePos.x)][Math.round(mousePos.y)] != -1){
                // console.log(grid[Math.round(mousePos.x)][Math.round(mousePos.y)])
                var detail = grid[Math.round(mousePos.x)][Math.round(mousePos.y)].split("#");
                // 10009#up#r#0
                $("#info_title").html("EGO" + ego + "(" + sub + "):" + detail[0]);
                var list_table = function(data){
                    // console.log("table:", data);
                    
                    $("#raw_data_table").empty();
                    var table_container = document.getElementById("raw_data_table");
                    for(var r = 0; r < data.length; r++){
                        var row = document.createElement("tr");
                        row.id = data[r][0];
                        if(r == 0){
                            row.setAttribute('style', 'background:rgb(175, 175, 175)');
                        }
                        if(r == 1){
                            row.setAttribute('style', 'background:rgb(205, 205, 205)');
                        }
                        for(var c = 1; c < data[r].length; c++){
                            var column = document.createElement("td");
                            if(r < 2)
                                column.innerHTML = "<b>" + data[r][c] + "</b>";
                            else
                                column.innerHTML = data[r][c];
                            row.appendChild(column);
                        }
                        table_container.appendChild(row);
                    }
                    
                   
                };
                
                var request_url = "fetch_data/?ego="+table+":-"+ego+":-"+sub+":="+JSON.stringify(attr_map)+":="+JSON.stringify(detail);
                
                d3.json(request_url, function(result) {
                    list_table(result);
                });
            }
            else{
                $("#info_title").html("EGO" + ego + "(" + sub + ")");
                var list_table = function(data){
                    // console.log("table:", data);
                    
                    $("#raw_data_table").empty();
                    var table_container = document.getElementById("raw_data_table");
                    for(var r = 0; r < data.length; r++){
                        var row = document.createElement("tr");
                        row.id = data[r][0];
                        if(r == 0){
                            row.setAttribute('style', 'background:rgb(175, 175, 175)');
                        }
                        if(r == 1){
                            row.setAttribute('style', 'background:rgb(205, 205, 205)');
                        }
                        for(var c = 1; c < data[r].length; c++){
                            var column = document.createElement("td");
                            if(r < 2)
                                column.innerHTML = "<b>" + data[r][c] + "</b>";
                            else
                                column.innerHTML = data[r][c];
                            row.appendChild(column);
                        }
                        table_container.appendChild(row);
                    }
                    
                   
                };
                
                var request_url = "fetch_data/?ego="+table+":-"+ego+":-"+sub+":="+JSON.stringify(attr_map);
                
                d3.json(request_url, function(result) {
                    list_table(result);
                });

            }
            /*
            $("#info_title").html("EGO" + ego + "(" + sub + "):");;
            var list_table = function(data){
                // console.log("table:", data);
                $("#raw_data_table").empty();
                var table_container = document.getElementById("raw_data_table");
                for(var r = 0; r < data.length; r++){
                    var row = document.createElement("tr");
                    row.id = data[r][0];
                    if(r == 0){
                        row.setAttribute('style', 'background:rgb(175, 175, 175)');
                    }
                    if(r == 1){
                        row.setAttribute('style', 'background:rgb(205, 205, 205)');
                    }
                    for(var c = 1; c < data[r].length; c++){
                        var column = document.createElement("td");
                        if(r < 2)
                            column.innerHTML = "<b>" + data[r][c] + "</b>";
                        else
                            column.innerHTML = data[r][c];
                        row.appendChild(column);
                    }
                    table_container.appendChild(row);
                }
               
            };
            
            var request_url = "fetch_data/?ego="+table+":-"+ego+":-"+sub+":="+JSON.stringify(attr_map);
            
            d3.json(request_url, function(result) {
                list_table(result);
            });
            */

            
        },false);
    }

});