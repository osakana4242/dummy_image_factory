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
	static init() {
		const args = new Args(QueryString.parse(null, null, null, true));

		for (const key in args) {
			const value = args[key]
			const elem = document.getElementById(key);
			if (!elem) continue;
			switch (elem.type) {
				case 'checkbox':
					elem.checked = value;
					break;
				case 'bg_image':
					break;
				default:
					elem.value = value;
					break;
			}
		}

		const withBgImageElem = document.getElementById('with_bg_image');

		const fileElem = document.getElementById('bg_image');
		fileElem.addEventListener('change', (_evt) => {
			withBgImageElem.checked = true;
			Main.update1(null);
		}, false);

		const dragareaElem = document.getElementById('bg_image_dragarea');
		dragareaElem.addEventListener('dragover', (_evt) => {
			// console.log('dragover');
			_evt.preventDefault();
			dragareaElem.classList.add('dragover');
		}, false);

		dragareaElem.addEventListener('dragleave', (_evt) => {
			// console.log('dragleave');
			_evt.preventDefault();
			dragareaElem.classList.remove('dragover');
		}, false);

		dragareaElem.addEventListener('drop', (_evt) => {
			// console.log('drop');
			_evt.preventDefault();
			dragareaElem.classList.remove('dragover');
			withBgImageElem.checked = true;
			const file = _evt.dataTransfer.files[0];
			fileElem.files = _evt.dataTransfer.files;
			Main.update1(_evt.dataTransfer.files);
		}, false);

		const updateElem = document.getElementById('update');
		updateElem.addEventListener('click', (_evt) => {
			Main.update1(null);
		}, false);

		const copyElem = document.getElementById('url-copy');
		copyElem.addEventListener('click', (_evt) => {
			Main.copyToClipboard();
		}, false);


		Main.update2(args);
	}


	static getCanvas() {
		return document.getElementById('sample');
	}


	static async loadLocalImage(files) {
		if (files.length <= 0) return null;
		const file = files[0];
		// 画像ファイル以外は処理を止める
		if (!file.type.match('image.*')) {
			alert('画像を選択してください');
			return null;
		}

		const uploadImgSrc = await new Promise((resolve, reject) => {
			// FileReaderオブジェクトを使ってファイル読み込み
			var reader = new FileReader();
			// ファイル読み込みに成功したときの処理
			reader.onload = () => resolve(reader.result);
			reader.onerror = (e) => reject(e);
			// ファイル読み込みを実行
			reader.readAsDataURL(file);
		});

		const img = await new Promise((resolve, reject) => {
			const img = new Image();
			img.src = uploadImgSrc;
			img.onload = () => resolve(img);
			img.onerror = (e) => reject(e);
		});

		return img;
	}

	static async loadFromForm(args, files) {
		for (const key in args) {
			const value = args[key]
			const elem = document.getElementById(key);
			if (!elem) continue;
			switch (elem.type) {
				case 'checkbox':
					args[key] = elem.checked ? true : false;
					break;
				case 'file':
					let result;
					if (!files) {
						files = elem.files;
					}
					result = await Main.loadLocalImage(files);
					args[key] = result;
					break;
				case 'number':
					args[key] = parseInt(elem.value);
					break;
				default:
					args[key] = elem.value;
					break;
			}
		}
		return "ok loadFromForm";
	}

	static async update1(files) {
		const args = new Args(QueryString.parse(null, null, null, true));
		await Main.loadFromForm(args, files);
		Main.update2(args);
		window.scroll(0, 0);
	}

	static update2(args) {
		{
			const urlElement = document.getElementById('custom_url');
			var a = location.href.replace('#' + location.hash, '').replace(location.search, '');
			var b = '';
			{
				var c = {};
				for (const key in args) {
					const value = args[key];
					if (key === 'bg_image') continue;
					c[key] = value;
				}
				a += '?' + QueryString.stringify(c, null, null, true);
			}


			urlElement.value = a;
		}
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
				const fileName = rows[0];
				const title = (rows.length <= 1) ? fileName : rows[1];

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

		var canvasRect = {
			x: 0,
			y: 0,
			width: args.width,
			height: args.height,
		};

		var rect = {
			x: args.margin,
			y: args.margin,
			width: args.width - args.margin * 2,
			height: args.height - args.margin * 2
		};

		context.clearRect(canvasRect.x, canvasRect.y, canvasRect.width, canvasRect.height);

		if (args.with_bg_image && args.bg_image) {
			context.drawImage(args.bg_image, rect.x, rect.y, rect.width, rect.height);
		} else {
			context.fillStyle = args.bg_color;
			context.fillRect(rect.x, rect.y, rect.width, rect.height);

			context.fillStyle = args.border_color;
			context.fillRect(rect.x, rect.y, rect.width, 1);
			context.fillRect(rect.x, rect.y + rect.height - 1, rect.width, 1);
			context.fillRect(rect.x, rect.y, 1, rect.height);
			context.fillRect(rect.x + rect.width - 1, rect.y, 1, rect.height);
		}

		const font_weight = args.font_bold ? 'bold' : 'normal';
		context.textBaseline = 'top';
		context.font = `${font_weight} ${args.font_size}px ${args.font_family}`;

		var verticalAlign = args.text_vertical_align;

		context.strokeStyle = args.font_edge_color;
		context.fillStyle = args.font_color;
		const textMaxWidth = rect.width - Math.floor(args.font_size / 2);
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const metrics = context.measureText(line);
			const textWidth = Math.min(metrics.width, textMaxWidth);
			const textX = rect.x + (rect.width - textWidth) / 2;
			const textY = ( verticalAlign == "top" ) ?
				rect.y + lineHeihgt * (i + 0.25) :
				( verticalAlign == "bottom" ) ?
					rect.y + (rect.height - textHeight) + lineHeihgt * (i + 0.25) :
					rect.y + ((rect.height - textHeight) * 0.5) + lineHeihgt * (i + 0.25);
			if (args.font_edge) {
				Main.drawEdgeText(context, line, textX, textY, textMaxWidth);
			} else {
				context.fillText(line, textX, textY, textMaxWidth);
			}
		}
	}

	static drawEdgeText(context, text, x, y, maxWidth) {
		const fillStyle = context.fillStyle;
		context.fillStyle = context.strokeStyle;
		context.fillText(text, x - 1, y, maxWidth);
		context.fillText(text, x + 1, y, maxWidth);
		context.fillText(text, x, y - 1, maxWidth);
		context.fillText(text, x, y - 0, maxWidth);
		context.fillText(text, x - 1, y + 1, maxWidth);
		context.fillText(text, x + 1, y + 1, maxWidth);
		context.fillText(text, x + 1, y - 1, maxWidth);
		context.fillText(text, x - 1, y - 1, maxWidth);

		context.fillStyle = fillStyle;
		context.fillText(text, x, y, maxWidth);
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

		const elem = document.getElementById('download');
		elem.href = window.URL.createObjectURL(blob);
		elem.download = 'dummy_image.zip';
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
	static copyToClipboard() {
		// コピー対象をJavaScript上で変数として定義する
		var copyTarget = document.getElementById("custom_url");
		// コピー対象のテキストを選択する
		copyTarget.select();
		// 選択しているテキストをクリップボードにコピーする
		document.execCommand("Copy");
		// コピーをお知らせする
		// alert("コピーできました！ : " + copyTarget.value);
	}
}

