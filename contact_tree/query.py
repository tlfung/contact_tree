from datetime import date, timedelta, datetime
from django.http import Http404, HttpResponse, HttpResponseRedirect
import os.path
import csv
import simplejson
import MySQLdb
import MySQLdb.cursors
import glob
import re
import time
import collections
import warnings 
from operator import *
from django.views.decorators.csrf import csrf_exempt
import hashlib
import operator
import json
import math

warnings.filterwarnings(action='ignore', category=MySQLdb.Warning)

class DB:
  conn = None

  def connect(self):
    self.conn = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree", cursorclass=MySQLdb.cursors.DictCursor)

  def query(self, sql):
    try:
      cursor = self.conn.cursor()
      cursor.execute(sql)
    except (AttributeError, MySQLdb.OperationalError):
      self.connect()
      cursor = self.conn.cursor()
      cursor.execute(sql)
    return cursor

# db = DB()

# database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree", cursorclass=MySQLdb.cursors.DictCursor)
# clause = database.cursor()

@csrf_exempt
def upload_file(request):
    if request.method == 'POST':
        file = request.FILES['usercsv2upload']
        localtime = str(time.time())
        localtime = localtime.replace(".", "_")
        print localtime
        # print hashlib.md5(localtime).hexdigest()
        # with open('./contact_tree/data/test_%s' % file.name, 'wb+') as dest:
        with open('./contact_tree/data/upload/' + localtime + ".csv", 'wb+') as dest:
            for chunk in file.chunks():
                dest.write(chunk)
    
    return HttpResponse(localtime)


def test_type(table):
    db = DB()
    final_attr_info = dict()
    final_info = []
    attr_info = dict()
    cur = db.query('SHOW columns FROM ' + table + ';')
    all_attr = cur.fetchall()
    total_missing = 0
    defult_col = 0
    final_attr_info["missing"] = []
    final_attr_info["default"] = []
    final_attr_info["intext"] = []
    
    temp_default = []
    for a in all_attr:
        # final_attr_info[f] = []
        temp_missing = []
        missing = 0
        if a['Field'] == 'egoid' or a['Field'] == 'alterid':
            temp_default.append(a['Field'])
            defult_col += 1
        if a['Field'] != 'e_id' and a['Field'] != 'egoid' and a['Field'] != 'alterid':
            f = a['Field']
            # print f                
            a_cur = db.query('SELECT MIN(cast(`' + f + '` as unsigned)), MAX(cast(`' + f + '` as unsigned)), COUNT(DISTINCT(`' + f + '`)) FROM `' + table + '`;')
            f_val = a_cur.fetchone()
            attr_info[f] = dict()
            for ff in f_val:
                attr_info[f][ff.split("(")[0]] = f_val[ff]
            attr_info[f]["RANGE"] = attr_info[f]["MAX"] - attr_info[f]["MIN"] + 1
            if f == 'dataset':
                attr_info[f]["RANGE"] = attr_info[f]["COUNT"]
            else:
                if attr_info[f]["MAX"] == attr_info[f]["MIN"] and attr_info[f]["COUNT"] > 0:
                    final_attr_info["intext"].append(f)

        if a['Field'] != 'e_id':
            f = a['Field']
            # print f
            c_cur = db.query('SELECT COUNT(*) FROM ' + table + ' WHERE `' + f + '`="";')
            missing = c_cur.fetchone()['COUNT(*)']
            temp_missing = [f, missing]
            final_attr_info["missing"].append(temp_missing)
            total_missing += missing

    if defult_col == 2:
        if total_missing == 0:
            return [table, attr_info]
        else:
            return [final_attr_info, attr_info]
    else:
        if 'egoid' not in temp_default:
            final_attr_info["default"].append('egoid')
        if 'alterid' not in temp_default:
            final_attr_info["default"].append('alterid')
        return [final_attr_info, attr_info]
    

def create_csv2database(request):
    final_attr_info = dict()
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    tree_cmpt = ["trunk", "branch", "bside", "leaf_color", "leaf_size", "fruit_size", "root"]
    # print request.GET.get('collection')
    if request.GET.get('collection'):
        table = request.GET.get('collection').replace(":-", "_")
        # table = request.GET.get('collection').split(":-")[-1]
        csvfile = request.GET.get('collection').split(":-")[0]
        # attr_json = json.loads(all_info[2])
        # json.dumps(all_info[2], separators=(',',':'))
        print table
        print csvfile
        # print attr_json
        # print "./contact_tree/data/upload/" + csvfile + ".csv"
        csv2mysql("./contact_tree/data/upload/" + csvfile + ".csv", table)

        final_attr_info = test_type(table)
        if final_attr_info[0] == table:
            for c in tree_cmpt:
                clause.execute('ALTER TABLE ' + table + ' ADD COLUMN `ctree_' + c + '` INT NULL DEFAULT NULL;')
                    
            database.commit()
            update_collection_data(table, final_attr_info[1])
        else:
            print "in error drop!!!"
            clause.execute('DROP TABLE IF EXISTS %s;' %table)
            database.commit()
            try:
                os.remove("./contact_tree/data/upload/" + csvfile + ".csv")
            except OSError:
                pass

    else:
        raise Http404

    jsondata = simplejson.dumps(final_attr_info[0], indent=4, use_decimal=True)
    # print jsondata
    return HttpResponse(jsondata)
    

def update_collection_data(table, attr_json):
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    db = DB()
    
    # print attr_json
    clause.execute('DELETE FROM dataset_collection WHERE dataset = "' + table + '";')
    for a in attr_json:
        my_attr = '"' + table + '", "' + a + '", "' + str(attr_json[a]["MIN"]) + '", "' + str(attr_json[a]["MAX"]) + '", "' + str(attr_json[a]["RANGE"]) + '"'
        # print my_attr
        # print 'INSERT INTO dataset_collection (dataset, attr, min, max, attr_range, relation, `type`, ego_mark) VALUES (' + my_attr + ');'
        clause.execute('INSERT INTO dataset_collection (dataset, attr, min, max, attr_range) VALUES (%s);' %my_attr)
    
    database.commit()

    cur = db.query('SELECT alterid FROM ' + table + ' WHERE egoid=(SELECT min(egoid) FROM ' + table + ');')
    temp_alter = cur.fetchone()['alterid']
    cur = db.query('SELECT min(egoid) FROM ' + table + ';')
    temp_ego = cur.fetchone()['min(egoid)']
    for a in attr_json:
        if a == 'dataset':
            continue
        else:
            # print 'SELECT COUNT(DISTINCT(`' + a + '`)) from ' + table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '";'
            cur = db.query('SELECT COUNT(DISTINCT(`' + a + '`)) from ' + table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '";')
            alter_count = cur.fetchone()
            if alter_count['COUNT(DISTINCT(`' + a + '`))'] == 1:
                # print 'UPDATE dataset_collection SET `alter` = 1 WHERE attr="' + a + '" and dataset="' + table + '";'
                clause.execute('UPDATE dataset_collection SET `alter` = 1 WHERE attr="' + a + '" and dataset="' + table + '";')

    database.commit()


