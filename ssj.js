function SQLite(json) {
	if (!(this instanceof SQLite)) {
		return new SQLite(json);
	}
	Object.defineProperties(this, {
		json: {
			writable: true,
			value:    JSON.parse(json)
		},
		error: {
			value: []
		}
	});
	this.checkJSON();
	this.setJSON();
	return
};

Object.defineProperties(SQLite.prototype, {
	constructor: {
		value: SQLite
	},
	/*Name of columns and types not allowed to the user*/
	reservedColumns: {
		value: {
			id:  {type: {value: "id"}, primary: {value: true}},
			log: {type: {value: "log"}, default: {value: "DATETIME('now', 'localtime')"}}
		}
	},
	/*Column types*/
	types: {
		value: {
			text: {
				insert:  "UPPER(TRIM(new.%col))"
			},
			number: {
				insert:  "CAST(new.%col AS REAL)"
			},
			bool: {
				insert:  "CASE WHEN UPPER(new.%col) IN ('TRUE', '1') THEN 1 WHEN UPPER(new.%col) IN ('FALSE', '0') THEN 0 ELSE NULL"
			},
			date: {
				insert:  "new.%col"
			},
			time: {
				insert:  "new.%col"
			},
			free: {
				insert:  "TRIM(%col)"
			},
			id: {
				insert:  null

			},
			log: {
				insert:  null
			}
		}
	},
	/*Data Restrictions and Settings*/
	constraint: {
		value: {
			notNull: {
				types: ["text", "number", "bool", "date", "time", "free"],
				typeOf: {
					value: "boolean"
				},
				format: {
					value: null
				},
				table: {
					value: "NOT NULL"
				},
				trigger: {
					value: "new.%col IS NULL OR LENGTH(TRIM(new.%col)) = 0"
				},
				msg: {
					value: "%col: Required value."
				},
				setting: {
					value: function(x) {
						return x;
					}
				}
			},
			unique: {
				types: ["text", "number", "date", "time", "free"],
				typeOf: {
					value: "boolean"
				},
				format: {
					value: null
				},
				table: {
					value: "UNIQUE"
				},
				trigger: {
					value: "(SELECT COUNT(*) FROM %table WHERE UPPER(TRIM(%col)) LIKE UPPER(TRIM(new.%col))) > 0"
				},
				msg: {
					value: "%col: Amount already registered."
				},
				setting: {
					value: function(x) {
						return x;
					}
				}
			},
			default: {
				types: ["text", "number", "bool", "date", "time", "free"],
				typeOf: {
					value:  "string",
					number: "number",
					bool:   "boolean"
				},
				format: {
					value: null,
					text:   /^[A-Z]+((\ [A-Z]+)+)?$/,
					number: /^[\+\-]?([0-9]+)?(\.[0-9]+)?(e[\+\-]?[0-9]+)?$/i,
					date:   /^([0-9]{4}\-[0-9]{2}\-[0-9]{2}|DATE\(.*\))$/,
					time:   /^(([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]|TIME\(.*\))$/,
				},
				table: {
					value: "DEFAULT(%default)",
					text:  "DEFAULT('%default')",
					free:  "DEFAULT('%default')",
				},
				trigger: {
					value: null
				},
				msg: {
					value: null
				},
				setting: {
					value: function(x) {
						return x;
					},
					bool: function(x) {
						return x === true ? '1' : '0';
					},
					date: function(x) {
						if (/[0-9]{4}\-[0-9]{2}\-[0-9]{2}/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					},
					time: function(x) {
						if (/([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					}
				}
			},
			min: {
				types: ["text", "number", "date", "time"],
				typeOf: {
					value:  "string",
					text:   "number",
					number: "number"
				},
				format: {
					value: null,
					text:   /^[1-9]([0-9]+)?$/i,
					number: /^[\+\-]?([0-9]+)?(\.[0-9]+)?(e[\+\-]?[0-9]+)?$/i,
					date:   /^([0-9]{4}\-[0-9]{2}\-[0-9]{2}|DATE\(.*\))$/,
					time:   /^(([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]|TIME\(.*\))$/,
				},
				table: {
					value: "CHECK(%col >= %min)",
					text:  "CHECK(LENGTH(%col) >= %min)"
				},
				trigger: {
					value: null,
					text: "LENGTH(new.%col) < %min"
				},
				msg: {
					value: null,
					text: "%col: Amount of characters less than allowed."
				},
				setting: {
					value: function(x) {
						return x;
					},
					date: function(x) {
						if (/[0-9]{4}\-[0-9]{2}\-[0-9]{2}/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					},
					time: function(x) {
						if (/([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					}
				}
			},
			max: {
				types: ["text", "number", "date", "time"],
				typeOf: {
					value:  "string",
					text:   "number",
					number: "number"
				},
				format: {
					value: null,
					text:   /^[1-9]([0-9]+)?$/i,
					number: /^[\+\-]?([0-9]+)?(\.[0-9]+)?(e[\+\-]?[0-9]+)?$/i,
					date:   /^([0-9]{4}\-[0-9]{2}\-[0-9]{2}|DATE\(.*\))$/,
					time:   /^(([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]|TIME\(.*\))$/,
				},
				table: {
					value: "CHECK(%col <= %max)",
					text:  "CHECK(LENGTH(%col) <= %max)"
				},
				trigger: {
					value: null,
					text: "LENGTH(new.%col) > %max"
				},
				msg: {
					value: null,
					text: "%col: Amount of characters greater than allowed."
				},
				setting: {
					value: function(x) {
						return x;
					},
					date: function(x) {
						if (/[0-9]{4}\-[0-9]{2}\-[0-9]{2}/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					},
					time: function(x) {
						if (/([01][0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]/.test(x)) {
							x = "'"+x+"'";
						}
						return x;
					}
				}
			},
			primary: {
				types: ["text", "number", "date", "time", "free"],
				typeOf: {
					value: "boolean"
				},
				format: {
					value: null
				},
				table: {
					value: null
				},
				trigger: {
					value: "(SELECT COUNT(*) FROM %table WHERE UPPER(TRIM(%col)) LIKE UPPER(TRIM(new.%col))) > 0"
				},
				msg: {
					value: "%col: Amount already registered."
				},
				setting: {
					value: function(x) {
						return x;
					}
				}
			},
			foreign: {
				types: ["text", "number", "date", "time", "free"],
				typeOf: {
					value:  "string"
				},
				format: {
					value: /^[A-Z]([A-Z0-9\_]+)?\.[A-Z]([A-Z0-9\_]+)?$/i
				},
				table: {
					value: "FOREIGN KEY(%col) REFERENCES %foreign:0(%foreign:1) ON UPDATE CASCADE"
				},
				trigger: {
					value: "(SELECT COUNT(*) FROM %foreign:0 WHERE UPPER(TRIM(%foreign:1)) LIKE UPPER(TRIM(new.%col))) = 0"
				},
				msg: {
					value: "%col: Unknown record."
				},
				setting: {
					value: function(x) {
						return x.split(".");
					}
				}
			},
			type: {
				types: ["text", "number", "bool", "date", "time", "free", "id", "log"],
				typeOf: {
					value: "string"
				},
				format: {
					value: /[a-z]/
				},
				table: {
					value:  "%col",
					text:   "%col TEXT",
					number: "%col REAL",
					bool:   "%col INTEGER CHECK(%col = 0 OR %col = 1)",
					date:   "%col TEXT",
					time:   "%col TEXT",
					free:   "%col TEXT",
					id:     "%col INTEGER",
					log:    "%col TEXT"
				},
				trigger: {
					value:  null,
					text:   "TRIM(new.%col) GLOB '*[^a-zA-Z ]*' OR INSTR(TRIM(new.%col), '  ') > 0",
					number: "new.%col GLOB '*[^0-9.]*' OR INSTR(new.%col, '.') > 1",
					bool:   "UPPER(new.%col) NOT IN ('1', '2', 'TRUE', 'FALSE')",
					date:   "DATE(new.%col, '+1 day', '-1 day') != new.data",
					time:   "TIME(new.%col) != new.%col"
				},
				msg: {
					value: null,
					text:   "%col: Enter only letters and simple spaces.",
					number: "%col: The value must be numeric.",
					bool:   "%col: The value must be true or false.",
					date:   "%col: Please enter a valid date.",
					time:   "%col: Please enter a valid time."
				},
				setting: {
					value: function(x) {
						return x;
					}
				}
			},
		}
	},
	checkName: {
		value: function(name) {
			return 	(/^[A-Z]([A-Z0-9\_]+)?$/i).test(name);
		}
	},
	checkTable: {
		value: function(t) {
			var json = this.json[t];
			if (!(t in this.json)) {
				this.error.push("Non-existent table: "+t);
				return;
			}
			if (Object.keys(json).length === 0) {
				this.error.push("No columns found in the table: "+t);
			}
			if (!this.checkName(t)) {
				this.error.push("Table name in incorrect format: "+t);
			}

			return;
		}
	},
	checkColumn: {
		value: function(t, c) {
			var json = this.json[t][c];
			if (!(c in this.json[t])) {
				this.error.push("Non-existent column: "+t+"."+c);
				return;
			}
			if (!("type" in this.json[t][c])) {
				this.error.push("\"type\" attribute not defined: "+t+"."+c);
			}

			if (Object.keys(json).length === 0) {
				this.error.push("No attributes found in the column: "+t+"."+c);
			}
			if (!this.checkName(c)) {
				this.error.push("Column name in incorrect format: "+t+"."+c);
			}
			if (c in this.reservedColumns) {
				this.error.push("The column name is reserved, can not be used: "+t+"."+c);
			}
			if (json.type.value in this.reservedColumns) {
				this.error.push("The column type is reserved, can not be used: "+t+"."+c+".type = "+json.type.value);
			}
			if (this.constraint.type.types.indexOf(json.type.value) < 0) {
				this.error.push("Attribute type nonexistent: "+t+"."+c+".type = "+json.type.value);
			}
			if (json.notNull.value === true && "default" in json) {
				this.error.push("The \"default\" constraint has no effect with \"notNull\" being true: "+t+"."+c);
			}
			if ("default" in json && json.unique.value === true) {
				this.error.push("Using the \"default\" and \"unique\" constraints will cause data incompatibility quickly: "+t+"."+c);
			}
			return;
		}
	},
	checkAttribute: {
		value: function(t, c, a) {
			var json, constr, type, value;

			if (!(a in this.json[t][c])) {
				this.error.push("Non-existent attribute: "+t+"."+c+"."+a);
				return;
			}
			if (!("type" in this.json[t][c])) {
				return;
			}

			json   = this.json[t][c][a].value;
			type   = this.json[t][c].type.value;
			constr = this.constraint[a];

			if (type in this.reservedColumns || this.constraint.type.types.indexOf(type) < 0) {
				return;
			}
			if (!(a in this.constraint)) {
				this.error.push("Undefined attribute was reported: "+t+"."+c+"."+a);
				return;
			}
			if (typeof this.json[t][c][a] !== "object") {
				this.error.push("The value of the attribute must be an object: "+t+"."+c+"."+a);
				return;
			}
			if (!("value" in this.json[t][c][a])) {
				this.error.push("The \"value\" attribute was not defined in the column attribute: "+t+"."+c+"."+a);
				return;
			}
			if (Object.keys(this.json[t][c][a]).length > 1 && !("msg" in this.json[t][c][a]) || Object.keys(this.json[t][c][a]).length > 2) {
				this.error.push("Only the \"value\" and \"msg\" attributes are allowed in the column attribute: "+t+"."+c+"."+a);
			}
			if ("msg" in this.json[t][c][a] && typeof this.json[t][c][a].msg !== "string") {
				this.error.push("The \"mgs\" attribute must be a string: "+t+"."+c+"."+a+".msg");
			}
			if (constr.types.indexOf(type) < 0) {
				this.error.push("Attribute not allowed for type reported: "+t+"."+c+"."+a);
			}
			value = type in constr.typeOf ? constr.typeOf[type] : constr.typeOf.value;
			if (value !== null && typeof json !== value && constr.types.indexOf(type) >= 0) {
				this.error.push("The attribute \"typeof\" is incorrect: "+t+"."+c+"."+a);
			}
			value = type in constr.format ? constr.format[type] : constr.format.value;
			if (value !== null && !value.test(json) && constr.types.indexOf(type) >= 0) {
				this.error.push("Attribute format incorrect: "+t+"."+c+"."+a);
			}
			return;
		}
	},
	checkJSON: {
		value: function() {

			if (Object.keys(this.json).length === 0) {this.error.push("No table found.");}

			for (var t in this.json) {
				this.checkTable(t)

				for (var c in this.json[t]) {
					this.checkColumn(t, c);

					for (var a in this.json[t][c]) {
						this.checkAttribute(t, c, a);
					}
				}
			}
			if (this.error.length > 0) throw Error("\n- "+this.error.join(";\n- "));
			return;
		}
	},
	setJSON: {
		value: function() {
			var setting, msg, type;

			for (var t in this.json) {
				
				this.json[t].id  = this.reservedColumns.id;
				this.json[t].log = this.reservedColumns.log;
				
				for (var c in this.json[t]) {
					for (var a in this.json[t][c]) {
						type = this.json[t][c].type.value;

						if ("msg" in this.json[t][c][a]) {
							msg = this.json[t][c][a].msg;
						} else {
							msg = type in this.constraint[a].msg ? this.constraint[a].msg[type] : this.constraint[a].msg.value;
						}

						setting = type in this.constraint[a].setting ? this.constraint[a].setting[type] : this.constraint[a].setting.value;
						
						this.json[t][c][a].msg = msg === null ? "" : msg.replace(/\%col/g, c);
						this.json[t][c][a].value = setting(this.json[t][c][a].value);

					}
				}
			}
			return;
		}
	},
	createCol: {
		value: function(t,c) {
			if (!(c in this.json[t]) && this.reserved.indexOf(c) < 0) throw Error("Non-existent column: "+t+"."+c);

			var col, json, keys, re, type, constr;

			col  = [];
			keys = ["type", "notNull", "unique", "default", "min", "max"];
			json = this.json[t][c];
			type = json.type.value;

			for (var k = 0; k < keys.length; k++) {
				if (!(keys[k] in json) || json[keys[k]] === false) {continue;}
				constr = this.constraint[keys[k]].table;
				value = type in constr ? constr[type] : constr.value;
				col.push(value);
			}

			col = col.join(" ");

			for (var i in json) {
				re = new RegExp("%"+i, "g");
				col = col.replace(re, json[i].value);
			}

			col = col.replace(/%col/g, c);
			console.log(col);

			return col;
		}
	},
	createTable: {
		enumerable: true,
		value: function(t) {
			if (!(t in this.json)) throw Error("Non-existent table: "+t);
			var tab, col, key1, key2, json;
			tab  = [];
			col  = [];
			key1 = [];
			key2 = [];

			tab.push("--TABLE------------------------------------------------------------------------");
			tab.push("CREATE TABLE IF NOT EXISTS "+t+" (");

			for (var c in this.json[t]) {
				/*create column*/
				col.push("\t"+this.createCol(t,c));

				/*create primary key*/
				if ("primary" in this.json[t][c] && this.json[t][c].primary.value === true) {
					key1.push(c);
				}

				/*create foreign key*/
				if ("foreign" in this.json[t][c]) {
					json = this.json[t][c].foreign.value;
					key2.push(this.constraint.foreign.table.value.replace("%col", c).replace("%foreign:0", json[0]).replace("%foreign:1", json[1]));
				}
			}

			col.push("\tPRIMARY KEY("+key1.join(", ")+")");
			col.push("\t"+key2.join(",\n\t"));
			tab.push(col.join(",\n"));
			tab.push(");")

			return tab.join("\n");
		}
		
	},
	createView: {
		enumerable: true,
		value: function(t) {
			if (!(t in this.json)) throw Error("Non-existent table: "+t);
			var view, cols;
			cols = [];
			view = [];

			view.push("--VIEW-------------------------------------------------------------------------");
			view.push("CREATE VIEW IF NOT EXISTS vw_"+t+" AS");
			view.push("\tSELECT");

			for (var c in this.json[t]) {
				if (!(c in this.reservedColumns)) {
					cols.push("\t\t"+c);
				}
			}
			
			view.push(cols.join(",\n"));
			view.push("\tFROM "+t);
			view.push(";");

			return view.join("\n");
		}
		
	},
	
	
	
	
	
	
	
	
	
	
	
	
	createSQL: {
		enumerate: true,
		value: function() {
			var sql = []
			for (var t in this.json) {
				sql.push(this.createTable(t));
				sql.push(this.createView(t));
			}
			return sql.join("\n\n")
			
			
			
			
			
			
		}
	}
	
	
});	
