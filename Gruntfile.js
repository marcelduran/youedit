/* Copyright (c) 2013, Marcel Duran & Guilherme Neumann */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        browser: true,
        eqeqeq: true,
        curly: true,
        validthis: true,
        globalstrict: true,
        indent: 2,
        undef: true,
        unused: true,
        trailing: true,
        node: true,
        jquery: true,
        globals: {
          define: true,
          requirejs: true
        }
      },
      files: ['Gruntfile.js', 'src/**/*.js']
    },

    copy: {
      build: {
        files: [
          {
            src: [
              'app.js',
              'templates/**/*',
              'i18n/*.json'
            ],
            dest: 'build/',
            expand: true,
            cwd: 'src/server/'
          },
          {
            src: 'fonts/*.woff',
            dest: 'build/public/',
            expand: true,
            cwd: 'src/client'
          },
          {
            src: [
              'jquery/jquery.js',
              'requirejs/require.js'
            ],
            dest: 'build/public/js/',
            expand: true,
            cwd: 'components'
          },
          {
            src: 'app/**/*.js',
            dest: 'build/public/js/',
            expand: true,
            cwd: 'src/client/'
          },
          {
            src: 'flight/**/*.js',
            dest: 'build/public/js/',
            expand: true,
            cwd: 'components/'
          },
          {
            src: [
              'core.js',
              'widget.js',
              'position.js',
              'menu.js',
              'autocomplete.js',
              'mouse.js',
              'slider.js'
            ],
            dest: 'build/public/js/jqueryui',
            expand: true,
            cwd: 'components/jquery-ui/jqueryui/'
          }
        ]
      }
    },

    replace: {
      build: {
        options: {
          variables: {
            cdn: ''
          }
        },
        files: [
          {
            src: 'src/server/config/config.json',
            dest: 'build/config/',
            expand: true,
            flatten: true
          },
          {
            src: 'css/*.css',
            dest: 'build/public/',
            expand: true,
            cwd: 'src/client/app/'
          }
        ]
      }
    },

    nodemon: {
      build: {
        options: {
          file: 'build/app.js',
          watchedExtensions: ['js', 'mustache', 'css']
        }
      }
    },

    watch: {
      all: {
        files: ['Gruntfile.js', 'src/**/*.js', 'src/**/*.css', 'src/**/*.mustache'],
        tasks: ['build']
      }
    },

    concurrent: {
      build: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    requirejs: {
      build: {
        options: {
          baseUrl: './',
          name: 'src/client/app/main',
          out: 'build/public/js/app.js',
          optimize: 'none'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('build', [
    'replace:build',
    'copy:build'
    //'requirejs:build'
  ]);
  grunt.registerTask('dev', ['concurrent']);
};
