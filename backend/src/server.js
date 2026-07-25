require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`EduMind Pro AI API listening on port ${PORT} [${process.env.NODE_ENV}]`);
  });
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});
