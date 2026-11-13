/*
 * Recent news for the front page.
 *
 * Built automatically from the newest entries on two pages, so a new
 * paper or thesis only has to be added in one place:
 *   papers.html  - rows of the publications table (newest first)
 *   thesis.html  - rows of the theses table (newest first)
 *
 * Ordering: a row may carry data-date="YYYY-MM-DD" (or "YYYY-MM") on its <tr>
 * to place it exactly. Without it, entries are dated by their year and keep
 * their place relative to the rows below them.
 */
(function () {
	'use strict';

	var PER_SOURCE = 2;   // newest entries taken from each page

	var box = document.getElementById('recent-news');
	if (!box || !window.fetch || !window.DOMParser) return;

	var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
		'August', 'September', 'October', 'November', 'December'];

	function load(url) {
		return fetch(url, { credentials: 'same-origin' }).then(function (r) {
			if (!r.ok) throw new Error(url + ': ' + r.status);
			return r.text();
		}).then(function (html) {
			return new DOMParser().parseFromString(html, 'text/html');
		});
	}

	// Copy text plus simple inline formatting (<sup>8</sup>B etc.), nothing else.
	var KEEP = { SUP: 1, SUB: 1, EM: 1, I: 1, STRONG: 1, B: 1 };
	function rich(src) {
		var out = document.createDocumentFragment();
		if (!src) return out;
		src.childNodes.forEach(function (n) {
			if (n.nodeType === 3) out.appendChild(document.createTextNode(n.nodeValue));
			else if (n.nodeType === 1) {
				if (KEEP[n.tagName]) {
					var e = document.createElement(n.tagName.toLowerCase());
					e.appendChild(rich(n));
					out.appendChild(e);
				} else out.appendChild(rich(n));
			}
		});
		return out;
	}

	function clean(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

	// data-date wins; otherwise a 4-digit year in the given text.
	function dating(el, text) {
		var d = el.getAttribute('data-date');
		var m = d && /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(d);
		if (m) {
			var label = MONTHS[+m[2] - 1] + (m[3] ? ' ' + (+m[3]) + ',' : '') + ' ' + m[1];
			return { key: d, label: label };
		}
		var y = /\b(19|20)\d{2}\b/g, last = null, k;
		while ((k = y.exec(text || ''))) last = k[0];
		return last ? { key: last + '-00', label: last } : { key: '', label: '' };
	}

	function abs(href, base) {
		try { return new URL(href, base).href; } catch (e) { return href; }
	}

	// Pages list entries newest first. An entry dated only by its year is
	// placed no lower than the dated entry below it from the same year, so a
	// new thesis added at the top without a month still comes first.
	function newest(list) {
		for (var i = list.length - 2; i >= 0; i--) {
			var k = list[i].d.key, below = list[i + 1].d.key;
			if (/-00$/.test(k) && below.slice(0, 4) === k.slice(0, 4) && below > k)
				list[i].d.key = below + '~';
		}
		return list.slice(0, PER_SOURCE);
	}

	function papers(doc) {
		var rows = doc.querySelectorAll('table tbody tr');
		var out = [];
		for (var i = 0; i < rows.length; i++) {
			var td = rows[i].querySelectorAll('td');
			if (td.length < 2 || !clean(td[0].textContent)) continue;
			var j = td[1].querySelector('a'), x = td[2] && td[2].querySelector('a');
			var journal = clean(td[1].textContent);
			out.push({
				type: 'Paper', order: i, d: dating(rows[i], journal),
				title: td[0], href: j ? abs(j.getAttribute('href'), 'papers.html') : 'papers.html',
				text: 'New SNO+ publication' + (journal ? ' in ' + journal : '') + '.',
				extra: x ? { href: x.getAttribute('href'), label: 'arXiv' } : null,
				more: { href: 'papers.html', label: 'All publications' }
			});
		}
		return newest(out);
	}

	function theses(doc) {
		var rows = doc.querySelectorAll('#thesis tbody tr');
		var out = [];
		for (var i = 0; i < rows.length; i++) {
			var td = rows[i].querySelectorAll('td');
			if (td.length < 4) continue;
			var name = clean(td[0].textContent), inst = clean(td[2].textContent);
			var pdf = td[1].querySelector('a'), title = clean(td[1].textContent);
			out.push({
				type: 'PhD thesis', order: i, d: dating(rows[i], td[3].textContent),
				titleText: 'Congratulations Dr ' + name,
				href: pdf ? pdf.getAttribute('href') : 'thesis.html#thesis',
				text: name + ' has received their PhD' + (inst ? ' from ' + inst : '') +
					' for the thesis “' + title + '”.',
				more: { href: 'thesis.html#thesis', label: 'All theses' }
			});
		}
		return newest(out);
	}

	function el(tag, cls, kids) {
		var e = document.createElement(tag);
		if (cls) e.className = cls;
		(kids || []).forEach(function (k) {
			e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
		});
		return e;
	}

	function card(n) {
		var link = el('a');
		link.href = n.href;
		link.appendChild(n.title ? rich(n.title) : document.createTextNode(n.titleText));
		var header = el('header', null, [
			el('span', 'date', [n.type + (n.d.label ? ' · ' + n.d.label : '')]),
			el('h3', null, [link])
		]);
		var art = el('article', 'news-' + n.type.toLowerCase().replace(/\W+/g, '-'), [header]);
		var p = el('p', null, [n.text]);
		if (n.extra) {
			var x = el('a', null, [n.extra.label]);
			x.href = n.extra.href;
			p.appendChild(document.createTextNode(' '));
			p.appendChild(x);
		}
		art.appendChild(p);
		var b = el('a', 'button', [n.more.label]);
		b.href = n.more.href;
		art.appendChild(el('ul', 'actions special', [el('li', null, [b])]));
		return art;
	}

	var sources = [['papers.html', papers], ['thesis.html', theses]];
	Promise.all(sources.map(function (s) {
		return load(s[0]).then(s[1]).catch(function (e) {
			if (window.console) console.warn('Recent news:', e);
			return [];
		});
	})).then(function (lists) {
		var items = [].concat.apply([], lists);
		if (!items.length) return;   // keep the static fallback
		items.sort(function (a, b) {
			if (a.d.key !== b.d.key) return a.d.key < b.d.key ? 1 : -1;
			return a.order - b.order;
		});
		box.textContent = '';
		items.forEach(function (n) { box.appendChild(card(n)); });
	});
})();
