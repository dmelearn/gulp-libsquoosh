/* eslint-disable no-unused-vars */

'use strict';

const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const test = require('ava');
const del = require('del');
const squoosh = require('..');

test.beforeEach(t => {
	process.chdir(__dirname);
	del.sync(path.join(__dirname, 'tmp'));
});

test('basic usage', t => {
	return new Promise(resolve => {
		const file = '1x1.jpg';
		const stream = gulp.src(file)
			.pipe(squoosh())
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync('tmp/1x1.jpg'));
			t.false(fs.existsSync('tmp/1x1.webp'));
			resolve();
		});
	});
});

test('squoosh to same format', t => {
	return new Promise(resolve => {
		const file = '1x1.png';
		const stream = gulp.src(file)
			.pipe(squoosh({
				oxipng: {}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync('tmp/1x1.png'));
			resolve();
		});
	});
});

test('squoosh to webp, avif', t => {
	return new Promise(resolve => {
		const file = '1x1.png';
		const stream = gulp.src(file)
			.pipe(squoosh({
				avif: {},
				webp: {}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync('tmp/1x1.avif'));
			t.true(fs.existsSync('tmp/1x1.webp'));
			t.false(fs.existsSync('tmp/1x1.png'));
			resolve();
		});
	});
});

test('passthrough unsupported format', t => {
	return new Promise(resolve => {
		const file = '1x1.gif';
		const stream = gulp.src(file)
			.pipe(squoosh({
				avif: {},
				webp: {}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync('tmp/1x1.gif'));
			t.false(fs.existsSync('tmp/1x1.avif'));
			t.false(fs.existsSync('tmp/1x1.webp'));
			resolve();
		});
	});
});

test('quantize and rotate image', t => {
	return new Promise(resolve => {
		const base = 'cat_kotatsu_neko';
		const stream = gulp.src(`${base}.png`)
			.pipe(squoosh({
				oxipng: {
					level: 6
				},
				webp: {},
				avif: {}
			}, {
				quant: {
					enabled: true,
					numColors: 256
				},
				rotate: {
					enabled: true,
					numRotations: 1
				}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync(`tmp/${base}.png`));
			t.true(fs.existsSync(`tmp/${base}.avif`));
			t.true(fs.existsSync(`tmp/${base}.webp`));
			resolve();
		});
	});
});

test('object argument - encodeOptions only', t => {
	return new Promise(resolve => {
		const file = '1x1.png';
		const stream = gulp.src(file)
			.pipe(squoosh({
				encodeOptions: {
					webp: {}
				}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync('tmp/1x1.webp'));
			resolve();
		});
	});
});

test('object argument - preprocessOptions only', t => {
	return new Promise(resolve => {
		const base = 'cat_kotatsu_neko';
		const stream = gulp.src(`${base}.png`)
			.pipe(squoosh({
				preprocessOptions: {
					rotate: {
						enabled: true,
						numRotations: 2
					}
				}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync(`tmp/${base}.png`));
			resolve();
		});
	});
});

test('object argument - both encodeOptions,preprocessOptions', t => {
	return new Promise(resolve => {
		const base = '1x1';
		const stream = gulp.src(`${base}.png`)
			.pipe(squoosh({
				encodeOptions: {
					avif: {},
					webp: {}
				},
				preprocessOptions: {
					rotate: {
						enabled: true,
						numRotations: 2
					}
				}
			}))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync(`tmp/${base}.avif`));
			t.true(fs.existsSync(`tmp/${base}.webp`));
			resolve();
		});
	});
});

test('function argument contain', t => {
	return new Promise(resolve => {
		const base = 'cat_kotatsu_neko';
		const stream = gulp.src(`${base}.png`)
			.pipe(squoosh(src => ({
				preprocessOptions: {
					resize: {
						enabled: true,
						...src.contain(200)
					}
				}
			})))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync(`tmp/${base}.png`));
			resolve();
		});
	});
});

test('function argument cover', t => {
	return new Promise(resolve => {
		const base = 'cat_kotatsu_neko';
		const stream = gulp.src(`${base}.png`)
			.pipe(squoosh(src => ({
				preprocessOptions: {
					resize: {
						enabled: true,
						...src.cover(200)
					}
				}
			})))
			.pipe(gulp.dest('tmp'));
		stream.on('end', () => {
			t.true(fs.existsSync(`tmp/${base}.png`));
			resolve();
		});
	});
});
