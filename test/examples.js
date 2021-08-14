/* eslint-disable comma-dangle,arrow-parens,object-curly-spacing,capitalized-comments */

'use strict';

const test = require('ava');
const del = require('del');

test.beforeEach(() => {
	const fs = require('fs');
	process.chdir(__dirname);
	fs.mkdirSync('src/images', { recursive: true });
	fs.mkdirSync('src/thumbnail', { recursive: true });
	fs.copyFileSync('80x80.png', 'src/images/test1.png');
	fs.copyFileSync('80x80.jpg', 'src/images/test2.jpg');
	fs.copyFileSync('80x80.png', 'src/thumbnail/test1.png');
	fs.copyFileSync('80x80.jpg', 'src/thumbnail/test2.png');
});

test.afterEach(() => {
	process.chdir(__dirname);
	del('src');
	del('dist');
});

function exists(file) {
	const fs = require('fs');
	return fs.existsSync(file);
}

test.serial('Basic', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// minify images into same format
		function images() {
			return src('src/images/**')
				.pipe(squoosh())
				.pipe(dest('dist/images'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/images/test1.png'));
			t.true(exists('dist/images/test2.jpg'));
			resolve();
		});
	});
});

test.serial('Convert to multiple image formats', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// minify png into png, webp and avif format
		function images() {
			return src('src/images/**/*.png')
				.pipe(
					squoosh({
						oxipng: {},
						webp: {},
						avif: {},
					})
				)
				.pipe(dest('dist/images'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/images/test1.png'));
			t.true(exists('dist/images/test1.webp'));
			t.true(exists('dist/images/test1.avif'));
			resolve();
		});
	});
});

test.serial('Resizing image', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// resize image to width 200px with keeping aspect ratio.
		function images() {
			return src('src/thumbnail/*.png')
				.pipe(
					squoosh(
						null, // use default
						{
							resize: {
								enabled: true,
								// specify either width or height
								// when you specify width and height, image resized to exact size you specified
								width: 200,
							},
						}
					)
				)
				.pipe(dest('dist/thumbnail'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/thumbnail/test1.png'));
			resolve();
		});
	});
});

test.serial('Specify encodeOptions, preprocessOptions in one object argument.', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// squoosh({encodeOptions:..., preprocessOptions:...})
		function images() {
			return src('src/images/**')
				.pipe(
					squoosh({
						encodeOptions: {
							avif: {},
							webp: {},
						},
						preprocessOptions: {
							rotate: {
								enabled: true,
								numRotations: 2,
							},
						},
					})
				)
				.pipe(dest('dist/images'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/images/test1.avif'));
			t.true(exists('dist/images/test1.webp'));
			t.false(exists('dist/images/test1.png'));
			resolve();
		});
	});
});

test.serial('Resize using original image size', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// resize image to half size of original.
		function images() {
			return src('src/thumbnail/*.png')
				.pipe(
					squoosh((src) => ({
						preprocessOptions: {
							resize: {
								enabled: true,
								width: Math.round(src.width / 2),
								height: Math.round(src.height / 2),
							},
						},
					}))
				)
				.pipe(dest('dist/thumbnail'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/thumbnail/test1.png'));
			resolve();
		});
	});
});

test.serial('Resize using original image size (with helper function)', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// resize image to fit inside of 200x200 box.
		function images() {
			return src('src/thumbnail/*.png')
				.pipe(
					squoosh((src) => ({
						preprocessOptions: {
							resize: {
								enabled: true,
								...src.contain(200),
							},
						},
					}))
				)
				.pipe(dest('dist/thumbnail'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/thumbnail/test1.png'));
			resolve();
		});
	});
});

test.serial('Quantize, Rotate image', t => {
	return new Promise((resolve, reject) => {
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		// quantize, rotate and minify png into png, webp and avif format
		function images() {
			return src('src/images/**/*.png')
				.pipe(
					squoosh(
						{
							oxipng: {
								level: 6, // slower but more compression
							},
							webp: {},
							avif: {},
						},
						{
							// quantize images
							quant: {
								enabled: true,
								numColors: 128, // default=255
							},
							// rotate images
							rotate: {
								enabled: true,
								numRotations: 1, // (numRotations * 90) degrees
							},
						}
					)
				)
				.pipe(dest('dist/images'));
		}

		series(images)((error) => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/images/test1.png'));
			resolve();
		});
	});
});

test.serial('More complex', t => {
	return new Promise((resolve, reject) => {
		const path = require('path');
		const { src, dest, series } = require('gulp');
		const squoosh = require('..');

		function images() {
			return src(['src/images/**/*.{png,jpg,webp}'])
				.pipe(
					squoosh((src) => {
						const extname = path.extname(src.path);
						let options = {
							encodeOptions: squoosh.DefaultEncodeOptions[extname],
						};

						if (extname === '.jpg') {
							options = {
								encodeOptions: {
									jxl: {},
									mozjpeg: {},
								},
							};
						}

						if (extname === '.png') {
							options = {
								encodeOptions: {
									avif: {},
								},
								preprocessOptions: {
									quant: {
										enabled: true,
										numColors: 16,
									},
								},
							};
						}

						return options;
					})
				)
				.pipe(dest('dist/images'));
		}

		series(images)(error => {
			if (error) {
				reject(error);
			}

			t.true(exists('dist/images/test1.avif'));
			t.true(exists('dist/images/test2.jpg'));
			t.true(exists('dist/images/test2.jxl'));
			resolve();
		});
	});
});

