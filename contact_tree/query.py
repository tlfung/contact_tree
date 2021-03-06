#!/usr/bin/python
# -*- coding: utf-8 -*-
from datetime import date, timedelta, datetime
from django.http import Http404, HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
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
import hashlib
import operator
import json
import math
import copy
import time
# import chardet
import sys
reload(sys)
sys.setdefaultencoding("utf-8")

warnings.filterwarnings(action='ignore', category=MySQLdb.Warning)

class DB:
  conn = None

  def connect(self):
    # self.conn = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree_eu", use_unicode=True, charset="utf8", cursorclass=MySQLdb.cursors.DictCursor)
    self.conn = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree", use_unicode=True, charset="utf8", cursorclass=MySQLdb.cursors.DictCursor)
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
sorting_index = 10

cache_time = 172800 # 48hr

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
                attr_info[field]["RANGE"] = attr_info[field]["COUNT"]
                useful_data += 1
            else:
                # print 'SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;'
                a_cur = db.query('SELECT MIN(`' + field + '`), MAX(`' + field + '`), COUNT(DISTINCT(`' + field + '`)) FROM ' + table + ' WHERE `'+ field + '` is not NULL;')
                f_val = a_cur.fetchone()
                # attr_info[field] = dict()
                for ff in f_val:
                    clean_info = str(f_val[ff]).replace("\'", "").replace('\"', '')
                    attr_info[field][ff.split("(")[0]] = clean_info
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
    # database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree_eu")
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree")
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
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree", use_unicode=True, charset="utf8")
    # database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree_eu", use_unicode=True, charset="utf8")
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

    cur = db.query('SELECT alterid FROM ' + data_table + ' WHERE egoid=(SELECT min(egoid) FROM ' + data_table + ') limit 3;')
    # temp_alter = cur.fetchone()['alterid']
    test_alter = []
    alter_cur = cur.fetchall()
    for d in alter_cur:
        test_alter.append(d["alterid"])
    print test_alter
    cur = db.query('SELECT min(egoid) FROM ' + data_table + ';')
    temp_ego = cur.fetchone()['min(egoid)']
    
    for a in attr_json:
        if a == 'dataset':
            continue
        else:
            check_alter = 0
            # print 'SELECT COUNT(DISTINCT(`' + a + '`)) from ' + data_table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '";'
            for temp_alter in test_alter:
                cur = db.query('SELECT COUNT(DISTINCT(`' + a + '`)) from ' + data_table + ' WHERE alterid ="' + str(temp_alter) + '" and egoid="' + str(temp_ego) + '" AND `' + a + '` != "";')
                alter_count = cur.fetchone()
                if alter_count['COUNT(DISTINCT(`' + a + '`))'] == 1:
                    check_alter += 1
            if check_alter == 3:
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
        return "varchar(64) NULL DEFAULT NULL"
    elif s == 'numerical':
        return "int NULL DEFAULT NULL"
    elif s == 'boolean':
        return "char(1) NULL DEFAULT NULL"
    elif s == 'id':
        return "varchar(256) NULL DEFAULT NULL"
    else:
        return "varchar(256) NULL DEFAULT NULL"


def csv2mysql(fn, table):
    # database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree_eu", use_unicode=True, charset="utf8")
    database = MySQLdb.connect(host="localhost", user="root", passwd="vidim", db="ctree", use_unicode=True, charset="utf8")
    clause = database.cursor()
    print 'Analyzing column types ...'
    # col_types = get_col_types(fn)
    # print col_types
    header = None
    col_types = None
    attribute_info = dict()
    encoding = '-1'

    for row in csv.reader(open(fn)):
        # insert Mysql 
        if col_types:
            # clause.execute(insert_sql, row)
            for x in range(len(row)):
                if encoding != 'utf-8':
                    row[x] = row[x].decode(encoding).encode('utf-8')
                    # row[x] = row[x].decode('big5').encode('utf-8')
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
            if encoding == '-1':
                encoding = row[0]
                continue
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
    group_list = ["", "all"]
    db = DB()
    
    if request.GET.get('data'):
        data_table = request.GET.get('data').split("_of_")[1]
        session = request.GET.get('data').split("_of_")[0]
        session_table = request.GET.get('data')

        # user_ctree_data = dict()
        # cache_data = cache.get(session)
        # if cache_data:
        #     user_ctree_data[session] = cache_data
                               
        cur = db.query("SELECT attr FROM dataset_collection WHERE dataset='" + data_table + "' and attr='dataset';")
        group = cur.fetchone()
        if group:
            group_list.append(group["attr"])
    else:
        raise Http404

    return_json = simplejson.dumps(group_list, indent=4, use_decimal=True)

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


