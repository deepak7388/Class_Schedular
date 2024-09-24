const express = require("express");
const mysql = require("mysql");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const cors = require("cors");
const multer = require("multer");
const app = express();
const cheerio = require("cheerio");
const { createObjectCsvWriter } = require("csv-writer");

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5174",
      "http://localhost:5173",
      "http://localhost:3000",
    ],
  })
);

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Sql123",
  database: "time_table",
});

db.connect((err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log("Connected to MySQL database!");
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "form.html"));
});

app.post("/insertHtmlToDb", (req, res) => {
  const { html, year, semester } = req.body;
  const $ = cheerio.load(html);
  let prevDay = "";
  let prevClass = "";
  let prevSection = "";
  let period_no = 0;
  let nextPeriod = 0;
  let periodArray = [];

  const deleteSql = "DELETE FROM table_data";
  db.query(deleteSql, (deleteError, deleteResults, deleteFields) => {
    if (deleteError) {
      console.error("Error deleting existing data:", deleteError);
      res
        .status(500)
        .send({ success: false, error: "Error deleting existing data" });
      return;
    }

    // Insert new data into the database
    const $rows = $("tbody tr");

    for (let i = 0; i < $rows.length; i++) {
      const trow = $rows[i];
      const $firstTd = $(trow).find("td").eq(0);

      // Check the colspan of the first td tag
      if ($firstTd.attr("colspan") >= 10) {
        prevDay = $firstTd.text().trim();
        console.log(prevDay);
        continue;
      }

      // Skip rows where the first cell contains "SECTION"
      if ($firstTd.text().trim() === "SECTION") {
        continue;
      }

      const $cells = $(trow).find("td");

      for (let j = 0; j < $cells.length; j++) {
        const element = $cells[j];

        // If the cell is empty, skip it
        if ($(element).find("p").length == 0) {
          period_no++;
          nextPeriod++;
          continue;
        }

        // If the cell has only one p tag and rowspan is 4, it is a class
        if (
          $(element).attr("rowspan") == 4 &&
          $(element).find("p").length == 1
        ) {
          prevClass = $(element).find("p").eq(0).text().trim();
          console.log(prevClass);
          continue;
        }

        // If the cell has only one p tag, it is a section
        if ($(element).find("p").length == 1) {
          prevSection = $(element).find("p").eq(0).text().trim();
          period_no = 0;
          nextPeriod = 0;
          continue;
        }

        const currentPeriodNo = period_no;
        nextPeriod += parseInt($(element).attr("colspan")) || 1;
        if (parseInt($(element).attr("colspan")) || 1 == 2) {
          period_no = nextPeriod - 1;
        } else if (parseInt($(element).attr("colspan")) || 1 == 3) {
          period_no = nextPeriod - 2;
        } else {
          period_no = nextPeriod;
        }

        if (
          $(element).attr("rowspan") == 4 &&
          $(element).find("p").length == 4
        ) {
          periodArray.push(period_no);
        }

        const day = prevDay;
        const classValue = prevClass;
        const section = prevSection;
        const room = $(element).find("p").eq(0).text().trim();
        console.log(room);
        const subName = $(element)
          .find("p")
          .eq(1)
          .text()
          .trim()
          .split("(")[0]
          .trim();
        const subCode = $(element).find("p").eq(2).text().trim();
        const teacher = $(element).find("p").eq(3).text().trim();
        const duration = ($(element).attr("colspan") || 1) * 55;
        const lectureType =
          $(element)
            .find("p")
            .eq(1)
            .text()
            .trim()
            .split("(")[1]
            ?.split(")")[0] || "L";

        const building_name = room.replace(/\d+/g, "").trim();
        const room_number = room.replace(/\D+/g, "").trim();

        let floor = "";
        if (room_number) {
          if (room_number >= 100) {
            floor = Math.floor(room_number / 100) - 1;
            if (floor == 0) {
              floor = "Ground";
            } else if (floor == 1) {
              floor = "First";
            } else {
              floor = "Second";
            }
          } else {
            if (building_name === "L L") {
              if (room_number >= 1 && room_number <= 3) {
                floor = "Ground";
              } else if (room_number >= 4 && room_number <= 6) {
                floor = "First";
              } else {
                floor = "";
              }
            } else if (building_name === "LAB" || building_name === "LAB-") {
              if (room_number >= 1 && room_number <= 5) {
                floor = "Ground";
              } else if (room_number >= 6 && room_number <= 10) {
                floor = "First";
              } else {
                floor = "";
              }
            }
          }
        } else {
          floor = "";
        }

        let problematic = "";
        if (floor === "Ground") {
          problematic = "No";
        } else {
          problematic = "Yes";
        }

        console.log([
          year,
          classValue,
          day,
          section,
          semester,
          lectureType,
          subCode,
          subName,
          teacher,
          room,
          duration,
          building_name,
          room_number,
          floor,
          period_no,
          problematic,
        ]);
        // Insert data into the database
        const sql =
          "INSERT INTO table_data (year, class, day, section, semester, lecture_type, sub_code, sub_name, teacher, room,duration,building_name,room_number,floor,period_no,problematic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?)";
        db.query(
          sql,
          [
            year,
            classValue,
            day,
            section,
            semester,
            lectureType,
            subCode,
            subName,
            teacher,
            room,
            duration,
            building_name,
            room_number,
            floor,
            period_no,
            problematic,
          ],
          (error, results, fields) => {
            if (error) {
              console.error("Error inserting data:", error);
            }
          }
        );
      }
    }

    res.send({ success: true });
  });
});

