const glob = require( 'glob' )
  , path = require( 'path' );

var models = {};

glob.sync( './models/*.js' ).forEach( function( file ) {
    if (file !== './models/index.js') {
        let Model = file.split("/")[2].split('.')[0];
        models[Model] = require( path.resolve( file ) )[Model];
    }
});

module.exports = models;
