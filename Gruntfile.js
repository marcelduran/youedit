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
        node: true
      },
      files: ['Gruntfile.js', 'src/**/*.js']
    },

    copy: {
      build: {
        files: [
          {
            src: [
              'app.js',
              'cdn.js',
              'templates/*'
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
          }
        ]
      }
    },

    replace: {
      build: {
        options: {
          variables: {
            cdn: 'http://localhost:9000'
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
          },
        ]
      }
    },

    regarde: {
      server: {
        files: [
          'src/server/**/*.*'
        ],
        tasks: ['forever:restart']
      }
    },

    forever: {
      options: {
        index: 'src/server/app.js'
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-regarde');
  grunt.loadNpmTasks('grunt-forever');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('build', [
    'replace:build',
    'copy:build'
  ]);
  grunt.registerTask('dev', ['forever:restart', 'regarde']);
};
