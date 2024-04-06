// @ts-check
// URLエンコードで半角スペースがやらかす - http://uragou.hatenablog.com/entry/2018/03/16/144355
// Webフォント初心者にオススメ！Google Fontsの使い方3STEP - https://ferret-plus.com/9230

// from: http://phiary.me/javascript-url-parameter-query-string-parse-stringify/
class QueryString {
	/**
	 * @param {string} text
	 * @param {string} sep
	 * @param {string} eq
	 * @param {boolean} isDecode 
	 * @returns {{[index: string]: string}}
	 */
	static parse(text, sep, eq, isDecode) {
		text = text || location.search.substring(1);
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

	/**
	 * @param {any} value
	 * @param {string} sep
	 * @param {string} eq
	 * @param {boolean} isEncode 
	 */
	static stringify(value, sep, eq, isEncode) {
		sep = sep || '&';
		eq = eq || '=';
		var encode = (isEncode) ? encodeURIComponent : function (a) { return a; };
		return Object.keys(value).map(function (key) {
			return key + eq + encode(value[key]);
		}).join(sep);
	}
}

class NumberUtil {
	/** @param {string} str @param {number} elseValue @returns {number} */
	static parseIntOr(str, elseValue) {
		const n = Number.parseInt(str);
		return Number.isNaN(n) ?
			elseValue :
			n;
	}
}

class BooleanUtil {
	/** @param {string} text @param {boolean} defaultValue @returns {boolean} */
	static parseBooleanOr(text, defaultValue) {
		if (undefined === text) {
			return defaultValue;
		}
		return (text !== 'false') && (text !== '0');
	}
}

class Main {
	static init() {
		const args = new Args(QueryString.parse("", "", "", true));

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

	/** @returns {HTMLElement | null} */
	static getCanvas() {
		return document.getElementById('sample');
	}

	/** @param {FileList} files @returns {Promise<HTMLImageElement|null>} */
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

	/** @param {Args} args @param {FileList} files */
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

	/** @param {FileList} files */
	static async update1(files) {
		const args = new Args(QueryString.parse("", "", "", true));
		await Main.loadFromForm(args, files);
		Main.update2(args);
		window.scroll(0, 0);
	}

	/** 
	 * @param {string} text
	 * @returns {{[index: string]: any}}
	 */
	static tsvWithHeaderToDict(text) {
		const lines = text.split('\n');
		/** @type {{[index: string]: number}} */
		var header = {};
		const outRows = [];
		for (var i = 0, iCount = lines.length; i < iCount; ++i) {
			const line = lines[i];
			if (line.trim() === '') continue;
			if (line.startsWith('#')) continue;
			if (line.startsWith('!header')) {
				const inRows = line.split('\t');
				header = {};
				for (var j = 0, jCount = inRows.length; j < jCount; ++j) {
					var row = inRows[j];
					if (row.trim() === '') continue;
					header[row] = j;
				}
				continue;
			} else {
				if (null === header) {
					throw "「!header」行が無い";
				}
				const inRows = line.split('\t');
				const outRow = {};
				for (var key in header) {
					const index = header[key];
					outRow[key] = inRows[index];
				}
				outRows.push(outRow);
			}
		}
		return outRows;
	}

	/** @param {Args} args */
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
				a += '?' + QueryString.stringify(c, "", "", true);
			}


			urlElement.value = a;
		}

		const fileNames = args.text.split('\n');
		const dictList = Main.tsvWithHeaderToDict(args.text);

		const canvas = Main.getCanvas();
		if (!canvas.getContext) return;
		/** @type {CanvasRenderingContext2D} */
		const context = canvas.getContext('2d');
		const files = [];