def find_default_mapping(data_table):
    deafult_mapping = dict()
    db = DB()
    deafult_mapping["stick"] = "alterid"
    
    alter_cat_attr = []
    alter_num_attr = []
    all_other_attr = []
    branch_attr_cat = []
    branch_attr_num = []
    branch_related_time = ""

    cur = db.query('SELECT * FROM dataset_collection WHERE attr != "dataset" AND `type` != "id" AND attr_range > 1 AND dataset="' + data_table + '" ORDER BY attr_range;')
    all_attr = cur.fetchall()

    for relate in all_attr:
        if relate['alter_info'] == "1":
            if relate['type'] == "numerical":
                alter_num_attr.append(relate['attr'])
            else:
                alter_cat_attr.append(relate['attr'])
        else:
            all_other_attr.append(relate['attr'])

    cur = db.query('SHOW columns FROM ' + data_table + ';')
    all_attr = cur.fetchall()
    
    # find time-related attribites
    for c in all_attr:
        if (c['Field'].find('year') != -1 or c['Field'].find('age') != -1) and c['Field'].find('page') == -1:
            if c['Field'] in alter_num_attr:
                branch_attr_num.append(c['Field'])
                alter_num_attr.pop(alter_num_attr.index(c['Field']))
            elif c['Field'] in alter_cat_attr:
                branch_attr_cat.append(c['Field'])
                alter_cat_attr.pop(alter_cat_attr.index(c['Field']))
            
    # count the length of differenct kinds of attributes
    len_alter_cat_attr = len(alter_cat_attr)
    len_alter_num_attr = len(alter_num_attr)
    len_all_other_attr = len(all_other_attr)
    len_branch_attr_cat = len(branch_attr_cat)
    len_branch_attr_num = len(branch_attr_num)

    # leave only one attribute for branch mapping
    if len_branch_attr_cat >= 1:
        branch_related_time = branch_attr_cat[-1]
        for b1 in branch_attr_cat[:-1]:
            alter_cat_attr.append(b1)
        for b2 in branch_attr_num:
            alter_num_attr.append(b2)
    elif len_branch_attr_num >= 1:
        branch_related_time = branch_attr_num[-1]
        for b2 in branch_attr_num[:-1]:
            alter_num_attr.append(b2)

    if len_alter_cat_attr >= 3:
        deafult_mapping["trunk"] = alter_cat_attr[0]
        deafult_mapping["bside"] = alter_cat_attr[1]
        deafult_mapping["branch"] = alter_cat_attr[-1]

    elif len_alter_cat_attr == 2:
        deafult_mapping["trunk"] = alter_cat_attr[0]
        deafult_mapping["bside"] = alter_cat_attr[1]
        if len_alter_num_attr > 0:
            deafult_mapping["branch"] = alter_num_attr[-1]
        else:
            deafult_mapping["bside"] = all_other_attr[0]
            deafult_mapping["branch"] = alter_cat_attr[-1]

    elif len_alter_cat_attr == 1:
        deafult_mapping["trunk"] = alter_cat_attr[0]
        if len_alter_num_attr > 1:
            deafult_mapping["bside"] = alter_num_attr[0]
            deafult_mapping["branch"] = alter_num_attr[-1]
        elif len_alter_num_attr > 0:
            deafult_mapping["branch"] = alter_num_attr[-1]
            deafult_mapping["bside"] = all_other_attr[0]
        else:
            deafult_mapping["branch"] = all_other_attr[-1]
            deafult_mapping["bside"] = all_other_attr[0]
    # if no any attr in alter_cat_attr
    elif len_alter_num_attr >= 3:
        deafult_mapping["trunk"] = alter_num_attr[0]
        deafult_mapping["bside"] = alter_num_attr[1]
        deafult_mapping["branch"] = alter_num_attr[-1]
    elif len_alter_num_attr == 2:
        deafult_mapping["trunk"] = alter_num_attr[0]
        deafult_mapping["branch"] = alter_num_attr[1]
        deafult_mapping["bside"] = all_other_attr[0]
    elif len_alter_num_attr == 1:
        deafult_mapping["trunk"] = alter_num_attr[0]
        deafult_mapping["branch"] = all_other_attr[-1]
        deafult_mapping["bside"] = all_other_attr[0]
    # use all the other attributes
    else:
        deafult_mapping["trunk"] = all_other_attr[0]
        deafult_mapping["branch"] = all_other_attr[-1]
        deafult_mapping["bside"] = all_other_attr[1]

    if branch_related_time != "":
        deafult_mapping["branch"] = branch_related_time

    deafult_mapping["fruit_size"] = "none"
    deafult_mapping["leaf_color"] = "none"
    deafult_mapping["leaf_size"] = "none"
    deafult_mapping["root"] = "none"
    deafult_mapping["highlight"] = "none"

    return deafult_mapping


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
        list_request = json.loads(request.GET['table'])
        table = list_request[0]
        column = list_request[1]
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
            for e in e_list:
                e_list[e].append("all")
        final_return.append(e_list) # for all the egoid

        # get the default mapping
        default_attr = find_default_mapping(data_table)

        final_return.append(default_attr)

        # get all the information for the attributes
        # update with the same format and add a local column!!!
        cur = db.query('SELECT * FROM dataset_collection WHERE dataset="' + data_table + '";')
        attr_info = cur.fetchall()
        for info in attr_info:
            detail_array = []
            if info['type'] == "boolean" or info['type'] == "categorical" or info['attr_range'] < 20:
                infocur = db.query('SELECT DISTINCT(`' + info['attr'] + '`) FROM ' + data_table + ' WHERE `' + info['attr'] + '` != "" ORDER BY(`' + info['attr'] + '`);')
                attr_detail = infocur.fetchall()
                if info['min'].isdigit() and info['max'].isdigit():
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


