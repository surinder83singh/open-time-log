const fs = require("fs");
const os = require("os");
const path = require("path");
const moment = require("moment");
const HOME = path.join(os.homedir(), '.open-time-log');
if(!fs.existsSync(HOME))
	fs.mkdirSync(HOME);
const ROOT = process.cwd();
console.log("HOME", HOME)
console.log("ROOT", ROOT)


import {
	html, css, BaseElement, FlowDialog, getRandomInt
} from "../../node_modules/@aspectron/flow-ux/flow-ux.js";


class LogView extends BaseElement{
	static get properties(){
		return {
			debug:{type:Boolean, reflect:true},
			team:{type:String, value:"default"},
			activity:{type:String, value:"default"},
			items:{type:Array},
			active:{type:Boolean, reflect:true}
		}
	}
	static get styles(){
		return css`
			:host{
				display:flex;flex-direction:column;
				align-items:stretch;overflow:hidden;
				--flow-dropdown-trigger-width:300px;
				--flow-input-input-width:300px;
				padding:10px;
			}
			.h-box{display:flex;flex-direction:row;align-items:center;}
			.h-box>*:not(flow-select){margin-top:2px;margin-right:5px;margin-left:5px;}
			.log-input{
				width:90%;margin:auto;
				min-height:200px;
				display:block;
			}
			.btns{width:100%;max-width:200px;}
			.btn.block:not([hidden]){display: block;}
			.btn{margin: 10px 0px;}
			flow-btn.mini{padding:0px;font-size:0.7rem}
			.text-capitalize{text-transform: capitalize;}
			.m-b-30{margin-bottom:30px;}
			.body{flex:1;overflow:auto;}
			
			.list,.time-box{
				display:flex;flex-direction:row;
				flex-wrap:wrap;align-items:flex-start;align-items:center;
			}
			.time-box{flex-wrap:nowrap;align-items:stretch;margin-bottom:10px;}
			.time-head{
				display:flex;align-content:center;
				align-items:center;justify-content:center;
				padding:10px;text-align:center;
				background: var(--flow-primary-color);
    			color: var(--flow-primary-invert-color);
				border-top-left-radius:5px;
				border-bottom-left-radius:5px;
			}
			.item{
				border:1px solid #DDD;border-radius:5px;
				margin:5px;box-sizing:border-box;
				width:200px;
				box-shadow:0 2px 2px 0 rgb(0 0 0 / 14%),
				0 3px 1px -2px rgb(0 0 0 / 20%),
				0 1px 5px 0 rgb(0 0 0 / 12%);
			}
			.item.msg{
				min-width: 95%;
				/*border-radius: 0px;*/
				border:0px solid var(--flow-primary-color);
				padding:4px 10px;
				margin:5px;
				display:block;
				flex:1;position:sticky;top:0px;
				background:var(--flow-background-color);
				border-top-left-radius:0px;
				border-top-right-radius:0px;
			}
			.item .img{
				background:center no-repeat;
				background-size:contain;
				height:150px;background-color:#EFEFEF;
			}
			.item-head{display:flex;align-items:center}
			.item-time{flex:1;text-align:center;padding:5px 0px}
			.activity-bars{
				margin:0px 5px;
				--bg-color:var(--flow-background-color);
				width:100px;background-color: var(--bg-color);
			}
			.activity-bar{
				width:0%;height:6px;border-bottom:1px solid var(--bg-color);
				background-image: linear-gradient(90deg,
					var(--bg-color) 2px, transparent 2px, transparent 100%);
				background-size: 10px 1rem;
				background-color: var(--flow-primary-color);
			}
			.activity-bar[v="1"]{width:10%}
			.activity-bar[v="2"]{width:20%}
			.activity-bar[v="3"]{width:30%}
			.activity-bar[v="4"]{width:40%}
			.activity-bar[v="5"]{width:50%}
			.activity-bar[v="6"]{width:60%}
			.activity-bar[v="7"]{width:70%}
			.activity-bar[v="8"]{width:80%}
			.activity-bar[v="9"]{width:90%}
			.activity-bar[v="10"]{width:100%}
		`
	}
	render(){
		const {team, activity, items=[]} = this;
		return html`
		<div class="h-box">
			<flow-select class="text-capitalize" label="Team" selected="${team}"
				@select="${this.onTeamSelect}">
				${this.renderTeams()}
			</flow-select>
			<flow-select class="text-capitalize" label="Activity"
				selected="${activity}"
				@select="${this.onActivitySelect}">
				${this.renderActivities()}
			</flow-select>
			<flow-btn class="load-btn primary"
				@click="${this.loadData}">Refresh</flow-btn>
		</div>
		<div class="body">${this.renderItems(items)}</div>
		`
	}

