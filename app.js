const port = 3000;
const path = require('path');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = multer();
const history = require('connect-history-api-fallback');
const bcrypt = require('bcrypt');
app.use(history());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(upload.none());

app.get('/api/check-auth', verifyToken, (req, res) => {
  if (req.user) {
    res.json({ isAuthenticated: true });
  } else {
    res.json({ isAuthenticated: false });
  }
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'whdfh11!!', 
  database: 'cancer365',
  // port: '3306',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
  keepAliveInitialDelay: 10000,
  enableKeepAlive: true
});

module.exports = pool;


// // admin 계정 생성
// async function createAdminUser() {
//   try {
//     const username = 'admin';
//     const password = '123';
//     const saltRounds = 10;


//     const hashedPassword = await bcrypt.hash(password, saltRounds);


//     const query = 'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)';
//     pool.query(query, [username, hashedPassword], (err, results) => {
//       if (err) throw err;
//       console.log('New admin user created:', results);
//     });
//   } catch (error) {
//     console.error('Error creating admin user:', error);
//   }
// }
// createAdminUser();


function verifyToken(req, res, next) {

  if (!req.headers.authorization) {
    console.log('Authorization 헤더 없음');
    return res.status(401).json({ message: '인증 헤더가 필요합니다.' });
  }

  const token = req.headers.authorization.split(' ')[1];
  if (!token) {
    console.log('토큰 없음');
    return res.status(401).json({ message: '토큰이 필요합니다.' });
  }

  jwt.verify(token, 'CancercCare365SecretKey', (err, decoded) => {
    if (err) {
      console.log('토큰 검증 실패:', err);
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
    console.log('토큰 검증 성공:', decoded);
    req.user = decoded;
    next();
  });
}

// app.post('/api/login', (req, res) => {
//   const { id, password } = req.body;
//   console.log('로그인 요청 받음:', req.body);

//   const sql = 'SELECT * FROM admin_users WHERE username = ?';
//   pool.query(sql, [id], function(err, results) {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Server Error');
//     }

//     if (results.length > 0) {
//       const user = results[0];

//       if (password === user.password_hash) {
//         const token = jwt.sign({ userId: user.id }, 'CancercCare365SecretKey', { expiresIn: '1h' });
//         res.json({ success: true, isAuthenticated: true, token });
//       } else {
//         res.json({ success: false, message: '잘못된 ID 또는 비밀번호가 같지 않습니다' });
//       }
//     } else {
//       res.json({ success: false, message: 'ID가 없습니다' });
//     }
//   });
// });

app.post('/api/login', (req, res) => {
  const { id, password } = req.body;

  const sql = 'SELECT * FROM admin_users WHERE username = ?';
  pool.query(sql, [id], function(err, results) {
    if (err) {
      console.error(err);
      return res.status(500).send('Server Error');
    }

    if (results.length > 0) {
      const user = results[0];

      bcrypt.compare(password, user.password_hash, function(err, isMatch) {
        if (err) {
          console.error(err);
          return res.status(500).send('Server Error');
        }

        console.log(isMatch);

        if (isMatch) {
          const token = jwt.sign({ userId: user.id }, 'CancercCare365SecretKey', { expiresIn: '1h' });
          res.json({ success: true, isAuthenticated: true, token });
        } else {
          res.json({ success: false, message: '잘못된 ID 또는 비밀번호입니다' });
        }
      });
    } else {
      res.json({ success: false, message: 'ID가 없습니다' });
    }
  });
});

app.post('/api/logout', (req, res) => {
  res.json({ success: true, message: '로그아웃 성공' });
});

const saltRounds = 10; 

app.post('/api/change-pw', verifyToken, (req, res) => {
  const { newPassword } = req.body;
  
  const userId = req.user.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: '사용자 인증이 필요합니다' });
  }

  bcrypt.hash(newPassword, saltRounds, function(err, hashedPassword) {
    if (err) {
      console.error(err);
      return res.status(500).send('서버 오류');
    }

    const sql = 'UPDATE admin_users SET password_hash = ? WHERE id = ?';
    pool.query(sql, [hashedPassword, userId], function(err, results) {
      if (err) {
        console.error(err);
        return res.status(500).send('서버 오류');
      }

      if (results.affectedRows === 0) {
        return res.json({ success: false, message: '비밀번호 변경 실패' });
      }

      res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다' });
    });
  });
});

// app.post('/api/change-pw', verifyToken, (req, res) => {
//   const { newPassword } = req.body;

//   const userId = req.user.userId;

//   if (!userId) {
//     return res.status(401).json({ success: false, message: '사용자 인증이 필요합니다' });
//   }


//   const sql = 'UPDATE admin_users SET password_hash = ? WHERE id = ?';
//   pool.query(sql, [newPassword, userId], function(err, results) {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('서버 오류');
//     }

//     if (results.affectedRows === 0) {
//       return res.json({ success: false, message: '비밀번호 변경 실패' });
//     }

//     res.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다' });
//   });
// });

app.post('/api/apply', upload.none(), (req, res) => {
  console.log(req.body);
  const round = req.body.round;
  const name = req.body.name;
  const phone = req.body.phone;
  const hospital = req.body.hospital; 
  const address1 = req.body.address1;
  const address2 = req.body.address2;
  const position = req.body.position;
  const inviter = req.body.inviter;
  const topics = req.body.topics;
  const terms = req.body.terms;

  var sql = `insert into list(round, name, phone, hospital, address1, address2, position, inviter, topics, terms) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  pool.query(sql, [round, name, phone, hospital, address1, address2, position, inviter, topics, terms], function (err, result) {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ success: false, message: '데이터베이스 오류' });
    }

    console.log('자료 1개를 삽입하였습니다.');
    res.json({ success: true, message: '신청이 접수되었습니다' });
  });
});

app.get('/api/list', (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let offset = (page - 1) * limit;

  var sql = 'SELECT * FROM list ORDER BY id DESC LIMIT ? OFFSET ?';
  var sqlCount = 'SELECT COUNT(*) AS count FROM list';

  pool.query(sqlCount, function (err, countResult) {
    if (err) {
      console.error(err);
      res.status(500).send('Server Error');
      return;
    }

    pool.query(sql, [limit, offset], function (err, results) {
      if (err) {
        console.error(err);
        res.status(500).send('Server Error');
        return;
      }
      res.json({ total: countResult[0].count, data: results });
    });
  });
});


app.get('/api/list_detail', (req, res) => {
  
  const id = req.query.id; 

  const sql = `SELECT * FROM list WHERE id = ${id}`;

  pool.query(sql, function (err, result) {
    if (err) {
      console.error('DB 오류:', err);
      return res.status(500).json({ success: false, message: '데이터베이스 오류' });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: '상세 정보를 찾을 수 없습니다' });
    }

    res.json({ success: true, data: result[0] });
  });
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {

  console.log(`서버가 실행되었습니다. 접속주소 : http://localhost:${port}`)

})

process.on('SIGINT', () => {
  console.log('서버가 종료되었습니다. MySQL 연결 풀을 종료합니다.');
  pool.end((err) => {
    if (err) {
      console.error('MySQL 연결 풀 종료 오류:', err);
    }
    process.exit(0);
  });
});
