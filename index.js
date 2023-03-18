const discord_ws = require('ws');
const msg = require('./src/discord_api/delete.js');
authentification = 'Token ici'
let prefix = 'Ton prefix'

// Commande = prefix + d

let session_id_value;
let iii;

let interval = 0
let aaa = null
let zz = ''

let user = []

const identify_payload = {
	op: 2,
	d: {
		token: authentification,
		intents: 131071,
		properties: {
			$os: 'linux',
			$browser: 'my_library',
			$device: 'my_library'
		}
	}
}

function discord_connect(connection_type, gateway) {

	let discord = new discord_ws(gateway + "/?v=9&encoding=json")

	discord.on('open', function open() {

		if (connection_type == 'start') {
			discord.send(JSON.stringify(identify_payload))
		} else {
			let opcode_6 = JSON.stringify({ op: 6, d: { token: authentification, session_id: session_id_value, seq: aaa } })
			discord.send(opcode_6)
		}
	})

	discord.on('message', function incoming(data) {

		let payload = JSON.parse(data)
		const { t, event, op, d } = payload;

		switch (op) {
			case 0:

				aaa = payload.s
				break;
			case 1:
				discord.send(JSON.stringify({ op: 1, d: aaa }))
				break;
			case 7:
				discord.close();
				discord_connect('resume', iii)
				break;
			case 10:
				const { heartbeat_interval } = d;
				interval = heartbeat(heartbeat_interval)
				break;
			case 11:
				break;
		}
		switch (t) {
			case 'READY':
				user.push(payload.d.user.id)
				console.log(`Connecté sur ${user}`)
				session_id_value = payload.d.session_id
				iii = payload.d.iii_url
				break;
			case 'MESSAGE_CREATE':

				let me = user[0]
				let content = payload.d.content
				let author = payload.d.author.id
				let channel = payload.d.channel_id
				if (content == `${prefix}d` && author == me) {
					message_count = 0
					msgFetch(channel)
				}
				break;
		}
	})

	const heartbeat = (ms) => {
		return setInterval(() => {
			discord.send(JSON.stringify({ op: 1, d: aaa }))
		}, ms)
	}
}

function msgFetch(channel_id) {
	fetch(`https://canary.discord.com/api/v9/channels/${channel_id}/messages?${zz}limit=100`, {
		"headers": {
			"accept": "*/*",
			"accept-language": "en-GB",
			"authorization": `${authentification}`,
			"sec-ch-ua": "\"Not?A_Brand\";v=\"8\", \"Chromium\";v=\"108\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"x-debug-options": "bugReporterEnabled",
			"x-discord-locale": "en-GB",
			"x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJjYW5hcnkiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC41NyIsIm9zX3ZlcnNpb24iOiIxMC4wLjE5MDQ1Iiwib3NfYXJjaCI6Ing2NCIsInN5c3RlbV9sb2NhbGUiOiJlbi1HQiIsImNsaWVudF9idWlsZF9udW1iZXIiOjE3ODYzNCwibmF0aXZlX2J1aWxkX251bWJlciI6MzAyNzAsImNsaWVudF9ldmVudF9zb3VyY2UiOm51bGwsImRlc2lnbl9pZCI6MH0="
		},
		"referrer": "https://canary.discord.com/channels/@me",
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": null,
		"method": "GET",
		"mode": "cors",
		"credentials": "include"
	}).then(res => Promise.all([res.status, res.json()])).then(async ([status, jsonMessages]) => {

		console.log(`Fetching \x1b[94mDiscord \x1b[97mmessages...\x1b[0m`)
		zz = ''

		for (let i = 0; i < jsonMessages.length; i++) {

			if (i == jsonMessages.length - 1) {
				zz = `before=${jsonMessages[i].id}&`
				msgFetch(channel_id)
			}

			if (jsonMessages[i].author.id == user[0] && (jsonMessages[i].type == 0 || jsonMessages[i].type == 19)) {
				while (true) {
					let value = await msg.delete(channel_id, jsonMessages[i].id)
					if (value == 'true') {
						break;
					}
				}
			}
		}
		jsonMessages.length = 0
	});
}

discord_connect('start', 'wss://gateway.discord.gg')
