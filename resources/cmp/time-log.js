const uiohook = require("@matoo/uiohook");
const fs = require("fs");
const os = require("os");
const path = require("path");
const utils = require("@aspectron/flow-utils");
const crypto = require("crypto");
const screenshot = require('screenshot-desktop')
const HOME = path.join(os.homedir(), '.open-time-log');
if(!fs.existsSync(HOME))
	fs.mkdirSync(HOME);
const ROOT = process.cwd();//path.join(__dirname, "../../")
console.log("HOME", HOME)
console.log("ROOT", ROOT)
const RESET_CONFIG = false;
const LOG_INTERVAL = 60 //in seconds;

const throttle = (callback, limit)=>{
    var wait = false;                  // Initially, we're not waiting
    return function (...args) {        // We return a throttled function
        if (!wait) {                   // If we're not waiting
            callback(...args);         // Execute users function
            wait = true;               // Prevent future invocations
            setTimeout(function () {   // After a period of time
                wait = false;          // And allow future invocations
            }, limit);
        }
    }
}

import {
	html, css, BaseElement, FlowDialog, getRandomInt
} from "../../node_modules/@aspectron/flow-ux/flow-ux.js";


class TimeLog extends BaseElement{
	static get properties(){
		return {
			debug:{type:Boolean, reflect:true},
			team:{type:String, value:"default"},
			activity:{type:String, value:"default"},
			started:{type:Boolean}
		}
	}
	static get styles(){
		return css`
			:host{
				display:flex;flex-direction:column;
				align-items: center;
				--flow-dropdown-trigger-width:300px;
				--flow-input-input-width:300px;
			}
			.h-box{display:flex;flex-direction:row;align-items:center;}
			.h-box>*:not(flow-select){margin-top:2px;margin-right:5px;margin-left:5px;}
			.log-input{
				width:90%;margin:auto;
				min-height:200px;
				display:none;
			}
			:host([debug]) .log-input{
				display:block;
			}
			.btns{width:100%;max-width:200px;}
			.btn.block:not([hidden]){display: block;}
			.btn{margin: 10px 0px;}
			flow-btn.mini{padding:0px;font-size:0.7rem}
			.text-capitalize{text-transform: capitalize;}
			.m-b-30{margin-bottom:30px;}
		`
	}
	render(){
		const {team, started} = this;
		return html`
		<div class="h-box">
			<flow-select class="text-capitalize" label="Team" selected="${this.team}"
				@select="${this.onTeamSelect}">
				${this.renderTeams()}
			</flow-select>
		</div>
		<div class="h-box m-b-30">
			<flow-btn class="add-team-btn mini"
			@click="${this.onAddTeamClick}">Create new team</flow-btn>
			${(team && team!='default')?html`<flow-btn class="remove-team-btn mini"
			@click="${this.onDeleteTeamClick}">Delete team</flow-btn>`:''}
		</div>
		${this.renderActivity()}
		<div class="m-b-30">
			<flow-input label="Message" class="msg-input"></flow-input>
		</div>
		<div class="btns">
			${started?
				html`<flow-btn class="btn block stop-btn warning" @click="${this.onStopClick}">Stop</flow-btn>`:
				html`<flow-btn class="btn block start-btn primary" @click="${this.onStartClick}">Start</flow-btn>`
			}
		</div>
		<textarea class="log-input" readonly></textarea>
		`
	}

	renderTeams(){
		let teams = this.getConfig().teams;
		return teams.map(item=>{
			return html`<flow-menu-item value="${item.uid}">${item.name}</flow-menu-item>`
		})
	}
	

	renderActivity(){
		const {team, activity} = this;
		if(!team)
			return '';
		return html`
		<div class="h-box">
			<flow-select class="text-capitalize" label="Activity"
				selected="${activity}"
				@select="${this.onActivitySelect}">
				${this.renderActivities()}
			</flow-select>
		</div>
		<div class="h-box m-b-30">
			<flow-btn class="add-activity-btn mini"
			@click="${this.onAddActivityClick}">Create new activity</flow-btn>
			${(activity && activity!='default')?html`<flow-btn class="remove-activity-btn mini"
			@click="${this.onDeleteActivityClick}">Delete activity</flow-btn>`:''}
		</div>`
	}

	renderActivities(){
		let activities = this.getConfig().activities||[];
		return activities.filter(o=>o.team==this.team).map(item=>{
			return html`<flow-menu-item value="${item.uid}">${item.name}</flow-menu-item>`
		})
	}

