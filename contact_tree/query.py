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
import copy
import time
import chardet

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


# define index of ctree component 
egoid_index = 0
alterid_index = 1
trunk_index = 2
branch_index = 3
bside_index = 4
fruit_size_index = 5
leaf_size_index = 6
leaf_color_index = 7
root_index = 8
highlight_index = 9

# save the post request file to server
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
   
# check the format of the upload file
def test_type(table, attr_type):
    db = DB()
    final_attr_info = dict()
    final_info = []
    attr_info = dict()
    cur = db.query('SHOW columns FROM ' + table + ';')
    all_attr = cur.fetchall()
    total_missing = 0
    defult_col = 0
    final_attr_info["default"] = []
    final_attr_info["inbool"] = []

    useful_data = 0
    temp_default = []
    for field in attr_type:
        print field
        # final_attr_info[f] = []
        temp_missing = []
        missing = 0
        if field == 'egoid' or field == 'alterid':
            temp_default.append(field)
            defult_col += 1
        if field != 'e_id' and field != 'egoid' and field != 'alterid':
            attr_info[field] = dict()
            attr_info[field]["TYPE"] = attr_type[field]               
            if attr_type[field] == 'categorical':
                # print 'SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;'
                a_cur = db.query('SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;')
                f_val = a_cur.fetchone()
                # attr_info[field] = dict()
                for ff in f_val:
                    col_val = f_val[ff]
                    attr_info[field][ff.split("(")[0]] = col_val
                # if attr_info[f]["COUNT"] > 20:
                #     final_attr_info["incat"].append(f)
                attr_info[field]["RANGE"] = attr_info[field]["COUNT"]
                # attr_info[field]["MIN"] = attr_info[field]["MIN"].decode('utf-8')
                # attr_info[field]["MAX"] = attr_info[field]["MAX"].decode('utf-8')
                useful_data += 1

            elif attr_type[field] == 'numerical':
                a_cur = db.query('SELECT MIN(cast(`' + field + '` as unsigned)), MAX(cast(`' + field + '` as unsigned)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;')
                f_val = a_cur.fetchone()
                # attr_info[field] = dict()
                for ff in f_val:
                    attr_info[field][ff.split("(")[0]] = f_val[ff]
                attr_info[field]["RANGE"] = attr_info[field]["MAX"] - attr_info[field]["MIN"] + 1
                useful_data += 1
            
            elif attr_type[field] == 'boolean':
                a_cur = db.query('SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;')
                f_val = a_cur.fetchone()
                # attr_info[field] = dict()
                for ff in f_val:
                    col_val = f_val[ff]
                    attr_info[field][ff.split("(")[0]] = col_val
                if attr_info[field]["COUNT"] > 2:
                    final_attr_info["inbool"].append(field)
                # attr_info[field]["MIN"] = attr_info[field]["MIN"].decode('utf-8')
                # attr_info[field]["MAX"] = attr_info[field]["MAX"].decode('utf-8')
                attr_info[field]["RANGE"] = attr_info[field]["COUNT"]
                useful_data += 1
            else:
                # print 'SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;'
                a_cur = db.query('SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;')
                f_val = a_cur.fetchone()
                # attr_info[field] = dict()
                for ff in f_val:
                    attr_info[field][ff.split("(")[0]] = f_val[ff]
                # if attr_info[f]["COUNT"] > 20:
                #     final_attr_info["incat"].append(f)
                attr_info[field]["RANGE"] = attr_info[field]["COUNT"]

                if attr_info[field]["COUNT"] == 2:
                    attr_info[field]["TYPE"] = "boolean"
                    useful_data += 1
                elif attr_info[field]["COUNT"] < 20:
                    attr_info[field]["TYPE"] = "categorical"
                    useful_data += 1
                else:
                    attr_info[field]["TYPE"] = "id"

            # else:

    if useful_data < 5:
        return [{"lackofdata": [useful_data]}, attr_info]

    if defult_col == 2:
        if len(final_attr_info["inbool"]) == 0:
            return [table, attr_info]
        else:
            return [final_attr_info, attr_info]
    else:
        if 'egoid' not in temp_default:
            final_attr_info["default"].append('egoid')
        if 'alterid' not in temp_default:
            final_attr_info["default"].append('alterid')
        return [final_attr_info, attr_info]
    

# load csv file to database
def create_csv2database(request):
    final_attr_info = dict()
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    tree_cmpt = ["trunk", "branch", "bside", "leaf_color", "leaf_size", "fruit_size", "root"]
    clause.execute('SET SQL_SAFE_UPDATES = 0;')
    database.commit()
    if request.GET.get('collection'):
        table = request.GET.get('collection').split(":-")[1]
        csvfile = request.GET.get('collection').split(":-")[0]
        
        attr_type = csv2mysql("./contact_tree/data/upload/" + csvfile + ".csv", table)

        if attr_type == -1:
            jsondata = simplejson.dumps({"insert_error": "Type and value not match"}, indent=4, use_decimal=True)
            return HttpResponse(jsondata)

        final_attr_info = test_type(table, attr_type)
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

    clause.execute('SET SQL_SAFE_UPDATES = 1;')
    database.commit()
    jsondata = simplejson.dumps(final_attr_info[0], indent=4, use_decimal=True)
    # print jsondata
    return HttpResponse(jsondata)
    
# update the attribute information
def update_collection_data(data_table, attr_json):
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    db = DB()
    clause.execute('SET SQL_SAFE_UPDATES = 0;')
    database.commit()

    clause.execute('DELETE FROM dataset_collection WHERE dataset = "' + data_table + '";')
    a_index = 0
    insert_collection_sql = "INSERT INTO dataset_collection (dataset, attr, min, max, attr_range, type) VALUES (%s, %s, %s, %s, %s, %s)"
    for a in attr_json:
        row = [data_table, a, attr_json[a]["MIN"], attr_json[a]["MAX"], attr_json[a]["RANGE"], attr_json[a]["TYPE"]]
        
        clause.execute(insert_collection_sql, row)
       
        # my_attr = '"' + data_table + '", "' + a + '", "' + str(attr_json[a]["MIN"]) + '", "' + str(attr_json[a]["MAX"]) + '", "' + str(attr_json[a]["RANGE"]) + '", "' + str(attr_json[a]["TYPE"]) + '", "' + str(a_index) + '"' 
        # # clause.execute('INSERT INTO dataset_collection (dataset, attr, min, max, attr_range, type, branch_range) VALUES (%s);' %my_attr)
        # clause.execute('INSERT INTO dataset_collection (dataset, attr, min, max, attr_range, type, a_index) VALUES (%s);' %my_attr)
        a_index += 1
    database.commit()

    cur = db.query('SELECT alterid FROM ' + data_table + ' WHERE egoid=(SELECT min(egoid) FROM ' + data_table + ');')
    temp_alter = cur.fetchone()['alterid']
    cur = db.query('SELECT min(egoid) FROM ' + data_table + ';')
    temp_ego = cur.fetchone()['min(egoid)']
    for a in attr_json:
        if a == 'dataset':
            continue
        else:
            # print 'SELECT COUNT(DISTINCT(`' + a + '`)) from ' + data_table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '";'
            cur = db.query('SELECT COUNT(DISTINCT(`' + a + '`)) from ' + data_table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '" AND `' + a + '` != "";')
            alter_count = cur.fetchone()
            if alter_count['COUNT(DISTINCT(`' + a + '`))'] == 1:
                # print 'UPDATE dataset_collection SET `alter` = 1 WHERE attr="' + a + '" and dataset="' + data_table + '";'
                clause.execute('UPDATE dataset_collection SET `alter_info` = 1 WHERE attr="' + a + '" and dataset = "' + data_table + '";')

    clause.execute('SET SQL_SAFE_UPDATES = 1;')
    database.commit()
    
# get data type for 
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


def define_type(s):
    if s == 'categorical':
        return "varchar(32) NULL DEFAULT NULL"
    elif s == 'numerical':
        return "int NULL DEFAULT NULL"
    elif s == 'boolean':
        return "char(1) NULL DEFAULT NULL"
    elif s == 'id':
        return "varchar(64) NULL DEFAULT NULL"
    else:
        return "varchar(64) NULL DEFAULT NULL"


def csv2mysql(fn, table):
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="Ctree")
    clause = database.cursor()
    print 'Analyzing column types ...'
    # col_types = get_col_types(fn)
    # print col_types
    header = None
    col_types = None
    attribute_info = dict()
    for row in csv.reader(open(fn)):
        # insert Mysql 
        if col_types:
            # clause.execute(insert_sql, row)
            for x in range(len(row)):
                row[x] = row[x].decode('big5').encode('utf-8')
                if row[x] == '':
                    row[x] = None
                # attribute_info[header[count_col].replace('`', '')] = col
            # print insert_sql, row
            try:
                clause.execute(insert_sql, row)
            except MySQLdb.OperationalError:
                print "Error:", row
                return -1
            
        else:
            if header: # after getting the column name
                col_types = []
                count_col = 0
                for col in row:
                    col_types.append(define_type(col))
                    attribute_info[header[count_col].replace('`', '')] = col
                    count_col += 1
                print col_types

                schema_sql = get_schema(table, header, col_types)

                clause.execute('DROP TABLE IF EXISTS %s;' %table)

                clause.execute(schema_sql)
                
                try:
                    clause.execute('CREATE INDEX ids ON %s (e_id);' % table)
                    clause.execute('CREATE INDEX ego_id ON %s (egoid);' % table)
                    #db.query('CREATE INDEX ids ON %s (id);' % table)
                except MySQLdb.OperationalError:
                    pass # index already exists

                print 'Inserting rows ...'
                # SQL string for inserting data
                insert_sql = get_insert(table, header)


            else: # get the column name
                header = []
                for col in row:
                    header.append("`"+safe_col(col)+"`")
                print header
            
    # commit rows to database
    print 'Committing rows to database ...'
    database.commit()
    print 'Done!'

    print attribute_info
    return attribute_info


