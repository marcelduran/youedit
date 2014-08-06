/* Copyright (c) 2013, Marcel Duran & Guilherme Neumann */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      options: {
        browser: true,
        curly: true,
        eqeqeq: true,
        evil: true,
        globalstrict: true,
        indent: 2,
        jquery: true,
        node: true,
        undef: true,
        unused: true,
        trailing: true,
        validthis: true,
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
            cwd: 'bower_components'
          },
          {
            src: 'app/**/*.js',
            dest: 'build/public/js/',
            expand: true,
            cwd: 'src/client/'
          },
          {
            src: 'css/**/*.css',
            dest: 'build/public/',
            expand: true,
            cwd: 'src/client/app/'
          },
          {
            src: 'flight/**/*.js',
            dest: 'build/public/js/',
            expand: true,
            cwd: 'bower_components/'
          },
          {
            src: [
              'core.js',
              'widget.js',
              'position.js',
              'menu.js',
              'autocomplete.js',
              'mouse.js',
              'slider.js',
              'sortable.js'
            ],
            dest: 'build/public/js/jqueryui',
            expand: true,
            cwd: 'bower_components/jquery-ui/jqueryui/'
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
            src: 'css/**/*.css',
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
          env: {
            NODE_ENV: 'dev',
          },
          watchedExtensions: ['js', 'mustache', 'css', 'json']
        }
      }
    },

    watch: {
      all: {
        files: ['Gruntfile.js', 'src/**/*.js', 'src/**/*.css', 'src/**/*.mustache', 'src/**/*.json'],
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
    },

    clean: {
      build: ['build/**']
    }

  });

  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('build', [
    'copy:build',
    'replace:build'
    //'requirejs:build'
  ]);
  grunt.registerTask('dev', ['concurrent']);
};
