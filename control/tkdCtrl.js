var tkdCtrol = {},
    _ = require('underscore'),
    formidable = require('formidable'),
    fs = require('fs'),
    appLog = require('../common/app_log.js'),
    appUtil = require('../common/utils.js'),
    Card = require('../models/tkd_card'),
    Hero = require('../models/tkd_hero'),
    Rule = require('../models/tkd_rule');

/**************************三国杀后台逻辑************************************/
// 上传图标
tkdCtrol.uploadIco = function(req, res) {
  // parse a file upload
  var form = new formidable.IncomingForm(),files=[],fields=[],docs=[];
  
  //存放目录
  form.uploadDir = 'public/upload_imgs/';

  // 接收到前端传过来的文件时事件
  form.on('field', function(field, value) {
    fields.push([field, value]);
  // 前端文件读取时事件
  }).on('file', function(field, file) {
    var types = file.name.split('.'),
        date = new Date(),
        ms = Date.parse(date),
        // 传回给前端的图片地址
        _url = "public/upload_imgs/" + ms + '_'+ file.name;

    file.url = _url;
    files.push([field, file]);
    docs.push(file);

    fs.renameSync(file.path, _url);
  // 文件读取结束事件
  }).on('end', function() {
    // 自定义返回前台数据
    var _files = [],
        _file = null,
        _temp_file = null,
        i,
        out = null,
        sout = null;
    
    res.writeHead(200, {
      'content-type': 'text/plain'
    });

    for(i = 0; i < docs.length; i++){
      _file = docs[i];
      // 地址替换
      _url = _file.url.replace('public', '');

      _temp_file = {
        name: _file.name,
        path: _file.path,
        size: _file.size,
        type: _file.type,
        url: _url
      };
      _files.push(_temp_file);
    }
    out = {
      Resopnse:{
        'result-code':0,
        timeStamp:new Date()
      },
      files: _files
    };
    sout = JSON.stringify(out);
    res.end(sout);
  });

  // 文件解析事件
  form.parse(req, function(err, fields, files) {
    if(err){
      appLog.writeErrorLog("tkdCtrl.js", "上传图片文件解析异常");
    }
  });
};

// 查询列表(规则、卡牌、武将、攻略)
tkdCtrol.tkdList = function(req, res) {
  var pageNum = req.query.pageNum?parseInt(req.query.pageNum,10):1,
      tkd_type = req.query.tkd_type?req.query.tkd_type:"rule",
      opt = {"pageNum": pageNum},
      pageSize = 10,
      sizeCount = 0,
      skipCount = 0,
      totalPage = 1;
  
  if (pageNum > 1){
    skipCount = (pageNum - 1) * pageSize - 1;
  }else if (pageNum <= 0){
    showObj = {
        "pageNum": pageNum,
        "pageSize": pageSize,
        "totalPage": totalPage,
        "ruleList": []
    };
    res.render('admin/tkd_rule_list', { 
      title: '三国杀列表页',
      rules: showObj,
      type: 'tkd'
    });
    return false;
  }
  switch(tkd_type){
    case "rule":
      searchRuleList();
      break;
    case "card":
      searchCardList()
      break;
    case "heros":
      searchHerosList();
      break;
    case "strategy":
      searchStrategyList();
      break;
    default:
      searchRuleList();
      break;
  }
  function searchRuleList(){
    // 搜索规则列表(自个儿计算分页数据)
    Rule.fetchAll(function(err, rules){
      var showObj = {}, ruleList = [], ruleObj, i, len;
      len = rules.length;

      if (err){
        appLog.writeErrorLog("tkdCtrl.js", "查询规则列表异常");
      }else{
        if (len > 0) {
          totalPage = Math.ceil(len/pageSize);
        } 
        for(i = skipCount; i < len; i++){
          ruleObj = rules[i];
          sizeCount++;
          ruleList.push({
            "title": ruleObj.title,
            "ico": ruleObj.ico,
            "desc": ruleObj.desc,
            "_id": ruleObj._id
          });
          if(sizeCount >= 10){
            break;
          }
        }
        showObj = {
          "pageNum": pageNum,
          "pageSize": pageSize,
          "totalPage": totalPage,
          "ruleList": ruleList
        };
        res.render('admin/tkd_rule_list', { 
          title: '三国杀列表页',
          rules: showObj,
          type: 'tkd',
          "tkd_type": 'rule'
        });
      }
    });
  }
  // 查找卡牌列表
  function searchCardList(){
    Card.fetchAll(function(err, cards){
      var showObj = {}, cardList = [], cardObj, i, len;
      len = cards.length;
      if (err){
        appLog.writeErrorLog("tkdCtrl.js", "查询卡牌列表异常");
      }else{
        if (len > 0) {
          totalPage = Math.ceil(len/pageSize);
        } 
        for(i = skipCount; i < len; i++){
          cardObj = cards[i];
          sizeCount++;
          cardList.push({
            "title": cardObj.title,
            "ico": cardObj.ico,
            "desc": cardObj.desc,
            "_id": cardObj._id
          });
          if(sizeCount >= 10){
            break;
          }
        }
        showObj = {
          "pageNum": pageNum,
          "pageSize": pageSize,
          "totalPage": totalPage,
          "cardList": cardList
        };
        res.render('admin/tkd_card_list', { 
          title: '三国杀列表页',
          type: 'tkd',
          "cardObj": showObj,
          "tkd_type": 'card'
        });
      }
    });
  }
  // 查找武将卡牌列表
  function searchHerosList(){
    var herosList = [], showObj = {};
    showObj = {
      "pageNum": pageNum,
      "pageSize": pageSize,
      "totalPage": totalPage,
      "herosList": herosList
    };
    res.render('admin/tkd_hero_list', { 
      title: '三国杀列表页',
      type: 'tkd',
      "cardObj": showObj,
      "tkd_type": 'heros'
    });
  }
  // 查找攻略列表
  function searchStrategyList(){
    var strategyList = [], showObj = {};
    showObj = {
      "pageNum": pageNum,
      "pageSize": pageSize,
      "totalPage": totalPage,
      "strategyList": strategyList
    };
    res.render('admin/tkd_strategy_list', { 
      title: '三国杀列表页',
      type: 'tkd',
      "cardObj": showObj,
      "tkd_type": 'strategy'
    });
  }
};

