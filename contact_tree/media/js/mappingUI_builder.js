/* testing */
var head_container = $("#mark_group_select");
var UI_builder = {
    binary_cat: function(){     
        var main_container = $('<div id="binary_cat" style="display:none;"></div>');
        var group1 = $('<div class="column left first"></div>');
        var group2 = $('<div class="column left"></div>');
        var list1 = $('<ul id="mapping_group1" class="sortable-list" style="background-color:rgba(33, 178, 239, 0.5);"></ul>');
        var list2 = $('<ul id="mapping_group2" class="sortable-list" style="background-color:rgba(236, 91, 94, 0.5);"></ul>');

        group1.append(list1);
        group2.append(list2);
        main_container.append(group1);
        main_container.append(group2);

        head_container.append(main_container);

        $('#binary_cat .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });

        
    },

    binary_num: function(){    
        var main_container = $('<div id="binary_num" style="display:none;"></div>'); 
        var sep = $('<div class="binary_sep"></div>');
        var sep_title = $('<span id="sep_group" style="position:absolute;"></span>');
        var group_slider = $('<div id="binary_slider" class="binary_group_slider"></div>');
        var range = $('<div style="width:100%; margin-top:10px;"></div>');
        var range_min = $('<span class="left"></span>');
        var range_max = $('<span class="right"></span>');
        
        range_min.html(attr_min);
        range_max.html(attr_max);

        sep.append(sep_title);
        sep.append(group_slider);
        range.append(range_min);
        range.append(range_max);
        main_container.append(sep);
        main_container.append(range);        
    },

    layer_cat: function(){
        var main_container = $('<div id="layer_cat" style="display:none;"></div>'); 
        var group = $('<div class="column left first"></div>');
        var list = $('<ul id="mapping_group" class="sortable-list" style="background-color:rgba(125, 96, 66, 0.7);"></ul>');

        group.append(list);
        main_container.append(group);

        head_container.append(main_container);

        $('#layer_cat .sortable-list').sortable({
            connectWith: '#mark_group_select .sortable-list'
        });
    },

    layer_num: function(){
        var main_container = $('<div id="layer_num" style="display:none;"></div>'); 
        var sep = $('<div id="sep_group" class="left" style="margin:15 0 0 10; position:relative;"></div>');
        var gap = $('<div style="margin-top:5px;"></div>');
        var gap_title = $('<span class="myfont3">Total Layer: </span>');
        var gap_input = $('<select id="sep_gap" style="width:100px"></select>');
        var revert_button = $('<button id="revert_button" class="right">Revert</button>');
        var group_slider = $('<div id="layer_slider" class="left layer_slider"></div>');
        var range = $('<div id="sep_range" class="left layer_range"></div>');
        
        gap.append(gap_title);
        gap.append(gap_input);
        gap.append(revert_button);

        main_container.append(gap);
        main_container.append(range);
        main_container.append(group_slider);
        main_container.append(sep);

        head_container.append(main_container);
    },

    color_cat: function(){
        var main_container = $('<div id="color_cat" style="display:none;"></div>');



        head_container.append(main_container);
    },

    color_num: function(){
        var main_container = $('<div id="color_num" style="display:none;"></div>');

        
        
        head_container.append(main_container);
    },

    size_cat: function(){
        var main_container = $('<div id="size_cat" style="display:none;"></div>');

        
        
        head_container.append(main_container);
    },

    size_num: function(){
        var main_container = $('<div id="size_num" style="display:none;"></div>');

        
        
        head_container.append(main_container);
    }

}

UI_builder.binary_cat();