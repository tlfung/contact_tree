var UploadView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in uploading initialize");
              
        // this.model.bind('change:view_mode', this.change_mode);
        this.final_data_attr_info = {};
        
        this.missing_data = [];
        // this.raw_data = [];
        this.raw_csvfile;
        
        this.step = 0;
        this.session = "";
        this.dataset = "";

        // open the dialog
        $( "#import_dialog" ).dialog({
            autoOpen: false,
            height: 500,
            width: 600,
            modal: true
        });

        $( "#import" ).click(function() {
            $("#import_dialog").dialog( "open" );
            $('#err_report').hide();
            $("#import_button").hide();

            // $("#filename").text("No file chosen");
           
        });

        $("#filename").change(function(e) {
            var ext = $("input#filename").val().split(".").pop().toLowerCase();

            if($.inArray(ext, ["csv"]) == -1) {
                alert('Upload CSV');
                return false;
            }
            else{
                // console.log($("input#filename").val().split("\\").pop().split(".")[0]);
                self.dataset = $("input#filename").val().split("\\").pop().split(".")[0];
            }
                
            if (e.target.files != undefined) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    self.create_table();
                    var csvval = e.target.result.split("\n");
                    // this.raw_data = csvval;
                    // self.convertor_layout(csvval);
                };
                reader.readAsText(e.target.files.item(0));  
            }
            return false;

        });

    },

    create_table:function(){
        var self = this;
        this.step = 0;
        this.final_data_attr_info = {};
        $("#import_button").show();
        $('#err_report').hide();
        $('#err_report').text("")
        this.submit_event();
    },


    submit_event: function(){  
        var self = this;      
        var set_error = function(err){
            var error_text = ""
            for(obj in err){
                if(err[obj].length > 0){
                    if(obj == "default"){
                        error_text += '<b>Default column missing: </b><br>"' + err[obj][0] + '"';
                        for(var i = 1; i < err[obj].length; i ++)
                             error_text += ', "' + err[obj][i] + '"';
                    }
                    if(obj == "missing"){
                        error_text += '<b>Missing value in column: </b><br>"' + err[obj][0][0] + '"';
                        for(var i = 1; i < err[obj].length; i ++)
                             error_text += ', "' + err[obj][i][0] + '"';
                    }
                    if(obj == "intext"){
                        error_text += '<b>Contain text in column: </b><br>"' + err[obj][0] + '"';
                        for(var i = 1; i < err[obj].length; i ++)
                             error_text += ', "' + err[obj][i] + '"';
                    }
                error_text += "<br>"
                }
            }
            return error_text
        };
        var set_db = function(fn){
            self.session = fn;

            var request = fn + ":-" + self.dataset;
            console.log(request);

            d3.json("collecting_data/?collection=" + request, function(result) {
                // alert('success');
                // console.log("wtf");
                console.log(result);
                if(result == self.session + "_" + self.dataset)
                    $("#import_dialog").dialog( "close" );
                else{
                    var report_text = set_error(result);
                    console.log(report_text);
                    $('#err_report').html(report_text);
                }
                $("#filename").removeAttr("disabled");
            });
        };

        $('#import_submit').click(function(){
            $("#import_button").hide();
            $('#err_report').text("Loading...");
            $('#err_report').show();
            
            self.raw_csvfile = new FormData($('#upload_form').get(0));
            $.ajax({
                url: "upload_csv/",
                type: 'POST',
                data: self.raw_csvfile,
                cache: false,
                processData: false,
                contentType: false,
                success: function(data) {
                    set_db(data);
                }
            });    
        });
        /*
        $('#check_submit').click(function(){
            $("#import_button").hide();
            $('#err_report').text("Checking...");
            $('#err_report').show();
            
            self.raw_csvfile = new FormData($('#upload_form').get(0));
            $.ajax({
                url: "upload_csv/",
                type: 'POST',
                data: self.raw_csvfile,
                cache: false,
                processData: false,
                contentType: false,
                success: function(data) {
                    set_db(data);
                }
            });
            
        });
        */

    }


});
