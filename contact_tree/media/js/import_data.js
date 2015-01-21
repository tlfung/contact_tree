var ImportView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in importing initialize");
              
        // this.model.bind('change:view_mode', this.change_mode);
        
        // open the dialog
        $( "#import_dialog" ).dialog({
            autoOpen: false,
            height: 400,
            width: 500,
            modal: true
        });

        $( "#import" ).click(function() {
            $( "#import_dialog" ).dialog( "open" );
           
            $("#style_submit").show();
            $("#style_option").show();
        });

        $("#filename").change(function(e) {
            var ext = $("input#filename").val().split(".").pop().toLowerCase();

            if($.inArray(ext, ["csv"]) == -1) {
                alert('Upload CSV');
                return false;
            }
                
            if (e.target.files != undefined) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    var csvval = e.target.result.split("\n");
                    var csvvalue = csvval[0].split(",");
                    var inputrad=csvvalue[0];
                    for(var i = 1; i < csvvalue.length; i++){
                        var temp = csvvalue[i];
                        var inputrad = inputrad + "<br>" + temp;
                    }
                    $("#ori_data").html(inputrad);
                    $("#csvimporthinttitle").show();
                };
                reader.readAsText(e.target.files.item(0));

            }

            return false;

        });

    }

});
