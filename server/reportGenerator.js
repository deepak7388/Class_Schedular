const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");
const mysql = require("mysql");
const { query } = require("express");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sql@123",
  database: "time_table",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database!");
});

const generateReport = (section, callback) => {
  if (!section) {
    return callback(new Error("Section is required"));
  }
  const sql = `SELECT * FROM table_data WHERE class = ${section}`;
  db.query(sql, [section], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return callback(err);
    }
    console.log("Query Results: ", results);

    if (results.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No data found for the section" });
    }
    const reportData = results.map((row) => ({
      Year: row.year,
      Class: row.class,
      Section: row.section,
      Semester: row.semester,
      LectureType: row.lecture_type,
      SubjectCode: row.sub_code,
      SubjectName: row.sub_name,
      Teacher: row.teacher,
      Room: row.room,
      Duration: row.duration,
      BuildingName: row.building_name,
      RoomNumber: row.room_number,
      Floor: row.floor,
      PeriodNo: row.period_no,
      Problematic: row.problematic,
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(reportData);
    const fileName = `report_${section}.csv`;
    const filePath = path.join(__dirname, fileName);

    fs.writeFile(filePath, csv, (err) => {
      if (err) {
        console.error("Error writing file:", err);
        return callback(err);
      }
      callback(null, fileName);
    });
  });
};

module.exports = generateReport;
