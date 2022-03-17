const gulp = require('gulp')
const {
	parallel,
	series,
	src,
	dest,
	watch
} = require('gulp')

const bs = require('browser-sync').create()

const changed = require('gulp-changed');

const sass = require('gulp-sass')(require('sass'))
const bulk = require('gulp-sass-bulk-importer')
const prefixer = require('gulp-autoprefixer')
const clean = require('gulp-clean-css')
const concat = require('gulp-concat')
const cssnano = require('gulp-cssnano');
const removeComments = require("gulp-strip-css-comments");

const uglify = require('gulp-uglify-es').default

const imagemin = require('gulp-imagemin')
const recompress = require('imagemin-jpeg-recompress')
const pngquant = require('imagemin-pngquant')

const ttf2woff2 = require('gulp-ttftowoff2');
const ttf2woff = require('gulp-ttf2woff');

const del = require('del')
const rename = require("gulp-rename")

let buildPath = {
	html: 'build/pages/',
	styles: 'build/css/',
	scripts: 'build/js/',
	images: 'build/imgs/',
	fonts: 'build/fonts/'
}

let libs = {
	css: [],
	js: []
}

function browser() {
	bs.init({
		notify: false,
		startPath: 'pages/',
		server: {
			baseDir: 'build/'
		}
	})
}

function html() {
	return src('app/pages/**/*')
		.pipe(dest(buildPath.html))
}

function minStyles(done) {
	if (libs.css.length > 0) {
		src(libs.css)
			.pipe(changed(buildPath.styles))

			.pipe(cssnano({
				zindex: false,
				discardComments: {
					removeAll: true
				}
			}))
			.pipe(concat('libs.min.css'))
			.pipe(dest(buildPath.styles))
			.pipe(bs.stream())
	}
	src(['app/scss/fonts.scss', 'app/scss/defaults.scss', 'app/blocks/**/*.scss'])
		.pipe(bulk())
		.pipe(sass({
			outputStyle: 'compressed'
		}))
		.pipe(prefixer({
			overrideBrowserslist: ['last 8 versions'],
			browsers: [
				'Android >= 4',
				'Chrome >= 20',
				'Firefox >= 24',
				'Explorer >= 11',
				'iOS >= 6',
				'Opera >= 12',
				'Safari >= 6',
			],
		}))
		.pipe(clean(clean({
			level: 2
		})))
		.pipe(concat('style.min.css'))
		.pipe(dest(buildPath.styles))
		.pipe(bs.stream())

	done()
}

function styles(done) {
	src(['app/scss/fonts.scss', 'app/scss/defaults.scss', 'app/blocks/**/*.scss'])
		.pipe(bulk())
		.pipe(sass({
			outputStyle: 'compressed'
		}))
		.pipe(prefixer({
			overrideBrowserslist: ['last 8 versions'],
			browsers: [
				'Android >= 4',
				'Chrome >= 20',
				'Firefox >= 24',
				'Explorer >= 11',
				'iOS >= 6',
				'Opera >= 12',
				'Safari >= 6',
			],
		}))
		.pipe(clean(clean({
			level: 2
		})))
		.pipe(concat('style.min.css'))
		.pipe(dest(buildPath.styles))
		.pipe(bs.stream())

	done()
}

function scripts(done) {
	if (libs.js.length > 0) {
		src(libs.js)
			.pipe(removeComments())
			.pipe(changed(buildPath.scripts))
			.pipe(uglify())
			.pipe(concat('libs.min.js'))
			.pipe(dest(buildPath.scripts))
			.pipe(bs.stream())
	}
	src('app/blocks/**/*.js')
		.pipe(removeComments())
		.pipe(concat('script.min.js'))
		.pipe(uglify())
		.pipe(dest(buildPath.scripts))
		.pipe(bs.stream())

	done()
}

function images() {
	return src('app/blocks/**/img/*')
		.pipe(changed(buildPath.images))
		.pipe(imagemin({
				interlaced: true,
				progressive: true,
				optimizationLevel: 5,
			},
			[
				recompress({
					loops: 6,
					min: 50,
					max: 90,
					quality: 'high',
					use: [pngquant({
						quality: [0.8, 1],
						strip: true,
						speed: 1
					})],
				}),
				imagemin.gifsicle(),
				imagemin.optipng(),
				imagemin.svgo()
			], ), )
		.pipe(rename({
			dirname: ""
		}))
		.pipe(dest(buildPath.images))
		.pipe(bs.stream())
}

function fonts(done) {
	src('app/fonts/**/*.ttf')
		.pipe(changed(buildPath.fonts, {
			extension: '.woff2',
			hasChanged: changed.compareLastModifiedTime
		}))
		.pipe(ttf2woff2())
		.pipe(rename({
			dirname: ""
		}))
		.pipe(dest(buildPath.fonts))
		.pipe(bs.stream())

	src('app/fonts/**/*.ttf')
		.pipe(changed(buildPath.fonts, {
			extension: 'woff',
			hasChanged: changed.compareLastModifiedTime
		}))
		.pipe(ttf2woff())
		.pipe(rename({
			dirname: ""
		}))
		.pipe(dest(buildPath.fonts))
		.pipe(bs.stream())

	done()
}

function watching() {
	watch('app/pages/**/*').on('change', function () {
		html()
		bs.reload()
	})
	watch(['app/blocks/**/*.js', 'app/libs/js/**/*.js'], scripts)
	watch(['app/blocks/**/*.scss', 'app/scss/**/*', 'app/libs/css/**/*.+(css|scss|less)'], minStyles)
	watch('app/blocks/**/img/*').on('all', images)
}

function clear(done) {
	del('build/**/*', {
		force: true
	})
	done()
}

exports.clear = clear
exports.styles = styles
exports.fonts = fonts
exports.images = images
exports.default = parallel(watching, html, minStyles, scripts, images, browser)
exports.build = series(clear, html, minStyles, scripts, images, fonts)