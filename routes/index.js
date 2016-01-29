var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    Comment = require('../models/comment.js'),
    Email = require('../models/email.js'),
    Ccad = require('../models/ccad.js');
var express = require('express');
var ccap = require('ccap');

var router = express.Router();

/* GET */
//主页
router.get('/', function (req, res) {
    //判断是否是第一页，并把请求的页数转换成 number 类型
    var page = parseInt(req.query.p) || 1;
    //查询并返回第 page 页的 10 篇文章
    Post.getTen(null, page, function (err, posts, total) {
        if (err) {
            posts = [];
        }
        res.render('index', {
            title: '首页-forPlug',
            posts: posts,
            page: page,
            isFirstPage: (page - 1) == 0,
            isLastPage: ((page - 1) * 10 + posts.length) == total,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});

//登录
router.get('/login', checkNotLogin);
router.get('/login', function(req, res) {
  res.render('login', {
      title: '登录-forPlug',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString(),
  });
});
//输入验证码图片
router.get('/yzm', function(req, res) {
    //输入验证码图片
    Ccad.start(function(txt, buf){
        req.session.captcha_text = txt;
        res.send(buf);
    });
});
router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex'),
        name = req.body.name.toLowerCase();
    if (!name){
        req.flash('error', '请输入账号!');
        return res.redirect('/login');
    }
    if (!req.body.password){
        req.flash('error', '请输入密码!');
        return res.redirect('/login');
    }
    if (!req.body.yzm){
        req.flash('error', '请输入验证码!');
        return res.redirect('/login');
    }
    if (req.body.yzm.toLowerCase() != req.session.captcha_text) {
        req.flash('error', '验证码错误!');
        return res.redirect('/login');
    }
    //检查用户是否存在
    User.get(name, function (err, user) {
        if (!user) {
            req.flash('error', '账号或密码错误!');
            return res.redirect('/login');
        }
        //检查密码是否一致
        if (user.password != password) {
            req.flash('error', '账号或密码错误!');
            return res.redirect('/login');
        }
        //用户名密码都匹配后，将用户信息存入 session
        req.session.user = user;
        req.flash('success', '登陆成功!');
        res.redirect('/');//登陆成功后跳转到主页
    });
});

//注册
router.get('/reg', checkNotLogin);
router.get('/reg', function(req, res) {
  res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
  });
});

router.post('/reg', checkNotLogin);
router.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检测是否已经输入账号
    if (name.length == 0) {
        req.flash('error', '请输入账号!');
        return res.redirect('/reg');//返回注册页
    }
    //检测是否已经输入邮箱
    if (req.body.email.length == 0) {
        req.flash('error', '请输入邮箱!');
        return res.redirect('/reg');//返回注册页
    }
    //长度在3-15个字符
    if (name.length < 3) {
        req.flash('error', '账号由3-15个字符组成!');
        return res.redirect('/reg');//返回注册页
    }
    if (name.length > 15) {
        req.flash('error', '账号由3-15个字符组成!');
        return res.redirect('/reg');//返回注册页
    }
    //不能包含特殊符号
    patt1 = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    result = patt1.test(name);
    if (result) {
        req.flash('error', '账号不能包含特殊符号!');
        return res.redirect('/reg');//返回注册页
    }
    //检测是否已经输入密码
    if (!password) {
        req.flash('error', '请输入密码!');
        return res.redirect('/reg');//返回注册页
    }
    //长度在6-15个字符
    if (password.length < 6) {
        req.flash('error', '密码由6-18个字符组成!');
        return res.redirect('/reg');//返回注册页
    }
    if (password.length > 18) {
        req.flash('error', '密码由6-18个字符组成!');
        return res.redirect('/reg');//返回注册页
    }
    //检测是否已经输入确认密码
    if (!password_re) {
        req.flash('error', '请输入确认密码!');
        return res.redirect('/reg');//返回注册页
    }
    //检验用户两次输入的密码是否一致
    if (password_re != password) {
        req.flash('error', '两次输入的密码不一致!');
        return res.redirect('/reg');//返回注册页
    }
    //检测邮箱是否为空
    if (!req.body.email) {
        req.flash('error', '请输入注册邮箱!');
        return res.redirect('/reg');//返回注册页
    }
    //检测邮箱格式
    regEmail = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
    if (!regEmail.test(req.body.email)) {
        req.flash('error', '请输入正确的注册邮箱!');
        return res.redirect('/reg');//返回注册页
    }
    //检测验证码
    if (req.body.yzm.toLowerCase() != req.session.captcha_text) {
        req.flash('error', '验证码错误!');
        return res.redirect('/reg');
    }
    //生成密码的 md5 值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
        name: name,
        Low_name: name.toLowerCase(),
        password: password,
        email: req.body.email.toLowerCase()
    });
    //检查用户名是否已经存在
    User.get(newUser.Low_name, function (err, user) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        //检测账号是否存在
        if (user) {
            req.flash('error', '账号已存在!');
            return res.redirect('/reg');//返回注册页
        }
        Email.get(newUser.email, function (err, email) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');//出错返回页面
            }
            if (email) {
                req.flash('error', '邮箱已存在!');
                return res.redirect('/reg');//邮箱已存在返回页面
            }
            //如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//注册失败返回主册页
                }
                //随机生成6位验证码
                randomCode = Math.floor(Math.random() * 1000000);
                var email = new Email(req.body.email, randomCode);
                //发送验证码
                email.send();
                //检测邮箱是否存在
                email.save(function (err, user) {
                    if (err) {
                        req.flash('error', err);
                        return res.redirect('/reg');
                    }
                });
                //req.session.user = user;用户信息存入 session
                req.flash('success', '注册成功,请及时验证邮箱!');
                return res.redirect('/reg_mail');//注册成功后返回主页
            });
        });
    });
});

