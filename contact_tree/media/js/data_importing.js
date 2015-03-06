// not use
var ImportView = Backbone.View.extend({
    
    initialize: function(args) {
        var self = this;
        this.containerID = args.containerID;
        // bind view with model
        console.log("in importing initialize");
              
        // this.model.bind('change:view_mode', this.change_mode);
        this.final_data_attr_info = {};
        this.data_column = [];
        this.info_array = [];
        this.filter_array = [];
        // this.data_survey = ["column", "min", "max", "missing", "type", "ego", "relation", "action", "change"];
        this.data_survey = ["column", "min", "max", "Range", "type", "ego", "relation"];
        // this.data_form = ["col-md-1", "col-md-1", "col-md-1", "col-md-1", "col-md-1", "col-md-1", "col-md-1", "col-md-1", "col-md-4"];
        this.data_form = ["col-md-2", "col-md-2", "col-md-2", "col-md-1", "col-md-2", "col-md-1", "col-md-2"];
        this.data_type = ["Categorical", "Dichotomy", "Ordinal", "Numerical", "Identified"];
        this.data_action = ["none", "clean", "fill"];
        this.data_function = ["==", ">=", "<", "[m,M]"];
        this.data_function_name = ["e", "b", "s", "r"];
        this.missing_data = [];
        // this.raw_data = [];
        this.raw_csvfile;
        this.relation_opt = ["none"];
        this.selected_ego = "";
        this.selected_relation = {};
        this.step = 0;
        this.session = "";

        // open the dialog
        $( "#import_dialog" ).dialog({
            autoOpen: false,
            height: 540,
            width: 1100,
            modal: true
        });

        $( "#import" ).click(function() {
            $("#cnvt_tool").empty();
            $("#database_table").val("");
            $("#import_submit").hide();
            $("#data_information").hide();
            $("#import_dialog").dialog( "open" );
            // $("#filename").text("No file chosen");
           
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
        this.relation_opt = ["none"];
        this.selected_ego = "";
        this.selected_relation = {};
        $("#import_submit").show();
        $("#import_submit").text("Next");
        $("#database_table").removeAttr("disabled");
        $("#database_table").val("");
        $("#data_information").hide();
        this.submit_event();
        $("#database_table").change(function(){
            var table_name = $("#database_table").val();
            // var request = table_name + ":-";
            if(table_name != ""){
                // $("#data_information").show();
                $('#import_submit').removeAttr("disabled");
            }
        });
    },

    convertor_layout: function(data){
        var self = this;
        $("#data_information").show();
        this.data_column = [];
        var container = document.getElementById("cnvt_tool");
        $("#cnvt_tool").empty();

        for(column_name in data){
            // var column_name = c;
            self.data_column.push(column_name);
            $("#cnvt_tool").append('<span class="glyphicon glyphicon-minus-sign left" style="opacity:0.5; margin-top:5px; cursor:pointer;" id="delete_all_' +  column_name + '"></span>');            
            this.final_data_attr_info[column_name] = [0];
            self.selected_relation[column_name] = "";
            var column_opt = document.createElement('div');
            column_opt.setAttribute("class", "ui-widget row left");
            column_opt.setAttribute("style", "width:99%; margin-left:auto;");
            var column_info = [column_name,  data[column_name][0],  data[column_name][1], data[column_name][2]];
            
            if(data[column_name][2] == 2)
                column_info.push(1);
            else if(data[column_name][2] < 15)
                column_info.push(0);
            else if(data[column_name][2] > 100){
                column_info.push(4);
                self.relation_opt.push(column_name)
            }
            else
                column_info.push(3);

            var column_row = document.createElement('div');
            column_row.setAttribute("class", this.data_form[0]);
            // column_row.value = this.data_column[0] + "_" + this.data_survey[0];
            column_row.setAttribute("style", "padding:0 0 0 15;");
            var input_type = document.createElement('input');
            input_type.id = column_name + "_" + this.data_survey[0];
            input_type.value = column_name;
            // input_type.setAttribute("type", "radio");
            // input_type.setAttribute("name", "define_ego_selection");
            input_type.setAttribute("style", "margin:1 0 1 0; width:100%; border-radius:3px;");
            column_row.appendChild(input_type);
            column_opt.appendChild(column_row);

            for(var e = 1; e < 4; e++){ //this.data_survey.length
                var column_row = document.createElement('div');
                column_row.setAttribute("class", this.data_form[e]);
                column_row.value = column_name + "_" + this.data_survey[e];
                column_row.id = column_name + "_" + this.data_survey[e];
                column_row.innerHTML = column_info[e];
                this.final_data_attr_info[column_name].push(column_info[e]);
                if(e == 3)
                    column_row.setAttribute("style", "margin:0 -20 0 15;");
                // column_row.setAttribute("class", "myfont3");
                column_opt.appendChild(column_row);
            }

            for(var e = 4; e < self.data_survey.length; e++){ //this.data_survey.length
                var column_row = document.createElement('div');
                column_row.setAttribute("class", this.data_form[e]);
                
                if(e == 4){ // data type
                    column_row.setAttribute("style", "padding:0; margin-left:5px");
                    var input_type = document.createElement('select');
                    input_type.id = column_name + "_" + this.data_survey[e];
                    input_type.setAttribute("style", "margin-left:10px; width:110%; padding-buttom:5px; border-radius:3px;");
                    input_type.setAttribute("class", "type_selector");
                    for(var t = 0; t < this.data_type.length; t ++){
                        var attr_type = document.createElement('option');
                        attr_type.value = this.data_type[t];
                        attr_type.innerHTML = this.data_type[t];
                        if(column_info[4] == t){
                            this.final_data_attr_info[column_name].push(this.data_type[t]);
                            attr_type.setAttribute("selected", true);
                        }                            
                        input_type.appendChild(attr_type);
                    }
                }
                else if(e == 5){ // mark ego
                    var input_type = document.createElement('input');
                    input_type.value = column_name + "_" + this.data_survey[e];
                    input_type.type = "radio";
                    input_type.name = "define_ego_selection";
                    input_type.setAttribute("class", "myfont3 define_ego_checkbox");
                    input_type.setAttribute("style", "margin-left:27px;");
                    this.final_data_attr_info[column_name].push(0);
                }
                else if(e == 6){ // set relationship
                    column_row.setAttribute("style", "padding:0;");
                    var input_type = document.createElement('select');
                    input_type.id = column_name + "_" + this.data_survey[e];
                    input_type.setAttribute("style", "margin-left:10px; width:100%; padding-buttom:5px; border-radius:3px;");
                    input_type.setAttribute("class", "relation_selector");
                }
                column_row.appendChild(input_type);
                column_opt.appendChild(column_row);
            }
            container.appendChild(column_opt); 
        }
        this.set_relationship();
        // console.log(data);
        this.action_event();
        // this.submit_event();
                
    },

    set_relationship: function(){
        var self = this;
        for(var i = 0; i < this.data_column.length; i+=1){
            var container = document.getElementById(this.data_column[i] + "_relation");
            $("#"+ this.data_column[i] + "_relation").empty();
            if(self.selected_ego != ""){
                // this.selected_relation[this.data_column[i]] = self.selected_ego;
                var attr_type = document.createElement('option');
                attr_type.value = self.selected_ego;
                attr_type.innerHTML = self.selected_ego;
                attr_type.id = this.data_column[i] + "_relate_" + self.selected_ego;
                container.appendChild(attr_type);
            }
            
            for(var t = 0; t < this.relation_opt.length; t++){
                var attr_type = document.createElement('option');
                attr_type.value = this.relation_opt[t];
                attr_type.id = this.data_column[i] + "_relate_" + this.relation_opt[t];
                attr_type.innerHTML = this.relation_opt[t];
                container.appendChild(attr_type);
            }

            if(this.selected_relation[this.data_column[i]] != ""){
                var opt = document.getElementById(this.data_column[i] + "_relate_" + this.selected_relation[this.data_column[i]]);
                opt.setAttribute("selected", true);
            }
            
        }
        
    },

    action_event: function(){
        var self = this;
        $(".type_selector").change(function(){
            var on_action = "#" + this.id;
            var col_name = this.id.split("_type")[0];
            self.final_data_attr_info[col_name][4] = $(on_action).val();
            if(self.final_data_attr_info[col_name][4] == "Identified"){
                self.relation_opt.push(col_name);
            }
            else{
                self.relation_opt.splice(self.relation_opt.indexOf(col_name), 1);
            }
            self.set_relationship();
            // self.check_survey();
        });

        $(".relation_selector").change(function(){
            var on_action = "#" + this.id;
            var col_name = this.id.split("_relation")[0];
            // self.final_data_attr_info[col_name][6] = $(on_action).val();
            self.selected_relation[col_name] = $(on_action).val();
            self.set_relationship();
            // self.check_survey();
        });

        $('.define_ego_checkbox').change(function() {
            var checked_ego = $('.define_ego_checkbox:checked').val().split("_ego")[0];
            var last_ego = "";
            for(attr_column in self.final_data_attr_info){
                if(self.final_data_attr_info[attr_column][5] == 1){
                    self.final_data_attr_info[attr_column][5] = 0;
                    last_ego = attr_column;
                }
            }
            for(var a = 0; a < self.data_column.length; a++){
                if(self.selected_relation[self.data_column[a]] == last_ego || self.selected_relation[self.data_column[a]] == ""){
                    self.selected_relation[self.data_column[a]] = checked_ego;
                }
            }
            self.final_data_attr_info[checked_ego][5] = 1;
            self.selected_ego = checked_ego;
            $('#import_submit').removeAttr("disabled");
            self.set_relationship();
        });

        // need to add control delete column event

    },

    submit_event: function(){  
        var self = this;      
        var set_db = function(fn){
            var table_name = $("#database_table").val();
            self.session = fn;
            var request = fn + ":-" + table_name;
            console.log(request);

            d3.json("collecting_data/?collection=" + request, function(result) {
                // alert('success');
                // console.log("wtf");
                console.log(result);
                self.step = 1;
                self.convertor_layout(result);
                $('#import_submit').text("Done");
            });
        };
        $('#import_submit').click(function(){
            if(self.step == 0){
                $("#database_table").attr("disabled", true);
                $('#import_submit').attr("disabled", true);
                $('#import_submit').text("loading");

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
            }
            else{
                var table = $("#database_table").val();
                // var table = self.session + "_" + $("#database_table").val();
                for(attr_column in self.final_data_attr_info){
                    self.final_data_attr_info[attr_column][6] = $("#" + attr_column + "_relation").val();
                    self.final_data_attr_info[attr_column].push($("#" + attr_column + "_column").val());
                }
                var json_data = JSON.stringify(self.final_data_attr_info);
                var request = table + ":-" + json_data;
                d3.json("update_collection/?update=" + request, function(result) {
                    console.log(result);
                    $( "#import_dialog" ).dialog( "close" );
                });


            }
            
        });

    }


});
