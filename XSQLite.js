"use strict";

var XSQLite = (function() {

	/*-- Configuration --*/
	var TYPES = {
		text: {},
		number: {},
		boolean: {},
		date: {},
		time: {},
		free: {},
		id: {}
	};
	
	/*-- Configuration: TYPES --*/
	TYPES.text = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.number = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.boolean = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.date = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.time = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.free = {
		value: {},
		column: {},
		view: {},
		trigger: {}
	};

	TYPES.id = {
		value: {},
		column: {},
		foreign: {},
		view: {},
		trigger: {}
	};

	/*-- Configuration: Value --*/
	TYPES.text.value = {
		name: xName,
		type: xType,
		unique: xUnique,
		null: xNull,
		default: xText,
		min: xChars,
		max: xChars
	};

	TYPES.number.value = {
		name: xName,
		type: xType,
		unique: xUnique,
		null: xNull,
		default: xNumber,
		min: xNumber,
		max: xNumber
	};

	TYPES.boolean.value = {
		name: xName,
		type: xType,
		null: xNull,
		default: xBoolean
	};

	TYPES.date.value = {
		name: xName,
		type: xType,
		unique: xUnique,
		null: xNull,
		default: xDate,
		min: xDate,
		max: xDate
	};

	TYPES.time.value = {
		name: xName,
		type: xType,
		unique: xUnique,
		null: xNull,
		default: xTime,
		min: xTime,
		max: xTime
	};

	TYPES.free.value = {
		name: xName,
		type: xType,
		unique: xUnique,
		null: xNull,
		default: xFree,
		min: xFree,
		max: xFree,
		glob: xFree,
		like: xFree
	};

	TYPES.id.value = {
		name: xName,
		type: xType,
		target: xName
	};

	/*-- Configuration: column --*/
	TYPES.text.column = {
		type: function(val) {return val.name+" TEXT";},
		unique: cUnique,
		null: cNull,
		default: cDefault,
	};

	TYPES.number.column = {
		type: function(val) {return val.name+" NUMBER";},
		unique: cUnique,
		null: cNull,
		default: cDefault,
	};

	TYPES.boolean.column = {
		type: function(val) {return val.name+" INTEGER";},
		null: cNull,
		default: cDefault
	};

	TYPES.date.column = {
		type: function(val) {return val.name+" TEXT";},
		unique: cUnique,
		null: cNull,
		default: cDefault,
	};

	TYPES.time.column = {
		type: function(val) {return val.name+" TEXT";},
		unique: cUnique,
		null: cNull,
		default: cDefault,
	};

	TYPES.free.column = {
		type: function(val) {return val.name+" TEXT";},
		unique: cUnique,
		null: cNull,
		default: cDefault,
	};

	TYPES.id.column = {
		type: function(val) {return val.name+" INTEGER";}
	};

	/*-- Configuration: foreign --*/
	TYPES.id.foreign = {
		key: function(val) {return "FOREIGN KEY("+val.name+") REFERENCES "+val.target+"(_id_) ON UPDATE CASCADE";}
	};

	/*-- Configuration: trigger INSERT/UPDATE BEFORE --*/
	/**
	não aceitar string vazia (string vazia é NULL) [TRIM(new.col) = ''] "pensar melhor a respeito ('' x NULL x DEFAULT -> eu quero uma string em branco ou o valor default)"
	
	**/
	TYPES.text.trigger = {
		type: function(val) {
			var sql = tIsNull(val);
			sql += "(new."+val.name+" GLOB '*[^A-Z ]*' ";
			sql += "OR REPLACE(TRIM(new."+val.name+"), '  ', ' ') != new."+val.name+" ";
			sql += "OR TRIM(new."+val.name+") = '')";
				return sql;
		},
		unique: tUnique,
		null: tNull,
		min: function(val) {return tIsNull(val)+"(LENGTH(new."+val.name+") < "+val.min+")";},
		max: function(val) {return tIsNull(val)+"(LENGTH(new."+val.name+") > "+val.max+")";}
	};

	TYPES.number.trigger = {
		type: function(val) {return tIsNull(val)+"(UPPER(TYPEOF(new."+val.name+")) NOT IN ('NUMERIC', 'INTEGER', 'REAL'))";},
		unique: tUnique,
		null: tNull,
		min: tMin,
		max: tMax
	};

	TYPES.boolean.trigger = {
		type: function(val) {return tIsNull(val)+"(new."+val.name+" NOT IN (0,1))";},
		null: tNull,
	};

	TYPES.date.trigger = {
		type: function(val) {return tIsNull(val)+"(DATE(new."+val.name+", '+1 day', '-1 day') != new."+val.name+")";},
		unique: tUnique,
		null: tNull,
		min: tMin,
		max: tMax
	};

	TYPES.time.trigger = {
		type: function(val) {return tIsNull(val)+"(TIME(new."+val.name+") IS NULL OR new."+val.name+" NOT GLOB '[0-2][0-9]:[0-5][0-9]*')";},
		unique: tUnique,
		null: tNull,
		min: tMin,
		max: tMax
	};

	TYPES.free.trigger = {
		type: function(val) {return tIsNull(val)+"(UPPER(TYPEOF(new."+val.name+")) != 'TEXT')";},
		unique: tUnique,
		null: tNull,
		min: tMin,
		max: tMax,
		glob: function(val) {return tIsNull(val)+"(new."+val.name+" NOT GLOB "+val.glob+")";},
		like: function(val) {return tIsNull(val)+"(new."+val.name+" NOT LIKE "+val.like+")";},
	};

	TYPES.id.trigger = {
		type: function(val) {return "(new."+val.name+" IS NULL) OR ((SELECT COUNT(*) FROM "+val.target+" WHERE _id_ = new."+val.name+") != 1)";}
	};

	/*-- Configuration: messages --*/
	TYPES.text.message = {
		type: function(val) {return val.name+": Enter only letters and simple spaces.";},
		unique: mUnique,
		null: mNull,
		min: function(val) {return val.name+": Amount of characters less than allowed.";},
		max: function(val) {return val.name+": Amount of characters greater than allowed.";}
	};

	TYPES.number.message = {
		type: function(val) {return val.name+": The value must be numeric.";},
		unique: mUnique,
		null: mNull,
		min: mMin,
		max: mMax
	};

	TYPES.boolean.message = {
		type: function(val) {return val.name+": The value must be boolean (1 or 0).";},
		null: mNull,
	};

	TYPES.date.message = {
		type: function(val) {return val.name+": Enter a valid date.";},
		unique: mUnique,
		null: mNull,
		min: mMin,
		max: mMax
	};

	TYPES.time.message = {
		type: function(val) {return val.name+": Enter a valid time.";},
		unique: mUnique,
		null: mNull,
		min: mMin,
		max: mMax
	};

	TYPES.free.message = {
		type: function(val) {return val.name+": Enter a textual value";},
		unique: mUnique,
		null: mNull,
		min: mMin,
		max: mMax,
		glob: mPattern,
		like: mPattern
	};

	TYPES.id.message = {
		type: function(val) {return val.name+": Register not found in table "+val.target+".";}
	};

	/*-- Configuration: INSERT LOG --*/
	TYPES.text.log = {
		type: function(val) {return "WHEN TRIM(new."+val.name+") = '' THEN NULL ELSE REPLACE(UPPER(TRIM(new."+val.name+")), '  ', ' ')";}
	};

	TYPES.number.log = {
		type: function(val) {return "ABS(new."+val.name+") <> 0 OR new."+val.name+" = 0 THEN CAST(new.%col AS REAL) ELSE new.%col"+val.name;}
	};

	TYPES.boolean.log = {
		type: function(val) {return "UPPER(new."+val.name+") IN ('TRUE', '1') THEN 1 WHEN UPPER(new."+val.name+"l) IN ('FALSE', '0') THEN 0 ELSE new."+val.name;}
	};

	TYPES.date.log = {
		type: function(val) {return "TRIM("+val.name+")";}
	};

	TYPES.time.log = {
		type: function(val) {return "TRIM("+val.name+")";}
	};

	TYPES.free.log = {
		type: function(val) {return "TRIM("+val.name+")";}
	};

	TYPES.id.log = {
		type: function(val) {return "TRIM("+val.name+")";}
	};

	/*-- Get attribute value --*/
	function xType(value) {
		return value !== null && value in TYPES ? value : "free";
	};

	function xName(value) {
		return value !== null && (/^[A-Z]([A-Z0-9\_]+)?$/i).test(value) ? value : null;
	};

	function xUnique(value) {
		return value === null || value.toLowerCase() !== "true" ? null : true;
	};

	function xNull(value) {
		return value === null || value.toLowerCase() !== "false" ? null : false;
	};

	function xText(value) {
		return value !== null && (/^[A-Z]+((\ [A-Z]+)+)?$/).test(value) ? "'"+value+"'" : null;
	};

	function xChars(value) {
		return value !== null && (/^[1-9]([0-9]+)?$/).test(value) ? value : null;
	};

	function xNumber(value) {
		return !isNaN(value) ? value : null;
	};
	
	function xBoolean(value) {
		return value !== null && (/^[01]?$/).test(value) ? value : null;
	};

	function xDate(value) {
		if ((/^[0-9]{4}(\-[0-9]{2}){2}$/).test(value)) {
			value = "'"+value+"'"
		} else if ((/^DATE\(.*\)$/).test(value)) {
			value = value;
		} else {
			value = null;
		}
		return value;
	};

	function xTime(value) {
		if ((/^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/).test(value)) {
			value = "'"+value+"'"
		} else if ((/^TIME\(.*\)$/).test(value)) {
			value = value;
		} else {
			value = null;
		}
		return value;
	};

	function xFree(value) {
		return value !== null ? "'"+value+"'" : null;
	};

	/*-- Get Column constraint --*/
	function cUnique(val) {
		return "UNIQUE";
	};

	function cNull(val) {
		return "NOT NULL";
	};

	function cDefault(val) {
		return "DEFAULT("+val.default+")";
	};
	
	/*-- Get trigger constraint --*/
	function tUnique(val) {
		return tIsNull(val)+"((SELECT COUNT(*) FROM "+val.tab+" WHERE "+val.name+" = new."+val.name+") > 0)";
	};

	function tNull(val) {
		return "(new."+val.name+" IS NULL OR TRIM(new."+val.name+") = '')";
	};

	function tMin(val) {
		return tIsNull(val)+"(new."+val.name+" < "+val.min+")";
	};

	function tMax(val) {
		return tIsNull(val)+"(new."+val.name+" > "+val.max+")";
	};

	function tIsNull(val) {
		return val.null === null ? "(new."+val.name+" IS NOT NULL) AND " : "";
	};

	/*-- Get trigger messages --*/
	function mUnique(val) {
		return val.name+": Existing registration.";
	};

	function mNull(val) {
		return val.name+": Required value.";
	};

	function mMin(val) {
		return val.name+": Value less than allowed.";
	};

	function mMax(val) {
		return val.name+": Greater than allowed value.";
	};

	function mPattern(val) {
		return val.name+": Value in the wrong format."
	};

	/*-- Get All Information from column --*/
	function xAttributes(col) {
		var type, obj, value;
		/*-- getting type --*/
		type = xType(col.getAttribute("type"));
		/*-- setting obj var --*/
		obj  = {value: {}};
		/*-- getting column values --*/
		for (var val in TYPES[type].value) {
			obj.value[val] = TYPES[type].value[val](col.getAttribute(val));
		}
		/*-- getting table name --*/
		obj.value.tab = xName(col.parentNode.getAttribute("name"));
		/*-- getting the other information (Except "value".) --*/
		for (var key in TYPES[type]) {
			if (key !== "value") {
				obj[key] = {};
				for (var att in TYPES[type][key]) {
					/*-- getting value (if not null) --*/
					if (obj.value[att] !== null) {
						value = TYPES[type][key][att](obj.value);
						if (key === "message" && col.getElementsByTagName(att).length > 0) {
							value = col.getElementsByTagName(att)[0].childNodes[0].nodeValue;
						}
						obj[key][att] = value;

					}
				}
			}
		}/*console.log(obj);*/
		return obj;
	};

	/*-- Errors --*/
	var errors = {
		root: "Root element not found.",
		roots: "More than one root element was found.",
		table: "Tables not found in root element.",
		name: "Attribute 'name' not defined or in incorrect format.",
		column: "Table without columns.",
		tname: "Name of table already used.",
		cname: "Name of column already used in table.",
		attribute: "Incorrect attribute value.",
		id: "The type 'id' requires the 'target' attribute."
	};

	function checkErrors(x) {
		var root, tabs, cols, log, tname, cname, val, attr, tab, col;
		log  = [];
		/*-- CHECKING ROOT TAG --*/
		root = x.getElementsByTagName("sql");
		/*-- no roots --*/
		if (root.length === 0) {
			log.push({tab: "-", col: "-", attr: "-", val: "<sql></sql>", msg: errors.root});
		/*-- many roots --*/
		} else if (root.length > 1) {
			log.push({tab: "-", col: "-", attr: "-", val: "<sql></sql>", msg: errors.roots});
		}
		/*-- CHECKING TABLE TAG --*/
		tabs = root.length !== 0 ? root[0].getElementsByTagName("table") : [];
		/*-- no tables --*/
		if (tabs.length === 0 && root.length !== 0) {
			log.push({tab: "-", col: "-", attr: "-", val: "<table></table>", msg: errors.table});
		}
		tname = [];
		for (var t = 0; t < tabs.length; t++) {
			/*-- checking table name (with/without) --*/
			val = tabs[t].getAttribute("name");
			tab = val === null ? t : val;
			if (tname.indexOf(val) >= 0) {
				log.push({tab: tab, col: "-", attr: "name", val: val, msg: errors.tname});
			} else {
				tname.push(val);
			}
			if (xName(val) === null) {
				log.push({tab: tab, col: "-", attr: "name", val: val, msg: errors.name});
			}
			/*-- CHECKING COLUMN TAG --*/
			cols = tabs[t].getElementsByTagName("column");
			/*-- no columns --*/
			if (cols.length === 0) {
				log.push({tab: tab, col: "-", attr: "-", val: "<column></column>", msg: errors.column});
			}
			cname = [];
			for (var c = 0; c < cols.length; c++) {
				/*-- checking column name (with/without) --*/
				val = cols[c].getAttribute("name");
				col = val === null ? c : val;
				if (cname.indexOf(val) >= 0) {
					log.push({tab: tab, col: col, attr: "name", val: val, msg: errors.cname});
				} else {
					cname.push(val);
				}
				if (xName(val) === null) {
					log.push({tab: tab, col: col, attr: "name", val: val, msg: errors.name});
				}
				/*-- CHECKING ATTRIBUTES COLUMN TAG --*/
				/*-- getting attributes to chack --*/
				val = xType(cols[c].getAttribute("type"));
				attr = TYPES[val].value;
				for (var a in attr) {
					/*-- attributes to ignore --*/
					if (["unique", "null", "type", "name"].indexOf(a) >= 0) {
						continue;
					}
					/*-- getting and checking attribute value --*/
					val = attr[a](cols[c].getAttribute(a));
					if (val === null && cols[c].getAttribute(a) !== null) {
						log.push({tab: tab, col: col, attr: a, val: cols[c].getAttribute(a), msg: errors.attribute})
					}
					/*-- chacking target attribute (id type) --*/
					if (a === "target" && cols[c].getAttribute(a) === null) {
						log.push({tab: tab, col: col, attr: a, val: cols[c].getAttribute(a), msg: errors.id})
					}
				}
			}
		}
		return log;
	};

	function showErrors(log) {
		var msg, items;
		if ("table" in console) {
			if ("warn" in console) {
				console.warn("Inconsistencies found in XML file:")
			} else {
				console.log("Inconsistencies found in XML file:");
			}
			console.table(log, ["tab", "col", "attr", "val", "msg"])
		} else {
			msg = ["Inconsistencies found in XML file:"];
			for (var i = 0; i < log.length; i++) {
				items = [];
				items.push("tab: "+log[i].tab);
				items.push("col: "+log[i].col);
				items.push("attr: "+log[i].attr);
				items.push("val: "+log[i].val);
				items.push("msg: "+log[i].msg);
				items = items.join(", ");
				msg.push(items);
			}
			console.log(msg.join("\n"));
		}
		return;
	}

	/*-- SQL COLUMN --*/
	function createColumn(col) {
		var sql, seq;
		sql = [];
		/*-- setting attribute sequence --*/
		seq = ["type", "unique", "null", "default"];
		/*-- looping in attributes --*/
		for (var i = 0; i < seq.length; i++) {
			/*-- adding values --*/
			if (seq[i] in col) {
				sql.push(col[seq[i]]);
			}
		}
		/*-- finishing column --*/
		return sql.join(" ");
	};

	/*-- SQL TABLE --*/
	function createTable(tab) {
		var sql, cols, keys, col, child;
		sql   = [];
		cols  = [];
		keys  = [];
		child = tab.getElementsByTagName("column");
		/*-- starting table --*/
		sql.push("CREATE TABLE IF NOT EXISTS "+tab.getAttribute("name")+" (");
		/*-- adding id column --*/
		cols.push("_id_ INTEGER PRIMARY KEY AUTOINCREMENT");
		/*-- looping in columns --*/
		for (var i = 0; i < child.length; i++) {
			/*-- getting data column --*/
			col = xAttributes(child[i]);
			/*-- creating column --*/
			cols.push(createColumn(col.column));
			/*-- creating foreign keys --*/
			if ("foreign" in col) {
				keys.push(col.foreign.key);
			}
		}
		/*-- adding foreign keys to columns --*/
		for (var k = 0; k < keys.length; k++) {
			cols.push(keys[k]);
		}
		/*-- adding columns to table --*/
		sql.push("\t"+cols.join(",\n\t"));
		/*-- finishing table --*/
		sql.push(");");
		return sql.join("\n");
	};

	/*-- SQL VIEW --*/
	function createView(tab) {
		var sql, col, child;
		sql   = [];
		col   = [];
		child = tab.getElementsByTagName("column");
		/*-- starting view --*/
		sql.push("CREATE VIEW IF NOT EXISTS vw_"+tab.getAttribute("name")+" AS SELECT ");
		/*-- looping in columns --*/
		for (var i = 0; i < child.length; i++) {
			col.push(xAttributes(child[i]).value.name);
		}
		/*-- adding columns to view --*/
		sql.push("\t"+col.join(",\n\t"));
		/*-- finishing view --*/
		sql.push("FROM "+tab.getAttribute("name")+";");
		return sql.join("\n");
	};

	/*-- SQL LOG --*/
	function createLog(tab) {
		var sql, cols, col, child;
		sql   = [];
		cols  = [];
		child = tab.getElementsByTagName("column");
		/*-- starting log --*/
		sql.push("CREATE TABLE IF NOT EXISTS _"+tab.getAttribute("name")+"_ (");
		/*-- adding event column --*/
		cols.push("_event_ TEXT CHECK(_event_ IN (-1, 0, 1))");
		/*-- adding log column --*/
		cols.push("_log_ TEXT DEFAULT(DATETIME('now', 'localtime'))");
		/*-- adding id column --*/
		cols.push("_id_ INTEGER");
		/*-- looping in columns --*/
		for (var i = 0; i < child.length; i++) {
			/*-- getting data column --*/
			col = xAttributes(child[i]);
			/*-- creating column --*/
			cols.push(col.column.type);
		}
		/*-- adding columns to log --*/
		sql.push("\t"+cols.join(",\n\t"));
		/*-- finishing log --*/
		sql.push(");");
		return sql.join("\n");
	};

	/*-- SQL TRIGGER CASES --*/
	function createCase(col) {
		var sql, seq;
		sql = [];
		sql.push("SELECT CASE");
		/*-- setting attribute sequence --*/
		seq = ["null", "unique", "type", "min", "max", "glob", "like"];
		/*-- looping in attributes --*/
		for (var i = 0; i < seq.length; i++) {
			/*-- adding values --*/
			if (seq[i] in col.trigger) {
				sql.push("\t\tWHEN "+col.trigger[seq[i]]+" THEN");
				sql.push("\t\t\tRAISE(ABORT, '"+col.message[seq[i]]+"')");
			}
		}
		sql.push("\tEND;\n");
		/*-- finishing column --*/
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
			col = xAttributes(child[i]);
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
			col.push(xAttributes(child[i]).value.name);
			if (type === "DELETE") {
				val.push("NULL");
			} else {
				val.push("new."+xAttributes(child[i]).value.name);
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
		log = checkErrors(xml);
		if (log.length > 0) {
			showErrors(log);
			throw Error("XSQLite -> Inconsistencies found in table guidelines.");
		}
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
	var x = XSQLite(document.getElementById("xml").value);
	console.log(x.toSQL());
});















































/*****************************************************************************/
function SQLite(json) {
	if (!(this instanceof SQLite)) {
		return new SQLite(json);
	}
	Object.defineProperties(this, {
		json: {
			value: JSON.parse(json)
		},
		sqlite: {
			value: {}
		},
		error: {
			value: []
		}
	});
	this.checkJSON();
	if (this.error.length > 0) throw Error("\n"+this.error.join("\n"));
	return
};

Object.defineProperty(SQLite.prototype, "constructor", {
	value: SQLite
});

/*Types and attributes*/
Object.defineProperty(SQLite.prototype, "types", {
	value: {
		key: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col INTEGER NOT NULL",
				log:   "%col INTEGER",
				view:  "new.%col",
				check: "????",
				error: "Enter only letters and simple spaces."
			},
			table: {
				level: 2,
				type:  "string",
				regex: /^[A-Z]([A-Z0-9\_]+)?$/i,
				table: "FOREIGN KEY(%col) REFERENCES %value(id) ON UPDATE CASCADE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %value WHERE id LIKE new.%col) = 0",
				error: "Unknown record."
			}
		},
		text: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col TEXT",
				log:   "%col TEXT",
				view:  "CASE WHEN UPPER(TYPEOF(new.%col)) = 'TEXT' THEN REPLACE(UPPER(TRIM(new.%col)), '  ', ' ') ELSE new.%col END",
				check: "new.%col GLOB '*[^A-Z ]*' OR INSTR(new.%col), '  ') > 0",
				error: "Enter only letters and simple spaces."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Required value."
			},
			unique: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "UNIQUE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %tab WHERE %col LIKE new.%col) > 0",
				error: "Existing registration."
			},
			default: {
				level: 1,
				type:  "string",
				regex: /^[A-Z]+((\ [A-Z]+)+)?$/,
				table: "DEFAULT('%value')",
				log:   null,
				view:  null,
				check: null,
				error: null
			},
			min: {
				level: 1,
				type:  "number",
				regex: /^[1-9]([0-9]+)?$/,
				table: "CHECK(LENGTH(%col) >= %value)",
				log:   null,
				view:  null,
				check: "LENGTH(new.col) < %value)",
				error: "Amount of characters less than allowed."
			},
			max: {
				level: 1,
				type:  "number",
				regex: /^[1-9]([0-9]+)?$/,
				table: "CHECK(LENGTH(%col) <= %value)",
				log:   null,
				view:  null,
				check: "LENGTH(new.%col) > %value)",
				error: "Amount of characters greater than allowed."
			}
		},
		number: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col REAL",
				log:   "%col REAL",
				view:  "CASE WHEN ABS(new.%col) <> 0 OR new.%col = 0 THEN CAST(new.%col AS REAL) ELSE new.%col END",
				check: "UPPER(TYPEOF(new.%col)) NOT IN ('NUMBER', 'INTEGER', 'REAL')",
				error: "The value must be numeric."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Required value."
			},
			unique: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "UNIQUE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %tab WHERE %col LIKE new.%col) > 0",
				error: "Existing registration."
			},
			default: {
				level: 1,
				type:  "number",
				regex: null,
				table: "DEFAULT(%value)",
				log:   null,
				view:  null,
				check: null,
				error: null
			},
			min: {
				level: 1,
				type:  "number",
				regex: null,
				table: "CHECK(%col >= %value)",
				log:   null,
				view:  null,
				check: "new.%col < %value",
				error: "Lower value than allowed."
			},
			max: {
				level: 1,
				type:  "number",
				regex: null,
				table: "CHECK(LENGTH(%col) <= %value)",
				log:   null,
				view:  null,
				check: "new.%col > %value",
				error: "Greater value than allowed."
			}
		},
		bool: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col INTEGER CHECK(%col IN (0, 1, NULL))",
				log:   "%col INTEGER",
				view:  "CASE WHEN UPPER(new.%col) IN ('TRUE', '1') THEN 1 WHEN UPPER(new.%col) IN ('FALSE', '0') THEN 0 ELSE new.%col END",
				check: "new.%col NOT IN (0, 1)",
				error: "The value must be boolean."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Column can not be set."
			},
			default: {
				level: 1,
				type:  "number",
				regex: /[01]/,
				table: "DEFAULT(%value)",
				log:   null,
				view:  null,
				check: null,
				error: null
			}
		},
		date: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col TEXT",
				log:   "%col TEXT",
				view:  "TRIM(new.%col)",
				check: "DATE(new.%col, '+1 day', '-1 day') != new.%col",
				error: "Please enter a valid date."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Required value."
			},
			unique: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "UNIQUE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %tab WHERE %col LIKE new.%col) > 0",
				error: "Existing registration."
			},
			default: {
				level: 1,
				type:  "string",
				regex: /^(\'[0-9]{4}(\-[0-9]{2}){2}\'$|DATE\(.*\))$/,
				table: "DEFAULT(%value)",
				log:   null,
				view:  null,
				check: null,
				error: null
			},
			min: {
				level: 1,
				type:  "string",
				regex: /^(\'[0-9]{4}(\-[0-9]{2}){2}\'$|DATE\(.*\))$/,
				table: "CHECK(%col >= %value)",
				log:   null,
				view:  null,
				check: "new.%col < %value",
				error: "Lower value than allowed."
			},
			max: {
				level: 1,
				type:  "string",
				regex: /^(\'[0-9]{4}(\-[0-9]{2}){2}\'$|DATE\(.*\))$/,
				table: "CHECK(%col <= %value)",
				log:   null,
				view:  null,
				check: "new.%col > %value",
				error: "Greater value than allowed."
			}
		},
		time: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col TEXT",
				log:   "%col TEXT",
				view:  "TRIM(new.%col)",
				check: "TIME(new.%col) IS NULL OR new.%col NOT GLOB '[0-2][0-9]:[0-5][0-9]*'",
				error: "Please enter a valid time."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Required value."
			},
			unique: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "UNIQUE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %tab WHERE %col LIKE new.%col) > 0",
				error: "Existing registration."
			},
			default: {
				level: 1,
				type:  "string",
				regex: /^(\'([01][0-9]|2[0-3])(\:[0-5][0-9]){2}\'$|TIME\(.*\))$/,
				table: "DEFAULT(%value)",
				log:   null,
				view:  null,
				check: null,
				error: null
			},
			min: {
				level: 1,
				type:  "string",
				regex: /^(\'([01][0-9]|2[0-3])(\:[0-5][0-9]){2}\'$|TIME\(.*\))$/,
				table: "CHECK(%col >= %value)",
				log:   null,
				view:  null,
				check: "new.%col < %value",
				error: "Lower value than allowed."
			},
			max: {
				level: 1,
				type:  "string",
				regex: /^(\'([01][0-9]|2[0-3])(\:[0-5][0-9]){2}\'$|TIME\(.*\))$/,
				table: "CHECK(%col <= %value)",
				log:   null,
				view:  null,
				check: "new.%col > %value",
				error: "Greater value than allowed."
			}
		},
		free: {
			type: {
				level: 0,
				type:  "string",
				regex: /[a-z]+/,
				table: "%col TEXT",
				log:   "%col TEXT",
				view:  "TRIM(new.%col)",
				check: "UPPER(TYPEOF(new.%col)) NOT IN ('TEXT')",
				error: "Enter a textual value."
			},
			notNull: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "NOT NULL",
				log:   null,
				view:  null,
				check: "new.%col IS NULL",
				error: "Required value."
			},
			unique: {
				level: 1,
				type: "boolean",
				regex: null,
				table: "UNIQUE",
				log:   null,
				view:  null,
				check: "(SELECT COUNT(*) FROM %tab WHERE %col LIKE new.%col) > 0",
				error: "Existing registration."
			},
			default: {
				level: 1,
				type:  "string",
				regex: null,
				table: "DEFAULT('%value')",
				log:   null,
				view:  null,
				check: null,
				error: null
			},
			min: {
				level: 1,
				type:  "string",
				regex: null,
				table: "CHECK(%col >= '%value')",
				log:   null,
				view:  null,
				check: "%col < '%value')",
				error: "Lower value than allowed."
			},
			max: {
				level: 1,
				type:  "string",
				regex: null,
				table: "CHECK(%col <= %value)",
				log:   null,
				view:  null,
				check: "new.%col > '%value'",
				error: "Greater value than allowed."
			},
			glob: {
				level: 1,
				type:  "string",
				regex: null,
				table: null,
				log:   null,
				view:  null,
				check: "new.%col NOT GLOB '%value'",
				error: "Record in incorrect format."
			},
			notGlob: {
				level: 1,
				type:  "string",
				regex: null,
				table: null,
				log:   null,
				view:  null,
				check: "new.%col GLOB '%value'",
				error: "Record in incorrect format."
			},
			like: {
				level: 1,
				type:  "string",
				regex: null,
				table: null,
				log:   null,
				view:  null,
				check: "new.%col NOT LIKE '%value'",
				error: "Record in incorrect format."
			},
			notLike: {
				level: 1,
				type:  "string",
				regex: null,
				table: null,
				log:   null,
				view:  null,
				check: "new.%col LIKE '%value'",
				error: "Record in incorrect format."
			}
		}
	}
});

