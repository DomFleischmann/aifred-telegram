var TelegramBot = require('node-telegram-bot-api');

var token = '299421213:AAEyncc7KEvPuyt3oZ5DM5e2il8N5KjSlR0';

var bot = new TelegramBot(token, {polling: true});
var Models = require("./models")

//-----BASIC BOT STUFF------
bot.getMe().then(function(me){ // so i know the bot is connected in console.
    console.log('Hi my name is %s!',me.username);
});

bot.onText(/\/start/, function(msg, match) { // at the absolute start of aifred
    var fromId = msg.from.id;
    var message = "Iou what up i'm AIfred! ";
    message += "I'm going to be your assistant!";
    bot.sendMessage(fromId,message);
});

//--- LINK FUNCTIONALITY-----
bot.onText(/\/save_link (.+)/, function(msg, match){
    var splitedM = match[1].split(' ');
    var url = splitedM.shift();
    var description = splitedM.join(' ');
    var now = new Date();
    var newLink = new Models.savedLink({date:now,description:description,url:url});

    newLink.save(function(err,saved) {
        if(err) return console.error(err);
        console.dir(saved);
    });


});

bot.onText(/\/get_links/, function(msg, match){
    var fromId = msg.from.id;
    var message = "";
    Models.savedLink.find(function (err, entries) {
        if (err) return console.error(err);
        entries.forEach(function(v, i){
            message += (i+1) + "->  " + v.url +   "\n" + v.description + "\n\n";});
        bot.sendMessage(fromId,message);
    })
});

bot.onText(/\/delete_link (.+)/, function(msg, match){
    var fromId = msg.from.id;
    var num = match[1].split(' ').shift();
    Models.savedLink.find(function(err, entries) {
        if(err) return console.error(err);
        if(entries.length <= num && !isNaN(num)){
            var deleted_url = entries[num-1].url;
            Models.savedLink.find({url: deleted_url}).remove().exec();
            bot.sendMessage(fromId, "Link deleted")
        }
    })
});


//------AGENDA FUNCTIONALITY-----
bot.onText(/\/new_entry (.+)/, function(msg, match){
    var fromId = msg.from.id;
    var now = new Date();
    var rest = match[1].split(' ');
    var time = rest.shift().split(':');
    var description = rest.join();
    if(time.length===2)
        if(!time[0].isNaN && !time[1].isNaN)
            var newEntry = new Models.agendaEntry({date: {day: now.getDate(),
                                                 month: now.getMonth(),
                                                 year: now.getYear(),
                                                 hour: time[0],
                                                 minute: time[1]}, description: description, sent: false});
    
    newEntry.save(function(err, saved) {
        if (err) return console.error(err);
        console.dir(saved);
    });

});

bot.onText(/\/view_entries/, function(msg, match){
    Models.agendaEntry.find(function (err, entries) {
        if (err) return console.error(err);
        console.log(entries);
    })
});

var entriesToday = [];
bot.onText(/\agenda/, function (msg, match){
    var today = new Date();

    Models.agendaEntry.find({'date.day': today.getDate(),'date.month': today.getMonth(),'date.year':today.getYear() }).exec(function(err,entries){
        entriesToday = [];
        entries.forEach(function(v,i){
            entriesToday[i] = v;});
        startAgenda(msg,match);
    });
});

function startAgenda(msg,match){
    entriesToday.forEach(function(v){console.log(v);});
    var agendaTimer = setInterval(function(fromId = msg.from.id){
        var now = new Date();
        entriesToday.forEach(function(v){
            if(now.getMinutes() === v.date.minute - 20 && now.getHours() === v.date.hour){
                var message = v.message();
                bot.sendMessage(msg.from.id,message);
            }
        })
    },59000);
}
//-----WEATHER FUNCTIONALITY-----
//Get's the weather data from openWeatherMap and posts and sends a doctmessage with the info, should be only the most basic the rest of the message should be sent by the caller.

bot.onText(/\weather (.+)/, function (msg, match){ //Should write an interface so that getWeatherData only returns data.
    var formId = msg.from.id;
    var postcode = match[1];
    var data = getweatherdata(postcode,formid);
});


function getWeatherData(postcode,formId){
    var app_key = "8770e6d545242c795337df32361c0e3b"; //unique appkey for the api
    var url = "http://api.openweathermap.org/data/2.5/weather?id=" +postcode;

    url += "&mode=json&units=metric&cnt=14&appid=" + app_key;

    var http = require('http'); // this is needed for all the api calls maybe should define on top of code.

    http.get(url, function(response) {

        var data = '';//used to parse the chunk to a object.

        response.on("data", function(chunk) {
            data += chunk;
                   });

        response.on("end", function(){
            var obj = JSON.parse(data);
            var message = "Weather today in " +obj.name+ "\n";
            message+= obj.weather[0].main + "\n"; //The JSON is parsed so that weather has the real weather object in its first atribute so Dominik decided to be janky asf.
            message+= "temp: "+obj.main.temp +"C";
            bot.sendMessage(formId,message);
        });

    }).on('error', function(error) {
         console.log("Whoopsie daisy: ", error)
    });
}
