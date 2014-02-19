/**
 * Created by Siyuan Xing on 2/17/14.
 */


var DB = function (db_name, size) {
    var _db = openDatabase(db_name, '1.0.0', 'SQLite DB for Sample Project of WellSpring', size);
    var table = document.getElementById("data_table");
    return {

        /**
         * execute the sqlite database, return callback function
         */
        execute: function (sql, param, callback) {
            if (!param) {
                param = [];
            } else if (typeof param == 'function') {
                callback = param;
                param = [];
            }

            this.query(sql, param, function (result) {
                if (typeof callback == 'function') {
                    callback(result.rowsAffected);
                }
            });
        },

        /**
         * Execute query return
         * void query( string[, function])
         * void query( string[, array[, function]])
         */
        query: function (sql, param, callback) {

            if (!param) {
                param = [];
            } else if (typeof param == 'function') {
                callback = param;
                param = [];
            }

            var self = this;
            //只有一个参数
            _db.transaction(function (tx) {
                //4个参数：sql，替换sql中问号的数组，成功回调，出错回调
                tx.executeSql(sql, param, function (tx, result) {
                    if (typeof callback == 'function') {
                        callback(result);
                    }
                }, self.onfail);
            })
        },
        /**
         * insert, return id
         * void insert( string, object[, function])
         */
        insert: function (table, data, callback) {
            if (typeof data != 'object' && typeof callback == 'function') {
                callback(0);
            }

            var k = [];
            var v = [];
            var param = [];
            for (var i in data) {
                k.push(i);
                v.push('?');
                param.push(data[i]);
            }
            var sql = "INSERT INTO " + table + "(" + k.join(',') + ")VALUES(" + v.join(',') + ")";

            this.query(sql, param, function (result) {
                if (typeof callback == 'function') {
                    callback(result.insertId);
                }
            });
        },
        /**
         * update table
         * void update( string, object[, string[, function]])
         * void update( string, object[, string[, array[, function]]])
         */
        update: function (table, data, where, param, callback) {
            //参数处理
            if (!param) {
                param = [];
            } else if (typeof param == 'function') {
                callback = param;
                param = [];
            }

            var set_info = this.mkWhere(data);
            for (var i = set_info.param.length - 1; i >= 0; i--) {
                param.unshift(set_info.param[i]);
            }
            var sql = "UPDATE " + table + " SET " + set_info.sql;
            if (where) {
                sql += " WHERE " + where;
            }

            this.query(sql, param, function (result) {
                if (typeof callback == 'function') {
                    callback(result.rowsAffected);
                }
            });
        },

        /**
         * Delete
         * void toDelete( string, string[, function]])
         * void toDelete( string, string[, array[, function]])
         */
        toDelete: function (table, where, param, callback) {
            //参数处理
            if (!param) {
                param = [];
            } else if (typeof param == 'function') {
                callback = param;
                param = [];
            }

            var sql = "DELETE FROM " + table + " WHERE " + where;
            this.query(sql, param, function (result) {
                if (typeof callback == 'function') {
                    callback(result.rowsAffected);
                }
            });
        },

        /**
         * select all data from table
         * void fetch_all( string[, function] )
         * void fetch_all( string[, param[, function]] )
         */
        fetchAll: function (sql, param, callback) {
            //参数处理
            if (!param) {
                param = [];
            } else if (typeof param == 'function') {
                callback = param;
                param = [];
            }

            this.query(sql, param, function (result) {
                if (typeof callback == 'function') {
                    var out = [];
                    if (result.rows.length) {
                        for (var i = 0; i < result.rows.length; i++) {
                            out.push(result.rows.item(i));
                        }
                    }
                    callback(out);
                }
            });
        },

        /**
         * show all data in the table
         */
        showTables: function (table_name, callback) {
            //this.fetchAll("select * from sqlite_master where type='table' and name like ?", [table_name], callback);

            this.fetchAll("select * from "+table_name, callback);
        },


        /**
         * Packaging the select factors
         */
        mkWhere: function (data) {
            var arr = [];
            var param = [];
            if (typeof data === 'object') {
                for (var i in data) {
                    arr.push(i + "=?");
                    param.push(data[i]);
                    console.log('data.i:' + i);
                }
            }
            return {sql: arr.join(' AND '), param: param};
        },

        /**
         * Exception handle
         */
        onfail: function (tx, e) {
            console.log('sql error: ' + e.message);
        },

        /**
         *  CRUD function for 'Train' Table
         */
        //Create table
        create: function (){

            var createQuery = "CREATE TABLE Train (id integer primary key autoincrement, "+
                "TRAIN_LINE text not null, ROUTE_NAME text not null, " +
                "RUN_NUMBER text not null unique, OPERATOR_ID text not null, "+
                "check(TRAIN_LINE in('El','Metra','Amtrak')))";
            this.query(createQuery);
        },

        //insert rows
        addData: function (trainLine,routeName,runNumber,operatorID){

            var insertQuery = "INSERT INTO Train (TRAIN_LINE,ROUTE_NAME,RUN_NUMBER,OPERATOR_ID) VALUES('"
                +trainLine+"','"+routeName+"','"+runNumber+"','"+operatorID+"')";
            this.query(insertQuery);
        },

        //Read Table
        showAllData: function(callback){
            this.fetchAll("select * from Train order by RUN_NUMBER", callback);
        },

        //Delete Table
        deleteRow: function(value){

            var deleteQuery = "Delete From Train where RUN_NUMBER = '"+value+"'";
            this.query(deleteQuery);
        }


    }
};
