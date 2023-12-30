import express from "express"
const express=require("express"); 
export const app = express(); 

// for google stocks
// user , balances and order interface 
interface Balances {
    [key : string] : number; 
}

interface User {
    id : String , 
    balances : Balances; 
}

interface Order {
    userId : String , 
    price : number , 
    quantiy : number ; 
}

export const TICKER = "GOOGLE"; 

// dummy data for user
const users : User[] = [{
    id : "1" , 
    balances : {
        "Google" : 10 , 
        "USD": 50000 
    }
}, 
{
    id : "2" , 
    balances : {
        "Google" : 10 ,  
        "USD" : 50000
    }
}]

// bids and ask array 
const bids : Order[] = []; 
const asks : Order[] = [];

// http for a limit order 
app.post('/order' , (req: any  , res : any) =>{
    const side : String = req.body.side; 
    const price : number  = req.body.price; 
    const quantiy : number = req.body.quantiy ; 
    const userId : String =  req.body.userId ; 
    
    // check for the remquantiy after placing the limit order 
    const remainingQty = filledOrders(side , price , quantiy , userId); 

    if(remainingQty == 0){
        res.json({filledQuantiy : quantiy}); 
        return; 
    }
    // if remaining 
    if(side == "bid"){
        bids.push({
            userId, 
            price , 
            quantiy : remainingQty
        }); 
        bids.sort((a ,b) => a.price < b.price ? 1 : -1); 
    }
    else{
       asks.push({
        userId , 
        price, 
        quantiy : remainingQty
       }); 
       asks.sort((a,b) => a.price < b.price ? -1 : 1);    
    }
    // update the remaining stock quantiy
    res.json({quantiy : quantiy - remainingQty
    })
})


// http for depth
app.get('/depth' , (req:any  , res:any)=>{
    const depth : {
        [price : string] : {
            type : "bid"|"ask", 
            quantiy : number, 
        }
    }= {}; 

    for(let i =0 ; i<bids.length ; i++){
        if(!depth[bids[i].price]){
            // if the bid is not present then first set the bid 
            depth[bids[i].price] = {
                type : "bid", 
                quantiy : bids[i].quantiy 
            }
         }
         else{
            depth[bids[i].price].quantiy+=bids[i].quantiy; 
         }
    }

    for(let i = 0 ; i<asks.length ; i++){
        // if there is nothing that is present at this price then we intilased it first 
        if(!depth[asks[i].price]){
            depth[asks[i].price] = {
                type : "ask", 
                quantiy : bids[i].quantiy
            }
        }
        else{
            depth[asks[i].price].quantiy+=bids[i].quantiy; 
        }
    }
    res.json({
        depth
    })
})

// https for balances 

app.get('/balances/:userId' , (res : any , req:any)=>{
    const userId = req.params.userId; 
    // if the user if valid 
    const  user =  users.find(x => x.id === user.id); 
    if(!user){
        // not valid 
        return res.json({
            USD : 0 , 
            [TICKER] : 0 
        })
    }
        res.json({balances : user.balances}); 
} )

function flipBalances(userId1 : String , userId2: String , quantiy , price){
    // check if the user is prenset 
    let user1 = users.find(x => x.id === userId1); 
    let user2 = users.find(x => x.id === userId2);      
    if(!user1 || !user2){
        return; 
    }
    user1.balances[TICKER]-=quantiy; 
    user2.balances[TICKER]+=quantiy; 
    user1.balances['USD']+=(quantiy*price); 
    user2.balances['USD']-=(quantiy*price); 
}

// logic for filledOrders 
function filledOrders(side : String , price : number , quantiy : number , userId : String){
    let remainingQuantiy = quantiy; 
   if(side == 'bid'){
      // iterating from the last in the ask for the bid 
     for(let i=asks.length-1 ; i>=0 ; i--){
        if(asks[i].price > price){
            continue; 
        }
        // if bidder can purchase 
        if(asks[i].quantiy > remainingQuantiy){
            asks[i].quantiy-=remainingQuantiy; 
            flipBalances(asks[i].userId , userId , asks[i].quantiy , asks[i].price); 
            return 0; 
        }
        else{
            remainingQuantiy-=asks[i].quantiy; 
            flipBalances(asks[i].userId , userId , asks[i].quantiy , asks[i].price); 
            asks.pop(); 
        }
        
     }
   }

   else{
    for(let i=asks.length-1 ; i>=0 ; i--){
        if(asks[i].price > price){
            continue; 
        }
        if(bids[i].quantiy > remainingQuantiy){
            asks[i].quantiy-=remainingQuantiy; 
            flipBalances(bids[i].userId , userId , bids[i].quantiy , bids[i].price); 
            return 0; 
        }
        else{
            remainingQuantiy-=bids[i].quantiy; 
            flipBalances(bids[i].userId , userId , bids[i].quantiy , bids[i].price);   
            bids.pop(); 
        }
     }
   }

   return remainingQuantiy; 
}









