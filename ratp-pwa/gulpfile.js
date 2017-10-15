/* eslint-env node */

'use strict';

var gulp = require('gulp');

var DEV_DIR = 'app';
var DIST_DIR = 'public';

gulp.task('create-service-worker', function(callback) {
  var swPrecache = require('sw-precache');
  var rootDir = 'app';

  swPrecache.write(`${rootDir}/service-worker.js`, {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    stripPrefix: rootDir,
    runtimeCaching: [{
	  urlPattern: /^https:\/\/api-ratp\.pierre-grimaud\.fr\/v3/,
	  handler: 'networkFirst'
	}, {
	  urlPattern: /\/schedules\//,
	  handler: 'fastest',
	  options: {
	    cache: {
	      maxEntries: 10,
	      name: 'schedules-cache'
	    }
	  }
	}]
  }, callback);
});

gulp.task('build', ['create-service-worker'], function() {
  return gulp.src(DEV_DIR + '/**')
    .pipe(gulp.dest(DIST_DIR));
});