// 添加规则
tkdCtrol.ruleAdd = function(req, res){
  var rule = {
    title: req.body.title || '',
    desc: req.body.desc || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || '',
    content: req.body.ueTxt || '',
    htmlCont: req.body.ueContent || ''
  };
  if (req.body.title == null || req.body.title == '') {
    res.redirect('/admin/tkd');
  }

  Rule.createInfo(rule, function(error, result){
    if (error){
      // 写一错误显示页面， 错误信息在该页面显示之
      appLog.writeErrorLog("tkdCtrl.js", "添加规则至数据库异常");
    }else{
      res.redirect('/admin/tkd');
    }
  });
};
// 根据ID获取规则数据
tkdCtrol.getRuleById = function(req, res){
  var _id = req.query.id;
  if (_id == null || _id == ''){
    res.json({error: 'ID不能为空'});
  }else{
    Rule.findById(_id, function(err, data){
      if(err){
        res.json({error: '根据ID查询规则异常!'});
      }else{
        res.json({data: data});
      }
    });
  }
};
// 更新规则
tkdCtrol.ruleUpdate = function(req, res){
  var id = req.body.id;

  var rule = {
    title: req.body.title || '',
    desc: req.body.desc || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || '',
    content: req.body.ueTxt || '',
    htmlCont: req.body.ueContent || ''
  };
  Rule.updateInfo(id, rule, function(err, updateCount){
    if (err){
      appLog.writeErrorLog("tkdCtrl.js", "更新规则数据库操作异常，错误码：" + updateCount);
      res.redirect('/admin/tkd');
    }else{
      res.redirect('/admin/tkd');
    }
  });
};
// 删除规则
tkdCtrol.deleteRuleById = function(req, res){
  var id = req.body.id;

  Rule.deleteInfo(id, function(err, updateCount){
    if (err){
      res.json({error: '删除规则错误', code:'500'});
    }else{
      res.json({success:'true'});
    }
  });
};

