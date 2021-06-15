const uiohook = require("@matoo/uiohook");
const fs = require("fs");
const os = require("os");
const path = require("path");
const utils = require("@aspectron/flow-utils");
const crypto = require("crypto");
const HOME = path.join(os.homedir(), '.open-time-log');
if(!fs.existsSync(HOME))
	fs.mkdirSync(HOME);
const ROOT = process.cwd();//path.join(__dirname, "../../")
console.log("HOME", HOME)
console.log("ROOT", ROOT)
const RESET_CONFIG = false;

import {html, css, BaseElement, FlowDialog} from "../../node_modules/@aspectron/flow-ux/flow-ux.js";


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
				diplay:block;
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
		<textarea class="log-input"></textarea>
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
		uiohook.on("mouse-event", (evt)=>{
			this.logEvent("mouse-event", evt)
		})
		
		uiohook.on("keyboard-event", (evt)=>{
			this.logEvent("mouse-event", evt)
		})
		this.team = "default";
		this.activity = "default";
		this.createDefaultConfig();
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
		this.logInput.innerHTML = this.logInput.innerHTML
		.split("\n")
		.slice(-9)
		.join("\n")+name+": "+JSON.stringify(evt)+"\n";
	}

	setTeam(team){
		if(this.team == team)
			return
		this.team = team;
		this.config.selectedTeam = team;
		this.setActivity("default");
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
		this.log("uiohook:starting.....", this.msgInput.value)
		uiohook.start(true);
		this.started = true;
	}

	onStopClick(){
		this.log("uiohook:stoping....." )
		uiohook.stop(true);
		this.started = false;
	}
}

TimeLog.define("time-log");
