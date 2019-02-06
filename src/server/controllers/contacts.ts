'use strict';

import util = require('util')
import session = require('express-session')
import swaggerTools = require('swagger-tools')
import db = require('../db')
import Contact = db.Contact

const OK = 200
const BadRequest = 400
const InternalServerError = 500

const inspect = (input: any) => util.inspect(input, false, Infinity, true)

// Make sure this matches the Swagger.json body parameter for the /signup API
interface CreateContactPayload {
    contact: swaggerTools.SwaggerRequestParameter<Contact>
    [paramName: string]: swaggerTools.SwaggerRequestParameter<Contact> | undefined;
}

module.exports.createContact = function(req:Express.Request & swaggerTools.Swagger20Request<CreateContactPayload>, res:any, next:any) {

    // print out the params
    console.log(util.inspect(req.swagger.params, false, Infinity, true))
    res.setHeader('Content-Type', 'application/json')
    
    
        
    if(req.swagger.params.contact.value.firstname && req.session) {

        var myobj = req.swagger.params.contact.value;
        
        if (req.session) {
            myobj.belongsTo = req.session.username;
        }

        //myobj.UserID = req.session.username;

        db.contacts.insertOne( myobj , function(err:any, result:any) {
            if (err){
                res.status(InternalServerError)
                res.send(JSON.stringify({ message: inspect(err) }, null, 2))
                res.end()
            }
            if(!result){
                res.status(BadRequest)
                res.send(JSON.stringify({ message: "Create Contact Failed" }, null, 2))
                res.end()
            }
            else{
                res.status(OK)
                res.send(JSON.stringify({ message: "Contact Inserted Successfully " }, null, 2))
                res.end()
                console.log("1 document inserted"); 
            }                     
      });  
            
    }
    else {
        res.status(BadRequest)
        res.send(JSON.stringify({ message: "At least a first name is required" }, null, 2))
        res.end()
    }
    
    
};

module.exports.listContacts = function(req:any, res:any, next:any) {

    // print out the params
    console.log(util.inspect(req.swagger.params, false, Infinity, true))

    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.send(JSON.stringify({message: "It worked!"}, null, 2))
    res.end()
};

module.exports.updateContact = function(req:any, res:any, next:any) {

    // print out the params
    console.log(util.inspect(req.swagger.params, false, Infinity, true))

    res.setHeader('Content-Type', 'application/json')
    res.status(200)
    res.send(JSON.stringify({message: "It worked!"}, null, 2))
    res.end()
};

module.exports.deleteContact = function(req:any, res:any, next:any) {
    
    // print out the params 
    console.log(util.inspect(req.swagger.params, false, Infinity, true))
    res.setHeader('Content-Type', 'application/json')

    var myobj = req.swagger.params.contact.value;
        
    if (req.session) {
        myobj.belongsTo = req.session.username;
    }
    
    db.contacts.findOne(myobj, function(err:any,result:any) {
        if (err){
            res.status(InternalServerError)
            res.send(JSON.stringify({ message: inspect(err) }, null, 2))
            res.end()
        }            
        if(!result){
            res.status(BadRequest)
            res.send(JSON.stringify({ message: "Contact Doesnt Exist" }, null, 2))
            res.end()
        }
        else{
            db.contacts.deleteOne( myobj , function(err:any, result:any) {
                if (err){
                    res.status(InternalServerError)
                    res.send(JSON.stringify({ message: inspect(err) }, null, 2))
                    res.end()
                }
                if(!result){
                    res.status(BadRequest)
                    res.send(JSON.stringify({ message: "Delete Function Failed" }, null, 2))
                    res.end()
                }
                else{
                    res.status(OK)
                    res.send(JSON.stringify({ message: "Contact Deleted Successfully " }, null, 2))
                    res.end()
                    console.log("1 document deleted"); 
                }                                      
            });     
        }
            
    });
    

   
    
};


