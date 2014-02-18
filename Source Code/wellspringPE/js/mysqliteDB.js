/**
 * Created by Siyuan Xing on 2/17/14.
 */


var DB = function (db_name, size) {
    var _db = openDatabase(db_name, '1.0.0', 'SQLite DB for Sample Project of WellSpring', size);

    return {

        /**
         * execute the sqlite database, return callback
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
         * 查询时，有数据返回数组，无数据返回0
         * 增删改时：返回int，影响条数
         * void query( string[, function])
         * void query( string[, array[, function]])
         */
        query: function (sql, param, callback) {
            //参数处理
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
         * 插入，回调返回last id
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
         * 修改，回调返回影响条数
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
         * 删除
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
         * 查询，回调返回结果集数组
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
            this.fetchAll("select * from sqlite_master where type='table' and name like ?", [table_name], callback);
        },


        /**
         * 组装查询条件
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
         * Create the new table
         */
        create: function (){
            var createQuery = "CREATE TABLE Train (id integer primary key autoincrement, "+
                "TRAIN_LINE text not null, ROUTE_NAME text not null, " +
                "RUN_NUMBER text not null unique, OPERATOR_ID text not null, "+
                "check(TRAIN_LINE in('El','Metra','Amtrak')))";
            this.query(createQuery);
        },
        addData: function (trainLine,routeName,runNumber,operatorID){

            var insertQuery = "INSERT INTO Train (TRAIN_LINE,ROUTE_NAME,RUN_NUMBER,OPERATOR_ID) VALUES('"
                +trainLine+"','"+routeName+"','"+runNumber+"','"+operatorID+"')";
            this.query(insertQuery);
        },
        showAllData: function(){
            _db.transaction(function(tx){
                    tx.executeSql('SELECT * FROM InfoData',[],function(tx,rs){
                        return rs;
                    });
                }

            );
        }


    }
};

/*
 //使用示例：
 //1.获取db对象,连接数据库 test，分配2M大小
 var db = new DB('test',1024*1024*2);

 //2.创建表
 db.query("CREATE TABLE ids (id integer primary key autoincrement , ctime integer)");

 //3.查看已经创建的表，支持表名通配符搜索。如："%"查询所有表，"user_%"查询"user_"开头的表
 db.showTables("%",function(ret){console.log(ret)})

 //4.查询表里数据
 db.fetchAll('select * from ids',function(ret){console.log(ret)});

 //5.修改
 db.update('ids',{ctime:123},"id=?",[1],function(ret){console.log(ret)});

 //6.删除
 db.toDelete('ids',"id=?",[1],function(ret){console.log(ret)});

 //7.其它，如删表
 db.query('drop table ids');

 */