	constructor(){
		super();
		this._logs = [];
		this.debug = localStorage.debugLog ==1;
		this.updateUserActivityThrottled = throttle(this.updateUserActivity.bind(this), 500);
		uiohook.on("mouse-event", (evt)=>{
			if(evt.type != "mouseclick")
				return
			this.logEvent("mouse-event", evt)
			this.updateUserActivityThrottled(evt, true);
		})
		
		uiohook.on("keyboard-event", (evt)=>{
			if(evt.type != "keyup")
				return
			this.logEvent("keyboard-event", evt)
			this.updateUserActivityThrottled(evt);
		})
		this.team = "default";
		this.activity = "default";
		this.createDefaultConfig();
	}
	updateUserActivity(evt, isMouse=false){
		console.log("evt.type", evt.type, isMouse)
		if(!this.data)
			return
		if(isMouse)
			this.data.m++;
		else
			this.data.k++;
	}
	captureScreenshot(){
		/*
		screenshot.listDisplays()
		.then((displays) => {
			console.log('displays:', displays)
			for (let index = 0; index < displays.length; index++) {
				const display = displays[index]
				const imgpath = path.join(IMG_PATH, Date.now() + '_' + index + '.png')
				screenshot({ screen: display.id, filename: imgpath }).then((imgpath) => {
					console.log(imgpath)
				}).catch(err => {
					console.error(err)
				})
			}
		})
		*/
		return new Promise((resolve)=>{
			screenshot().then((img) => {
				// img: Buffer filled with jpg goodness
				this.log("img", img)
				const {activity} = this;
				const ts = Date.now();
				const uid = activity+'_'+ts;
				fs.writeFileSync(path.join(HOME, this.team, 'img', uid+'.jpg'), img)
				resolve({activity, ts});
			}).catch((err) => {
				this.log("screenshot:error", err)
			})
		})
	}
	getConfigPath(){
		return path.join(HOME, 'config.json');
	}
	getConfig(){
		return this.config||{}
	}
	getDefaultConfig(){
		return utils.getConfig(path.join(ROOT, "resources", "config.conf"));
	}
	createDefaultConfig(){
		const filePath = this.getConfigPath();
		if(RESET_CONFIG || !fs.existsSync(filePath)){
			let config = this.getDefaultConfig()
			this.log("DefaultConfig", config)
			this.saveConfig(config)
		}else{
			this.config = utils.readJSON(this.getConfigPath()) || {teams:[]}
			let {selectedTeam="default", selectedActivity="default"} = this.config;
			this.team = selectedTeam;
			this.activity = selectedActivity;
		}
		this.ensureDirs();
	}
	ensureDirs(){
		[
			path.join(HOME, this.team),
			path.join(HOME, this.team, 'img')
		].forEach(p=>{
			if(!fs.existsSync(p))
				fs.mkdirSync(p)
		})
	}
	saveConfig(config=false){
		const filePath = this.getConfigPath();
		this.config = config||this.config;
		fs.writeFileSync(filePath, JSON.stringify(this.config, null, "\t"))
	}
	firstUpdated(){
		super.firstUpdated();
		this.logInput = this.renderRoot.querySelector(".log-input")
		this.msgInput = this.renderRoot.querySelector(".msg-input")
	}
	logEvent(name, evt){
		if(!this.logInput)
			return
		this._logs.push(name+": "+JSON.stringify(evt))
		this._logs.splice(0, this._logs.length - 10);
		this.logInput.innerHTML = this._logs.join("\n");
	}

	setTeam(team){
		if(this.team == team)
			return
		this.team = team;
		this.config.selectedTeam = team;
		this.setActivity("default");
		this.ensureDirs();
	}

	setActivity(activity){
		this.activity = activity;
		this.config.selectedActivity = activity;
		this.saveConfig();
	}

	findTeam(uid){
		return (this.config?.teams||[]).find(o=>{
			return o.uid == uid;
		})
	}
	findActitity(uid){
		return (this.config?.activities||[]).find(o=>{
			return o.uid == uid && o.team == this.team;
		})
	}

