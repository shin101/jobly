const {sqlForPartialUpdate} = require("./sql");

describe("update SQL partially", function () {
    test("updating partial sql", function () {
      let res = sqlForPartialUpdate(
        {firstName: 'Mel', age: 5}, 
        {age});

      expect(res).toEqual({ 
        setCols : "\"firstName\"=$1, \"age\"=$2", 
        values: ['Mel',5]
    });
    });
});