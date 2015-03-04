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


function resize_dialog(h, w){
    $( "#import_dialog" ).dialog({
        autoOpen: false,
        // height: 600,
        // width: 600,
        height: w*0.5*0.9,
        width: w*0.5,
        modal: true,
        resizable: false
    });
    $( "#sidekey_dialog" ).dialog({
        autoOpen: false,
        // height: 600,
        // width: 800,
        height: w*0.7*0.7,
        width: w*0.7,
        modal: true,
        resizable: false
    });
    $( "#menu_dialog" ).dialog({
        autoOpen: false,
        height: w*0.4*0.7,
        width: w*0.4,
        modal: true,
        resizable: false
    });

    var menu_container = (w*0.4*0.7) - 50 - $("#main_title").height() - $("#ego_container").height();
    
    $("#divTable_menu").css({'height': menu_container});
    // $(".myfont3").css({'font-size': 18*w/1260});
    var sidekey_container = (w*0.7*0.7) - 150 - $("#sidekey_title").height() - $("#attribute_candidate").height() - $("#sidekey_submit_trunk").height() - $("#mark_group").height();
    // var sidekey_container = (w*0.7*0.7) - 200
    // $("#sidekey_operation").css({'max-height': sidekey_container});   
    $("#mark_group_select").css({'max-height': sidekey_container}); 
    
};

var MyApp = function MyApp(){
    var self = this;
    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
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
        resize_dialog($(window).height(), $(window).width());
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

    var container = document.getElementById("dataselect");
    container.setAttribute("class", "dataset_selector");
    for(var s = 2; s < dataset_mode.length; s++){
        var selection_opt = document.createElement('option');
        selection_opt.value = dataset_mode[s];
        selection_opt.innerHTML = dataset_mode[s];
        selection_opt.setAttribute("class", "myfont3");

        container.appendChild(selection_opt);
    }
    
    // bind with view
    // this.importing = new ImportView({model: this.model, containerID: "#importing"});
    this.uploading = new UploadView({model: this.model, containerID: "#uploading"});
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
