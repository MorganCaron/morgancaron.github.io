document.addEventListener('DOMContentLoaded', () => {
	initMouse();
	initTopButtons();
	initParallax();
	requestAnimationFrame(update);
}, false);

const update = () => {
	requestAnimationFrame(update);
};

const initMouse = () => {
	document.body.style.setProperty('--mouse-x', `-1000px`);
	document.body.style.setProperty('--mouse-y', `-1000px`);
	if (typeof screen.orientation !== 'undefined') {
		document.addEventListener('mousemove', onMouseMove);
		document.body.addEventListener('mouseleave', onMouseLeave);
	}
};

const initTopButtons = () => {
	document.querySelectorAll(".top-button").forEach(button => {
		button.onclick = () => {
			document.body.scrollTop = 0;
			document.documentElement.scrollTop = 0;
		}
	});
};

const initParallax = () => {
	window.addEventListener('scroll', updateParallax);
	updateParallax();
};

const onMouseMove = (event) => {
	document.body.style.setProperty('--mouse-x', `${event.pageX}`);
	document.body.style.setProperty('--mouse-y', `${event.pageY}`);
	updateMouse();
}

const onMouseLeave = () => {
	document.body.style.setProperty('--mouse-x', `${window.innerWidth / 2}`);
	document.body.style.setProperty('--mouse-y', `${window.innerHeight / 2}`);
	updateMouse();
}

const updateMouse = () => {
	const mouseOrientedElement = document.querySelector('.mouse-oriented');
	if (!mouseOrientedElement)
		return;

	const mouseX = parseInt(document.body.style.getPropertyValue('--mouse-x')) | 0;
	const mouseY = parseInt(document.body.style.getPropertyValue('--mouse-y')) | 0;

	const x = Math.min(Math.max(-1, ((mouseX / window.innerWidth) - 0.5) * 2), 1);
	const y = Math.min(Math.max(-1, ((mouseY / window.innerHeight) - 0.5) * 2), 1);

	const factor = .2;
	const angleX = (-y * factor) * 90;
	const angleY = (x * factor) * 90;

	mouseOrientedElement.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
};

const updateParallax = () => {
	const scrollX = window.scrollX || document.documentElement.scrollLeft;
	const scrollY = window.scrollY || document.documentElement.scrollTop;

	document.querySelectorAll('.parallax').forEach(parallax => {
		const rectangle = parallax.getBoundingClientRect();
		const offsetLeft = -rectangle.left;
		const offsetTop = -rectangle.top;
		const relativeScrollX = offsetLeft - scrollX + scrollX/2;
		const relativeScrollY = offsetTop  - scrollY + scrollY/2;

		parallax.style.setProperty('--scroll-x', `${relativeScrollX}px`);
		parallax.style.setProperty('--scroll-y', `${relativeScrollY}px`);
	});
};
