var request_builder = {
    collecting_data: function(request){
        var return_request = "collecting_data/?collection=" + encodeURIComponent(request);
        return return_request;
    },

    get_update: function(attr, ego, mode, attribute_mapping, group, sub_ego){
        var request_array = [];
        request_array.push(JSON.stringify(attr));
        request_array.push(ego);
        request_array.push(mode);
        request_array.push(JSON.stringify(attribute_mapping));
        request_array.push(group);
        request_array.push(JSON.stringify(sub_ego));
        var request = JSON.stringify(request_array);
        var return_request = "get_update/?contact=" + encodeURIComponent(request);
        return return_request;
    },

    dataset: function(data_selected){ // to see how nuch group of this dataset
        var return_request = "dataset/?data=" + encodeURIComponent(data_selected);
        return return_request;
    },

    datatable: function(table, group){
        var request_array = [];
        request_array.push(table);
        request_array.push(group);
        var request = JSON.stringify(request_array);
        var return_request = "datatable/?table="+encodeURIComponent(request);
        return return_request;
    },

    dataset_mode: function(session_id){
        var return_request = "dataset_mode/?mode=" + encodeURIComponent(session_id);
        return return_request;
    },

    update_binary: function(group, attr, update_info){
        var request = group + ":-" + JSON.stringify(attr) + ":-" + update_info;
        var return_request = "update_binary/?update=" + encodeURIComponent(request);
        return return_request;
    },

    update_layer: function(group, attr, update_info){
        var request = group + ":-" + JSON.stringify(attr) + ":-" + update_info;
        var return_request = "update_layer/?update=" + encodeURIComponent(request);
        return return_request;
    },

    update_highlight: function(group, attr, update_info){
        var request = group + ":-" + JSON.stringify(attr) + ":-" + update_info;
        var return_request = "update_highlight/?update=" + encodeURIComponent(request);
        return return_request;
    },

    fetch_data: function(table, ego, sub, attr, detail){
        var request = table + ":-" + ego + ":-" + sub + ":=" + JSON.stringify(attr);
        if(detail != -100)
            request += ":=" + JSON.stringify(detail);
        var return_request = "fetch_data/?ego=" + encodeURIComponent(request);
        return return_request;
    },

    restore_data: function(attr, ego_list, mode, attr_map, group, selected_ego){
        var request_array = [];
        request_array.push(JSON.stringify(attr));
        request_array.push(JSON.stringify(ego_list));
        request_array.push(mode);
        request_array.push(JSON.stringify(attr_map));
        request_array.push(group);
        request_array.push(JSON.stringify(selected_ego));
        var request = JSON.stringify(request_array);
        var return_request = "restore_data/?restore=" + encodeURIComponent(request);
        return return_request;
    },

    last_use_data: function(attr, ego_list, mode, attr_map, group, selected_ego){
        var request_array = [];
        request_array.push(JSON.stringify(attr));
        request_array.push(JSON.stringify(ego_list));
        request_array.push(mode);
        request_array.push(JSON.stringify(attr_map));
        request_array.push(group);
        request_array.push(JSON.stringify(selected_ego));
        var request = JSON.stringify(request_array);
        // var request = JSON.stringify(now_attr) + ":-" + JSON.stringify(ego_list) + ":-" + now_mode + ":-" + JSON.stringify(attribute_mapping) + ":-" + data_group + ":-" + JSON.stringify(all_ego);
        var return_request = "last_use_data/?restore=" + encodeURIComponent(request);
        return return_request;
    },

    auto_save: function(save_array){
        var request = JSON.stringify(save_array);
        var return_request = "auto_save/?save=" + encodeURIComponent(request);
        return return_request;
    },

    save_mapping: function(mode, save_mapping, name, group){
        var request_array = [];
        request_array.push(mode);
        request_array.push(JSON.stringify(save_mapping));
        request_array.push(name);
        request_array.push(group);
        var request = JSON.stringify(request_array);
        var return_request = "save_mapping/?save=" + encodeURIComponent(request);
        return return_request;
    },

    get_user_data: function(session_id, last_use){
        var request = session_id + ":-" + last_use;
        var return_request = "get_user_data/?user=" + encodeURIComponent(request);
        return return_request;
    },

    restore_user_mapping: function(mode, group){
        var request = mode + "_of_" + group;
        var return_request = "restore_user_mapping/?user=" + encodeURIComponent(request);
        return return_request;
    },

    restore_user_history: function(data_selected){
        var request = data_selected;
        var return_request = "restore_user_history/?user=" + encodeURIComponent(request);
        return return_request;
    },

    restore_user_group_history: function(data_selected, data_group){
        var request = data_selected + "_of_" + data_group;
        var return_request = "restore_user_group_history/?user=" + encodeURIComponent(request);
        return return_request;
    },

    del_mapping: function(mode, name, group){
        var request_array = [];
        request_array.push(mode);
        request_array.push(name);
        request_array.push(group);
        var request = JSON.stringify(request_array);
        var return_request = "del_mapping/?save=" + encodeURIComponent(request);
        return return_request;
    }
};

var test_Memcache = {
    upload: function(request){
        request_url = "memcahe_upload/?memcahe=" + encodeURIComponent(request);
        d3.json(request_url, function(result) {  
            console.log("in memcache upload");        
            console.log(result);
        });

    },
    download: function(request){
        request_url = "memcahe_download/?memcahe=" + encodeURIComponent(request);
        d3.json(request_url, function(result) {  
            console.log("in memcache download");        
            console.log(result);
        });
    }
};