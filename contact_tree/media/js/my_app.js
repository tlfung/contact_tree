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

// adjust popup window and all the layout when resize the window
function resize_dialog(h, w){
    $( "#import_dialog" ).dialog({
        autoOpen: false,
        height: w*0.5*0.9,
        width: w*0.5,
        modal: true,
        resizable: false
    });
    $( "#sidekey_dialog" ).dialog({
        autoOpen: false,
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

    // set the dialog's container
    var menu_container = (w*0.4*0.7) - 50 - $("#main_title").height() - $("#ego_container").height();
    
    $("#divTable_menu").css({'height': menu_container});
    var sidekey_container = (w*0.7*0.7) - 150 - $("#sidekey_title").height() - $("#attribute_candidate").height() - $("#sidekey_submit_trunk").height() - $("#mark_group").height();
    $("#mark_group_select").css({'max-height': sidekey_container});

    $("#block_page").css({'height': h, 'width': w});
    $("#help_page").css({'height': h, 'width': w});

};

// for general event trigger
function event_setting(){
    var el_slide = $('#help_slide');
    var el_slide_next = $('#slide_next');
    var el_slide_previous = $('#slide_previous');
    var el_data_slide = $('#data_slide');
    var el_help_page = $('#help_page');
    var el_close_info = $("#close_info");

    // for share link
    $("#share_link").click(function(){ 
        var share_link = window.location.href;
        if(share_link.search("#share_id") == -1)
            share_link = window.location.href + "share_id=" + session_id;
        
        var share_window = prompt("Here is the share link:", share_link);
        window.location.href = share_link;

    });
    
    // for help link
    $("#help_link").click(function(){ 
        el_help_page.show();
        el_slide_next.show();
        el_slide_previous.show();
        el_data_slide.hide();
        el_slide.show();
        if(el_slide.height() > $(window).height()){
            el_slide.removeAttr("width");
            el_slide.attr("height", "90%");
        }  
        el_slide.center();

    });

    // for slides
    el_slide_next.click(function(){
        var num_slide =  parseInt(el_slide.attr('value'));
        if(num_slide < 10){
            el_slide.attr('src', 'media/img/new_help/slide' + (num_slide+1) +'.jpg');
            el_slide.attr('value', (num_slide+1)); 
        }
        return false;
    });

    el_slide_previous.click(function(){
        var num_slide =  parseInt(el_slide.attr('value'));
        if(num_slide > 1){
            el_slide.attr('src', 'media/img/new_help/slide' + (num_slide-1) +'.jpg');
            el_slide.attr('value', (num_slide-1)); 
        }
        return false;
    });

    // for dialog help slide
    $("#data_help").click(function(){ 
        el_help_page.show();
        el_slide_next.hide();
        el_slide_previous.hide();
        el_data_slide.show();     
        el_slide.hide();     
        if(el_data_slide.height() > $(window).height()){
            el_data_slide.removeAttr("width");
            el_data_slide.attr("height", "90%");
        }  
        el_data_slide.center();

    });

    el_help_page.click(function(){
        el_help_page.hide();
    }); 

    el_slide.click(function(){
        return false;
    });

    // for snap information
    el_close_info.click(function(){
        $("#information_page").hide();
        $("#block_page").hide();
        return false;
    });  

    el_close_info.hover(function(){
        el_close_info.css({'color': 'rgb(75, 75, 75)'});
        return false;     
    });  
    el_close_info.mouseout(function(){
        el_close_info.css({'color': 'rgb(105, 105, 105)'});
        return false;     
    });

    $("#data_info_box").tabs();
};


var MyApp = function MyApp(){
    var self = this;
    // generate an unique session id for new user
    session_id = Math.floor(Math.random() * 10000000000000001);
    // check cookie information and parse it
    var cookie = document.cookie.split(';');
    if(document.cookie == ""){
        document.cookie = "session_id=" + session_id.toString() + ";"
    }
    else{
        for(var ca = 0; ca < cookie.length; ca++){
            var cname = cookie[ca].split("=")[0];
            // has session id in cookie
            if(cname == "session_id" || cname == " session_id" || cname == "session_id " || cname == " session_id "){
                session_id = cookie[ca].split("=")[1];
                first_use = 1;
            }
            // has last use mode
            else if(cname == "mode" || cname == " mode" || cname == "mode " || cname == " mode "){
                last_use = cookie[ca].split("=")[1];
            }
        }
        if(first_use == 0){
            document.cookie = "session_id=" + session_id.toString() + ";"
        }
    }
  
    // if(session_id == 2184585863724351){
    //     session_id = 3184585863724355;
    //     document.cookie = "session_id=" + session_id.toString() + ";"
    //     first_use = 0;
    //     document.cookie = "mode=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // }
    
    // get the share url
    var current_url = window.location.href;
    if(current_url.search("#share_id=") != -1){
        session_id = current_url.split("#share_id=").pop();
        $("#share_link").attr('href', "#share_id=" + session_id);
        first_use = 1;
    }

    if ( arguments.callee._singletonInstance )
        return arguments.callee._singletonInstance;
    arguments.callee._singletonInstance = this;
    
    // init models
    this.model = new Tree_Model();
    
    // create all the element container
    var el_canvas_container = $("#canvas_container");

    // initial drawing canvas
    var myCanvas = drawing_canvas.main_canvas;

    // set drawing canvas size
    myCanvas.height = $(window).height()-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
    myCanvas.width = $("#canvas_container").width();

    // initial all the page cantainer
    $("#canvas_container").css({'height': myCanvas.height});

    $("#block_page").css({'height': $(window).height()});
    $("#block_page").css({'width': $(window).width()});    
    $("#help_page").css({'height': $(window).height()});
    $("#help_page").css({'width': $(window).width()});  

    $("#information_page").css({'height': myCanvas.height+5});
    $("#information_page").css({'width': $(window).width()});
    $("#information_page").css({'top': $("#header").height()+$("#top_list").height()+37});

    // set the middle position of drawing canvas
    drawing_canvas.middle = (myCanvas.width/0.15)/2;
    // self.model.trigger('change:snapshot');
   
    // adjust when resize
    window.onresize = function(event) {
        var myCanvas = drawing_canvas.main_canvas;
        myCanvas.height = window.innerHeight-$("#header").height()-$("#top_list").height()-$("#footer").height()-$("#history").height()-45;
        myCanvas.width = $("#canvas_container").width();
        $("#canvas_container").css({'height': myCanvas.height});
        $("#c").css({'height': "100%"});
        $("#c").css({'width': "101%"});

        self.model.set({"canvas_height": myCanvas.height});
        self.model.set({"canvas_width": myCanvas.width});
        self.model.trigger('change:canvas_width');

        $("#information_page").css({'height': myCanvas.height+5});
        $("#information_page").css({'width': $(window).width()});
        
        drawing_canvas.middle = (myCanvas.width/0.15)/2;

        resize_dialog(window.innerHeight, $(window).width());

        self.model.trigger('change:snapshot');
    };

    // for general event trigger
    event_setting();

    self.model.set({"canvas_height": myCanvas.height});
    self.model.set({"canvas_width": myCanvas.width});    
        
    // bind with view
    this.uploading = new UploadView({model: this.model, containerID: "#uploading"});
    this.selecting = new SelectingView({model: this.model, containerID: "#selecting"});
    this.mapping = new MappingView({model: this.model, containerID: "#mapping"});
    this.render = new RenderingView({model: this.model, containerID: "#rendering"});
    this.labeling = new LabelView({model: this.model, containerID: "#labeling"});
    this.zooming = new ZoomView({model: this.model, containerID: "#zooming"});
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
