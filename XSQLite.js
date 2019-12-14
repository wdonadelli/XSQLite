"use strict";

/*-----------------------------------------------------------------------------
===============================================================================
								=== Estrutura dos objetos ===

	XSQLite
		alvo:        sql
		produto:     construir o script
		dependência: SQL
		interação:   externa

		SQL
			alvo:        sql.table
			produto:     construir a estrutura SQLite
			dependência: Table
			interação:   interna

			Table
				alvo:        sql.table.column
				produto:     obter os dados da tabela
				dependência: Column
				interação:   interna

				Column
					alvo:        sql.table.column(attributes|messages)
					produto:     obter os dados da coluna
					dependência: -
					interação:   interna

===============================================================================
-----------------------------------------------------------------------------*/

var XSQLite = (function() {
	var RE = {
		NAME:  /^[A-Z]([A-Z0-9\_]+)?$/i,
		TEXT:  /^[A-Z]+((\ [A-Z]+)+)?$/i,
		BOOL0: /^(0|FALSE)$/i,
		BOOL1: /^(1|TRUE)$/i,
		DATE:  /^[0-9]{4}(\-[0-9]{2}){2}$/,
		FDATE: /^DATE\(.*\)$/i,
		TIME:  /^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/,
		FTIME: /^TIME\(.*\)$/i,
		TEXTW: /^[1-9]([0-9]+)?$/,
	}

	/*__ Personalizando mensagens de erro ____________________________________*/
	function XSQLiteError(message) {
		if (!(this instanceof XSQLiteError)) {
			return new XSQLiteError(message);
		}
		this.name = "XSQLiteError";
		this.message = message || "Unknown error.";
		this.description = message;
		this.stack = (new Error()).stack;
	}

	XSQLiteError.prototype = Object.create(Error.prototype, {
		constructor: {value: XSQLiteError},
	});

	/*__ Construtor do objeto SQL ____________________________________________*/
	function XSQLite(txt) {
		if (!(this instanceof XSQLite)) {
			return new XSQLite(txt);
		}
		var obj, xml, sql;
		if (window.DOMParser) {
			obj = new DOMParser();
			xml = obj.parseFromString(txt, "text/xml");
		} else {
			xml = new ActiveXObject("Microsoft.XMLDOM");
			xml.async = false;
			xml.loadXML(txt);
		}
		sql = xml.getElementsByTagName("sql");
		if (sql.length !== 1) this.error("XML root element (sql) not found or more than one reported.");

		Object.defineProperty(this, "sql", {value: new SQL(sql[0])});
	}

	/*__ Construtor do objeto XSQLite ________________________________________*/
	Object.defineProperties(XSQLite.prototype, {
		constructor: {
			value: XSQLite
		},
		version: {
			enumerable: true,
			value: "v2.0.0"
		},
		error: {
			value: function(msg) {
				if (msg !== undefined) throw XSQLiteError(msg);
				return;
			}
		},
		toSQL: {
			enumerable: true,
			value: function() {
				var sql, tabs, separator;
				separator = "\n\n-------------------------------------------------------------------------------\n\n";
				sql = [];
				sql.push("-- Created by XSQLite "+ this.version+ " [https://github.com/wdonadelli/XSQLite] --");

				sql.push("PRAGMA foreign_keys = ON;");
				/*-- table --*/
				sql.push(this.sql.table().join(separator));
				/*-- log --*/
				sql.push(this.sql.log().join(separator));
				/*-- view --*/
				sql.push(this.sql.view().join(separator));
				/*-- triggers --*/
				sql.push(this.sql.trigger("before", "insert").join(separator));
				sql.push(this.sql.trigger("before", "update").join(separator));
				sql.push(this.sql.trigger("after", "insert").join(separator));
				sql.push(this.sql.trigger("after", "update").join(separator));
				sql.push(this.sql.trigger("after", "delete").join(separator));
				sql.push(this.sql.logTrigger("update").join(separator));
				sql.push(this.sql.logTrigger("delete").join(separator));
				return sql.join(separator);
			}
		}
	});

/*===========================================================================*/

	/*__ Construtor do objeto SQL ____________________________________________*/
	function SQL(object) {
		this.xml = object;
		/*-- Obter tabelas --*/
		var tabs, list;
		tabs = {};
		list = object.getElementsByTagName("table");
		if (list.length === 0) this.error("Tables not found.");
		for (var tab = 0; tab < list.length; tab++) {
			var temp, name;
			temp = new Table(list[tab], tab);
			name = temp.name();
			if (name in tabs) this.error("The table name \"" + name + "\" has already been used.");
			tabs[name] = temp;
		}
		this.tabs = tabs;
	}

	/*__ Protótipo do objeto SQL _____________________________________________*/
	SQL.prototype.constructor = SQL;

	SQL.prototype.error = function(msg) {
		if (msg !== undefined) throw XSQLiteError(msg);
		return;
	}

	SQL.prototype.concat = function(list1, list2) {
		for (var i = 0; i < list2.length; i++) {
			list1.push(list2[i]);
		}
		return list1;
	}

	SQL.prototype.table = function() {
		var x, sql;
		x = [];
		for (var t in this.tabs) {
			sql  = [];
			sql.push("CREATE TABLE IF NOT EXISTS " + this.tabs[t].name() + " (");
			sql.push("\t" + this.tabs[t].table().join(",\n\t"))
			sql.push(");");
			x.push(sql.join("\n"));
		}
		return x;
	}

	SQL.prototype.log = function() {
		var x, sql;
		x = [];
		for (var t in this.tabs) {
			sql  = [];
			sql.push("CREATE TABLE IF NOT EXISTS _log_" + this.tabs[t].name() + " (");
			sql.push("\t" + this.tabs[t].log().join(",\n\t"))
			sql.push(");");
			x.push(sql.join("\n"));
		}
		return x;
	}

	SQL.prototype.view = function() {
		var x, sql, cols, links, inner, control;
		x = [];
		for (var t in this.tabs) {
			sql     = [];
			inner   = []
			cols    = this.tabs[t].view();
			links   = this.tabs[t].links();
			control = [];
			/*-- views com chaves estrangeiras --*/
			for (var col in links) {
				var tab = links[col];
				if (!(tab in this.tabs)) this.error("Table \"" + tab + "\" was not defined in the project.");
				if (control.indexOf(tab) < 0) {
					control.push(tab);
					cols = this.concat(cols, this.tabs[tab].view(true));
				}
				inner.push(this.tabs[tab].innerJoin(t+"."+col));
			}
			sql.push("CREATE VIEW IF NOT EXISTS _vw_" + this.tabs[t].name() + " AS SELECT");
			sql.push("\t" + cols.join(",\n\t"))
			sql.push("\tFROM " + this.tabs[t].name())
			if (inner.length > 0) {
				sql.push("\t" + inner.join("\n\t"));
			}
			sql.push(";");
			x.push(sql.join("\n"));
		}
		return x;
	}

	SQL.prototype.trigger = function(time, action) {
		var x, sql, proc, name, type;
		x = [];
		type = time.toUpperCase() + " " + action.toUpperCase();
		for (var t in this.tabs) {
			name  = "_tr_" + time + "_" + action + "_" + this.tabs[t].name();
			sql   = [];
			proc = time === "before" ? this.tabs[t].cases(time, action) : this.tabs[t].register(time, action);
			sql.push("CREATE TRIGGER IF NOT EXISTS " + name + " " + type + " ON " + this.tabs[t].name() + " BEGIN\n");
			sql.push(proc);
			sql.push("\nEND;");
			x.push(sql.join("\n"));
		}
		return x;
	}

	SQL.prototype.logTrigger = function(action) {
		var x, sql, proc, name, type;
		x = [];
		type = "BEFORE " + action.toUpperCase();
		for (var t in this.tabs) {
			name  = "_tr_before_" + action + "_log_" + this.tabs[t].name();
			sql   = [];
			sql.push("CREATE TRIGGER IF NOT EXISTS " + name + " " + type + " ON _log_" + this.tabs[t].name() + " BEGIN");
			sql.push("\tSELECT RAISE(ABORT, 'The log table cannot be changed!') END;");
			sql.push("END;");
			x.push(sql.join("\n"));
		}
		return x;
	}

/*===========================================================================*/

	/*__ Construtor do objeto Tabelas ________________________________________*/
	function Table(object, tab) {
		this.xml = object;
		this.tab = tab;
		/*-- Obter colunas --*/
		var cols, list, name;
		cols = {};
		list = object.getElementsByTagName("column");
		if (list.length === 0) this.error("Columns not found.");
		for (var col = 0; col < list.length; col++) {
			var temp, name;
			temp = new Column(list[col], this.name(), col);
			name = temp.name();
			if (name in cols) this.error("The column name \""+name+"\" has already been used.");
			cols[name] = temp;
		}
		this.cols = cols;
	}

	/*__ Protótipo do objeto Tabela __________________________________________*/
	Table.prototype.constructor = Table;

	Table.prototype.error = function(msg) {
		var id = " \> table(" + this.tab+")";
		if (msg !== undefined) throw XSQLiteError(msg+id);
		return;
	}

	Table.prototype.name = function() {
		var x, re;
		re = /^[A-Z]([A-Z0-9\_]+)?$/i;
		x  = this.xml.getAttribute("name");
		if (x === null || !re.test(x)) this.error("The table's name attribute is in the wrong format or not defined");
		this.tab = x;
		return x;
	}

	Table.prototype.colNames = function(full) {
		var x = [];
		for (var col in this.cols) {
			x.push(full === true ? this.cols[col].fullName() : this.cols[col].name());
		}
		return x;
	}

	Table.prototype.table = function() {
		var x, f;
		x = [];
		f = [];
		x.push("_id_ INTEGER PRIMARY KEY AUTOINCREMENT");
		for (var col in this.cols) {
			var value, fkey;
			value = this.cols[col].getColumns();
			fkey  = this.cols[col].getForeignKey();
			x.push(value.join(" "));
			if (fkey.length > 0) f.push(fkey[0]);
		}
		for (var i = 0; i < f.length; i++) {x.push(f[i]);}
		return x;
	}

	Table.prototype.view = function(noID) {
		var x, value;
		x = [];
		if (noID !== true) {
			x.push(this.tab + "._id_ AS '" + this.tab + "._id_'");
		}
		for (var col in this.cols) {
			value = this.cols[col].getView();
			x.push(value.join(" "));
		}
		return x;
	}

	Table.prototype.log = function() {
		var x;
		x = [];
		x.push("_log_ TEXT DEFAULT(DATETIME('now', 'localtime'))");
		x.push("_event_ INTEGER CHECK(_event_ IN (0, 1, 2))");
		x.push("_id_ INTEGER");
		for (var col in this.cols) {
			var value = this.cols[col].getLogColumns();
			x.push(value.join(" "));
		}
		return x;
	}

	Table.prototype.links = function() {
		var x = {};
		for (var col in this.cols) {
			if (this.cols[col].type() === "key") {
				x[col] = this.cols[col].getAttr("table");
			}
		}
		return x;
	}

	Table.prototype.innerJoin = function(target) {
		return "INNER JOIN " + this.name() + " ON " + this.name() + "._id_ = " + target;
	}

	Table.prototype.cases = function(time, action) {
		var x, y, wh, th, it;
		x  = [];
		it = 1;
		if (time === "before" && action === "update") {
			it = 0;
			y  = [];
			y.push("\tSELECT CASE");
			y.push("\t\tWHEN new._id_ != old._id_");
			y.push("\t\tTHEN RAISE(ABORT, 'The table identifier cannot be changed.')");
			y.push("\tEND;");
			x.push(y.join("\n"));
		}
		for (var col in this.cols) {
			y = [];
			wh = this.cols[col].getWhen();
			th = this.cols[col].getThen();
			y.push("\tSELECT CASE");
			for(var i = it; i < wh.length; i++) {
				y.push("\t\tWHEN " + wh[i]);
				y.push("\t\tTHEN " + th[i]);
			}
			y.push("\tEND;");
			x.push(y.join("\n"));
		}
		return x.join("\n\n");
	}

	Table.prototype.register = function(time, action) {
		var x, ev, col, val, list;
		x   = [];
		ev  = {insert: 0, update: 1, delete: 2};
		col = ["_event_", "_id_"];
		if (action === "delete") {
			val = [ev[action], "old._id_"];
		} else {
			val = [ev[action], "new._id_"];
			list = this.colNames()
			for (var i = 0; i < list.length; i++) {
				col.push(list[i]);
				val.push("new." + list[i]);
			}
		}
		x.push("\tINSERT INTO _log_" + this.tab + " (");
		x.push("\t\t" + col.join(",\n\t\t"));
		x.push("\t) VALUES (");
		x.push("\t\t" + val.join(",\n\t\t"));
		x.push("\t);");
		return x.join("\n");
	}

/*===========================================================================*/

	/*__ Construtor do objeto Column _________________________________________*/
	function Column(object, tab, col, inherit) {
		this.xml = object;
		this.tab = tab;
		this.col = col;
	}

	/*__ Protótipo do objeto Column __________________________________________*/
	Column.prototype.constructor = Column;

	Column.prototype.types = ["text", "number", "boolean", "date", "time", "key"];

	/*__ métodos _____________________________________________________________*/
	Column.prototype.getAttr = function(attr) {
		return this.xml.getAttribute(attr);
	}

	Column.prototype.type = function() {
		var x = new String(this.getAttr("type")).toLowerCase();
		return (this.types.indexOf(x) < 0) ? "free" : x;
	}

	Column.prototype.error = function(msg) {
		var id = " \> table(" + this.tab + ").column(" + this.col + ")";
		if (msg !== undefined) throw XSQLiteError(msg+id);
		return;
	}

	Column.prototype.name = function() {
		var x, re;
		re = RE.NAME;
		x  = this.getAttr("name");
		if (x === null || !re.test(x)) this.error("The column's name attribute is in the wrong format or not defined.");
		this.col = x;
		return x;
	}

	Column.prototype.fullName = function() {
		return this.tab + "." + this.col;
	}

	/*__ Columns _____________________________________________________________*/

	Column.prototype.tbConstraints = ["name", "tbType" , "tbUnique", "tbNotNull" , "tbDefault"];

	Column.prototype.getColumns = function() {
		return this.getConstraints(this.tbConstraints);
	}

	Column.prototype.tbType = function() {
		var cons, type;
		cons = ["TEXT", "INTEGER", "NUMBER"];
		type = {free: 0, text: 0, number: 2, boolean: 1, date: 0, time: 0, key: 1};
		return cons[type[this.type()]];
	}

	Column.prototype.tbNotNull = function() {
		var cons, type;
		cons = this.getAttr("notnull") === null ? null : "NOT NULL";
		type = {free: cons, text: cons, number: cons, boolean: cons, date: cons, time: cons, key: "NOT NULL"};
		return type[this.type()];
	}

	Column.prototype.tbUnique = function() {
		var cons, type;
		cons = this.getAttr("unique") === null ? null : "UNIQUE";
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.tbDefault = function() {
		var cons, type;
		cons = this.getAttr("default") === null ? null : this.getDefault();
		type = {free: cons, text: cons, number: cons, boolean: cons, date: cons, time: cons, key: null};
		return type[this.type()] !== null ? "DEFAULT(" + type[this.type()] + ")" : null;
	}

	/*__ Foreign Keys ________________________________________________________*/

	Column.prototype.fkConstraints = ["fkTable"];

	Column.prototype.getForeignKey = function() {
		return this.getConstraints(this.fkConstraints);
	}

	Column.prototype.fkTable = function() {
		var cons, type, val;
		if (this.type() === "key") {
			cons = this.getAttr("table");
			if (cons === null) this.error("The attribute \"table\" is required for the column of type \"key\".");
			if (!RE.NAME.test(cons)) this.error("Badly formatted attribute (table).");
			val = ["FOREIGN KEY(" + this.col + ") REFERENCES " + cons + "(_id_) ON UPDATE CASCADE"];
		}
		type = {free: null, text: null, number: null, boolean: null, date: null, time: null, key: val};
		return type[this.type()];
	}

	/*__ Log _________________________________________________________________*/

	Column.prototype.logConstraints = ["name", "tbType"];

	Column.prototype.getLogColumns = function() {
		return this.getConstraints(this.logConstraints);
	}

	/*__ View ________________________________________________________________*/

	Column.prototype.vwConstraints = ["vwType", "vwAS"];
	
	Column.prototype.getView = function() {
		return this.getConstraints(this.vwConstraints);
	}

	Column.prototype.vwType = function() {
		var type = {
			free:    "TRIM(" + this.fullName() + ")",
			text:    "UPPER(" + this.fullName() + ")",
			number:  "PRINTF('%f', " + this.fullName() + ")",
			boolean: "CASE " + this.fullName() + " WHEN 0 THEN 'False' WHEN 1 THEN 'True' END",
			date:    "STRFTIME('%Y-%m-%d', " + this.fullName() + ")",
			time:    "STRFTIME('%H:%M:%S', " + this.fullName() + ")",
			key:     this.fullName()
		};
		return type[this.type()];
	}

	Column.prototype.vwAS = function() {
		return "AS '" + this.fullName() + "'";
	}

/*__ Inner Join _____________________________________________________________*/

//INNER JOIN tab2 ON tab2._id_ = tab1.col7

/*__ Trigger: when/then _____________________________________________________*/

	Column.prototype.whConstraints = ["whId", "whNotNull", "whType", "whUnique", "whMin", "whMax", "whGlob", "whLike"];

	Column.prototype.thConstraints = ["thId", "thNotNull", "thType", "thUnique", "thMin", "thMax", "thGlob", "thLike"];

	Column.prototype.getWhen = function() {
		return this.getConstraints(this.whConstraints);
	}

	Column.prototype.getThen = function() {
		return this.getConstraints(this.thConstraints);
	}

	Column.prototype.whId = function() {
		return "new." + this.col + " = old." + this.col;
	}

	Column.prototype.thId = function() {
		return "NULL";
	}

	Column.prototype.whNotNull = function() {
		var cons, type;
		cons = "new." + this.col + " IS NULL";
		type = {free: cons, text: cons, number: cons, boolean: cons, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.thNotNull = function() {
		var cons, type;
		cons = this.getAttr("notnull") === null ? "NULL" : "RAISE(ABORT, '" + this.getMessage("notnull") + "')";
		type = {free: cons, text: cons, number: cons, boolean: cons, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.whType = function() {
		var type = {
			free: null,
			text: ([
				"UPPER(new." + this.col + ") GLOB '*[^A-Z ]*'",
				"UPPER(new." + this.col + ") NOT GLOB '[A-Z]*[A-Z]'",
				"new." + this.col + " GLOB '*  *'"
			]).join(" OR "),
			number: "UPPER(TYPEOF(new." + this.col  + ")) NOT IN ('INTEGER', 'REAL')",
			boolean: "new." + this.col  + " NOT IN (0, 1)",
			date: "DATE(new." + this.col  + ", '+1 day', '-1 day') != new." + this.col,
			time: ([
				"TIME(new." + this.col  + ") IS NULL",
				"new." + this.col  + " NOT GLOB '[0-2][0-9]:[0-5][0-9]:[0-5][0-9]'"
			]).join(" OR "),
			key: ([
				"UPPER(TYPEOF(new." + this.col  + ")) != 'INTEGER'",
				"(SELECT COUNT(*) FROM " + this.getAttr("table")  + " WHERE _id_ = new." + this.col  + ") != 1"
			]).join(" OR ")
		};
		return type[this.type()];
	}

	Column.prototype.thType = function() {
		var cons, type;
		cons = "RAISE(ABORT, '" + this.getMessage(this.type() === "key" ? "table" : "type") + "')";
		type = {free: null, text: cons, number: cons, boolean: cons, date: cons, time: cons, key: cons};
		return type[this.type()];
	}

	Column.prototype.whUnique = function() {
		var cons, type, eq, val;
		eq   = this.type() === "text" ? "LIKE" : "=";
		val  = "(SELECT COUNT(*) FROM " + this.tab + " WHERE " + this.col + " " + eq + " new." + this.col + ") > 0"
		cons = this.getAttr("unique") === null ? null : val;
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.thUnique = function() {
		var cons, type;
		cons = this.whUnique() === null ? null : "RAISE(ABORT, '" + this.getMessage("unique") + "')";
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.whMin = function() {
		var cons, type;
		cons = this.getAttr("min") === null ? null : this.getLimit("min");
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.thMin = function() {
		var cons, type;
		cons = this.whMin() === null ? null : "RAISE(ABORT, '" + this.getMessage("min") + "')";
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.whMax = function() {
		var cons, type;
		cons = this.getAttr("max") === null ? null : this.getLimit("max");
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.thMax = function() {
		var cons, type;
		cons = this.whMax() === null ? null : "RAISE(ABORT, '" + this.getMessage("max") + "')";
		type = {free: cons, text: cons, number: cons, boolean: null, date: cons, time: cons, key: null};
		return type[this.type()];
	}

	Column.prototype.whGlob = function() {
		var cons, type;
		cons = this.getAttr("glob") === null ? null : "new." + this.col + " NOT GLOB '" + this.getAttr("glob") + "'";
		type = {free: cons, text: null, number: null, boolean: null, date: null, time: null, key: null};
		return type[this.type()];
	}

	Column.prototype.thGlob = function() {
		var cons, type;
		cons = this.whGlob() === null ? null : "RAISE(ABORT, '" + this.getMessage("glob") + "')";
		type = {free: cons, text: null, number: null, boolean: null, date: null, time: null, key: null};
		return type[this.type()];
	}

	Column.prototype.whLike = function() {
		var cons, type;
		cons = this.getAttr("like") === null ? null : "new." + this.col + " NOT LIKE '" + this.getAttr("like") + "'";
		type = {free: cons, text: null, number: null, boolean: null, date: null, time: null, key: null};
		return type[this.type()];
	}

	Column.prototype.thLike = function() {
		var cons, type;
		cons = this.whLike("like") === null ? null : "RAISE(ABORT, '" + this.getMessage("like") + "')";
		type = {free: cons, text: null, number: null, boolean: null, date: null, time: null, key: null};
		return type[this.type()];
	}

	/*__ Obtendo Atributo default ____________________________________________*/
	Column.prototype.getDefault = function() {
		var value, error, test;
		error = false;
		value = this.getAttr("default");
		switch(this.type()) {
			case "free":
				if (value !== null) value = "'" + value + "'";
				break;
			case "text":
				test  = RE.TEXT.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = "'" + value + "'";
				break;
			case "number":
				test  = !isNaN(value);
				error = value !== null && !test ? true : error;
				break;
			case "boolean":
				test  = RE.BOOL0.test(value) || RE.BOOL1.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = RE.BOOL1.test(value) ? "1" : "0";
				break;
			case "date":
				test  = RE.DATE.test(value) || RE.FDATE.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = RE.FDATE.test(value) ? value : "'" + value + "'";
				break;
			case "time":
				test  = RE.TIME.test(value) || RE.FTIME.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = RE.FTIME.test(value) ? value : "'" + value + "'";
				break;
			default:
				value = null;
		}
		if (error === true) this.error("Badly formatted attribute (default).");
		return value;	
	}

	/*__ Obtendo Atributo min/max ____________________________________________*/
	Column.prototype.getLimit = function(attr) {
		var value, error, test, sign;
		error = false;
		value = this.getAttr(attr);
		sign  = attr === "min" ? " < " : " > ";
		switch(this.type()) {
			case "free":
				if (value !== null) value = "new." + this.col + sign + "'" + value + "'";
				break;
			case "text":
				test  = RE.TEXTW.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = "LENGTH(new." + this.col + ")" + sign + value;
				break;
			case "number":
				test  = !isNaN(value);
				error = value !== null && !test ? true : error;
				if (value !== null) value = "new." + this.col + sign + value;
				break;
			case "date":
				test  = RE.DATE.test(value) || RE.FDATE.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) {
					value = RE.FDATE.test(value) ? "new." + this.col + sign + value : "new." + this.col + sign + "'" + value + "'";
				}
				break;
			case "time":
				test  = RE.TIME.test(value) || RE.FTIME.test(value);
				error = value !== null && !test ? true : error;
				if (value !== null) {
					value = RE.FTIME.test(value) ? "new." + this.col + sign + value : "new." + this.col + sign + "'" + value + "'";
				}
				break;
			default:
				value = null;
		}
		if (error === true) this.error("Badly formatted attribute (" + attr + ").");
		return value;	
	}

	/*__ Obtendo Restrições __________________________________________________*/
	Column.prototype.getConstraints = function(cons) {
		var x, val;
		x = [];
		for (var i = 0; i < cons.length; i++) {
			val = this[cons[i]]();
			if (val !== null) x.push(val);
		}
		return x;
	}

	/*__ Obtendo menssagens __________________________________________________*/
	Column.prototype.defaultMessages = {
		notnull: "Required value.",
		unique:  "Existing registration.",
		min:     "Value less than allowed.",
		max:     "Greater than allowed value.",
		glob:    "Value in the wrong format.",
		like:    "Value in the wrong format.",
		type:    "Value in the wrong format.",
		table:   "Register not found."
	} 

	Column.prototype.getMessage = function(tag) {
		var x, msg;
		tag = tag.toLowerCase();
		x   = this.col + ": " + this.defaultMessages[tag];
		msg = this.xml.getElementsByTagName("message");
		for (var i = 0; i < msg.length; i++) {
			if (msg[i].getAttribute("onerror") === null) continue;
			if (msg[i].getAttribute("onerror") !== tag) continue;
			x = msg[i].childNodes[0].nodeValue;
			break;
		}
		return x;
	}

	/*__ Retornando objeto ___________________________________________________*/
	return XSQLite;
})();
