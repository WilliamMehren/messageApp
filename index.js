import express from "express"
import * as mysql from "mysql2"
import * as util from "util"

const app = express()
const port = 5000

function genKey(length){
    let res = "";
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++){
        res += characters.charAt(Math.floor(Math.random()*characters.length))
    }
    return res;
}
async function verify(userid,key){
    let verified = false
    let verifyCheck = await query(`SELECT * from users WHERE key ='${key}'`)
    if (verifyCheck.length > 0){
        verified = verifyCheck[0].userid == userid
    }
    return verified
}

const conn = mysql.createConnection({
    host:"127.0.0.1",
    user:"root",
    password:"Pickle123!",
    database:"msg"
})
conn.connect()
const query = util.promisify(conn.query).bind(conn);
app.get("/",(req,res)=> {
    res.send("welcome")
});
app.get("/signup",async (req,res) => {
    let username = req.query.username
    let pswrd = req.query.password
    let DBres = await query(`INSERT INTO users (userName,pswrd,key) VALUES ('${username}','${pswrd}','${genKey(10)}')`)
    if (DBres.affectedRows < 1){res.send({succesful:false})}
    else {res.send({succesful:true})}
});
app.get("/login",async (req,res) => {
    let username = req.query.username
    let pswrd = req.query.password
    let success = false
    let DBres = await query(`SELECT * FROM users WHERE userName = '${username}' AND pswrd='${pswrd}'`)
    if (DBres.length == 1){success = true}
    res.send({succesful:success,userid:DBres[0].userID})

});
app.get("/send_dm",async (req,res) => {
    let key = req.query.key
    let senderid = req.query.senderid
    let recieverid = req.query.recieverid
    let content = req.query.contnet
    if (await verify(senderid,key)){
        res.send({sender:senderid,reciever:recieverid,content:content})
    } else {
        res.send({})
    }
});
app.get("/get_dm",async (req,res) => {
    let key = req.query.key
    let userid = req.query.userid
    let otherid = req.query.otheruserid
    let msgs
    if (await verify(userid,key)){
        msgs = await query(
            `SELECT * FROM messages_private WHERE senderid = '${userid}' AND 
            recieverid = '${otherid}' OR senderid = '${otherid}' AND recieverid = '${userid}'`);
    }
    res.send({messages:msgs})
});
app.listen(port,() => {
    console.log(`listening at port: ${port}`)
})