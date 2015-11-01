//
//                       _oo0oo_
//                      o8888888o
//                      88" . "88
//                      (| -_- |)
//                      0\  =  /0
//                    ___/`---'\___
//                  .' \\|     |// '.
//                 / \\|||  :  |||// \
//                / _||||| -:- |||||- \
//               |   | \\\  -  /// |   |
//               | \_|  ''\---/''  |_/ |
//               \  .-\__  '-'  ___/-. /
//             ___'. .'  /--.--\  `. .'___
//          ."" '<  `.___\_<|>_/___.' >' "".
//         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
//         \  \ `_.   \_ __\ /__ _/   .-` /  /
//     =====`-.____`.___ \_____/___.-`___.-'=====
//                       `=---='
//
//
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//               佛祖保佑         永無BUG
//
//
//

var json = require('jsonfile')
var server = require('koa-static-folder');
var bodyParser = require("koa-bodyparser");
var path = require('path');
var fs = require('mz/fs');
var logger = require('koa-logger');
var http    = require('http');
var https   = require('https');
var koa     = require('koa');
var bodyParser = require("koa-bodyparser"); // 參考：http://codeforgeek.com/2014/09/handle-get-post-request-express-4/
var fs      = require('mz/fs');
var route   = require('koa-route');
var co      = require('co');
var monk    = require('monk');
var comonk  = require('co-monk');
var db      = monk('localhost/test');
var examdb   = comonk(db.get('examdb'));
var password   = comonk(db.get('password'));
var reportdb   = comonk(db.get('reportdb'));
var server = require('koa-static-folder');
var app = koa();

app.use(bodyParser());
app.use(logger());
app.use(server('./web')); 

function response(res, code, msg) {
  res.status = code;
  res.set({'Content-Length':''+msg.length,'Content-Type':'text/plain'});
  res.body = msg;
  console.log("response: code="+code+"\n"+msg+"\n");
}

app.use(route.get('/', function*() {
  this.redirect('/web/index0422_ccc.html');
}));

var mime = { ".css":"text/css", ".html": "text/html", ".htm":"text/html", ".jpg":"image/jpg", ".png":"image/png", ".gif":"image/gif", ".pdf":"application/pdf"};

function fileMimeType(path) {
  for (var tail in mime) {
    if (path.endsWith(tail))
      return mime[tail];
  }
}

app.use(route.get(/\/web\/.*/, function *toStatic() {
  var req = this.request, res = this.response;
  console.log('get %s', this.path);
  var mimetype = fileMimeType(this.path)
  if (mimetype) this.type = mimetype+";";
  this.body = fs.createReadStream(__dirname+this.path);
}));

app.use(route.get("/note/:id", function *edit(id) {
  var obj = yield examdb.findOne({_id:id}); // 查出所有記事
  response(this.response, 200, JSON.stringify(obj));
}));


app.use(route.get("/list", function *list() {
  console.log("/list path=%s", this.path);
  var objs = yield examdb.find({}); // 查出所有記事
  console.log("objs=%j", objs);
  response(this.response, 200, JSON.stringify(objs));
}));

app.use(route.post("/db/main/file", function*(req, res) {
        var req = this.request,
        res = this.response;
        var db = this.request.db;
        var name = this.request.name;
        var qa = this.request.body.obj;
        var exroom = this.request.body.obj2; 
		  yield examdb.insert(JSON.parse(qa));
          response(this.response, 200, 'write success!');
}));

app.use(route.post("/password", function *login() {
  var req = this.request,
      res = this.response;
  var pd = this.request.body.password;
  var user = this.request.body.user;
  console.log("/password path=%s", this.path);
  var objs = yield password.find({user:user}); // 查出所有記事
  
  if (objs[0].password === pd) {
  	response(this.response, 200, JSON.stringify(objs[0]));    
// 	response(this.response, 200, "登入成功"+objs[0].type);
  }else{
	response(this.response, 404, "登入失敗!!");
  }
  //console.log("objs=%j", objs);
  //response(this.response, 200, JSON.stringify(objs));
  /*
  for(i =0; i<objs[0].passwordList.length; i++)
  {
  */
  /*
  if(objs[0].passwordList[0].password == pd)
	   {
	      if(objs[0].passwordList[0].user == user)
		  {
		     response(this.response, 200, "學生登入成功");
		  }else{
		     response(this.response, 404, "登入失敗!!");
		  }
	   }else if(objs[0].passwordList[1].password == pd){
	      if(objs[0].passwordList[1].user == user)
		  {
		     response(this.response, 200, "導師登入成功");
		  }else{
		     response(this.response, 200, "登入失敗!!");
		  }
	   }else{
	       response(this.response, 200, "登入失敗!!");  
	   }
	   */
    /*}*/
}));

app.use(route.post("/logout", function *logout() {
  var req = this.request,
      res = this.response;
  this.session = null;
  response(res, 200, "logout success!");
}));

app.use(route.post("/report", function *report() {
  var req = this.request,
      res = this.response;
  var ui = this.request.body.ui;
  var report = this.request.body.report;
  yield reportdb.insert({ userInput : ui, report : report});
  response(res, 200, "report success!");
}));

app.use(route.post("/history", function *history() {
  var req = this.request,
      res = this.response;
  var userhistory = this.request.body.userhistory;
  var obj = yield reportdb.find({userInput:userhistory});
  //console.log(JSON.pause(obj).userInput);
     response(res, 200, JSON.stringify(obj));
}));

app.use(route.post("/register", function *register() {
  var req = this.request,
      res = this.response;
  var registerUser = this.request.body.registerUser;
  var registerPassword = this.request.body.registerPassword;
  var registerJob = this.request.body.registerJob;
  yield password.insert({user : registerUser,password : registerPassword,type : registerJob});
     response(res, 200, "註冊成功");
}));

app.use(function* (next) {
  if (this.path !== '/') return yield next;
  yield send(this, __dirname + 'index.html');
});


var server = http.createServer(app.callback());
var io = require('socket.io')(server);

io.on('connection', function (socket) {
  socket.on('chat message', function (data) {
    console.log(data);
    io.emit('chat message', data);
  });
});


    port = 1337;
    server.listen(port);

    console.log('Server start success');
    console.log('Http Server started: http://localhost:'+port);
    
    var port = process.env.PORT || 80;

    console.log('Server started: http://localhost:'+port);

    var server1 = http.createServer(app.callback());

	server1.listen(port); 
    var sslPort = 443; 

    var server2 = https.createServer({
           key: fs.readFileSync('key.pem'),
           cert: fs.readFileSync('cert.pem'),
           requestCert: true, 
           ca: [ fs.readFileSync('csr.pem') ]
    }, app.callback());
	 var io = require('socket.io')(server2);
	 io.on('connection', function (socket) {
     socket.on('chat message', function (data) {
     console.log(data);
     io.emit('chat message', data);
    });
    });

    server2.listen(sslPort);
    console.log('Http Server started: http://localhost:'+sslPort); 


//var MongoClient = require('mongodb').MongoClient;

/*
MongoClient.connect("mongodb://localhost:27017/examdb", function(err, db) {
  if(err) { return console.dir(err); }

 var collection = db.collection('Q');
 var docs = [{ "_id":"1",type:"word", q:"he",ans:"他"}, { "_id":"2",type:"word", q:"she",ans:"她"}, { "_id":"3",type:"word", q:"it",ans:"它"} ];
  collection.insert(docs, {w:1}, function(err, result) { // success!


    var stream = collection.find({}).stream();
    stream.on("data", function(item) {
        console.log("item=%j", item);

    });
    stream.on("end", function() {
        db.close();        
    });



  });
});
*/