####################################### above is for database #####################################################
# return the data format of dataset
def get_dataset(request):
    # folder = []
    group_list = ["", "all"]
    db = DB()
    # db.query('SET SQL_SAFE_UPDATES = 0;')
    # db.conn.commit()
    if request.GET.get('data'):
        data_table = request.GET.get('data').split("_of_")[1]
        session = request.GET.get('data').split("_of_")[0]
        session_table = request.GET.get('data')

        user_ctree_data = dict()
        check_file_exist = os.path.exists("./contact_tree/data/auto_save/" + session + ".json")
        if check_file_exist:
            with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
                user_ctree_data = json.load(json_file)

        if session not in user_ctree_data:
            user_ctree_data[session] = dict()
        
        user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
        with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
            json_file.write(user_ctree_data_json)

        # print 'SELECT * FROM auto_save WHERE session_id=' + str(session) + ' AND mode="' + data_table + '";'
        # s_cur = db.query('SELECT * FROM auto_save WHERE session_id=' + str(session) + ' AND mode="' + data_table + '";')
        # if s_cur.fetchone():
        #     db.query('UPDATE auto_save SET mode="' + data_table + '" WHERE session_id="' + str(session) + '"  AND mode="' + data_table + '";')
        #     # db.query('UPDATE attribute_mapping SET mode="' + data_table + '" WHERE session_id="' + str(session) + '";')
        # else:
        #     db.query('INSERT INTO auto_save (mode, session_id) VALUES ("' + data_table + '",' + session + ');')
        #     # db.query('INSERT INTO attribute_mapping (mode, session_id, mapping_name) VALUES ("' + data_table + '",' + session + ', "auto_map");')
                                        
        cur = db.query("SELECT attr FROM dataset_collection WHERE dataset='" + data_table + "' and attr='dataset';")
        group = cur.fetchone()
        if group:
            group_list.append(group["attr"])
    else:
        raise Http404

    # db.query('SET SQL_SAFE_UPDATES = 1;')
    # db.conn.commit()
    return_json = simplejson.dumps(group_list, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)

# get all the dataset in the database
def get_dataset_mode(request):
    final_return = []
    db = DB()
    if request.GET.get('mode'):
        session = request.GET.get('mode')
        cur = db.query("SELECT DISTINCT(dataset) FROM dataset_collection;")
        allset = cur.fetchall()
        
        for d in allset:
            final_return.append(d["dataset"])
        
    else:
        raise Http404

    return_json = simplejson.dumps(final_return, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)

