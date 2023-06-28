const { src, dest  }= require ("gulp");
function css(done) {
// Identificar el archivo SASS
// Compilarlo
// Almacenarla en el disco duro
done(); // Callback que avisa a gulo cuando llegamos al final}
}

const gulp = require('gulp');
const plumber = require('gulp-plumber');

// Tarea de ejemplo que utiliza gulp-plumber
gulp.task('example', function() {
  return gulp.src('source/**/*.js')
    .pipe(plumber())
    .pipe(/* Otras transformaciones o plugins de Gulp */)
    .pipe(gulp.dest('dist'));
});
