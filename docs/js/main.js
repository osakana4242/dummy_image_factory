// URLエンコードで半角スペースがやらかす - http://uragou.hatenablog.com/entry/2018/03/16/144355
// Webフォント初心者にオススメ！Google Fontsの使い方3STEP - https://ferret-plus.com/9230

// from: http://phiary.me/javascript-url-parameter-query-string-parse-stringify/
class QueryString {
	static parse(text, sep, eq, isDecode) {
		text = text || location.search.substr(1);
		sep = sep || '&';
		eq = eq || '=';
		if (isDecode) {
			text = text.replace(/\+/g, ' ');
		}
		var decode = (isDecode) ? decodeURIComponent : function (a) { return a; };
		return text.split(sep).reduce(function (obj, v) {
			var pair = v.split(eq);
			obj[pair[0]] = decode(pair[1]);
			return obj;
		}, {});
	}

	static stringify(value, sep, eq, isEncode) {
		sep = sep || '&';
		eq = eq || '=';
		var encode = (isEncode) ? encodeURIComponent : function (a) { return a; };
		return Object.keys(value).map(function (key) {
			return key + eq + encode(value[key]);
		}).join(sep);
	}
}

class Main {
	static getCanvas() {
		return document.getElementById('sample');
	}

	static draw(context, args, header, fileName) {
		let text = fileName;
		if (header !== '') {
			text = `${header};` + text;
		}
		if (args.with_size) {
			text += `;${args.width}x${args.height}`;
		}

		const lines = text.split(';');
		const lineHeihgt = args.font_size * 1.5;
		const textHeight = lineHeihgt * lines.length;

		context.fillStyle = args.bg;
		context.fillRect(0, 0, args.width, args.height);

		context.fillStyle = args.fill_style;
		context.textBaseline = 'top';
		context.font = `${args.font_size}px ${args.font_family}`;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const metrics = context.measureText(line);
			const textX = (args.width - metrics.width) / 2;
			const textY = ((args.height - textHeight) / 2) + lineHeihgt * (i + 0.25);
			context.fillText(line, textX, textY);
		}
	}

	static update(args) {
		const canvas = Main.getCanvas();
		canvas.width = args.width;
		canvas.height = args.height;
		if (!canvas.getContext) return;

		const context = canvas.getContext('2d');

		const fileNames = args.text.split('\n');

		const header = args.with_header ? fileNames[0] : '';
		const files = [];
		for (let fi = args.with_header ? 1 : 0; fi < fileNames.length; fi++) {
			const fileName = fileNames[fi];
			if (fileName.trim() === '') continue;
			Main.draw(context, args, header, fileName);
			const image = Main.toArray(canvas);
			const file = {
				name: `${fileName}.png`,
				body: image,
			};
			files.push(file);
		}

		Main.toZip(files);
	}

	/** https://qiita.com/0829/items/a8c98c8f53b2e821ac94 */
	static toArray(canvas) {
		const base64 = canvas.toDataURL('image/png');
		// Base64からバイナリへ変換
		const bin = atob(base64.replace(/^.*,/, ''));
		const buffer = new Array(bin.length);
		for (let i = 0; i < bin.length; i++) {
			buffer[i] = bin.charCodeAt(i);
		}
		return buffer;
	}

	/** https://qiita.com/yun_bow/items/4eae0d521cc4237d20d1 */
	static toZip(files) {
		const zip = new Zlib.Zip();

		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			zip.addFile(file.body, { filename: Main.strToUtf8Array(file.name) });
		}

		const compressData = zip.compress();

		const blob = new Blob([compressData], { 'type': 'application/zip' });

		if (window.navigator.msSaveBlob) {
			window.navigator.msSaveBlob(blob, 'sample.zip');
			window.navigator.msSaveOrOpenBlob(blob, 'sample.zip');
		} else {
			document.getElementById('download').href = window.URL.createObjectURL(blob);
		}
	}

	static strToUtf8Array(str) {
		var n = str.length,
			idx = -1,
			bytes = [],
			i, j, c;

		for (i = 0; i < n; ++i) {
			c = str.charCodeAt(i);
			if (c <= 0x7F) {
				bytes[++idx] = c;
			} else if (c <= 0x7FF) {
				bytes[++idx] = 0xC0 | (c >>> 6);
				bytes[++idx] = 0x80 | (c & 0x3F);
			} else if (c <= 0xFFFF) {
				bytes[++idx] = 0xE0 | (c >>> 12);
				bytes[++idx] = 0x80 | ((c >>> 6) & 0x3F);
				bytes[++idx] = 0x80 | (c & 0x3F);
			} else {
				bytes[++idx] = 0xF0 | (c >>> 18);
				bytes[++idx] = 0x80 | ((c >>> 12) & 0x3F);
				bytes[++idx] = 0x80 | ((c >>> 6) & 0x3F);
				bytes[++idx] = 0x80 | (c & 0x3F);
			}
		}
		return bytes;
	}

	static getJsonObj() {
		return {
			inputText1: $('#inputText1').val(),
			inputRadio1: $('input[name=inputRadio1]:checked').val(),
			select1: $('#select1').val()
		}
	}
}

class Args {
	constructor(args) {
		const hasQuery = 0 < document.location.search.length;
		this.text = args.text || 'ダミー\n' +
			'image_001\n' +
			'image_002\n' +
			'image_003\n';
		this.bg = args.bg || '#ff00ff';
		this.width = parseInt(args.width || 128);
		this.height = parseInt(args.height || 128);
		this.font_size = parseInt(args.font_size || 12);
		this.fill_style = args.fill_style || '#ffffff';
		this.font_family = args.font_family || "'Noto Sans JP', sans-serif";
		this.with_header = hasQuery ? (args.with_header !== undefined) : true;
		this.with_size = hasQuery ? (args.with_size !== undefined) : true;
	}
}

function test() {
	const args = new Args(QueryString.parse(null, null, null, true));
	document.getElementById('text').value = args.text;
	document.getElementById('bg').value = args.bg;
	document.getElementById('width').value = args.width;
	document.getElementById('height').value = args.height;
	document.getElementById('font_size').value = args.font_size;
	document.getElementById('fill_style').value = args.fill_style;
	document.getElementById('with_header').checked = args.with_header;
	document.getElementById('with_size').checked = args.with_size;
	document.getElementById('font_family').value = args.font_family;
	Main.update(args);
}