		/** @param {number} fi */
		const func = (fi) => {
			for (; fi < dictList.length; fi++) {
				const dict = dictList[fi];
				const fileName = dict.file_name;
				const row = new Row(args, dict);
				canvas.width = row.width;
				canvas.height = row.height;
				Main.draw(context, row);
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

		func(0);
	}

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {Row} args
	 */
	static draw(context, args) {
		let text = args.label;
		if (args.with_size) {
			text += `\\n${args.width}x${args.height}`;
		}

		const lines = text.split('\\n');
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

	/**
	 * @param {CanvasRenderingContext2D} context
	 * @param {string} text
	 * @param {number} x
	 * @param {number} y
	 * @param {number} maxWidth
	 */
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
		navigator.clipboard.
			writeText(copyTarget.value).
			then(
				() => { // ok
				},
				() => { // ng
					alert(
						"クリップボードへのコピーに失敗しました。\n" +
						"target: " + copyTarget.value
					);
				}
			);
	}
}

class Args {
	/** @param {{[index: string]: string}} args */
	constructor(args) {
		const hasQuery = 0 < document.location.search.length;
		/** @type {string} */
		this.text = args.text || '' +
			'!header	file_name	label	width	height	margin	text_vertial_align	border_color\n' +
			'	weapon_0001	へぼい剣	128	128\n' +
			'	weapon_0002	ただの剣	196	196\n' +
			'	weapon_0003	すごい剣	256	256\n';
		/** @type {number} */
		this.width = NumberUtil.parseIntOr(args.width, 128);
		/** @type {number} */
		this.height = NumberUtil.parseIntOr(args.height, 128);
		/** @type {number} */
		this.margin = NumberUtil.parseIntOr(args.margin, 0);
		/** @type {string} */
		this.text_vertical_align = args.text_vertical_align || 'bottom';
		/** @type {string} */
		this.border_color = args.border_color || '#000000';
		/** @type {string} */
		this.bg_color = args.bg_color || '#ff00ff';
		/** @type {number} */
		this.font_size = NumberUtil.parseIntOr(args.font_size, 16);
		/** @type {boolean} */
		this.font_bold = hasQuery ? BooleanUtil.parseBooleanOr(args.font_bold, true) : true;
		/** @type {boolean} */
		this.font_edge = hasQuery ? BooleanUtil.parseBooleanOr(args.font_edge, true) : true;
		/** @type {string} */
		this.font_edge_color = args.font_edge_color || '#000000';
		/** @type {string} */
		this.font_color = args.font_color || '#ffffff';
		/** @type {string} */
		this.font_family = args.font_family || "'Noto Sans JP', sans-serif";
		/** @type {boolean} */
		this.with_size = hasQuery ? BooleanUtil.parseBooleanOr(args.with_size, true) : true;
		/** @type {boolean} */
		this.with_bg_image = hasQuery ? BooleanUtil.parseBooleanOr(args.with_bg_image, false) : false;
		/** @type {CanvasImageSource|null} */
		this.bg_image = null;
	}
}
class Row {
	/** @param {Args} args, @param {{[index: string]: any}} lineArgs */
	constructor(args, lineArgs) {
		/** @type {string} */
		this.file_name = lineArgs.file_name;
		/** @type {string} */
		this.label = lineArgs.label;

		/** @type {number} */
		this.width =                  NumberUtil.parseIntOr(lineArgs.width, args.width);
		/** @type {number} */
		this.height =                 NumberUtil.parseIntOr(lineArgs.height, args.height);
		/** @type {number} */
		this.margin =                 NumberUtil.parseIntOr(lineArgs.margin, args.margin);
		/** @type {string} */
		this.text_vertical_align =    args.text_vertical_align;
		/** @type {string} */
		this.border_color =           args.border_color;
		/** @type {string} */
		this.bg_color =               args.bg_color;
		/** @type {number} */
		this.font_size =              args.font_size;
		/** @type {boolean} */
		this.font_bold =              args.font_bold;
		/** @type {boolean} */
		this.font_edge =              args.font_edge;
		/** @type {string} */
		this.font_edge_color =        args.font_edge_color;
		/** @type {string} */
		this.font_color =             args.font_color;
		/** @type {string} */
		this.font_family =            args.font_family;
		/** @type {boolean} */
		this.with_size =              args.with_size;
		/** @type {boolean} */
		this.with_bg_image =          args.with_bg_image;
		/** @type {CanvasImageSource|null} */
		this.bg_image =               args.bg_image;
	}
}

