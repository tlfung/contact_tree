window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame   ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            return window.setTimeout(callback, 1000 / 60);
        };
})();

window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame              ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame         ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout;
} )();

var MyApp = function MyApp(){
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;

    var self = this;
    // init models
    this.model = new Tree_Model();
    
    var myCanvas = drawing_canvas.main_canvas;
    myCanvas.height = $(window).height()-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
    myCanvas.width = $("#canvas_container").width();

    window.onresize = function(event) {
        // var myCanvas = drawing_canvas.main_canvas;
        myCanvas.height = $(window).height()-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
        myCanvas.width = $("#canvas_container").width();

        var a_grid = self.model.get("canvas_grid");
        var c_detail = self.model.get("canvas_detail");

        self.model.set({"canvas_height": myCanvas.height});
        self.model.set({"canvas_width": myCanvas.width});
        self.model.trigger('change:canvas_width');
        self.model.set({"canvas_grid": a_grid});

    };

    var arr_grid = self.model.get("canvas_grid");
    var c_detail = self.model.get("canvas_detail");
    for(var x = 0; x <= myCanvas.width/c_detail; x++){
        arr_grid[x] = [];
        initial_grid[x] = [];
        for(var y = 0; y <= myCanvas.height/c_detail; y++){
            arr_grid[x][y] = -1;
            initial_grid[x][y] = -1;
        }
    }
    self.model.set({"canvas_height": myCanvas.height});
    self.model.set({"canvas_width": myCanvas.width});

    self.model.set({"canvas_grid": arr_grid});
    // console.log("grid", self.model.get("canvas_grid"));
    // initialize data selecter
    $("#dataselect").change(function() {
        // default_component = ["stick", "trunk", "branch", "bside", "leaf_color", "leaf_size", "fruit"];
        self.model.set({"moving": 0});
        // console.log("on menu dialog before:", self.model.get("display_egos"));
        self.model.set({"selected_egos": {}});
        self.model.set({"display_egos": {}});
        self.model.set({"canvas_translate": [0, 0]});
        self.model.set({"canvas_scale": 0.15});
        self.model.trigger('change:display_egos');


        if($("#dataselect").val() == "0"){
            self.model.set({"egos_data": {}});
            self.model.set({"view_mode":"0"});
        }
        // others data
        else if($("#dataselect").val() == "DBLP"){
            // default_component.push("root");
            self.model.set({"egos_data": {}});
            self.model.set({"view_mode":"DBLP"});
            self.model.set({"folder": "DBLP"});
            self.model.set({"attr_option": mapping_item["DBLP"]});
            self.model.set({"attribute": default_attribute["DBLP"]});
                      
            var label = document.getElementById("selecting_label");
            label.innerHTML = "DBLP:";
            self.model.trigger('change:attribute');       
            
        }
        else if($("#dataselect").val() == "International"){
            self.model.set({"egos_data": {}});
            self.model.set({"view_mode":"inter"});
            self.model.set({"folder": "inter"});
            
            self.model.set({"attr_option": mapping_item["inter"]});
            self.model.set({"attribute": default_attribute["inter"]});
            
            var label = document.getElementById("selecting_label");
            // self.model.query_country_list($("#dataselect").val());
            label.innerHTML = "international:";
            self.model.trigger('change:attribute');
            self.model.trigger('change:done_query_list');
            
        }
        // Diary
        else{
            // default_component.push("root");
            self.model.set({"view_mode":"diary"});       
            self.model.set({"attr_option": mapping_item["diary"]});
            self.model.set({"folder": $("#dataselect").val()});
            
            self.model.set({"attribute": default_attribute["diary"]});
            /*
            // initial global attribute
            var new_attr = "sex,age,yrknown,feel,howlong,like";
            d3.json("set_attr/?attr=" + new_attr, function(result) {
                console.log("in model.set_attr");
                console.log("=====", result);
            });
            */
            self.model.query_ego_list($("#dataselect").val());
            // var check_table = self.model.get("done_table_loading")
            // if(jQuery.inArray($("#dataselect").val(), check_table) == -1){
            //     self.model.load_data($("#dataselect").val());
            // }
                        
            var label = document.getElementById("selecting_label");
            label.innerHTML = "Diary:";
            self.model.trigger('change:attribute');
            
        }

    });

    // bind with view
    this.importing = new ImportView({model: this.model, containerID: "#importing"});
    this.selecting = new SelectingView({model: this.model, containerID: "#selecting"});
    this.structure = new StructureView({model: this.model, containerID: "#structure"});
    // this.component = new ComponentView({model: this.model, containerID: "#component"});
    this.mapping = new MappingView({model: this.model, containerID: "#mapping"});
    this.render = new RenderingView({model: this.model, containerID: "#rendering"});
    this.labeling = new LabelView({model: this.model, containerID: "#labeling"});
    this.zooming = new ZoomView({model: this.model, containerID: "#zooming"});
    this.styling = new StyleView({model: this.model, containerID: "#styling"});
    this.controling = new ControlView({model: this.model, containerID: "#controling"});

};

MyApp.getInstance = function() {
    var myApp = new MyApp();
    return myApp;
};

// entry point of the whole js application
$(document).ready(function() {
    MyApp.getInstance();

});
