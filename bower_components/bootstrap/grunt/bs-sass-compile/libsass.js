// Compile Bootstrap with [libsass][1] using [grunt-sass][2]
// [1]: https://github.com/sass/libsass
// [2]: https://github.com/sindresorhus/grunt-sass
module.exports = function configureLibsass(grunt) {
  grunt.config.merge({
    sass: {
      options: {
        includePaths: ['sass'],
        precision: 6,
        sourceComments: false,
        sourceMap: true,
        outputStyle: 'expanded'
      },
      core: {
        files: {
          'dist/css/<%= pkg.name %>.css': 'sass/<%= pkg.name %>.sass'
        }
      },
      extras: {
        files: {
          'dist/css/<%= pkg.name %>-flex.css': 'sass/<%= pkg.name %>-flex.sass',
          'dist/css/<%= pkg.name %>-grid.css': 'sass/<%= pkg.name %>-grid.sass',
          'dist/css/<%= pkg.name %>-reboot.css': 'sass/<%= pkg.name %>-reboot.sass'
        }
      },
      docs: {
        files: {
          'docs/assets/css/docs.min.css': 'docs/assets/sass/docs.sass'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-sass');
};
