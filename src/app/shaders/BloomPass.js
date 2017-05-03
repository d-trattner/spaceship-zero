/**
 * @author alteredq / http://alteredqualia.com/
 */
module.exports = function(THREE) {

    var EffectComposer = require('three-effectcomposer')(THREE);
    var ConvolutionShader = require('../shaders/ConvolutionShader.js')(THREE);

    function BloomPass ( strength, kernelSize, sigma, resolution ) {

        strength = ( strength !== undefined ) ? strength : 1;
        kernelSize = ( kernelSize !== undefined ) ? kernelSize : 25;
        sigma = ( sigma !== undefined ) ? sigma : 4.0;
        resolution = ( resolution !== undefined ) ? resolution : 256;

        // render targets

        var pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };

        this.renderTargetX = new THREE.WebGLRenderTarget( resolution, resolution, pars );
        this.renderTargetY = new THREE.WebGLRenderTarget( resolution, resolution, pars );

        // copy material

        if ( EffectComposer.CopyShader === undefined )
            console.error( "BloomPass relies on EffectComposer.CopyShader" );

        var copyShader = EffectComposer.CopyShader;

        this.copyUniforms = THREE.UniformsUtils.clone( copyShader.uniforms );

        this.copyUniforms[ "opacity" ].value = strength;

        this.materialCopy = new THREE.ShaderMaterial( {

            uniforms: this.copyUniforms,
            vertexShader: copyShader.vertexShader,
            fragmentShader: copyShader.fragmentShader,
            blending: THREE.AdditiveBlending,
            transparent: true

        } );

        // convolution material

        if ( ConvolutionShader === undefined )
            console.error( "THREE.BloomPass relies on ConvolutionShader" );

        var convolutionShader = ConvolutionShader;

        this.convolutionUniforms = THREE.UniformsUtils.clone( convolutionShader.uniforms );

        this.convolutionUniforms[ "uImageIncrement" ].value = BloomPass.blurX;
        this.convolutionUniforms[ "cKernel" ].value = ConvolutionShader.buildKernel( sigma );

        this.materialConvolution = new THREE.ShaderMaterial( {

            uniforms: this.convolutionUniforms,
            vertexShader:  convolutionShader.vertexShader,
            fragmentShader: convolutionShader.fragmentShader,
            defines: {
                "KERNEL_SIZE_FLOAT": kernelSize.toFixed( 1 ),
                "KERNEL_SIZE_INT": kernelSize.toFixed( 0 )
            }

        } );

        this.needsSwap = false;

        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
        this.scene  = new THREE.Scene();

        this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
        this.scene.add( this.quad );

    };

    BloomPass.prototype = {

        constructor: BloomPass,

        render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

            if ( maskActive ) renderer.context.disable( renderer.context.STENCIL_TEST );

            // Render quad with blured scene into texture (convolution pass 1)

            this.quad.material = this.materialConvolution;

            this.convolutionUniforms[ "tDiffuse" ].value = readBuffer.texture;
            this.convolutionUniforms[ "uImageIncrement" ].value = BloomPass.blurX;

            renderer.render( this.scene, this.camera, this.renderTargetX, true );


            // Render quad with blured scene into texture (convolution pass 2)

            this.convolutionUniforms[ "tDiffuse" ].value = this.renderTargetX.texture;
            this.convolutionUniforms[ "uImageIncrement" ].value = BloomPass.blurY;

            renderer.render( this.scene, this.camera, this.renderTargetY, true );

            // Render original scene with superimposed blur to texture

            this.quad.material = this.materialCopy;

            this.copyUniforms[ "tDiffuse" ].value = this.renderTargetY.texture;

            if ( maskActive ) renderer.context.enable( renderer.context.STENCIL_TEST );

            renderer.render( this.scene, this.camera, readBuffer, this.clear );

        }

    };

    BloomPass.blurX = new THREE.Vector2( 0.001953125, 0.0 );
    BloomPass.blurY = new THREE.Vector2( 0.0, 0.001953125 );

    return BloomPass;
}