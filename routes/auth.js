const { route } = require("./app");
const User = require('../models/user');
const ExpressError = require("../expressError");
const jwt = require("jsonwebtoken");
const { SECRET_KEY, } = require("../config");
/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
route.get('/login',async function(req,res,next){

    try{
        const auth = User.authenticate(req.body.username, req.body.password)
        if (!auth){
            throw new ExpressError("Incorrect username/password")
        }
        User.updateLoginTimestamp(req.body.username)
        const token = jwt.sign({"username": req.body.username, "first_name":req.body.first_name},SECRET_KEY)
        return res.json({token})
    }catch(e){next(e)}
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
route.post('/register', async function(req,res,next){
    try{
        const success = User.register(req.body.username, req.body.password, req.body.first_name, req.body.last_name, req.body.phone)
        if (!success){
            throw new ExpressError("")
        }
        const token = jwt.sign({"username": req.body.username, "first_name":req.body.first_name},SECRET_KEY)
        User.updateLoginTimestamp(req.body.username)
        return res.json({token})
    }catch(e){next(e)}
})