def get_dataset(request):
    # folder = []
    group_list = ["", "all"]
    db = DB()
    if request.GET.get('data'):
        # ./contact_tree/data
        data_table = request.GET.get('data')
        
        cur = db.query("SELECT attr FROM dataset_collection WHERE dataset='" + data_table + "' and attr='dataset';")
        group = cur.fetchone()
        if group:
            group_list.append(group["attr"])
        
        # for root, dirs, files in os.walk("./contact_tree/data"):
        #     # print dirs
        #     group_list = dirs
        #     break
    else:
        raise Http404
    return_json = simplejson.dumps(group_list, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def get_type(s):
    """Find type for this string
    """
    number_formats = (
        # (int, 'BIGINT'),
        # (float, 'double'),
        (int, 'varchar(64)'),
        (float, 'varchar(64)'),
    )
    for cast, number_type in number_formats:
        try:
            cast(s)
        except ValueError:
            pass
        else:
            return number_type

    # check for timestamp
    dt_formats = (
        ('%Y-%m-%d %H:%M:%S', 'datetime'),
        ('%Y-%m-%d %H:%M:%S.%f', 'datetime'),
        ('%Y-%m-%d', 'date'),
        ('%H:%M:%S', 'time'),
    )
    for dt_format, dt_type in dt_formats:
        try:
            time.strptime(s, dt_format)
        except ValueError:
            pass
        else:
            return dt_type
   
    # doesn't match any other types so assume text
    if len(s) > 255:
        return 'text'
    else:
        return 'varchar(255)'


def most_common(l):
    """Return most common value from list
    """
    return max(l, key=l.count)


def get_col_types(input_file, max_rows=10):
    """Find the type for each CSV column
    """
    csv_types = collections.defaultdict(list)
    reader = csv.reader(open(input_file))
    # test the first few rows for their data types
    for row_i, row in enumerate(reader):
        if row_i == 0:
            header = row
        else:
            for col_i, s in enumerate(row):
                data_type = get_type(s)
                csv_types[header[col_i]].append(data_type)
 
        if row_i == max_rows:
            break

    # take the most common data type for each row
    return [most_common(csv_types[col]) for col in header]


def get_schema(table, header, col_types):
    """Generate the schema for this table from given types and columns
    """
    schema_sql = """CREATE TABLE IF NOT EXISTS %s (
        e_id int NOT NULL AUTO_INCREMENT,""" % table

    for col_name, col_type in zip(header, col_types):
        schema_sql += '\n%s %s,' % (col_name, col_type)

    schema_sql += """\nPRIMARY KEY (e_id)
        ) DEFAULT CHARSET=utf8;"""
    
    return schema_sql


def get_insert(table, header):
    """Generate the SQL for inserting rows
    """
    field_names = ', '.join(header)
    field_markers = ', '.join('%s' for col in header)
    return 'INSERT INTO %s (%s) VALUES (%s);' % \
        (table, field_names, field_markers)


def safe_col(s):
    return re.sub('\W+', '_', s.lower()).strip('_')


def csv2mysql(fn, table):
    # table = fn.split("\\").pop().split(".")[0]
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    print 'Analyzing column types ...'
    col_types = get_col_types(fn)
    # print col_types
    header = None
    for row in csv.reader(open(fn)):
        if header:
            clause.execute(insert_sql, row)
            
        else:
            header = []
            for col in row:
                header.append("`"+safe_col(col)+"`")
            print header
            #sys.exit()
            schema_sql = get_schema(table, header, col_types)
            #print schema_sql

            #create table
            # print 'DROP TABLE IF EXISTS %s;' %table
            clause.execute('DROP TABLE IF EXISTS %s;' %table)

            # clause.execute('SELECT "%s" FROM INFORMATION_SCHEMA.TABLES LIMIT 1;' % table)
            # if clause.fetchone():
            #     return 0
            # else:
            clause.execute(schema_sql)
            
            # create index for more efficient access
            try:
                clause.execute('CREATE INDEX ids ON %s (e_id);' % table)
                #db.query('CREATE INDEX ids ON %s (id);' % table)
            except MySQLdb.OperationalError:
                pass # index already exists

            print 'Inserting rows ...'
            # SQL string for inserting data
            insert_sql = get_insert(table, header)
    
    # commit rows to database
    print 'Committing rows to database ...'
    #db.commit()
    database.commit()
    print 'Done!'


####################################### above is for database #####################################################

def get_list_ego(request):
    final_return = []
    e_list = dict()    
    default_attr = dict()
    cmpt_attr = dict()
    
    db = DB()
    if request.GET.get('table'):
        # ./contact_tree/data
        table = request.GET.get('table').split(":-")[0]
        column = request.GET.get('table').split(":-")[1]
        myego = "egoid"
        if column == "all":
            cur = db.query("SELECT DISTINCT(" + myego + ") FROM " + table + ";")
            allego = cur.fetchall()
            e_list["all"] = []
            for e in allego:
                e_list["all"].append(e[myego])
                
        else:
            cur = db.query("SELECT DISTINCT(" + myego + "), " + column + " FROM " + table + " ORDER BY " + column + ";")
            allego = cur.fetchall()
            
            for e in allego:
                if e[column] in e_list:
                    e_list[e[column]].append(e[myego])
                    e_list[e[column]].sort(key=int)
                else:
                    e_list[e[column]] = []
                    e_list[e[column]].append(e[myego])
                    
        final_return.append(e_list)

        default_attr["stick"] = "alterid"
        
        cur = db.query('SELECT * FROM dataset_collection WHERE attr_range < 20 and dataset="' + table + '" and `alter`="1";')
        relate_alter = cur.fetchall()
        candidate = dict()
        for relate in relate_alter:
            candidate[relate['attr']] = int(relate["attr_range"])
        # candidate_range = sorted(candidate.values(), key=int)
        sort_candidate = sorted(candidate.items(), key=operator.itemgetter(1))
        
        default_attr["trunk"] = sort_candidate[0][0]
        default_attr["bside"] = sort_candidate[1][0]
        default_attr["fruit_size"] = sort_candidate[2][0]
        default_attr["branch"] = sort_candidate[-1][0]

        cur = db.query('SELECT * FROM dataset_collection WHERE attr_range > 3 and dataset="' + table + '" and `alter`is NULL;')
        relate_ego = cur.fetchall()
        ego_candidate = dict()
        for relate in relate_ego:
            ego_candidate[relate['attr']] = int(relate["attr_range"])

        sort_candidate = sorted(ego_candidate.items(), key=operator.itemgetter(1))

        default_attr["leaf_color"] = sort_candidate[0][0]
        default_attr["leaf_size"] = sort_candidate[1][0]
        default_attr["root"] = sort_candidate[2][0]
        default_attr["leaf_id"] = sort_candidate[-1][0]

        final_return.append(default_attr)

        cur = db.query('SELECT * FROM dataset_collection WHERE attr!="dataset" and dataset="' + table + '";')
        attr_info = cur.fetchall()
        for info in attr_info:
            detail_array = []
            if int(info['attr_range']) < 20:
                infocur = db.query('SELECT DISTINCT(`' + info['attr'] + '`) FROM ' + table + ';')
                attr_detail = infocur.fetchall()
                for d in attr_detail:
                    detail_array.append(int(d[info['attr']]))
                detail_array.sort(key=int)

            cmpt_attr[info['attr']] = [detail_array, int(info['min']), int(info['max']), int(info['attr_range']), info['alter']]

        # return the all the infomation of all the attr 
        final_return.append(cmpt_attr)

        # files = glob.glob("contact_tree/data/" + request.GET.get('folder') + "/*.csv")
        # for fn in files:
        #     # print fn
        #     diary = csv.reader(open(fn, 'rU'), delimiter='\t')
        #     check_row = 0
        #     row_index = []
        #     sub = fn.split(".")[0].split("_").pop()

        #     ego_id = []
        #     for row in diary:
        #         elements = row[0].split(",")
        #         if check_row == 0:
        #             for e in elements:
        #                 row_index.append(e)
        #             check_row += 1
        #             continue
        #         if elements[row_index.index('egoid')].isdigit() and elements[row_index.index("alterid")].isdigit():
        #             ego_id.append(int(elements[row_index.index('egoid')]))
        #     e_list[sub] = sorted(list(set(ego_id)))

    else:
        raise Http404
    return_json = simplejson.dumps(final_return, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def unique_stick(all_data, attr, branch_layer):
    structure = dict()
    # print stick_unique
    structure["right"] = []
    structure["left"] = []
    structure["root"] = []

    root = attr['root']
    stick = "alterid"
    leaf_id = attr['leaf_id']
    f_size = "ctree_fruit_size"
    l_size = "ctree_leaf_size"
    l_color = "ctree_leaf_color"

    alter_array_right_up = []
    alter_array_left_up = []
    alter_array_right_down = []
    alter_array_left_down = []
    for total in range(branch_layer):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right_up.append([])
        alter_array_left_up.append([])
        alter_array_right_down.append([])
        alter_array_left_down.append([])
    structure["root"].append({})

    for meeting in all_data:
        # meeting = c
        if meeting[root] not in structure["root"][0]:
            structure["root"][0][meeting[root]] = dict()
            structure["root"][0][meeting[root]]["length"] = 0
            structure["root"][0][meeting[root]]["sub"] = [10 for i in range(12)] # may add attribute mapping
            structure["root"][0][meeting[root]]["root_cat"] = meeting[root]
            # print structure["root"]
        else:
            structure["root"][0][meeting[root]]["length"] += 1
        # left
        if meeting['ctree_trunk'] == 0:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting["ctree_branch"] == l and meeting["ctree_bside"] == 1:
                    if len(alter_array_left_up[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                        alter_array_left_up[level].append(meeting[stick])

                    else:
                        count_alter = 0
                        for a in alter_array_left_up[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                            alter_array_left_up[level].append(meeting["alterid"])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})

                    break

                # level and down
                elif meeting["ctree_branch"] == l and meeting["ctree_bside"] == 0:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                        alter_array_left_down[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_left_down[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                            alter_array_left_down[level].append(meeting[stick])
                        else:
                            structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})

                    break
                level += 1
        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting["ctree_branch"] == l and meeting["ctree_bside"] == 1:
                    if len(alter_array_right_up[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                        alter_array_right_up[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right_up[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                            alter_array_right_up[level].append(meeting[stick])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})

                    break
                # level and down
                elif meeting["ctree_branch"] == l and meeting["ctree_bside"] == 0:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                        alter_array_right_down[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right_down[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting["ctree_fruit_size"], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})
                            alter_array_right_down[level].append(meeting["alterid"])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting["ctree_leaf_size"], "color": meeting["ctree_leaf_color"], "leaf_id": meeting[leaf_id]})

                    break
                level += 1

    return structure


def duplicate_stick(all_data, attr, branch_layer):
    structure = dict()
    # print stick_unique
    structure["right"] = []
    structure["left"] = []
    structure["root"] = []

    root = attr['root']
    # stick = "alterid"
    leaf_id = attr['leaf_id']

    alter_array_right = []
    alter_array_left = []
    for total in range(branch_layer):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right.append([])
        alter_array_left.append([])
    structure["root"].append({})

    return structure


def set_default_mapping(all_data, table, attr):
    # print "set_default_mapping"
    db = DB()
    for d in all_data:
        for compt in attr:
            if compt == 'trunk' or compt == 'bside':
                cur = db.query('SELECT min, max, attr_range FROM dataset_collection WHERE dataset="' + table + '" and attr="' + attr[compt] + '";')
                collecting_data = cur.fetchone()
                mid = math.floor((int(collecting_data['max']) + int(collecting_data['min']))/2)
                if int(d[attr[compt]]) <= int(mid):
                    # print 'UPDATE ' + table + ' SET ctree_' + compt + '=0 WHERE e_id=' + str(d['e_id']) + ';'
                    db.query('UPDATE ' + table + ' SET ctree_' + compt + '=0 WHERE e_id=' + str(d['e_id']) + ';')
                else:
                    # print 'UPDATE ' + table + ' SET ctree_' + compt + '=1 WHERE e_id=' + str(d['e_id']) + ';'
                    db.query('UPDATE ' + table + ' SET ctree_' + compt + '=1 WHERE e_id=' + str(d['e_id']) + ';')

            if compt == 'fruit_size' or compt == 'leaf_size' or compt == 'leaf_color' or compt == 'branch':
                cur1 = db.query('SELECT min FROM dataset_collection WHERE dataset="' + table + '" and attr="' + attr[compt] + '";')
                collecting_data = cur1.fetchone()
                
                reorder = int(d[attr[compt]]) - int(collecting_data['min'])
                if reorder > 15:
                    reorder = 15 # set restrictions
                
                # print 'UPDATE ' + table + ' SET ctree_' + compt + '=' + str(reorder) + ' WHERE e_id=' + str(d['e_id']) + ';'
                db.query('UPDATE ' + table + ' SET ctree_' + compt + '=' + str(reorder) + ' WHERE e_id=' + str(d['e_id']) + ';')

    db.conn.commit()


def one_contact(request):
    final_structure = dict()
    db = DB()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('contact'):
        list_request = request.GET['contact'].split(":-")
        
        attr = json.loads(list_request[0])
        ego_info = json.loads(list_request[1])
        ego_group = list_request[2]
        table = list_request[3]
        
        # print request.GET['contact']
        # print ego_info
        if ego_group == "all":
            for e in ego_info:
                precur = db.query('SELECT * FROM ' + table + ' WHERE egoid="' + e + '";')
                all_data = precur.fetchall()
                cur = db.query('SELECT `alter` FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['bside'] + '";')
                stick_unique = cur.fetchone()["alter"]
                cur = db.query('SELECT attr_range FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['branch'] + '";')
                branch_layer = int(cur.fetchone()["attr_range"])

                if stick_unique == '1':
                    # print "in_unique"
                    one_structure = unique_stick(all_data, attr, branch_layer)

                else:
                    # print "in_duplicate"
                    one_structure = duplicate_stick(all_data, attr, branch_layer)

                final_structure["all"] = dict()
                final_structure["all"][e] = one_structure

        else:
            for e in ego_info:
                for sub in ego_info[e]:
                    precur = db.query('SELECT * FROM ' + table + ' WHERE dataset="' + sub + '" and egoid="' + e + '";')
                    all_data = precur.fetchall()
                    cur = db.query('SELECT `alter` FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['bside'] + '";')
                    stick_unique = cur.fetchone()["alter"]
                    cur = db.query('SELECT attr_range FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['branch'] + '";')
                    branch_layer = int(cur.fetchone()["attr_range"])

                    if stick_unique == '1':
                        # print "in_unique"
                        one_structure = unique_stick(all_data, attr, branch_layer)

                    else:
                        # print "in_duplicate"
                        one_structure = duplicate_stick(all_data, attr, branch_layer)

                    final_structure[sub] = dict()
                    final_structure[sub][e] = one_structure

    else:
        raise Http404
    
    return_json = simplejson.dumps(final_structure, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def one_contact_update(request):
    db = DB()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('contact'):
        list_request = request.GET['contact'].split(":-")
        
        attr = json.loads(list_request[0])
        ego = list_request[1]
        table = list_request[2]
        # attr['branch'] = 'age'
        precur = db.query('SELECT * FROM ' + table + ' WHERE egoid="' + ego + '";')
        all_data = precur.fetchall()
        set_default_mapping(all_data, table, attr)

    else:
        raise Http404
    
    return_json = simplejson.dumps(table, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def update_binary(request):
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('update'):
        list_request = request.GET['update'].split(":=")[0].split(":-")
        select_ego = request.GET['update'].split(":=")[1:]
        print list_request
        # select_ego = json.loads(list_request[0])
        table = list_request[0]
        ori_column = list_request[2]
        new_column = list_request[1]
        zero_val = list_request[3:]
        print select_ego
        print ori_column
        print new_column
        print zero_val

        update_query_zero = "UPDATE " + table + " SET " + new_column + " = 0 WHERE (" + ori_column + "=" + zero_val[0]
        update_query_one = "UPDATE " + table + " SET " + new_column + " = 1 WHERE (" + ori_column + "!=" + zero_val[0]
        for zero in zero_val[1:]:
            update_query_zero += " OR " + ori_column + "=" + zero
            update_query_one += " AND " + ori_column + "!=" + zero
        if len(select_ego) > 0:
            update_query_zero += ") AND ("
            update_query_one += ") AND ("
            for update_ego in select_ego[:-1]:
                update_query_zero += "egoid=" + update_ego + " OR "
                update_query_one += "egoid=" + update_ego + " OR "

            update_query_zero += "egoid=" + select_ego[-1] + ");"
            update_query_one += "egoid=" + select_ego[-1] + ");"     
        else:
            update_query_zero += ");"
            update_query_one += ");"     

        print update_query_zero
        print update_query_one
        clause.execute(update_query_zero)
        clause.execute(update_query_one)
        database.commit()

    else:
        raise Http404
    
    return_json = simplejson.dumps("done update", indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def update_layer(request):
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('update'):
        list_request = request.GET['update'].split(":=")[0].split(":-")
        select_ego = request.GET['update'].split(":=")[1:]
        # print list_request
        # select_ego = json.loads(list_request[0])
        table = list_request[0]
        ori_column = list_request[2]
        new_column = list_request[1]
        val_map = json.loads(list_request[3])
        # print select_ego
        # print ori_column
        # print new_column
        # print val_map

        for ori_val in val_map:
            update_layer_val = "UPDATE " + table + " SET " + new_column + "=" + str(val_map[ori_val]) + " WHERE " + ori_column + "=" + str(ori_val) + ";"
            # print update_layer_val
            clause.execute(update_layer_val)

        database.commit()

    else:
        raise Http404
    
    return_json = simplejson.dumps("done update", indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def restructure(request):
    db = DB()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('restructure'):
        list_request = request.GET['restructure'].split(":=")[0].split(":-")
        ego_info = request.GET['restructure'].split(":=")[1:]
        # print list_request
        attr = select_ego = json.loads(list_request[2])
        table = list_request[0]
        ego_group = list_request[1]
        # print select_ego
        # print attr
        # print table
        final_structure = dict()

        if ego_group == "all":
            for e in ego_info:
                precur = db.query('SELECT * FROM ' + table + ' WHERE egoid="' + e + '";')
                all_data = precur.fetchall()
                cur = db.query('SELECT `alter` FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['bside'] + '";')
                stick_unique = cur.fetchone()["alter"]
                cur = db.query('SELECT attr_range FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['branch'] + '";')
                branch_layer = int(cur.fetchone()["attr_range"])

                if stick_unique == '1':
                    # print "in_unique"
                    one_structure = unique_stick(all_data, attr, branch_layer)

                else:
                    # print "in_duplicate"
                    one_structure = duplicate_stick(all_data, attr, branch_layer)

                final_structure["all"] = dict()
                final_structure["all"][e] = one_structure

        else:
            subcur = db.query('SELECT DISTINCT(' + ego_group + ') FROM ' + table + ';')
            sub_data = subcur.fetchall()
            sub_dataset = []
            for s in sub_data:
                sub_dataset.append(s[ego_group])

            for e in ego_info:
                for sub in sub_dataset:
                    precur = db.query('SELECT * FROM ' + table + ' WHERE dataset="' + sub + '" and egoid="' + e + '";')
                    all_data = precur.fetchall()
                    cur = db.query('SELECT `alter` FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['bside'] + '";')
                    stick_unique = cur.fetchone()["alter"]
                    cur = db.query('SELECT attr_range FROM dataset_collection WHERE dataset= "' + table + '" and attr="' + attr['branch'] + '";')
                    branch_layer = int(cur.fetchone()["attr_range"])

                    if stick_unique == '1':
                        # print "in_unique"
                        one_structure = unique_stick(all_data, attr, branch_layer)

                    else:
                        # print "in_duplicate"
                        one_structure = duplicate_stick(all_data, attr, branch_layer)

                    if sub in final_structure:
                        final_structure[sub][e] = one_structure

                    else:
                        final_structure[sub] = dict()
                        final_structure[sub][e] = one_structure


    else:
        raise Http404
    
    return_json = simplejson.dumps(final_structure, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)
       


############################ old code #################################
# rewrite
def list_author(request):
    a_list = []
    single = ""
    total = 0
    area = ""
    if request.GET.get('list'):
        detail = request.GET.get('list').split("_")
        # print detail
        if(len(detail[0].split(":")) > 1):
            single = detail[0].split(":")[1]

        if(len(detail[1].split(":")) > 1):
            total = int(detail[1].split(":")[1])
            
        if(len(detail[2].split(":")) > 1):
            area = detail[2].split(":")[1]

        print single
        print total
        print area

        a_list = query_list_author(single, area, total)

        if len(a_list) == 0:
            print "Can not find auther under this requirement."
        # print a_list
    else:
        raise Http404
    return_json = simplejson.dumps(a_list, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)
  

def query_list_author(single, area, total):
    db = DB()
    temp_list = []
    final_a_list = []
    # for specific author
    if single != "":
        cur = db.query("SELECT author FROM author_info where author like '%" + single + "%' and real_total_paper > 50 LIMIT 1000;")
        au = cur.fetchall()
        if au:
            for a in au:
                temp_list.append(a["author"])
        if len(temp_list) == 0:
            print "dont have enough data in database."
        return temp_list

    # for specific publish
    if total != -1:
        if area != "": # specific area with certain amount of publish
            cur = db.query("SELECT author FROM author_info where real_total_paper >'" + str(total) + "' and area='" + area + "' LIMIT 1000;")
            au = cur.fetchall()
            print "SELECT author FROM author_info where real_total_paper >'" + str(total) + "' and area='" + area + "' LIMIT 1000;"
            if au:
                for a in au:
                    temp_list.append(a["author"])
        else: # no area but with certain amount of publish, default of > 300
            cur = db.query("SELECT author FROM author_info where real_total_paper >'" + str(total) + "' LIMIT 1000;")
            au = cur.fetchall()
            # print au_area
            if au:
                for a in au:
                    temp_list.append(a["author"])

    else: # dont set publish limit
        if area != "": # specific area but no limit amount of publish, default of > 300
            cur = db.query("SELECT author FROM author_info where real_total_paper > 300 and area='" + area + "' LIMIT 1000;")
            print "SELECT author FROM author_info where real_total_paper > 300 and area='" + area + "' LIMIT 1000;"
            au = cur.fetchall()
            # print au_area
            if au:
                for a in au:
                    temp_list.append(a["author"])
        else: # empty selection
            cur = db.query("SELECT author FROM author_info where real_total_paper > 500 LIMIT 1000;")
            au = cur.fetchall()
            if au:
                for a in au:
                    temp_list.append(a["author"])

    for name in temp_list:
        c = 0
        if name.find("?") > -1 or name.find(">") > -1 or name.find("_") > -1 or name.find("0") > -1 or name.find("1") > -1 or name.find("2") > -1 or name.find("3") > -1 or name.find("4") > -1 or name.find("5") > -1 or name.find("6") > -1 or name.find("7") > -1 or name.find("8") > -1 or name.find("9") > -1:
            continue
        # for w in name["author"][0:]:
        #     if not w.isalpha() and w != " " and w != "." and w != "-":
        #         c += 3
        #     # if w == "?" or w == ">" or w.isdigit() or w == "'" or w == "_":
        #     #     c = 10
        #     #     break
        # if c < 5:
        # print name
        final_a_list.append(name)
    return final_a_list

# attr = ["sex", "age", "yrknown", "feel", "howlong", "like"]

def update_contact(request):
    final_data = dict()
    data = dict()
    # attr = ["sex", "age", "yrknown", "feel", "howlong", "like"]
    if request.GET.get('contacts'):
        attr = request.GET['contacts'].split(":")[0].split(",")[1:]
        ego_info = request.GET['contacts'].split(":")[1].split("/")
        print request.GET['contacts']
        print ego_info
        folder = ego_info[0]
        for y in range(1, len(ego_info)):
            egos = ego_info[y].split("_")
            for e in range(1, len(egos)):
                diary_table = folder + "_" + egos[e]
                # print diary_table
                d = create_json_sql(diary_table, egos[0], attr)
                # data[egos[e]] = d
                
                if egos[e] in data:
                    # final_data[egos[e]] = dict()
                    # data[egos[e]][egos[0]] = d[int(egos[0])]
                    data[egos[e]][egos[0]] = d
                else:
                    data[egos[e]] = dict()
                    # data[egos[e]][egos[0]] = d[int(egos[0])]
                    data[egos[e]][egos[0]] = d
        for d in data:
            final_data[d] = dict()
            for sub in data[d]:
                final_data[d][sub] = data[d][sub]
        
    else:
        raise Http404
        # raise Http404
    return_json = simplejson.dumps(final_data, indent=4, use_decimal=True)
    # print json
    # print "in show: %s" % species
    # json = "this is what I got "+ species
    return HttpResponse(return_json)


def get_country(request):
    final_structure = dict()
    if request.GET.get('international'):
        attr = request.GET['international'].split(":")[0].split(",")[1:]
        countries = request.GET['international'].split(":")[1].split("_")
        # with open("./contact_tree/data/final_12countries.json", "rb") as json_file:
        with open("./contact_tree/data/final_12countries_KL.json", "rb") as json_file:
            raw_data = simplejson.load(json_file)
            for c in countries:
                
                data = raw_data[c]
                #structure(cmpt_array, data)
                final_structure[c] = create_inter_structure(attr, data)
                # print final_structure
    else:
        raise Http404
    return_json = simplejson.dumps(final_structure, indent=4, use_decimal=True)
    
    return HttpResponse(return_json)


def create_inter_structure(attr, data):
    t = attr[0]
    b = attr[1]
    bs = attr[2]
    color = attr[3]
    size = attr[4]
    fruit = attr[5]
    root = attr[6]

    #print t, b, bs, size, color, fruit
    inter_range = {
        "egoage": [0, 15, 16],
        "egosex": [1, 2, 2],
        "altersex": [1, 2, 2],
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

    if t == "ego_occupation":
        t = "ego_occupation_cat"
    if bs == "ego_occupation":
        bs = "ego_occupation_cat"
    if t == "ego_education":
        t = "ego_education_cat"
    if bs == "ego_education":
        bs = "ego_education_cat"

    structure = dict()
    structure["right"] = []
    structure["left"] = []
    alter_array_right = []
    alter_array_left = []
    structure["root"] = []
    # alter_array_right_up = []
    # alter_array_left_up = []
    # alter_array_right_down = []
    # alter_array_left_down = []

    branch_range = inter_range[b]
    #print branch_range[0], branch_range[1]
    #sys.exit()
    #empty tree
    for total in range(branch_range[0], branch_range[1]+1):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right.append([])
        alter_array_left.append([])
        # alter_array_right_up.append([])
        # alter_array_left_up.append([])
        # alter_array_right_down.append([])
        # alter_array_left_down.append([])
    # print "empty_tree", structure
    structure["root"].append({})

    #cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + t + '"')
    #t_info = cur.fetchone()
    t_range = inter_range[t][2]
    t_min = inter_range[t][0]
    #print t_min, t_range, round(t_range*0.5), t_range*0.5
    t_range = int(t_min + round(t_range*0.5) - 1)

    #cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + bs + '"')
    #bs_info = cur.fetchone()
    bs_min = inter_range[bs][0]
    bs_range = inter_range[bs][2]
    #print bs_min, bs_range, round(bs_range*0.5), bs_range*0.5
    bs_range = int(bs_min + round(bs_range*0.5) - 1)

    #print t_range, bs_range
    #sys.exit()
    #print data

    for c in data:
        meeting = c
        for a in attr:
            if meeting[a] == -1:
                print a, meeting[a]
                continue
        #print color, meeting[color]
        if meeting[root] not in structure["root"][0]:
            structure["root"][0][meeting[root]] = dict()
            structure["root"][0][meeting[root]]["length"] = 0
            structure["root"][0][meeting[root]]["sub"] = [10 for i in range(12)]
            structure["root"][0][meeting[root]]["root_cat"] = meeting[root]
            # print structure["root"]
        else:
            structure["root"][0][meeting[root]]["length"] += 1
            # structure["root"][0][meeting[root]]["sub"][meeting["paper_year"]] += 1

        
        #print meeting[color]
        #print meeting[b]
        #sys.exit()
        # left
        if meeting[t] <= t_range:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_left[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                        structure["left"][level]["level"]["down"].append({})
                        alter_array_left[level].append(meeting["egoid"])
                    else:
                        count_alter = 0
                        for a in alter_array_left[level]:
                            if meeting["egoid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            structure["left"][level]["level"]["down"].append({})
                            alter_array_left[level].append(meeting["egoid"])
                        else:
                            if is_empty(structure["left"][level]["level"]["up"][new_alter]):
                                structure["left"][level]["level"]["up"][new_alter] = {"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []}
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            else:
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_left[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                        structure["left"][level]["level"]["up"].append({})
                        alter_array_left[level].append(meeting["egoid"])
                    else:
                        count_alter = 0
                        for a in alter_array_left[level]:
                            if meeting["egoid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            structure["left"][level]["level"]["up"].append({})
                            alter_array_left[level].append(meeting["egoid"])
                        else:
                            if is_empty(structure["left"][level]["level"]["down"][new_alter]):
                                structure["left"][level]["level"]["down"][new_alter] = {"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []}
                                structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            else:
                                structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})

                    break
                level += 1

        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_right[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                        structure["right"][level]["level"]["down"].append({})
                        alter_array_right[level].append(meeting["egoid"])
                    else:
                        count_alter = 0
                        for a in alter_array_right[level]:
                            if meeting["egoid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            structure["right"][level]["level"]["down"].append({})
                            alter_array_right[level].append(meeting["egoid"])
                        else:
                            # print structure["right"][level]["level"]["up"]
                            if is_empty(structure["right"][level]["level"]["up"][new_alter]):
                                structure["right"][level]["level"]["up"][new_alter] = {"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []}
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            else:
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                                # structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_right[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                        structure["right"][level]["level"]["up"].append({})
                        alter_array_right[level].append(meeting["egoid"])
                    else:
                        count_alter = 0
                        for a in alter_array_right[level]:
                            if meeting["egoid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            structure["right"][level]["level"]["up"].append({})
                            alter_array_right[level].append(meeting["egoid"])
                        else:
                            if is_empty(structure["right"][level]["level"]["down"][new_alter]):
                                structure["right"][level]["level"]["down"][new_alter] = {"id": meeting["egoid"], "fruit": meeting[fruit], "leaf": []}
                                structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                            else:
                                structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})
                                # structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["alterid"]})

                    break

                level += 1
    #jsondata = simplejson.dumps(structure, indent=4, use_decimal=True)
    #print jsondata

    return structure


# not be used
def create_diary_json(fn, ego):
    diary = csv.reader(open(fn, 'rU'), delimiter='\t')
    final_ego = dict()
    row_index = []
    check_row = 0
    for row in diary:
        usable = 0
        elements = row[0].split(",")
        if check_row == 0:
            for e in elements:
                row_index.append(e)
            check_row += 1
            # print row_index
            # print "attr:", attr
            continue

        # if ego == elements[diary_index[year]["egoid"]]:
        if ego == elements[row_index.index('egoid')]:
            # ego_id = elements[diary_index[year]["egoid"]]
            raw_data = dict()
            if elements[row_index.index("alterid")].isdigit():
                raw_data["alterid"] = elements[row_index.index("alterid")]
            else:
                continue
            for a in attr:
                if elements[row_index.index(a)].isdigit():
                    raw_data[a] = elements[row_index.index(a)]
                else:
                    usable = 1
                    break

            # raw_data["sex"] = elements[diary_index[year]["sex"]]
            # raw_data["age"] = elements[diary_index[year]["age"]]
            # raw_data["yrknown"] = elements[diary_index[year]["yrknown"]]
            # raw_data["like"] = elements[diary_index[year]["like"]]
            # raw_data["feel"] = elements[diary_index[year]["feel"]]
            # raw_data["alterid"] = elements[diary_index[year]["alterid"]]
            # raw_data["howlong"] = elements[diary_index[year]["howlong"]]
            # raw_data["date"] = elements[diary_index["date"]]

            # for e in raw_data:
            #     if raw_data[e] == "":
            #         usable = 1
            #         # raw_data[e] = 2
            #         break
            if usable == 1:
                # print "dirty"
                continue

            if ego in final_ego:
                final_ego[ego].append(raw_data)
            else:
                final_ego[ego] = []
                final_ego[ego].append(raw_data)

    # jsondata = simplejson.dumps(final_ego, indent=4, use_decimal=True)
    # print jsondata
    return final_ego
    

def create_json_sql(table, ego_id, myattr):
    db = DB()
    # print "in query sql"
    # table = cat + "_" + year
    # raw_data = dict()
    final_ego = dict()
    ego_id = int(ego_id)
    cur = db.query("SELECT * FROM %s where egoid = %d" % (table, ego_id))
    # cur = db.query("SELECT * FROM " + table + " where egoid = " + ego_id)
    ego_data = cur.fetchall()
    for e in ego_data:
        # print e["sex"]
        raw_data = dict()
        alter = str(e["alterid"])
        if alter.isdigit():
            # print alter
            raw_data["alterid"] = alter
        else:
            continue

        for c in myattr:
            val = str(e[c])
            if val.isdigit():
                raw_data[c] = e[c]
                #continue
            else:
                print c, e[c]
        # raw_data["leaf_id"] = e["id"]
        raw_data["leaf_id"] = e["infdate"] 
        if ego_id in final_ego:
            final_ego[ego_id].append(raw_data)
        else:
            final_ego[ego_id] = []
            final_ego[ego_id].append(raw_data)
        #sys.exit()

    s = create_diary_structure(myattr, final_ego[ego_id])
    jsondata = simplejson.dumps(final_ego, indent=4, use_decimal=True)
    # print jsondata
    # print "ego: ", final_ego
    # return final_ego
    # print "attr:", myattr
    return s

#not use
def change_attr(request):
    # now only one user can use it...........
    data = []
    # table = request.GET.get('contact')
    if request.GET.get('attr'):
        new_attribute = request.GET['attr'].split(",")
        print request.GET['attr']
        for a in new_attribute:
            data.append(a)
        global attr
        attr = data
        # return_json = simplejson.dumps(data, indent=4, use_decimal=True)
        # print json
    else:
        raise Http404
        # raise Http404
    return_json = simplejson.dumps("", indent=4, use_decimal=True)
    # print json
    # print "in show: %s" % species
    # json = "this is what I got "+ species
    return HttpResponse(return_json)
    
#not use
def test(request):
    print "--------", request.POST
    jsondata = simplejson.dumps("successed", indent=4, use_decimal=True)
    return HttpResponse(jsondata)


def get_data_info(request):
    db = DB()
    final_info = dict()
    final_compt = dict()
    if request.GET.get('table'):
        if request.GET['table'] == "international":
            print "in international"
        else:
            table = request.GET['table']+"_attribute_info"
            cur = db.query("SELECT * FROM %s;" %table)
            attr_info = cur.fetchall()
            # final_info = dict()
            # final_compt = dict()
            layer = []
            binary = []
            cat = []
            for a in attr_info:
                if a["attr_range"] > 20 or a["min"] > 2:
                    continue
                inside_info = [a["min"], a["max"], a["attr_range"]]
                final_info[a["attr"]] = inside_info
                # binary.append(a["attr"])
                if 2 < a["attr_range"] < 15:
                    layer.append(a["attr"])
                if a["attr_range"] < 15:
                    cat.append(a["attr"])
                    binary.append(a["attr"])

            final_compt["trunk"] = binary
            final_compt["branch"] = layer
            # final_compt["branch"] = cat
            final_compt["bside"] = binary
            final_compt["leaf_color"] = cat
            final_compt["leaf_size"] = cat
            final_compt["fruit"] = cat
            final_compt["root"] = layer
        
        
        # print final_info
        jsondata = simplejson.dumps([final_info, final_compt], indent=4, use_decimal=True)
        # print jsondata
        # jsondata = simplejson.dumps(attr_info, indent=4, use_decimal=True)
        # print jsondata
        # data.append(d)
    else:
        raise Http404

    return HttpResponse(jsondata)


def one_author(request):
    # data = []
    if request.GET.get('author'):
        author = request.GET['author']
        print author
        attr = author.split(":")[0].split(",")
        author_name = author.split(":")[1]
        d = create_dblp_json(attr, author_name)
        jsondata = simplejson.dumps(d, indent=4, use_decimal=True)
        # data.append(d)
    else:
        raise Http404

    return HttpResponse(jsondata)

def upadte_author(request):
    data = []
    final_data = dict()
    if request.GET.get('author'):
        author = request.GET['author']
        print author
        attr = author.split(":")[0].split(",")
        author_name = author.split(":")[1].split("/")
        final_data["author"] = dict()
        for au in author_name:
            d = create_dblp_json(attr, au)
            final_data["author"][au] = d[au]
        # final_data["author"] = data
        jsondata = simplejson.dumps(final_data, indent=4, use_decimal=True)
    else:
        raise Http404

    return HttpResponse(jsondata)


def create_dblp_json(attr, author):
    db = DB()
    coauthor = dict()
    print "SELECT area FROM author_info where author='" + author + "'"
    ego_au = db.query("SELECT area FROM author_info where author='" + author + "'")

    main_area = ego_au.fetchone()["area"]
    # print main_area
    final_ego = dict()
    final_ego[author] = []
    query_paper = db.query("SELECT area_detail_cat, area_detail, paper_id, author_count, year, tier, area_cat, area FROM paper_info_1 where author='" + author + "'")
    pp = query_paper.fetchall()
    paper_year = dict()
    paper_detail = dict()

    if pp:
        for p in pp:
            # main_area_cat = p["area_detail"]
            if p["area"] != main_area:
                paper_detail[p["paper_id"]] = {"paper_id": int(p["paper_id"]), "tier": int(p["tier"]), "author_count": int(p["author_count"]), "year": int(p["year"]), "paper_area_cat": int(p["area_cat"]), "paper_area": 2, "area_detail": "outsider",  "area_detail_cat": -1}
            else:
                paper_detail[p["paper_id"]] = {"paper_id": int(p["paper_id"]), "tier": int(p["tier"]), "author_count": int(p["author_count"]), "year": int(p["year"]), "paper_area_cat": int(p["area_cat"]), "paper_area": 1, "area_detail": p["area_detail"], "area_detail_cat": p["area_detail_cat"]}

            query_co = db.query("SELECT author FROM paper_info_1 where paper_id=" + str(p["paper_id"]) + "")
            co = query_co.fetchall()
            if co:
                for au in co:
                    au_name = au["author"]
                    try:
                        au_name.decode('utf-8')

                    except UnicodeError:
                        # print ca.decode("ISO-8859-1")
                        continue
                    #print au["author"]
                    #s.lower()
                    if au["author"].lower() == str(author).lower():
                        # print "ego_author"
                        continue

                    if au_name.find("'") != -1 or au_name.find('"') != -1:
                        au_name = au_name.replace("'", "\\'")
                        au_name = au_name.replace('"', '\\"')
                    query_info = db.query("SELECT area, area_cat, total_paper, tier1paper FROM author_info where author='" + au_name + "'")
                    coau = query_info.fetchone()
                    #coauthor[au["author"]] = []
                    if coau:
                        if au["author"] in coauthor:
                            paper_year[au["author"]]["year"].append(p["year"])
                            paper_year[au["author"]]["id"].append(p["paper_id"])
                        else:
                            paper_year[au["author"]] = {"year": [p["year"]], "id": [p["paper_id"]]}
                            if coau["area"] != main_area:
                                coauthor[au["author"]] = [2, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]

                            else:
                                coauthor[au["author"]] = [1, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]
    '''
    query_co1 = db.query("SELECT author2, author2_area FROM Coauthorship_network where author1='" + author + "'")
    co1 = query_co1.fetchall()

    if co1:
        for au in co1:
            au_name = au["author2"]
            if au_name.find("'") != -1 or au_name.find('"') != -1:
                au_name = au_name.replace("'", "\\'")
                au_name = au_name.replace('"', '\\"')
            query_info = db.query("SELECT area_cat, total_paper, tier1paper FROM author_info where author='" + au_name + "'")
            coau = query_info.fetchone()
            coauthor[au["author2"]] = []
            if au["author2_area"] != main_area:
                coauthor[au["author2"]] = [2, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]

            else:
                coauthor[au["author2"]] = [1, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]

    query_co1 = db.query("SELECT author1, author1_area FROM Coauthorship_network where author2='" + author + "'")
    co1 = query_co1.fetchall()
    if co1:
        for au in co1:
            au_name = au["author1"]
            if au_name.find("'") != -1 or au_name.find('"') != -1:
                au_name = au_name.replace("'", "\\'")
                au_name = au_name.replace('"', '\\"')
            query_info = db.query("SELECT area_cat, total_paper, tier1paper FROM author_info where author='" + au_name + "'")
            coau = query_info.fetchone()
            coauthor[au["author1"]] = []
            if au["author1_area"] != main_area:
                coauthor[au["author1"]] = [2, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]

            else:
                coauthor[au["author1"]] = [1, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]

    # print coauthor
    for ca in coauthor:
        try:
            ca.decode('utf-8')

        except UnicodeError:
            # print ca.decode("ISO-8859-1")
            continue
        query_name = ca
        if query_name.find("'") != -1 or query_name.find('"') != -1:
            query_name = query_name.replace("'", "\\'")
            query_name = query_name.replace('"', '\\"')
        query_name = query_name.decode('utf-8').replace(u'\u014c\u0106\u014d','-')
        query_paper = db.query("SELECT paper_id, author_count, year, tier, area_cat, area FROM paper_info where author='" + author + "' and paper_id in (SELECT paper_id FROM paper_info where author='" + query_name + "')")
        paper = query_paper.fetchall()
        paper_year = []
        paper_detail = []
        if paper:
            for p in paper:
                paper_year.append(int(p["year"]))
                if int(p["area_cat"]) != main_area:
                    paper_detail.append({"paper_id": int(p["paper_id"]), "tier": int(p["tier"]), "author_count": int(p["author_count"]), "year": int(p["year"]), "paper_area_cat": int(p["area_cat"]), "paper_area": 2})
                else:
                    paper_detail.append({"paper_id": int(p["paper_id"]), "tier": int(p["tier"]), "author_count": int(p["author_count"]), "year": int(p["year"]), "paper_area_cat": int(p["area_cat"]), "paper_area": 1})

                # print p["paper_id"], p["author_count"], p["year"], p["tier"], p["area_cat"], p["area"]
            first_co = min(paper_year)
            for i in range(len(paper_year)):
                # coauthor[au["author1"]] = [2, int(coau["area_cat"]), int(coau["total_paper"]), int(coau["tier1paper"])]
                # paper_detail.append({"paper_id": p["paper_id"], "tier": int(p["tier"]), "author_count": int(p["author_count"]), "year": int(p["year"]), "paper_area": int(p["area"])})
                final_ego[author].append({"coauthor": ca, "co_area": coauthor[ca][0], "co_area_cat": coauthor[ca][1], "total_paper": coauthor[ca][2], "tier1_paper": coauthor[ca][3], "first_cooperation": first_co,
                                          "paper_id": paper_detail[i]["paper_id"], "paper_tier": paper_detail[i]["tier"], "paper_authors": paper_detail[i]["author_count"], "paper_year": paper_detail[i]["year"], "paper_area_cat": paper_detail[i]["paper_area_cat"], "paper_area": paper_detail[i]["paper_area"]})
    '''

    for ca in coauthor:
        try:
            ca.decode('utf-8')

        except UnicodeError:
            # print ca.decode("ISO-8859-1")
            continue

        first_co = min(paper_year[ca]["year"])
        for i in range(len(paper_year[ca]["id"])):
            pid = paper_year[ca]["id"][i]
            #print paper_year[ca]["year"][i], " = ", paper_detail[pid]["year"]
            final_ego[author].append({"coauthor": ca, "co_area": coauthor[ca][0], "co_area_cat": coauthor[ca][1], "total_paper": coauthor[ca][2], "tier1_paper": coauthor[ca][3], "first_cooperation": first_co,
                                      "paper_id": pid, "paper_tier": paper_detail[pid]["tier"], "paper_authors": paper_detail[pid]["author_count"], "paper_year": paper_detail[pid]["year"], "paper_area_cat": paper_detail[pid]["paper_area_cat"], "paper_area": paper_detail[pid]["paper_area"], "area_detail": paper_detail[pid]["area_detail"], "area_detail_cat": paper_detail[pid]["area_detail_cat"]})
    #sys.exit()
    # print final_ego
    tree_structure = dict()
    # tree_structure[author] = create_DBLP_structure(attr, final_ego[author])
    tree_structure[author] = create_DBLP_structure_with_root(attr, final_ego[author])

    return tree_structure


def create_DBLP_structure(attr, data):
    print attr
    DBLP_range ={
        "co_area": [1, 2, 2],
        "first_cooperation": [1, 11, 11],
        "tier1_paper": [0, 7, 8],
        "total_paper": [0, 7, 8],
        "paper_year": [1, 11, 11],
        "paper_authors": [1, 8, 8],
        "paper_tier": [1, 3, 3],
        "co_area_cat": [0, 14, 15],
        "paper_area_cat": [0, 14, 15],
        "paper_area": [1, 2, 2]
    }

    alter_id = attr[0]
    t = attr[1]
    b = attr[2]
    bs = attr[3]
    color = attr[4]
    size = attr[5]
    fruit = attr[6]
    
    # leaf_id = "paper_id"
    if alter_id == "coauthor":
        leaf_id = "paper_id"
    if alter_id == "paper_id":
        leaf_id == "coauthor"

    # print t, b, bs, size, color, fruit
    if t == "co_area_cat":
        t = "co_area"
    if bs == "co_area_cat":
        bs = "co_area"
    if fruit == "co_area_cat":
        fruit = "co_area"

    if t == "paper_area_cat":
        t = "paper_area"
    if bs == "paper_area_cat":
        bs = "paper_area"
    if fruit == "paper_area_cat":
        fruit = "paper_area"

    structure = dict()
    structure["right"] = []
    structure["left"] = []
    alter_array_right_up = []
    alter_array_left_up = []
    alter_array_right_down = []
    alter_array_left_down = []
    # for root
    # structure["root"] = []

    branch_range = DBLP_range[b]
    # print branch_range[0], branch_range[1]
    # sys.exit()
    # empty tree
    for total in range(branch_range[0], branch_range[1]+1):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right_up.append([])
        alter_array_left_up.append([])
        alter_array_right_down.append([])
        alter_array_left_down.append([])

    # print structure

    t_range = DBLP_range[t][2]
    t_min = DBLP_range[t][0]

    t_range = int(t_min + round(t_range*0.5) - 1)

    #cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + bs + '"')
    #bs_info = cur.fetchone()
    bs_min = DBLP_range[bs][0]
    bs_range = DBLP_range[bs][2]

    bs_range = int(bs_min + round(bs_range*0.5) - 1)

    for c in data:
        meeting = c
        # left
        if meeting[t] <= t_range:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_left_up[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_left_up[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_left_up[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_left_up[level].append(meeting[alter_id])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_left_down[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_left_down[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_left_down[level].append(meeting[alter_id])
                        else:
                            structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break
                level += 1

        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_right_up[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_right_up[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_right_up[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_right_up[level].append(meeting[alter_id])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_right_down[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_right_down[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_right_down[level].append(meeting[alter_id])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                level += 1
    # jsondata = simplejson.dumps(structure, indent=4, use_decimal=True)
    # print jsondata
    # print structure
    # sys.exit()
    return structure


def create_DBLP_structure_with_root(attr, data):
    print attr
    areas = ['None', 'DB', 'AI', 'Vis', 'Arch', 'Dist', 'Net', 'WWW', 'OS', 'Sec', 'PL', "SE", "Theory", "Crypto", "Bio", "HCI", 'Graphics']
    DBLP_range ={
        "co_area": [1, 2, 2],
        "first_cooperation": [1, 11, 11],
        "tier1_paper": [0, 7, 8],
        "total_paper": [0, 7, 8],
        "paper_year": [1, 11, 11],
        "paper_authors": [1, 8, 8],
        "paper_tier": [1, 3, 3],
        "co_area_cat": [0, 16, 17],
        "paper_area_cat": [0, 16, 17],
        "paper_area": [1, 2, 2]
    }

    alter_id = attr[0]
    t = attr[1]
    b = attr[2]
    bs = attr[3]
    color = attr[4]
    size = attr[5]
    fruit = attr[6]
    root = attr[7]
    
    leaf_id = "paper_id"
    if alter_id == "coauthor":
        leaf_id = "paper_id"
    elif alter_id == "paper_id":
        leaf_id = "coauthor"

    # print t, b, bs, size, color, fruit
    if t == "co_area_cat":
        t = "co_area"
    if bs == "co_area_cat":
        bs = "co_area"
    if fruit == "co_area_cat":
        fruit = "co_area"

    if t == "paper_area_cat":
        t = "paper_area"
    if bs == "paper_area_cat":
        bs = "paper_area"
    if fruit == "paper_area_cat":
        fruit = "paper_area"

    root_cat = attr[7]
    if root == "area_detail_cat":
        root_cat = attr[7].split("_cat")[0]
       

    structure = dict()
    structure["right"] = []
    structure["left"] = []
    alter_array_right_up = []
    alter_array_left_up = []
    alter_array_right_down = []
    alter_array_left_down = []
    # for root
    structure["root"] = []

    branch_range = DBLP_range[b]
    # print branch_range[0], branch_range[1]
    # sys.exit()
    # empty tree
    for total in range(branch_range[0], branch_range[1]+1):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right_up.append([])
        alter_array_left_up.append([])
        alter_array_right_down.append([])
        alter_array_left_down.append([])

    structure["root"].append({})
    # print structure

    t_range = DBLP_range[t][2]
    t_min = DBLP_range[t][0]

    t_range = int(t_min + round(t_range*0.5) - 1)

    #cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + bs + '"')
    #bs_info = cur.fetchone()
    bs_min = DBLP_range[bs][0]
    bs_range = DBLP_range[bs][2]

    bs_range = int(bs_min + round(bs_range*0.5) - 1)

    for c in data:
        meeting = c

        # root
        if meeting[root] != "outsider":
            # if root == "paper_area_cat" or root == "co_area_cat":
            #     if areas[meeting[root]] not in structure["root"][0]:
            #         structure["root"][0][areas[meeting[root]]] = dict()
            #         structure["root"][0][areas[meeting[root]]]["length"] = 0
            #         structure["root"][0][areas[meeting[root]]]["sub"] = [0 for i in range(DBLP_range["paper_year"][2]+1)]
            #         structure["root"][0][areas[meeting[root]]]["sub"][meeting["paper_year"]] += 1
            #         # print structure["root"]
            #     else:
            #         structure["root"][0][areas[meeting[root]]]["length"] += 1
            #         structure["root"][0][areas[meeting[root]]]["sub"][meeting["paper_year"]] += 1
            #         # print structure["root"]
            # else:
            if meeting[root] not in structure["root"][0]:
                structure["root"][0][meeting[root]] = dict()
                structure["root"][0][meeting[root]]["length"] = 0
                structure["root"][0][meeting[root]]["sub"] = [0 for i in range(DBLP_range["paper_year"][2]+1)]
                structure["root"][0][meeting[root]]["sub"][meeting["paper_year"]] += 1 # need change for different author/paper mapping
                structure["root"][0][meeting[root]]["root_cat"] = meeting[root_cat]
                if root == "co_area_cat" or root == "paper_area_cat":
                    structure["root"][0][meeting[root]]["root_cat"] = areas[int(meeting[root_cat])]
                # print structure["root"]
            else:
                structure["root"][0][meeting[root]]["length"] += 1
                structure["root"][0][meeting[root]]["sub"][meeting["paper_year"]] += 1

        # left
        if meeting[t] <= t_range:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_left_up[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_left_up[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_left_up[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_left_up[level].append(meeting[alter_id])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_left_down[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_left_down[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_left_down[level].append(meeting[alter_id])
                        else:
                            structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break
                level += 1

        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_range[0], branch_range[1]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_right_up[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_right_up[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_right_up[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_right_up[level].append(meeting[alter_id])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                        alter_array_right_down[level].append(meeting[alter_id])
                    else:
                        count_alter = 0
                        for a in alter_array_right_down[level]:
                            if meeting[alter_id] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting[alter_id], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})
                            alter_array_right_down[level].append(meeting[alter_id])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting[leaf_id]})

                    break

                level += 1
    # jsondata = simplejson.dumps(structure, indent=4, use_decimal=True)
    # print jsondata
    # print structure
    # sys.exit()
    return structure


def create_diary_structure(attr, data):
    db = DB()
    t = attr[0]
    b = attr[1]
    bs = attr[2]
    color = attr[3]
    size = attr[4]
    fruit = attr[5]
    root = attr[6]
    #print t, b, bs, size, color, fruit

    structure = dict()
    structure["right"] = []
    structure["left"] = []
    alter_array_right_up = []
    alter_array_left_up = []
    alter_array_right_down = []
    alter_array_left_down = []

    structure["root"] = []

    cur = db.query('SELECT min, max FROM diary_attribute_info WHERE attr ="' + b + '"')
    branch_range = cur.fetchone()
    print branch_range["min"], branch_range["max"]
    #empty tree
    for total in range(branch_range["min"], branch_range["max"]+1):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right_up.append([])
        alter_array_left_up.append([])
        alter_array_right_down.append([])
        alter_array_left_down.append([])
    # print "empty_tree", structure
    structure["root"].append({})

    cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + t + '"')
    t_info = cur.fetchone()
    t_range = t_info["attr_range"]
    t_min = t_info["min"]
    #print t_min, t_range, round(t_range*0.5), t_range*0.5
    t_range = int(t_min + round(t_range*0.5) - 1)

    cur = db.query('SELECT min, attr_range FROM diary_attribute_info WHERE attr ="' + bs + '"')
    bs_info = cur.fetchone()
    bs_min = bs_info["min"]
    bs_range = bs_info["attr_range"]
    #print bs_min, bs_range, round(bs_range*0.5), bs_range*0.5
    bs_range = int(bs_min + round(bs_range*0.5) - 1)

    #print t_range, bs_range
    #sys.exit()
    #print data

    for c in data:
        meeting = c

        if meeting[root] not in structure["root"][0]:
            structure["root"][0][meeting[root]] = dict()
            structure["root"][0][meeting[root]]["length"] = 0
            structure["root"][0][meeting[root]]["sub"] = [10 for i in range(12)]
            structure["root"][0][meeting[root]]["root_cat"] = meeting[root]
            # print structure["root"]
        else:
            structure["root"][0][meeting[root]]["length"] += 1
            # structure["root"][0][meeting[root]]["sub"][meeting["paper_year"]] += 1
        
        #print b
        #print meeting[b]
        #sys.exit()
        # left
        if meeting[t] <= t_range:
            level = 0
            new_alter = -1
            for l in range(branch_range["min"], branch_range["max"]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_left_up[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                        alter_array_left_up[level].append(meeting["alterid"])
                    else:
                        count_alter = 0
                        for a in alter_array_left_up[level]:
                            if meeting["alterid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                            alter_array_left_up[level].append(meeting["alterid"])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                        alter_array_left_down[level].append(meeting["alterid"])
                    else:
                        count_alter = 0
                        for a in alter_array_left_down[level]:
                            if meeting["alterid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                            alter_array_left_down[level].append(meeting["alterid"])
                        else:
                            structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})

                    break
                level += 1

        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_range["min"], branch_range["max"]+1):
                # level and up
                if meeting[b] == l and meeting[bs] > bs_range:
                    if len(alter_array_right_up[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                        alter_array_right_up[level].append(meeting["alterid"])
                    else:
                        count_alter = 0
                        for a in alter_array_right_up[level]:
                            if meeting["alterid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                            alter_array_right_up[level].append(meeting["alterid"])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})

                    break

                # level and down
                elif meeting[b] == l and meeting[bs] <= bs_range:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                        alter_array_right_down[level].append(meeting["alterid"])
                    else:
                        count_alter = 0
                        for a in alter_array_right_down[level]:
                            if meeting["alterid"] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting["alterid"], "fruit": meeting[fruit], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})
                            alter_array_right_down[level].append(meeting["alterid"])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[size], "color": meeting[color], "leaf_id": meeting["leaf_id"]})

                    break

                level += 1

    # sorted(structure["root"][0].items(),key=lambda x:getitem(x[1],'length')):

    #jsondata = simplejson.dumps(structure, indent=4, use_decimal=True)
    #print jsondata
    #print structure
    return structure

############################################################ utility function ############################################################################
def is_empty(any_structure):
    if any_structure:
        # print('Structure is not empty.')
        return False
    else:
        # print('Structure is empty.')
        return True

    