var nodemailer = require('nodemailer');
var mongodb = require('./db');

function Email(email, randomCode) {
    this.email = email;
    this.randomCode = randomCode;
}

module.exports = Email;

Email.prototype.send = function (){
    var transporter = nodemailer.createTransport({
        host: 'smtp.ym.163.com',
        port: '994',
        secure: true, // use SSL
        auth: {
            user: 'admin@forplug.com',
            pass: '998776lin'
        }
    });

    var mailOptions = {
        from: 'forPlug插件平台 <admin@forplug.com>', // sender address
        to: this.email, // list of receivers
        subject: 'forplug插件平台邮箱验证', // Subject line
        text: "验证码：" + this.randomCode, // plaintext body
        html: "验证码：" + this.randomCode // html body
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Message sent: ' + info.response);
        }
    });
};

//存储一篇文章及其相关信息
Email.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth() + 1),
        day : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "-" +
        date.getHours() + "-" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //要存入数据库的文档
    var mail = {
        email: this.email,
        time: date,
        randomCode: this.randomCode
    };
    //打开数据库
    if(mongodb.open){
        mongodb.close();
    }
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 email 集合
        db.collection('email', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档插入 posts 集合
            collection.insert(mail, {
                safe: true
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);//失败！返回 err
                }
                callback(null);//返回 err 为 null
            });
        });
    });
};


//读取用户信息
Email.get = function(email, callback) {
    //打开数据库
    if(mongodb.open){
        mongodb.close();
    }
        mongodb.open(function (err, db) {
            if (err) {
                return callback(err);//错误，返回 err 信息
            }
            //读取 users 集合
            db.collection('email', function (err, collection) {
                if (err) {
                    mongodb.close();
                    return callback(err);//错误，返回 err 信息
                }
                //查找邮箱（email键）值为 email 一个文档
                collection.findOne({
                    "email": email
                }, function (err, email) {
                    mongodb.close();
                    if (err) {
                        return callback(err);//失败！返回 err 信息
                    }
                    callback(null, email);//成功！返回查询的用户信息
                });
            });
        });
};

Email.remove = function(randomCode, email, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('email', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据邮箱查找并删除验证码
            collection.update({
               "email": email
            }, {
                $unset: { "randomCode": randomCode }
            },function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