def unique_stick(all_data, attr, branch_layer, data_table):
    structure = dict()
    # print stick_unique
    structure["right"] = []
    structure["left"] = []  

    root = attr['root']
    stick = alterid_index

    global sorting_index

    with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
        dataset_index = json.load(json_file)

    if attr['leaf_size'] != 'none':
        root_cnt_indx = dataset_index[data_table][attr['leaf_size']]
    if data_table.find('student_flow') != -1 and attr['leaf_color'] != 'none':
        sorting_index = dataset_index[data_table][attr['leaf_color']]
        # print "+++", sorting_index

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
                #!!! add leave size as length if is student flow as meeting[leaf_size_index]
                if data_table.find('student_flow') != -1:
                    root_cnt = meeting[root_cnt_indx]
                    structure["root"][0][meeting[root_index]]["length"] = root_cnt
                else:
                    structure["root"][0][meeting[root_index]]["length"] = 0
                structure["root"][0][meeting[root_index]]["sub"] = [10 for i in range(12)] # may add attribute mapping
                structure["root"][0][meeting[root_index]]["root_cat"] = meeting[root_index]
                # print structure["root"]
            else:
                if data_table.find('student_flow') != -1:
                    root_cnt = meeting[root_cnt_indx]
                    structure["root"][0][meeting[root_index]]["length"] += root_cnt
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
                        structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index],  "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_left_up[level].append(meeting[stick])
                        else:
                            structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break

                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_left_down[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                        structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right_up[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_right_up[level].append(meeting[stick])
                        else:
                            structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_right_down[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right_down[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            alter_array_right_down[level].append(meeting[stick])
                        else:
                            structure["right"][level]["level"]["down"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                level += 1
                
    sorting_index = 10
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
                        structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["left"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["left"][level]["level"]["up"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["left"][level]["level"]["down"].append({})
                            alter_array_left[level].append(meeting[stick])
                        else:
                            if is_empty(structure["left"][level]["level"]["up"][new_alter]):
                                structure["left"][level]["level"]["up"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []}
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                            # structure["left"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break

                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_left[level]) == 0:
                        structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["left"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["left"][level]["level"]["down"][len(alter_array_left[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["left"][level]["level"]["up"].append({})
                            alter_array_left[level].append(meeting[stick])
                        else:
                            if is_empty(structure["left"][level]["level"]["down"][new_alter]):
                                structure["left"][level]["level"]["down"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []}
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
                        structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["right"][level]["level"]["up"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["right"][level]["level"]["up"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["right"][level]["level"]["down"].append({})
                            alter_array_right[level].append(meeting[stick])
                        else:
                            if is_empty(structure["right"][level]["level"]["up"][new_alter]):
                                structure["right"][level]["level"]["up"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []}
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            else:
                                structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                                
                            # structure["right"][level]["level"]["up"][new_alter]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})

                    break
                # level and down
                elif meeting[branch_index] == l and meeting[bside_index] == 0:
                    if len(alter_array_right[level]) == 0:
                        structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
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
                            structure["right"][level]["level"]["down"].append({"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []})
                            structure["right"][level]["level"]["down"][len(alter_array_right[level])]["leaf"].append({"size": meeting[leaf_size_index], "color": meeting[leaf_color_index], "leaf_id": leaf_highlights})
                            structure["right"][level]["level"]["up"].append({})
                            alter_array_right[level].append(meeting[stick])
                        else:
                            if is_empty(structure["right"][level]["level"]["down"][new_alter]):
                                structure["right"][level]["level"]["down"][new_alter] = {"id": meeting[stick], "fruit": meeting[fruit_size_index], "sorting": meeting[sorting_index], "leaf": []}
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
def set_ctree_mapping(user_ctree_data, table, attr, mapping, ego_group, select_ego):
    print "***** set_ctree_mapping *****"    
    db = DB()
    binary_index = dict()
    branch_order_index = []
    layer_count = []
    reorder = []
    data_table = table.split("_of_")[1]
    session = table.split("_of_")[0]

    attr_idx = []
    attr_name = []
    index_found = 1
    index_list = 10
    # check to create data index
    with open("./contact_tree/data/dataset_index.json", "rb") as json_file:
        dataset_index = json.load(json_file)
    ori_col_index = dataset_index[data_table]

    user_ctree_data[session][data_table]["layer_" + ego_group] = -1
    last_layer = -1

    # pre store dataset_collection query
    attr_detail = dict()
    ori_index = dict()
    for compt in attr: 
        attr_detail[compt] = dict() 
        if attr[compt] != 'none' and compt != 'stick':
            cur = db.query('SELECT * FROM dataset_collection WHERE dataset="' + data_table + '" and attr="' + attr[compt] + '";')
            attr_detail[compt] = cur.fetchone()
            ori_index[compt] = ori_col_index[attr[compt]]

    for label in user_ctree_data[session][data_table]:
        data_info = user_ctree_data[session][data_table][label]
        if "layer" in label:
            continue
        ego = label.split("_of_")[0]
        dataset = label.split("_of_")[1]
        # if ego_group != "all" and dataset == "all":
        #     data_info["done"] = 0
        #     continue
        # if ego_group == "all" and dataset != "all":
        #     data_info["done"] = 0
        #     continue
        if ego in select_ego:
            for record in data_info["record"]:
                for compt in attr:
                    if compt == 'stick':
                        continue
                    if attr[compt] != 'none' and record[ori_index[compt]] is None:
                        continue        
                    collecting_data = attr_detail[compt]  
                    
                    if compt == 'trunk' or compt == 'bside':
                        if compt == 'trunk':
                            record_index = trunk_index
                        else:
                            record_index = bside_index
                        if compt in mapping:
                            if collecting_data["type"] == "numerical":
                                if float(record[ori_index[compt]]) <= float(mapping[compt]["0"][0]):
                                    record[record_index] = 0
                                else:
                                    record[record_index] = 1
                            
                            else:
                                if str(record[ori_index[compt]]).isdigit():
                                    if str(record[ori_index[compt]]) in str(mapping[compt]["0"]):
                                        record[record_index] = 0
                                    else:
                                        record[record_index] = 1
                                else:
                                    if str(record[ori_index[compt]]).encode('utf-8') in mapping[compt]["0"]:
                                        record[record_index] = 0
                                    else:
                                        record[record_index] = 1  

                        else:
                            if str(collecting_data["type"]) == "numerical":
                                mid = math.floor((float(collecting_data['max']) + float(collecting_data['min']))*0.5)
                                if float(record[ori_index[compt]]) <= float(mid):
                                    record[record_index] = 0
                                else:
                                    record[record_index] = 1
                            else:
                                if compt in binary_index:
                                    if binary_index[compt].index(record[ori_index[compt]]) < (len(binary_index[compt])*0.5):
                                        record[record_index] = 0
                                    else:
                                        record[record_index] = 1

                                else:
                                    binary_index[compt] = []
                                    precur = db.query('SELECT DISTINCT(' + attr[compt] + ') FROM ' + data_table + ' ORDER BY(' + attr[compt] + ');')
                                    real_data = precur.fetchall()
                                    for dist_d in real_data:
                                        binary_index[compt].append(dist_d[attr[compt]])

                                    if binary_index[compt].index(record[ori_index[compt]]) < (len(binary_index[compt])*0.5):
                                        record[record_index] = 0
                                    else:
                                        record[record_index] = 1


                    elif compt == 'fruit_size' or compt == 'leaf_size' or compt == 'leaf_color' or compt == 'branch' or compt == 'root':
                        if attr[compt] == "none":
                            if compt == 'fruit_size':
                                record[fruit_size_index] = 0
                            elif compt == 'leaf_size':
                                record[leaf_size_index] = 3
                            elif compt == 'leaf_color':
                                record[leaf_color_index] = 3
                            elif compt == 'root':
                                record[root_index] = 3
                            
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
                                record[sorting_index] = 0
                            elif compt == 'root':
                                record_index = root_index

                            if compt in mapping:
                                if collecting_data["type"] == "categorical" or collecting_data["type"] == "boolean":
                                    for cat in mapping[compt]:
                                        if str(record[ori_index[compt]]).isdigit():
                                            if str(record[ori_index[compt]]) == str(cat):
                                                record[record_index] = int(mapping[compt][cat])
                                                if compt == 'branch':
                                                    layer_count.append(int(mapping[compt][cat]))                                    
                                                break
                                        else:
                                            if str(record[ori_index[compt]]).encode('utf-8') == cat:
                                                record[record_index] = int(mapping[compt][cat])
                                                if compt == 'branch':
                                                    layer_count.append(int(mapping[compt][cat]))                                    
                                                break
                                else:
                                    if compt == 'branch' and layer_count == []:
                                        layer_count.append(len(mapping[compt]))

                                    if compt == 'branch' and mapping[compt][1] < mapping[compt][0]: # for the revert mapping
                                        if float(record[ori_index[compt]]) >= float(mapping[compt][0]):
                                            record[record_index] = 0
                                                                                                                 
                                        elif float(record[ori_index[compt]]) < float(mapping[compt][-1]): # float(record[ori_index[compt]]) <= float(mapping[compt][-1]):
                                            record[record_index] = len(mapping[compt])
                                                                                
                                        else:
                                            for order in range(len(mapping[compt])-2, -1, -1):
                                                if float(record[ori_index[compt]]) <= float(mapping[compt][order]) and float(record[ori_index[compt]]) > float(mapping[compt][order+1]):
                                                    record[record_index] = (order+1)
                                                    break
                                    elif compt == 'branch' or compt == 'leaf_color' or compt == 'root': # for general mapping
                                        if float(record[ori_index[compt]]) <= float(mapping[compt][0]):
                                            record[record_index] = 0

                                        elif float(record[ori_index[compt]]) > float(mapping[compt][-1]): # float(record[ori_index[compt]]) >= float(mapping[compt][-1]):
                                            record[record_index] = len(mapping[compt])
                                        
                                        else:
                                            for order in range(1, len(mapping[compt])):
                                                if float(record[ori_index[compt]]) > float(mapping[compt][order-1]) and float(record[ori_index[compt]]) <= float(mapping[compt][order]):
                                                    record[record_index] = order
                                                    break
                                    elif compt == 'fruit_size' or compt == 'leaf_size': # special for size mapping
                                        size_map = mapping[compt][1]
                                        val_map = mapping[compt][0]

                                        if float(record[ori_index[compt]]) <= float(val_map[0]):
                                            record[record_index] = int(size_map[0])
                                            
                                        elif float(record[ori_index[compt]]) >= float(val_map[-1]):
                                            record[record_index] = int(size_map[len(val_map)])
                                            
                                        else:
                                            for order in range(1, len(val_map)):
                                                if float(record[ori_index[compt]]) > float(val_map[order-1]) and float(record[ori_index[compt]]) <= float(val_map[order]):
                                                    record[record_index] = int(size_map[order])
                                                    break

                                    if compt == 'branch':
                                        record[sorting_index] = int(record[ori_index[compt]])
          
                            else: # only branch will have default mapping
                                if collecting_data["type"] == "numerical":
                                    if len(reorder) == 0:
                                        gap = collecting_data['attr_range']/9.0 # find attribute local range!!!
                                        g = float(collecting_data["min"])
                                        while g <= float(collecting_data["max"]):
                                            reorder.append(round(g, 2))
                                            g += gap
                                       
                                        if len(reorder) < 9:
                                            reorder.append(collecting_data["max"])
                                        layer_count = [9]
                                    if int(record[ori_index[compt]]) <= reorder[0]:
                                        record[record_index] = 0

                                    elif int(record[ori_index[compt]]) >= reorder[-1]:
                                        record[record_index] = len(reorder)
                                    else:
                                        for order in range(1, len(reorder)):
                                            if int(record[ori_index[compt]]) > reorder[order-1] and int(record[ori_index[compt]]) <= reorder[order]:
                                                record[record_index] = order                                        
                                                break
                                    record[sorting_index] = int(record[ori_index[compt]])

                                else:
                                    if len(branch_order_index) == 0:
                                        precur = db.query('SELECT DISTINCT(' + attr[compt] + ') FROM ' + data_table + ' ORDER BY(' + attr[compt] + ');') # add where egoid = selected!!!
                                        real_data = precur.fetchall()
                                        for dist_d in real_data:
                                            branch_order_index.append(dist_d[attr[compt]])
                                        layer_count.append(len(branch_order_index)-1)
                                    
                                    record[record_index] = branch_order_index.index(record[ori_index[compt]])
                                    # layer_count.append(branch_order_index.index(record[ori_index[compt]]))
                                                                                   

                    elif compt == 'highlight':
                        if attr[compt] == "none":
                            record[highlight_index] = "none"
                        else:
                            record[highlight_index] = record[ori_index[compt]]
                # update_ctree_data[session][data_table][label]["record"].append(record)
        else: #!!!
            data_info["done"] = 0

    if len(layer_count) != 0 and max(layer_count) != last_layer:
        user_ctree_data[session][data_table]["layer_" + ego_group] = max(layer_count)


def insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, ego_group):
    print "****** insert_ctree_mapping ******"
    db = DB()
    binary_index = dict()
    branch_order_index = []
    reorder = []
    data_table = table.split("_of_")[1]
    session = table.split("_of_")[0]

    attr_idx = []
    attr_name = []
    index_found = 1
    index_list = 11
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
            record_all = str(d['egoid']) + "_of_all"
            if record_all not in user_ctree_data[session][data_table]:
                user_ctree_data[session][data_table][record_all] = dict() 
                user_ctree_data[session][data_table][record_all]["record"] = []
                user_ctree_data[session][data_table][record_all]["done"] = -1
            elif user_ctree_data[session][data_table][record_all]["done"] == 1:
                return
            
            elif user_ctree_data[session][data_table][record_all]["done"] == 0: # has record but not being updated yet
                user_ctree_data[session][data_table][record_all]["record"] = []
                user_ctree_data[session][data_table][record_all]["done"] = -1

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
                        if str(d[attr[compt]]).isdigit():
                            if str(d[attr[compt]]) in str(mapping[compt]["0"]):
                                ctree_record[record_index] = 0
                            else:
                                ctree_record[record_index] = 1
                        else:
                            if str(d[attr[compt]]).encode('utf-8') in mapping[compt]["0"]:
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
                        ctree_record[sorting_index] = 0
                    elif compt == 'root':
                        record_index = root_index

                    if compt in mapping:
                        if collecting_data["type"] == "categorical" or collecting_data["type"] == "boolean":
                            for cat in mapping[compt]:
                                if str(d[attr[compt]]).isdigit():
                                    if str(d[attr[compt]]) == str(cat):
                                        ctree_record[record_index] = int(mapping[compt][cat])
                                        if compt == 'branch':
                                            layer_count.append(int(mapping[compt][cat]))                                    
                                        break
                                else:
                                    if str(d[attr[compt]]).encode('utf-8') == cat:
                                        ctree_record[record_index] = int(mapping[compt][cat])
                                        if compt == 'branch':
                                            layer_count.append(int(mapping[compt][cat]))                                    
                                        break
                                
                        else:
                            if compt == 'branch' and layer_count == []:
                                layer_count.append(len(mapping[compt]))
                            if compt == 'branch' and mapping[compt][1] < mapping[compt][0]: # for the revert mapping
                                if float(d[attr[compt]]) >= float(mapping[compt][0]):
                                    ctree_record[record_index] = 0
                                                                                                         
                                elif float(d[attr[compt]]) < float(mapping[compt][-1]): # float(d[attr[compt]]) <= float(mapping[compt][-1]):
                                    ctree_record[record_index] = len(mapping[compt])
                                                                        
                                else:
                                    for order in range(len(mapping[compt])-2, -1, -1):
                                        if float(d[attr[compt]]) <= float(mapping[compt][order]) and float(d[attr[compt]]) > float(mapping[compt][order+1]):
                                            ctree_record[record_index] = (order+1)
                                            break
                            elif compt == 'branch' or compt == 'leaf_color' or compt == 'root': # for general mapping
                                if float(d[attr[compt]]) <= float(mapping[compt][0]):
                                    ctree_record[record_index] = 0

                                elif float(d[attr[compt]]) > float(mapping[compt][-1]): # float(d[attr[compt]]) >= float(mapping[compt][-1]):
                                    ctree_record[record_index] = len(mapping[compt])
                                
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

                            if compt == 'branch':
                                ctree_record[sorting_index] = int(d[attr[compt]])
  
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
                                layer_count = [9]
                            if int(d[attr[compt]]) <= reorder[0]:
                                ctree_record[record_index] = 0

                            elif int(d[attr[compt]]) >= reorder[-1]:
                                ctree_record[record_index] = len(reorder)
                            else:
                                for order in range(1, len(reorder)):
                                    if int(d[attr[compt]]) > reorder[order-1] and int(d[attr[compt]]) <= reorder[order]:
                                        ctree_record[record_index] = order                                        
                                        break
                            ctree_record[sorting_index] = int(d[attr[compt]])

                        else:
                            if len(branch_order_index) == 0:
                                precur = db.query('SELECT DISTINCT(' + attr[compt] + ') FROM ' + data_table + ' ORDER BY(' + attr[compt] + ');')
                                real_data = precur.fetchall()
                                for dist_d in real_data:
                                    branch_order_index.append(dist_d[attr[compt]])
                                layer_count.append(len(branch_order_index)-1)

                            ctree_record[record_index] = branch_order_index.index(d[attr[compt]])
                            # layer_count.append(branch_order_index.index(d[attr[compt]]))
                                                                                                       

            elif compt == 'highlight':
                if attr[compt] == "none":
                    ctree_record[highlight_index] = "none"
                else:
                    ctree_record[highlight_index] = d[attr[compt]]
            
        user_ctree_data[session][data_table][record_label]["record"].append(ctree_record)
        if ego_group != "all":
            user_ctree_data[session][data_table][record_all]["record"].append(ctree_record)

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
    # print "****** restore_ctree_mapping ******"
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
                one_structure = unique_stick(all_data, attr, branch_layer, data_table)

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
                    one_structure = unique_stick(all_data, attr, branch_layer, data_table)

                else:
                    # print "in_duplicate"
                    one_structure = duplicate_stick(all_data, attr, branch_layer)
                if sub not in final_structure:
                    final_structure[sub] = dict()
                final_structure[sub][e] = one_structure


    for d in final_structure:
        # print 'for1', d
        for e in final_structure[d]:
            # print 'for2', e
            # print final_structure[d][e]
            for layer in final_structure[d][e]['right']:
                layer['level']['down'] = sorted(layer['level']['down'], key=lambda k: k['sorting'])
                layer['level']['up'] = sorted(layer['level']['up'], key=lambda k: k['sorting'])
            for layer in final_structure[d][e]['left']:
                layer['level']['down'] = sorted(layer['level']['down'], key=lambda k: k['sorting'])
                layer['level']['up'] = sorted(layer['level']['up'], key=lambda k: k['sorting'])
               
    return_json = simplejson.dumps(final_structure, indent=4, use_decimal=True)
    # with open("./contact_tree/data/tree_structure.json", "wb") as json_file:
    #     json_file.write(return_json)    
    return return_json


def one_contact_update(request):
    db = DB()
   
    user_ctree_data = dict()
       
    if request.GET.get('contact'):
        list_request = json.loads(request.GET['contact'])

        attr = json.loads(list_request[0])
        ego = list_request[1]
        table = list_request[2]
        mapping = json.loads(list_request[3])
        ego_group = list_request[4]
        # ego_info = json.loads(list_request[5])
        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]
        
        cache_data = cache.get(session)
        if cache_data:
            user_ctree_data[session] = cache_data
        else:
            user_ctree_data[session] = dict()

        # print 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego + '" ORDER BY (e_id);'
        # cur = db.query('SELECT `alter_info` FROM dataset_collection WHERE dataset= "' + data_table + '" and attr="' + attr['bside'] + '";')
        # stick_unique = cur.fetchone()["alter_info"]
        precur = db.query('SELECT * FROM ' + data_table + ' WHERE egoid="' + ego + '" ORDER BY (e_id);')
        all_data = precur.fetchall()
    
        insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, ego_group)

        structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
        return_json = one_contact_structure(user_ctree_data, structure_request)
        
    else:
        raise Http404

    cache.set(session, user_ctree_data[session], cache_time)
    return HttpResponse(return_json)


def restore_mapping_update(request):
    db = DB()    
    user_ctree_data = dict()

    if request.GET.get('restore'):
        list_request = json.loads(request.GET['restore'], encoding='unicode')
        attr = json.loads(list_request[0], encoding='unicode')
        ego_list = json.loads(list_request[1], encoding='unicode')
        table = list_request[2].encode('utf-8')
        mapping = json.loads(list_request[3], encoding='unicode')
        data_group = list_request[4].encode('utf-8')

        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]

        # print mapping, "**********"
        # for m in mapping:
        #     print m, mapping[m]
        #     if mapping[m] == 'none':
        #         continue
        #     if type(mapping[m]) is dict:
        #         for c in mapping[m]:
        #             new_c = str(c).encode('utf-8')
        #             for i in range(len(mapping[m][c])):
        #                 mapping[m][c][i] = str(mapping[m][c][i]).encode('utf-8')
        #     if type(mapping[m]) is list:
        #         for i in range(len(mapping[m])):
        #             mapping[m][i] = str(mapping[m][i]).encode('utf-8')
        # print mapping, "**********"
        
        cache_data = cache.get(session)
        if cache_data:
            user_ctree_data[session] = cache_data
            # using Memcache to restore mapping
            if data_table in user_ctree_data[session] and "layer_" + data_group in user_ctree_data[session][data_table]:
                set_ctree_mapping(user_ctree_data, table, attr, mapping, data_group, ego_list)
                structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
                return_json = one_contact_structure(user_ctree_data, structure_request)
                cache.set(session, user_ctree_data[session], cache_time)
                return HttpResponse(return_json)
        else:
            user_ctree_data[session] = dict()
        # using database to restore mapping
        if len(ego_list) == 0:
            return_json = simplejson.dumps(table, indent=4, use_decimal=True)
            # cache.set(session, user_ctree_data[session], cache_time)
            return HttpResponse(return_json)

        query_request = 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego_list[0] + '"'
        
        for ego in ego_list[1:]:
            query_request += ' or egoid="' + ego + '"'
        query_request += " ORDER BY (e_id);"
        precur = db.query(query_request)
        all_data = precur.fetchall()

        insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, data_group)

        # general tree structure
        structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
        return_json = one_contact_structure(user_ctree_data, structure_request)
        
    else:
        raise Http404
    
    cache.set(session, user_ctree_data[session], cache_time)
    return HttpResponse(return_json)


def last_use_update(request):
    db = DB()
    
    user_ctree_data = dict()

    if request.GET.get('restore'):
        list_request = json.loads(request.GET['restore'])
        attr = json.loads(list_request[0])
        ego_list = json.loads(list_request[1])
        table = list_request[2]
        mapping = json.loads(list_request[3])
        data_group = list_request[4]

        data_table = table.split("_of_")[1]
        session = table.split("_of_")[0]

        cache_data = cache.get(session)
        if cache_data:
            user_ctree_data[session] = cache_data
            # using Memcache to restore mapping
            if data_table in user_ctree_data[session] and "layer_" + data_group in user_ctree_data[session][data_table]:
                last_ctree_data = restore_ctree_mapping(user_ctree_data, ego_list, table, attr, mapping, data_group)
                # general tree structure
                structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
                return_json = one_contact_structure(last_ctree_data, structure_request)
                # cache.set(session, user_ctree_data[session], cache_time)
                return HttpResponse(return_json)
        else:
            user_ctree_data[session] = dict()

        # using database to restore mapping
        if len(ego_list) == 0:
            return_json = simplejson.dumps(table, indent=4, use_decimal=True)
            return HttpResponse(return_json)

        query_request = 'SELECT * FROM ' + data_table + ' WHERE egoid="' + ego_list[0] + '"'
        
        for ego in ego_list[1:]:
            query_request += ' or egoid="' + ego + '"'
        query_request += " ORDER BY (e_id);"
        precur = db.query(query_request)
        all_data = precur.fetchall()

        insert_ctree_mapping(user_ctree_data, all_data, table, attr, mapping, data_group)

        # general tree structure
        structure_request = list_request[0] + ":-" + list_request[4] + ":-" + list_request[5] + ":-" + list_request[2]
        return_json = one_contact_structure(user_ctree_data, structure_request)
        
        cache.set(session, user_ctree_data[session], cache_time)
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

        display_egos = "display_egos='" + str(save_detail[1]).encode('utf-8') + "'"
        selected_egos = "selected_egos='" + str(save_detail[2]).encode('utf-8') + "'"
        leaf_scale = 'leaf_scale=' + str(save_detail[3]).encode('utf-8')
        fruit_scale = 'fruit_scale=' + str(save_detail[4]).encode('utf-8')
        sub_leaf_len_scale = 'leaf_len_scale=' + str(save_detail[5]).encode('utf-8')
        dtl_branch_curve = 'branch_curve=' + str(save_detail[6]).encode('utf-8')
        root_curve = 'root_curve=' + str(save_detail[7]).encode('utf-8')
        root_len_scale = 'root_len_scale=' + str(save_detail[8]).encode('utf-8')
        canvas_scale = 'canvas_scale=' + str(save_detail[9]).encode('utf-8')
        filter_contact = 'filter_contact=' + str(save_detail[10]).encode('utf-8')
        tree_boundary = "tree_boundary='" + str(save_detail[11]).encode('utf-8') + "'"
        canvas_translate = "canvas_translate='" + str(save_detail[12]).encode('utf-8') + "'"
        total_ego = "total_ego='" + str(save_detail[13]).encode('utf-8') + "'"
        group = 'data_group="' + str(save_detail[14]).encode('utf-8') + '"'
        component_attribute = "component_attribute='" + str(save_detail[15]).replace('"', '\\\"').encode('utf-8') + "'"
        waves = "waves='" + str(save_detail[16]).encode('utf-8') + "'"

        condition = "session_id=" + session + " AND " + mode + " AND " + group

        update_query = waves + "," + group + "," + display_egos + "," + selected_egos + "," + leaf_scale + "," + fruit_scale + "," + sub_leaf_len_scale + "," + dtl_branch_curve + "," + root_curve + "," + root_len_scale + "," + filter_contact + "," + canvas_scale + "," + tree_boundary + "," + canvas_translate + "," + total_ego + "," + component_attribute
    
        # print "========="
        # print "UPDATE auto_save SET %s WHERE %s;" %(update_query, condition)
        db.query("UPDATE auto_save SET %s WHERE %s;" %(update_query, condition))


    else:
        raise Http404

    db.query('SET SQL_SAFE_UPDATES = 1;')
    db.conn.commit()
    return_json = simplejson.dumps("auto saved", indent=4, use_decimal=True)

    return HttpResponse(return_json)


def save_mapping(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('save'):
        save_detail = json.loads(request.GET['save'])
        
        #general saving info
        session = str(save_detail[0].split("_of_")[0])
        mode = str(save_detail[0].split("_of_")[1])
        name = save_detail[2]
        map_detail = save_detail[1]
        group = save_detail[3]

        # mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        mapcur = db.query("SELECT * FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        mapping_exist = mapcur.fetchall()
        
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
    
    return HttpResponse(return_json)


def del_mapping(request):
    db = DB()
    db.query('SET SQL_SAFE_UPDATES = 0;')
    db.conn.commit()
    if request.GET.get('save'):
        save_detail = json.loads(request.GET['save'])
        session = str(save_detail[0].split("_of_")[0])
        mode = str(save_detail[0].split("_of_")[1])
        name = save_detail[1]
        group = save_detail[2]
        
        mapcur = db.query("DELETE FROM attribute_mapping WHERE session_id=" + session + " AND mapping_name='" + name + "' AND mode='" + mode + "' AND `group`='" + group + "';")
        
    else:
        raise Http404

    db.query('SET SQL_SAFE_UPDATES = 1;')
    db.conn.commit()
    return_json = simplejson.dumps("mapping del", indent=4, use_decimal=True)
    
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
        all_info = request.GET['ego'].split(":=")
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

def memcahe_upload(request):
    pre_cache = dict()
    if request.GET.get('memcahe'):
        info = request.GET['memcahe'].split(":-")
        cache_key = info[0]
        cache_time = 3600 # time to live in seconds
        data = info[1]
        cache.set(cache_key, data, cache_time)
        result = cache.get(cache_key)
    else:
        raise Http404
    # pre_cache[cache_key] = data
    return_json = simplejson.dumps({cache_key: data}, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)

def memcahe_download(request):
    pre_cache = dict()
    if request.GET.get('memcahe'):
        cache_key = request.GET['memcahe']
        result = cache.get(cache_key)
        # print "**********", result
        pre_cache[cache_key] = result
    else:
        raise Http404
    
    return_json = simplejson.dumps(pre_cache, indent=4, use_decimal=True)
    # print return_json
    return HttpResponse(return_json)
