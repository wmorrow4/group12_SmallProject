'use strict';

import util = require('util')
import express = require('express')
import session = require('express-session')
import swaggerTools = require('swagger-tools')
import db = require('../db')
import ApiContact = db.Contact
import ApiObjectID = db.ObjectID
import {
    MongoError,
    DeleteWriteOpResultObject,
    ObjectID as MongoObjectID, 
    InsertOneWriteOpResult} from 'mongodb';

const OK = 200
const BadRequest = 400
const InternalServerError = 500

const inspect = (input: any) => util.inspect(input, false, Infinity, true)

// Make sure this matches the Swagger.json body parameter for the /signup API
interface CreateContactPayload {
    contact: swaggerTools.SwaggerRequestParameter<ApiContact>
    [paramName: string]: swaggerTools.SwaggerRequestParameter<ApiContact> | undefined;
}

interface DeleteContactPayload {
    contact: swaggerTools.SwaggerRequestParameter<ApiObjectID>
    [paramName: string]: swaggerTools.SwaggerRequestParameter<ApiObjectID> | undefined;
}


module.exports.createContact = function(req:express.Request & swaggerTools.Swagger20Request<CreateContactPayload>, res:express.Response) {

    // print out the params
    console.log(util.inspect(req.swagger.params, false, Infinity, true))
    res.setHeader('Content-Type', 'application/json')
    
        
    if(req.swagger.params.contact.value.firstname && req.session) {

        var myobj = req.swagger.params.contact.value;
        
        if (req.session) {
            myobj.belongsTo = req.session.userid;
        }

        db.contacts.insertOne(myobj, function(err:MongoError, result:InsertOneWriteOpResult) {
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
	
	if(req.session){
		
		// myobj is the contact that will be updated.
		// MAIN ISSUE. Can't figure out what the correct findOne parameters are.
		// Even an empty input isn't accepted.
		var myobj = db.contacts.findOne({$and: [
			{firstname: {$eq: req.swagger.params.contact.value.firstname}},
			{lastname: {$eq: req.swagger.params.contact.value.lastname}},
		    {email: {$eq: req.swagger.params.contact.value.email}},
		    {phone: {$eq: req.swagger.params.contact.value.phone}}]});
		
		// updateobj will store the new fields the user entered and then will
		// be pushed to the contacts database.
		var updateobj = myobj;
	
		// Check if a field has been filled.
		var fieldFilled = false;

		// print out the params
		console.log(util.inspect(req.swagger.params, false, Infinity, true));
		res.setHeader('Content-Type', 'application/json');

		// Check all fields for input and update the updateobject file.
		if(req.swagger.params.contact.value.firstname && req.session) {
			updateobj.firstname = req.swagger.params.contact.value.firstname;
			fieldFilled = true;
		}

		if(req.swagger.params.contact.value.lastname && req.session) {
			updateobj.lastname = req.swagger.params.contact.value.lastname;
			fieldFilled = true;
		}

		if(req.swagger.params.contact.value.phonenumber && req.session) {
			updateobj.phonenumber = req.swagger.params.contact.value.phonenumber;
			fieldFilled = true;
		}

		if(req.swagger.params.contact.value.email && req.session) {
			updateobj.email = req.swagger.params.contact.value.email;
			fieldFilled = true;
		} 

		// If no field was filled, print an error.
		if(!fieldFilled){
			res.status(BadRequest)
			res.send(JSON.stringify({ message: "At least one field must be filled to update." }, null, 2))
			res.end()
		}

		// Update the contact.
		try{
			db.contacts.updateOne( 
			{ myobj },
			{ $rename: {firstname:updateobj.firstname, lastname:updateobj.lastname, phone:updateobj.phone, email:updateobj.email }},
			{ upsert: false }
			);
		} catch(err)
		{
			if (err){
				res.status(InternalServerError)
				res.send(JSON.stringify({ message: inspect(err) }, null, 2))
				res.end()
			} else{
				res.status(OK)
				res.send(JSON.stringify({ message: "Contact updated successfully." }, null, 2))
				res.end()
				console.log("Contact updated."); 
			}
		}
	}
};

module.exports.deleteContact = function(req:express.Request & swaggerTools.Swagger20Request<DeleteContactPayload>, res:express.Response) {
    
    // print out the params 
    console.log(util.inspect(req.swagger.params, false, Infinity, true))
    res.setHeader('Content-Type', 'application/json')

    var myobj = req.swagger.params.contact.value;
        
    // Check that we're logged in
    if (!req.session || !req.session.username) {
        // no session or yes session and no username
        res.status(BadRequest)
        res.send(JSON.stringify({ message: "You are not currently logged in, login in order to add contacts" }, null, 2))
        res.end()
    }

    // Check that the contact exists and actually belongs to this user.
    db.contacts.findOne( {_id: new MongoObjectID(myobj._id)} , function(err:MongoError, result:ApiContact | null)
     {
        // TODO: check to see if result is a thing.
        if(err)
        {
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
        // TODO: check to see if Contact belongs to this user.
        if (req.session) {
            if(result.belongsTo != req.session.userid)
            {
                res.status(BadRequest)
                res.send(JSON.stringify({ message: "This contact doesnt belong to the current user" }, null, 2))
                res.end()
            }
            else
            {
                db.contacts.deleteOne( {_id: new MongoObjectID(myobj._id)} , function(err:MongoError, result:DeleteWriteOpResultObject) {
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
                })
            }
        }

    }
    })
}