	renderTeams(){
		let teams = this.getConfig().teams||[];
		return teams.map(item=>{
			return html`<flow-menu-item value="${item.uid}">${item.name}</flow-menu-item>`
		})
	}

	renderActivities(){
		let activities = this.getConfig().activities||[];
		return activities.filter(o=>o.team==this.team).map(item=>{
			return html`<flow-menu-item value="${item.uid}">${item.name}</flow-menu-item>`
		})
	}
	renderItems(items){
		let img,uid, msg="",m, dateTime;
		let map = new Map();
		items.forEach(item => {
			m = moment(item.t);
			dateTime = m.format("YYYYMMDD:HH")
			let info = map.get(dateTime)
			if(!info){
				info = {
					list:[], 
					fullTime:m.format("dddd, MMMM Do YYYY, h a"),
					time:m.format("h a").split(" ")
				};
				map.set(dateTime, info)
			}
			item.m = getRandomInt(1, 10);
			item.k = getRandomInt(1, 10);
			item.time = m.format("h:mm a")

			info.list.push(item)
		});

		const buildItems = (items)=>{
			return items
			.map(item=>{
				if(item.g !== undefined)
					msg = item.g.replace('"', '')

				uid = this.activity+"_"+item.t;
				img = 'file://'+path.join(HOME, this.team, 'img', uid+".jpg")
				if(item.g){
					return html
					`<div class="item msg">${item.g}</div>
					<div class="item" title="${msg}">
						<div class="item-head">
							<div class="item-time">${item.time}</div>
							<div class="activity-bars">
								<div class="activity-bar m" v="${item.m}"></div>
								<div class="activity-bar k" v="${item.k}"></div>
							</div>
						</div>
						<div class="img" 
							style="background-image:url(${img});"></div>
					</div>`
				}
				return html
					`<div class="item" title="${msg}">
						<div class="item-head">
							<div class="item-time">${item.time}</div>
							<div class="activity-bars">
								<div class="activity-bar m" v="${item.m}"></div>
								<div class="activity-bar k" v="${item.k}"></div>
							</div>
						</div>
						<div class="img" 
							style="background-image:url(${img});"></div>
					</div>`
			})
		}

		let result =[];
		map.forEach(info=>{
			console.log("info", info)
			result.push(
				html
				`<div class="time-box">
					<div class="time-head" title="${info.fullTime}">
						${info.time[0]} <br /> ${info.time[1]}
					</div>
					<div class="list">${buildItems(info.list)}</div>
				</div>`
			)
		})

		return result;
		
	}

	constructor(){
		super();
		const {config, team="default", activity="default"} = window.__args__||{};
		this.debug = localStorage.debugLog ==1;
		this.config = config;
		this.items = [];
		this.team = team;
		this.setActivity(activity);
		//window.showLogs = this.open.bind(this);
	}
	/*
	open(args){
		const {config, team="default", activity="default"} = args;
		this._initializing = true;
		this.items = [];
		this.config = config;
		this.team = team;
		this.activity = activity;
		this._initializing = false;
		this.loadData();
		this.active = true;
	}
	close(){
		this.active = false;
		this.items = [];
	}
	*/
	getConfig(){
		return this.config||{}
	}

	setTeam(team){
		if(this.team == team)
			return
		this.team = team;
		this.setActivity("default");
	}

	setActivity(activity){
		this.activity = activity;
		this.loadData();
	}

	onTeamSelect(e){
		this.setTeam(e.detail.selected);
	}
	onActivitySelect(e){
		this.setActivity(e.detail.selected);
	}
	loadData(){
		this.items = this.getLogs();
		console.log("this.items", this.items)
	}
	getLogs(){
		let file = path.join(HOME, this.team, this.activity+'-logs.json');
		if(fs.existsSync(file)){
			try{
				let content = (fs.readFileSync(file)+'').trim();
				if(content.substr(-1)==",")
					content = content.substr(0, content.length-1);
				content = `[${content}]`;
				console.log("content", content)
				return JSON.parse(content);
			}catch(e){
				return [];
			}
		}
		return []
	}
}

LogView.define("log-view");
