'use strict';
const 
    config = require('config'),
    express = require('express'),
    request = require('request');

var app = express();
var port = process.env.PORT || process.env.port || 5000;
app.set('port',port);

app.use(express.json());
app.listen(app.get('port'), function(){
    console.log('[app.listen]Node app is running on port', app.get('port'));
});

module.exports = app;

const MOVIE_API_KEY = config.get('MovieDB_API_Key');

app.post('/webhook',function(req, res){
    //1.DialogFlow會來呼叫這一支程式
    //2.DialogFlow要給我需要查詢的電影名稱
    let data = req.body;
    let queryMovieName = data.queryResult.parameters.MovieName;
    let propertiesObject = {
        query:queryMovieName,
        api_key:MOVIE_API_KEY,
        language:'zh-TW'
    };
    //3.要去TMDB拿到對應的資料
    request({
        uri:"https://api.themoviedb.org/3/search/movie?",
        json:true,
        qs:propertiesObject
    },function(error,response, body){
        //確認有成功去到TMDB拿資料
        if (!error && response.statusCode == 200) {
          //確認裡面有資料
          if (body.results.length != 0) {
            // 確認第一筆資料裡面
            let thisFulfillmentMessages = []; // 回傳所有訊息

            // 1. 電影名稱是否與查詢完全相符
            let movieTitleObject = {};
            if (body.results[0].title == queryMovieName) {
              movieTitleObject.text = {text:[body.results[0].title]};
            } else {
              movieTitleObject.text = {text:["系統內最相關的電影是" + body.results[0].title]};
            }
            thisFulfillmentMessages.push(movieTitleObject);

            //2. 有沒有電影簡介
            if (body.results[0].overview) {
              let movieOverViewObject = {};
              movieOverViewObject.text = {text:[body.results[0].overview]};
              thisFulfillmentMessages.push(movieOverViewObject);
            }

            //3. 有沒有電影海寶
            if (body.results[0].poster_path) {
              let movieImageObject = {};
              movieImageObject.image = {imageUri:"https://image.tmdb.org/t/p/w185"+body.results[0].poster_path};
              thisFulfillmentMessages.push(movieImageObject);
            }

            // 所有東西傳回去
            res.json({fulfillmentMessages:thisFulfillmentMessages});
          } else {
            res.json({fulfillmentText:"很抱歉，系統內沒有這部電影"});
          }
        } else {
          console.log('[TMDB] Failed');
        }
        
        //確認第一筆資料裡面有沒有電影名稱/電影簡介/電影海報
    });

    //4.把電影資料送回去DialogFlow
});