const gameId=location.hash.split('#')[1]||prompt('gameId?',Math.random().toString(36).substring(7))
if(!gameId) {
	alert('geen game ID!')
	throw new Error()
}
location.hash='#'+gameId
const name=window.sessionStorage.getItem('name')||prompt('naam?')
if(!name) {
	alert('geen naam!')
	throw new Error()
}
window.sessionStorage.setItem('name',name)
document.querySelector('#color').innerHTML=['red','blue','green','yellow','white'].map(color=>`<option value="${color}">${color}</option>`).join('')
document.querySelector('#width').innerHTML=[1,2,3,4,5,10,20].map(width=>`<option value="${width}">${width}</option>`).join('')
document.querySelector('#start').onclick=()=>ws.send({gameAction:'start'})
document.querySelector('#chatInput').onkeydown=event=>{
	if(event.key!='Enter') return;
	ws.send({chat:document.querySelector('#chatInput').value})
	document.querySelector('#chatInput').value='';
}
let id=0;
const ws=new WebSocket((location.protocol=="http:"?'ws://':'wss://')+(location+'').split('/')[2]+'/?game='+gameId);
ws.oldSend=ws.send;
ws.send=message=>ws.oldSend(JSON.stringify(message))
ws.addEventListener('open', function (event) {
	ws.send({name})
	setInterval(()=>ws.send({}),45000) //keepalive for heroku: https://devcenter.heroku.com/articles/http-routing#timeouts
});
ws.addEventListener('close',event=>{
	if(event.reason) alert('verbinding verbroken:\n'+event.reason)
	else alert('verbinding verbroken, geen reason opgegeven.')
})
ws.addEventListener('message',event=>{
	console.log('Message from server ', event.data);
	data=JSON.parse(event.data)
	if(data.id) id=data.id;
	if(data.draw) draw(data.draw)
	if(data.clear) ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(data.words) ws.send({word:prompt('kies een woord:\nvoorbeelden:\n'+data.words.join('/'))})
	if(data.word) document.querySelector('#word').innerText=data.word
	if(data.timer) document.querySelector('#timer').innerText=data.timer
	if(data.chat) {
		const chatDiv=document.querySelector('#chat')
		chatDiv.innerHTML+=`<span><b>${data.chat.from}</b>: ${data.chat.message}</b></span><br>`
		chatDiv.scrollTop = chatDiv.scrollHeight;
	}
	if(data.players) {
		players=data.players;
		document.querySelector('#players').innerHTML=players.map(player=>`
			<div class="player ${player.id==id?"me":"other"} ${player.correct?"correct":"incorrect"} ${player.drawer?"drawer":"notdrawing"}">
				name: ${player.name}<br>
				score: ${player.score}<br>
			</div>
		`).join('')
	}
});

document.querySelector('#chat').style.height=document.querySelector('canvas').height-document.querySelector('#chatInput').offsetHeight	;
document.querySelector('#players').style.height=document.querySelector('canvas').height;
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
let pos = { x: 0, y: 0 };
canvas.addEventListener('mousemove', send);
canvas.addEventListener('mousedown', setPosition);
canvas.addEventListener('mouseenter', setPosition);
const rect = canvas.getBoundingClientRect(),
scaleX = canvas.width / rect.width,
scaleY = canvas.height / rect.height;
function setPosition(evt) {
	pos={
		x: (evt.clientX - rect.left) * scaleX,
		y: (evt.clientY - rect.top) * scaleY
	}
}
function send(e) {
	if (e.buttons !== 1) return;
	first=JSON.parse(JSON.stringify(pos));
	setPosition(e);
	second=pos;
	ws.send({draw:{
		first:first,
		second:second,
		color:document.querySelector('#color').value,
		width:document.querySelector('#width').value
	}})
}
function draw({first,second,color,width}) {
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.lineCap = 'round';
	ctx.strokeStyle = color;
	ctx.moveTo(first.x, first.y);
	ctx.lineTo(second.x, second.y);
	ctx.stroke();
}
