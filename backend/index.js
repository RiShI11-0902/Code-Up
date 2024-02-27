// Always required
const express = require("express")
const app = express()
const passport = require("passport")
const cors = require("cors")
const parser = require("body-parser")
//for connection to db
const connection = require("./databsaseConfig")
const { initializePaasport } = require("./passportConfig")
const session = require("express-session")

//calling passport and db
initializePaasport(passport)
connection()

//middleware
app.use(cors())
app.use(express.json())



//sesssion creation
app.use(session({
    secret:"mkldfj",
    saveUninitialized: false,
    resave: false,
}))
app.use(passport.initialize())
app.use(passport.session())

//individual routes
const userRoutes = require("./routes/users")
app.use("/user", userRoutes.route)

const help = require("./routes/helper")
app.use("/", help.route)

const questions = require("./routes/questions") 
app.use("/", questions.route)






app.get("/" , function(req,res){
    res.send("Hello")
})

app.listen(8000);
