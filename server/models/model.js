var Sequelize = require('sequelize');

//the database "reporting" should already have been created in postgres
var sequelize = new Sequelize('postgres://localhost:5432/reporting');

//test connection
sequelize
  .authenticate()
  .then(function(err) {
    console.log('Database connection has been established successfully.');
  })
  .catch(function (err) {
    console.log('Unable to connect to the database:', err);
  });

var Incident = sequelize.define('incident', {
  category: Sequelize.STRING,
  datetime: Sequelize.DATE,
  latitude: Sequelize.DECIMAL,
  longitude: Sequelize.DECIMAL
});

//create 'incident' table in the 'reporting' database, if it's missing
Incident.sync();

module.exports = Incident;