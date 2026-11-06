document.addEventListener('DOMContentLoaded', () => {
	initMouse();
	initHistory();
	initTopButtons();
	initParallax();
	initExternalLinks();
}, false);

const initMouse = () => {
	document.body.style.setProperty('--mouse-x', `-1000px`);
	document.body.style.setProperty('--mouse-y', `-1000px`);
	if (typeof screen.orientation !== 'undefined') {
		document.addEventListener('mousemove', onMouseMove);
		document.body.addEventListener('mouseleave', onMouseLeave);
	}
};

const getPageTitleWithSection = () => {
	if (window.location.hash) {
		try {
			const id = decodeURIComponent(window.location.hash.substring(1));
			const element = document.getElementById(id);
			if (element) {
				const sectionText = element.textContent.replace('¶', '').trim();
				if (sectionText)
					return sectionText;
			}
		}
		catch (e) {}
	}
	return document.title;
};

const updateHistoryStack = () => {
	const backButton = document.querySelector('.back-button');
	const historyList = document.querySelector('.history-list');
	const navCard = document.querySelector('.nav-card');
	const clearButton = document.querySelector('.clear-button');
	if (!backButton || !historyList || !navCard) return;

	let stack = [];
	try {
		stack = JSON.parse(sessionStorage.getItem('site_history') || '[]');
	}
	catch (e) {}

	const currentUrl = window.location.pathname + window.location.hash;

	const index = stack.findIndex(p => p.url === currentUrl);
	if (index !== -1)
		stack = stack.slice(0, index + 1);
	else
		stack.push({ url: currentUrl, title: getPageTitleWithSection() });

	try {
		sessionStorage.setItem('site_history', JSON.stringify(stack));
	}
	catch (e) {}

	if (stack.length > 1) {
		navCard.classList.remove('hidden');

		const prevPage = stack[stack.length - 2];
		backButton.href = prevPage.url;
		backButton.onclick = (event) => {
			event.preventDefault();
			window.location.href = prevPage.url;
		};

		if (clearButton) {
			clearButton.onclick = (event) => {
				event.preventDefault();
				try {
					sessionStorage.removeItem('site_history');
				} catch (err) {}
				updateHistoryStack();
			};
		}
	}
	else {
		navCard.classList.add('hidden');
		backButton.removeAttribute('href');
		backButton.onclick = null;
		if (clearButton)
			clearButton.onclick = null;
	}

	const historyItems = stack.slice(0, -1);
	historyList.innerHTML = '';

	historyItems.forEach((item, i) => {
		const li = document.createElement('li');
		li.className = 'history-item hidden';

		const a = document.createElement('a');
		a.href = item.url;
		a.className = 'history-link';
		a.textContent = item.title;
		a.title = item.title;

		a.onclick = (event) => {
			event.preventDefault();
			window.location.href = item.url;
		};

		li.appendChild(a);
		historyList.appendChild(li);

		setTimeout(() => {
			li.classList.remove('hidden');
		}, i * 50);
	});
};

const initHistory = () => {
	const backButton = document.querySelector('.back-button');
	const historyList = document.querySelector('.history-list');
	
	if (!historyList) {
		if (backButton) {
			backButton.onclick = (event) => {
				if (document.referrer && document.referrer.indexOf(window.location.host) !== -1 && window.history.length > 1) {
					event.preventDefault();
					window.history.back();
				}
			};
		}
		return;
	}

	updateHistoryStack();

	window.addEventListener('hashchange', updateHistoryStack, { passive: true });
	window.addEventListener('popstate', updateHistoryStack, { passive: true });
};

const initTopButtons = () => {
	document.querySelectorAll(".top-button").forEach(button => {
		button.onclick = (event) => {
			event.preventDefault();
			document.body.scrollTop = 0;
			document.documentElement.scrollTop = 0;
		};
	});
};

const initParallax = () => {
	updateParallax();
	let scrollScheduled = false;
	window.addEventListener('scroll', () => {
		if (!scrollScheduled) {
			requestAnimationFrame(() => {
				updateParallax();
				scrollScheduled = false;
			});
			scrollScheduled = true;
		}
	}, { passive: true });
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
	document.querySelectorAll('.parallax').forEach(parallax => {
		const rectangle = parallax.getBoundingClientRect();
		const factor = 0.5;
		const scrollY = -rectangle.top * factor;
		parallax.style.setProperty('--scroll-y', `${scrollY}px`);
	});
};

const initExternalLinks = () => {
	document.querySelectorAll('article a').forEach(link => {
		const href = link.getAttribute('href');
		if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
			if (!href.startsWith(window.location.origin)) {
				link.classList.add('external-link');
			}
		}
	});
};
