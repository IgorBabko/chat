// Compile Bootstrap with [Ruby Sass][1] using [grunt-contrib-sass][2]
// [1]: https://github.com/sass/sass
// [2]: https://github.com/gruntjs/grunt-contrib-sass
module.exports = function configureRubySass(grunt) {
  var options = {
    loadPath: ['sass'],
    precision: 6,
    sourcemap: 'auto',
    style: 'expanded',
    trace: true,
    bundleExec: true
  };
  grunt.config.merge({
    sass: {
      core: {
        options: options,
        files: {
          'dist/css/<%= pkg.name %>.css': 'sass/<%= pkg.name %>.sass'
        }
      },
      extras: {
        options: options,
        files: {
          'dist/css/<%= pkg.name %>-flex.css': 'sass/<%= pkg.name %>-flex.sass',
          'dist/css/<%= pkg.name %>-grid.css': 'sass/<%= pkg.name %>-grid.sass',
          'dist/css/<%= pkg.name %>-reboot.css': 'sass/<%= pkg.name %>-reboot.sass'
        }
      },
      docs: {
        options: options,
        files: {
          'docs/assets/css/docs.min.css': 'docs/assets/sass/docs.sass'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-sass');
};
