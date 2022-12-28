const { route } = require("./app");
const db = require("../db");
const Message = require("../models/message");
const ExpressError = require("../expressError");
const { JsonWebTokenError } = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
route.get("/:id", async function(req, res, next){
    try{
        const results = await db.query(`
        SELECT 
        m.id as id, 
        m.body as body, 
        m.sent_at as sent, 
        m.read_at as read, 
        f.username as user, 
        f.first_name as first, 
        f.last_name as last, 
        f.phone as phone,
        t.username as to_user, 
        t.first_name as to_name, 
        t.last_name as to_last, 
        t.phone as to_phone
        FROM messages AS m 
        JOIN users AS f ON m.from_username = f.username
        JOIN users as t ON m.to_username = t.username
        `)

        const info = results.rows[0]

        return res.json({
            "message": {
                id : info.id, 
                body : info.body, 
                sent_at : info.sent,
                read_at : info.read,
                from_user : {
                    username : info.user,
                    first_name : info.first,
                    last_name : info.last,
                    phone : info.phone
                },
                to_user : {
                    username : info.to_user,
                    first_name : info.to_name,
                    last_name : info.to_last,
                    phone: info.to_phone
                }
            }
        })
    }catch(e){next(e)}

    })

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
route.post('/', async function(req,res,next){
    const msg = await Message.create(req.body._token.username,req.body.to_username, req.body.body)
    return res.json({"message": {"id":msg.id, "from_username":msg.from_username,"to_username":msg.to_username,"body":msg.body,"sent_at":msg.sent_at}})

})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
route.post('/:id/read', async function(req,res,next){
    
    try{
    if (!req.body._token){
        throw new ExpressError("must login first and add jwt to request")
    }
    
    const token = JsonWebTokenError.verify(req.body._token, SECRET_KEY)

    const msg = await Message.get(req.params.id)
    
    if (msg.from_user.username != token.username){
        throw new ExpressError("you are not allowed to mark this message read")
    }
    await Message.markRead(req.params.id)

    return res.json({"message": {"id": msg.id, "read_at":msg.read_at}})

    }catch(e){next(e)}
})
