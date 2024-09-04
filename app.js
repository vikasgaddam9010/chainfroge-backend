const express = require("express")
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const cors = require("cors")
const bcrypt = require('bcrypt')
const jwttoken = require('jsonwebtoken')

let database = null 

const startDataBase = async () => {
  try{
    database = await open({
      filename: path.join(__dirname, 'users.db'),
      driver: sqlite3.Database,
    })
    console.log("Database Connected...")
  }catch (e){
    process.exit(1)
  }
}

startDataBase()

const app = express()
app.use(express.json())
app.use(cors())

app.post("/register/", async (req, res) => {
  try{
    const {email, password} = req.body
    const userCheckInDatabase = await database.get(`SELECT * FROM users WHERE mail = '${email}';`)
    if(userCheckInDatabase === undefined){
      const hashedPassword = await bcrypt.hash(password, 10)
      await database.run(`INSERT INTO users (mail, hashed_password) VALUES ('${email}','${hashedPassword}');`)      
      res.status(200).send({message: "Successfully Registered"})
    } else{
      res.status(400).send({message: "User Already Registered"})
    }
  }catch(e){
    res.status(400).send({message: e.message})
  }
})

app.post("/log-in/", async(req, res) => {
  const {email, password} = req.body
  try{
    const sqlToCheckUserExistence = await database.get(`SELECT * FROM users WHERE mail = '${email}';`)
    if(sqlToCheckUserExistence === undefined){
      res.status(400).send({message: "Please Check Your Mail ID"})
    }else{
      const passwordCheck = await bcrypt.compare(password, sqlToCheckUserExistence.hashed_password)
      if(passwordCheck){
        const jwtToken = jwttoken.sign({email}, 'encryptedKey')
        res.status(200).send({message: "Login Success", jwtToken})
      }else{
        res.status(400).send({message: "Plaese Cheack Your Password"})
      }
    }
  }catch(e){
    res.status(400).send({message:e.message})
  }
})



app.listen(5000)