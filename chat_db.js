/**
 * Created by coofly on 2014/8/6.
 */
var mysql = require('mysql');
/*
{
	"mysql" : {
		"host" : "localhost",
		"port" : "3306",
		"username" : "qx_chat",
		"password" : "yXVcwNx9RpzLBzWu",
		"db_name" : "qx_chat"
	}
}
 */

var db_config = {
	host            : 'localhost',
	port            : 3306,
	user            : 'root',
	password        : '',
	database        : 'qx_chat'
};
/*
if(process.env.QXCHAT_CONFIG) {
	var env_config = JSON.parse(process.env.QXCHAT_CONFIG).mysql;
	db_config.host = env_config.host;
	db_config.port = env_config.port;
	db_config.user = env_config.username;
	db_config.password = env_config.password;
	db_config.database = env_config.db_name;
}
*/




if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	//var env = JSON.parse(vcap);
	console.log("VCAP_SERVICES=:" + process.env.VCAP_SERVICES);
	var  serviceTypeName = new RegExp("mysql","i");
	for(var key in env){
		if (serviceTypeName.test(key)){
			console.log("key:" + key);
			var db_config.host= env[key] && env[key][0] && env[key][0]['credentials'] && env[key][0]['credentials']['host'];
			var db_config.port= env[key] && env[key][0] && env[key][0]['credentials'] && env[key][0]['credentials']['port'];
			var db_config.user= env[key] && env[key][0] && env[key][0]['credentials'] && env[key][0]['credentials']['user'];
			var db_config.password= env[key] && env[key][0] && env[key][0]['credentials'] && env[key][0]['credentials']['password'];
			var db_config.database= env[key] && env[key][0] && env[key][0]['credentials'] && env[key][0]['credentials']['name'];
			
			console.log("db_config.host=" + db_config.host);
	       
		}
			
	}
	
}




var pool = mysql.createPool({
	connectionLimit : 2,
	connectTimeout  : 10000, // 10s
	host            : db_config.host,
	port            : db_config.port,
	user            : db_config.user,
	password        : db_config.password,
	database        : db_config.database
});

//initialized
pool.getConnection(function(err, connection){
	if (err) throw err;
	// create table if it does'nt exist
	connection.query(
			"CREATE TABLE IF NOT EXISTS `chat_logs` (" +
			" `id` int(10) unsigned NOT NULL AUTO_INCREMENT," +
			" `name` tinytext NOT NULL," +
			" `content` text NOT NULL," +
			" `time` datetime NOT NULL," +
			" PRIMARY KEY (`time`)," +
			" UNIQUE KEY `id` (`id`)" +
			") ENGINE=InnoDB DEFAULT CHARSET=utf8"
	);
	connection.release();
});

/**
 * release
 */
exports.release = function(connection) {
	connection.end(function(error) {
		console.log('Connection closed');
	});
};

/**
 * query
 */
exports.execQuery = function(options) {
	pool.getConnection(function(error, connection) {
		if(error) {
			console.log('db connection is good！');
			throw error;
		}

		/*
		 * connection.query('USE ' + config.db, function(error, results) { if(error) { console.log('DB-dbconnectionisgood！'); connection.end(); throw error; } });
		 */

		// query
		var sql = options['sql'];
		var args = options['args'];
		var handler = options['handler'];

		// query
		if(!args) {
			var query = connection.query(sql, function(error, results) {
				if(error) {
					console.log('DB-connection is good！');
					throw error;
				}

				// results
				handler(results);
			});

			console.log(query.sql);
		} else {
			var query = connection.query(sql, args, function(error, results) {
				if(error) {
					console.log('DB-connection is good！');
					throw error;
				}

				// results
				handler(results);
			});

			console.log(query.sql);
		}

		// return
		connection.release(function(error) {
			if(error) {
				console.log('DB-connection is good！');
				throw error;
			}
		});
	});
};