def get_list_ego(request):
    final_return = []
    e_list = dict()    
    default_attr = dict()
    cmpt_attr = dict()
    
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('table'):
        # ./contact_tree/data
        table = request.GET.get('table').split(":-")[0]
        column = request.GET.get('table').split(":-")[1]
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0];
        myego = "egoid"

        # print 'SELECT * FROM auto_save WHERE session_id=' + str(session) + ' AND mode="' + data_table + '" AND data_group`"' + column + '";'
        s_cur = db.query('SELECT * FROM auto_save WHERE session_id=' + str(session) + ' AND mode="' + data_table + '" AND data_group="' + column + '";')
        if s_cur.fetchone():
            print "saving exist"
        else:
            db.query('INSERT INTO auto_save (mode, session_id, data_group) VALUES ("' + data_table + '", ' + session + ', "' + column+ '");')
            
        db.query('SET SQL_SAFE_UPDATES = 1;')
        db.conn.commit()

        datasetcur = db.query('SELECT * FROM dataset_collection WHERE attr = "dataset" and dataset="' + data_table + '";')
        dataset_attr = datasetcur.fetchone()

        if column == "all" and dataset_attr == None:
            cur = db.query("SELECT DISTINCT(" + myego + ") FROM " + data_table + " ORDER BY cast(`egoid` as unsigned);")
            allego = cur.fetchall()
            for e in allego:
                e_list[e[myego]] = ["all"];
                # e_list[e[myego]].append("all")
        else:
            cur = db.query("SELECT DISTINCT(" + myego + "), dataset FROM " + data_table + " ORDER BY cast(`egoid` as unsigned);")
            allego = cur.fetchall()
            
            for e in allego:
                if e[myego] in e_list:
                    e_list[e[myego]].append(e["dataset"])
                    e_list[e[myego]].sort(key=int)
                else:
                    e_list[e[myego]] = []
                    e_list[e[myego]].append(e["dataset"])
                    
        final_return.append(e_list) # for all the egoid

        # get the default mapping
        default_attr["stick"] = "alterid"

        cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and attr_range > 1 and attr_range < 20 and `type`="categorical" and dataset="' + data_table + '" and `alter_info`="1" ORDER BY attr_range;')
        all_attr = cur.fetchall()

        
        candidate1 = []
        for relate in all_attr:
            candidate1.append(relate['attr'])

        required_cmpt = ["trunk", "bside", "branch"]
        if len(candidate1) >= 3:
            default_attr["trunk"] = candidate1[0]
            default_attr["bside"] = candidate1[1]
            default_attr["branch"] = candidate1[-1]
            
        elif len(candidate1) == 2:
            default_attr["trunk"] = candidate1[0]
            default_attr["bside"] = candidate1[1]

            cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and attr_range >= 20 and dataset="' + data_table + '" and `alter_info`="1" and `type`="numerical" ORDER BY attr_range;')
            all_attr = cur.fetchall()
            # candidate2 = dict()
            candidate2 = []
            for relate in all_attr:
                candidate2.append(relate['attr'])
                # candidate2[relate['attr']] = int(relate["attr_range"])
            if len(candidate2) > 0:
                default_attr["branch"] = candidate2[-1]
            else:
                default_attr["branch"] = candidate1[-1]
                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchone()
                default_attr["bside"] = all_attr['attr']

        elif len(candidate1) == 1:
            default_attr["trunk"] = candidate1[0]

            cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and attr_range >= 20 and dataset="' + data_table + '" and `alter_info`="1" and `type`="numerical" ORDER BY attr_range;')
            all_attr = cur.fetchall()
            # candidate2 = dict()
            candidate2 = []
            for relate in all_attr:
                candidate2.append(relate['attr'])
                # candidate2[relate['attr']] = int(relate["attr_range"])
            if len(candidate2) > 1:
                default_attr["bside"] = candidate2[0]
                default_attr["branch"] = candidate2[-1]
            elif len(candidate2) > 0:
                default_attr["branch"] = candidate2[-1]

                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchall()
                # candidate3 = dict()
                candidate3 = []
                # max_group3 = 0
                for relate in all_attr:
                    # max_group3 = int(relate["attr_range"])
                    candidate3.append(relate['attr'])
                    # candidate3[relate['attr']] = int(relate["attr_range"])
                if len(candidate3) > 0:
                    default_attr["bside"] = candidate3[0]
            else:
                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchall()
                # candidate3 = dict()
                candidate3 = []
                # max_group3 = 0
                for relate in all_attr:
                    # max_group3 = int(relate["attr_range"])
                    candidate3.append(relate['attr'])
                    # candidate3[relate['attr']] = int(relate["attr_range"])
                if len(candidate3) > 0:
                    default_attr["bside"] = candidate3[0]
                    default_attr["branch"] = candidate3[-1]

        elif len(candidate1) == 0:
            cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and attr_range >= 20 and dataset="' + data_table + '" and `alter_info`="1" and `type`="numerical" ORDER BY attr_range;')
            all_attr = cur.fetchall()
            # candidate2 = dict()
            candidate2 = []
            for relate in all_attr:
                candidate2.append(relate['attr'])
                # candidate2[relate['attr']] = int(relate["attr_range"])
            if len(candidate2) > 2:
                default_attr["trunk"] = candidate2[0]
                default_attr["bside"] = candidate2[1]
                default_attr["branch"] = candidate2[-1]
            elif len(candidate2) == 2:
                default_attr["trunk"] = candidate2[0]
                default_attr["branch"] = candidate2[-1]
                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchall()
                # candidate3 = dict()
                candidate3 = []
                # max_group3 = 0
                for relate in all_attr:
                    # max_group3 = int(relate["attr_range"])
                    candidate3.append(relate['attr'])
                if len(candidate3) > 0:
                    default_attr["bside"] = candidate2[1]
            elif len(candidate2) == 1:
                default_attr["trunk"] = candidate2[0]
                # default_attr["branch"] = candidate2[1]
                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchall()
                # candidate3 = dict()
                candidate3 = []
                # max_group3 = 0
                for relate in all_attr:
                    # max_group3 = int(relate["attr_range"])
                    candidate3.append(relate['attr'])
                if len(candidate3) > 0:
                    default_attr["bside"] = candidate3[0]
                    default_attr["branch"] = candidate3[-1]
            else:
                cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" and dataset="' + data_table + '" and `alter_info`is NULL and (`type`="numerical" or `type`="categorical") ORDER BY attr_range;')
                all_attr = cur.fetchall()
                # candidate3 = dict()
                candidate3 = []
                # max_group3 = 0
                for relate in all_attr:
                    # max_group3 = int(relate["attr_range"])
                    candidate3.append(relate['attr'])
                if len(candidate3) > 0:
                    default_attr["trunk"] = candidate3[0]
                    default_attr["bside"] = candidate3[1]
                    default_attr["branch"] = candidate3[-1]

        default_attr["fruit_size"] = "none"

        default_attr["leaf_color"] = "none"
        default_attr["leaf_size"] = "none"
        default_attr["root"] = "none"
        default_attr["highlight"] = "none"

        print "======", default_attr
        final_return.append(default_attr)

        # get all the information for the attributes
        # cur = db.query('SELECT * FROM dataset_collection WHERE attr!="dataset" and dataset="' + data_table + '";')
        cur = db.query('SELECT * FROM dataset_collection WHERE dataset="' + data_table + '";')
        attr_info = cur.fetchall()
        for info in attr_info:
            detail_array = []
            if info['type'] == "boolean" or info['type'] == "categorical" or info['attr_range'] < 20:
                infocur = db.query('SELECT DISTINCT(`' + info['attr'] + '`) FROM ' + data_table + ' WHERE `' + info['attr'] + '` != "" ORDER BY(`' + info['attr'] + '`);')
                attr_detail = infocur.fetchall()
                if info['min'].isdigit():
                    for d in attr_detail:
                        detail_array.append(int(d[info['attr']]))  
                    detail_array.sort(key=int)
                else:
                    for d in attr_detail:
                        detail_array.append(d[info['attr']]) 
                
            elif info['type'] == "numerical":
                detail_array = [">", "<=", "="]

            cmpt_attr[info['attr']] = [detail_array, info['min'], info['max'], info['attr_range'], info['alter_info'], info['type']]

        final_return.append(cmpt_attr)

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

    root = attr['root']
    stick = alterid_index
    
    # leaf_id = attr['highlight']
    # leaf_id = "ctree_highlight"
    # f_size = fruit_size_index
    # l_size = leaf_size_index
    # l_color = leaf_color_index

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

    if root != "none":
        structure["root"] = []
        structure["root"].append({})

    empty_structure = copy.deepcopy(structure)
    count_miss = 0
    for meeting in all_data:
        check_none = 0
        for a in range(10):
            if meeting[a] == -100:
                check_none += 1
        if check_none > 0:
            count_miss += 1
            # print meeting
            continue
        
        # meeting = c
        if root != "none":
            if meeting[root_index] not in structure["root"][0]:
                structure["root"][0][meeting[root_index]] = dict()
                structure["root"][0][meeting[root_index]]["length"] = 0
                structure["root"][0][meeting[root_index]]["sub"] = [10 for i in range(12)] # may add attribute mapping
                structure["root"][0][meeting[root_index]]["root_cat"] = meeting[root_index]
                # print structure["root"]
            else:
                structure["root"][0][meeting[root_index]]["length"] += 1

        leaf_highlights = meeting[highlight_index]
        # left
        if meeting[trunk_index] == 0:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting[branch_index] == l and meeting[bside_index] == 1:
                    if len(alter_array_left_up[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        alter_array_left_up[level].append(meeting[stick])

                    else:
                        count_alter = 0
                        for a in alter_array_left_up[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_left_up[level].append(meeting[stick])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break

                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        alter_array_left_down[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_left_down[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left_down[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_left_down[level].append(meeting[stick])
                        else:
                            structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                level += 1
        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting[branch_index] == l and meeting[bside_index] == 1:
                    if len(alter_array_right_up[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        alter_array_right_up[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right_up[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_right_up[level].append(meeting[stick])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        alter_array_right_down[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right_down[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_right_down[level].append(meeting[stick])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                level += 1

    # if empty_structure == structure:
    #     structure = "error"
    print "***", count_miss
    return structure



def duplicate_stick(all_data, attr, branch_layer):
    structure = dict()
    # print stick_unique
    structure["right"] = []
    structure["left"] = []

    root = attr['root']
    stick = alterid_index
    # leaf_id = attr['highlight']
    # leaf_id = "ctree_highlight"

    alter_array_right = []
    alter_array_left = []
    for total in range(branch_layer):
        structure["right"].append({"level": {"up": [], "down": []}})
        structure["left"].append({"level": {"up": [], "down": []}})
        alter_array_right.append([])
        alter_array_left.append([])

    if root != "none":
        structure["root"] = []
        structure["root"].append({})

    empty_structure = copy.deepcopy(structure)
    count_miss = 0
    for meeting in all_data:
        check_none = 0
        for a in range(10):
            if meeting[a] == -100:
                check_none += 1
        if check_none > 0:
            count_miss += 1
            # print meeting
            continue
        
        # meeting = c
        if root != "none":
            if meeting[root_index] not in structure["root"][0]:
                structure["root"][0][meeting[root_index]] = dict()
                structure["root"][0][meeting[root_index]]["length"] = 0
                structure["root"][0][meeting[root_index]]["sub"] = [10 for i in range(12)] # may add attribute mapping
                structure["root"][0][meeting[root_index]]["root_cat"] = meeting[root_index]
                # print structure["root"]
            else:
                structure["root"][0][meeting[root_index]]["length"] += 1

        leaf_highlights = meeting[highlight_index]
        # left
        if meeting[trunk_index] == 0:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting[branch_index] == l and meeting[bside_index] == 1:
                    if len(alter_array_left[level]) == 0:
                        structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["left"][level]["level"]["up"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        structure["left"][level]["level"]["down"].append({})
                        alter_array_left[level].append(meeting[stick])

                    else:
                        count_alter = 0
                        for a in alter_array_left[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["left"][level]["level"]["down"].append({})
                            alter_array_left[level].append(meeting[stick])
                        else:
                            if is_empty(structure["left"][level]["level"]["up"][new_alter]):
                                structure["left"][level]["level"]["up"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []}
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                            # structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break

                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_left[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["left"][level]["level"]["down"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        structure["left"][level]["level"]["up"].append({})
                        alter_array_left[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_left[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["left"][level]["level"]["up"].append({})
                            alter_array_left[level].append(meeting[stick])
                        else:
                            if is_empty(structure["left"][level]["level"]["down"][new_alter]):
                                structure["left"][level]["level"]["down"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []}
                                structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["left"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                level += 1
        # right
        else:
            level = 0
            new_alter = -1
            for l in range(branch_layer):
                # level and up
                if meeting[branch_index] == l and meeting[bside_index] == 1:
                    if len(alter_array_right[level]) == 0:
                        structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["right"][level]["level"]["up"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        structure["right"][level]["level"]["down"].append({})
                        alter_array_right[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["right"][level]["level"]["down"].append({})
                            alter_array_right[level].append(meeting[stick])
                        else:
                            if is_empty(structure["right"][level]["level"]["up"][new_alter]):
                                structure["right"][level]["level"]["up"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []}
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                                
                            # structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_right[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                        structure["right"][level]["level"]["down"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                        structure["right"][level]["level"]["up"].append({})
                        alter_array_right[level].append(meeting[stick])
                    else:
                        count_alter = 0
                        for a in alter_array_right[level]:
                            if meeting[stick] == a:
                                new_alter = count_alter
                                break
                            count_alter += 1
                        if new_alter == -1:
                            structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["right"][level]["level"]["up"].append({})
                            alter_array_right[level].append(meeting[stick])
                        else:
                            if is_empty(structure["right"][level]["level"]["down"][new_alter]):
                                structure["right"][level]["level"]["down"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "leaf": []}
                                structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                                
                    break
                level += 1

    # if empty_structure == structure:
    #     structure = "error"
    print "***", count_miss
    return structure


################################### local cache #######################################
def insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, ego_group):
    # print "insert_default_mapping"    
    db = DB()
    binary_index = dict()
    branch_order_index = []
    reorder = []
    data_table = table.split("_of_")[1]
    session = table.split("_of_")[0]

    attr_idx = []
    attr_name = []
    index_found = 1
    index_list = 10
    unused_col = {"e_id":1, "egoid":1, "alterid":1, "ctree_branch":1, "ctree_trunk":1, "ctree_bside":1, "ctree_leaf_color":1, "ctree_leaf_size":1, "ctree_fruit_size":1, "ctree_root":1 }
    # check to create data index
    with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
        dataset_index = json.load(json_file)
    if data_table not in dataset_index:
        dataset_index[data_table] = {}
        index_found = 0
    else:
        for col in dataset_index[data_table]:
            attr_idx.append(dataset_index[data_table][col])
            attr_name.append(col)
        index_list += len(attr_idx)

    # if data_table not in user_ctree_data[session]:
    #     user_ctree_data[session][data_table] = dict()
    #     user_ctree_data[session][data_table]["layer_" + ego_group] = -1
    if data_table not in user_ctree_data[session]:
        user_ctree_data[session][data_table] = {"layer_" + ego_group: -1}
    
    # pre store dataset_collection query
    attr_detail = dict()
    for compt in attr: 
        attr_detail[compt] = dict() 
        if attr[compt] != 'none':
            cur = db.query('SELECT * FROM dataset_collection WHERE dataset="' + data_table + '" and attr="' + attr[compt] + '";')
            attr_detail[compt] = cur.fetchone()
    
    dataset = "all"
    layer_count = []
    if ("layer_" + ego_group) in user_ctree_data[session][data_table]:
        last_layer = user_ctree_data[session][data_table]["layer_" + ego_group]
    else:
        user_ctree_data[session][data_table]["layer_" + ego_group] = -1
        last_layer = -1

    for d in all_data:
        if index_found == 0:
            for col in d:
                print col
                # if col == "e_id" or col == "egoid" or col == "alterid" or col == "ctree_branch" or col == "ctree_trunk" or col == "ctree_bside" or col == "ctree_leaf_color" or col == "ctree_leaf_size" or col == "ctree_fruit_size" or col == "ctree_root":
                if col in unused_col:
                    continue
                dataset_index[data_table][col] = index_list
                attr_idx.append(index_list)
                attr_name.append(col)
                index_list += 1
            index_found = 1

        if ego_group != "all":
            dataset = d["dataset"]
        record_label = str(d['egoid']) + "_of_" + dataset

        if record_label not in user_ctree_data[session][data_table]:
            # user_ctree_data[session][data_table]["layer_" + ego_group] = -1
            user_ctree_data[session][data_table][record_label] = dict() 
            user_ctree_data[session][data_table][record_label]["record"] = []
            user_ctree_data[session][data_table][record_label]["done"] = -1
        
        elif user_ctree_data[session][data_table][record_label]["done"] == 1:
            return
        
        elif user_ctree_data[session][data_table][record_label]["done"] == 0: # has record but not being updated yet
            # user_ctree_data[session][data_table]["layer_" + ego_group] = -1
            user_ctree_data[session][data_table][record_label]["record"] = []
            user_ctree_data[session][data_table][record_label]["done"] = -1

        # ctree_record = [-100 for i in range(10)]
        ctree_record = [-100 for i in range(index_list)]
        for myindex in range(len(attr_idx)):
            ctree_record[attr_idx[myindex]] = d[attr_name[myindex]]

        ctree_record[egoid_index] = d['egoid']
        ctree_record[alterid_index] = d['alterid']
        for compt in attr:
            if attr[compt] != 'none' and d[attr[compt]] is None:
                continue        
            collecting_data = attr_detail[compt]  
            
            if compt == 'trunk' or compt == 'bside':
                if compt == 'trunk':
                    record_index = trunk_index
                else:
                    record_index = bside_index
                if compt in mapping:
                    if collecting_data["type"] == "numerical":
                        if float(d[attr[compt]]) <= float(mapping[compt]["0"][0]):
                            ctree_record[record_index] = 0
                        else:
                            ctree_record[record_index] = 1
                    
                    else:
                        if str(d[attr[compt]]) in str(mapping[compt]["0"]):
                            ctree_record[record_index] = 0
                        else:
                            ctree_record[record_index] = 1       

                else:
                    if str(collecting_data["type"]) == "numerical":
                        mid = math.floor((float(collecting_data['max']) + float(collecting_data['min']))*0.5)
                        if float(d[attr[compt]]) <= float(mid):
                            ctree_record[record_index] = 0
                        else:
                            ctree_record[record_index] = 1
                    else:
                        if compt in binary_index:
                            if binary_index[compt].index(d[attr[compt]]) < (len(binary_index[compt])*0.5):
                                ctree_record[record_index] = 0
                            else:
                                ctree_record[record_index] = 1

                        else:
                            binary_index[compt] = []
                            precur = db.query('SELECT DISTINCT(' + attr[compt] + ') FROM ' + data_table + ' ORDER BY(' + attr[compt] + ');')
                            real_data = precur.fetchall()
                            for dist_d in real_data:
                                binary_index[compt].append(dist_d[attr[compt]])

                            if binary_index[compt].index(d[attr[compt]]) < (len(binary_index[compt])*0.5):
                                ctree_record[record_index] = 0
                            else:
                                ctree_record[record_index] = 1


            elif compt == 'fruit_size' or compt == 'leaf_size' or compt == 'leaf_color' or compt == 'branch' or compt == 'root':
                if attr[compt] == "none":
                    if compt == 'fruit_size':
                        ctree_record[fruit_size_index] = 0
                    elif compt == 'leaf_size':
                        ctree_record[leaf_size_index] = 3
                    elif compt == 'leaf_color':
                        ctree_record[leaf_color_index] = 3
                    elif compt == 'root':
                        ctree_record[root_index] = 3
                    
                else:
                    # set comp index for ctree record
                    if compt == 'fruit_size':
                        record_index = fruit_size_index
                    elif compt == 'leaf_size':
                        record_index = leaf_size_index
                    elif compt == 'leaf_color':
                        record_index = leaf_color_index
                    elif compt == 'branch':
                        record_index = branch_index
                    elif compt == 'root':
                        record_index = root_index

                    if compt in mapping:
                        if collecting_data["type"] == "categorical" or collecting_data["type"] == "boolean":
                            for cat in mapping[compt]:
                                if d[attr[compt]] == cat:
                                    ctree_record[record_index] = int(mapping[compt][cat])
                                    if compt == 'branch':
                                        layer_count.append(mapping[compt][cat])                                    
                                    break
                        else:
                            if compt == 'branch' and layer_count == []:
                                layer_count.append(len(mapping[compt])+1)
                            if compt == 'branch' and mapping[compt][1] < mapping[compt][0]: # for the revert mapping
                                if float(d[attr[compt]]) >= float(mapping[compt][0]):
                                    ctree_record[record_index] = 0
                                                                                                         
                                elif float(d[attr[compt]]) <= float(mapping[compt][-1]):
                                    ctree_record[record_index] = len(mapping)
                                                                        
                                else:
                                    for order in range(len(mapping[compt])-2, -1, -1):
                                        if float(d[attr[compt]]) <= float(mapping[compt][order]) and float(d[attr[compt]]) > float(mapping[compt][order+1]):
                                            ctree_record[record_index] = (order+1)
                                            break
                            elif compt == 'branch' or compt == 'leaf_color' or compt == 'root': # for general mapping
                                if float(d[attr[compt]]) <= float(mapping[compt][0]):
                                    ctree_record[record_index] = 0

                                elif float(d[attr[compt]]) >= float(mapping[compt][-1]):
                                    ctree_record[record_index] = len(mapping)
                                
                                else:
                                    for order in range(1, len(mapping[compt])):
                                        if float(d[attr[compt]]) > float(mapping[compt][order-1]) and float(d[attr[compt]]) <= float(mapping[compt][order]):
                                            ctree_record[record_index] = order
                                            break
                            else: # special for size mapping
                                size_map = mapping[compt][1]
                                val_map = mapping[compt][0]

                                if float(d[attr[compt]]) <= float(val_map[0]):
                                    ctree_record[record_index] = int(size_map[0])
                                    
                                elif float(d[attr[compt]]) >= float(val_map[-1]):
                                    ctree_record[record_index] = int(size_map[len(val_map)])
                                    
                                else:
                                    for order in range(1, len(val_map)):
                                        if float(d[attr[compt]]) > float(val_map[order-1]) and float(d[attr[compt]]) <= float(val_map[order]):
                                            ctree_record[record_index] = int(size_map[order])
                                            break
  
                    else: # only branch will have default mapping
                        if collecting_data["type"] == "numerical":
                            if len(reorder) == 0:
                                gap = collecting_data['attr_range']/9.0
                                g = float(collecting_data["min"])
                                while g <= float(collecting_data["max"]):
                                    reorder.append(round(g, 2))
                                    g += gap
                               
                                if len(reorder) < 9:
                                    reorder.append(collecting_data["max"])
                                layer_count = [10]
                            if int(d[attr[compt]]) <= reorder[0]:
                                ctree_record[record_index] = 0

                            elif int(d[attr[compt]]) >= reorder[-1]:
                                ctree_record[record_index] = len(reorder)
                            else:
                                for order in range(1, len(reorder)):
                                    if int(d[attr[compt]]) > reorder[order-1] and int(d[attr[compt]]) <= reorder[order]:
                                        ctree_record[record_index] = order                                        
                                        break
                        else:
                            if len(branch_order_index) == 0:
                                precur = db.query('SELECT DISTINCT(' + attr[compt] + ') FROM ' + data_table + ' ORDER BY(' + attr[compt] + ');')
                                real_data = precur.fetchall()
                                for dist_d in real_data:
                                    branch_order_index.append(dist_d[attr[compt]])
                            
                            ctree_record[record_index] = branch_order_index.index(d[attr[compt]])
                            layer_count.append(branch_order_index.index(d[attr[compt]]))
                                                                           

            elif compt == 'highlight':
                if attr[compt] == "none":
                    ctree_record[highlight_index] = "none"
                else:
                    ctree_record[highlight_index] = d[attr[compt]]
            
        user_ctree_data[session][data_table][record_label]["record"].append(ctree_record)

    # if user_ctree_data[session][data_table]["layer_" + ego_group] == -1:
    if len(layer_count) != 0 and max(layer_count) != last_layer:
        user_ctree_data[session][data_table]["layer_" + ego_group] = max(layer_count)

    for label in user_ctree_data[session][data_table]:
        if "layer" not in label and user_ctree_data[session][data_table][label]["done"] == -1:
            user_ctree_data[session][data_table][label]["done"] = 1

    index_json = simplejson.dumps(dataset_index, indent=4, use_decimal=True)
    with open("./contact_tree/data/dataset_index.json", "wb") as json_file:
       json_file.write(index_json)

def restore_ctree_mapping(user_ctree_data, ego_list, table, attr, mapping, group):
    data_table = table.split("_of_")[1]
    session = table.split("_of_")[0]
    last_use_ego = {session: {data_table: {}}}

    for label in user_ctree_data[session][data_table]:
        data_info = user_ctree_data[session][data_table][label]
        if "layer" in label:
            if label == "layer_" + group:
                last_use_ego[session][data_table][label] = data_info
            continue
       
        ego = label.split("_of_")[0]
        dataset = label.split("_of_")[1]
        if group != "all" and dataset == "all":
            continue
        if group == "all" and dataset != "all":
            continue
        if ego in ego_list:   
            last_use_ego[session][data_table][label] = data_info
        # print data_info
    return last_use_ego

def update_binary(request):
    db = DB()
    if request.GET.get('update'):
        list_request = request.GET['update'].split(":=")[0].split(":-")
        select_ego = request.GET['update'].split(":=")[1:]
    
        table = list_request[2]
        ori_column = list_request[4]
        new_column = list_request[3]
        attr = list_request[1]
        group = list_request[0]
        zero_val = list_request[5:]
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]
        
        ego_info = dict()

        with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
            dataset_index = json.load(json_file)
        ori_col_index = dataset_index[data_table][ori_column]

        if new_column == "ctree_trunk":
            new_col_index = trunk_index
        elif new_column == "ctree_bside":
            new_col_index = bside_index

        with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
            user_ctree_data = json.load(json_file)

        # update_ctree_data = {session: {data_table: {}}}

        if len(select_ego) == 0:
            user_ctree_data[session][data_table] = dict()
            # user_ctree_data[session][data_table]["layer_" + group] = -1
            # for label in user_ctree_data[session][data_table]:
            #     data_info = user_ctree_data[session][data_table][label]
            #     if "layer" in label:
            #         continue
            #     data_info["done"] = 0
            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            return_json = simplejson.dumps({}, indent=4, use_decimal=True)
            return HttpResponse(return_json)

        typecur = db.query('SELECT `type` FROM dataset_collection WHERE dataset= "' + data_table + '" and attr="' + ori_column + '";')
        mytype = typecur.fetchone()["type"]

        if mytype == "categorical" or mytype == "boolean":
            # zero_val = set(zero_val)
            hash_zero_table = dict()
            for z_val in zero_val:
                hash_zero_table[z_val] = 0
            for label in user_ctree_data[session][data_table]:
                data_info = user_ctree_data[session][data_table][label]
                if "layer" in label:
                    # update_ctree_data[session][data_table][label] = data_info
                    continue
                ego = label.split("_of_")[0]
                dataset = label.split("_of_")[1]
                if group != "all" and dataset == "all":
                    data_info["done"] = 0
                    continue
                if group == "all" and dataset != "all":
                    data_info["done"] = 0
                    continue
                if ego in select_ego:
                    if ego not in ego_info:
                        ego_info[ego] = []
                        ego_info[ego].append(dataset)
                    else:
                        if dataset not in ego_info[ego]:
                            ego_info[ego].append(dataset)
                    # update_ctree_data[session][data_table][label] = dict()
                    # if "record" not in update_ctree_data[session][data_table][label]: 
                    #     update_ctree_data[session][data_table][label]["record"] = []
                    for record in data_info["record"]:
                        if record[ori_col_index] == None:
                            record[new_col_index] = -100
                            continue
                        if record[ori_col_index] in hash_zero_table:
                            record[new_col_index] = 0
                        else:
                            record[new_col_index] = 1
                        # update_ctree_data[session][data_table][label]["record"].append(record)
                else:
                    data_info["done"] = 0            
        else:
            z_val = zero_val[0]
            for label in user_ctree_data[session][data_table]:
                data_info = user_ctree_data[session][data_table][label]
                if "layer" in label:
                    continue
                ego = label.split("_of_")[0]
                dataset = label.split("_of_")[1]
                if group != "all" and dataset == "all":
                    data_info["done"] = 0
                    continue
                if group == "all" and dataset != "all":
                    data_info["done"] = 0
                    continue
                if ego in select_ego:
                    if ego not in ego_info:
                        ego_info[ego] = []
                        ego_info[ego].append(dataset)
                    else:
                        if dataset not in ego_info[ego]:
                            ego_info[ego].append(dataset)

                    for record in data_info["record"]:
                        if record[ori_col_index] == None:
                            record[new_col_index] = -100
                            continue
                        if float(record[ori_col_index]) <= float(z_val):
                            record[new_col_index] = 0
                        else:
                            record[new_col_index] = 1
                else:
                    data_info["done"] = 0
    else:
        raise Http404
    
    # restructure_info = update_default_mapping(user_ctree_data, select_ego, table, new_column, group)

    structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
    return_json = one_contact_structure(user_ctree_data, structure_request)

    user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
    with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
        json_file.write(user_ctree_data_json)

    return HttpResponse(return_json)

def update_layer(request):
    db = DB()
    if request.GET.get('update'):
        list_request = request.GET['update'].split(":=")[0].split(":-")
        select_ego = request.GET['update'].split(":=")[1:]
        
        table = list_request[2]
        ori_column = list_request[4]
        new_column = list_request[3]
        attr = list_request[1]
        group = list_request[0]
        val_map = json.loads(list_request[5])
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]

        if new_column == "ctree_branch":
            new_col_index = branch_index
        elif new_column == "ctree_fruit_size":
            new_col_index = fruit_size_index
        elif new_column == "ctree_leaf_size":
            new_col_index = leaf_size_index
        elif new_column == "ctree_leaf_color":
            new_col_index = leaf_color_index
        elif new_column == "ctree_root":
            new_col_index = root_index

        ego_info = dict()

        with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
            user_ctree_data = json.load(json_file)

        if len(select_ego) == 0:
            user_ctree_data[session][data_table] = dict()
            # user_ctree_data[session][data_table]["layer_" + group] = -1
            # for label in user_ctree_data[session][data_table]:
            #     data_info = user_ctree_data[session][data_table][label]
            #     if "layer" in label:
            #         continue
            #     data_info["done"] = 0
            return_json = simplejson.dumps({}, indent=4, use_decimal=True)
            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            return HttpResponse(return_json)

        
        if ori_column == "none":
            for label in user_ctree_data[session][data_table]:
                data_info = user_ctree_data[session][data_table][label]
                if "layer" in label:
                    continue
                ego = label.split("_of_")[0]
                dataset = label.split("_of_")[1]
                if group != "all" and dataset == "all":
                    data_info["done"] = 0
                    continue
                if group == "all" and dataset != "all":
                    data_info["done"] = 0
                    continue
                if ego in select_ego:
                    if ego not in ego_info:
                        ego_info[ego] = []
                        ego_info[ego].append(dataset)
                    else:
                        if dataset not in ego_info[ego]:
                            ego_info[ego].append(dataset)

                    for record in data_info["record"]:
                        if new_column == 'ctree_fruit_size':
                            record[new_col_index] = 0
                        else:
                            record[new_col_index] = 3
                else:
                    data_info["done"] = 0

            structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
            return_json = one_contact_structure(user_ctree_data, structure_request)

            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            
            return HttpResponse(return_json)

        with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
            dataset_index = json.load(json_file)
        ori_col_index = dataset_index[data_table][ori_column]
        
        
        typecur = db.query('SELECT `attr_range`, `type` FROM dataset_collection WHERE dataset= "' + data_table + '" and attr="' + ori_column + '";')
        myinfo = typecur.fetchone()
        mytype = myinfo["type"]
        myrange = myinfo["attr_range"]

        if mytype == "categorical" or mytype == "boolean":
            hash_val_table = dict()
            for ori_val in val_map:
                hash_val_table[str(ori_val)] = int(val_map[ori_val])

            for label in user_ctree_data[session][data_table]:
                data_info = user_ctree_data[session][data_table][label]
                if "layer" in label:
                    if new_column == "ctree_branch" and label == ("layer_" + group):
                        user_ctree_data[session][data_table][label] = len(val_map)
                    continue
                ego = label.split("_of_")[0]
                dataset = label.split("_of_")[1]
                if group != "all" and dataset == "all":
                    data_info["done"] = 0
                    continue
                if group == "all" and dataset != "all":
                    data_info["done"] = 0
                    continue
                if ego in select_ego:
                    if ego not in ego_info:
                        ego_info[ego] = []
                        ego_info[ego].append(dataset)
                    else:
                        if dataset not in ego_info[ego]:
                            ego_info[ego].append(dataset)

                    for record in data_info["record"]:
                        if record[ori_col_index] == None:
                            record[new_col_index] = -100
                            continue
                        # if record[ori_col_index] in hash_val_table:
                        record[new_col_index] = hash_val_table[record[ori_col_index]]
                        
                else:
                    data_info["done"] = 0
            structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
            return_json = one_contact_structure(user_ctree_data, structure_request)

            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            
            return HttpResponse(return_json)

        else:
            if new_column == 'ctree_branch' and val_map[1] < val_map[0]:
                for label in user_ctree_data[session][data_table]:
                    data_info = user_ctree_data[session][data_table][label]
                    if "layer" in label:
                        if label == ("layer_" + group):
                            user_ctree_data[session][data_table][label] = len(val_map)+1
                        continue
                    ego = label.split("_of_")[0]
                    dataset = label.split("_of_")[1]
                    if group != "all" and dataset == "all":
                        data_info["done"] = 0
                        continue
                    if group == "all" and dataset != "all":
                        data_info["done"] = 0
                        continue
                    if ego in select_ego:
                        if ego not in ego_info:
                            ego_info[ego] = []
                            ego_info[ego].append(dataset)
                        else:
                            if dataset not in ego_info[ego]:
                                ego_info[ego].append(dataset)

                        for record in data_info["record"]:
                            if record[ori_col_index] == None:
                                record[new_col_index] = -100
                                continue
                            if float(record[ori_col_index]) <= float(val_map[-1]):
                                record[new_col_index] = len(val_map)
                                continue
                            if float(record[ori_col_index]) >= float(val_map[0]):
                                record[new_col_index] = 0
                                continue
                            for layer_order in range(len(val_map)-2, -1, -1):
                                if float(val_map[layer_order+1]) < float(record[ori_col_index]) <= float(val_map[layer_order]):
                                    record[new_col_index] = layer_order+1
                                    break                                        
                    else:
                        data_info["done"] = 0
                    
            elif new_column == 'ctree_branch' or new_column == 'ctree_leaf_color' or new_column == 'ctree_root':
                for label in user_ctree_data[session][data_table]:
                    data_info = user_ctree_data[session][data_table][label]
                    if "layer" in label:
                        if new_column == "ctree_branch" and label == ("layer_" + group):
                            user_ctree_data[session][data_table][label] = len(val_map)+1
                        continue
                    ego = label.split("_of_")[0]
                    dataset = label.split("_of_")[1]
                    if group != "all" and dataset == "all":
                        data_info["done"] = 0
                        continue
                    if group == "all" and dataset != "all":
                        data_info["done"] = 0
                        continue
                    if ego in select_ego:
                        if ego not in ego_info:
                            ego_info[ego] = []
                            ego_info[ego].append(dataset)
                        else:
                            if dataset not in ego_info[ego]:
                                ego_info[ego].append(dataset)

                        for record in data_info["record"]:
                            if record[ori_col_index] == None:
                                record[new_col_index] = -100
                                continue
                            if float(record[ori_col_index]) <= float(val_map[0]):
                                record[new_col_index] = 0
                                continue
                            if float(record[ori_col_index]) >= float(val_map[-1]):
                                record[new_col_index] = len(val_map)
                                continue
                            for layer_order in range(len(val_map)-1):
                                if float(val_map[layer_order]) < float(record[ori_col_index]) <= float(val_map[layer_order+1]):
                                    record[new_col_index] = layer_order+1
                                    break 
                    else:
                        data_info["done"] = 0

            else: # for size mapping
                size_map = json.loads(list_request[6])
                for label in user_ctree_data[session][data_table]:
                    data_info = user_ctree_data[session][data_table][label]
                    if "layer" in label:
                        continue
                    ego = label.split("_of_")[0]
                    dataset = label.split("_of_")[1]
                    if group != "all" and dataset == "all":
                        data_info["done"] = 0
                        continue
                    if group == "all" and dataset != "all":
                        data_info["done"] = 0
                        continue
                    if ego in select_ego:
                        if ego not in ego_info:
                            ego_info[ego] = []
                            ego_info[ego].append(dataset)
                        else:
                            if dataset not in ego_info[ego]:
                                ego_info[ego].append(dataset)

                        for record in data_info["record"]:
                            if record[ori_col_index] == None:
                                record[new_col_index] = -100
                                continue
                            if float(record[ori_col_index]) <= float(val_map[0]):
                                record[new_col_index] = int(size_map[0])
                                continue
                            if float(record[ori_col_index]) >= float(val_map[-1]):
                                record[new_col_index] = int(size_map[-1])
                                continue
                            for layer_order in range(len(val_map)-1):
                                if float(val_map[layer_order]) < float(record[ori_col_index]) <= float(val_map[layer_order+1]):
                                    record[new_col_index] = int(size_map[layer_order+1])         
                    else:
                        data_info["done"] = 0

            structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
            return_json = one_contact_structure(user_ctree_data, structure_request)

            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            
            return HttpResponse(return_json)         
        
    else:
        raise Http404

def update_highlight(request):
    db = DB()

    if request.GET.get('update'):
        list_request = request.GET['update'].split(":=")[0].split(":-")
        select_ego = request.GET['update'].split(":=")[1:]
        table = list_request[2]
        ori_column = list_request[4]
        new_column = list_request[3]
        attr = list_request[1]
        group = list_request[0]
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]

        ego_info = dict()

        with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
            user_ctree_data = json.load(json_file)

        if len(select_ego) == 0:
            user_ctree_data[session][data_table] = dict()
            # user_ctree_data[session][data_table]["layer"] = -1
            # for label in user_ctree_data[session][data_table]:
            #     data_info = user_ctree_data[session][data_table][label]
            #     if "layer" in label:
            #         continue
            #     data_info["done"] = 0
            return_json = simplejson.dumps({}, indent=4, use_decimal=True)
            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            return HttpResponse(return_json)
        
        if ori_column == "none":
            for label in user_ctree_data[session][data_table]:
                data_info = user_ctree_data[session][data_table][label]
                if "layer" in label:
                    continue
                ego = label.split("_of_")[0]
                dataset = label.split("_of_")[1]
                if group != "all" and dataset == "all":
                    data_info["done"] = 0
                    continue
                if group == "all" and dataset != "all":
                    data_info["done"] = 0
                    continue
                if ego in select_ego:
                    if ego not in ego_info:
                        ego_info[ego] = []
                        ego_info[ego].append(dataset)
                    else:
                        if dataset not in ego_info[ego]:
                            ego_info[ego].append(dataset)

                    for record in data_info["record"]:
                        record[highlight_index] = "none"
                else:
                    data_info["done"] = 0

            structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
            return_json = one_contact_structure(user_ctree_data, structure_request)

            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)
            
            return HttpResponse(return_json)

        with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
            dataset_index = json.load(json_file)
        ori_col_index = dataset_index[data_table][ori_column]
        

        for label in user_ctree_data[session][data_table]:
            data_info = user_ctree_data[session][data_table][label]
            if "layer" in label:
                continue
            ego = label.split("_of_")[0]
            dataset = label.split("_of_")[1]
            if group != "all" and dataset == "all":
                data_info["done"] = 0
                continue
            if group == "all" and dataset != "all":
                data_info["done"] = 0
                continue
            if ego in select_ego:
                if ego not in ego_info:
                    ego_info[ego] = []
                    ego_info[ego].append(dataset)
                else:
                    if dataset not in ego_info[ego]:
                        ego_info[ego].append(dataset)

                for record in data_info["record"]:
                    if record[ori_col_index] == None:
                        record[highlight_index] = -100
                        continue
                    record[highlight_index] = record[ori_col_index]    
            else:
                data_info["done"] = 0

        structure_request = attr + ":-" + group + ":-" + simplejson.dumps(ego_info, use_decimal=True) + ":-" + table
        return_json = one_contact_structure(user_ctree_data, structure_request)

        user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
        with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
            json_file.write(user_ctree_data_json)
        
        return HttpResponse(return_json)
        

    else:
        raise Http404

   

def one_contact_structure(user_ctree_data, structure_request):
    final_structure = dict()
    db = DB()
    
    list_request = structure_request.split(":-")
    attr = json.loads(list_request[0])
    ego_info = json.loads(list_request[2])
    ego_group = list_request[1]
    table = list_request[3]
    data_table = table.split("_of_")[1]
    session = table.split("_of_")[0]

    cur = db.query('SELECT `alter_info` FROM dataset_collection WHERE dataset= "' + data_table + '" and attr="' + attr['bside'] + '";')
    stick_unique = cur.fetchone()["alter_info"]
    
    if ego_group == "all":
        final_structure["all"] = dict()
        branch_layer = user_ctree_data[session][data_table]["layer_"+ego_group] + 1
        for e in ego_info:
            record_label = e + "_of_" + ego_group
            all_data = user_ctree_data[session][data_table][record_label]["record"]
            
            if stick_unique == '1':
                # print "in_unique"
                one_structure = unique_stick(all_data, attr, branch_layer)

            else:
                # print "in_duplicate"
                one_structure = duplicate_stick(all_data, attr, branch_layer)

            final_structure["all"][e] = one_structure

    else:
        branch_layer = user_ctree_data[session][data_table]["layer_"+ego_group] + 1
        for e in ego_info:
            for sub in ego_info[e]:
                record_label = e + "_of_" + sub
                if record_label not in user_ctree_data[session][data_table]:
                    continue
                all_data = user_ctree_data[session][data_table][record_label]["record"]

                if stick_unique == '1':
                    # print "in_unique"
                    one_structure = unique_stick(all_data, attr, branch_layer)

                else:
                    # print "in_duplicate"
                    one_structure = duplicate_stick(all_data, attr, branch_layer)
                if sub not in final_structure:
                    final_structure[sub] = dict()
                final_structure[sub][e] = one_structure

    return_json = simplejson.dumps(final_structure, indent=4, use_decimal=True)
        
    return return_json


def one_contact_update(request):
    db = DB()
   
    user_ctree_data = dict()
       
    if request.GET.get('contact'):
        list_request = request.GET['contact'].split(":-")
        attr = json.loads(list_request[0])
        ego = list_request[1]
        table = list_request[2]
        mapping = json.loads(list_request[3])
        ego_group = list_request[4]
        # ego_info = json.loads(list_request[5])
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]
        
        # with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
        #     user_ctree_data = json.load(json_file)
        
        check_file_exist = os.path.exists("./contact_tree/data/auto_save/" + session + ".json")
        if check_file_exist:
            with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
                user_ctree_data = json.load(json_file)
        else:
            user_ctree_data[session] = dict()

        print 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego + '" ORDER BY (e_id);'
        cur = db.query('SELECT `alter_info` FROM dataset_collection WHERE dataset= "' + data_table + '" and attr="' + attr['bside'] + '";')
        stick_unique = cur.fetchone()["alter_info"]
        precur = db.query('SELECT * FROM ' + data_table + ' WHERE egoid="' + ego + '" ORDER BY (e_id);')
        all_data = precur.fetchall()
    
        insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, ego_group)

        structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
        return_json = one_contact_structure(user_ctree_data, structure_request)

    else:
        raise Http404

    user_ctree_data_json = simplejson.dumps(user_ctree_data, use_decimal=True)
    with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
        json_file.write(user_ctree_data_json)

    
    return HttpResponse(return_json)

def restore_mapping_update(request):
    db = DB()    
    user_ctree_data = dict()

    if request.GET.get('restore'):
        list_request = request.GET['restore'].split(":-")
        attr = json.loads(list_request[0])
        ego_list = json.loads(list_request[1])
        table = list_request[2]
        mapping = json.loads(list_request[3])
        data_group = list_request[4]

        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]
        # print attr, ego_list, table, mapping
        check_file_exist = os.path.exists("./contact_tree/data/auto_save/" + session + ".json")
        if check_file_exist:
            with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
                user_ctree_data = json.load(json_file)

        user_ctree_data[session] = dict()

        if len(ego_list) == 0:
            return_json = simplejson.dumps(table, indent=4, use_decimal=True)
            return HttpResponse(return_json)

        query_request = 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego_list[0] + '"' #!!!
        
        for ego in ego_list[1:]:
            query_request += ' or egoid="' + ego + '"'
        query_request += " ORDER BY (e_id);"
        precur = db.query(query_request)
        all_data = precur.fetchall()

        insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, data_group)

        # general tree structure
        structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
        return_json = one_contact_structure(user_ctree_data, structure_request)
        user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
        with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
            json_file.write(user_ctree_data_json)

    else:
        raise Http404
    
    return HttpResponse(return_json)


def last_use_update(request):
    db = DB()
    
    user_ctree_data = dict()

    if request.GET.get('restore'):
        list_request = request.GET['restore'].split(":-")
        attr = json.loads(list_request[0])
        ego_list = json.loads(list_request[1])
        table = list_request[2]
        mapping = json.loads(list_request[3])
        data_group = list_request[4]

        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]
        # print attr, ego_list, table, mapping
        check_file_exist = os.path.exists("./contact_tree/data/auto_save/" + session + ".json")
        if check_file_exist:
            with open("./contact_tree/data/auto_save/" + session + ".json", "rb") as json_file:
                user_ctree_data = json.load(json_file)
        else:
            user_ctree_data = {session: {data_table: {}}}

        if data_table in user_ctree_data[session] and user_ctree_data[session][data_table] and "layer_" + data_group in user_ctree_data[session][data_table]:
            last_ctree_data = restore_ctree_mapping(user_ctree_data, ego_list, table, attr, mapping, data_group)
            # general tree structure
            structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
            return_json = one_contact_structure(last_ctree_data, structure_request)
            # user_ctree_data[session][data_table] = dict()
            # user_ctree_data[session][data_table]["layer"] = -1
        else:
            # if data_table not in user_ctree_data[session]:
            #     user_ctree_data[session][data_table] = {"layer_" + data_group: -1}
            # else:
            #     user_ctree_data[session][data_table]["layer_" + data_group] = -1

            if len(ego_list) == 0:
                return_json = simplejson.dumps(table, indent=4, use_decimal=True)
                return HttpResponse(return_json)

            query_request = 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego_list[0] + '"' #!!!
            
            for ego in ego_list[1:]:
                query_request += ' or egoid="' + ego + '"'
            query_request += " ORDER BY (e_id);"
            precur = db.query(query_request)
            all_data = precur.fetchall()

            insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, data_group)

            # general tree structure
            structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
            return_json = one_contact_structure(user_ctree_data, structure_request)
            user_ctree_data_json = simplejson.dumps(user_ctree_data, indent=4, use_decimal=True)
            with open("./contact_tree/data/auto_save/" + session + ".json", "wb") as json_file:
                json_file.write(user_ctree_data_json)

    else:
        raise Http404
    
    return HttpResponse(return_json)

def auto_save(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('save'):
        save_detail = json.loads(request.GET.get('save'), encoding='unicode')
        
        #general saving info
        session = str(save_detail[0].split("_of_")[0])
        mode = 'mode="' + str(save_detail[0].split("_of_")[1]) + '"'

        display_egos = "display_egos='" + str(save_detail[1]) + "'"
        selected_egos = "selected_egos='" + str(save_detail[2]) + "'"
        leaf_scale = 'leaf_scale=' + str(save_detail[3])
        fruit_scale = 'fruit_scale=' + str(save_detail[4])
        sub_leaf_len_scale = 'leaf_len_scale=' + str(save_detail[5])
        dtl_branch_curve = 'branch_curve=' + str(save_detail[6])
        root_curve = 'root_curve=' + str(save_detail[7])
        root_len_scale = 'root_len_scale=' + str(save_detail[8])
        canvas_scale = 'canvas_scale=' + str(save_detail[9])
        filter_contact = 'filter_contact=' + str(save_detail[10])
        tree_boundary = "tree_boundary='" + str(save_detail[11]) + "'"
        canvas_translate = "canvas_translate='" + str(save_detail[12]) + "'"
        total_ego = "total_ego='" + str(save_detail[13]) + "'"
        group = 'data_group="' + str(save_detail[14]) + '"'
        component_attribute = "component_attribute='" + save_detail[15].encode('utf-8') + "'"
        # component_attribute = "component_attribute='" + str(1) + "'"
        waves = "waves='" + str(save_detail[16]) + "'"

        condition = "session_id=" + session + " AND " + mode + " AND " + group

        update_query = waves + "," + group + "," + display_egos + "," + selected_egos + "," + leaf_scale + "," + fruit_scale + "," + sub_leaf_len_scale + "," + dtl_branch_curve + "," + root_curve + "," + root_len_scale + "," + filter_contact + "," + canvas_scale + "," + tree_boundary + "," + canvas_translate + "," + total_ego + "," + component_attribute
        # check_update = "UPDATE auto_save SET %s WHERE %s;" %(update_query, condition)
        # print "UPDATE auto_save SET %s WHERE %s;" %(update_query, condition)

        db.query("UPDATE auto_save SET %s WHERE %s;" %(update_query, condition))


    else:
        raise Http404

    db.query('SET SQL_SAFE_UPDATES = 1;')
    db.conn.commit()
    return_json = simplejson.dumps("auto saved", indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def save_mapping(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('save'):
        save_detail = request.GET.get('save').split(":-")
        
        #general saving info
        session = str(save_detail[0].split("_of_")[0])
        mode = str(save_detail[0].split("_of_")[1])
        name = save_detail[2]
        map_detail = save_detail[1]
        group = save_detail[3]

        # mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        mapping_exist = mapcur.fetchall()
        # mapping saving info
        # attr_info = "attr_info='" + map_detail + "'"
        # mapping_exist
        check_query = ""
        updated = 0
        if mapping_exist:
            check_query = "UPDATE attribute_mapping SET last=1, attr_info='" + map_detail + "' WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';"
        else:
            check_query = "INSERT INTO attribute_mapping (`group`, mode, session_id, mapping_name, attr_info) VALUES ('" + group + "', '" + mode + "'," + session + ", '" + name + "', '" + map_detail + "');"
           
        db.query(check_query)
        db.conn.commit()

    else:
        raise Http404

    db.query('SET SQL_SAFE_UPDATES = 1;')
    db.conn.commit()
    return_json = simplejson.dumps("mapping save", indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def del_mapping(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('save'):
        save_detail = request.GET.get('save').split(":-")
        # print save_detail
        session = str(save_detail[0].split("_of_")[0])
        mode = str(save_detail[0].split("_of_")[1])
        name = save_detail[1]
        group = save_detail[2]
        
        mapcur = db.query("DELETE FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        # mapping_exist = mapcur.fetchone()
        # mapping saving info
        # attr_info = "attr_info='" + map_detail + "'"
        # mapping_exist

    else:
        raise Http404

    db.query('SET SQL_SAFE_UPDATES = 1;')
    db.conn.commit()
    return_json = simplejson.dumps("mapping del", indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def get_user_data(request):
    db = DB()
    last_used_info = dict() 
    if request.GET.get('user'):
        session = request.GET.get('user').split(":-")[0]
        data_table = request.GET.get('user').split(":-")[1]
        if data_table == "none":
            auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + ";")
        else:
            auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + " AND mode='" + data_table + "';")
        
        saving_exist = auto_save_cur.fetchone()

        if saving_exist:
            last_used_info["mode"] = saving_exist['mode']

    else:
        raise Http404

    return_json = simplejson.dumps(last_used_info, indent=4, use_decimal=True)
    # print json
    return HttpResponse(return_json)


def restore_user_mapping(request):
    db = DB()
    user_save_map = []
    if request.GET.get('user'):
        session = request.GET.get('user').split("_of_")[0]
        data_table = request.GET.get('user').split("_of_")[1]
        data_group = request.GET.get('user').split("_of_")[2]
        mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mode='" + data_table + "' AND mapping_name!='auto_map' AND `group`='" + data_group + "';")
        mapping_exist = mapcur.fetchall()
        all_mapping = []
        if mapping_exist:
            for mapping in mapping_exist:
                if mapping['mapping_name'] not in all_mapping:
                    all_mapping.append(mapping['mapping_name'])
                    user_save_map.append(json.loads(mapping['attr_info']))
        
    else:
        raise Http404

    return_json = simplejson.dumps(user_save_map, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def restore_user_history(request):
    db = DB()
    user_history = dict()
    if request.GET.get('user'):
        session = request.GET.get('user').split("_of_")[0]
        data_table = request.GET.get('user').split("_of_")[1]

        mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mode='" + data_table + "' AND mapping_name='auto_map' AND last=1;")
        mapping_exist = mapcur.fetchone()
        # auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + " AND mode='" + data_table + "';")
        # saving_exist = auto_save_cur.fetchone()
        if mapping_exist:
            auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + " AND mode='" + data_table + "' AND data_group='" + mapping_exist['group'] + "';")
            saving_exist = auto_save_cur.fetchone()
            user_history["mode"] = saving_exist['mode']
            user_history["display_egos"] = saving_exist['display_egos']
            user_history["selected_egos"] = saving_exist['selected_egos']
            user_history["leaf_scale"] = saving_exist['leaf_scale']
            user_history["fruit_scale"] = saving_exist['fruit_scale']
            user_history["leaf_len_scale"] = saving_exist['leaf_len_scale']
            user_history["branch_curve"] = saving_exist['branch_curve']
            user_history["root_curve"] = saving_exist['root_curve']
            user_history["root_len_scale"] = saving_exist['root_len_scale']
            user_history["canvas_scale"] = saving_exist['canvas_scale']
            user_history["filter_contact"] = saving_exist['filter_contact']
            user_history["tree_boundary"] = saving_exist['tree_boundary']
            user_history["canvas_translate"] = saving_exist['canvas_translate']
            user_history["total_ego"] = saving_exist['total_ego']
            user_history["component_attr"] = saving_exist['component_attribute']
            user_history["waves"] = saving_exist['waves']

            user_history["group"] = mapping_exist['group']
            user_history["attr_info"] = mapping_exist['attr_info']
        
    else:
        raise Http404

    return_json = simplejson.dumps(user_history, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def restore_user_group_history(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    user_history = dict()
    if request.GET.get('user'):
        session = request.GET.get('user').split("_of_")[0]
        data_table = request.GET.get('user').split("_of_")[1]
        data_group = request.GET.get('user').split("_of_")[2]

        mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='auto_map' AND mode='" + data_table + "';")
        mapping_exist = mapcur.fetchall()
        check_query = ""
        updated = 0
        if mapping_exist:
            for mapping in mapping_exist:
                if mapping["group"] != data_group:
                    uncheck_query = "UPDATE attribute_mapping SET last=0 WHERE session_id=" + session + " AND mapping_name='auto_map' AND mode='" + data_table + "' AND `group`='" + mapping["group"] + "';"
                    db.query(uncheck_query)
                    db.conn.commit()
                if mapping["group"] == data_group:
                    updated = 1
                    check_query = "UPDATE attribute_mapping SET last=1 WHERE session_id=" + session + " AND mapping_name='auto_map' AND mode='" + data_table + "' AND `group`='" + data_group + "';"
                    auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + " AND mode='" + data_table + "' AND data_group='" + data_group + "';")
                    saving_exist = auto_save_cur.fetchone()
                    user_history["mode"] = saving_exist['mode']
                    user_history["display_egos"] = saving_exist['display_egos']
                    user_history["selected_egos"] = saving_exist['selected_egos']
                    user_history["leaf_scale"] = saving_exist['leaf_scale']
                    user_history["fruit_scale"] = saving_exist['fruit_scale']
                    user_history["leaf_len_scale"] = saving_exist['leaf_len_scale']
                    user_history["branch_curve"] = saving_exist['branch_curve']
                    user_history["root_curve"] = saving_exist['root_curve']
                    user_history["root_len_scale"] = saving_exist['root_len_scale']
                    user_history["canvas_scale"] = saving_exist['canvas_scale']
                    user_history["filter_contact"] = saving_exist['filter_contact']
                    user_history["tree_boundary"] = saving_exist['tree_boundary']
                    user_history["canvas_translate"] = saving_exist['canvas_translate']
                    user_history["total_ego"] = saving_exist['total_ego']
                    user_history["group"] = saving_exist['data_group']
                    user_history["component_attr"] = saving_exist['component_attribute']
                    user_history["waves"] = saving_exist['waves']

                    user_history["attr_info"] = mapping['attr_info']
        else:
            check_query = "INSERT INTO attribute_mapping (`group`, mode, session_id, mapping_name) VALUES ('" + data_group + "', '" + data_table + "'," + session + ", 'auto_map');"
        
        if updated == 0:
            check_query = "INSERT INTO attribute_mapping (`group`, mode, session_id, mapping_name) VALUES ('" + data_group + "', '" + data_table + "'," + session + ", 'auto_map');"
           
        db.query(check_query)
        db.query('SET SQL_SAFE_UPDATES = 1;')
        db.conn.commit()

        # mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mode='" + data_table + "' AND mapping_name='auto_map' AND group='" + data_group + "';")
        # mapping_exist = mapcur.fetchone()
        
        # all_mapping = []
        # if mapping_exist:
        #     auto_save_cur = db.query("SELECT * FROM auto_save WHERE session_id=" + session + " AND mode='" + data_table + "';")
        #     saving_exist = auto_save_cur.fetchone()
        #     user_history["mode"] = saving_exist['mode']
        #     user_history["display_egos"] = saving_exist['display_egos']
        #     user_history["selected_egos"] = saving_exist['selected_egos']
        #     user_history["leaf_scale"] = saving_exist['leaf_scale']
        #     user_history["fruit_scale"] = saving_exist['fruit_scale']
        #     user_history["leaf_len_scale"] = saving_exist['leaf_len_scale']
        #     user_history["branch_curve"] = saving_exist['branch_curve']
        #     user_history["root_curve"] = saving_exist['root_curve']
        #     user_history["root_len_scale"] = saving_exist['root_len_scale']
        #     user_history["canvas_scale"] = saving_exist['canvas_scale']
        #     user_history["filter_contact"] = saving_exist['filter_contact']
        #     user_history["tree_boundary"] = saving_exist['tree_boundary']
        #     user_history["canvas_translate"] = saving_exist['canvas_translate']
        #     user_history["total_ego"] = saving_exist['total_ego']
        #     user_history["group"] = saving_exist['data_group']
        #     user_history["component_attr"] = saving_exist['component_attribute']
        #     user_history["waves"] = saving_exist['waves']


        #     user_history["attr_info"] = mapping_exist['attr_info']
        
    else:
        raise Http404

    return_json = simplejson.dumps(user_history, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)


def fetch_data(request):
    raw_data = []
    db = DB()
    # table = request.GET.get('contact')
    # print request.GET['contact']
    if request.GET.get('ego'):
        all_info = request.GET.get('ego').split(":=")
        attr = json.loads(all_info[1])
        ego_info = all_info[0].split(":-")
        table = ego_info[0]
        ego = ego_info[1]
        sub = ego_info[2]
        column_name = ["row_id"]
        column_map = ["row_id"]
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]

        query_string = 'SELECT '
        
        for a in attr:
            if attr[a] != 'none':
                column_map.append(a)
                column_name.append(attr[a])
                query_string += "`" + attr[a] + '`, '
        
        raw_data = [column_map, column_name]
        if len(all_info) < 3:
            if sub == 'all':
                query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '";'
            else:
                query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '" AND dataset="' + str(sub) + '";'
        else:
            alter = json.loads(all_info[2])
            # 10009#up#r#0
            bs = 1 #up
            ts = 0 #left
            if alter[1] == 'down':
                bs = 0
            if alter[2] == 'r':
                ts = 1

            if sub == 'all':
                # query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '" AND alterid="' + str(alter[0]) + '" AND ctree_trunk="' + str(ts) + '" AND ctree_branch="' + str(alter[3]) + '" AND ctree_bside="' + str(bs) + '";'
                query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '" AND alterid="' + str(alter[0]) + '";'
            else:
                # query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '" AND dataset="' + str(sub) + '" AND alterid="' + str(alter[0]) + '" AND ctree_trunk="' + str(ts) + '" AND ctree_branch="' + str(alter[3]) + '" AND ctree_bside="' + str(bs) + '";'
                query_string = query_string[:-2] + ' FROM ' + data_table + ' WHERE egoid="' + str(ego) + '" AND dataset="' + str(sub) + '" AND alterid="' + str(alter[0]) + '";'
            
        
        print query_string
        cur = db.query(query_string)
        
        all_data = cur.fetchall()
        
        for data_row in all_data:
            row = []
            row.append(data_row['alterid'])
            for a in attr:
                if attr[a] != 'none':
                    row.append(data_row[attr[a]])
            
            raw_data.append(row)
            
    else:
        raise Http404
    
    return_json = simplejson.dumps(raw_data, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)

############################################################ utility function ############################################################################
def is_empty(any_structure):
    if any_structure:
        # print('Structure is not empty.')
        return False
    else:
        # print('Structure is empty.')
        return True

def takeClosest(num, collection):
   return min(collection,key=lambda x:abs(x-num))
    
