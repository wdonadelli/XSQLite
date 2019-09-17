# SQLite Structure Builder in XML Notation

The SQLite Structure Builder in XML Notation - XQLite is a JavaScript object intended to create a SQLite language database pre-structure using XML notation.

The structure is formulated in SQL language (textual content), with commands based on the SQLite library, and includes the construction of tables, views and triggers that control the entry of information in the database and control the registration of updates.

The database is not created automatically and the product must be compiled using an appropriate tool.

The structure created by the application is not fixed. This way, it is possible to add complementary commands before compilation, because the purpose is to create a pre-structure in order to spare the initial construction efforts and focus attention on the specificity of the application.

The JavaScript language was chosen with a view to its use in the web environment. The compatibility of the object with all browsers available on the market has not been tested. It is recommended to use more modern browsers.

---

## The XML Structure

The XML structure has the following tags:

### `<sql>`

It is the root tag of the XML structure. It is required, must contain opening and closing tags (`<sql></sql>`), has no attributes and must be unique.

### `<table>`

Child of the root tag, this element defines the creation of a table. At least one table must be entered in the structure. It should contain opening and closing tags (`<table></table>`). The element has the required attribute "name" that defines the table name. There can be no more than one table with the same name.

### `<column>`

Child of the table tag, this element defines the creation of a column. At least one column must be entered for each table. If it has children, the element must contain opening and closing tags (`<column></column>` (with childs) or `<column />`). The element has the required attribute "name" that defines the name of the column. Column names must be unique for the same table, repeated names are not allowed. Can contain the following attributes:

- type
- unique
- null
- default
- min
- max
- glob
- like
- target

Depending on the type attribute you enter, some attributes may have no effect on the element.

### `<type>`, `<unique>`, `<null>`, `<min>`, `<max>`, `<glob>` and `<like>`

Children of the column tag, is an optional element that defines the error message when the attribute of the same name fails verification. It has no attributes and must contain opening and closing tags.

The element must be unique. If there is more than one, only the first will be considered.

If elements are not created, a default message is assigned to return the error message when the value entered does not meet the criteria.

## Attributes

### name

The `name` attribute defines the name of the column or table and may contain the format given by the following regular expression (JavaScript notation):

```js
/^[A-Z]([A-Z0-9\_]+)?$/i
```

It is a required attribute to define tables and columns.

### type

The `type` attribute defines the type of data that the column will receive. The following options are possible:

* text
* number
* boolean
* date
* time
* free
* id

If not informed, the type "free" will be set.

### unique

The `unique` attribute defines whether the column value should be unique in the table. The following values ​​are possible:

- true
- false (default)

### null

The `null` attribute defines whether the column value can be null. The following values ​​are possible:

- true (default)
- false

### default

The `default` attribute sets the default value of the column when it receives the value `NULL`. The value of the attribute depends on the column type (`type` attribute) and must have the same format accepted by the column type.

### min

The `min` attribute defines the minimum value of the column. The value of the attribute depends on the column type (`type` attribute) and __generally__ must have the same format as the column type.

### max

The `max` attribute defines the maximum value of the column. The value of the attribute depends on the type of the column (`type` attribute) and __generally__ must have the same format as the column type.

### glob

The `glob` attribute defines an arrival rule for the column value (SQLite GLOB function).

### like

The `like` attribute defines an arrival rule for the column value (SQLite LIKE function).

### target

The `target` attribute sets the name of the reference column to the value of the column.

## Column types

### `text`

Column defined with type equal to `text` only accepts alphabetic characters. Special characters (ç, à, É), punctuation, empty string, double spaces and spaces at the beginning or end will not be allowed. It is case insensitive in checking repeated values.

The following attributes are accepted:

- unique
- null
- default
- min
- max

The `min` and` max` attributes indicate the minimum and maximum number of characters, respectively, therefore the value must be numeric greater than zero.

The SQLite column type constraint is `TEXT`.

### `number`

The column defined with type equal to `number` accepts only values ​​whose type are numbers (integer or real).

The following attributes are accepted:

- unique
- null
- default
- min
- max

The SQLite column type constraint is `NUMBER`.

### `boolean`

The column defined with type equal to `boolean` only accepts integer values: 1 for true and 0 for false.

The following attributes are accepted:

- null
- default

The SQLite column type constraint is `INTEGER`.

### `date`

The column defined with type equal to 'date' accepts only values ​​corresponding to valid dates.

The following attributes are accepted:

- unique
- null
- default
- min
- max

The `default`, `min` and` max` attributes accept the following values:

- `/^[0-9]{4}(\-[0-9]{2}){2}$/` (RE JavaScript notation)
- DATE SQLite function

The SQLite column type constraint is `TEXT`.

### `time`

The column defined with type equal to 'time' accepts only values ​​corresponding to valid times.

The following attributes are accepted:

- unique
- null
- default
- min
- max

The `default`, `min` and` max` attributes accept the following values:

- `/^([01][0-9]|2[0-3])(\:[0-5][0-9]){2}$/` (RE JavaScript notation)
- TIME SQLite function

The SQLite column type constraint is `TEXT`.

### `free`

The column defined with type equal to 'free' accepts any value in text format. It is case sensitive when checking repeated values.

The following attributes are accepted:

- unique
- null
- default
- min
- max
- like
- glob

The SQLite column type constraint is `TEXT`.

### `id`

The column defined with the type 'id' accepts only integers that match the identifiers in another table. Your goal is to define columns with foreign keys.

The following attribute is accepted:

- target

The `target` attribute accepts value in the same format as the name attribute and must match the name of the table where the reference for the foreign key will be created.

The SQLite column type constraint is `INTEGER`.

## SQLite Products

### Tables

For each column entered in XML two tables will be created, the main one where the data will be logged and the log table where the updates will be logged.

The main table will have all columns defined in XML plus the `_id_` column, automatically created by the application, which will be the primary key of the table.

The log table will have all columns defined in XML plus the automatic columns `_id_`, primary key of the main table, `_event_`, which will record the type of update performed, and `_log_`, which will record the time of the update.

The log table will record the insertion (1), update (0) and deletion (-1) events.

### Triggers

The following triggers will be created in the main table:

#### BEFORE INSERT and BEFORE UPDATE

These triggers will parse the data entered into the table and return a customizable error message on failure.

#### AFTER INSERT, AFTER UPDATE and AFTER DELETE

These triggers will promote logging of data to the log table.

The following triggers will be created in the log table:

#### BEFORE UPDATE and BEFORE DELETE

These triggers will not allow changing or deleting log table data.
