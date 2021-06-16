
const openWindow = (url, opt={}, args={}, win=null)=>{
    if(win && opt.x===undefined && opt.y===undefined){
        opt.x = win.x + 40;
        opt.y = win.y + 40;
    }
    console.log("opt", opt)
    nw.Window.open(url, opt, (win)=>{
        win.window.openWindow = (url, opt, args)=>openWindow(url, opt, args, win);
        win.window.setArgs?.(args);
        win.window.__args__ = args||{};
        if(opt.x!==undefined && opt.y!==undefined){
            win.moveTo(opt.x, opt.y)
        }
        if(opt.width!==undefined){
            win.resizeTo(opt.width, opt.height||null)
        }
    })
}
openWindow('views/main.html', {
    icon: "/resources/images/icon.png",
    width: 350,
    min_width:350,
    max_width:450,
    //frame:false,
    //transparent:true,
    //resizable:false
});