# SQLite Structure Builder in XML Notation

The SQLite Structure Builder in XML Notation - XSQLite is a JavaScript object intended to create a [SQLite](https://www.sqlite.org/index.html) language database pre-structure using XML notation.

The structure is formulated in SQL language (textual content), with commands based on the SQLite library, and includes the construction of tables and triggers that control the entry of information in the database and control the registration of updates.

The database is not created automatically and the product must be compiled using an appropriate tool.

The structure created by the application is not fixed. This way, it is possible to add complementary commands before compilation, because the purpose is to create a pre-structure in order to spare the initial construction efforts and focus attention on the specificity of the application.

_Of course, if you need to change the structure of the generated product, you will need to understand the SQLite language._

The JavaScript language was chosen with a view to its use in the web environment. The compatibility of the object with all browsers available on the market has not been tested. It is recommended to use more modern browsers.

---

## The XML Structure

The XML structure has the following tags:

### sql

It is the root tag of the XML structure. It is required, must contain opening and closing tags (`<sql></sql>`), has no attributes and must be unique.

### table

Child of the root tag, this element defines the creation of a table. At least one table must be entered in the structure. It should contain opening and closing tags (`<table></table>`). The element has the required attribute "name" that defines the table name. There can be no more than one table with the same name.

### column

Child of the table tag, this element defines the creation of a column. At least one column must be entered for each table. If it has children, the element must contain opening and closing tags (`<column></column>` (with childs) or `<column/>`). The element has the required attribute "name" that defines the name of the column. Column names must be unique for the same table, repeated names are not allowed. Can contain the following attributes:

- type
- unique
- notnull
- default
- min
- max
- glob
- like
- table

Depending on the type of column you choose, some attributes may have no effect on the element.

### message

Child of the column tag, is an optional element that defines the error message when verification fails. Must contain opening and closing tags (`<message></message>`). Can contain the following attributes:

- onerror

If error messages are not created, a default message is assigned to return upon failure.

## Attributes

### name

The `name` attribute defines the name of the column or table and can contain letters (basic Latin alphabet), numbers, and underscores, but must start with an alphabetic character (`/^[A-Z]([A-Z0-9\_]+)?$/i`).

It is a required attribute to define tables and columns.

### type

The `type` attribute defines the type of data that the column will receive. The following options are possible:

- free (default)
- text
- number
- boolean
- date
- time
- key

If not entered, the "free" type will be set. The attribute is not case sensitive.

### unique

The `unique` attribute defines whether the column value should be unique in the table. The attribute has no specific value, its existence already characterizes the constraint.

### notnull

The `notnull` attribute defines that the column value cannot be null. The attribute has no specific value, its existence already characterizes the constraint.

### default

The `default` attribute sets the default value of the column when it receives the value `NULL`. The value of the attribute depends on the column type (`type` attribute) and must have the same format accepted by the column type.

### min

The `min` attribute defines the minimum value of the column. The value of the attribute depends on the column type (`type` attribute) and __generally__ must have the same format as the column type.

### max

The `max` attribute defines the maximum value of the column. The value of the attribute depends on the type of the column (`type` attribute) and __generally__ must have the same format as the column type.

### glob

The `glob` attribute defines an arrival rule for the column value (_SQLite GLOB function_).

### like

The `like` attribute defines an arrival rule for the column value (_SQLite LIKE function_).

### table

The `table` attribute defines the name of the reference table for the column values. Applies only to column of type "key".

### onerror

The `onerror` attribute, required to make the element active, defines the object of the error message.

The attributes must be unique. If there is more than one element with the same attribute value, only the first one is considered.

Accepts the following case-insensitive values:

- type
- notnull
- unique
- min
- max
- like
- glob
- table

The message will refer to the failure occurred in the eponymous attribute of its column.

## Column types

### text

Column defined with type equal to "text" only accepts alphabetic characters. Special characters (ç, à, É), punctuation, empty string, double spaces and spaces at the beginning or end will not be allowed (`/^[A-Z]+((\ [A-Z]+)+)?$/i`). It is case insensitive in checking repeated values.

The following attributes are accepted:

- unique
- notnull
- default
- min
- max

The `min` and` max` attributes indicate the minimum and maximum number of characters, respectively, therefore the value must be numeric greater than zero.

The SQLite column type constraint is "TEXT".

### number

The column defined with type equal to "number" accepts only values ​​whose type are numbers (integer or real).

The following attributes are accepted:

- unique
- notnull
- default
- min
- max

The SQLite column type constraint is "NUMBER".

### boolean

The column defined with type equal to "boolean" only accepts integer values: 1 for true and 0 for false.

The following attributes are accepted:

- notnull
- default

The value of the `default` attribute can also be "true" or "false" without case sensitivity (`/^(1|TRUE|0|FALSE)$/i`).

The SQLite column type constraint is "INTEGER".

### date

The column defined with type equal to "date" accepts only values ​​corresponding to valid dates ("YYYY-MM-DD").

The following attributes are accepted:

- unique
- notnull
- default
- min
- max

The `default`,` min` and `max` attributes accept valid ISO 8601 date formats (`/^[0-9]{4}(\-[0-9]{2}){2}$/`) and the SQLite DATE function (`/^DATE\(.*\)$/i`).

The SQLite column type constraint is "TEXT".

### time

The column defined with type equal to "time" accepts only values ​​corresponding to valid times ("HH:MM:SS").

The following attributes are accepted:

- unique
- notnull
- default
- min
- max

The `default`, `min` and `max` attributes accept valid time formats (`/^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/`) and the SQLite TIME function (`/^TIME\(.*\)$/i`).

The SQLite column type constraint is "TEXT".

### free

The column defined with type equal to "free" accepts any value in text format. It is case sensitive when checking repeated values.

The following attributes are accepted:

- unique
- notnull
- default
- min
- max
- like
- glob

The SQLite column type constraint is "TEXT".

### key

The column defined with the type "key" accepts only integers that match the identifiers in another table. Your goal is to define columns with foreign keys.

The following attribute is accepted:

- table

The `table` attribute accepts value in the same format as the name attribute and must match the name of the table where the reference for the foreign key will be created. It is a required attribute.

The SQLite column type constraint is "INTEGER".

## SQLite Products

### Tables

For each column entered in XML two tables will be created, the main one where the data will be logged and the log table where the updates will be logged.

The main table will have all columns defined in XML plus the `_id_` column, automatically created by the application, which will be the primary key of the table.

The log table will have all columns defined in default table plus the automatic columns `_event_`, which will record the type of update performed, and `_log_`, which will record the time of the update.

The log table will record the insertion (0), update (1) and deletion (2) events.

By default, the log table cannot have data changed or deleted.

### Views (new)

For each table built, a view will be created.

The columns referenced in the view will have the format `table.column`.

### Triggers

The following triggers will be created in the main table:

#### BEFORE INSERT and BEFORE UPDATE

These triggers will parse the data entered into the table and return a customizable error message on failure.

#### AFTER INSERT, AFTER UPDATE and AFTER DELETE

These triggers will promote logging of data to the log table.

The following triggers will be created in the log table:

#### BEFORE UPDATE and BEFORE DELETE

These triggers will not allow changing or deleting log table data.

### Products Name

|__Product__                 |__Name__                         |
|:-------------------------- |:--------------------------------|
|Table                       |*tableName*                      |
|Log                         |*_log_tableName*                 |
|View                        |*_vw_tableName*                  |
|Trigger Before Insert       |*_tr_before_insert_tableName*    |
|Trigger Before Update       |*_tr_before_update_tableName*    |
|Trigger After Insert        |*_tr_after_insert_tableName*     |
|Trigger After Update        |*_tr_after_update_tableName*     |
|Trigger After Delete        |*_tr_after_delete_tableName*     |
|Trigger Before Update (log) |*_tr_before_update_log_tableName*|
|Trigger Before Delete (log) |*_tr_before_delete_log_tableName*|

## The code generator

A web code generator was built to transform the project into xml for SQLite language.

[Click here](XSQLite.html) to access the code generator.

## Example

Below is an example of a store design containing the following databases:

### clients

Records customer data:

- **name** - customer name (_"text", required_);
- **birth** - customer's date of birth (_"date", required, 18 years or over_); and
- **doc** - customer document identifier (_"number", required, unique, value 1 to 9999999_).

### products

Records store product data:

- **name** - product name (_"text", required and unique_); and

### sales

Records data of products sold to customers:

- **client_id** - customer identifier (_"id", table "customers" is the reference_); and
- **product_id** - product identifier (_"id", table "products" is the reference_).
- **value** - product value (_"number", required from 0.01_).

### XML

Copy the project below, paste it into the [code generator](XSQLite.html) and check the result in SQLite.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sql>
	<table name="clients">
		<column name="name" type="text" notnull="">
			<message onerror="type">Enter the customer name accordingly.</message>
			<message onerror="notnull">Client name is required.</message>
		</column>
		<column name="birth" type="date" notnull="" max="DATE('now', '-18 years')">
			<message onerror="type">Enter the date of birth accordingly.</message>
			<message onerror="notnull">Date of birth is required.</message>
			<message onerror="max">Customer must be over 18 years old.</message>
		</column>
		<column name="doc" type="number" notnull="" min="1" max="9999999" unique="">
			<message onerror="type">Enter the customer document number.</message>
			<message onerror="notnull">Document number is required.</message>
			<message onerror="min">Document number must be from 1.</message>
			<message onerror="max">Document number must be up to 9999999.</message>
			<message onerror="unique">Document number already used.</message>
		</column>
	</table>
	<table name="products">
		<column name="name" type="text" notnull="" unique="">
			<message onerror="type">Enter the product name accordingly.</message>
			<message onerror="notnull">Product name is required.</message>
			<message onerror="unique">Product already registered.</message>
		</column>
	</table>
	<table name="sales">
		<column name="client_id" type="key" table="clients">
			<message onerror="type">Customer not registered.</message>
		</column>
		<column name="product_id" type="key" table="products">
			<message onerror="type">Product not registered.</message>
		</column>
		<column name="value" type="number" notnull="" min="0.01">
			<message onerror="type">Enter the value of the product.</message>
			<message onerror="notnull">Product value is required.</message>
			<message onerror="min">Minimum product value must be $ 0.01.</message>
		</column>
	</table>
</sql>
```

_The above example is merely illustrative, without concern for reality._

## Compiling

Below are some tools for compiling SQLite code:

- [SQLite Reader](https://addons.mozilla.org/pt-BR/firefox/addon/sql-reader/) (Firefox Add-ons)
- [CLI sqlite3](https://www.sqlite.org/cli.html)

## Release Notes

### v2.0.0

- Published on 2019-12-14
- The column element of type "id" has been deprecated, giving way to element of type "key", keeping the same purpose.
- The "source" attribute has been deprecated, giving way to the "table" attribute, keeping the same purpose.
- The "notNull" attribute has been deprecated, giving way to the "notnull" attribute, keeping the same purpose.
- The elements "type", "unique", "notNull", "min", "max", "glob" and "like", children of the column element and intended to customize failed verification messages, have been deprecated, giving way to the "message" element, maintaining the same purpose.
- The "onerror" attribute was created for the "message" element in order to define the type of failure that the message is attached to.
- Trigger structures have been modified.
- Started to build views.

### v1.0.0

- Published on 2019-10-18

## Author

- Willian Donadelli (<wdonadelli@gmail.com>)