	createTeam(name){
		name = name.trim().toLowerCase();
		const uid = this.createHash(name);
		let found = this.findTeam(uid);
		if(found)
			return FlowDialog.alert("Error", `Team (${name}) already exists.`)
		
		this.config.teams.push({uid, name});
		this.config.activities.push({uid:"default", name:"Default", team:uid});
		this.saveConfig();
		//this.requestUpdate("config")
		this.team = uid;
		this.ensureDirs();
	}
	createActivity(name){
		name = name.trim().toLowerCase();
		const uid = this.createHash(name);
		let found = this.findActitity(uid);
		if(found)
			return FlowDialog.alert("Error", `Activity (${name}) already exists.`)
		
		this.config.activities.push({uid, name, team:this.team});
		this.saveConfig();
		//this.requestUpdate("config")
		this.activity = uid;
	}
	deleteTeam(uid){
		let found = this.findTeam(uid);
		if(!found)
			return FlowDialog.alert("Error", "Team not found.")
		let index = this.config.teams.indexOf(found);
		this.config.teams.splice(index, 1);
		this.config.activities = this.config.activities.filter(o=>o.team!=uid);
		this.saveConfig();
		//this.requestUpdate("config")
		this.setTeam("default");
	}
	deleteActivity(uid){
		let found = this.findActitity(uid);
		if(!found)
			return FlowDialog.alert("Error", "Activity not found.")
		let index = this.config.activities.indexOf(found);
		this.config.activities.splice(index, 1);
		this.saveConfig();
		//this.requestUpdate("config")
		this.setActivity("default");
	}
	createHash(text){
		return crypto.createHash('md5').update(text).digest('hex');
	}

	onAddTeamClick(){
		this.addEntity("team");
	}
	onAddActivityClick(){
		this.addEntity("activity");
	}
	onDeleteTeamClick(){
		this.removeEntity("team");
	}
	onDeleteActivityClick(){
		this.removeEntity("activity");
	}
	addEntity(type){
		FlowDialog.show({
			title:`Create new ${type}`,
			body:html`<flow-input name="name"></flow-input>`,
			btns:[{
				text:"Cancel"
			},{
				text:"Create",
				cls:"primary",
				handler:(resolve, {values})=>{
					//console.log("resolve, data", values)
					if(!values.name)
						return
					resolve();
					if(type == "team")
						this.createTeam(values.name)
					else if(type == "activity")
						this.createActivity(values.name)
				}
			}]
		})
	}
	removeEntity(type){
		let entity = type=="team"?this.findTeam(this.team):this.findActitity(this.activity)
		if(!entity)
			return
		FlowDialog.show({
			title:`Delete ${type}`,
			body:`Are you sure to delete "${entity.name}" ?`,
			btns:[{
				text:"Cancel"
			},{
				text:"Delete",
				cls:"danger",
				handler:(resolve)=>{
					resolve();
					if(type == "team")
						this.deleteTeam(entity.uid)
					else if(type == "activity")
						this.deleteActivity(entity.uid)
				}
			}]
		})
	}

	onTeamSelect(e){
		this.setTeam(e.detail.selected);
	}
	onActivitySelect(e){
		this.setActivity(e.detail.selected);
	}

	onStartClick(){
		this.start()
	}
	start(){
		this.ensureDirs();
		this.log("uiohook:starting.....", this.msgInput.value)
		this.data = {
			k:0,//keyboard count
			m:0, //mouse hit count
			g:this.msgInput.value
		}
		uiohook.start(true);
		this.started = true;
		setTimeout(()=>{
			this.pushLog();
			this.startTick();
		}, 2000)
	}
	onStopClick(){
		this.stop()
	}
	stop(){
		this.log("uiohook:stoping....." )
		uiohook.stop(true);
		this.started = false;
		this.clearQueue();
		this.stopTick();
	}

	startTick(){
		this.stopTick();
		this._tickingId = setInterval(()=>{
			this.queuePush();
		}, LOG_INTERVAL * 1000)
	}

	stopTick(){
		if(this._tickingId){
			clearInterval(this._tickingId)
			this._tickingId = null;
		}
	}

	pushLog(){
		if(!this.started)
			return
		this.clearQueue();
		this.captureScreenshot().then(({activity, ts})=>{
			let data = {... (this.data||{k:0,m:0})};
			this.data = {k:0,m:0}
			data.t = ts;
			this._pushLog(activity, data);
		});
	}
	_pushLog(activity, data){
		let file = path.join(HOME, this.team, activity+'-logs.json');
		console.log("_pushLog:file", file)
		fs.appendFileSync(file, JSON.stringify(data)+",\n");
	}
	queuePush(){
		let delay = getRandomInt(5000, (LOG_INTERVAL - 5) * 1000)
		console.log('delay', delay)
		this._queueId = setTimeout(()=>{
			this.pushLog();
		}, delay)
	}
	clearQueue(){
		if(this._queueId){
			clearTimeout(this._queueId)
			this._queueId = null;
		}
	}
}

TimeLog.define("time-log");
