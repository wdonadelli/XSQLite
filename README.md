# SQLite Structure Builder in XML Notation

The SQLite Structure Builder in XML Notation - XSQLite is a JavaScript object intended to create a [SQLite](https://www.sqlite.org/index.html) language database pre-structure using XML notation.

The structure is formulated in SQL language (textual content), with commands based on the SQLite library, and includes the construction of tables and triggers that control the entry of information in the database and control the registration of updates.

The database is not created automatically and the product must be compiled using an appropriate tool.

The structure created by the application is not fixed. This way, it is possible to add complementary commands before compilation, because the purpose is to create a pre-structure in order to spare the initial construction efforts and focus attention on the specificity of the application.

_Of course, if you need to change the structure of the generated product, you will need to understand the SQLite language._

The JavaScript language was chosen with a view to its use in the web environment. The compatibility of the object with all browsers available on the market has not been tested. It is recommended to use more modern browsers.

## Links

- [Click here](https://wdonadelli.github.io/XSQLite/XSQLite.html) to access the code generator.
- [Click here](https://wdonadelli.github.io/XSQLite/) to view the handbook.

## Example

See the running project through the example available at [WebExample1](https://github.com/wdonadelli/WebExample1).

_Willian Donadelli_ (<wdonadelli@gmail.com>)
