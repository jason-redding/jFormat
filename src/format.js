(function($, document, window) {
	var calendar_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	var calendar_month_names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var calendar_day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	var calendar_day_names_compact = ['S', 'M', 'T', 'W', 'R', 'F', 'S'];
	String.isDateISO8601 = function(value) {
		return /((\d{4})-(\d{1,2})-(\d{1,2}))T((\d{1,2}):(\d{1,2}):((\d{1,2})(\.(\d+))?))Z?/.test(value);
	};
	String.formatISO8601Date = function(value) {
		if (String.isDateISO8601(value)) {
			return value.replace(/((\d{4})-(\d{1,2})-(\d{1,2}))T((\d{1,2}):(\d{1,2}):((\d{1,2})(\.(\d+))?))Z?/, '$3/$4/$2 $6:$7:$9');
		}
		return value;
	};
	String.dateFromISO8601 = function(value) {
		return new Date(String.formatISO8601Date(value));
	};
	String.prototype.decodeHTML = function() {
		return this.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, '\'').replace(/&quot;/g, '"');
	};
	String.prototype.removeHTML = function() {
		var inQuote = false;
		var inTag = false;
		var ch;
		var text = '';
		var s = this;
		for (var i = 0; i < s.length; i++) {
			ch = s.substring(i, i + 1);
			if (inTag && ch === '"' && s.substring(i - 1, i) !== '\\') {
				inQuote = !inQuote;
				continue;
			} else if (!inQuote && ch === '<') {
				inTag = true;
				continue;
			} else if (!inQuote && ch === '>') {
				inTag = false;
				continue;
			}
			if (inTag) {
				continue;
			}
			text += ch;
		}
		return text.replace(/(\s)+/g, '$1');
	};
	String.prototype.format = function(props) {
		return String.format(this, props);
	};
	String.prototype.linkUp = function(props) {
		return String.linkUp(this, props);
	};
	String.linkUp = function(value, props) {
		var PATTERN_URL = /\b([a-z][-a-z0-9+.]*):\/\/(?:([-a-z0-9._~%!$&'()*+,;=]+)@)?([-a-z0-9._~%]+|\[[a-f0-9:.]+\]|\[v[a-f0-9][-a-z0-9._~%!$&'()*+,;=:]+\])(?::([0-9]+))?((?:\/([-a-z0-9._~%!$&'()*+,;=:@]+))*\/?)(\?[-a-z0-9._~%!$&'()*+,;=:@\/?]*)?(\#[-a-z0-9._~%!$&'()*+,;=:@\/?]*)?\b/gi;
		var attrs = '';
		if ($.isPlainObject(props)) {
			$.each(props, function(n) {
				attrs += ' ' + n + '="' + this + '"';
			});
		}
//	var self = value;
		var r = value.replace(PATTERN_URL, function(url, protocol, user, host, port, path, file, query, fragment, off, str) {
//		console.group(url);
//		console.log('protocol:' + protocol);
//		console.log('user:' + user);
//		console.log('host:' + host);
//		console.log('port:' + port);
//		console.log('path:' + path);
//		console.log('file:' + file);
//		console.log('query:' + query);
//		console.log('fragment:' + fragment);
//		console.groupEnd();
			var r = '<a href="' + url + '"';
			r += attrs + '>' + url + '</a>';
			return r;
		});
		return r.toString();
	};
	String.format = function(format, props) {
		var out = '';
		if (!$.isPlainObject(props)) {
			props = {};
		}
		if (typeof format === 'string' && format.length > 0) {
			var startIndex = 0;
			var si;
			var c;
			var depth = 0;
			var token = '';
			var findOpen = function(ch) {
				si = format.indexOf(ch, startIndex);
				if (si >= startIndex) {
					out += format.substring(startIndex, si);
					startIndex = si + ch.length;
					doOpen();
				} else {
					if (startIndex < format.length) {
						out += format.substring(startIndex);
					}
					startIndex = format.length;
				}
			};
			var doOpen = function() {
				depth++;
			};
			var doClose = function() {
				depth--;
			};
			var next = function(peek) {
				if (startIndex < format.length) {
					var r = format.substring(startIndex, startIndex + 1);
					if (peek !== true) {
						startIndex++;
					}
					return r;
				}
				return null;
			};
			var evalToken = function(token) {
				var t = token.split('#', 2);
				var rv = null;
				var tn;
				var tf = null;
				tn = t[0];
				if (t.length > 1) {
					tf = t[1];
				}
				rv = (tn in props ? props[tn] : null);
				if (rv !== null) {
					if (typeof rv === 'object' && rv instanceof Date) {
						if (tf !== null) {
							rv = Date.format(rv, tf);
						} else {
							rv = Date.format(rv, 'M/d/yyyy');
						}
					} else if (typeof rv === 'string') {
						if (tf === null) {
							tf = 'raw';
						}
						if (tf === 'text') {
							rv = rv.removeHTML().decodeHTML();
						} else if (tf === 'raw') {
							// do nothing; return rv unchanged.
						} else if (tf === 'html') {
							rv = rv.decodeHTML();
						} else if (/^upper(case)?$/.test(tf)) {
							rv = rv.toUpperCase();
						} else if (/^lower(case)?$/.test(tf)) {
							rv = rv.toLowerCase();
						} else {
							rv = '';
						}
					}
					out += rv;
				}
			};

			while (startIndex < format.length) {
				findOpen('${');
				if (startIndex >= format.length) {
					break;
				}
				token = '';
				while ((c = next()) !== null) {
					if (c === '{') {
						doOpen();
					} else if (c === '}') {
						doClose();
						if (depth === 0) {
							evalToken(token);
							break;
						}
					}
					token += c;
				}
			}
		} else {
			out = '';
		}
		return out;
	};
	Number.prototype.getSuffix = function(includeNumber) {
		return Number.getSuffix(this, includeNumber);
	};
	Number.getSuffix = function(value, includeNumber) {
		if (typeof includeNumber !== 'boolean') {
			includeNumber = false;
		}
		var suffix;
		var sNum = ('' + value);
		var lastDigit = parseInt(sNum.substring(sNum.length - 1));
		var lastTwoDigits = (sNum.length > 1 ? parseInt(sNum.substring(sNum.length - 2)) : 0);
		if (lastTwoDigits > 10 && lastTwoDigits < 20) {
			suffix = 'th';
		} else if (lastDigit === 1) {
			suffix = 'st';
		} else if (lastDigit === 2) {
			suffix = 'nd';
		} else if (lastDigit === 3) {
			suffix = 'rd';
		} else {
			suffix = 'th';
		}
		return ((includeNumber ? value : '') + suffix);
	};
	Date.prototype.relativeToNow = function() {
		var dSelf = this;
		var date = new Date();

		var r = '';
		var sTime = parseInt(dSelf.getTime() / 1000);
		var dTime = parseInt(date.getTime() / 1000);
		var td = (sTime - dTime);
		var as = Math.abs(td);
		var am = parseInt(as / 60);
		var ah = parseInt(as / 60 / 60);
		var ad = parseInt(as / 60 / 60 / 24);
		var aM = parseInt(as / 60 / 60 / 24 / 30);
		var ay = parseInt(as / 60 / 60 / 24 / 365);

		if (ay > 0) {
			r = ay + ' year' + (ay === 1 ? '' : 's');
		} else if (aM > 0) {
			r = aM + ' month' + (aM === 1 ? '' : 's');
		} else if (ad > 0) {
			if (ad === 1) {
				return (td < 0 ? 'yesterday' : 'tomorrow');
			}
			r = ad + ' day' + (ad === 1 ? '' : 's');
		} else if (ah > 0) {
			r = ah + ' hour' + (ah === 1 ? '' : 's');
		} else if (am > 0) {
			r = am + ' minute' + (am === 1 ? '' : 's');
		} else if (as > 0) {
			r = as + ' second' + (as === 1 ? '' : 's');
		}
		r += (td < 0 ? ' ago' : ' from now');

		return r;
	};
	Date.format = function(date, format) {
		var ampm = 'AM';
		var y = date.getFullYear();
		var M = (date.getMonth() + 1);
		var d = date.getDate();
		var diw = (date.getDay() + 1);
		var H = date.getHours();
		var h = H;
		var m = date.getMinutes();
		var s = date.getSeconds();
		var S = date.getMilliseconds();
		if (H >= 12) {
			if (H > 12) {
				h = H - 12;
			}
			ampm = 'PM';
		}
		if (h === 0) {
			h = 12;
		}
		var out;
		if (String.trim('' + format).length === 0) {
			format = 'M/d/yyyy h:mm:ss aa';
		}
		var PATTERN_ALL_SYMBOLS = /('[^']*'|'[^']*$|(y|M|d|F|E|a|H|k|K|h|m|s|S)+(\{[^}]*\})?)/gm;
		var regexReplace = function(match) {
			var lastChar = match.substring(match.length - 1);
			var mm = match.substring(0, 1);
			var mods = [];
			if (match.length >= 3 && lastChar === '}') {
				var modStart = match.lastIndexOf('{');
				if (modStart > 0) {
					mods = match.substring(modStart + 1, match.length - 1).split(/[,|;]+/);
					match = match.substring(0, modStart);
				}
			}
			var rv = '';
			while (true) {
				if (mm === '\'') {
					if (lastChar === '\'') {
						if (match.length > 1) {
							if (match.length === 2) {
								rv = '\'';
							} else {
								rv = match.substring(1, match.length - 1);
							}
						} else {
							rv = '\'';
						}
					} else {
						rv = match.substring(1);
					}
				} else if (mm === 'y') {
					var sy = ('' + y);
					rv = sy.substring(Math.max(0, sy.length - match.length)).padLeft(match.length, '0');
				} else if (mm === 'M') {
					if (match.length >= 4) {
						rv = calendar_month_names[M - 1];
					} else if (match.length >= 3) {
						rv = calendar_month_names[M - 1].substring(0, 3);
					} else {
						rv = ('' + M).padLeft(match.length, '0');
					}
				} else if (mm === 'd') {
					rv = ('' + d).padLeft(match.length, '0');
				} else if (mm === 'F') {
					rv = ('' + diw).padLeft(match.length, '0');
				} else if (mm === 'E') {
					if (match.length >= 4) {
						rv = calendar_day_names[diw - 1];
					} else if (match.length >= 2) {
						rv = calendar_day_names[diw - 1].substring(0, match.length);
					} else {
						rv = calendar_day_names_compact[diw - 1];
					}
				} else if (mm === 'a') {
					rv = ampm.substring(0, Math.min(match.length, 2));
				} else if (mm === 'H') {
					rv = ('' + H).padLeft(match.length, '0');
				} else if (mm === 'k') {
					rv = ('' + (H + 1)).padLeft(match.length, '0');
				} else if (mm === 'K') {
					rv = ('' + (h - 1)).padLeft(match.length, '0');
				} else if (mm === 'h') {
					rv = ('' + h).padLeft(match.length, '0');
				} else if (mm === 'm') {
					rv = ('' + m).padLeft(match.length, '0');
				} else if (mm === 's') {
					rv = ('' + s).padLeft(match.length, '0');
				} else if (mm === 'S') {
					rv = ('' + S).padLeft(match.length, '0');
				} else {
					rv = match;
				}
				break;
			}
			//			alert("'" + match + "'.length = " + match.length + "\nreplaced with: '" + rv + "'.length = " + rv.length);
			var num = parseInt(rv);
			var isNum = !isNaN(num);
			var mod = '';
			for (var i = 0; i < mods.length; i++) {
				mod = mods[i];
				if (/^(st|nd|rd|th)$/i.test(mod) && isNum) {
					rv += Number.getSuffix(num);
				} else if (/^upper(case)?$/i.test(mod) && !isNum) {
					rv = rv.toUpperCase();
				} else if (/^lower(case)?$/i.test(mod) && !isNum) {
					rv = rv.toLowerCase();
				}
			}
			return rv;
		};
		out = ('' + format).replace(PATTERN_ALL_SYMBOLS, regexReplace, 'gm');
		return out;
	};
	Date.prototype.format = function(format) {
		return Date.format(this, format);
	};
	Date.isLeapYear = function(year) {
		return ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0);
	};
	Date.prototype.isLeapYear = function() {
		return Date.isLeapYear(this.getFullYear());
	};
	Date.prototype.getPreviousMonth = function() {
		var mi = this.getMonth();
		var yo = 0;
		if (mi == 0) {
			mi = 11;
			yo = -1;
		} else {
			mi--;
		}
		return new Date(this.getFullYear() + yo, mi, 1);
	};
	Date.prototype.getNextMonth = function() {
		var mi = this.getMonth();
		var yo = 0;
		if (mi == 11) {
			mi = 0;
			yo = 1;
		} else {
			mi++;
		}
		return new Date(this.getFullYear() + yo, mi, 1);
	};
	Date.getCompactDayName = function(day) {
		return (calendar_day_names_compact[day]);
	};
	Date.getDayName = function(day) {
		return (calendar_day_names[day]);
	};
	Date.prototype.getCompactDayName = function() {
		return Date.getCompactDayName(this.getDay());
	};
	Date.prototype.getDayName = function() {
		return Date.getDayName(this.getDay());
	};
	Date.prototype.getMonthStartingDay = function() {
		var date = new Date(this.getFullYear(), this.getMonth(), 1);
		return date.getDay();
	};
	Date.getMonthName = function(month) {
		return (calendar_month_names[month]);
	};
	Date.prototype.getMonthName = function() {
		return Date.getMonthName(this.getMonth());
	};
	Date.prototype.getMonthLength = function() {
		var mi = this.getMonth();
		var c = (calendar_days_in_month[mi]);
		if (mi == 1) { // February only!
			if (this.isLeapYear()) {
				c = 29;
			}
		}
		return c;
	};
	Date.prototype.getMonthRowCount = function() {
		var mLength = this.getMonthLength();
		var dOffset = this.getMonthStartingDay();
		return Math.ceil(((mLength + dOffset) / 7));
	};
	String.prototype.padLeft = function(size, c) {
		if (this.length >= size) {
			return this;
		}
		c = c.substring(0, 1);
		var p = '';
		for (i = this.length; i < size; i++) {
			p += c;
		}
		return (p + this);
	};
	String.prototype.padRight = function(size, c) {
		if (this.length >= size) {
			return this;
		}
		c = c.substring(0, 1);
		var p = '';
		for (i = this.length; i < size; i++) {
			p += c;
		}
		return (this + p);
	};
})(jQuery, document, window);