class Args {
	constructor(args) {
		const hasQuery = 0 < document.location.search.length;
		this.text = args.text || '' +
			'ダミー\n' +
			'weapon_0001\tへぼい剣\n' +
			'weapon_0002\tただの剣\n' +
			'weapon_0003\tすごい剣\n' +
			'weapon_0004\tものすごい剣\n' +
			'weapon_0005\tとんでもない剣\n';

		this.width = parseInt(args.width || 128);
		this.height = parseInt(args.height || 128);
		this.margin = parseInt(args.margin || 0);
		this.text_vertical_align = args.vertical_align || 'bottom';
		this.border_color = args.border_color || '#000000';
		this.bg_color = args.bg_color || '#ff00ff';
		this.font_size = parseInt(args.font_size || 16);
		this.font_bold = hasQuery ? parseBoolean(args.font_bold) : true;
		this.font_edge = hasQuery ? parseBoolean(args.font_edge) : true;
		this.font_edge_color = args.font_edge_color || '#000000';
		this.font_color = args.font_color || '#ffffff';
		this.font_family = args.font_family || "'Noto Sans JP', sans-serif";
		this.with_header = hasQuery ? parseBoolean(args.with_header) : true;
		this.with_size = hasQuery ? parseBoolean(args.with_size) : true;
		this.with_bg_image = hasQuery ? parseBoolean(args.with_bg_image) : false;
		this.bg_image = null;
	}

	static parseBoolean(text) {
		return (text !== undefined) && (text !== 'false') && (text !== '0');
	}
}
