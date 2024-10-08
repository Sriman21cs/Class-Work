const express = require("express");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = 3000;
let db = null;
let client = null;

// MongoDB Atlas connection string
const uri = "mongodb+srv://Sriman:sriman@cluster0.6n2b38d.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Replace this with your actual connection string

async function connectDB() {
    try {
        client = new MongoClient(uri, { tlsAllowInvalidCertificates: true });
        await client.connect();
        db = client.db("students"); // Replace with your database name
        console.log("Connected to MongoDB Atlas successfully!");
    } catch (err) {
        console.error("Error connecting to MongoDB Atlas:", err);
        process.exit(1);
    }
}

function calculateGrade(avg) {
    if (avg >= 90) return "A+";
    if (avg >= 80) return "A";
    if (avg >= 70) return "B";
    if (avg >= 60) return "C";
    return "D";
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' folder

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "in.html"));
});

app.post("/student", async (req, res) => {
    const { name, mark1, mark2, mark3, mark4, mark5 } = req.body;
    const marksArray = [
        parseFloat(mark1),
        parseFloat(mark2),
        parseFloat(mark3),
        parseFloat(mark4),
        parseFloat(mark5),
    ];

    const totalMarks = marksArray.reduce((a, b) => a + b, 0);
    const avg = totalMarks / marksArray.length;
    const grade = calculateGrade(avg);
    const highest = Math.max(...marksArray);
    const lowest = Math.min(...marksArray);

    // Save results to MongoDB
    try {
        await db.collection("results").insertOne({
            name,
            totalMarks,
            avg,
            grade,
            highest,
            lowest,
            createdAt: new Date()
        });
    } catch (err) {
        console.error("Error saving to MongoDB:", err);
    }

    res.send(`
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f9;
                padding: 20px;
                text-align: center;
            }
            h1 {
                color: #5cb85c;
            }
            p {
                font-size: 1.2em;
            }
            a {
                text-decoration: none;
                color: #5cb85c;
                font-weight: bold;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
        <h1>Results for ${name}</h1>
        <p>Total Marks: ${totalMarks}</p>
        <p>Average: ${avg.toFixed(2)}</p>
        <p>Grade: ${grade}</p>
        <p>Highest Mark: ${highest}</p>
        <p>Lowest Mark: ${lowest}</p>
        <a href="/">Go Back</a>
    `);
});

// Start the server
app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server running at http://localhost:${PORT}`);
});

