/**
 * @author alteredq / http://alteredqualia.com/
 */

module.exports = function(THREE) {

    var FilmShader = require('../shaders/FilmShader.js')(THREE);

    function FilmPass ( noiseIntensity, scanlinesIntensity, scanlinesCount, grayscale ) {

	    var shader = FilmShader;

	    this.uniforms = THREE.UniformsUtils.clone( shader.uniforms );

        this.material = new THREE.ShaderMaterial( {

            uniforms: this.uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader

        } );

        if ( grayscale !== undefined )	this.uniforms.grayscale.value = grayscale;
        if ( noiseIntensity !== undefined ) this.uniforms.nIntensity.value = noiseIntensity;
        if ( scanlinesIntensity !== undefined ) this.uniforms.sIntensity.value = scanlinesIntensity;
        if ( scanlinesCount !== undefined ) this.uniforms.sCount.value = scanlinesCount;

        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this.scene  = new THREE.Scene();

        this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
        this.scene.add( this.quad );

    };

    FilmPass.prototype = {

	    constructor: FilmPass,

        render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

            this.uniforms[ "tDiffuse" ].value = readBuffer.texture;
            this.uniforms[ "time" ].value += delta;

            this.quad.material = this.material;

            if ( this.renderToScreen ) {

                renderer.render( this.scene, this.camera );

            } else {

                renderer.render( this.scene, this.camera, writeBuffer, this.clear );

            }

        }
    };

    return FilmPass;

}