// 添加卡牌
tkdCtrol.cardAdd = function(req, res){
  var card = {
    title: req.body.title || '',
    desc: req.body.desc || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || ''
  };
  if (!req.body.title) {
    res.redirect('/admin/tkd');
  }
  Card.createInfo(card, function(error, result){
    if (error){
      // 写一错误显示页面， 错误信息在该页面显示之
      appLog.writeErrorLog("tkdCtrl.js", "添加卡牌至数据库异常");
    }else{
      res.redirect('/admin/tkd?tkd_type=card');
    }
  });
};
// 添加卡牌详情
tkdCtrol.addCardDetail = function(req, res){
  var cardDetail = {
    title: req.body.title || '',
    htmlCont: req.body.content || '',
    anchorId: req.body.anchorId || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || '',
    typeId: req.body.typeId || '',
    aqList: req.body.aqList || null
  };
  if(cardDetail.aqList){
    cardDetail.aqList = JSON.parse(cardDetail.aqList);
  }
  if (!req.body.title) {
    res.redirect('/admin/tkd');
  }
  // 卡牌详情添加
  Card.addCardDetail(cardDetail, function(error, result){
    if (error){
      // 写一错误显示页面， 错误信息在该页面显示之
      appLog.writeErrorLog("tkdCtrl.js", "添加卡牌详情至数据库异常");
      res.redirect('/admin/tkd/cardDetailList?typeId=' + cardDetail.typeId);
    }else{
      res.redirect('/admin/tkd/cardDetailList?typeId=' + cardDetail.typeId);
    }
  });
};
// 根据ID获取卡牌数据
tkdCtrol.getCardById = function(req, res){
  var _id = req.query.id;
  if (_id == null || _id == ''){
    res.json({error: 'ID不能为空'});
  }else{
    Card.findById(_id, function(err, data){
      if(err){
        res.json({error: '根据ID查询卡牌异常!'});
      }else{
        res.json({data: data});
      }
    });
  }
}
// 更新卡牌
tkdCtrol.cardUpdate = function(req, res){
  var id = req.body.id;

  var card = {
    title: req.body.title || '',
    desc: req.body.desc || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || ''
  };
  Card.updateInfo(id, card, function(err, updateCount){
    if (err){
      appLog.writeErrorLog("tkdCtrl.js", "更新卡牌数据库操作异常，错误码：" + updateCount);
    }else{
      res.redirect('/admin/tkd?tkd_type=card');
    }
  });
};
// 删除卡牌
tkdCtrol.deleteCardById = function(req, res){
  var id = req.body.id;
  Card.deleteInfo(id, function(err, updateCount){
    if (err){
      res.json({error: '删除规则错误', code:'500'});
    }else{
      res.json({success:'true'});
    }
  });
};
// 删除卡牌详情
tkdCtrol.deleteCardDetail = function(req, res){
  var id = req.body.id,
      This = this,
      typeId = req.body.typeId;
  var opt = {
    "id": id,
    "typeId": typeId
  };

  // 根据卡牌类型ID获得卡牌详情
  Card.removeCardDetail(opt, function(err, result){
    if (err || result != 1) {
      res.json({error: '删除卡牌详情异常!'});
    } else {
      res.json({success:'true'});
    }
  });
};
// 更新卡牌详情
tkdCtrol.updateCardDetal = function(req, res){
  var cardDetail = {
    title: req.body.title || '',
    htmlCont: req.body.content || '',
    anchorId: req.body.anchorId || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || '',
    aqList: req.body.aqList || null
  };
  var opt = null;
  if(cardDetail.aqList){
    cardDetail.aqList = JSON.parse(cardDetail.aqList);
  }
  opt = {
    "id": req.body.detailId || '',
    "typeId": req.body.typeId || '',
    "detailObj": cardDetail
  };
  // 根据卡牌类型ID获得卡牌详情
  Card.updateCardDetail(opt, function(err, result){
    if (err || result != 1) {
      appLog.writeErrorLog("tkdCtrl.js", "更新卡牌详情异常");
      res.redirect('/admin/tkd/cardDetailList?typeId=' + opt.typeId);
    } else {
      res.redirect('/admin/tkd/cardDetailList?typeId=' + opt.typeId);
    }
  });
}
// 新增武将势力
tkdCtrol.editCountry = function(req, res){
  var countryObj = {
    name: '武将势力',
    datas: []
  };
  // 武将势力新增、修改都是调用该控制器
  
}

// 根据ID获取卡牌详情数据
tkdCtrol.getCardDetailById = function(req, res){
  var opt = {
    "id": req.query.id,
    "typeId": req.query.typeId
  };

  if(!opt.id){
    res.json({error: '卡牌ID不能为空'});
  } else if(!opt.typeId){
    res.json({error: '卡牌类型ID不能为空'});
  }else{
    Card.findCardDetailById(opt, function(err, data){
      if(err){
        res.json({error: '根据ID查询卡牌详情异常!'});
      } else if (data == 0){
        res.json({error: '不存在该ID的卡牌详情!'});
      }else{
        res.json({data: data});
      }
    });
  }
}

