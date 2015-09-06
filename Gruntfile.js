/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
    // Task configuration.
    concat: {
      dist: {
        src: ['js_src/react_components.js', 'js_src/joshNS.js'],
        dest: 'static/js/<%= pkg.name %>.js'
      },
      frameworks: {
        src:  ['bower_components/jquery/dist/jquery.js', 'bower_components/leaflet/dist/leaflet-src.js',
        'bower_components/react/react.js', 'js_utils/bootstrap-tab.js', 'js_utils/md5.js', 'js_src/tile.stamen.js'],
        dest: 'static/js/frameworks.js'
      },
      reactAddons: {
        src: ['bower_components/react/react-with-addons.js'],
        dest: 'static/js/react-withaddons.js'
      },
      css:{
        //this is kind of cheating as I only need one file
        src:  ['bower_components/leaflet/dist/leaflet.css'],
        dest: 'static/css/leaflet.css'
      }
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: 'static/js/<%= pkg.name %>.js',
        dest: 'static/js/<%= pkg.name %>.min.js'
      },
      frameworks:{
        src: 'static/js/frameworks.js',
        dest: 'static/js/frameworks.min.js'
      }
    },
    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: false,
        noarg: true,
        sub: true,
        undef: true,
        unused: true,
        boss: true,
        eqnull: true,
        globals: {
          $: true,
          jQuery: true,
          window: true,
          document: true,
          md5: true,
          io: true,
          navigator: true,
          location: true,
          React: true
        }
      },
      all: ['<%= concat.dist.dest %>']
    },
    watch: {
      gruntfile: {
        files: '<%= jshint.all %>',
        tasks: ['jshint', 'uglify']
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Default task.
  grunt.registerTask('default', ['concat', 'jshint', 'uglify']);

};