/*configuration and default values*/
Object.defineProperties(SQLite.prototype, {
	nameFormat: {
		value: /^[A-Z]([A-Z0-9\_]+)?$/i
	},
	reservedTypes: {
		value: {
			id: {
				type: {
					level: 0,
					type:  "string",
					regex: /[a-z]+/,
					table: "%col INTEGER PRIMARY KEY",
					log:   "%col INTEGER",
					view:  null,
					check: "UPPER(TYPEOF(new.%col)) NOT IN ('TEXT')",
					error: "Enter a textual value.",
				}
			},
			action: {
				type: {
					level: 0,
					type:  "string",
					regex: /[a-z]+/,
					table: "%col TEXT CHECK(%col IN ('INSERT', 'UPDATE','DELETE'))",
					log:   null,
					view:  null,
					check: "new.%col IN ('INSERT', 'UPDATE','DELETE')",
					error: "Internal error: value of column _action."
				}
			},
			log: {
				type: {
					level: 0,
					type:  "string",
					regex: /[a-z]+/,
					table: "%col TEXT DEFAULT(DATETIME('now', 'localtime'))",
					log:   null,
					view:  null,
					check: null,
					error: null
				}
			}
		}
	},
	reservedColumns: {
		value: {
			id:      {type: {value: "id"}},
			_id:     {type: {value: "id"}},
			_log:    {type: {value: "log"}},
			_action: {type: {value: "action"}}
		}
	}
});

