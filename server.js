/** Server startup for Message.ly. */


const app = require("./routes/app");


app.listen(3000, function () {
  console.log("Listening on 3000");
});