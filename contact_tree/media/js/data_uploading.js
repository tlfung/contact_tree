var UploadView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in uploading initialize");
              
        this.final_data_attr_info = {};
        
        this.missing_data = [];
        this.raw_csvfile;
        
        this.step = 0;
        this.session = "";
        this.dataset = "";

        // open the dialog
        $( "#import_dialog" ).dialog({
            autoOpen: false,
            // height: 600,
            // width: 600,
            height: $(window).width()*0.5*0.9,
            width: $(window).width()*0.5,
            modal: true,
            resizable: false
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
                self.dataset = $("input#filename").val().split("\\").pop().split(".")[0];
            }
                
            if (e.target.files != undefined) {
                var reader = new FileReader();
                reader.onload = function(e) {
                    self.create_table();
                    var csvval = e.target.result.split("\n");
                };
                reader.readAsText(e.target.files.item(0));  
            }
            return false;

        });

        // initial all the upload event
        this.submit_event();

    },

    create_table:function(){
        var self = this;
        this.step = 0;
        this.final_data_attr_info = {};
        $("#import_button").show();
        $('#err_report').hide();
        $('#err_report').text("")
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
                    
                    if(obj == "insert_error"){
                        error_text += 'Type and value not match...<br>';
                    }
                    if(obj == "inbool"){
                        error_text += '<b>Boolean type has more than two values:</b><br>"' + err[obj][0] + '"';
                        for(var i = 1; i < err[obj].length; i ++)
                             error_text += ', "' + err[obj][i] + '"';
                    }
                    if(obj == "lackofdata"){
                        error_text += 'Lack of useful attrubutes...<br>';
                    }
                    
                error_text += "<br>"
                }
            }
            return error_text
        };
        // check the data format
        var set_db = function(fn){
            self.session = fn;

            var request = fn + ":-" + self.dataset;
            var all_mode = self.model.get("dataset_mode");
            console.log(request);
            $("#loading_process").html("<b>Analyzing...</b>");
            d3.json("collecting_data/?collection=" + request, function(result) {
                console.log(result);
                // in correct format
                if(result == self.dataset){
                    var container = document.getElementById("dataselect");
                    container.setAttribute("class", "dataset_selector");
                    
                    var selection_opt = document.createElement('option');
                    // selection_opt.value = result;
                    selection_opt.value = session_id + "_of_" + self.dataset;
                    selection_opt.innerHTML = self.dataset;
                    selection_opt.setAttribute("class", "myfont3");
                    // add dataset into available dataset selection
                    container.appendChild(selection_opt);
                    all_mode.push(self.dataset);
                    self.model.set({"dataset_mode": all_mode});  
                    // dataset_mode.push(result);
                    $("#block_page").hide();
                    $("#import_dialog").dialog( "close" );
                    
                }
                // set the error format
                else{
                    var report_text = set_error(result);
                    // console.log(report_text);
                    $('#err_report').html(report_text);
                    $('#err_report').show();
                    $("#block_page").hide();
                }
                $("#filename").removeAttr("disabled");

            });
            
        };

        $('#import_submit').click(function(){
            $("#import_button").hide();
            $("#block_page").show();
            $("#loading_process").html("<b>Loading...</b>");
            // upload the file
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

    }


});
