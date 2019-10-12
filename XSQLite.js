"use strict";

var XSQLite = (function() {
	var NAME, TEXT, BOOL, DATE, FDATE, TIME, FTIME, WIDTH, ATTR, TYPE, SQL;

	/*-- constantes --*/
	NAME  = /^[A-Z]([A-Z0-9\_]+)?$/i;
	TEXT  = /^[A-Z]+((\ [A-Z]+)+)?$/i;
	BOOL  = /^(1|TRUE|0|FALSE)$/i;
	DATE  = /^[0-9]{4}(\-[0-9]{2}){2}$/;
	FDATE = /^DATE\(.*\)$/i;
	TIME  = /^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/;
	FTIME = /^TIME\(.*\)$/i;
	WIDTH = /^[1-9]([0-9]+)?$/;
	/*-- atributos específicos --*/
	ATTR  = {
		notNull: getNotNull,
		unique:  getUnique,
		default: getDefault,
		min:     getMin,
		max:     getMax,
		like:    getLike,
		glob:    getGlob,
		source:  getSource
	};
	/*-- atributos específicos de cada tipo --*/
	TYPE  = {
		free:     ["notNull", "unique", "default", "min", "max", "like", "glob"],
		number:   ["notNull", "unique", "default", "min", "max"],
		text:     ["notNull", "unique", "default", "min", "max"],
		boolean:  ["notNull", "default"],
		date:     ["notNull", "unique", "default", "min", "max"],
		time:     ["notNull", "unique", "default", "min", "max"],
		id:       ["source"]
	};
	/*-- montagem do SQL --*/
	SQL   = {
		free:     {column: {}, trigger:{}, message: {}},
		number:   {column: {}, trigger:{}, message: {}},
		text:     {column: {}, trigger:{}, message: {}},
		boolean:  {column: {}, trigger:{}, message: {}},
		date:     {column: {}, trigger:{}, message: {}},
		time:     {column: {}, trigger:{}, message: {}},
		id:       {column: {}, trigger:{}, message: {}}
	};
	/*-- montagem SQL:column --*/
	SQL.free.column = {
		type:    "@col@ TEXT",
		unique:  "UNIQUE",
		notNull: "NOT NULL",
		default: "DEFAULT(@default@)"
	};
	SQL.number.column = {
		type:    "@col@ NUMBER",
		unique:  SQL.free.column.unique,
		notNull: SQL.free.column.notNull,
		default: SQL.free.column.default
	};
	SQL.text.column = {
		type:    "@col@ TEXT",
		unique:  SQL.free.column.unique,
		notNull: SQL.free.column.notNull,
		default: SQL.free.column.default
	};
	SQL.boolean.column = {
		type:    "@col@ INTEGER",
		notNull: SQL.free.column.notNull,
		default: SQL.free.column.default
	};
	SQL.date.column = {
		type:    "@col@ TEXT",
		unique:  SQL.free.column.unique,
		notNull: SQL.free.column.notNull,
		default: SQL.free.column.default
	};
	SQL.time.column = {
		type:    "@col@ TEXT",
		unique:  SQL.free.column.unique,
		notNull: SQL.free.column.notNull,
		default: SQL.free.column.default
	};
	SQL.id.column = {
		type:    "@col@ INTEGER",
		foreign: "FOREIGN KEY(@col@) REFERENCES @source@(_id_) ON UPDATE CASCADE"
	};	
	/*-- montagem SQL: trigger --*/
	SQL.free.trigger = {
		unique:  "(SELECT COUNT(*) FROM @tab@ WHERE @col@ = new.@col@) > 0",
		notNull: "new.@col@ IS NULL OR TRIM(new.@col@) = ''",
		min:     "new.@col@ < @min@",
		max:     "new.@col@ > @max@",
		glob:    "new.@col@ NOT GLOB @glob@",
		like:    "new.@col@ NOT LIKE @like@"
	};
	SQL.number.trigger = {
		type:    "UPPER(TYPEOF(new.@col@)) NOT IN ('INTEGER', 'REAL')",
		unique:  SQL.free.trigger.unique,
		notNull: SQL.free.trigger.notNull,
		min:     SQL.free.trigger.min,
		max:     SQL.free.trigger.max
	};
	SQL.text.trigger = {
		type:    "UPPER(new.@col@) GLOB '*[^A-Z ]*' OR UPPER(new.@col@) NOT GLOB '[A-Z]*[A-Z]' OR new.@col@ GLOB '*  *'",
		unique:  "(SELECT COUNT(*) FROM @tab@ WHERE UPPER(@col@) = UPPER(new.@col@)) > 0",
		notNull: SQL.free.trigger.notNull,
		min:     "LENGTH(new.@col@) < @min@",
		max:     "LENGTH(new.@col@) > @max@"
	};
	SQL.boolean.trigger = {
		type:    "new.@col@ NOT IN (0,1)",
		notNull: SQL.free.trigger.notNull
	};
	SQL.date.trigger = {
		type:   "DATE(new.@col@, '+1 day', '-1 day') != new.@col@",
		unique:  SQL.free.trigger.unique,
		notNull: SQL.free.trigger.notNull,
		min:     SQL.free.trigger.min,
		max:     SQL.free.trigger.max
	};
	SQL.time.trigger = {
		type:    "TIME(new.@col@) IS NULL OR new.@col@ NOT GLOB '[0-2][0-9]:[0-5][0-9]*'",
		unique:  SQL.free.trigger.unique,
		notNull: SQL.free.trigger.notNull,
		min:     SQL.free.trigger.min,
		max:     SQL.free.trigger.max
	};
	SQL.id.trigger = {
		type: "new.@col@ IS NULL OR (SELECT COUNT(*) FROM @source@ WHERE _id_ = new.@col@) != 1"
	};
	/*-- montagem SQL:messages --*/
	SQL.free.message = {
		type:    "@col@: Enter a textual value",
		unique:  "@col@: Existing registration.",
		notNull: "@col@: Required value.",
		min:     "@col@: Value less than allowed.",
		max:     "@col@: Greater than allowed value.",
		glob:    "@col@: Value in the wrong format.",
		like:    "@col@: Value in the wrong format."
	};
	SQL.number.message = {
		type:    "@col@: The value must be numeric.",
		unique:  SQL.free.message.unique,
		notNull: SQL.free.message.notNull,
		min:     SQL.free.message.min,
		max:     SQL.free.message.min
	};
	SQL.text.message = {
		type:    "@col@: Enter only letters and simple spaces.",
		unique:  SQL.free.message.unique,
		notNull: SQL.free.message.notNull,
		min:     "@col@: Amount of characters less than allowed.",
		max:     "@col@: Amount of characters greater than allowed."
	};
	SQL.boolean.message = {
		type:    "@col@: The value must be boolean (1 or 0).",
		notNull: SQL.free.message.notNull
	};
	SQL.date.message = {
		type:    "@col@: Enter a valid date.",
		unique:  SQL.free.message.unique,
		notNull: SQL.free.message.notNull,
		min:     SQL.free.message.min,
		max:     SQL.free.message.min
	};
	SQL.time.message = {
		type:    "@col@: Enter a valid time.",
		unique:  SQL.free.message.unique,
		notNull: SQL.free.message.notNull,
		min:     SQL.free.message.min,
		max:     SQL.free.message.min
	};
	SQL.id.message = {
		type: "@col@: Register not found in table @source@"
	};

	/*-- funções privadas --*/
	function start(xml) {
		var sql, tables, columns, values, tab, col, type, swap, attr, msg, re;
		values = {};
		/*-- obtendo root --*/
		sql = xml.getElementsByTagName("sql");
		if (sql.length !== 1) throw Error("XML root element (sql) not found or more than one reported.");
		/*-- obtendo tabelas --*/
		tables = sql[0].getElementsByTagName("table");
		if (tables.length === 0) throw Error("Tables not found.");
		/*-- looping nas tabelas --*/
		for (var t = 0; t < tables.length; t++) {
			/*-- obtendo o nome das tabelas --*/
			tab = getName(tables[t]);
			if (tab === false) throw Error("#"+t+": The table's name attribute is in the wrong format or not defined.");
			/*-- definindo tabelas em values --*/
			if (tab in values) throw Error(tab+": Table name already used.");
			values[tab] = {};
			/*-- obtendo as colunas da tabela --*/
			columns = tables[t].getElementsByTagName("column");
			if (columns.length === 0) throw Error(tab+": Columns not found.");
			/*-- looping nas tabelas --*/
			for (var c = 0; c < columns.length; c++) {
				/*-- obtendo o nome das colunas --*/ 
				col = getName(columns[c]);
				if (col === false) throw Error([tab,"#"+c].join(".")+": The column's name attribute is in the wrong format or not defined.");
				/*-- definindo colunas em values --*/
				if (col in values) throw Error([tab,col].join(".")+": Column name already used.");
				values[tab][col] = {};
				/*-- obtendo atributos das colunas --*/
				swap = {};
				swap.tab  = tab;
				swap.col  = col;
				swap.type = getType(columns[c]);
				swap.msg  = {};
				for (var a in ATTR) {
					/*-- verificando se o atributo existe para o tipo --*/
					if (TYPE[swap.type].indexOf(a) < 0) {
						continue;
					}
					/*-- obtendo atributo individual --*/
					attr = ATTR[a](columns[c]);
					if (attr === false) throw Error([tab,col,a].join(".")+": Badly formatted attribute.");
					/*-- adicionando o atributo a swap caso exista --*/
					if (attr === null) {
						continue;
					} else {
						swap[a] = attr;
					}
				}
				/*-- obtendo as mensagens definidas no xml --*/
				for (var m in SQL[swap.type].message) {
					msg = columns[c].getElementsByTagName(m);
					swap.msg[m] = msg.length === 0 ? SQL[swap.type].message[m] : msg[0].childNodes[0].nodeValue;
				}
				/*-- definindo values: objetos SQL --*/
				for (var x in SQL[getType(columns[c])]) {
					if (!(x in values[tab][col])) {
						values[tab][col][x] = {};
					}
					/*-- definindo values: valores SQL (se existente apenas) --*/
					for (var y in SQL[getType(columns[c])][x]) {//FIXME ainda não consegui entender como definir as mensagens personalizadas
						if (y in swap) {
							values[tab][col][x][y] = SQL[getType(columns[c])][x][y];
							/*-- definindo values: trocando referência por valores reais --*/
							for (var z in swap) {
								re = new RegExp("@"+z+"@", "g");
								values[tab][col][x][y] = values[tab][col][x][y].replace(re, swap[z]);
							}
						}
					}
				}
			}
		}console.log(values);
		return values;
	};
	
	
	
	function getName(xml) {
		var x = xml.getAttribute("name");
		return NAME.test(x) !== true || x === null ? false : x;
	};
	function getType(xml) {
		var x = new String(xml.getAttribute("type")).toLowerCase();
		return x in TYPE ? x : "free";
	};
	function getNotNull(xml) {
		var x = xml.getAttribute("notNull");
		return x === null ? null : true;
	};
	function getUnique(xml) {
		var x = xml.getAttribute("unique");
		return x === null ? null : true;
	};
	function getLike(xml) {
		var x = xml.getAttribute("like");
		return x === null ? null : "'"+x+"'";
	};
	function getGlob(xml) {
		var x = xml.getAttribute("glob");
		return x === null ? null : "'"+x+"'";
	};
	function getSource(xml) {
		var x = xml.getAttribute("source");
		return NAME.test(x) !== true || x === null ? false : x;
	};
	function getDefault(xml) {
		var x, type;
		x = xml.getAttribute("default");
		type = getType(xml)
		if (x === null) {
			x = null;
		} else if (type === "free") {
			x = "'"+x+"'";
		} else if (type === "number") {
			x = !isNaN(x) ? x : false;
		} else if (type === "text") {
				x = TEXT.test(x) === true ? "'"+x+"'" : false;
		} else if (type === "boolean") {
			if (BOOL.test(x.toLowerCase()) !== true) {
				x = false;
			} else {
				x = ["true", "1"].indexOf(x.toLowerCase()) >= 0 ? 1 : 0;
			}
		} else if (type === "date") {
			if (DATE.test(x) === true) {
				x = "'"+x+"'";
			} else if (FDATE.test(x) !== true) {
				x = false;
			}
		} else if (type === "time") {
			if (TIME.test(x) === true) {
				x = "'"+x+"'";
			} else if (FTIME.test(x) !== true) {
				x = false;
			}
		} else {
				x = null;
		}
		return x;
	};
	function getMin(xml) {
		var x, type;
		x = xml.getAttribute("min");
		type = getType(xml)
		if (x === null) {
			x = null;
		} else if (type === "free") {
			x = "'"+x+"'";
		} else if (type === "number") {
			x = !isNaN(x) ? x : false;
		} else if (type === "text") {
				x = WIDTH.test(x) === true ? x : false;
		} else if (type === "date") {
			if (DATE.test(x) === true) {
				x = "'"+x+"'";
			} else if (FDATE.test(x) !== true) {
				x = false;
			}
		} else if (type === "time") {
			if (TIME.test(x) === true) {
				x = "'"+x+"'";
			} else if (FTIME.test(x) !== true) {
				x = false;
			}
		} else {
				x = null;
		}
		return x;
	};
	function getMax(xml) {
		var x, type;
		x = xml.getAttribute("max");
		type = getType(xml)
		if (x === null) {
			x = null;
		} else if (type === "free") {
			x = "'"+x+"'";
		} else if (type === "number") {
			x = !isNaN(x) ? x : false;
		} else if (type === "text") {
				x = WIDTH.test(x) === true ? x : false;
		} else if (type === "date") {
			if (DATE.test(x) === true) {
				x = "'"+x+"'";
			} else if (FDATE.test(x) !== true) {
				x = false;
			}
		} else if (type === "time") {
			if (TIME.test(x) === true) {
				x = "'"+x+"'";
			} else if (FTIME.test(x) !== true) {
				x = false;
			}
		} else {
				x = null;
		}
		return x;
	};

	/*-- SQL --*/

	/*-- SQL COLUMN --*/
	function createColumn(col) {
		var sql, seq;
		sql = [];
		seq = ["type", "unique", "notNull", "default"];
		for (var i = 0; i < seq.length; i++) {
			if (seq[i] in col) {
				sql.push(col[seq[i]]);
			}
		}
		return sql.join(" ");
	};

	/*-- SQL TABLE --*/
	function createTable(tab) {
		var sql, col, key, cols, data;
		sql  = [];
		col  = [];
		key  = [];
		cols = Master(tab).childs;
		/*-- obtendo colunas e chaves --*/
		col.push("_id_ INTEGER PRIMARY KEY AUTOINCREMENT");
		for (var i = 0; i < cols.length; i++) {
			data = column(cols[i]);
//			col.push(createColumn(data));
//			if ("foreign" in col) {
//				key.push(data.foreign.key);
			}
//		}
		/*-- transferindo as chaves para as colunas --*/
//		for (var k = 0; k < key.length; k++) {
//			col.push(key[k]);
//		}
		/*-- construindo a tabela --*/
//		sql.push("CREATE TABLE IF NOT EXISTS "+tab.getAttribute("name")+" (");
//		sql.push("\t"+col.join(",\n\t"));
//		sql.push(");");
		return sql.join("\n");
	};

	/*-- SQL VIEW --*/
	function createView(tab) {
		var sql, col, cols;
		sql  = [];
		col  = [];
		cols = tab.getElementsByTagName("column");
		/*-- obtendo colunas --*/
		col.push("_id_");
		for (var i = 0; i < cols.length; i++) {
			col.push(attr(cols[i]).value.col);
		}
		/*-- construindo view --*/
		sql.push("CREATE VIEW IF NOT EXISTS _vw_"+tab.getAttribute("name")+"_ AS SELECT ");
		sql.push("\t"+col.join(",\n\t"));
		sql.push("FROM "+tab.getAttribute("name")+";");
		return sql.join("\n");
	};

	/*-- SQL LOG --*/
	function createLog(tab) {
		var sql, col, cols, data;
		sql  = [];
		col  = [];
		cols = tab.getElementsByTagName("column");
		/*-- obtendo colunas --*/
		col.push("_log_ TEXT DEFAULT(DATETIME('now', 'localtime'))");
		col.push("_event_ TEXT CHECK(_event_ IN (0, 1, 2))");
		col.push("_id_ INTEGER");
		for (var i = 0; i < cols.length; i++) {
			data = attr(cols[i]);
			col.push(data.column.type);
		}
		/*-- contruindo tabela --*/
		sql.push("CREATE TABLE IF NOT EXISTS _"+tab.getAttribute("name")+"_ (");
		sql.push("\t"+col.join(",\n\t"));
		sql.push(");");
		return sql.join("\n");
	};

	/*-- SQL TRIGGER CASES --*/
	function createCase(col) {
		var sql, when, seq;
		sql  = [];
		when = [];
		seq  = ["notNull", "unique", "type", "min", "max", "glob", "like"];
		/*-- obtendo os atributos --*/
		for (var i = 0; i < seq.length; i++) {
			if (seq[i] in col.trigger) {
				if (col.value.notNull !== true) {
					when.push("WHEN (new."+col.value.col+" IS NOT NULL) AND "+col.trigger[seq[i]]+" THEN");
				} else {
					when.push("WHEN "+col.trigger[seq[i]]+" THEN");
				}
				when.push("\tRAISE(ABORT, '"+col.message[seq[i]]+"')");
			}
		}
		/*-- construindo cases --*/
		sql.push("SELECT CASE");
		sql.push("\t\t"+when.join("\n\t\t"));
		sql.push("\tEND;\n");
		return sql.join("\n");
	};

	/*-- SQL TRIGGER BEFORE --*/

	function createTriggerBefore(tab, trigger) {
		var sql, col, cases, child, name;
		sql   = [];
		cases = [];
		name  = tab.getAttribute("name");
		child = tab.getElementsByTagName("column");
		/*-- starting trigger --*/
		if (trigger === "UPDATE") {
			sql.push("CREATE TRIGGER IF NOT EXISTS tr_before_update_"+name+" BEFORE "+trigger+" ON "+name+" BEGIN\n");
			sql.push("\tSELECT CASE");
			sql.push("\t\tWHEN new._id_ != old._id_ THEN");
			sql.push("\t\t\tRAISE(ABORT, 'The table identifier (_id_) cannot be changed.')");
			sql.push("\tEND;\n");
		} else if (trigger === "INSERT") {
			sql.push("CREATE TRIGGER IF NOT EXISTS tr_before_insert_"+name+" BEFORE "+trigger+" ON "+name+" BEGIN\n");
		}
		/*-- looping in columns --*/
		for (var i = 0; i < child.length; i++) {
			/*-- getting data column --*/
			col = attr(child[i]);
			/*-- creating case --*/
			cases.push(createCase(col));
		}
		/*-- adding cases to trigger --*/
		sql.push("\t"+cases.join("\n\t"));
		/*-- finishing log --*/
		sql.push("END;");
		return sql.join("\n");
	};

	/*-- SQL CREATE INSERT --*/
	function createInsertLog(tab, type) {
		var sql, col, val, child;
		sql = [];
		col = [];
		val = []
		/*-- start insert --*/
		sql.push("\tINSERT INTO _"+tab.getAttribute("name")+"_ (");
		col.push("_event_");
		if (type === "INSERT") {
			val.push(1);
		} else if (type === "UPDATE") {
			val.push(0);
		} else {
			val.push(-1);
		}
		col.push("_id_");
		if (type === "INSERT") {
			val.push("new._id_");
		} else {
			val.push("old._id_");
		}
		/*-- looping in columns --*/
		child = tab.getElementsByTagName("column");
		for (var i = 0; i < child.length; i++) {
			col.push(attr(child[i]).value.col);
			if (type === "DELETE") {
				val.push("notNull");
			} else {
				val.push("new."+attr(child[i]).value.col);
			}
		}
		/*-- adding columns to insert --*/
		sql.push("\t\t"+col.join(",\n\t\t"));
		/*-- adding values to insert --*/
		sql.push("\t) VALUES (");
		sql.push("\t\t"+val.join(",\n\t\t"));
		/*-- finishing insert --*/
		sql.push("\t);");
		return sql.join("\n");
	};

	/*-- SQL TRIGGER AFTER --*/
	function createTriggerAfter(tab, trigger) {
		var sql, child, name;
		sql   = [];
		name  = tab.getAttribute("name");
		child = tab.getElementsByTagName("column");
		/*-- starting trigger --*/
		if (trigger === "UPDATE") {
			sql.push("CREATE TRIGGER IF NOT EXISTS tr_after_update_"+name+" AFTER "+trigger+" ON "+name+" BEGIN\n");
		} else if (trigger === "INSERT") {
			sql.push("CREATE TRIGGER IF NOT EXISTS tr_after_insert_"+name+" AFTER "+trigger+" ON "+name+" BEGIN\n");
		} else {
			sql.push("CREATE TRIGGER IF NOT EXISTS tr_after_delete_"+name+" AFTER "+trigger+" ON "+name+" BEGIN\n");
		}
		/*-- insert in log --*/
		sql.push(createInsertLog(tab, trigger));
		/*-- finishing log --*/
		sql.push("\nEND;");
		return sql.join("\n");
	};























	/*-- Constructor --*/
	function XSQLite(xml) {
		if (!(this instanceof XSQLite)) {
			return new XSQLite(xml);
		}
		var xml, obj, log;
		if (window.DOMParser) {
			obj  = new DOMParser();
			xml = obj.parseFromString(xml, "text/xml");
		} else {
			xml = new ActiveXObject("Microsoft.XMLDOM");
			xml.async = false;
			xml.loadXML(xml);
		}
		Object.defineProperties(this, {
			xml: {
				value: start(xml)
			}
		});
		return
	};

	Object.defineProperties(XSQLite.prototype, {
		constructor: {
			value: XSQLite
		},
		toSQL: {
			enumerable: true,
			value: function() {
				var sql, tabs;
				sql = ["-- Created by XSQLite v1.0.0 [https://github.com/wdonadelli/XSQLite] --"];
				sql.push("PRAGMA foreign_keys = ON;");
				/*tabs = Master(this._x).childs;
				for (var i = 0; i < tabs.length; i++) {
					sql.push(createTable(tabs[i]));
					/*sql.push(createView(tabs[i]));
					sql.push(createLog(tabs[i]));
					sql.push(createTriggerBefore(tabs[i], "INSERT"));
					sql.push(createTriggerBefore(tabs[i], "UPDATE"));
					sql.push(createTriggerAfter(tabs[i], "INSERT"));
					sql.push(createTriggerAfter(tabs[i], "UPDATE"));
					sql.push(createTriggerAfter(tabs[i], "DELETE"));
				}*/
				return sql.join("\n\n------------------------------------------------------\n\n");
			}
		}
	});

	return XSQLite;
})();

window.addEventListener("load", function() {
	var x = XSQLite(document.getElementById("xml").value);
	console.log(x.toSQL());
});

