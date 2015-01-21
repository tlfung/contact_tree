// not use
var myCanvas = canvas.main_canvas;

function createcheckbox() {
    // Insert New Column for Row1 at index '0'.
    var name = "Ego-Person "
    console.log("list", total_ego)
    for (var c=0; c<total_ego.length; c++){
        $("#divTable_menu").append('<div><input class="ego_checkbox" type="checkbox" id="' + total_ego[c] + '" value="' + total_ego[c] +'"><label for="' + total_ego[c] + '">' + name + ' ' + total_ego[c] + '</label></div>');
    }

    $(document).ready(function(){
        myCanvas.width = $("#canvas_container").width();
        myCanvas.height = $(window).height()-$("#header").height()-$("#top_list").height()-$("#footer").height();
        //myCanvas.height = $("#canvas_container").height();
        var select_ego = [];
        $("#submit").click(function(){
            $('.ego_checkbox:checked').each(function(){
                //alert($(this).val());
                select_ego.push($(this).val());
            });
            // drawTree(myCanvas, select_ego, 0.15, 0, 0);
            //draw_multiple(myCanvas, select_ego[i], 0.15, 0, 0);
            // initial_scale();

            $('.ego_checkbox:checked').each(function(i, item){
                this.checked = item.defaultChecked;
            });

            $( "#menu_dialog" ).dialog( "close" );
            select_ego = [];
        });

    });
}

$(function(){//when jquery is loaded
    $( "#menu_dialog" ).dialog({
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true
    });
    $( "#menu" ).click(function() {
        $( "#menu_dialog" ).dialog( "open" );
        //document.getElementById('c').style.visibility='hidden';//'visible';
    });
});