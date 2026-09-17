const MAX_WAVE_LIFE = 3

const backgroundCanv = document.getElementById("background")
if (!backgroundCanv) throw new Error("missing #background canvas")

const ctx = backgroundCanv.getContext("2d")
if (!ctx) throw new Error("could not acquire 2D context")
backgroundCanv.height = document.body.clientHeight;
backgroundCanv.width = document.body.clientWidth;

function clearScreen(color) {
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, backgroundCanv.width, backgroundCanv.height);
}


function decimalToHex(d, padding) {
	var hex = Number(d).toString(16);
	if (padding) {
		hex = hex.padStart(padding, 0);
	}
	return hex;
}

const waveList = []

function drawCircle(x, y, r, color, opacity = 1) {
	// Change this to inject gradient instead of generating here
	// so the creator will become the responsible for the gradient
	const lightGradient = ctx.createRadialGradient(x, y, 0, x, y, r);

	for (var i = 0; i <= 10; i++) {
		const opacityByte = Math.ceil(((1 - Math.pow(i / 10, 2)) * opacity) * 255);
		lightGradient.addColorStop(i / 10, color + decimalToHex(opacityByte, 2));
	}

	ctx.beginPath();
	ctx.arc(x, y, r, 0, Math.PI * 2);
	ctx.fillStyle = lightGradient;
	ctx.fill();
}

let mousePos = {
	x: 0,
	y: 0
}

window.addEventListener("mousemove", (e) => {
	let y = e.clientY;
	let x = e.clientX;

	mousePos.x = x;
	mousePos.y = y;


	let wave = {
		x,
		y,
		r: 300,
		life: MAX_WAVE_LIFE
	}

	waveList.push(wave)
})

window.addEventListener("resize", () => {
	backgroundCanv.width = document.body.clientWidth;
	backgroundCanv.height = document.body.clientHeight;
});

let lastTime = 0;

let boxPos = {
	x: 0,
	y: 0
}

function render(now) {
	const dt = (now - lastTime) / 1000;
	if (!dt) {
		requestAnimationFrame(render);
		return;
	}
	lastTime = now;
	boxPos.x += 10 * dt;
	boxPos.y += 10 * dt;
	clearScreen("#000");
	ctx.fillStyle = "#0d0";
	ctx.fillRect(boxPos.x, boxPos.y, 10, 10);

	let x = mousePos.x
	let y = mousePos.y
	drawCircle(x, y, 300, "#dd0000");

	waveList.forEach((wave, i) => {
		let opacity = (wave.life / MAX_WAVE_LIFE);
		drawCircle(wave.x, wave.y, wave.r, "#dd0000", opacity);
		wave.r += 100 * dt;
		wave.life -= dt;
		if (wave.life <= 0) {
			waveList.splice(i, 1);
		}
	})

	requestAnimationFrame(render);
}
render();
