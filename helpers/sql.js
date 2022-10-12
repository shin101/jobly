const { BadRequestError } = require("../expressError");

// takes an object as an input for dataToUpdate. From the object, jsToSql will specificy which data within the object to convert to SQL
//  keys will then output the keys from the object
// cols will create an array which outputs "key = value"
// final output returns { setCols : firstname=$1, age=$2, values: ['Aliya', 32]}


function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
