/** User class for message.ly */
const jwt = require("jsonwebtoken");
const { SECRET_KEY, BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db")
const bcrypt = require("bcrypt")
/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    const hashWord =await bcrypt.hash(password,BCRYPT_WORK_FACTOR)
    const query = await db.query(`
      INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at)
        VALUES ($1,$2,$3,$4,$5,NOW(),NOW())`,[username, hashWord, first_name, last_name, phone])
    const token = jwt.sign({username},SECRET_KEY);

    return {username,password, first_name, last_name, phone}
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const query= await db.query(`SELECT password FROM users WHERE username = $1 `,[username])
    const  hashWord = query.rows[0].password
    const auth = await bcrypt.compare(password, hashWord)
    return auth
   }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const newLogin = db.query(`
      UPDATE users
      SET last_login_at = NOW();
    `)
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const query = await db.query(`
      SELECT first_name, last_name, phone, username
      FROM users`)
    
    return query.rows
  }
  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  

  static async get(username) {
    const query = await db.query(`
      SELECT username, first_name, last_name, phone, join_at, last_login_at
      FROM users
      WHERE username = $1`, [username])
      return query.rows[0]
   }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    
    const query = await db.query(`
      SELECT m.id as id, 
        m.body as body, 
        m.sent_at as sent, 
        m.read_at as read, 
        t.username as user, 
        t.first_name as first, 
        t.last_name as last, 
        t.phone as phone
        FROM messages as m
        JOIN users AS t ON m.to_username = t.username
        JOIN users AS f ON m.from_username = f.username
        WHERE f.username = $1   
        `,[username])
      
    if (!query.rows[0]){
      return {msg:"no messages found"};
    }
        
    const result = query.rows.map(row =>[{
      "body": row.body,
      "id":row.id,
      "read_at": row.read,
      "sent_at": row.sent,
      "to_user": {
        "first_name": row.first,
        "last_name": row.last,
        "username": row.user,
        "phone": row.phone
      }
    }])
      
    return result[0]
   }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    const query = await db.query(`
      SELECT m.id as id, 
        m.body as body, 
        m.sent_at as sent, 
        m.read_at as read, 
        f.username as user, 
        f.first_name as first, 
        f.last_name as last, 
        f.phone as phone
        FROM messages as m
        JOIN users AS t ON m.to_username = t.username
        JOIN users AS f ON m.from_username = f.username
        WHERE t.username = $1   
        `,[username])

    if (!query.rows[0]){
      return {msg:"no messages found"};
    }
        
    const result = query.rows.map(row =>[{
      "body":row.body,
      "id":row.id,
      "read_at": row.read,
      "sent_at": row.sent,
      "from_user": {
        "first_name": row.first,
        "last_name": row.last,
        "phone" : row.phone,
        "username": row.user
      }
    }])
      
    return result[0]
  }
}


module.exports = User;