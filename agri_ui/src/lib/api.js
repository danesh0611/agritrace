// Detect backend URL - use Azure when deployed, localhost for development
export const API_BASE_URL = 
	import.meta.env.MODE === 'development' 
		? 'http://localhost:5000' 
		: 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export const BASE_URL = API_BASE_URL + '/api/';

export async function getJson(path = '') {
	const res = await fetch(BASE_URL + path, {
		method: 'GET',
		headers: { 'Accept': 'application/json' },
	})
	const text = await res.text()
	try {
		return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }
	} catch (e) {
		return { ok: res.ok, status: res.status, data: text }
	}
}

export async function postJson(body, path = '') {
	const res = await fetch(BASE_URL + path, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
		},
		body: JSON.stringify(body),
	})
	const text = await res.text()
	try {
		return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }
	} catch (e) {
		return { ok: res.ok, status: res.status, data: text }
	}
}