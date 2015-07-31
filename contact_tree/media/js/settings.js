var drawing_canvas = {
    main_canvas: document.getElementById("c"),
    snap_canvas: document.getElementById("one_tree"),
    save_canvas: document.getElementById("save_tree"),
    middle: 0
};

var mapping_color = {
    // leaf_color: ["#927007", "#CF9D00", "#C2B208", "#699B1A", "#2E7523", "#214E33", "#1F4230", "#184E35", "#19432F"],
    // leaf_color: ["#806000", "#7C8E03", "#757806", "#637409", "#52700C", "#446D0E", "#376911", "#2B6513", "#216115", "#185E17", "#185A20", "#195629", "#1B5230", "#1C4F36"],
    // leaf_color: ["#927007", "#CF9D00", "#C2B208", "#94AE0F", "#5F9915", "#4A8E18", "#39831A", "#2A781B", "#1E6E1C", "#1C6324", "#1B582B", "#1A4D2E", "#19432F", "#1F3D2F"],
    // leaf_color: ["#924307", "#C2B208", "#94AE0F", "#5F9915", "#4A8E18", "#39831A", "#2A781B", "#1E6E1C", "#1C6324", "#1B582B", "#1A4D2E", "#19432F", "#1C352A", "#1F3848"],
    leaf_color: ["#6C1904","#924307", "#D23B14", "#D37A10", "#C2B208", 
                 "#90F415", "#8C8616", "#94AE0F", "#5F9915", "#1F861D", 
                 "#1C6324", "#315322", "#123F24", "#1F3848", "#E9D2B4", 
                 "#D4E8B2", "#B1E8BB", "#E6ADcD", "#5CD992", "#D44797"],
    // trunk: "#7D6041",
    trunk:"rgb(125, 96, 65)",
    fruit: "#C91313",
    root: "#362C21",
    leaf_stork: "#83A06E",
    // render_leaf_color: ["#924307", "#C2B208", "#94AE0F", "#5F9915"],
    render_leaf_color: ["#924307", "#C2B208", "#94AE0F", "#5F9915"],
    render_roots_color: ["#964343", "#90093F", "#967636", "#6B435E"],
    /*
    roots_color: ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c",
                  "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5",
                  "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f",
                  "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5" ] //Javid
                  */   
    /* 
    roots_color: ["#964343", "#FF3385", "#E6B85C", "#762D5E", "#E68A5C",
                  "#994BB4", "#E89619", "#7575FF", "#B8E6E6", "#5C5CFF",
                  "#FFCC99", "#19D1A3", "#FF99FF", "#16E6E6", "#FF8533",
                  "#E6B8E6", "#B84D70", "#75A319" ] //Random
    */
    roots_color: ["#964343", "#90093F", "#967636", "#6B435E", "#C87F5B",
                  "#77627F", "#6B4F24", "#324771", "#386161", "#283653",
                  "#948271", "#608A80", "#9F7589", "#598261", "#924607",
                  "#AC9AAA", "#92545E", "#4C5143" ] //Random
                
    // roots_color: ["#0F457F", "#D16850", "#CB5067","#C44F91", "#BE4EB7", "#964DB7", "#6B4CB0", "#91116F", "#4B51AA", "#7900D2", "#4A71A3", "#488D9C", "#469687", "#458F65", "#828A36", "#0F5C7D", "#0F727B", "#405655"] //v0
};


var mapping_size = {
    leaf_size_table: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40],
    fruit_size_table: [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]
};

// about the contact tree
var component_attribute = {};
var attribute_mapping = {};

// ego information
var total_ego = {};
var waves = [];

// user behaiver
var session_id = 0;
var last_use = "none";
var in_change_mode = 0;
var initial_user = 0;
var user_history = 0;
var first_use = 0;


/*********************** hard code setting ***************************/
// var total_ego = {
//     "2004": ["1", "2", "4", "5", "6", "7", "9", "14", "15", "16", "17", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "51", "52", "53", "54", "55", "56", "57", "59", "60"],
//     "2008": ["1", "4", "6", "7", "15", "19", "21", "22", "23", "24", "25", "26", "27", "30", "33", "34", "35", "39", "43", "46", "49", "51", "52", "53", "54", "57", "59", "60"],
//     "2012": ["1", "15", "23", "33", "34", "36", "43", "46", "52", "57", "59", "60"]
// };

// var international_countries = ["be", "de", "fi", "gb", "id", "it", "lu", "nl", "pl", "th", "tw", "vn"];

/*
var mapping_item = {
    "diary": ["alterid", "sex", "age", "yrknown", "feel", "howlong", "like", "month"],
    "DBLP": ["coauthor", "co_area_cat", "first_cooperation", "total_paper", "paper_year", "paper_authors", "tier1_paper", "area_detail_cat"],
    // "inter": ["ego", "egosex", "egoage", "altersex", "place", "duration", "ego_education_length", "ego_hhsize"]
    "inter": ["ego", "ego_hhsize", "egoage", "ego_occupation", "touch", "duration", "ego_education_length", "place"] //(1)
    // "inter": ["ego", "egosex", "egoage", "altersex", "place", "duration", "ego_education_length", "ego_hhsize"] //(2)
    // "inter": ["ego", "egosex", "egoage", "touch", "place", "duration", "ego_education_length", "ego_hhsize"] //(3)
};
*/

