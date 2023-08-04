var jsforce=require('jsforce');
var mysql = require('mysql2');
const express = require('express')
const app = express();
var server = app.listen(60194,function()
    {
    var port=server.address().port;
    console.log("Listening on "+port);
    sfreplication();
    });


let conn=new jsforce.Connection({loginUrl : 'https://deloittecom-4f7-dev-ed.my.salesforce.com'}); //salesforce connection
var dbcon = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "sfreppoc"
  }); //database connection

async function sfreplication()
{
try
    {
        await conn.login('username','password');
        console.log("connected to salesforce");
        conn.streaming.topic('/data/ChangeEvents').subscribe(function(message){
        console.log('Streaming Salesforce Data');
        console.log(JSON.stringify(message));
        var response=message.payload.ChangeEventHeader.changedFields;
        if(message.payload.ChangeEventHeader.changeType=='UPDATE')
            {
                var query = message.payload.ChangeEventHeader.changeType + ' ACCOUNT SET ';
                for (var i=0; i< response.length;i++)
                        if(i == (response.length-1))
                            {
                                query = query + response[i] + '=' + '"' + message.payload[response[i]] + '"'
                            }
                        else
                        {
                            query = query + response[i] + '=' + '"' + message.payload[response[i]] + '"'+ ','
                        }
            query = query + ' WHERE Id = ' + '"'  + message.payload.ChangeEventHeader.recordIds[0] + '"' ;
            console.log(query);
            dbcon.query(query,function (err, result) {
                if (err) throw err;
                console.log(result);
                });
        }
        else
        {
            console.log('Perform Insert operation');

            let input= {
                name : message.payload.Name,
                Id : message.payload.ChangeEventHeader.recordIds[0],
                LastModifiedDate: message.payload.LastModifiedDate
            }

            dbcon.query('INSERT INTO ACCOUNT SET ?', input,function (err, result) {
              if (err) throw err;
              console.log(result);
            });
        }
    });  
      
    }

catch(err)
    {
        console.error("Error" + err);
    }
}



