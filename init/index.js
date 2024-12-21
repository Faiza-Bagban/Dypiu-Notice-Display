const mongoose=require("mongoose");
const initData=require("./data.js")
const Notice=require("../models/notice.js");

main()
.then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
});

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/DYPIU-Notices");
};

const initDB=async()=>{
    await Notice.deleteMany({});
    await Notice.insertMany(initData.data);
    console.log("Data was initiazed.");
};

initDB();