"use strict";

var XSQLite = (function() {
	var CONFIG, FREE, NUMBER, TEXT, BOOLEAN, DATE, TIME, ID;

	/*-- Objeto para obter as informações do XML --*/
	function Master(xml) {
		if (!(this instanceof Master)) {
			return new Master(xml);
		}
		Object.defineProperty(this, "xml", {
			value: xml
		});
		return;
	};

	Object.defineProperties(Master.prototype, {
		constructor: {
			value: Master
		},
		NAME:  {value: /^[A-Z]([A-Z0-9\_]+)?$/i},
		TYPE:  {value: ["free", "number", "text", "boolean", "date", "time", "id"]},
		TEXT:  {value: /^[A-Z]+((\ [A-Z]+)+)?$/i},
		DATE:  {value: /^[0-9]{4}(\-[0-9]{2}){2}$/},
		FDATE: {value: /^DATE\(.*\)$/i},
		TIME:  {value: /^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/},
		FTIME: {value: /^TIME\(.*\)$/i},
		WIDTH: {value: /^[1-9]([0-9]+)?$/},
		error: {value: function(msg, attr, val) {
			if (x !== undefined) throw Error(this.tag+"."+attr+"="+val+": "+msg);
		}},
		val: {value: function(x) {
			return this.xml.getAttribute(x);
		}},
		tag: {get: function() {
			var x = this.xml.tagName.toLowerCase();
			if (["sql", "table", "column"].indexOf(x) < 0) {this.error("Undefined tag name", "", x);}
			return x;
		}},
		tab: {get: function() {
			var x;
			if (this.tag === "table") {
				x = this.name;
			} else if (this.tag === "column") {
				x = new Master(this.parentNode).name;
			} else {
				x = null;
			}
			return x;
		}},
		col: {get: function() {
			return this.tag === "column" ? this.name : null;
		}},
		name: {get: function() {
			var x = this.val("name");
			if (this.NAME.test(x) !== true) {this.error("Invalid value", "name", x);}
			return x;
		}},
		type: {get: function() {
			var x = null;
			if (this.tag === "column") {
				x = new String(this.val("name")).toLowerCase();
				x = this.TYPE.indexOf(x) < 0 ? "free" : x;
			}
			return x;
		}},
		unique: {get: function() {
			return this.val("unique") !== null ? true : null;
		}},
		notNull: {get: function() {
			return this.val("notNull") !== null ? true : null;
		}},
		glob: {get: function() {
			return this.val("glob") === null ? null : "'"+this.val("glob")+"'";
		}},
		like: {get: function() {
			return this.val("like") === null ? null : "'"+this.val("like")+"'";
		}},
		default: {get: function() {
			var x = this.val("default");
			if (x !== null) {
				if (this.type === "free") {
					x = "'"+x+"'";
				} else if (this.type === "number") {
					x = !isNaN(x) ? x : false;
				} else if (this.type === "text") {
					x = TEXT.test(x) !== true ? false : "'"+x+"'";
				} else if (this.type === "boolean") {
					x = x.toLowerCase();
					if (["true", "1"].indexOf(x) >= 0) {
						x = 1;
					} else if (["false", "0"].indexOf(x) >= 0) {
						x = 0;
					} else {
						x = false;
					}
				} else if (this.type === "date") {
					if (this.DATE.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FDATE.test(x) !== true) {
						x = false;
					}
				} else if (this.type === "time") {
					if (this.TIME.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FTIME.test(x) !== true) {
						x = false;
					}
				} else {
						x = null;
				}
			}
			if (x === false) {this.error("Invalid value", "default", x);}
			return x;
		}},
		min: {get: function() {
			var x = this.val("min");
			if (x !== null) {
				if (this.type === "free") {
					x = "'"+x+"'";
				} else if (this.type === "number") {
						x = !isNaN(x) ? x : false;
				} else if (this.type === "text") {
					x = WIDTH.test(x) !== true ? false : x;
				} else if (this.type === "date") {
					if (this.DATE.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FDATE.test(x) !== true) {
						x = false;
					}
				} else if (this.type === "time") {
					if (this.TIME.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FTIME.test(x) !== true) {
						x = false;
					}
				} else {
					x = null;
				}
			}
			if (x === false) {
				this.error("Invalid value", "min", x);
			}
			return x;
		}},
		max: {get: function() {
			var x = this.val("max");
			if (x !== null) {
				if (this.type === "free") {
					x = "'"+x+"'";
				} else if (this.type === "number") {
						x = !isNaN(x) ? x : false;
				} else if (this.type === "text") {
					x = WIDTH.test(x) !== true ? false : x;
					if (this.min !== null && Number(x) < Number(this.min)) {
						this.error("the max attribute is less than the min attribute.", "max", x);
					}
				} else if (this.type === "date") {
					if (this.DATE.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FDATE.test(x) !== true) {
						x = false;
					}
				} else if (this.type === "time") {
					if (this.TIME.test(x) === true) {
						x = "'"+x+"'";
					} else if (this.FTIME.test(x) !== true) {
						x = false;
					}
				} else {
					x = null;
				}
			}
			if (x === false) {this.error("Invalid value", "maxn", x);}
			return x;
		}},
		table: {get: function() {
			var x;
			if (this.type !== "id") {
				x = null;
			} else {
				x =  this.val("table");
				if (this.NAME.test(x) !== true) {this.error("Invalid value", "table", x);}
			}
			return x;		
		}},
		childs: {get: function() {
			var x, names, name;
			names = [];
			if (this.tag === "sql") {
				x = this.getElementsByTagName("table");
			} else if (this.tag === "table") {
				x = this.getElementsByTagName("column");
			} else {
				x = this.getElementsByTagName("sql");
			}
			if (x.length === 0) {
				this.error("Element has no children.", this.tag, "[]");
			}
			if (this.tag === "sql" || this.tag === "table") {
				for (var i = 0; i < x.length; i++) {
					name = new Master(x[i]).name;
					if (names.indexOf(name) >= 0) {
						this.error("Repeated name used.", this.tag, "[]");
					}
					names.push(name);
				}
			}
			return x;
		}},
	});

/*+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

	/*-- CONFIGURAÇÃO: tipos --*/
	CONFIG = {};

	CONFIG.free    = {};
	CONFIG.number  = {};
	CONFIG.text    = {};
	CONFIG.boolean = {};
	CONFIG.date    = {};
	CONFIG.time    = {};
	CONFIG.id      = {};
	
	FREE    = CONFIG.free;
	NUMBER  = CONFIG.number;
	TEXT    = CONFIG.text;
	BOOLEAN = CONFIG.boolean;
	DATE    = CONFIG.date;
	TIME    = CONFIG.time;
	ID      = CONFIG.id;

	/*-- CONFIGURAÇÃO: produtos --*/
	for (var type in CONFIG) {
		CONFIG[type].value   = {};
		CONFIG[type].column  = {};
		CONFIG[type].view    = {};
		CONFIG[type].trigger = {};
	}

	/*-- CONFIGURAÇÃO: colunas --*/
	FREE.column = {
		type:    "@col@ TEXT",
		unique:  "UNIQUE",
		notNull: "NOT NULL",
		default: "DEFAULT(@default@)"
	};
	NUMBER.column = {
		type:    "@col@ NUMBER",
		unique:  FREE.column.unique,
		notNull: FREE.column.notNull,
		default: FREE.column.default
	};
	TEXT.column = {
		type:    FREE.column.type,
		unique:  FREE.column.unique,
		notNull: FREE.column.notNull,
		default: FREE.column.default
	};
	BOOLEAN.column = {
		type:    "@col@ INTEGER",
		notNull: FREE.column.notNull,
		default: FREE.column.default
	};
	DATE.column = {
		type:    FREE.column.type,
		unique:  FREE.column.unique,
		notNull: FREE.column.notNull,
		default: FREE.column.default
	};
	TIME.column = {
		type:    FREE.column.type,
		unique:  FREE.column.unique,
		notNull: FREE.column.notNull,
		default: FREE.column.default
	};
	ID.column = {
		type: BOOLEAN.column.type
	};

	/*-- CONFIGURAÇÃO: chave estrangeira --*/
	ID.foreign = {
		key: "FOREIGN KEY(@col@) REFERENCES @table@(_id_) ON UPDATE CASCADE"
	};

	/*-- CONFIGURAÇÃO: gatilhos INSERT/UPDATE BEFORE --*/
	FREE.trigger = {
		unique:  "(SELECT COUNT(*) FROM @tab@ WHERE @col@ = new.@col@) > 0",
		notNull: "new.@col@ IS NULL OR TRIM(new.@col@) = ''",
		min:     "new.@col@ < @min@",
		max:     "new.@col@ > @max@",
		glob:    "new.@col@ NOT GLOB @glob@",
		like:    "new.@col@ NOT LIKE @like@"
	};
	NUMBER.trigger = {
		type:    "UPPER(TYPEOF(new.@col@)) NOT IN ('INTEGER', 'REAL')",
		unique:  FREE.trigger.unique,
		notNull: FREE.trigger.notNull,
		min:     FREE.trigger.min,
		max:     FREE.trigger.max
	};
	TEXT.trigger = {
		type:    "UPPER(new.@col@) GLOB '*[^A-Z ]*' OR UPPER(new.@col@) NOT GLOB '[A-Z]*[A-Z]' OR new.@col@ GLOB '*  *'",
		unique:  "(SELECT COUNT(*) FROM @tab@ WHERE UPPER(@col@) = UPPER(new.@col@)) > 0",
		notNull: FREE.trigger.notNull,
		min:     "LENGTH(new.@col@) < @min@",
		max:     "LENGTH(new.@col@) > @max@"
	};
	BOOLEAN.trigger = {
		type:    "new.@col@ NOT IN (0,1)",
		notNull: FREE.trigger.notNull
	};
	DATE.trigger = {
		type:   "DATE(new.@col@, '+1 day', '-1 day') != new.@col@",
		unique:  FREE.trigger.unique,
		notNull: FREE.trigger.notNull,
		min:     FREE.trigger.min,
		max:     FREE.trigger.max
	};
	TIME.trigger = {
		type:    "TIME(new.@col@) IS NULL OR new.@col@ NOT GLOB '[0-2][0-9]:[0-5][0-9]*'",
		unique:  FREE.trigger.unique,
		notNull: FREE.trigger.notNull,
		min:     FREE.trigger.min,
		max:     FREE.trigger.max
	};
	ID.trigger = {
		type: "new.@col@ IS NULL OR (SELECT COUNT(*) FROM @table@ WHERE _id_ = new.@col@) != 1"
	};

	/*-- CONFIGURAÇÃO: menssages --*/
	FREE.message = {
		type:    "@col@: Enter a textual value",
		unique:  "@col@: Existing registration.",
		notNull: "@col@: Required value.",
		min:     "@col@: Value less than allowed.",
		max:     "@col@: Greater than allowed value.",
		glob:    "@col@: Value in the wrong format.",
		like:    "@col@: Value in the wrong format."
	};
	NUMBER.message = {
		type:    "@col@: The value must be numeric.",
		unique:  FREE.message.unique,
		notNull: FREE.message.notNull,
		min:     FREE.message.min,
		max:     FREE.message.min
	};
	TEXT.message = {
		type:    "@col@: Enter only letters and simple spaces.",
		unique:  FREE.message.unique,
		notNull: FREE.message.notNull,
		min:     "@col@: Amount of characters less than allowed.",
		max:     "@col@: Amount of characters greater than allowed."
	};
	BOOLEAN.message = {
		type:    "@col@: The value must be boolean (1 or 0).",
		notNull: FREE.message.notNull
	};
	DATE.message = {
		type:    "@col@: Enter a valid date.",
		unique:  FREE.message.unique,
		notNull: FREE.message.notNull,
		min:     FREE.message.min,
		max:     FREE.message.min
	};
	TIME.message = {
		type:    "@col@: Enter a valid time.",
		unique:  FREE.message.unique,
		notNull: FREE.message.notNull,
		min:     FREE.message.min,
		max:     FREE.message.min
	};
	ID.message = {
		type: "@col@: Register not found in table @table@"
	};

	/*-- CONFIGURAÇÃO: INSERT LOG --*/ //FIXME: precisa disso? para que serve?
	FREE.log = {
			type: "TRIM(@col@)"
	};
	NUMBER.log = {
		type: "ABS(new.@col@) <> 0 OR new.@col@ = 0 THEN CAST(new.%col AS REAL) ELSE new.@col@"
	};
	TEXT.log = {
		type: "WHEN TRIM(new.@col@) = '' THEN NULL ELSE REPLACE(UPPER(TRIM(new.@col@)), '  ', ' ')"
	};
	BOOLEAN.log = {
		type: "UPPER(new.@col@) IN ('TRUE', '1') THEN 1 WHEN UPPER(new.@col@l) IN ('FALSE', '0') THEN 0 ELSE new.@col@"
	};
	DATE.log = {
		type: "TRIM(@col@)"
	};
	TIME.log = {
		type: "TRIM(@col@)"
	};
	ID.log = {
		type: "TRIM(@col@)"
	};























































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
		cols = tab.getElementsByTagName("column");
		/*-- obtendo colunas e chaves --*/
		col.push("_id_ INTEGER PRIMARY KEY AUTOINCREMENT");
		for (var i = 0; i < cols.length; i++) {
			data = attr(cols[i]);
			col.push(createColumn(data.column));
			if ("foreign" in col) {
				key.push(data.foreign.key);
			}
		}
		/*-- transferindo as chaves para as colunas --*/
		for (var k = 0; k < key.length; k++) {
			col.push(key[k]);
		}
		/*-- construindo a tabela --*/
		sql.push("CREATE TABLE IF NOT EXISTS "+tab.getAttribute("name")+" (");
		sql.push("\t"+col.join(",\n\t"));
		sql.push(");");
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
		/*
		log = checkErrors(xml);
		if (log.length > 0) {
			showErrors(log);
			throw Error("XSQLite -> Inconsistencies found in table guidelines.");
		}*/
		Object.defineProperties(this, {
			_x: {
				value: xml
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
				sql = ["PRAGMA foreign_keys = ON;"];
				tabs = this._x.getElementsByTagName("sql")[0].getElementsByTagName("table");
				for (var i = 0; i < tabs.length; i++) {
					sql.push(createTable(tabs[i]));
					sql.push(createView(tabs[i]));
					sql.push(createLog(tabs[i]));
					sql.push(createTriggerBefore(tabs[i], "INSERT"));
					sql.push(createTriggerBefore(tabs[i], "UPDATE"));
					sql.push(createTriggerAfter(tabs[i], "INSERT"));
					sql.push(createTriggerAfter(tabs[i], "UPDATE"));
					sql.push(createTriggerAfter(tabs[i], "DELETE"));
				}
				return sql.join("\n\n------------------------------------------------------\n\n");
			}
		}
	});

	return XSQLite;
})();

window.addEventListener("load", function() {
	//var x = XSQLite(document.getElementById("xml").value);
	//console.log(x.toSQL());
});

