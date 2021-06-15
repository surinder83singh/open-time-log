const fs = require("fs");
const uiohook = require("@matoo/uiohook");
const logInput = document.querySelector(".log-input")
const startBtn = document.querySelector(".start-btn")
const stopBtn = document.querySelector(".stop-btn")

console.log("fsfs", fs)
const logEvent = (name, evt)=>{
    logInput.innerHTML = logInput.innerHTML.split("\n").slice(-9).join("\n")+name+": "+JSON.stringify(evt)+"\n";
}

uiohook.on("mouse-event", (evt)=>{
    logEvent("mouse-event", evt)
})

uiohook.on("keyboard-event", (evt)=>{
    logEvent("mouse-event", evt)
})
/*
setTimeout(()=>{
    console.log("uiohook:starting....." )
    uiohook.start(true);
}, 10000)
*/

startBtn.addEventListener("click", ()=>{
    console.log("uiohook:starting....." )
    uiohook.start(true);
})

stopBtn.addEventListener("click", ()=>{
    console.log("uiohook:stoping....." )
    uiohook.stop(true);
})
