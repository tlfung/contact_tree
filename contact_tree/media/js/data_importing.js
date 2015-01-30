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
        this.data_type = ["Categorical", "Dichotomy", "Ordinal", "Numerical", "identified"];
        this.data_action = ["none", "clean", "fill"];
        this.data_function = ["==", ">=", "<", "[m,M]"];
        this.data_function_name = ["e", "b", "s", "r"];
        this.missing_data = [];
        this.raw_data = [];
        this.raw_csvfile;

        // open the dialog
        $( "#import_dialog" ).dialog({
            autoOpen: false,
            height: 540,
            width: 1100,
            modal: true
        });

        $( "#import" ).click(function() {
            $( "#import_dialog" ).dialog( "open" );
           
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
                    this.raw_data = csvval;
                    self.convertor_layout(csvval);
                };
                reader.readAsText(e.target.files.item(0));
                
            }

            return false;

        });

    },

    convertor_layout: function(data){
        var self = this;
        this.final_data_attr_info = {};
        $("#import_submit").show();
        $("#data_information").show();
        
        this.data_column = data[0].split(",");
        this.data_column.pop(); // need solve problem...
        this.info_array = [];
        this.filter_array = [];
        
        this.missing_data = [];
        for(var j = 0; j < this.data_column.length; j++){
            this.info_array.push([]);
            this.missing_data.push(0);
            // console.log("column>>", this.data_column[j]);
            this.final_data_attr_info[this.data_column[j]] = [0];
            // console.log("column>>>>>", this.final_data_attr_info);
        }
        
        var container = document.getElementById("cnvt_tool");
        $("#cnvt_tool").empty();
        // container.setAttribute("class", "area_selector");
        for(var i = 1; i < data.length; i++){
            var row = data[i].split(",");
            var temp_info = [];
            for(var j = 0; j < this.data_column.length; j++){
                if(row[j] != '' && row[j] != undefined){
                    row[j] = row[j].replace(/\"/g, "");
                    this.info_array[j].push(row[j]);
                }
                    
                else
                    this.missing_data[j] += 1;
            }
        }
        console.log(this.info_array);
        for(var j = 0; j < this.data_column.length; j++){
            distinct_val = this.info_array[j].filter(util.unique);
            // var distinct_val = jQuery.unique( this.info_array[j] )
            this.filter_array.push(distinct_val);
        }
        console.log(this.filter_array);
        
        for(var i = 0; i < this.data_column.length; i+=1){
            // var temp = this.data_column[i];
            // var inputrad = inputrad + "<br>" + temp;    
            $("#cnvt_tool").append('<span class="glyphicon glyphicon-minus-sign left" style="opacity:0.5; margin-top:5px; cursor:pointer;" id="delete_all_' +  this.data_column[i] + '"></span>');            
            
            var column_opt = document.createElement('div');
            column_opt.setAttribute("class", "ui-widget row left");
            column_opt.setAttribute("style", "width:99%; margin-left:auto;");
            // <div class="col-md-6">
            // var column_info = [this.data_column[i], Math.min(this.filter_array[i]), Math.max(this.filter_array[i])];
            var column_info = [this.data_column[i],  Math.min.apply(Math, this.filter_array[i]),  Math.max.apply(Math, this.filter_array[i]), Math.max.apply(Math, this.filter_array[i])-Math.min.apply(Math, this.filter_array[i])];
            if(isNaN(column_info[1]))
                column_info = [this.data_column[i],  this.filter_array[i][0],  this.filter_array[i][1], this.filter_array[i].length];
                // column_info = [this.data_column[i],  this.filter_array[i][0],  this.filter_array[i][1], this.missing_data[i]];
            if(this.filter_array[i].length == 2)
                column_info.push(1);
            else if(this.filter_array[i].length < 15)
                column_info.push(0);
            else if(this.filter_array[i].length > 100)
                column_info.push(4);
            else
                column_info.push(3);

            // console.log(column_info);

            var column_row = document.createElement('div');
            column_row.setAttribute("class", this.data_form[0]);
            // column_row.value = this.data_column[0] + "_" + this.data_survey[0];
            column_row.setAttribute("style", "padding:0 0 0 15;");
            var input_type = document.createElement('input');
            input_type.id = this.data_column[i] + "_" + this.data_survey[0];
            input_type.value = this.data_column[i];
            // input_type.setAttribute("type", "radio");
            // input_type.setAttribute("name", "define_ego_selection");
            input_type.setAttribute("style", "margin:1 0 1 0; width:100%; border-radius:3px;");
            column_row.appendChild(input_type);
            column_opt.appendChild(column_row);

            for(var e = 1; e < 4; e++){ //this.data_survey.length
                var column_row = document.createElement('div');
                column_row.setAttribute("class", this.data_form[e]);
                column_row.value = this.data_column[i] + "_" + this.data_survey[e];
                column_row.id = this.data_column[i] + "_" + this.data_survey[e];
                column_row.innerHTML = column_info[e];
                this.final_data_attr_info[this.data_column[i]].push(column_info[e]);
                if(e == 3)
                    column_row.setAttribute("style", "margin:0 -20 0 15;");
                // column_row.setAttribute("class", "myfont3");
                column_opt.appendChild(column_row);
            }
            for(var e = 4; e < self.data_survey.length; e++){ //this.data_survey.length
                var column_row = document.createElement('div');
                column_row.setAttribute("class", this.data_form[e]);
                // column_row.value = this.data_column[i] + "_" + this.data_survey[e];
                if(e == 4){
                    column_row.setAttribute("style", "padding:0; margin-left:5px");
                    var input_type = document.createElement('select');
                    input_type.id = this.data_column[i] + "_" + this.data_survey[e];
                    input_type.setAttribute("style", "margin-left:10px; width:110%; padding-buttom:5px; border-radius:3px;");
                    input_type.setAttribute("class", "type_selector");
                    for(var t = 0; t < this.data_type.length; t ++){
                        var attr_type = document.createElement('option');
                        attr_type.value = this.data_type[t];
                        attr_type.innerHTML = this.data_type[t];
                        if(column_info[4] == t){
                            this.final_data_attr_info[this.data_column[i]].push(this.data_type[t]);
                            attr_type.setAttribute("selected", true);
                        }                            
                        input_type.appendChild(attr_type);
                    }
                }
                else if(e == 5){
                    var input_type = document.createElement('input');
                    input_type.value = this.data_column[i] + "_" + this.data_survey[e];
                    input_type.type = "radio";
                    input_type.name = "define_ego_selection";
                    input_type.setAttribute("class", "myfont3 define_ego_checkbox");
                    input_type.setAttribute("style", "margin-left:27px;");
                    this.final_data_attr_info[this.data_column[i]].push(0);
                }
                else if(e == 6){
                    column_row.setAttribute("style", "padding:0;");
                    var input_type = document.createElement('input');
                    input_type.id = this.data_column[i] + "_" + this.data_survey[e];
                    input_type.setAttribute("style", "margin:1 0 1 0; width:100%; border-radius:3px;");
                    input_type.setAttribute("class", "relation_input");
                    // this.final_data_attr_info[this.data_column[i]].push(-1);
                    input_type.value = "test"; // need remove
                    this.final_data_attr_info[this.data_column[i]].push("test");
                }
                /*
                else if(e == 7){
                    column_row.setAttribute("style", "padding:0;");
                    var input_type = document.createElement('select');
                    input_type.id = this.data_column[i] + "_" + this.data_survey[e];
                    input_type.setAttribute("style", "margin-left:10px; padding-buttom:5px; border-radius:3px;");
                    input_type.setAttribute("class", "action_selector");
                    for(var t = 0; t < this.data_action.length; t++){
                        var attr_act = document.createElement('option');
                        attr_act.value = t;
                        attr_act.innerHTML = this.data_action[t];
                        input_type.appendChild(attr_act);
                    }
                }
                else if(e == 8){
                    // column_row.setAttribute("style", "padding:0; margin-left:5px");
                    // var input_type = document.createElement('div');
                    for(var t = 1; t < this.data_action.length; t++){
                        var input_type = document.createElement('div');
                        input_type.setAttribute("style", "display:none; width:100%; overflow-x:auto;");
                        input_type.id = this.data_column[i] + "_" + this.data_survey[e] + "_" + this.data_action[t];
                        // input_type.innerHTML = this.data_action[t];
                        if(t == 1){
                            input_type.innerHTML = "Delete if " + this.data_column[i].bold();
                            var action_function = document.createElement('select');
                            action_function.setAttribute("style", "width:50; margin-left:10;");
                            action_function.setAttribute("class", this.data_column[i] + "_clean_func");
                            action_function.id = this.data_column[i] + "_clean_func";
                            for(var f = 0; f < this.data_function.length; f++){
                                var attr_fun = document.createElement('option');
                                attr_fun.value = f;
                                attr_fun.innerHTML = this.data_function[f];
                                action_function.appendChild(attr_fun);
                            }
                            input_type.appendChild(action_function);

                            var action_value = document.createElement('input');
                            action_value.setAttribute("style", "width:50; margin-left:10px;");
                            // action_function.setAttribute("class", this.data_column[i] + "_" + this.data_action[t] + "_func");
                            action_value.id = this.data_column[i] + "_clean_val";
                            input_type.appendChild(action_value);

                            column_row.appendChild(input_type);
                        }
                        else{
                            input_type.innerHTML = "Fill";
                            var action_value = document.createElement('input');
                            action_value.setAttribute("style", "width:50; margin-left:5px;");
                            // action_function.setAttribute("class", this.data_column[i] + "_" + this.data_action[t] + "_func");
                            action_value.id = this.data_column[i] + "_fill_val";
                            input_type.appendChild(action_value);

                            var fill_text = document.createElement('span');
                            fill_text.innerHTML = " if " + this.data_column[i].bold();
                            input_type.appendChild(fill_text);

                            var action_function = document.createElement('select');
                            action_function.setAttribute("style", "width:50; margin-left:10;");
                            action_function.setAttribute("class", this.data_column[i] + "_fill_func");
                            action_function.id = this.data_column[i] + "_fill_func";
                            for(var f = 0; f < this.data_function.length; f++){
                                var attr_fun = document.createElement('option');
                                attr_fun.value = f;
                                attr_fun.innerHTML = this.data_function[f];
                                action_function.appendChild(attr_fun);
                            }
                            input_type.appendChild(action_function);

                            var action_target = document.createElement('input');
                            action_target.setAttribute("style", "width:50; margin-left:10px;");
                            // action_function.setAttribute("class", this.data_column[i] + "_" + this.data_action[t] + "_func");
                            action_target.id = this.data_column[i] + "_fill_targ";
                            input_type.appendChild(action_target);
                        } 

                        var fill_text = document.createElement('span');
                        fill_text.innerHTML = "<br>(Column contains: ";
                        // fill_text.setAttribute("style", "width:50; margin-left:30;");
                        input_type.appendChild(fill_text);
                        var list_attr = document.createElement('select');
                        // list_attr.setAttribute("style", "width:50; margin-left:30;");
                        list_attr.setAttribute("class", this.data_column[i] + "_list");
                        list_attr.id = this.data_column[i] + "_" + this.data_action[t] + "_list_attr";       
                        input_type.appendChild(list_attr);
                        var fill_text = document.createElement('span');
                        fill_text.innerHTML = ")";
                        input_type.appendChild(fill_text);
                        
                        // column_row.appendChild(input_type);
                        
                    }

                }
                */
                column_row.appendChild(input_type);
                column_opt.appendChild(column_row);
            }
            
            container.appendChild(column_opt);
            
        }
        // $("#list_attr").html(inputrad);
        $("#csvimporthinttitle").show();
        // console.log(data);
        this.action_event();
        this.submit_event();
    },

    action_event: function(){
        var self = this;
        $(".action_selector").change(function(){
            var on_action = "#" + this.id;
            var col_name = this.id.split("_")[0];
            var on_missing = "#" + col_name + "_missing";
            // console.log(on_action);
            var set_act = "";
            if($(on_action).val() == "0"){
                $("#"+col_name+"_change_clean").hide();
                $("#"+col_name+"_change_fill").hide();
                // console.log(self.data_action[0]);
            }
            else{
                if($(on_action).val() == "1"){
                    set_act = "_clean";
                    $(on_missing).text("0000");
                    $("#"+col_name+"_change_clean").show();
                    $("#"+col_name+"_change_fill").hide();
                    $("#"+col_name+"_clean_func").show();
                    // console.log(self.data_action[1]);
                }
                else if($(on_action).val() == "2"){
                    set_act = "_fill";
                    $(on_missing).text("1111");
                    $("#"+col_name+"_change_clean").hide();
                    $("#"+col_name+"_change_fill").val();
                    // console.log(self.data_action[2]);
                }
                var column_idx = self.data_column.indexOf(col_name);
                console.log("...", column_idx, col_name);
                $("#"+ col_name + set_act + "_list_attr").empty();
                var container = document.getElementById(col_name + set_act + "_list_attr");
                // $("."+ col_name + "_list").empty();
                // var container = document.getElementsByClassName(col_name + "_list");
                for(var c = 0; c < self.filter_array[column_idx].length; c += 1){
                    if(c > 14){
                        var c_val = document.createElement('option');
                        c_val.value = c;
                        c_val.innerHTML = "etc.";
                        container.appendChild(c_val);
                        break;
                    }
                    var c_val = document.createElement('option');
                    c_val.value = c;
                    c_val.innerHTML = self.filter_array[column_idx][c];
                    container.appendChild(c_val);
                }
            }
            
        });

        $(".type_selector").change(function(){
            var on_action = "#" + this.id;
            var col_name = this.id.split("_type")[0];
            self.final_data_attr_info[col_name][4] = $(on_action).val();
            self.check_survey();
        });

        $(".relation_input").change(function(){
            var on_relation = "#" + this.id;
            var col_name = this.id.split("_relation")[0];
           
            self.final_data_attr_info[col_name][6] = $(on_relation).val();
            self.check_survey();
        });

        $('.define_ego_checkbox').change(function() {
            var checked_ego = $('.define_ego_checkbox:checked').val().split("_ego")[0];
           
            for(attr_column in self.final_data_attr_info){
                if(self.final_data_attr_info[attr_column][5] == 1){
                    self.final_data_attr_info[attr_column][5] = 0;
                }
            }
            
            self.final_data_attr_info[checked_ego][5] = 1;
            self.check_survey();
        });

        $("#database_table").change(function(){
            self.check_survey();
        });

        // need to add control delete column event

        self.check_survey();
    },

    check_survey:function(){
        var self = this;
        var check_complete = 0;
        // console.log("++++++", this.final_data_attr_info);
        var table_name = $("#database_table").val();
        // var request = table_name + ":-";
        
        for(attr_column in this.final_data_attr_info){
            if(this.final_data_attr_info[attr_column][5] == 1)
                check_complete ++;

            if(this.final_data_attr_info[attr_column][6] != -1 && this.final_data_attr_info[attr_column][6] != "")
                check_complete ++;
            else
                break;
                
        }
        
        if(table_name != ""){
            if(check_complete == self.data_column.length + 1){
                // var json_data = JSON.stringify(self.final_data_attr_info);
                // request += json_data;
                $('#import_submit').removeAttr("disabled");
                // console.log("!!!", check_complete);
                
            }
            
        }
        else{
            // console.log("???", check_complete);
            return            
        }
    },

    submit_event: function(){  
        var self = this;      
        var set_db = function(fn){
            var table_name = $("#database_table").val();
            var json_data = JSON.stringify(self.final_data_attr_info);
            var request = table_name + ":-" + fn + ":-" + json_data;
            
            console.log(request);
            d3.json("data_collection/?collection=" + request, function(result) {
                alert('success');
                console.log(result);                                  
            });
        };
        $('#import_submit').click(function(){
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