router.get('/reg_mail', function(req, res) {
    res.render('reg_mail', {
        title: '邮箱验证-forPlug',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/reg_mail', function(req, res) {
    var email = req.body.email,
        randomCode = req.body.randomCode;
    Email.get(email, function (err, email) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/reg_mail');//验证码失效返回页面
        }
        if (email) {
            if (randomCode == email.randomCode) {
                if (err) {
                    req.flash('error', err);
                }
                var date1 = new Date();
                var date2 = email.time - date1.getTime();//时间差的毫秒数
                var date3 = date2 % (3600 * 1000);        //计算小时数后剩余的毫秒数
                var minutes = Math.floor(date3 / (60 * 1000));
                if (minutes <= -10) {
                    req.flash('error', '此验证码失效!');
                    return res.redirect('/reg_mail');//验证码失效返回页面
                }
                Email.remove(randomCode, req.body.email,function (email, err) {
                    if (err) {
                        req.flash('error', err);
                        return res.redirect('/reg_mail');//验证码失效返回页面
                    }
                });
                req.flash('success', '验证成功!');
                return res.redirect('/login');//验证码成功返回页面
            } else {
                req.flash('error', '验证失败!');
                return res.redirect('/reg_mail');//验证失败返回页面
            }
        }
        req.flash('error', '验证失败!');
        return res.redirect('/reg_mail');//验证失败返回页面
    });
});


router.get('/re_mail', function(req, res) {
    res.render('re_mail', {
        title: '申请验证码-forPlug',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});
router.post('/re_mail', function(req, res) {
    var email = req.body.email;
    if (!email){
        req.flash('error', '请输入邮箱!');
        return res.redirect('/re_mail');//返回申请重新验证页面
    }
    if (req.body.yzm.toLowerCase() != req.session.captcha_text) {
        req.flash('error', '验证码错误!');
        return res.redirect('/re_mail');
    }
    Email.get(email, function (err, email) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/re_mail');
        }
        //检查是否拥有此邮箱
        if (!email) {
            req.flash('error', '无效邮箱!');
            return res.redirect('/re_mail');
        }
        randomCode = Math.floor(Math.random() * 1000000);
        var email1 = new Email(req.body.email, randomCode);
        //发送验证码
        email1.send();
        email1.save(function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/reg');//注册成功后返回主页
            }
        });
        req.flash('success', '重新发送验证码成功!');
        return res.redirect('/reg_mail');
    });
});


