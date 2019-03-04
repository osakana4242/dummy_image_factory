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

	static update(args) {
		const canvas = Main.getCanvas();
		canvas.width = args.width;
		canvas.height = args.height;
		if (!canvas.getContext) return;

		const context = canvas.getContext('2d');

		const fileNames = args.text.split('\n');

		const header = args.with_header ? fileNames[0] : '';
		const files = [];


		const func = (fi) => {
			for (; fi < fileNames.length; fi++) {
				const line = fileNames[fi];
				if (line.trim() === '') continue;
				const rows = line.split('\t');
				const title = rows[0];
				const fileName = (rows.length <= 1) ? title : rows[1];

				Main.draw(context, args, header, title);
				const image = Main.toArray(canvas);
				const file = {
					name: `${fileName}.png`,
					body: image,
				};
				files.push(file);
				break;
			}

			if (fi < fileNames.length) {
				setTimeout(func, 1000 / 60, fi + 1);
				return;
			}

			Main.toZip(files);
		};

		let fi = args.with_header ? 1 : 0;
		func(fi);
	}

	static draw(context, args, header, title) {
		let text = title;
		if (header !== '') {
			text = `${header};` + text;
		}
		if (args.with_size) {
			text += `;${args.width}x${args.height}`;
		}

		const lines = text.split(';');
		const lineHeihgt = args.font_size * 1.5;
		const textHeight = lineHeihgt * lines.length;

		var rect = {
			x: args.margin,
			y: args.margin,
			width: args.width - args.margin * 2,
			height: args.height - args.margin * 2
		};

		context.fillStyle = args.bg_color;
		context.fillRect(rect.x, rect.y, rect.width, rect.height);

		context.fillStyle = args.border_color;
		context.fillRect(rect.x, rect.y, rect.width, 1);
		context.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1);
		context.fillRect(rect.x, rect.y, 1, rect.height);
		context.fillRect(rect.x + rect.width - 1, rect.y, 1, rect.height);

		context.textBaseline = 'top';
		context.font = `${args.font_size}px ${args.font_family}`;

		context.strokeStyle = args.font_edge_color;
		context.fillStyle = args.font_color;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const metrics = context.measureText(line);
			const textX = rect.x + (rect.width - metrics.width) / 2;
			const textY = rect.y + ((rect.height - textHeight) / 2) + lineHeihgt * (i + 0.25);
			Main.drawEdgeText(context, line, textX, textY);
		}
	}

	static drawEdgeText(context, text, x, y) {
		const fillStyle = context.fillStyle;
		context.fillStyle = context.strokeStyle;
		context.fillText(text, x - 1, y);
		context.fillText(text, x + 1, y);
		context.fillText(text, x, y - 1);
		context.fillText(text, x, y - 0);
		context.fillText(text, x - 1, y + 1);
		context.fillText(text, x + 1, y + 1);
		context.fillText(text, x + 1, y - 1);
		context.fillText(text, x - 1, y - 1);

		context.fillStyle = fillStyle;
		context.fillText(text, x, y);
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
			const elem = document.getElementById('download');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = 'dummy_image.zip';
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
}

class Args {
	constructor(args) {
		const hasQuery = 0 < document.location.search.length;
		this.text = args.text || 'ダミー\n' +
			'画像1\timage_001\n' +
			'画像2\timage_002\n' +
			'画像3\timage_003\n';
		this.width = parseInt(args.width || 128);
		this.height = parseInt(args.height || 128);
		this.margin = parseInt(args.margin || 1);
		this.border_color = args.border_color || '#000000';
		this.bg_color = args.bg_color || '#ff00ff';
		this.font_size = parseInt(args.font_size || 12);
		this.font_edge_color = args.font_edge_color || '#000000';
		this.font_color = args.font_color || '#ffffff';
		this.font_family = args.font_family || "'Noto Sans JP', sans-serif";
		this.with_header = hasQuery ? (args.with_header !== undefined) : true;
		this.with_size = hasQuery ? (args.with_size !== undefined) : true;
	}
}

function test() {
	const args = new Args(QueryString.parse(null, null, null, true));

	for (const key in args) {
		const value = args[key]
		const elem = document.getElementById(key);
		if (!elem) continue;
		switch (elem.type) {
			case 'checkbox':
				elem.checked = value;
				break;
			default:
				elem.value = value;
				break;
		}

	}

	Main.update(args);
}
