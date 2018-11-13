var express = require('express');
var app = express();
var router = express.Router();
var bodyParser = require('body-parser');
// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var MongoClient = require('mongodb').MongoClient;
var dburl = 'mongodb://localhost:27017';
var url = require('url');
var moment = require('moment');

//创建库
router.get('/create', function (req, res) {
    MongoClient.connect(dburl, function (err, db) {
        if (err) throw err;
        console.log('数据库已创建');
        var dbase = db.db("db");
        dbase.createCollection('toilet', function (err, res) {
            if (err) throw err;
            console.log("创建集合!");
            db.close();
        });
    });
    res.send('数据库已创建');
})



//列表页
router.get('/', function (req, res) {
    MongoClient.connect(dburl, { useNewUrlParser: true },function(err, db) {
        if (err) throw err;
        var dbo = db.db("db");
        var mysort = { beginTime: -1 };
        dbo.collection("toilet"). find({}).limit(20).sort(mysort).toArray(function(err, result) { // 返回集合中所有数据
            if (err) throw err;
            for(var i = 0;i<result.length;i++){
                result[i].beginTime = moment(result[i].beginTime).format("YYYY-MM-DD HH:mm");
                result[i].endTime = moment(result[i].endTime).format("YYYY-MM-DD HH:mm");
            }
            db.close();
            res.render('toilet/list', { list: result});
        });
    });
})


//时间冲突校验
router.post('/checkTime', urlencodedParser, function (req, res) {
    MongoClient.connect(dburl, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("db");
        var whereStr = {endTime: { $gt: new Date(req.body.beginTime) },beginTime :{ $lt: new Date(req.body.endTime) }};   // 查询条件
        console.log(whereStr);
        dbo.collection("toilet").find(whereStr).toArray(function(err, result) {
            if (err) throw err;
            db.close();
            res.json({"flag":result.length>0});
        });
    });
})

//添加页
router.get('/add', function(req, res) {
    app.use(express.static('public'));
    res.render('toilet/add',{ now: moment(new Date()).format("YYYY-M-D H:m")});
});

//添加
router.post('/add', urlencodedParser, function (req, res) {
    var beginTime = req.body.beginTime;

    MongoClient.connect(dburl, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("db");
        var addStr ={
            room:req.body.room,
            beginTime:new Date(req.body.beginTime),
            endTime:new Date(req.body.endTime),
            date:req.body.date
        };
        dbo.collection("toilet").insertOne(addStr, function(err, obj) {
            if (err) throw err;
            console.log("数据插入成功");
            db.close();
            res.redirect(302, '/');
        });
    });
})

//删除
router.get('/del', function (req, res) {
    // 解析 url 参数
    var params = url.parse(req.url, true).query;
    MongoClient.connect(dburl,{ useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("db");
        var ObjectID = require('mongodb').ObjectID;
        var whereStr = {_id:ObjectID(params.id)};  // 条件
        dbo.collection("toilet").deleteOne(whereStr, function(err, obj) {
            if (err) throw err;
            db.close();
            res.redirect(302, '/');
        });
    });
})

module.exports = router;