/*Erros and checking*/
Object.defineProperties(SQLite.prototype, {
	errors: {
		value: {
			j0: "No table found",
			t0: "No columns found in the table",
			t1: "Table name in incorrect format",
			c0: "No attributes found in the column",
			c1: "The \"type\" attribute has not been defined",
			c2: "Column name in incorrect format",
			c3: "The column type is not allowed",
			a0: "The \"value\" attribute has not been defined",
			a1: "There is an attribute that does not belong to the structure",
			a2: "Unknown or not allowed attribute for the reported type",
			v0: "Invalid value format for the attribute",
			m0: "The \"msg\" attribute must be a string"
		}
	},
	setError: {
		value: function(level, item, t, c, a, v) {
			var error, id, show;
			id = level+item;
			if (this.errors[id] === undefined) {
				error = "Unidentified error message";
			} else {
				error = this.errors[id];
			}
			if (level === "j") {
				show = "{}";
			} else if (level === "t") {
				show = t;
			} else if (level === "c") {
				show = t+"."+c;
			} else if (level === "a") {
				show = t+"."+c+"."+a;
			} else if (level === "v") {
				show = t+"."+c+"."+a+".value: "+v;
			} else if (level === "m") {
				show = t+"."+c+"."+a+".msg: "+v;
			}
			this.error.push("#"+id+" "+show+"\n\t"+error+"\n");
			return;
		}
	},
	checkJSON: {
		value: function() {
			if (Object.keys(this.json).length === 0) {
				this.setError("j", 0);
			} else {
				this.checkTables();
			}
			return;
		}
	},
	checkTables: {
		value: function() {
			var json;
			for (var t in this.json) {
				json = this.json[t];
				if (Object.keys(json).length === 0) {
					this.setError("t", 0, t);
				} else if (!this.nameFormat.test(t)) {
					this.setError("t", 1, t);
				} else {
					this.checkColumns(t);
				}
			}
			return;
		}
	},
	checkColumns: {
		value: function(t) {
			var json;
			for (var c in this.json[t]) {
				json = this.json[t][c];
				if (Object.keys(json).length === 0) {
					this.setError("c", 0, t, c);
				} else if (!("type" in json)) {
					this.setError("c", 1, t, c);
				} else if (!this.nameFormat.test(c)) {
					this.setError("c", 2, t, c);
				} else if (!(json.type.value in this.types)) {
					this.setError("c", 3, t, c);
				} else {
					this.checkAttributes(t, c);
				}
			}
			return;
		}
	},
	checkAttributes: {
		value: function(t, c) {
			var json, type, data;
			type = this.getValue(t, c, "type");
			data = this.types[type];
			for (var a in this.json[t][c]) {
				json = this.json[t][c][a];
				if (!("value" in json)) {
					this.setError("a", 0, t, c, a, v);
				} else if (Object.keys(json).length > 1 && !("msg" in json)) {
					this.setError("a", 1, t, c, a);
				} else if (!(a in data)) {
					this.setError("a", 2, t, c, a);
				} else {
					this.checkValues(t, c, a);
				}
			}
			return;
		}
	},
	checkValues: {
		value: function (t, c, a) {
			var json, type, data;
			json = this.json[t][c][a];
			type = this.getValue(t, c, "type");
			data = this.types[type][a];
			if (data.type !== null && typeof json.value !== data.type) {
				this.setError("v", 0, t, c, a, json.value);
			} else if (data.regex !== null && !data.regex.test(json.value)) {
				this.setError("v", 0, t, c, a, json.value);
			} else if ("msg" in json && typeof json.msg !== "string") {
				this.setError("m", 0, t, c, a, json.msg);
			}
			return
		}
	}
});


