// styling
var StyleView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in styling initialize");
              
        // this.model.bind('change:view_mode', this.change_mode);
        
        // open the dialog
        $( "#style_dialog" ).dialog({
            autoOpen: false,
            height: 200,
            width: 200,
            modal: true
        });
        $( "#style" ).click(function() {
            $( "#style_dialog" ).dialog( "open" );
           
            $("#style_submit").show();
            $("#style_option").show();
        });

        $("#style_submit").click(function(){
            // self.set_style();
            var s_array = [];
            s_array.push($('.style_selection:checked').val());
            self.model.set({"tree_style":s_array});
            self.model.set({"canvas_translate":[0, 0]});
            self.model.set({"canvas_scale":0.15});
            self.model.trigger('change:canvas_scale');
            
            $( "#style_dialog" ).dialog( "close" );
        });

    }

});