// 卡牌详情列表
tkdCtrol.cardDetailList = function(req, res){
  var cardTypeId = req.query.typeId?req.query.typeId:"",
      detailList = [],
      This = this;

  if (cardTypeId == ""){
    res.render('admin/tkd_card_detail_list', { 
      "title": '三国杀卡牌详情列表页',
      "detailList": detailList,
      "cardTypeId": cardTypeId
    });
  } else {
    Card.findById(cardTypeId, function(err, data){
      var detailObj = null,
          tmpObj = null,
          cardList = [],
          i;

      if(err){
        appLog.writeErrorLog("tkdCtrl.js", "查询列表卡牌详情列表异常");
      }else{
        cardList = data.cardList?data.cardList:[];
        for(i = 0; i < cardList.length; i++){
          detailObj = cardList[i];
          tmpObj = {
            "title": detailObj.title,
            "id": detailObj._id,
            "anchorId": detailObj.anchorId,
            "ico": detailObj.ico,
            "icoName": detailObj.icoName,
            "desc": appUtil.cutOutStr(detailObj.htmlCont, 30)
          };
          detailList.push(tmpObj);
        }
        res.render('admin/tkd_card_detail_list', { 
          "title": '三国杀卡牌详情列表页',
          "detailList": detailList,
          "cardTypeId": cardTypeId
        });
      }
    });
  }
};
// 新增武将
tkdCtrol.addHero = function(req, res){
  var hero = {
    // 武将所属势力
    country: req.body.packageType || '',
    // 武将所属包
    packageType: req.body.packageType || '',
    ico: req.body.icoPath || '',
    icoName: req.body.icoName || '',
    name: req.body.name || '',
    nickName: req.body.nickName || '',
    onlineTask: req.body.onlineTask || '',
    // 技能数组（需要JSON.parse）
    power: req.body.power || '',
    // 问答数组（需要JSON.parse）
    aqList: req.body.aqList || '',
    idStrategy: req.body.idStrategy || ''
  };
  if (!req.body.country) {
    res.redirect('/admin/tkd?tkd_type=heros');
  }
  Hero.createInfo(hero, function(error, result){
    if (error){
      // 写一错误显示页面， 错误信息在该页面显示之
      appLog.writeErrorLog("tkdCtrl.js", "添加武将至数据库异常");
    }else{
      res.redirect('/admin/tkd?tkd_type=heros');
    }
  });
}
// 武将列表
tkdCtrol.heroList = function(req, res){

}
// 查询势力
tkdCtrol.searchCountry = function(req, res){

}
// 新增势力
tkdCtrol.addCountry = function(req, res){

}
// 查询包
tkdCtrol.searchPackage = function(req, res){

}
// 新增包
tkdCtrol.addPackage = function(req, res){

}

/**************************三国杀后台逻辑end*****************************/



/**************************三国杀前端json start**************************/
// 查询规则列表
tkdCtrol.tkdRulesList = function(req, res) {
  var pageNum = req.query.pageNum?parseInt(req.query.pageNum, 10):1,
      pageSize = 10,
      opt = {"pageNum": pageNum,"pageSize": pageSize},
      totalPage = 'none';

  if (pageNum <= 0){
    showObj = {
        "pageNum": pageNum,
        "pageSize": pageSize,
        "totalPage": totalPage,
        "ruleList": []
    };
    res.json({"rules": showObj});
    return false;
  }
  if (pageNum > 0) {
    opt.skipCount = (opt.pageNum - 1) * opt.pageSize;
  } else {
    opt.skipCount = 0;
  }
  // 搜索规则列表
  Rule.fetch(opt, function(err, rules){
    var showObj = {}, ruleList = [], ruleObj, i, len;
    if (err){
      res.json({"error": '查询规则列表异常!'});
      appLog.writeErrorLog("tkdCtrl.js", "查询规则列表异常");
    }else{
      for(i = 0, len = rules.length; i < len; i++){
        ruleObj = rules[i];
        ruleList.push({
          "title": ruleObj.title,
          "ico": ruleObj.ico,
          "desc": ruleObj.desc,
          "_id": ruleObj._id
        });
      }
      showObj = {
        "pageNum": pageNum,
        "pageSize": pageSize,
        "totalPage": totalPage,
        "ruleList": ruleList
      };
      res.json({"rules": showObj});
    }
  });
};
// 查询卡牌列表
tkdCtrol.tkdCardList = function(req, res){
  var pageNum = req.query.pageNum?parseInt(req.query.pageNum, 10):1,
      pageSize = 10,
      opt = {"pageNum": pageNum,"pageSize": pageSize},
      totalPage = 'none';

  if (pageNum <= 0){
    showObj = {
        "pageNum": pageNum,
        "pageSize": pageSize,
        "totalPage": totalPage,
        "cardList": []
    };
    res.json({"cards": showObj});
    return false;
  }
  if (pageNum > 0) {
    opt.skipCount = (opt.pageNum - 1) * opt.pageSize;
  } else {
    opt.skipCount = 0;
  }
  // 搜索规则列表
  Card.fetch(opt, function(err, cards){
    var showObj = {}, cardList = [], cardObj, i, len;
    if (err){
      appLog.writeErrorLog("tkdCtrl.js", "查询卡牌列表异常");
    }else{
      for(i = 0, len = cards.length; i < len; i++){
        cardObj = cards[i];
        cardList.push({
          "title": cardObj.title,
          "ico": cardObj.ico,
          "desc": cardObj.desc,
          "_id": cardObj._id
        });
      }
      showObj = {
        "pageNum": pageNum,
        "pageSize": pageSize,
        "totalPage": totalPage,
        "cardList": cardList
      };
      res.json({"cards": showObj});
    }
  });
}
/**************************三国杀前端json end*****************************/

module.exports = tkdCtrol