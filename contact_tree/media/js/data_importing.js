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
            height: 530,
            width: 750,
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
                    self.analyzing_attribute(csvval);
                };
                reader.readAsText(e.target.files.item(0));

            }

            return false;

        });

    },

    analyzing_attribute: function(data){
        var self = this;
        $("#raw_data").show();
        $("#data_cnvt").show();
        // $("#sub_selection").append('<label><input class="myfont3 sub_option" type="checkbox" name="select_option" value="' + ego_time[s] + '" id="' + ego_time[s] + '" checked>' + ego_time[s] + '</label>');            
        var data_column = data[0].split(",");
        var info_array = [];
        var filter_array = [];
        for(var j = 0; j < data_column.length; j++){
            info_array.push([]);
        }
        // var inputrad = data_column[0];
        var container = document.getElementById("list_attr");
        // container.setAttribute("class", "area_selector");
        for(var i = 1; i < data.length; i++){
            var row = data[i].split(",");
            var temp_info = [];
            for(var j = 0; j < data_column.length; j++){
                info_array[j].push(row[j]);
            }
        }
        console.log(info_array);
        for(var j = 0; j < data_column.length; j++){
            distinct_val = info_array[j].filter(util.unique);
            // var distinct_val = jQuery.unique( info_array[j] )
            filter_array.push(distinct_val);
        }
        console.log(filter_array);
        
        for(var i = 0; i < data_column.length; i++){
            // var temp = data_column[i];
            // var inputrad = inputrad + "<br>" + temp;
            var column_opt = document.createElement('div');
            column_opt.value = data_column[i];
            column_opt.innerHTML = data_column[i];
            column_opt.setAttribute("class", "myfont3");
            
            container.appendChild(column_opt);
            
        }
        // $("#list_attr").html(inputrad);
        $("#csvimporthinttitle").show();
        // console.log(data);
    }

});