app.listen(8000, () => {
  console.log("working");
});

app.get("/tableData", (req, res) => {
  const section = req.query;

  const data = section["section"];

  console.log(section["section"]);

  const sql = `
  SELECT * FROM table_data 
  WHERE class = '${data}' AND day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
  ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
`;
  console.log("SQL query:", sql);
  db.query(sql, (error, results) => {
    if (error) {
      console.error("Error fetching data from MySQL:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});
app.get("/generateReport", (req, res) => {
  const { section } = req.query;

  if (!section) {
    return res
      .status(400)
      .json({ success: false, message: "Section is required" });
  }

  const sql = `SELECT * FROM table_data WHERE class = ? AND day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')
  ORDER BY FIELD(day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')`;
  db.query(sql, [section], (err, results) => {
    if (err) {
      console.error("Error fetching data:", err);
      return res
        .status(500)
        .send({ success: false, error: "Error fetching data" });
    }
    if (results.length === 0) {
      console.error("No data found for section:", section);
      return res
        .status(404)
        .json({ success: false, message: "No data found for the section" });
    }

    const csvWriter = createObjectCsvWriter({
      path: `./reports/report_${section}.csv`,
      header: [
        { id: "year", title: "Year" },
        { id: "class", title: "Class" },
        { id: "day", title: "Day" },
        { id: "section", title: "Section" },
        { id: "semester", title: "Semester" },
        { id: "lecture_type", title: "Lecture Type" },
        { id: "sub_code", title: "Subject Code" },
        { id: "sub_name", title: "Subject Name" },
        { id: "teacher", title: "Teacher" },
        { id: "room", title: "Room" },
        { id: "duration", title: "Duration" },
        { id: "building_name", title: "Building Name" },
        { id: "room_number", title: "Room Number" },
        { id: "floor", title: "Floor" },
        { id: "period_no", title: "Period Number" },
        { id: "problematic", title: "Problematic" },
      ],
    });

    csvWriter
      .writeRecords(results)
      .then(() => {
        res.download(`./reports/report_${section}.csv`);
      })
      .catch((error) => {
        console.error("Error writing CSV file:", error);
        res
          .status(500)
          .json({ success: false, error: "Error writing CSV file" });
      });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
