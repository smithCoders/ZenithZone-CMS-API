const  dotenv=require("dotenv");
const mongoose=require("mongoose");
// /congif.env
dotenv.config({path:"./src/config/.env"});
// handle uncaught exception
process.on('uncaughtException',err=>{
    console.log(err.name,err.message);
    console.log('UNCAUGHT EXCEPTION! Shutting down...');
    process.exit(1);
}
);
const app=require("./app");

// connect  to database
mongoose.connect(process.env.MONGO_URL).then(con=>{
    console.log("DB connection successful");
}
).catch(err=>{
    console.log(err);
}
);

const port=process.env.PORT||5000;
app.listen(port,()=>{
    console.log("App runnnig on port "+port);
})
// handle unhandled rejection
process.on('unhandledRejection',err=>{
    console.log(err.name,err.message);
    console.log('UNHANDLED REJECTION! Shutting down...');
    server.close(()=>{
        process.exit(1);
    }
    );
}
);



