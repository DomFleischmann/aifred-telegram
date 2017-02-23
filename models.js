var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var db = mongoose.connection;
mongoose.connect('mongodb://localhost/test')
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', function(){
    console.log("Data Base connected"); 
    var savedLinkSchema = mongoose.Schema({
        url: String,
        date: Date,
        description : String
    });

    var savedLink = mongoose.model('savedLink', savedLinkSchema);

    var agendaEntrySchema = mongoose.Schema({
        date: {
            day: Number,
            month: Number,
            year: Number,
            hour: Number,
            minute: Number
        },
        description: String,
        sent: Boolean
    });

    agendaEntrySchema.methods.message = function(){
        var message = "Today ";
        message += this.date.day + "/" + this.date.month + "/" + this.date.year;
        message += " at ";
        message += this.date.hour + ":" + this.date.minute;
        message += " you have: ";
        message += this.description;
        return message;
    }

    var agendaEntry =  mongoose.model('AgendaEntry', agendaEntrySchema);
    module.exports.agendaEntry = agendaEntry;
    module.exports.savedLink = savedLink;

});