/*
var default_attribute = {
    "diary": {
        "stick": "alterid",
        "trunk": "sex",
        "branch": "age",
        "bside": "yrknown",
        "leaf_color": "feel",
        "leaf_size": "howlong",
        "fruit": "like",
        "root": "month"
    },
    "DBLP": {
        "stick": "coauthor",
        "trunk": "co_area_cat",
        "branch": "first_cooperation",
        "bside": "total_paper",
        "leaf_color": "paper_year",
        "leaf_size": "paper_authors",
        "fruit": "tier1_paper",
        "root": "area_detail_cat"
    },
    "inter": {
        "stick": "ego_id",
        "trunk": "ego_hhsize",
        "branch": "egoage",
        "bside": "ego_occupation",
        "leaf_color": "touch",
        "leaf_size": "duration",
        "fruit": "ego_education_length",
        "root": "place"
    }
};

var default_component = ["stick", "trunk", "branch", "bside", "leaf_color", "leaf_size", "fruit", "root"];
*/

// var cat_dblp = ["DB", "AI", "Vis", "Arch", "Dist", "Net", "WWW", "OS", "Sec", "PL", "SE", "Theory", "Crypto", "Bio", " "];
/*
var data_range = {
    "diary":{
        "sex": [1, 2],
        "age": [0, 7],
        "yrknown": [0, 4],
        "like": [1, 4],
        "howlong": [1, 5],
        "feel": [1, 4]
    },
    "DBLP":{
        "co_area": [1, 2, 2],
        "first_cooperation": [1, 11, 11],
        "tier1_paper": [0, 7, 8],
        "total_paper": [0, 7, 8],
        "paper_year": [1, 11, 11],
        "paper_authors": [1, 8, 8],
        "paper_tier": [1, 3, 3],
        "co_area_cat": [0, 16, 17],
        "paper_area_cat": [0, 16, 17]
        // "area_cat": [0, 14, 15]
    },
    "inter":{
        "egoage": [0, 15, 16],
        "egosex": [1, 2, 2],
        "altersex": [1, 2, 2],
        // "ego_hhsize": [1, 21, 21],
        "ego_hhsize": [1, 7, 7],
        "duration": [1, 5, 5],
        "frequency": [1, 5, 5],
        "place": [0, 5, 6],
        "touch": [0, 1, 2],
        "alterage": [0, 15, 16],
        "ego_occupation": [1, 6, 6],
        "ego_occupation_cat": [1, 2, 2],
        "ego_education": [0, 8, 9],
        "ego_education_cat": [1, 2, 2],
        "ego_education_length": [0, 4, 5]
    }
};
*/

/*
var component_attribute = {
    "diary":{
        "stick":["alterid"],
        "trunk":["gender", "age", "yrknown", "feel", "howlong", "like"],
        "branch":["age", "yrknown", "howlong"],
        "bside":["gender", "yrknown"],
        "leaf_color":["feel"],
        "leaf_size":["howlong"],
        "fruit":["like"],
        "root":["month"]
    },
    "inter":{
        "stick":["ego"],
        "trunk":["egosex", "egoage", "ego_hhsize", "ego_occupation", "ego_education", "ego_education_length", "touch"],
        "branch":["egoage","ego_occupation", "ego_hhsize", "ego_education", "ego_education_length"],
        "bside":["ego_occupation", "ego_education", "altersex", "alterage", "touch"],//"ego_occupation", "ego_education"
        "leaf_color":["place", "touch"],
        "leaf_size":["duration", "frequency"],
        "fruit":["ego_education_length", "ego_occupation", "ego_hhsize", "egoage"],
        "root":["ego_hhsize", "place", "duration", "egoage", "ego_occupation", "ego_education_length"]
    },
    "DBLP":{
        "stick":["paper_id", "coauthor"],
        "paper_stick":["paper_id", "coauthor"],
        "paper_trunk":["paper_area_cat", "paper_year", "paper_authors", "paper_tier"],
        "paper_branch":["paper_year", "paper_authors", "paper_tier"], //"paper_area_cat", 
        "paper_bside":["paper_authors", "paper_tier", "paper_area_cat", "paper_year"],
        "paper_leaf_color":["first_cooperation", "co_area_cat", "total_paper", "tier1_paper"],
        "paper_leaf_size":["tier1_paper", "co_area_cat", "first_cooperation", "total_paper"],
        "paper_fruit":["paper_tier", "paper_area_cat", "paper_year", "paper_authors"],
        "paper_root":["area_detail_cat", "co_area_cat", "paper_area_cat", "paper_authors", "paper_tier", "first_cooperation"],
        "author_stick":["coauthor", "paper_id"],
        "author_trunk":["co_area_cat", "first_cooperation", "total_paper", "tier1_paper"],
        "author_branch":["first_cooperation", "total_paper", "tier1_paper"], //"co_area_cat", 
        "author_bside":["total_paper", "tier1_paper", "first_cooperation", "co_area_cat"],
        "author_leaf_color":["paper_year", "paper_authors", "paper_tier", "paper_area_cat"],
        "author_leaf_size":[ "paper_authors", "paper_year", "paper_tier", "paper_area_cat"],
        "author_fruit":["tier1_paper", "first_cooperation", "total_paper", "co_area_cat"],
        "author_root":["area_detail_cat", "paper_area_cat", "co_area_cat", "paper_authors", "paper_tier", "first_cooperation"]
    }
};
*/

