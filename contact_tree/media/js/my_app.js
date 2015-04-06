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

    $("#block_page").css({'height': h});
    $("#block_page").css({'width': w});  
    $("#help_page").css({'height': h});
    $("#help_page").css({'width': w});

    // if($("#help_slide").height() > h){
    //     $("#help_slide").removeAttr("width");
    //     $("#help_slide").attr("height", "90%");
    // }
};

var MyApp = function MyApp(){
    var self = this;
    session_id = Math.floor(Math.random() * 10000000000000001);

    var cookie = document.cookie.split(';');
    if(document.cookie == ""){
        document.cookie = "session_id=" + session_id.toString() + ";"
    }
    else{
        for(var ca = 0; ca < cookie.length; ca++){
            var cname = cookie[ca].split("=")[0];
            if(cname == "session_id" || cname == " session_id" || cname == "session_id " || cname == " session_id "){
                session_id = cookie[ca].split("=")[1];
                first_use = 1;
            }
            else if(cname == "mode" || cname == " mode" || cname == "mode " || cname == " mode "){
                last_use = cookie[ca].split("=")[1];
            }
        }
        if(first_use == 0){
            document.cookie = "session_id=" + session_id.toString() + ";"
        }
    }

    var current_url = window.location.href;
    if(current_url.search("#share_id=") != -1){
        session_id = current_url.split("#share_id=").pop();
        $("#share_link").attr('href', "#share_id=" + session_id);
        first_use = 1;
    }
    // console.log(session_id, current_url);
    
    // $(window).bind('beforeunload',function(){
    //     return 'are you sure you want to leave?';        
    // });

    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
    // init models
    this.model = new Tree_Model();
    
    var myCanvas = drawing_canvas.main_canvas;
    // var snapCanvas = drawing_canvas.snap_canvas;
    
    myCanvas.height = $(window).height()-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
    myCanvas.width = $("#canvas_container").width();

    $("#canvas_container").css({'height': myCanvas.height});

    $("#block_page").css({'height': $(window).height()});
    $("#block_page").css({'width': $(window).width()});    
    $("#help_page").css({'height': $(window).height()});
    $("#help_page").css({'width': $(window).width()});  

    $("#information_page").css({'height': myCanvas.height+5});
    $("#information_page").css({'width': $(window).width()});
    $("#information_page").css({'top': $("#header").height()+$("#top_list").height()+37});

    drawing_canvas.middle = (myCanvas.width/0.15)/2;
    // self.model.trigger('change:snapshot');
   
    window.onresize = function(event) {
        // var myCanvas = drawing_canvas.main_canvas;
        // $("#canvas_container").css({'width': "101%"});
        myCanvas.height = window.innerHeight-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
        myCanvas.width = $("#canvas_container").width();
        $("#canvas_container").css({'height': myCanvas.height});
        $("#c").css({'height': "100%"});
        $("#c").css({'width': "101%"});
        
        var a_grid = self.model.get("canvas_grid");
        var c_detail = self.model.get("canvas_detail");

        self.model.set({"canvas_height": myCanvas.height});
        self.model.set({"canvas_width": myCanvas.width});
        self.model.trigger('change:canvas_width');
        self.model.set({"canvas_grid": a_grid});
        $("#information_page").css({'height': myCanvas.height+5});
        $("#information_page").css({'width': $(window).width()});
        
        drawing_canvas.middle = (myCanvas.width/0.15)/2;

        resize_dialog(window.innerHeight, $(window).width());

        self.model.trigger('change:snapshot');
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

     $("#share_link").click(function(){ 
        var share_link = window.location.href;
        if(share_link.search("#share_id") == -1)
            share_link = window.location.href + "share_id=" + session_id;
        
        var share_window = prompt("Here is the share link:", share_link);
        window.location.href = share_link;

    });
    
    $("#help_link").click(function(){ 
        $("#help_page").show();
         
        if($("#help_slide").height() > $(window).height()){
            // console.log("ttttt");
            $("#help_slide").removeAttr("width");
            $("#help_slide").attr("height", "90%");
        }  
        $("#help_slide").center();

    });

    $("#slide_next").click(function(){
        var num_slide =  parseInt($('#help_slide').attr('value'));
        if(num_slide < 10){
            $('#help_slide').attr('src', 'media/img/new_help/slide' + (num_slide+1) +'.jpg');
            $("#help_slide").attr('value', (num_slide+1)); 
        }
        return false;
    });

    $("#slide_previous").click(function(){
        var num_slide =  parseInt($('#help_slide').attr('value'));
        if(num_slide > 1){
            $('#help_slide').attr('src', 'media/img/new_help/slide' + (num_slide-1) +'.jpg');
            $("#help_slide").attr('value', (num_slide-1)); 
        }
        return false;
    });

    $("#help_page").click(function(){
        $("#help_page").hide();

        // $("#help_link").css({'z-index': 0});     
    }); 
    $("#help_slide").click(function(){
        return false;
        // $("#help_link").css({'z-index': 0});     
    });

    $("#close_info").click(function(){
        $("#information_page").hide();
        $("#block_page").hide();
        return false;
        // $("#help_link").css({'z-index': 0});     
    });  

    $("#close_info").hover(function(){
        $("#close_info").css({'color': 'rgb(75, 75, 75)'});
        return false;
        // $("#help_link").css({'z-index': 0});     
    });  
    $("#close_info").mouseout(function(){
        $("#close_info").css({'color': 'rgb(105, 105, 105)'});
        return false;
        // $("#help_link").css({'z-index': 0});     
    });

    $("#data_info_box").tabs();



    self.model.set({"canvas_height": myCanvas.height});
    self.model.set({"canvas_width": myCanvas.width});

    self.model.set({"canvas_grid": arr_grid});
    // console.log("grid", self.model.get("canvas_grid"));
    // initialize data selecter

    /*
    var container = document.getElementById("dataselect");
    container.setAttribute("class", "dataset_selector");
    for(var s = 2; s < dataset_mode.length; s++){
        var selection_opt = document.createElement('option');
        selection_opt.value = dataset_mode[s];
        selection_opt.innerHTML = dataset_mode[s];
        selection_opt.setAttribute("class", "myfont3");

        container.appendChild(selection_opt);
    }
    */
    
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
    this.customizing = new CustomizedView({model: this.model, containerID: "#customizing"});    

};

MyApp.getInstance = function() {
    var myApp = new MyApp();
    return myApp;
};

// entry point of the whole js application
$(document).ready(function() {
    MyApp.getInstance();

});
