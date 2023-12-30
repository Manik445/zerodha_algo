import {app , TICKER} from "./index"
import request from "supertest"
import expect from "supertest"

describe("Basic Tests" , async() => {
    it("Verify Intail Balnaces" , async() =>{
    let res = await request(app).get("/balance:/1").send();
    expect(res.json.Balances[TICKER]).toBe(10); 
     res = await request(app).get('/balance:/2').send(); 
    expect(res.json.balances[TICKER]).toBe(10); 
    
})
 
    it("Can Create Tests" , async()=>{
        await request(app).post("/order").send({
            type : "limit", 
            side : "bid", 
            price : 1400.1, 
            quantity : 1 , 
            userId : "1"
        })
        await request(app).post('/order').send({
            type:"limit",
            side : "ask", 
            price : 1400.9, 
            quantity : 10 , 
            userId: "2"
        })
        await request(app).post('/order').send({
            type:"limit", 
            side : "ask", 
            price : 1501.0,   
            qunatity : 5 , 
            userId : "2"
        })
    })

    let res = await request(app).get('/depth').send(); 
    expect(res.status).toBe(200); 
    expect(res.body.balances["1501"].qunatity).toBe(5); 

    // ensuring the balaces are the same before the trade off
    it("ensure the balances are the same" ,async()=>{
    let res = await request(app).get('/balance/1').send(); 
    expect(res.body.balances['TICKER'].qunatity).toBe(10); 
    })

    it("places an order to be filled" , async()=>{
        let res = await request(app).post('/order').send({
            type:"limit", 
            side : "bid",
            price : 1502 , 
            quantity : 3 , 
            userId : "1"
        }); 
        expect(res.body.filledQuantiy).toBe(2); 
    })

    it("Ensure the Balnaces update" , async()=>{
        let res = await request(app).get('./depth').send(); 
        expect(res.body.depth[1501].quantity).toBe(3); 
    })
    
    it("Ensure Balances Update" , async()=>{
        let res = await request(app).get('/balance/1').send(); 
        expect(res.body.balaces[TICKER].qunatity).toBe(12);
        expect(res.body.balaces["USD"]).tobe(50000 - 2*1502);  

        res = await request(app).get('/balance/2').send(); 
        expect(res.body.balaces[TICKER].quantity).tobe(8); 
        expect(res.body.balaces["USD"]).tobe(5000 + 2*1502); 
    })


})   