Object.defineProperties(SQLite.prototype, {
	sql: {
		value: {
			table:   "CREATE TABLE IF NOT EXISTS %name (\n\t%columns\n);",
			view:    "CREATE VIEW IF NOT EXISTS vw_%name AS SELECT * FROM %name;",
			trigger: "CREATE TRIGGER IF NOT EXISTS tr_%name %type ON %table BEGIN\n\n%selects\n\n%action\n\nEND;",
			insert:  "\tINSERT INTO %table (\n\t\t%columns\n\t) VALUES (\n\t\t%values\n\t);",
			update:  "\tUPDATE %table SET \n\t\t%values\n\tWHERE id = old.id;",
			delete:  "\tDELETE FROM %table WHERE id = old.id;",
		}
	},
	order: {
		value: ["type", "unique", "notNull", "default", "min", "max", "glob", "notGlob", "like", "notLike", "table"]
	},
	getValue: {
		value: function(t, c, a, msg) {
			var value, json;
			json = c in this.reservedColumns ? this.reservedColumns : this.json[t];
			try {
				value = msg === true ? json[c][a].msg : json[c][a].value;
			} catch(e) {
				value = null;
			}
			return value === false || value === undefined ? null : value;
		}
	},
	getColumn: {
		value: function(t, c, log) {
			var type, v, a, data, line, item;
			if (c in this.reservedColumns) {
				type = this.getValue(t, c, "type");
				data = this.reservedTypes[type];
			} else {
				type = this.getValue(t, c, "type");
				data = this.types[type];
			}
			line = [];
			for (var i = 0; i < this.order.length; i++) {
				a = this.order[i];
				v = this.getValue(t, c, a);
				if (v === null) {
					continue;
				} else if (log !== true) {
					item = data[a].table.replace(/\%value/g, v).replace(/\%col/g, c);
					line.push(item);
				}
				else if (data[a].log !== null) {
					item = data[a].log.replace(/\%value/g, v).replace(/\%col/g, c);
					line.push(item);
				}
			}
			line = line.join(" ");
			return line;
		}
	},
	createTable: {
		value: function(t, log) {
			var sql, cols, fkey, value;
			cols = [];
			fkey = [];
			if (log === true) {
				sql = this.sql.table.replace("%name", "log_"+t);
				cols.push(this.getColumn(t, "_id"));
				cols.push(this.getColumn(t, "_action"));
				cols.push(this.getColumn(t, "_log"));
				cols.push(this.getColumn(t, "id", true));
			}
			else {
				sql = this.sql.table.replace("%name", t);
				cols.push(this.getColumn(t, "id"));
			}
			for (var c in this.json[t]) {
				value = this.getColumn(t, c, log);
				if ((/ FOREIGN KEY/).test(value)) {
					fkey.push(value.replace(/^.+\ FOREIGN/, "FOREIGN"));
					cols.push(value.replace(/ FOREIGN.+$/, ""));
				} else {
					cols.push(value);
				}
			}
			if (log !== true) {
				fkey = fkey.join(",\n\t");
				cols.push(fkey);
			}
			cols = cols.join(",\n\t");
			sql  = sql.replace("%columns", cols);
			return sql;
		}
	},
	createView: {
		value: function(t) {
			var sql;
			sql = this.sql.view.replace(/\%name/g, t);
			return sql;
		}
	},
	createInsert: {
		value: function(t) {
			var sql, cols, values, type;
			cols   = [];
			values = [];
			for (var c in this.json[t]) {
				type = this.getValue(t, c, "type");
				if (this.types[type].view !== null) {
					cols.push(c);
					values.push(this.types[type].type.view.replace(/\%col/g, c));
				}
			}
			sql = this.sql.insert;
			sql = sql.replace("%columns", cols.join(",\n\t\t"));
			sql = sql.replace("%values", values.join(",\n\t\t"));
			sql = sql.replace("%table", t);
			return sql;
		}
	},
	createUpdate: {
		value: function(t) {
			var sql, values, type;
			values = [];
			for (var c in this.json[t]) {
				type = this.getValue(t, c, "type");
				if (this.types[type].view !== null) {
					values.push(c+" = "+this.types[type].type.view.replace(/\%col/g, c));
				}
			}
			sql = this.sql.update;
			sql = sql.replace("%values", values.join(",\n\t\t"));
			sql = sql.replace("%table", t);	
			return sql;
		}
	},
	createDelete: {
		value: function(t) {
			var sql;
			sql = this.sql.delete.replace("%table", t);
			return sql;
		}
	},
	createTriggerView: {
		value: function(t, act) {
			var sql, table, name, selects, type, action;
			selects = "";
			table   = "vw_"+t;
			if (act.toUpperCase() === "INSERT") {
				name    = "vw_i_"+t;
				type    = "INSTEAD OF INSERT";
				action = this.createInsert(t);
			} else if (act.toUpperCase() === "UPDATE") {
				name    = "vw_u_"+t;
				type    = "INSTEAD OF UPDATE";
				action = this.createUpdate(t);
			} else if (act.toUpperCase() === "DELETE") {
				name    = "vw_d_"+t;
				type    = "INSTEAD OF DELETE";
				action = this.createDelete(t);
			}
			sql = this.sql.trigger;
			sql = sql.replace("%table", table);
			sql = sql.replace("%name", name);
			sql = sql.replace("%type", type);
			sql = sql.replace("%selects\n\n", selects);
			sql = sql.replace("%action", action);
			return sql;
		}
	},
	createAll: {
		value: function() {
			var sql;
			sql = [];
			for (var t in this.json) {
				sql.push(this.createTable(t));
				sql.push(this.createView(t));
				sql.push(this.createTable(t, true));
				sql.push(this.createTriggerView(t, "INSERT"));
				sql.push(this.createTriggerView(t, "UPDATE"));
				sql.push(this.createTriggerView(t, "DELETE"));
			}
			sql = sql.join("\n\n------------------------------------------------------\n\n")
			return sql;
		}
	},
	
	//{col1: {type: "", constraint: "", primary: true, foreign: "table"}}
	createTable2: {
		value: function(name, columns) {
			var sql, cols, key1, key2, value;
			sql  = "CREATE TABLE IF NOT EXISTS %name (\n\t%columns\n);";
			cols = [];
			key1 = [];
			key2 = [];
			for (var c in columns) {
				value = [c, columns[c].type, columns[c].constraint];
				cols.push(value.join(" "));
				if (columns[c].primary === true) {
					key1.push(c);
				}
				if (columns[c].foreign === true) {
					key1.push(c);
				}
			}
				
				
			
			
			
			
		}
	}

});











function p10(value) {
	var val, num, int, flt, pow, dot;
	val = value.toString().toLowerCase().split("e");
	num = val[0].split(".");
	pow = val[1] === undefined ? 0 : Number(val[1]);
	int = num[0].replace(/[^0-9]/g, "").replace(/^0+/, "");
	flt = num[1] === undefined ? "" : num[1].replace(/0+$/, "");
	dot = flt.length;
	num = pow < 0 ? -pow : pow;
	for (var i = 0; i < num; i++) {
		if (pow < 0) {
			int = "0"+int;
		} else {
			flt = flt+"0";
		}
	}

	console.log(int+flt);

	
	
	
	
	
}