//发表
router.get('/post', checkLogin);
router.get('/post', function(req, res) {
    res.render('post', {
        title: '发表-forPlug',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString(),
        post: req.flash('post').toString(),
        title1: req.flash('title1').toString(),
        tag1: req.flash('tag1').toString(),
        tag2: req.flash('tag2').toString(),
        tag3: req.flash('tag3').toString(),
        about: req.flash('about').toString()
        //防止错误删除编辑内容
    });
});

router.post('/post', checkLogin);
router.post('/post', function(req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1, req.body.tag2, req.body.tag3],
        post = new Post(currentUser.name, req.body.title, tags, req.body.about, req.body.post);

    if(!req.body.title){
        req.flash('error', '请输入标题!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }
    if(!req.body.about){
        req.flash('error', '请输入简介!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }
    if(!req.body.tag1){
        req.flash('error', '请输入标签!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }
    if(!req.body.tag2) {
        req.flash('error', '请输入标签!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }
    if(!req.body.tag3){
        req.flash('error', '请输入标签!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }
    if(!req.body.post){
        req.flash('error', '请输入描述!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.title > 18){
        req.flash('error', '简介由3-18个字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.title > 3){
        req.flash('error', '标题由3-18个字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.about.length > 65){
        req.flash('error', '简介由5-65个字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.about.length < 5){
        req.flash('error', '简介由5-65个字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag1 > 4){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag1 < 1){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag2 > 4){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag2 < 1){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag3 > 4){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    if(req.body.tag3 < 1){
        req.flash('error', '标签由1-4字符组成!');
        req.flash('post', req.body.post);
        req.flash('title1', req.body.title);
        req.flash('tag1', req.body.tag1);
        req.flash('tag2', req.body.tag2);
        req.flash('tag3', req.body.tag3);
        req.flash('about', req.body.about);
        return res.redirect('/post');
    }

    post.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        req.flash('success', '发布成功!');
        res.redirect('/');//发表成功跳转到主页
    });
});

//登出
router.get('/logout', checkLogin);
router.get('/logout', function (req, res) {
    req.session.user = null;
    req.flash('success', '登出成功！');
    res.redirect('/');//登出成功后跳转到主页
});

router.get('/upload', checkLogin);
router.get('/upload', function (req, res) {
    res.render('upload', {
        title: '文件上传',
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
    });
});

router.post('/upload', checkLogin);
router.post('/upload', function (req, res) {
    req.flash('success', '文件上传成功！');
    res.redirect('/upload');
})

//实现用户页面与文章页面
router.get('/u/:name', function (req, res) {
    var page = parseInt(req.query.p) || 1;
    //检查用户是否存在
    User.get(req.params.name, function (err, user) {
        if (!user) {
            req.flash('error', '用户不存在!');
            return res.redirect('/');
        }
        //查询并返回该用户第 page 页的 10 篇文章
        Post.getTen(user.name, page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.x_name,
                posts: posts,
                page: page,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});
router.get('/u/:name/:day/:title', function (req, res) {
    Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('/');
        }
        res.render('article', {
            title: req.params.title,
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
//留言
router.post('/u/:name/:day/:title', function (req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
    var comment = {
        name: req.body.name,
        email: req.body.email,
        website: req.body.website,
        time: time,
        content: req.body.content
    };
    var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
    newComment.save(function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '留言成功!');
        res.redirect('back');
    });
});

//编辑与删除文章
router.get('/edit/:name/:day/:title', checkLogin);
router.get('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        res.render('edit', {
            title: '编辑',
            post: post,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
});
router.post('/edit/:name/:day/:title', checkLogin);
router.post('/edit/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
        var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
        if (err) {
            req.flash('error', err);
            return res.redirect(url);//出错！返回文章页
        }
        req.flash('success', '修改成功!');
        res.redirect(url);//成功！返回文章页
    });
});
router.get('/remove/:name/:day/:title', checkLogin);
router.get('/remove/:name/:day/:title', function (req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
        if (err) {
            req.flash('error', err);
            return res.redirect('back');
        }
        req.flash('success', '删除成功!');
        res.redirect('/');
    });
});

router.get('/demo', function (req, res) {
    req.flash('error', '有待开发...');
    res.redirect('/');//成功！返回文章页
});



function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录!');
        res.redirect('/login');
    }
    next();
}

function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录!');
        res.redirect('back');//返回之前的页面
    }
    next();
}

module.exports = router;
